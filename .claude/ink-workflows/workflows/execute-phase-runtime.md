<purpose>
Runtime execution module for execute-phase workflow.

Handles agent spawning, monitoring, and summary creation.

See @execute-phase.md for wave calculation and dependency analysis.
See @references/ui-brand.md for output formatting (banners, spawning indicators, progress).
</purpose>

<process>

<step name="spawn_agents">
**State tracking:**
```
RUNNING = {}    # task_id -> {plan_id, spawned_at, attempt}
QUEUED = []     # plan_ids waiting for execution slot
COMPLETED = {}  # plan_id -> {success: bool, commits: [], summary: path}
FAILED = {}     # plan_id -> error message
BLOCKED = []    # plan_ids blocked by failed dependencies
FOREGROUND = [] # plans with checkpoints (run sequentially)
RETRY_QUEUE = [] # {plan_id, attempt, retry_after} — timed retry entries
AGENT_FAILURES = {}  # agent_type -> {spawned: N, failed: N} — for circuit breaker
CIRCUIT_OPEN = set() # agent types whose circuit is open (>50% failure rate)
```

**Load config from .planning/config.json:**
**Primary:** `node bin/ink-tools.js config get maxConcurrentAgents` — defaults to 3
**Primary:** `node bin/ink-tools.js config get features.waveExecution` — defaults to true
**Primary:** `node bin/ink-tools.js config get features.worktreeExecution` — defaults to true

If wave execution disabled, force sequential (MAX_CONCURRENT=1).

**Pre-spawn context loading (worktree isolation requires inlined .planning/ content):**
```bash
# .planning/ is gitignored — worktrees won't have it. Read now, inject into every prompt.
STATE_CONTENT=$(node bin/ink-tools.js state snapshot --format raw)
CONFIG_CONTENT=$(node bin/ink-tools.js config dump)
```
Store STATE_CONTENT and CONFIG_CONTENT — passed to `build_executor_prompt()` for all plans.

**Pre-spawn validation:** `node bin/ink-tools.js agent validate ink-executor-agent` → confirm file exists, frontmatter valid.
`node bin/ink-tools.js agent spawn-config ink-executor-agent` → confirm foreground=true (MCP deps: Serena, P2C).

**Display wave banner (see @references/ui-brand.md):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Ink ► EXECUTING WAVE {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Wave {N}/{total}: {plan_count} plans
```

**Spawn Wave 1 plans as tasks (display `◆ Spawning ink-executor-agent...` per plan):**

⚠️ **LIMITATION:** Subagents may fail silently without returning results. If tasks timeout after 10 minutes:
1. Detect timeout and mark task as failed
2. Cascade failure to dependents
3. Log to ISSUES.md with recommendation to execute inline

```
For each plan in WAVE_1:
  if plan.has_checkpoint:
    FOREGROUND.append(plan)
    continue

  if len(RUNNING) >= MAX_CONCURRENT:
    QUEUED.append(plan.id)
    continue

  if check_circuit_breaker("ink-executor-agent"):
    QUEUED.append(plan.id)
    log(f"Circuit breaker open — queuing {plan.id}")
    continue

  if "ink-executor-agent" not in AGENT_FAILURES:
    AGENT_FAILURES["ink-executor-agent"] = {"spawned": 0, "failed": 0}
  AGENT_FAILURES["ink-executor-agent"]["spawned"] += 1

  task_id = Task(
    prompt=build_executor_prompt(plan),
    subagent_type="ink-executor-agent",
    description="Execute {plan.phase}-{plan.number}",
    isolation="worktree" if USE_WORKTREE else None
  )
  RUNNING[task_id] = {
    plan_id: plan.id,
    spawned_at: now_timestamp(),  // For timeout detection
    attempt: 1,
    worktree_branch: None  // filled from result when USE_WORKTREE
  }
```

**Executor prompt template:**

Before building prompt, load memory:
```bash
node bin/ink-tools.js memory get-chapter GOLDEN-RULES
node bin/ink-tools.js memory track-access GOLDEN-RULES
node bin/ink-tools.js memory match-domains {files_from_plan_frontmatter}
```
For each matched chapter:
```bash
node bin/ink-tools.js memory verify-citations {CHAPTER}
```
→ If percent_valid < 50: skip (stale), warn: `Memory: Skipped {CHAPTER} (stale — N/M invalid)`
→ If 1-50% invalid: load with warning. Otherwise load normally:
```bash
node bin/ink-tools.js memory get-chapter {CHAPTER}
node bin/ink-tools.js memory track-access {CHAPTER}
```

```
<execution_context>
Plan file: {plan.path}
Phase: {plan.phase}

Plan content:
{plan_content}

Project state:
{STATE_CONTENT}

Config:
{CONFIG_CONTENT}
</execution_context>

<memory_context>
{contents of INDEX.md, CAP-GOLDEN-RULES.md, and domain-matched chapters}
Respect architectural decisions documented in memory chapters.
</memory_context>

{if USE_WORKTREE: "<worktree_mode>true</worktree_mode>"}
```

Note: `@.planning/` references are replaced with inlined content because `.planning/` is gitignored and will not exist in isolated worktrees.
</step>

<step name="monitor_completion">
**Main monitoring loop:**
```
while RUNNING or QUEUED or FOREGROUND:
  # Check running background agents
  for task_id in list(RUNNING.keys()):
    result = TaskOutput(task_id=task_id, block=false)

    if result is None:
      # Timeout detection: 10-minute threshold
      elapsed = now_timestamp() - RUNNING[task_id]["spawned_at"]
      if elapsed > 600:  # 600 seconds = 10 minutes
        plan_id = RUNNING[task_id]["plan_id"]
        attempt  = RUNNING[task_id]["attempt"]
        RUNNING.pop(task_id)

        if attempt < 3:
          backoff = [60, 120, 240][attempt - 1]  # 1min, 2min, 4min
          RETRY_QUEUE.append({
            plan_id: plan_id,
            attempt: attempt + 1,
            retry_after: now_timestamp() + backoff
          })
          log(f"Timeout: {plan_id} (attempt {attempt}/3) — retry in {backoff}s")
        else:
          FAILED[plan_id] = "Timeout after 3 attempts (exceeded 10min each)"
          mark_dependents_blocked(plan_id)
          log_to_issues(plan_id, "Agent timed out after 3 attempts — execute inline with /ink:execute-plan")
      continue

    entry = RUNNING.pop(task_id)
    plan_id = entry["plan_id"]

    if result.status == "complete":
      COMPLETED[plan_id] = {
        success: true,
        commits: result.commits,
        summary: result.summary_file,
        worktree_branch: result.worktree_branch if USE_WORKTREE else None
      }
      spawn_ready_dependents(plan_id)

    elif result.status == "failed":
      FAILED[plan_id] = result.error
      mark_dependents_blocked(plan_id)
      if "ink-executor-agent" not in AGENT_FAILURES:
        AGENT_FAILURES["ink-executor-agent"] = {"spawned": 0, "failed": 0}
      AGENT_FAILURES["ink-executor-agent"]["failed"] += 1

  # Spawn from queue if slots available
  try_spawn_queued()

  # Drain retry queue — spawn entries whose retry_after has elapsed
  try_retry_queue()

  # Handle foreground plans sequentially
  if not RUNNING and FOREGROUND:
    fg_plan = FOREGROUND.pop(0)
    result = Task(
      prompt=build_executor_prompt(fg_plan),
      subagent_type="ink-executor-agent",
      description="Execute {fg_plan.phase}-{fg_plan.number}",
      isolation="worktree" if USE_WORKTREE else None
    )  # Blocking
    # Process result...

  if RUNNING or QUEUED:
    sleep(10)  # Poll interval
```

**try_retry_queue:**
```
def try_retry_queue():
  now = now_timestamp()
  for entry in list(RETRY_QUEUE):
    if entry["retry_after"] > now:
      continue  # Not yet time to retry
    if len(RUNNING) >= MAX_CONCURRENT:
      break  # No execution slots available
    if check_circuit_breaker("ink-executor-agent"):
      log(f"Circuit breaker open — skipping retry for {entry['plan_id']}")
      continue  # Leave in RETRY_QUEUE; re-evaluate on next poll
    RETRY_QUEUE.remove(entry)
    plan = get_plan_by_id(entry["plan_id"])
    if "ink-executor-agent" not in AGENT_FAILURES:
      AGENT_FAILURES["ink-executor-agent"] = {"spawned": 0, "failed": 0}
    AGENT_FAILURES["ink-executor-agent"]["spawned"] += 1
    task_id = Task(
      prompt=build_executor_prompt(plan),
      subagent_type="ink-executor-agent",
      description="Execute {plan.phase}-{plan.number} (retry {entry['attempt']}/3)",
      isolation="worktree" if USE_WORKTREE else None
    )
    RUNNING[task_id] = {
      plan_id: entry["plan_id"],
      spawned_at: now_timestamp(),
      attempt: entry["attempt"],
      worktree_branch: None
    }
    log(f"Retry spawn: {entry['plan_id']} attempt {entry['attempt']}/3")
```

**check_circuit_breaker:**
```
def check_circuit_breaker(agent_type):
  """Returns True if circuit is open (spawning blocked)."""
  if agent_type in CIRCUIT_OPEN:
    return True
  if agent_type not in AGENT_FAILURES:
    return False  # No data yet
  stats = AGENT_FAILURES[agent_type]
  if stats["spawned"] < 4:
    return False  # Need >=4 samples before evaluating
  failure_rate = stats["failed"] / stats["spawned"]
  if failure_rate > 0.5:
    CIRCUIT_OPEN.add(agent_type)
    log(f"Circuit breaker OPEN for {agent_type}: {stats['failed']}/{stats['spawned']} failed (>{50}%)")
    return True
  return False
```

**log_to_issues:**
```
def log_to_issues(plan_id, message):
  """Log to .planning/ISSUES.md — creates file if missing."""
  issues_path = ".planning/ISSUES.md"
  if not file_exists(issues_path):
    write_file(issues_path, "# Issues\n\nAuto-generated by execute-phase-runtime.\n\n")
  append_to_file(issues_path, f"- Plan {plan_id}: {message}\n")
```

**spawn_ready_dependents:**
```
def spawn_ready_dependents(completed_plan_id):
  for plan in ALL_PLANS:
    if plan.id in COMPLETED or plan.id in FAILED or plan.id in BLOCKED:
      continue

    if completed_plan_id not in plan.depends_on:
      continue

    plan.satisfied.add(completed_plan_id)

    if plan.satisfied == set(plan.depends_on):
      if plan.has_checkpoint:
        FOREGROUND.append(plan)
      elif len(RUNNING) < MAX_CONCURRENT and not check_circuit_breaker("ink-executor-agent"):
        if "ink-executor-agent" not in AGENT_FAILURES:
          AGENT_FAILURES["ink-executor-agent"] = {"spawned": 0, "failed": 0}
        AGENT_FAILURES["ink-executor-agent"]["spawned"] += 1
        task_id = Task(
          prompt=build_executor_prompt(plan),
          subagent_type="ink-executor-agent",
          description="Execute {plan.phase}-{plan.number}",
          isolation="worktree" if USE_WORKTREE else None
        )
        RUNNING[task_id] = {
          plan_id: plan.id,
          spawned_at: now_timestamp(),
          attempt: 1,
          worktree_branch: None
        }
      else:
        QUEUED.append(plan.id)
```

**mark_dependents_blocked:**
```
def mark_dependents_blocked(failed_plan_id):
  for plan in ALL_PLANS:
    if failed_plan_id in plan.depends_on:
      BLOCKED.append(plan.id)
      QUEUED.remove(plan.id) if plan.id in QUEUED
      mark_dependents_blocked(plan.id)  # Cascade
```
</step>

<step name="merge_worktrees">
**Only runs when USE_WORKTREE=true.**

After all agents complete, merge their isolated branches back into the main branch and recover `.planning/` artifacts.

```
MERGE_CONFLICTS = []

for plan_id, data in COMPLETED.items():
  branch = data.get("worktree_branch")
  if not branch:
    continue

  # Merge the worktree branch
  result = git("merge", "--no-ff", branch, "-m", f"chore: merge worktree for {plan_id}")
  if result.conflict:
    MERGE_CONFLICTS.append({plan_id: plan_id, branch: branch})
    git("merge", "--abort")
    continue

  # Copy SUMMARY from tracked path to .planning/
  summary_src = f"summaries/{plan_id}-SUMMARY.md"
  summary_dst = f".planning/phases/{PHASE_DIR}/{plan_id}-SUMMARY.md"
  if file_exists(summary_src):
    copy_file(summary_src, summary_dst)
    log(f"Merged {plan_id}: branch {branch}, summary copied")
  else:
    log(f"WARN: No summary at {summary_src} for {plan_id}")
```

**If merge conflicts:**
```
Stop and present to user:
"⚠ Merge conflict in worktree branch for plan {plan_id}.
Branch: {branch}
Resolve manually:
  git merge {branch}
  # resolve conflicts
  git merge --continue"
```

**Note:** `summaries/` directory is tracked by git. Executor writes SUMMARY.md there in worktree mode; orchestrator moves it to `.planning/phases/` after merge.
</step>

<step name="create_summary">
**1. Aggregate from all completed plans:**
```
ALL_COMMITS = []
ALL_DECISIONS = []
ALL_DEVIATIONS = { auto_fixed: 0, logged: 0 }
TOTAL_SEQUENTIAL_DURATION = 0

for plan_id in COMPLETED:
  summary_path = "{PHASE_DIR}/{plan_id}-SUMMARY.md"
  # Parse duration, decisions, commits, deviations
```

**2. Calculate parallelism metrics:**
```
ACTUAL_DURATION = WALL_CLOCK_END - WALL_CLOCK_START
SEQUENTIAL_TIME = TOTAL_SEQUENTIAL_DURATION
TIME_SAVED_PERCENT = ((SEQUENTIAL_TIME - ACTUAL_DURATION) / SEQUENTIAL_TIME) * 100
```

**3. Report wave execution results:**
```markdown
## Phase {X}: {Name} Complete

**Execution Mode:** Parallel (wave-based)
**Plans:** {total_plans} total ({wave_count} waves)
**Time:** {actual_duration}min (saved ~{time_saved_percent}% vs sequential)

### Wave Summary
| Wave | Plans | Status |
|------|-------|--------|
| 1 | 14-01, 14-02 | Complete |
| 2 | 14-03 | Complete |
```

**4. Update STATE.md and ROADMAP.md:**
- Add decisions to Accumulated Decisions
- Mark phase complete in ROADMAP.md
</step>

<step name="offer_next">
**Auto-verify (if enabled):**

Check `features.autoVerify` from config.json. If true:

Validate verifier before spawn: `node bin/ink-tools.js agent spawn-config ink-verifier-agent` → confirm foreground=true.

```
PHASE_DIR=$(ls -d .planning/phases/${PHASE_NUMBER}-* 2>/dev/null | head -1)

Task(
  prompt="<verification_request>
Phase: ${PHASE_NUMBER}
Phase Directory: ${PHASE_DIR}
Context: Auto-verification after phase completion. Verify implementation against phase goals.
</verification_request>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@${PHASE_DIR}/
</context>",
  subagent_type="ink-verifier-agent",
  description="Auto-verify: Phase ${PHASE_NUMBER}"
)
```

If verification issues found, present alongside next actions:
```
Auto-verification found issues. Score: [score]. Report: [path].

Suggested actions:
- /ink:go fix - Address verification issues
- [next phase/milestone action] - Continue despite issues
```

**If more phases:**
```
Next: Phase {X+1}: {Name}
/ink:plan-phase {X+1}
```

**If milestone complete (display milestone banner per @references/ui-brand.md):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Ink ► MILESTONE COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/ink:complete-milestone
```
</step>

</process>

<error_handling>
| Error | Action |
|-------|--------|
| Agent failure | Log, continue others, mark dependents blocked |
| Merge conflict | Stop, present to user |
| Config missing | Use defaults |

**Recovery:** Run `/ink:execute-plan` on failed plans individually.
</error_handling>
