<purpose>
Post-fix Jira operations for autopilot: update ticket with PR link/comment and optional status transition.
Credentials are obtained via the INK credentials service (same as jira-api.sh).
</purpose>

<section name="update_ticket">
## Update Jira Ticket (post-PR)

Requires: $JIRA_KEY, $PR_URL, $TICKET_SUMMARY, $FIX_DESCRIPTION
If PR_URL is missing, skip this section.

**Step 1: Get credentials for API calls (OAuth)**
```bash
EMAIL="${INK_CLAUDE_USER_EMAIL:-$(jq -r '.oauthAccount.emailAddress' ~/.claude.json 2>/dev/null)}"
CREDS=$(curl -s "https://ai-rag-chat-ui.aws-dev.inkcloud.io/api/jira/credentials?email=${EMAIL}")
JIRA_ACCESS_TOKEN=$(echo "$CREDS" | jq -r '.accessToken // empty')
JIRA_CLOUD_ID=$(echo "$CREDS" | jq -r '.cloudId // empty')
JIRA_BASE="https://api.atlassian.com/ex/jira/${JIRA_CLOUD_ID}/rest/api/3"
```

If `JIRA_ACCESS_TOKEN` is empty or `status` is `oauth_required`: skip Jira updates and warn.

**Step 2: Add remote link (PR -> Jira)**
```bash
REMOTELINK_FILE=$(mktemp /tmp/ink-autopilot-remotelink.XXXXXX)

node -e '
  var fs = require("fs");
  var prUrl = process.argv[1];
  var prTitle = process.argv[2];
  var payload = {
    globalId: "github-pr-" + prUrl.replace(/[^a-z0-9]/gi, "-"),
    relationship: "implements",
    object: {
      url: prUrl,
      title: prTitle,
      icon: { url16x16: "https://github.com/favicon.ico", title: "GitHub Pull Request" },
      status: { resolved: false, icon: { url16x16: "https://github.com/favicon.ico", title: "Open" } }
    }
  };
  fs.writeFileSync(process.argv[3], JSON.stringify(payload));
' "$PR_URL" "${TICKET_SUMMARY}" "$REMOTELINK_FILE"

REMOTELINK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Authorization: Bearer ${JIRA_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  --data-binary "@$REMOTELINK_FILE" \
  "${JIRA_BASE}/issue/${JIRA_KEY}/remotelink")
rm -f "$REMOTELINK_FILE"

if echo "$REMOTELINK_STATUS" | grep -q '^2'; then
  echo "  > PR linked to Jira ticket $JIRA_KEY"
else
  echo "  ! Remote link failed (HTTP $REMOTELINK_STATUS)"
fi
```

**Step 3: Add comment with fix details**
```bash
COMMENT_FILE=$(mktemp /tmp/ink-autopilot-comment.XXXXXX)
FIX_DESC_FILE=$(mktemp /tmp/ink-autopilot-fixdesc.XXXXXX)
printf '%s' "$FIX_DESCRIPTION" > "$FIX_DESC_FILE"

node -e '
  var fs = require("fs");
  var fixDesc = fs.readFileSync(process.argv[1], "utf8").trim();
  var prUrl = process.argv[2];
  var text = [
    "Fix implemented by ink:autopilot.",
    "", "Solution: " + fixDesc,
    "", "PR: " + prUrl,
    "", "The fix was verified with automated tests before commit.",
    "See the PR for the full diff and reviewer checklist."
  ].join("\n");
  var payload = {
    body: { type: "doc", version: 1,
      content: [{ type: "paragraph", content: [{ type: "text", text: text }] }] }
  };
  fs.writeFileSync(process.argv[3], JSON.stringify(payload));
' "$FIX_DESC_FILE" "$PR_URL" "$COMMENT_FILE"

rm -f "$FIX_DESC_FILE"

COMMENT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Authorization: Bearer ${JIRA_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  --data-binary "@$COMMENT_FILE" \
  "${JIRA_BASE}/issue/${JIRA_KEY}/comment")
rm -f "$COMMENT_FILE"

if echo "$COMMENT_STATUS" | grep -q '^2'; then
  echo "  > Jira ticket $JIRA_KEY updated with solution and PR link"
else
  echo "  ! Jira comment failed (HTTP $COMMENT_STATUS)"
fi
```
</section>

<section name="close_ticket">
## Close/Transition Ticket (optional, interactive)

Requires: $JIRA_KEY

**Step 1: Get available transitions**
```bash
bash .claude/skills/ink-jira/jira-api.sh get-transitions "$JIRA_KEY"
```

**Step 2: Present options to user**

Show the list of transitions with numbers. Ask user to pick one or skip.

**Step 3: Execute transition**
```bash
bash .claude/skills/ink-jira/jira-api.sh transition-issue "$JIRA_KEY" "$SELECTED_TRANSITION_ID"
```

If HTTP 204: `  > Ticket $JIRA_KEY transitioned successfully`
If fails: `  ! Transition failed -- update ticket status manually in Jira`
</section>
