# Continue-Here Template

Template for `.planning/phases/XX-name/.continue-here.md` — checkpoint for interrupted plan execution.

**Created automatically** by execute-plan-core.md after each task commit. **Deleted** on plan completion.

---

## File Template

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
- None

## Resume Instructions
1. Read this checkpoint
2. Load PLAN.md for full task details
3. Continue from Task N (current task)
4. Verify modified files are in expected state
```

<yaml_fields>
Required YAML frontmatter:

- `phase`: Directory name (e.g., `42-execution-resilience`)
- `plan`: Plan number (e.g., `01`)
- `task_index`: 0-based index of current task
- `total_tasks`: Total tasks in plan
- `status`: `paused`, `error`, `context_limit`
- `paused_at`: ISO timestamp
- `reason`: Why paused (context_limit, user_break, error, uat_exhausted)
</yaml_fields>

<guidelines>
- Be specific enough that a fresh agent understands immediately
- Include commit hashes for completed tasks (verifiable)
- List modified files so resume can verify state
- Include WHY decisions were made, not just what
- Resume Instructions should be actionable without reading anything else
- This file gets DELETED after plan completion — it's not permanent storage
- See @references/checkpoint-protocol.md for full protocol details
</guidelines>
