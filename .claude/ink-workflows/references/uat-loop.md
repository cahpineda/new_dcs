# UAT Diagnosis Loop Protocol

When tests, linting, type-checks, or verification commands fail during plan execution, automatically diagnose and fix before escalating to the user.

## Trigger

Any command failure in:
- `quality_gate` step (lint, types, tests)
- `execute` step verification (`<verify>` commands)
- `self_check` step (stub detection, test count)

## Loop (max 3 iterations)

```
FOR iteration IN 1..3:
  1. CAPTURE: Save full stdout + stderr from failed command
  2. DIAGNOSE: Categorize failure pattern:
     - Import/module error → missing dependency or wrong path
     - Type error → type mismatch, missing annotation
     - Test assertion → logic bug in implementation
     - Lint error → style/format issue
     - Runtime error → null reference, async issue, missing guard
  3. FIX: Apply minimal targeted fix
     - One issue per iteration (atomic fixes)
     - Never change test expectations (tests define correct behavior)
     - If fix requires >10 lines → escalate immediately
  4. VERIFY: Re-run the exact failing command
  5. RESULT:
     - Pass → continue normal execution
     - Fail → next iteration
```

## Escalation (after 3 failures)

STOP execution. Present to user:

```
## Test Failure — Manual Intervention Needed

**Original error:** [first failure output]
**Attempts:** 3 iterations, all failed

**Fixes attempted:**
1. [What was tried in iteration 1]
2. [What was tried in iteration 2]
3. [What was tried in iteration 3]

**Current state:** [description of where things stand]

**Options:**
1. Fix manually, then type "continue"
2. Abort this plan
3. Skip this task and continue to next
```

## Documentation

Each UAT loop fix MUST be documented in SUMMARY.md under **Deviations from Plan > Auto-fixed Issues**:

```markdown
**N. [UAT Loop - Iteration M] Brief description**
- **Found during:** Task [N] verification
- **Issue:** [What failed]
- **Fix:** [What was changed]
- **Files modified:** [paths]
- **Verification:** [Passing command]
```

## Rules

1. **Atomic fixes** — one change per iteration, easy to review
2. **Tests are truth** — never modify test expectations to make them pass
3. **Size limit** — if a fix needs >10 lines, it's not a simple fix; escalate
4. **Track everything** — all attempts documented, even failed ones
5. **No infinite loops** — hard cap at 3 iterations, then human
