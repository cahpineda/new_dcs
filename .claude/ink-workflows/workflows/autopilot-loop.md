<purpose>
Branch, commit, and push module for the autopilot pipeline.
Handles branch creation from $JIRA_KEY, committing fixed files, and pushing.
Lazy-loaded by autopilot.md.
</purpose>

<section name="create_branch">
## Create Fix Branch

Requires: $JIRA_KEY (set by ticket-resolver.md).

```bash
BRANCH_NAME="fix/${JIRA_KEY}"

if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
  git checkout "$BRANCH_NAME"
  echo "  Using existing branch: $BRANCH_NAME"
else
  git checkout -b "$BRANCH_NAME"
  echo "  > Branch: $BRANCH_NAME"
fi
```
</section>

<section name="commit_fix">
## Commit Fixed Files

Requires: $JIRA_KEY, $TICKET_SUMMARY, $TICKET_TYPE from ticket-resolver.

Stage all changed files (excluding temp/test files) and commit:

```bash
COMMIT_TYPE="fix"
case "$TICKET_TYPE" in
  Story|Feature) COMMIT_TYPE="feat" ;;
  Task) COMMIT_TYPE="chore" ;;
  Bug) COMMIT_TYPE="fix" ;;
  *) COMMIT_TYPE="fix" ;;
esac

git add -A
git reset HEAD -- '/tmp/*' 2>/dev/null || true
git commit -m "${COMMIT_TYPE}: ${TICKET_SUMMARY} - ${JIRA_KEY}"
```

If commit fails: log `  x Commit failed`, STOP.
</section>

<section name="push_branch">
## Push Branch to Remote

Requires: $BRANCH_NAME from create_branch. Commit must have succeeded.

```bash
PUSH_OUTPUT=$(git push -u origin "$BRANCH_NAME" 2>&1)
PUSH_EXIT=$?
echo "$PUSH_OUTPUT"
if [ $PUSH_EXIT -ne 0 ]; then
  echo "  x Push failed (exit $PUSH_EXIT)"
fi
```

If push fails: log error, STOP.
</section>
