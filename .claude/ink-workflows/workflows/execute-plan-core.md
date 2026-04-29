<purpose>
Core execution flow for plan execution. See @execute-plan.md for deviation rules, commit rules, and execution strategies.
See @references/anti-patterns.md for common mistakes to avoid.
See @references/verification-checklist.md for quality gate requirements.
See @references/ui-brand.md for output formatting (task progress, checkpoint boxes).
</purpose>

<execution_order>
1. load_project_state - Read STATE.md
2. identify_plan - Find next PLAN.md
3. read_feature_config - Load config.json
4. record_start_time - Track start
5. pre_flight_check - Validate dependencies
6. parse_segments - Determine pattern (A/B/C)
7. init_agent_tracking - Setup tracking
8. segment_execution - Execute with subagents
9. load_prompt - Read PLAN.md
10. execute - For each task: implement → verify → quality_gate → auto_update_memory → track files (NO commit)
11. self_check - Validate no new stubs introduced
12. record_completion_time - Calculate duration
13. create_summary - Generate SUMMARY.md
14. wiring_check - Scan new files for imports (see @execute-plan-wiring.md)
15. update_current_position - Update STATE.md
16. extract_decisions_and_issues - Extract to STATE.md
17. update_session_continuity - Update session
18. update_roadmap - Update phase status
19. suggest_commit - Present suggested commits to user (DO NOT auto-commit)
20. offer_next - Present next actions (+ auto-verify, see @execute-plan-wiring.md)
</execution_order>

<process>

<step name="load_project_state" priority="first">
`node bin/ink-tools.js state snapshot` returns full state as JSON (current_phase, status, session, progress, next_actions, blockers).
If missing: Error - project not initialized.
Also run `node bin/ink-tools.js context budget` to get available context tokens. Log: "Context budget: {effective_tokens} tokens ({effective_percent}% of {budget_tokens})".
</step>

<step name="identify_plan">
`node bin/ink-tools.js phase next-plan <N>` returns next unexecuted plan (next_plan path, plan_number, total_plans, all_complete flag).
</step>

<step name="read_feature_config">
`node bin/ink-tools.js config dump` returns full config as JSON. `node bin/ink-tools.js config get <key>` for specific values. Defaults if missing: all features enabled.
</step>

<step name="record_start_time">
`node bin/ink-tools.js timestamp` returns `{ iso, date, epoch }` — use iso for start time, epoch for duration calculation.
</step>

<step name="pre_flight_check">
Validate plan references exist (files, dependencies, functions).
If issues found in interactive mode: ask proceed/stop/re-plan.
YOLO mode: proceed despite warnings.
</step>

<step name="parse_segments">
Check for checkpoints: `grep -n "type=\"checkpoint" PLAN.md`

**Pattern A (no checkpoints):** Spawn single subagent for entire plan.
**Pattern B (verify-only checkpoints):** Segment execution, subagent per segment.
**Pattern C (decision checkpoints):** Execute in main context.

Subagent prompt includes: MEMORY_CONTEXT, DEVIATION_RULES, COMMIT_PROTOCOL.
See @execute-plan.md for deviation rules and commit rules.
</step>

<step name="init_agent_tracking">
Validate executor agent: `node bin/ink-tools.js agent validate ink-executor-agent` → confirm file exists, frontmatter valid.
Get spawn config: `node bin/ink-tools.js agent spawn-config ink-executor-agent` → confirm foreground=true (MCP deps).
**Tool discovery:** Run `node bin/ink-tools.js mcp available-tools` to get runtime tool inventory. Pass tool summary to subagent prompt as available MCP capabilities. This replaces static tool assumptions with runtime detection.
**Discovery:** P2C FIRST (`query_repository_summary`, `trace_call_path`) for codebase overview and dependency tracing → Serena (`find_symbol`, `get_symbols_overview`) for precise symbol navigation → Grep/Glob/Read (last resort only if MCP unavailable).

Create tracking files if needed:
- `.planning/agent-history.json` - spawn/completion records
- `.planning/current-agent-id.txt` - current subagent ID

Check for interrupted agents and offer resume.
</step>

<step name="segment_execution">
For Pattern B only. Execute segments between checkpoints:
1. Spawn subagent for autonomous segment
2. Wait for completion
3. Execute checkpoint in main context
4. Repeat for all segments
5. Aggregate results for SUMMARY
</step>

<step name="load_prompt">
Read PLAN.md using the Read tool: `.planning/phases/XX-name/{phase}-{plan}-PLAN.md`
Check for TDD type: `grep "^type:" PLAN.md` - if "tdd", use RED-GREEN-REFACTOR.
**Checkpoint resume:** Check for `.continue-here.md` in phase directory. If found: parse checkpoint, skip completed tasks, resume from `task_index`. Report: "Resuming from Task N (M completed previously)." See @references/checkpoint-protocol.md.
</step>

<step name="execute">
For each task:

**type="auto":**
1. Implement task (check POC/TDD requirements)
2. Handle deviations (see @execute-plan.md)
3. Run verification — if fails: execute UAT diagnosis loop (see @references/uat-loop.md)
4. Run quality_gate — if fails: execute UAT diagnosis loop (see @references/uat-loop.md)
5. **Execute auto_update_memory** (update chapters with modified files)
6. **Track modified files** for this task (DO NOT commit — user commits when ready)
7. Update checkpoint: save progress to `.continue-here.md` (see @references/checkpoint-protocol.md). Delete on plan completion.

**type="checkpoint:*" (use checkpoint box format from @references/ui-brand.md):**
- STOP, display checkpoint box (╔══ CHECKPOINT: {Type} ══╗), wait for user
- human-verify / decision / human-action

After checkpoint response: verify if possible, continue to next task.
</step>

<step name="auto_update_memory">
**Execute after each task verification, BEFORE commit decision.**

Skip silently if `.planning/memory/` does not exist. Never block on memory errors.

**Primary:**
```bash
node bin/ink-tools.js memory update-from-diff HEAD
```
→ Returns JSON: `{ chapters_updated, chapters_created, citations_added, index_synced }`
→ Handles: git diff, file filtering, domain mapping, chapter updates, INDEX sync — all deterministic.

If SUMMARY.md was just created, also extract patterns:
```bash
node bin/ink-tools.js extract patterns {SUMMARY_PATH}
```
→ Returns patterns with file verification. Feed into relevant chapters:
```bash
node bin/ink-tools.js memory update-chapter {CHAPTER} --add-pattern "{name}" "{description}" "{file}"
```

Report inline: `Memory: Updated {chapters_updated} ({citations_added} citations)`
</step>

<step name="quality_gate">
Check config.json `quality_gate` settings (lint/types/tests). Each: `"skip"` | `"ask"` (default) | `"run"`. Run language-appropriate checks (Node: lint/tsc/test, Python: ruff/mypy/pytest, Go: vet/test, Rust: clippy/test). On fail: execute UAT diagnosis loop (@references/uat-loop.md) — max 3 retries before escalating. If `block_on_fail=true` and loop exhausted → stop. If `block_on_fail=false` → warn. If `quality_gate.enabled=false` → skip all.
</step>

<step name="self_check">
Before creating SUMMARY.md, validate work quality:
1. Run `node bin/ink-tools.js verify stubs "<modified-files-glob>"` on files changed by this plan
2. If stubs_found > 0: review each — fix genuine stubs before proceeding, ignore self-referential matches (e.g., regex definitions)
3. Verify test count matches (if tests were run): reported count should match actual
4. Append self-check results to SUMMARY.md Retrospective section
</step>

<step name="record_completion_time">
```bash
PLAN_END_EPOCH=$(date +%s)
DURATION_MIN=$(( (PLAN_END_EPOCH - PLAN_START_EPOCH) / 60 ))
```
Log context awareness: "Plan execution used approximately N% of context budget" (estimate based on files loaded vs budget).
</step>

<step name="create_summary">
Create `{phase}-{plan}-SUMMARY.md` using @templates/summary.md.
**Skeleton generation:** `node bin/ink-tools.js template fill summary --vars '{"PHASE":"XX-name","PLAN":"NN","X":"XX","N":"NN"}' --out {summary_path}`
Then fill in: frontmatter, performance, accomplishments, commits, deviations, retrospective, next steps.
One-liner must be substantive (e.g., "JWT auth with refresh rotation" not "Auth complete").

**Retrospective (REQUIRED):** After documenting what was done, reflect on how it went:
- **Diagnosis accuracy:** Were plan assumptions correct? Did the problem match expectations?
- **What surprised us:** Wrong assumptions, unexpected complexity, things easier/harder than planned
- **Time sinks:** Wasted effort, unnecessary investigation, things to skip next time
- **Reusable patterns:** Patterns worth saving to memory chapters or `.planning/patterns/`

If nothing noteworthy: "Plan executed as expected. No significant learnings beyond what's documented in Decisions."

**Agent handoff:** After creating SUMMARY.md, write `.planning/agent-handoff.json` for the verifier:
```json
{
  "phase": "<phase-number>",
  "plan": "<plan-number>",
  "decisions": ["<decision 1>", "<decision 2>"],
  "files_changed": ["path/to/file1.ts", "path/to/file2.ts"],
  "deviations": ["<deviation description if any>"],
  "warnings": ["<any warnings for verifier>"],
  "timestamp": "<ISO timestamp>"
}
```
Populate from execution tracking: decisions from STATE.md adds, files from per-task tracking, deviations from deviation handling. Write using standard file write. This file is ephemeral — the verifier will delete it after reading.
</step>

<step name="wiring_check">
See @execute-plan-wiring.md. If `features.autoWiringCheck` enabled: get new files via git diff, filter exceptions, grep imports, append "## Wiring Status" to SUMMARY.md. Report: `Wiring: N files checked, M unwired`
</step>

<step name="update_current_position">
`node bin/ink-tools.js state advance-plan <phase> <plan>` increments plan position, then `node bin/ink-tools.js state update-progress` recalculates progress bar.
</step>

<step name="extract_decisions_and_issues">
`node bin/ink-tools.js state add-decision "<text>"` for each decision. `node bin/ink-tools.js state add-blocker "<text>"` for blockers.
</step>

<step name="update_session_continuity">
`node bin/ink-tools.js state record-session --stopped-at "<plan> complete"` updates all session fields atomically (last_session, stopped_at, resume_file, next_actions).
</step>

<step name="update_roadmap">
`node bin/ink-tools.js phase count <N>` to check remaining plans. If last plan: `node bin/ink-tools.js phase complete <N>` marks phase done atomically (✅, status, checkboxes).
</step>

<step name="suggest_commit">
**DO NOT commit automatically.** Present suggested commits to the user:

```
## Ready to Commit

Files modified during execution:
- [list per-task file changes]

Suggested commits:
1. `{type}({phase}-{plan}): {task description}` — [files]
2. `docs({phase}-{plan}): complete [plan-name] plan` — SUMMARY.md, STATE.md, ROADMAP.md

The user will commit when ready.
```
</step>

<step name="offer_next">
**Verify remaining work first:**
1. Count plans vs summaries in current phase
2. If more plans: present next plan command
3. If phase complete:
   a. If `features.autoVerify == true`: spawn auto-verify (see @execute-plan-wiring.md#auto_verify)
   b. If verification issues found: suggest `/ink:go fix` alongside next actions
   c. Check milestone status
4. If more phases: present plan-phase command
5. If milestone complete: present complete-milestone command

**Always append:** `💡 Run /clear before your next /ink:go to free context.`
</step>

</process>

<success_criteria>
- All tasks from PLAN.md completed
- All verifications pass
- SUMMARY.md created with substantive content
- STATE.md updated (position, decisions, issues, session)
- ROADMAP.md updated
</success_criteria>
