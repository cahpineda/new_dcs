<purpose>
Orchestrator for plan execution workflow. This file coordinates specialized modules for execution, deviations, TDD, commits, and examples.

This workflow has been modularized to reduce context consumption from ~50% to ~15% when loaded.
</purpose>

<required_reading>
Read STATE.md before any operation to load project context.
</required_reading>

<module_structure>
This workflow is divided into specialized modules for lazy loading:

**Validation (MANDATORY):**
- **ink-plan-checker-agent** - Spawned BEFORE execution (sonnet model)
- Located at: @.claude/agents/ink-plan-checker-agent.md
- Handles: 7-dimension validation including schema verification
- Blocks execution on failures, prevents hallucinated field names

**Execution Agent (v2.0):**
- **ink-executor-agent** - Spawned for plan execution (sonnet model)
- Located at: @.claude/agents/ink-executor-agent.md
- Handles: task execution, deviation rules, commits, summary generation
- Config: `features.executorAgent` in config.json (default: true)

**Core Modules (v1.x inline fallback):**
- **execute-plan-core.md** - Main execution flow and orchestration
- **execute-plan-deviations.md** - Deviation handling rules
- **execute-plan-tdd.md** - TDD execution flow (for `type: tdd` plans)
- **execute-plan-commits.md** - Atomic commit protocol

**Reference Modules:**
- **references/execute-plan-examples.md** - POC scaling, authentication gates, examples

</module_structure>

<execution_flow>
The execution flow follows these steps:

1. **MANDATORY: Run Plan Checker before execution:**
   ```
   Task(
     prompt="<plans_to_validate>
   {plan_path}
   </plans_to_validate>

   <requirements_source>
   @.planning/ROADMAP.md - Phase {phase_number} description
   </requirements_source>

   <project_context>
   @.planning/PROJECT.md
   @.planning/config.json
   </project_context>

   <schema_context>
   @.planning/codebase/MODELS.md (if exists)
   @.planning/memory/chapters/CAP-DB.md (if exists)
   </schema_context>

   Validate the plan and return PLAN_CHECK_COMPLETE signal.",
     subagent_type="ink-plan-checker-agent",
     description="Validate {phase}-{plan}"
   )
   ```

   **Handle validation result:**
   - On `PLAN_CHECK_COMPLETE status: pass`: Continue to executor
   - On `PLAN_CHECK_COMPLETE status: warn`: Show warnings, ask user to proceed or fix
   - On `PLAN_CHECK_COMPLETE status: fail`: STOP execution, display blockers, require fixes

   **Skip checker only with explicit flag:** `--skip-checker` (for urgent hotfixes)

2. **Check executor agent config:**
   **Primary:** `node bin/ink-tools.js config get features.executorAgent` — defaults to true
   **Primary:** `node bin/ink-tools.js config get features.worktreeExecution` — defaults to true

3. **If executor agent enabled (default), spawn agent:**

   **First, load memory context for the prompt:**
   ```bash
   node bin/ink-tools.js memory get-chapter GOLDEN-RULES
   node bin/ink-tools.js memory track-access GOLDEN-RULES
   node bin/ink-tools.js memory match-domains {files_from_plan_frontmatter}
   ```
   For each matched chapter:
   ```bash
   node bin/ink-tools.js memory verify-citations {CHAPTER}
   ```
   → If percent_valid < 50: skip (stale). Otherwise:
   ```bash
   node bin/ink-tools.js memory get-chapter {CHAPTER}
   node bin/ink-tools.js memory track-access {CHAPTER}
   ```
   Log: `Memory: Loaded {chapters}. Skipped {stale} (stale)`

   **If worktreeExecution enabled:** Read `.planning/` now (gitignored in worktrees): `STATE_CONTENT=$(node bin/ink-tools.js state snapshot --format raw)`

   ```
   Task(
     prompt="<plan_context>
   Plan file: {plan_path}
   Phase: {phase_number}
   </plan_context>

   <project_context>
   @.planning/PROJECT.md
   {STATE_CONTENT if USE_WORKTREE else "@.planning/STATE.md"}
   </project_context>

   <memory_context>
   {contents of INDEX.md, CAP-GOLDEN-RULES.md, and domain-matched chapters}
   Respect architectural decisions documented in memory chapters.
   </memory_context>

   <mcp_context>
   @.claude/ink-workflows/workflows/detect-mcp-tools.md
   Check MCP availability FIRST. Report MCP_CAPABILITIES before executing.
   If fallback_mode: use Grep/Read to verify all code references.
   Include mcp_report in EXECUTION_COMPLETE signal.
   </mcp_context>

   {<worktree_mode>true</worktree_mode> if USE_WORKTREE}

   Execute the plan and return EXECUTION_COMPLETE signal.",
     subagent_type=("ink-tdd-agent" if plan_frontmatter.type == "tdd" else "ink-executor-agent"),
     description="Execute {phase}-{plan}",
     isolation="worktree" if USE_WORKTREE else None
   )
   ```

   **Post-execution worktree merge (USE_WORKTREE=true):** `git merge --no-ff {result.worktree_branch}`, then copy `summaries/{phase}-{plan}-SUMMARY.md` → `.planning/phases/{PHASE_DIR}/`.

   **Handle completion:**
   - On `EXECUTION_COMPLETE status: complete`: Update STATE.md, continue workflow
   - On `EXECUTION_COMPLETE status: partial`: Report what completed, resume later
   - On `EXECUTION_COMPLETE status: blocked`: Display blocker, pause for user

4. **Inline fallback (when Task unavailable or agent fails):**
   - Log "Executor agent unavailable, executing inline"
   - Load core execution logic: @execute-plan-core.md
   - Execute using v1.x inline flow

5. **During inline execution:**
   - **If POC required:** See @references/execute-plan-examples.md#poc-to-production
   - **If TDD plan:** See @execute-plan-tdd.md for RED-GREEN-REFACTOR cycle
   - **If authentication error:** See @references/execute-plan-examples.md#authentication-gates
   - **If deviation discovered:** See @execute-plan-deviations.md for handling rules
   - **After task verification:** See @execute-plan-core.md#auto_update_memory - **MANDATORY** memory update
   - **After task completion:** See @execute-plan-commits.md for commit protocol

6. **Complete execution:**
   - Create SUMMARY.md
   - Run wiring check (see @execute-plan-wiring.md, if autoWiringCheck enabled)
   - **Mandatory coverage audit:** Spawn `ink-coverage-auditor-agent` with the plan path and `files_modified` from frontmatter. Escalates bugs — never auto-fixes. Skip ONLY if `config.features.coverageAudit` is explicitly set to false (default: true). If audit reports failures, BLOCK SUMMARY creation and report issues to user before proceeding.
   - Update STATE.md
   - Update ROADMAP.md
   - Commit metadata

All detailed logic is in the specialized modules referenced above.
</execution_flow>

<module_references>

**Primary Module:**
- @execute-plan-core.md - Contains all main execution steps and flow

**Conditional Modules (loaded as needed):**
- @execute-plan-deviations.md - Deviation handling (auto during execution)
- @execute-plan-wiring.md - Post-plan wiring scan (when autoWiringCheck enabled)
- @execute-plan-tdd.md - TDD cycle (when plan `type: tdd`)
- @execute-plan-commits.md - Commit protocol (after each task)
- @references/execute-plan-examples.md - POC scaling, auth gates, deviation/commit/summary examples
- ink-coverage-auditor-agent - **Mandatory** post-plan test coverage audit (default: on; skip with `features.coverageAudit: false`)

</module_references>

<usage>
Load orchestrator → core module auto-loads → specialized modules load conditionally. Total: ~40% context (vs 50% before monolithic split).
</usage>

<best_practices>
**Deviations:** See @execute-plan-deviations.md. Priority: 1.NEVER skip tests 2.Document blockers 3.Create new tasks for scope expansion 4.Update plan for simplification 5.Document missing dependencies.

**Tools:** Parallel calls for independent ops. IF specific file → Grep; ELSE IF exploration → agent; ELSE → Read/Write.

**Quality:** Concise, no meta-commentary, show don't tell. See @references/prompt-engineering-best-practices.md.
</best_practices>

<success_criteria>

- All tasks from PLAN.md completed
- All verifications pass
- SUMMARY.md created with substantive content
- STATE.md updated (position, decisions, issues, session)
- ROADMAP.md updated
- If codebase map exists: map updated with execution changes (or skipped if no significant changes)
  </success_criteria>
