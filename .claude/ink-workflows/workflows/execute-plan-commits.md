<purpose>
File tracking protocol for plan execution. This module defines how to track modified files after each task.

**CRITICAL: Agents and workflows NEVER commit. The user decides when to commit.**

See @execute-plan-core.md for the main execution flow.
See @references/git-integration.md for general git conventions.
</purpose>

<task_file_tracking>
## Task File Tracking Protocol

After each task completes (verification passed, done criteria met), track modified files:

**1. Identify modified files:**

Track files changed during this specific task (not the entire plan):

```bash
git status --short
```

**2. Determine suggested commit type:**

See @references/common-examples.md#commit-message-examples for commit type reference table.

**3. Craft suggested commit message (for user reference only):**

See @references/common-examples.md#commit-message-examples for commit format and examples.

**4. Report to user (DO NOT commit):**

```
## Task [N] Complete

**Files modified:**
- src/api/auth.ts (modified)
- src/types/user.ts (created)

**Suggested commit:**
`{type}({phase}-{plan}): {description}`
```

**The user commits when they are ready.** Never run `git add` or `git commit`.

**5. Memory update (handled separately):**

Memory is updated **after task completion, not after commit**. See `auto_update_memory` step in @execute-plan-core.md.

This decoupling ensures:
- Memory tracks what was *built*, not what was *committed*
- Memory stays in sync regardless of commit decisions

</task_file_tracking>
