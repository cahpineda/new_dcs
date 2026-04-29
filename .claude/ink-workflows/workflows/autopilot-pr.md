<purpose>
PR creation module for the autopilot pipeline.
Creates a pull request with a rich body linking to Jira, describing the change,
showing before/after code, and including verification results.
Lazy-loaded by autopilot.md.
</purpose>

<section name="create_pr">
## Create Pull Request

Requires: $BRANCH_NAME, $DEFAULT_BRANCH, $JIRA_KEY, $TICKET_SUMMARY, $TICKET_TYPE, $TICKET_URL,
$FIX_DESCRIPTION, $BEFORE_CODE, $AFTER_CODE, $FIX_RATIONALE,
$TESTS_TABLE_ROWS, $TESTS_PASSED_COUNT, $VERIFY_ITERATION

Determine commit type prefix:
```bash
COMMIT_TYPE="fix"
case "$TICKET_TYPE" in
  Story|Feature) COMMIT_TYPE="feat" ;;
  Task) COMMIT_TYPE="chore" ;;
  Bug) COMMIT_TYPE="fix" ;;
  *) COMMIT_TYPE="fix" ;;
esac
```

ONE bash block — create PR via gh:

```bash
PR_TITLE="${COMMIT_TYPE}: ${TICKET_SUMMARY} - ${JIRA_KEY}"

PR_OUTPUT=$(gh pr create \
  --title "$PR_TITLE" \
  --body "$(cat <<'PREOF'
## Jira

[${JIRA_KEY}](${TICKET_URL}) -- ${TICKET_SUMMARY}

---

## What changed

${FIX_DESCRIPTION}

**Before:**
```
${BEFORE_CODE}
```

**After:**
```
${AFTER_CODE}
```

**Why this change is correct:**
${FIX_RATIONALE}

---

## Verification

Automated tests were run against the changed files before commit.

| # | What was verified | Result |
|---|-------------------|--------|
${TESTS_TABLE_ROWS}

All ${TESTS_PASSED_COUNT} verification test(s) passed on iteration ${VERIFY_ITERATION}.

---

## How to Review

1. Check the diff -- confirm the issue described in ${JIRA_KEY} is resolved
2. Confirm the fix is minimal -- no unrelated logic was modified
3. Verify functional behavior is preserved
4. Run the project's existing test suite to catch regressions

## Reviewer Checklist

- [ ] The issue is resolved and the fix matches the ticket description
- [ ] No unrelated code was modified
- [ ] The fix does not introduce new issues
- [ ] Existing tests still pass

---
Generated with [Ink Autopilot](https://github.com/inkaviation/ink-agent-dev-helper)
PREOF
)" \
  --base "$DEFAULT_BRANCH" 2>&1)

PR_URL=$(echo "$PR_OUTPUT" | grep -o 'https://github.com[^ ]*' | head -1)
```

If `PR_URL` is empty (gh failed): **STOP ALL**. Print:
```
  x FATAL: Failed to create PR for $JIRA_KEY ($BRANCH_NAME)
    gh output: $PR_OUTPUT
    The fix is committed and pushed on branch $BRANCH_NAME -- create the PR manually.
```

On success: `  > PR created: $PR_URL`
</section>
