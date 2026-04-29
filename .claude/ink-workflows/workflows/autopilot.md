<purpose>
Automated issue resolution: natural language or ticket key -> Jira -> fix -> verify -> PR.
Interactive gates at: ticket confirmation, branch creation, PR creation, ticket closure.
Use --run to skip all gates and run fully automated.

Accepts: Jira key (e.g., ACA-2617) or natural language description.
Parameters: [--jira-project KEY] (required for new tickets), [--run] (skip all interactive gates)

MODE:
- Default (interactive): Asks for confirmation at each gate before proceeding.
- --run (automatic): Skips all interactive gates, auto-confirms everything.
  In --run mode: auto-switches to default branch, auto-creates ticket/branch/PR, skips ticket closure.
</purpose>

<execution_contract>
MANDATORY: Execute every step in order. Never skip a step. Never jump ahead.

MODULES (lazy-loaded):
- @.claude/ink-workflows/workflows/ticket-resolver.md  -> Ticket detection, fetch/create, STATE + CONTEXT
- @.claude/ink-workflows/workflows/autopilot-loop.md   -> Branch creation, commit, push
- @.claude/ink-workflows/workflows/autopilot-fix.md    -> Fix + verification
- @.claude/ink-workflows/workflows/autopilot-pr.md     -> PR creation
- @.claude/ink-workflows/workflows/autopilot-jira.md   -> Post-fix ticket updates + close

INTERACTIVE GATES (4) — skipped when $RUN_MODE is true:
1. Ticket confirmation (in ticket-resolver)
2. Branch creation confirmation
3. PR creation confirmation
4. Ticket closure (optional, always skipped in --run mode)

Step order:
  1. parse_arguments       -> $TICKET_INPUT, $JIRA_PROJECT, $RUN_MODE
  2. resolve_ticket        -> $JIRA_KEY, $TICKET_SUMMARY via ticket-resolver [INTERACTIVE GATE 1]
  3. validate_branch       -> confirm base branch [INTERACTIVE GATE 2]
  4. create_fix_branch     -> fix/$JIRA_KEY
  5. spawn_fix_agent       -> subagent applies fix
  6. verify_fix            -> temp tests, max 3 retries
  7. commit_and_push       -> commit fix + push branch
  8. create_pr             -> gh pr create [INTERACTIVE GATE 3]
  9. update_ticket         -> link PR + comment in Jira
  10. close_ticket         -> optional Jira transition [INTERACTIVE GATE 4]
  11. print_summary        -> final summary with all URLs
</execution_contract>

<process>

<step name="parse_arguments">
Parse `$ARGUMENTS`:
- `$TICKET_INPUT` = everything except flags (the ticket key or natural language)
- `$JIRA_PROJECT` = value after `--jira-project` flag (optional for existing tickets, required for new)
- `$RUN_MODE` = true if `--run` flag is present, false otherwise

If `$TICKET_INPUT` is empty, STOP with usage:
`/ink:autopilot "description or TICKET-KEY" [--jira-project PROJECT_KEY] [--run]`
</step>

<step name="resolve_ticket">
Print banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Ink > AUTOPILOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Load @.claude/ink-workflows/workflows/ticket-resolver.md and execute:
1. `validate_credentials` section. If fails: ABORT entire pipeline.
2. `detect_ticket` section.
3. If `$DETECTED_KEY` exists: `fetch_existing_ticket` section. [INTERACTIVE GATE 1]
4. If no key detected: `create_new_ticket` section. [INTERACTIVE GATE 1]

After resolution: `$JIRA_KEY`, `$TICKET_SUMMARY`, `$TICKET_TYPE` are set.
STATE.md and JIRA-CONTEXT.md are updated.
</step>

<step name="validate_branch">
Detect current branch, default branch, and working tree state:

```bash
CURRENT_BRANCH=$(git branch --show-current)
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
if [ -z "$DEFAULT_BRANCH" ]; then
  DEFAULT_BRANCH=$(git branch -r | grep -oE 'origin/(main|master|develop)' | head -1 | sed 's@origin/@@')
fi
if [ -z "$DEFAULT_BRANCH" ]; then
  DEFAULT_BRANCH="main"
fi
```

**Stash uncommitted changes before switching branches:**

Check if there are uncommitted changes (staged or unstaged):
```bash
git diff --quiet && git diff --cached --quiet
```
If exit code != 0 (there ARE changes), stash them:
```bash
git stash push -m "ink-autopilot: stashed before branch switch for $JIRA_KEY"
```
Print `  > Stashed uncommitted changes.`
Set `$DID_STASH=true`.

If no changes: set `$DID_STASH=false`.

**Switch to default branch and pull:**

If `$CURRENT_BRANCH` != `$DEFAULT_BRANCH`:

**If `$RUN_MODE` is true:** auto-switch silently.
`git checkout "$DEFAULT_BRANCH" && git pull origin "$DEFAULT_BRANCH"` and set `$BASE_BRANCH="$DEFAULT_BRANCH"`.
Print `  > Auto-switched to $DEFAULT_BRANCH (--run mode)`

**If `$RUN_MODE` is false:** warn and ask: [INTERACTIVE GATE 2]
```
  You are on branch: $CURRENT_BRANCH
  Default branch is: $DEFAULT_BRANCH

  It is recommended to create the fix branch from $DEFAULT_BRANCH.
  Switch to $DEFAULT_BRANCH? (y/n)
```

If yes: `git checkout "$DEFAULT_BRANCH" && git pull origin "$DEFAULT_BRANCH"` and set `$BASE_BRANCH="$DEFAULT_BRANCH"`
If no: set `$BASE_BRANCH="$CURRENT_BRANCH"` (user's choice to stay).

If `$CURRENT_BRANCH` == `$DEFAULT_BRANCH`: `git pull origin "$DEFAULT_BRANCH"` and set `$BASE_BRANCH="$DEFAULT_BRANCH"`.

**Note:** The stash is intentionally NOT popped — the new branch starts clean from `$BASE_BRANCH`. If the user aborts, they can recover with `git stash pop`.

Then confirm branch creation (skip if `$RUN_MODE` is true):

If `$RUN_MODE` is false:
```
  New branch: fix/$JIRA_KEY
  From: $BASE_BRANCH

  Create branch and continue? (y/n)
```

If `$RUN_MODE` is true: print `  > Creating branch fix/$JIRA_KEY from $BASE_BRANCH (--run mode)`

If rejected: STOP.
</step>

<step name="create_fix_branch">
Load @.claude/ink-workflows/workflows/autopilot-loop.md `create_branch` section.
Sets: `$BRANCH_NAME` = `fix/$JIRA_KEY`
</step>

<step name="spawn_fix_agent">
Load @.claude/ink-workflows/workflows/autopilot-fix.md `spawn_fix_agent` section.

The fix agent receives:
- The full JIRA-CONTEXT.md content (read and embedded as literal text in the prompt)
- The original `$TICKET_INPUT` as intent context
- The `$TICKET_SUMMARY` for focus

If fix fails: log error, revert changes with `git checkout -- .`, STOP.
</step>

<step name="verify_fix">
Load @.claude/ink-workflows/workflows/autopilot-fix.md `verify_fix` section.

Max 3 iterations. If all fail: revert with `git checkout -- .`, STOP.

Sets: `$TESTS_PASSED_COUNT`, `$VERIFY_ITERATION`, `$TESTS_TABLE_ROWS`
</step>

<step name="commit_and_push">
Load @.claude/ink-workflows/workflows/autopilot-loop.md `commit_fix` section.
Then load `push_branch` section.

Commit message format: `$COMMIT_TYPE: $TICKET_SUMMARY - $JIRA_KEY`
Where `$COMMIT_TYPE` is derived in autopilot-loop.md commit_fix section (Bug->fix, Story/Feature->feat, Task->chore).

If commit fails: STOP (nothing to push or PR).
If push fails: STOP (code committed locally, user can push manually).
</step>

<step name="create_pr">
[INTERACTIVE GATE 3] (skip if `$RUN_MODE` is true)

**If `$RUN_MODE` is false:** confirm before creating:
```
  Pull Request to create:

    fix/$JIRA_KEY -> $DEFAULT_BRANCH
    Title: $COMMIT_TYPE: $TICKET_SUMMARY - $JIRA_KEY

  Create PR? (y/n)
```

If rejected: STOP. Print `"Branch pushed. Create PR manually: gh pr create --base $DEFAULT_BRANCH"`

**If `$RUN_MODE` is true:** print `  > Auto-creating PR (--run mode)` and proceed.

Load @.claude/ink-workflows/workflows/autopilot-pr.md `create_pr` section.

If PR creation fails (gh error): STOP. Print partial summary.
</step>

<step name="update_ticket">
Load @.claude/ink-workflows/workflows/autopilot-jira.md `update_ticket` section.

Links the PR to the Jira ticket and adds a comment with the fix details.
If fails: warn but continue (ticket exists, PR exists).
</step>

<step name="close_ticket">
[INTERACTIVE GATE 4] (always skipped in `$RUN_MODE`)

**If `$RUN_MODE` is true:** skip entirely, proceed to summary. Print `  > Ticket transition skipped (--run mode)`

**If `$RUN_MODE` is false:**
```
  PR created and linked to $JIRA_KEY.
  PR:     $PR_URL
  Ticket: $TICKET_URL

  Do you want to close/transition the ticket? (y/close/n)
```

If user says no: skip, proceed to summary.

If user says yes or close:

**Step 1: Get available transitions**
```bash
bash .claude/skills/ink-jira/jira-api.sh get-transitions "$JIRA_KEY"
```

**Step 2: Show options**
```
  Available transitions for $JIRA_KEY:
    1. In Progress (id: 21)
    2. Done (id: 31)
    3. In Review (id: 41)

  Select transition number (or 'skip'):
```

**Step 3: Execute transition**
```bash
bash .claude/skills/ink-jira/jira-api.sh transition-issue "$JIRA_KEY" "$TRANSITION_ID"
```

If HTTP 204: `  > Ticket $JIRA_KEY transitioned successfully`
If fails: warn, continue to summary.
</step>

<step name="print_summary">
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Ink > AUTOPILOT COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Ticket:     $JIRA_KEY - $TICKET_SUMMARY
  Ticket URL: $TICKET_URL
  Branch:     $COMMIT_TYPE/$JIRA_KEY
  Tests:      Passed (iteration $VERIFY_ITERATION)
  PR URL:     $PR_URL
  Transition: [Done / Skipped]
```
</step>

</process>

<error_handling>
| Failure | Behavior |
|---------|----------|
| No input provided | ABORT with usage |
| Jira credentials fail | ABORT entire pipeline |
| User rejects ticket | ABORT |
| User rejects branch | ABORT |
| Ticket creation fails | ABORT |
| Ticket fetch fails | ABORT |
| Fix agent fails | Revert changes, STOP |
| Tests fail after 3 iterations | Revert changes, STOP |
| git commit fails | STOP |
| git push fails | STOP (committed locally) |
| User rejects PR | STOP (branch pushed) |
| PR creation fails (gh) | STOP with partial summary |
| Jira update fails | Warn, continue |
| Jira transition fails | Warn, continue to summary |
</error_handling>
