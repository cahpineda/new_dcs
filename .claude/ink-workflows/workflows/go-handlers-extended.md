<purpose>
Extended handlers for /ink:go that delegate to commands-internal files.

These handlers complement @go-handlers.md by providing access to all
commands-internal functionality through the unified /ink:go interface.

See @go-router.md for routing logic.
See @go-handlers.md for core inline handlers.
</purpose>

<process>

<foundation_requirement>
Foundation gate is programmatic — dispatch returns `blocked: true` if foundation is missing.
Handlers never execute without foundation. No manual check needed.
Reference: ink-tools.js FOUNDATION_REQUIRED_INTENTS (line 3231).
Exempt intents (skip foundation): status, help, pause, resume, settings, set_profile, discuss_milestone, add_todo, check_todos.
</foundation_requirement>

<step name="route_progress">
**Show detailed project progress.**

Execute `commands-internal/progress.md` inline.

Provides more detailed progress than route_status, including:
- Phase completion percentages
- Task breakdowns
- Timeline estimates
- Blocker identification
</step>

<step name="route_plan_fix">
**Plan a fix without immediate execution.**

**MANDATORY: Agent delegation required**
Route dispatch returned `workflow: "delegate"` with `agent: "ink-planner-agent"` — do NOT execute inline.

1. `node bin/ink-tools.js agent validate ink-planner-agent`
2. `node bin/ink-tools.js agent spawn-config ink-planner-agent`
3. Spawn via Task tool (do NOT include model — agent frontmatter defines it)

Execute `commands-internal/plan-fix.md` via agent delegation.

Creates a structured plan to address issues found during verification or debugging.
</step>

<step name="route_add_phase">
**Add a new phase to end of current milestone.**

Execute `commands-internal/add-phase.md` inline.

**Required:** Phase description in user input.
**Example:** `/ink:go add phase Add authentication system`
</step>

<step name="route_insert_phase">
**Insert urgent phase between existing phases.**

Execute `commands-internal/insert-phase.md` inline.

Creates decimal phases (e.g., 72.1) for urgent work that can't wait.
**Example:** `/ink:go insert phase Critical security fix`
</step>

<step name="route_remove_phase">
**Remove a future phase from roadmap.**

Execute `commands-internal/remove-phase.md` inline.

Only removes phases that haven't started. Renumbers subsequent phases.
**Example:** `/ink:go remove phase 5`
</step>

<step name="route_research_phase">
**Research how to implement a phase.**

**MANDATORY: Agent delegation required**
Route dispatch returned `workflow: "delegate"` with `agent: "ink-research-agent"` — do NOT execute inline.

1. `node bin/ink-tools.js agent validate ink-research-agent`
2. `node bin/ink-tools.js agent spawn-config ink-research-agent`
3. Spawn via Task tool (do NOT include model — agent frontmatter defines it)

Execute `commands-internal/research-phase.md` via agent delegation.

Produces RESEARCH.md with technical investigation before planning.

Next: Run `/ink:plan` to create a plan from the research.
**Example:** `/ink:go research phase 3`
</step>

<step name="route_discuss_phase">
**Gather phase context through discussion.**

Execute `commands-internal/discuss-phase.md` inline.

Uses AskUserQuestion to understand user's vision for the phase.
Creates CONTEXT.md capturing requirements and scope.

Next: Run `/ink:plan` to begin planning with this context.
**Example:** `/ink:go discuss phase 2`
</step>

<step name="route_execute_phase">
**Execute all plans in a phase.**

**MANDATORY: Agent delegation required**
Route dispatch returned `workflow: "delegate"` with `agent: "ink-executor-agent"` — do NOT execute inline.

1. `node bin/ink-tools.js agent validate ink-executor-agent`
2. `node bin/ink-tools.js agent spawn-config ink-executor-agent`
3. Spawn via Task tool (do NOT include model — agent frontmatter defines it)

Execute `commands-internal/execute-phase.md` via agent delegation.

Runs through all pending plans in the specified phase sequentially.
**Example:** `/ink:go execute phase 3`
</step>

<step name="route_list_assumptions">
**Surface assumptions about phase approach.**

Execute `commands-internal/list-phase-assumptions.md` inline.

Lists what Claude assumes about implementation before planning begins.
Helps catch misalignments early.
**Example:** `/ink:go assumptions for phase 2`
</step>

<step name="route_resume">
**Resume work from previous session.**

**Decision tree:**
1. If `.continue-here-task.md` exists: Execute `commands-internal/resume-task.md`
2. Else if `.continue-here.md` exists: Execute `commands-internal/resume-work.md`
3. Else: Fall back to route_continue (in go-router.md)

Restores full context from pause files.
</step>

<step name="route_new_milestone">
**Start a new milestone cycle.**

Execute `commands-internal/new-milestone.md` inline.

Updates PROJECT.md and routes to requirements gathering.
**Example:** `/ink:go new milestone 2.0`
</step>

<step name="route_discuss_milestone">
**Discuss milestone scope and goals.**

Execute `commands-internal/discuss-milestone.md` inline.

Collaborative discussion to define milestone objectives.
</step>

<step name="route_diagnose">
**Diagnose UAT failures with parallel debug agents.**

Execute `commands-internal/diagnose-issues.md` inline.

Spawns ink-debug-agent per failed UAT scenario with pre-filled symptoms.
Output: DIAGNOSIS.md with root causes and suggested fixes.

Next: Run `/ink:plan-fix` to create a remediation plan.
**Example:** `/ink:go diagnose 47-01` or `/ink:go diagnose all`
</step>

<step name="route_audit_milestone">
**Audit milestone quality before shipping.**

Execute `commands-internal/audit-milestone.md` inline.

Runs requirements coverage, artifact completeness, and integration wiring checks.
Produces scored audit report in `.planning/milestones/`.

**Example:** `/ink:go audit milestone`
</step>

<step name="route_complete_milestone">
**Archive completed milestone.**

Execute `commands-internal/complete-milestone.md` inline.

Archives to milestones/, creates git tag, prepares for next version.
**Example:** `/ink:go complete milestone 1.0`
</step>


<step name="route_add_todo">
**Capture an idea or task for later.**

Execute `commands-internal/add-todo.md` inline.

Creates todo file in `.planning/todos/pending/` with context from conversation.

**Example:** `/ink:go add todo implement dark mode`
</step>

<step name="route_check_todos">
**List and work on pending todos.**

Execute `commands-internal/check-todos.md` inline.

Shows pending todos grouped by priority, allows selection to start work.

**Example:** `/ink:go todos` or `/ink:go check todos`
</step>

<step name="route_plan_gaps">
**Create phases for milestone audit gaps.**

**MANDATORY: Agent delegation required**
Route dispatch returned `workflow: "delegate"` with `agent: "ink-planner-agent"` — do NOT execute inline.

1. `node bin/ink-tools.js agent validate ink-planner-agent`
2. `node bin/ink-tools.js agent spawn-config ink-planner-agent`
3. Spawn via Task tool (do NOT include model — agent frontmatter defines it)

Execute `commands-internal/plan-milestone-gaps.md` via agent delegation.

Reads milestone audit, creates remediation phases for failed requirements.

**Example:** `/ink:go plan gaps`
</step>

<step name="route_map_codebase">
**Analyze codebase with parallel agents.**

Execute `commands-internal/map-codebase.md` inline.

Spawns mapper agents to analyze: tech stack, architecture, quality concerns.
Produces `.planning/codebase/` documents.

**Example:** `/ink:go map codebase`
</step>

<step name="route_settings">
**View or modify Ink configuration.**

Execute `commands-internal/settings.md` inline.

Shows current config or updates specific settings.

**Examples:**
- `/ink:go settings` - View all settings
- `/ink:go settings mode yolo` - Change mode
- `/ink:go settings depth comprehensive` - Change planning depth
</step>

<step name="route_set_profile">
**Change model profile.**

Execute `commands-internal/set-profile.md` inline.

Switches between quality/balanced/budget model profiles.

**Example:** `/ink:go profile quality`
</step>

<step name="route_cleanup">
**Reset planning state for a new feature.**

Execute `commands-internal/cleanup.md` inline.

Deletes feature-specific files (PROJECT.md, ROADMAP.md, STATE.md, phases/) while preserving reusable knowledge (config.json, memory/, codebase/, patterns/).

**Examples:**
- `/ink:go cleanup` - Clean up after completing a feature
- `/ink:go start fresh` - Same as cleanup
- `/ink:go new feature` - Same as cleanup
</step>

<step name="route_coverage_audit">
**Audit test coverage after plan execution.**

1. `node bin/ink-tools.js agent validate ink-coverage-auditor-agent`
2. `node bin/ink-tools.js agent spawn-config ink-coverage-auditor-agent`
3. Spawn via Task tool (do NOT include model — agent frontmatter defines it)

Reads recently executed plan `files_modified` frontmatter, identifies untested code paths, writes missing tests, and verifies they pass.

**If bug found while writing tests:** agent escalates to COVERAGE-REPORT.md — never auto-fixes implementation.

**Examples:**
- `/ink:go coverage audit` - Audit last executed plan
- `/ink:go audit coverage phase 5` - Audit specific phase
</step>

</process>
