# Checkpoint Continuation Protocol

Enables fresh agents to resume interrupted plan execution without context loss or repeated work.

## Checkpoint File

**Location:** `.planning/phases/XX-name/.continue-here.md`

```markdown
---
phase: XX-name
plan: NN
task_index: N
total_tasks: M
status: paused
paused_at: YYYY-MM-DDTHH:MM:SSZ
reason: context_limit | user_break | error | uat_exhausted
---

# Checkpoint: Phase XX Plan NN

## Completed Tasks
- [x] Task 1: <name> — commit: abc123
- [x] Task 2: <name> — commit: def456

## Current Task
- [ ] Task 3: <name> — status: in_progress | not_started

## Pending Tasks
- [ ] Task 4: <name>

## Modified Files (this session)
- path/to/file1.ts
- path/to/file2.ts

## Decisions Made
- Decision 1: rationale

## Blockers Found
- None (or: Blocker description)

## Resume Instructions
1. Read this checkpoint
2. Load PLAN.md for full task details
3. Continue from Task N (current task)
4. Verify modified files are in expected state
```

## When to Save

| Event | Action |
|-------|--------|
| After each task commit | Overwrite checkpoint with updated progress |
| Context >85% used | Save checkpoint with `reason: context_limit` |
| User interrupt | Save checkpoint with `reason: user_break` |
| UAT loop exhausted | Save checkpoint with `reason: uat_exhausted` |
| Error requiring escalation | Save checkpoint with `reason: error` |

## When to Delete

Delete `.continue-here.md` when:
- SUMMARY.md is created (plan complete)
- User explicitly abandons the plan

## Resume Flow

When starting plan execution:

```
1. Check for .continue-here.md in phase directory
2. IF found:
   a. Parse checkpoint frontmatter (task_index, status)
   b. Load PLAN.md for full task details
   c. Report: "Resuming from Task {task_index + 1} ({task_index} completed previously)"
   d. Skip completed tasks
   e. Continue from current task
3. IF not found:
   a. Start from Task 1 (normal flow)
```

## Integration Points

- **execute-plan-core.md** — Saves checkpoint after each task, checks on load_prompt
- **resume-project.md** — Already detects `.continue-here` (line 71) and routes to resume
- **go-router.md** — `.continue-here` presence triggers `route_continue`
