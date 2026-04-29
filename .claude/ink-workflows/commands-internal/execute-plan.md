---
name: ink:execute-plan
description: Execute a PLAN.md file
argument-hint: "[path-to-PLAN.md]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
  - SlashCommand
---

<objective>
Execute a PLAN.md file, create SUMMARY.md, update project state.

**CRITICAL: Agents NEVER commit. The user decides when to commit.**
Agents track modified files and suggest commit messages. The user commits when ready.

Uses intelligent segmentation:
- Plans without checkpoints → spawn subagent for full autonomous execution
- Plans with verify checkpoints → segment execution, pause at checkpoints
- Plans with decision checkpoints → execute in main context
  </objective>

<execution_context>
@.claude/ink-workflows/workflows/execute-plan.md (orchestrator - loads specialized modules as needed)
@.claude/ink-workflows/workflows/execute-plan-core.md (main execution flow - loaded automatically)
@.claude/ink-workflows/workflows/execute-plan-deviations.md (deviation handling - loaded when deviations occur)
@.claude/ink-workflows/workflows/execute-plan-tdd.md (TDD execution - loaded for TDD plans)
@.claude/ink-workflows/workflows/execute-plan-commits.md (commit protocol - loaded during commits)
@.claude/ink-workflows/references/execute-plan-examples.md (examples - loaded on demand)
@.claude/ink-workflows/templates/summary.md
@.claude/ink-workflows/references/checkpoints.md
@.claude/ink-workflows/references/tdd.md
</execution_context>

<context>
Plan path: $ARGUMENTS

**Load project state first:**
@.planning/STATE.md

**Load workflow config:**
@.planning/config.json
</context>

<process>
1. Check .planning/ directory exists (error if not - user should run /ink:new-project)
2. Verify plan at $ARGUMENTS exists
3. Check if SUMMARY.md already exists (plan already executed?)
4. Load workflow config for mode (interactive/yolo)
5. Follow execute-plan.md workflow:
   - Parse plan and determine execution strategy (A/B/C)
   - Execute tasks (via subagent or main context as appropriate)
   - Handle checkpoints and deviations
   - Create SUMMARY.md
   - Update STATE.md
   - Commit changes
</process>

<execution_strategies>
**Strategy A: Fully Autonomous** (no checkpoints)

- Spawn subagent to execute entire plan
- Subagent creates SUMMARY.md and reports modified files (NO commits)
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

**Classification Algorithm:**

When you discover unplanned work, classify it by asking these questions in order:

```
Q1: Does this BLOCK continuing the current task?
    YES → Q2
    NO  → Q4

Q2: Is the blocker a BUG in existing code?
    YES → Rule 1 (Auto-fix bugs)
    NO  → Q3

Q3: Is the blocker SECURITY/CORRECTNESS critical?
    YES → Rule 2 (Auto-add critical)
    NO  → Rule 3 (Auto-fix blockers)

Q4: Does this change ARCHITECTURE or PUBLIC API?
    YES → Rule 4 (Ask about architectural) - STOP and ask user
    NO  → Q5

Q5: Is this a NICE-TO-HAVE improvement?
    YES → Rule 5 (Log enhancements)
    NO  → Rule 1 (treat as minor bug fix)
```

**Heuristics by keyword:**

| Discovery contains | Likely rule |
|-------------------|-------------|
| "error", "exception", "crash", "null" | Rule 1 (bug) |
| "injection", "XSS", "auth", "password", "token" | Rule 2 (security) |
| "can't proceed", "missing", "dependency" | Rule 3 (blocker) |
| "refactor", "rename", "restructure", "API change" | Rule 4 (architectural) |
| "could be better", "optimization", "cleanup" | Rule 5 (enhancement) |

**When uncertain:** Default to Rule 5 (log to ISSUES.md) - this is the safest option as it documents without blocking or making unauthorized changes.
</deviation_rules>

<commit_rules>
**CRITICAL: Agents NEVER commit. The user decides when to commit.**

Agents track modified files per task and suggest commit messages:

**Suggested per-task commits:**
- Format: `{type}({phase}-{plan}): {task-name}`
- Types: feat, fix, test, refactor, perf, chore

**Suggested metadata commit:**
- Format: `docs({phase}-{plan}): complete [plan-name] plan`
- Files: PLAN.md, SUMMARY.md, STATE.md, ROADMAP.md

After execution, present suggested commits to the user. The user commits when ready.

See .claude/ink-workflows/references/git-integration.md for commit conventions.
</commit_rules>

<success_criteria>

- [ ] All tasks executed
- [ ] Modified files tracked and reported to user
- [ ] SUMMARY.md created with substantive content
- [ ] STATE.md updated (position, decisions, issues, session)
- [ ] ROADMAP updated (plan count, phase status)
- [ ] Suggested commits presented to user
- [ ] User informed of next steps
      </success_criteria>
