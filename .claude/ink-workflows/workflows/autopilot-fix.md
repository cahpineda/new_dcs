<purpose>
Fix and verification module for the autopilot pipeline.
Spawns a dedicated subagent to fix an issue based on JIRA context and natural language intent,
then runs auto-generated verification tests with a 3-iteration retry loop.
Lazy-loaded by autopilot.md.
</purpose>

<section name="spawn_fix_agent">
## Fix Issue via Subagent

Requires: $JIRA_KEY, $TICKET_SUMMARY, $TICKET_INPUT (original user intent)

**Step 1: Read JIRA context and embed in prompt**

Use Read tool on `.planning/jira/JIRA-CONTEXT.md` to get full ticket context.
Store the file content as `$JIRA_CONTEXT` (literal text). This text will be embedded directly into the subagent prompt below — the subagent does NOT read the file itself.

**Step 2: Spawn fix agent**

Use the Agent tool to spawn a subagent with `run_in_background: false`.

Agent prompt:
```
You are fixing a single issue. Make the MINIMAL change required.

## Ticket
- Key: {$JIRA_KEY}
- Summary: {$TICKET_SUMMARY}

## User Intent
{$TICKET_INPUT}

## Full Jira Context
{$JIRA_CONTEXT}

## Instructions
1. Read the relevant files to understand the codebase context
2. Identify the exact issue described in the ticket/intent
3. Apply the minimal, correct fix
4. Use the Edit tool for precise changes — do NOT rewrite entire files
5. Do NOT refactor unrelated code
6. Do NOT add comments, docstrings, or type annotations
7. Preserve existing behavior except where the issue requires change

## Required Output
After fixing, output these variables in a structured block:

FIX_DESCRIPTION: one-sentence summary of what was changed
CHANGED_FILES: comma-separated list of files modified
BEFORE_CODE: the exact code before the fix (key lines only)
AFTER_CODE: the exact fixed code (key lines only)
FIX_RATIONALE: 2-3 sentences explaining why the fix is correct
```

**Step 3: Capture agent output**

Extract from the agent's response:
- `$FIX_DESCRIPTION`
- `$CHANGED_FILES`
- `$BEFORE_CODE`
- `$AFTER_CODE`
- `$FIX_RATIONALE`

If the agent failed or returned empty results: revert with `git checkout -- .`, STOP.

Print: `  > Fix applied: $FIX_DESCRIPTION`
</section>

<section name="verify_fix">
## Verify Fix with Temporary Tests

Requires: $CHANGED_FILES, $BEFORE_CODE, $AFTER_CODE, $TICKET_SUMMARY

Generate targeted verification tests, run them, then DELETE them. Tests are NEVER committed.

**Step 1: Generate tests**

```bash
TEMP_TEST_FILE=$(mktemp /tmp/ink-autopilot-verify.XXXXXX.js)
```

The LLM writes a Node.js test file that:
1. Reads each changed file from disk
2. Verifies the old problematic pattern no longer exists
3. Verifies the new correct pattern is present
4. Covers the specific issue type as appropriate

**Step 2: Run tests (max 3 iterations)**

```
Iteration 1:
  node "$TEMP_TEST_FILE" 2>&1
  Exit 0 -> proceed to commit
  Exit != 0 -> capture error, re-execute spawn_fix_agent with test failure context

Iteration 2:
  node "$TEMP_TEST_FILE" 2>&1
  Exit 0 -> proceed to commit
  Exit != 0 -> capture error, re-execute spawn_fix_agent

Iteration 3 (final):
  node "$TEMP_TEST_FILE" 2>&1
  Exit 0 -> proceed to commit
  Exit != 0 -> mark as failed, revert: git checkout -- .
```

**Step 3: Cleanup**
```bash
rm -f "$TEMP_TEST_FILE"
```

CRITICAL: Only changed source files are committed. The temp test file is NEVER staged.

**Step 4: Set output variables**
```
$TESTS_PASSED_COUNT = number of assertions that passed
$VERIFY_ITERATION = iteration number on which tests passed (1, 2, or 3)
$TESTS_TABLE_ROWS = markdown table rows, format: "| N | description | Pass |"
```

Print: `  > Verification passed (iteration $VERIFY_ITERATION)` OR `  x Tests failed after 3 iterations`
</section>
