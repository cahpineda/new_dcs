<purpose>
Create executable PLAN.md for a phase. PLAN.md IS the prompt that Claude executes.
</purpose>

<required_reading>
**Read these files NOW:**
1. @references/plan-format.md - PLAN.md structure and task types
2. @references/scope-estimation.md - Plan sizing guidance
3. @references/checkpoints.md - Checkpoint patterns
4. @templates/phase-prompt.md - PLAN.md template
5. .planning/ROADMAP.md - Phase definitions
6. .planning/PROJECT.md - Project context
7. @references/plan-phase-examples.md - Concrete plan examples
8. @references/poc-patterns.md - POC evaluation patterns
9. @references/complexity-criteria.md - Complexity scoring guide

**Load domain expertise:** Parse ROADMAP.md `## Domain Expertise` for SKILL.md paths. Load only references relevant to THIS phase type.
</required_reading>

<execution_order>
1. load_project_state - Read STATE.md for current position
2. identify_phase - Determine which phase to plan
3. mandatory_discovery - Decide discovery level (0-3)
4. gather_context - Load history, codebase docs, research
5. break_into_tasks - Create executable tasks
6. estimate_scope - Split if >3 tasks
7. write_plan - Generate PLAN.md using template
8. git_commit - Commit plan files
</execution_order>

<discovery_levels>
| Level | When | Action |
|-------|------|--------|
| 0 - Skip | Pure internal, existing patterns | Proceed directly |
| 1 - Quick | Single known library | Context7 query, no DISCOVERY.md |
| 2 - Standard | 2-3 options, new integration | Route to discovery-phase.md |
| 3 - Deep | Architectural, novel problem | Full discovery-phase.md |

**Indicators:** New library not in package.json = Level 2+. "architecture/design/system" = Level 3.
If roadmap has `Research: Likely`, Level 0 unavailable.
</discovery_levels>

<process>

<step name="load_project_state" priority="first">
`node bin/ink-tools.js state snapshot` returns full state as JSON (current_phase, status, decisions, blockers). `node bin/ink-tools.js config dump` for config including parallelization settings.
</step>

<step name="identify_phase">
`node bin/ink-tools.js init plan-phase <N>` returns roadmap section, prior summaries, existing plans, context status, and has_context flag.
`node bin/ink-tools.js roadmap get-phase <N>` for structured phase data (heading, goal, plans list).
If multiple phases available, ask which one. If obvious (first incomplete), proceed.
Read any existing PLAN.md or DISCOVERY.md in phase directory.
</step>

<step name="mandatory_discovery">
Apply discovery_levels table above. For niche domains (3D, games, audio, ML), suggest `/ink:research-phase` before planning.
</step>

<step name="gather_context">
**From prior phases:** Read frontmatter of *-SUMMARY.md files for decisions, patterns, key files. Only read full SUMMARY for directly relevant phases.

**From STATE.md:** Extract decisions (constraints), deferred issues (candidates for tasks).

**From ISSUES.md:** Check for issues relevant to this phase.

**MCP tool discovery:** Run `node bin/ink-tools.js mcp available-tools` to check which MCP servers are active. Use this to inform plan task design — if Serena is available, prefer symbol-level edit tasks; if only Grep/Read, design tasks with explicit file paths.

**From codebase docs:** If `.planning/codebase/` exists, load based on phase type:
- UI/frontend: CONVENTIONS.md, STRUCTURE.md
- API/backend: ARCHITECTURE.md, CONVENTIONS.md
- Database: ARCHITECTURE.md, STACK.md
- Testing: TESTING.md, CONVENTIONS.md
- Default: STACK.md, ARCHITECTURE.md

**From CONTEXT.md (locked decisions):** Check if `{phase_dir}/*-CONTEXT.md` exists using Glob.

If CONTEXT.md exists:
- Read CONTEXT.md frontmatter: `node bin/ink-tools.js frontmatter get {context_path}`
- Load the `<locked_decisions>` section — these are CONSTRAINTS, not suggestions
- Each locked decision must be respected in task breakdown: do not propose alternatives
- Load the `<deferred>` section — these are areas where the planner HAS latitude
- Log: `Context loaded: {decision_count} locked decisions, {deferred_count} deferred items`

If CONTEXT.md does NOT exist:
- Check config: `node bin/ink-tools.js config get features.discussPhase`
- If `features.discussPhase.enabled` is true (or not set): suggest running discuss first:
  ```
  Note: No CONTEXT.md found for this phase. Consider running:
    /ink:discuss {phase_number}
  to capture implementation decisions before planning.
  Proceeding without discuss context.
  ```
- If `features.discussPhase.enabled` is false: proceed silently (user has opted out)
</step>

<step name="break_into_tasks">
Decompose phase into tasks. Each task needs: type, name, files, action, verify, done.

**Task types:**
- `type="auto"` - Claude executes (default, use for everything with CLI/API)
- `type="checkpoint:human-verify"` - User verifies visual/UX
- `type="checkpoint:decision"` - User chooses between options
- `type="checkpoint:human-action"` - RARE: truly unavoidable manual step

**TDD default for implementation plans:** When `features.mandatory_tests` is enabled in config (`node bin/ink-tools.js config get features.mandatory_tests`), ALL implementation plans default to `type: tdd` unless explicitly overridden.

**Override allowed for:**
- Pure documentation plans (only .md files modified, no code logic)
- Configuration-only plans (only config/env files, no business logic)
- Pure refactoring plans with no behavior change (rename, restructure, move)

**TDD detection heuristic (for override decisions):** Can you write `expect(fn(input)).toBe(output)` before `fn`? If yes, the plan MUST remain `type: tdd` — override is not allowed.

**When mandatory_tests is disabled:** Original behavior — planner chooses type freely based on TDD heuristic.

See @references/plan-format.md for task structure and @references/tdd.md for TDD plans.
</step>

<step name="estimate_scope">
**Always split if:** >3 tasks, multiple subsystems, >5 files in any task.

| Depth | Plans/Phase | Tasks/Plan |
|-------|-------------|------------|
| Quick | 1-3 | 2-3 |
| Standard | 3-5 | 2-3 |
| Comprehensive | 5-10 | 2-3 |

See @references/scope-estimation.md for complete guidance.
</step>

<step name="write_plan">
Use @templates/phase-prompt.md for structure.

**Skeleton generation:** `node bin/ink-tools.js template fill phase-prompt --vars '{"PHASE":"XX-name","PLAN":"NN"}' --out .planning/phases/XX-name/XX-NN-PLAN.md`
Then fill in objective, tasks, and verification sections.

**Location:** `.planning/phases/XX-name/{phase}-{plan}-PLAN.md`

**Frontmatter:** phase, plan, type, depends_on, files_modified, complexity

**Sections:** objective, execution_context, context, tasks, verification, success_criteria, output

**Parallelization:** Set `depends_on: []` for independent plans. `/ink:execute-phase` auto-detects parallel opportunities.

See @references/plan-format.md for complete PLAN.md structure.
</step>

<step name="agent_orchestration">
**When to use planner agent vs inline planning:**

| Condition | Approach |
|-----------|----------|
| Complex phases (>3 requirements) | Spawn ink-planner-agent |
| Research exists (RESEARCH.md) | Spawn ink-planner-agent (fresh context for synthesis) |
| Simple phases (1-2 obvious tasks) | Inline planning acceptable |

**Spawning the planner:**

Validate before spawn: `node bin/ink-tools.js agent validate ink-planner-agent` → confirm file exists, frontmatter valid.
Get spawn config: `node bin/ink-tools.js agent spawn-config ink-planner-agent` → confirm model=opus, foreground=true.

Before spawning, load memory:
1. Read `.planning/memory/INDEX.md` and `CAP-GOLDEN-RULES.md` if they exist. Read chapters relevant to the phase's domain (match phase goal keywords using lookup table in @go-handler-new.md Step 2).
2. **Citation verification** (for each chapter before loading):
   - Extract `key_files[].path` entries from frontmatter
   - If >50% invalid: skip chapter, warn: `Memory: Skipped CAP-X (stale)`
   - If 1-50% invalid: load with warning: `Memory: CAP-X loaded (N/M valid)`
   - If chapter has `status: superseded|deprecated` or no `key_files`: skip
3. **Access tracking** (after each chapter load): update `last_accessed: {today}` and increment `access_count` in frontmatter.

```
Task(
  prompt="<phase_context>
    Phase: {phase_name}
    Goal: {phase_goal from ROADMAP}
    Requirements: {requirements list}
    Research: {path to RESEARCH.md if exists}
    Project: @.planning/PROJECT.md
  </phase_context>

  <memory_context>
  {contents of INDEX.md, CAP-GOLDEN-RULES.md, and domain-matched chapters}
  Use memory to inform task breakdown: respect existing patterns, key files, and constraints.
  </memory_context>

  <discuss_context>
  {contents of CONTEXT.md locked_decisions section, if exists — omit this block if no CONTEXT.md}
  LOCKED DECISIONS: These are confirmed by the user during discuss-phase. Treat as constraints.
  DEFERRED ITEMS: These are explicitly left for you to decide based on technical analysis.
  </discuss_context>",
  subagent_type="ink-planner-agent",
  description="Plan phase {N}"
)
```

Wait for `PLANNING_COMPLETE` signal with plan_count and wave_count.

**Spawning the checker (if features.planChecker enabled in config.json):**
```
Task(
  prompt="<plans_to_validate>
    {list of PLAN.md paths from planner output}
  </plans_to_validate>

  <requirements_source>
    {requirements list}
  </requirements_source>

  <project_context>
    @.planning/config.json
  </project_context>",
  subagent_type="ink-plan-checker-agent",
  description="Validate plans for phase {N}"
)
```

Wait for `PLAN_CHECK_COMPLETE` signal.

**On checker failure:**
- If status: fail, re-spawn planner with issues as revision context
- Max 2 revision cycles before human escalation
- Bypass with `--skip-checker` flag for urgent work
</step>

<step name="verify_plan_structure">
**Verify all PLAN.md files in the phase have complete structure before allowing phase completion.**

For each PLAN.md file in the phase directory, run verification:

```bash
for plan in .planning/phases/{phase-slug}/*-PLAN.md; do
  echo "Verifying: $plan"
  node bin/ink-tools.js verify frontmatter "$plan"
done
```

**Expected output:** All plans show `valid: true` with no missing_fields or missing_xml_tags.

**If any plan fails validation:**
- Output the list of missing fields/tags
- Block phase completion with error: "One or more PLAN.md files have incomplete structure. Remediate using: node bin/ink-tools.js verify frontmatter {path}"
- Do NOT proceed to git_commit step

**If all plans pass:**
- Continue to git_commit step
- Output: "✓ All {N} PLAN.md files passed structure validation"
</step>

<step name="git_commit">
**Ask user before committing:**

```
## Ready to Commit Phase Plan

**Files to commit:**
- .planning/phases/XX-name/*-PLAN.md

**Proposed commit message:**
`docs(${PHASE}): create phase plan`

**Options:**
1. **Commit now** - Proceed with commit
2. **Skip commit** - Continue without committing
3. **Modify message** - Change commit message first

Would you like to commit these changes?
```

**If user confirms commit:**
```bash
git add .planning/phases/XX-name/*-PLAN.md
git commit -m "docs(${PHASE}): create phase plan"
```
</step>

</process>

<success_criteria>
- [ ] STATE.md read, decisions absorbed
- [ ] Discovery level determined and executed
- [ ] PLAN.md file(s) created with XML structure
- [ ] Each plan: 2-3 tasks, objective, context, verification
- [ ] Each task: type, files, action, verify, done
- [ ] PLAN.md committed to git
</success_criteria>
