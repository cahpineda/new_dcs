---
name: ink:execute-phase
description: Execute all plans in a phase with intelligent parallelization
argument-hint: "<phase-number>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - TaskOutput
  - AskUserQuestion
  - SlashCommand
---

<objective>
Execute all unexecuted plans in a phase with parallel agent spawning.

Analyzes plan dependencies to identify independent plans that can run concurrently.
Spawns background agents for parallel execution, each agent implements tasks and tracks modified files.

**Critical constraint:** One subagent per plan, always. This is for context isolation, not parallelization. Even strictly sequential plans spawn separate subagents so each starts with fresh 200k context at 0%.

**Platform Support:**
- **Claude Code:** Uses Task tool to spawn background subagents
- **Cursor IDE:** Leverages Cursor's Agent Skills and native subagent system for parallel execution
- **Antigravity:** Uses parallel tool calls (e.g., `browser_subagent`, `run_command` in parallel) or subagents to execute multiple plans concurrently

Use this command when:
- Phase has 2+ unexecuted plans
- Want "walk away, come back to completed work" execution
- Plans have clear dependency boundaries
</objective>

<execution_context>
@.claude/ink-workflows/workflows/execute-plan.md
@.claude/ink-workflows/workflows/execute-phase.md
@.claude/ink-workflows/templates/summary.md
@.claude/ink-workflows/references/checkpoints.md
@.claude/ink-workflows/references/tdd.md
</execution_context>

<context>
Phase number: $ARGUMENTS (required)

@.planning/STATE.md
@.planning/config.json
</context>

<process>
**Optimization:** Run `node bin/ink-tools.js init execute $PHASE_NUMBER` to get all startup context in one call:
phase_dir, plans inventory with frontmatter, wave analysis, config, and state position.
This replaces steps 1-3 below with a single deterministic JSON response.
If ink-tools.js not available, fall back to the manual steps below.

1. Validate phase exists in roadmap
2. Find all PLAN.md files without matching SUMMARY.md
3. If 0 or 1 plans: suggest /ink:execute-plan instead
4. If 2+ plans: follow execute-phase.md workflow
5. Monitor parallel agents until completion
6. Present results and next steps
</process>

<execution_strategies>
**Strategy A: Fully Autonomous** (no checkpoints)

- Spawn subagent to execute entire plan
- Subagent creates SUMMARY.md and reports modified files
- Main context: orchestration only (~5% usage)

**Strategy B: Segmented** (has verify-only checkpoints)

- Execute in segments between checkpoints
- Subagent for autonomous segments
- Main context for checkpoints
- Aggregate results → SUMMARY → present to user

**Strategy C: Decision-Dependent** (has decision checkpoints)

- Execute in main context
- Decision outcomes affect subsequent tasks
- Quality maintained through small scope (2-3 tasks per plan)
</execution_strategies>

<deviation_rules>
During execution, handle discoveries automatically:

1. **Auto-fix bugs** - Fix immediately, document in Summary
2. **Auto-add critical** - Security/correctness gaps, add and document
3. **Auto-fix blockers** - Can't proceed without fix, do it and document
4. **Ask about architectural** - Major structural changes, stop and ask user
5. **Log enhancements** - Nice-to-haves, log to ISSUES.md, continue

Only rule 4 requires user intervention.
</deviation_rules>

<commit_rules>
**CRITICAL: Agents NEVER commit. The user decides when to commit.**

After each task completes, the agent tracks modified files and suggests commit messages:

**Suggested per-task commits:**
- Format: `{type}({phase}-{plan}): {task-name}`
- Types: feat, fix, test, refactor, perf, chore

**Suggested metadata commit:**
- Format: `docs({phase}-{plan}): complete [plan-name] plan`
- Files: PLAN.md, SUMMARY.md, STATE.md, ROADMAP.md

After execution, the orchestrator presents suggested commits to the user.
The user commits when ready — never automatically.
</commit_rules>

<success_criteria>
- [ ] All independent plans executed in parallel
- [ ] Dependent plans executed after dependencies complete
- [ ] All SUMMARY.md files created
- [ ] Modified files tracked and reported to user
- [ ] Suggested commits presented to user
- [ ] Phase progress updated
</success_criteria>
