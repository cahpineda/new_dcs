<purpose>
Reusable ticket resolution module. Detects whether input contains a Jira key or natural language.
If key found: fetches ticket via jira-api.sh and generates JIRA-CONTEXT.md.
If no key: LLM classifies type (Bug/Feature/Task), generates summary+description, creates ticket via jira-api.sh.
Always updates STATE.md and JIRA-CONTEXT.md.

Lazy-loaded by autopilot.md, /ink:ticket, and any workflow needing ticket context.

Requires: $TICKET_INPUT (natural language or ticket key), $JIRA_PROJECT (optional, for new tickets), $RUN_MODE (true/false)
Sets: $JIRA_KEY, $TICKET_SUMMARY, $TICKET_DESCRIPTION, $TICKET_TYPE, $TICKET_STATUS, $TICKET_URL, $JIRA_BASE_URL
Side effects: STATE.md updated, JIRA-CONTEXT.md generated
</purpose>

<section name="detect_ticket">
## Detect Ticket Key vs Natural Language

Validate input is non-empty:
```bash
TRIMMED=$(echo "$TICKET_INPUT" | xargs)
if [ -z "$TRIMMED" ]; then
  echo "Error: No ticket input provided."
  # STOP
fi
```

Parse `$TICKET_INPUT` for a Jira key pattern:

```bash
DETECTED_KEY=$(echo "$TICKET_INPUT" | grep -oE '[A-Z]{2,10}-[0-9]+' | head -1)
```

If `$DETECTED_KEY` is non-empty: proceed to `fetch_existing_ticket`.
If empty: proceed to `create_new_ticket`.
</section>

<section name="validate_credentials">
## Validate Jira Credentials

```bash
bash .claude/skills/ink-jira/jira-api.sh check-creds
```

If output contains `ERROR`: STOP. Print:
```
ABORT -- Jira credentials not available. Check that ~/.claude.json exists and the credentials service is reachable.
```

**Set Jira browse URL** (needed for ticket URLs throughout the pipeline):
```bash
JIRA_BASE_URL="https://inkinnovation.atlassian.net"
```
Set `$JIRA_BASE_URL` for use in all subsequent steps and outputs.
</section>

<section name="fetch_existing_ticket">
## Fetch Existing Ticket

Requires: $DETECTED_KEY from detect_ticket.

**Step 1: Add ink-monitor label**
```bash
bash .claude/skills/ink-jira/jira-api.sh add-label "$DETECTED_KEY"
```

**Step 2: Fetch issue data**
```bash
bash .claude/skills/ink-jira/jira-api.sh fetch-issue "$DETECTED_KEY"
```

If fetch fails: STOP with error.

**Step 3: Extract key fields**

Use the Read tool on `/tmp/jira-issue.json` to extract:
- `$JIRA_KEY` = `key`
- `$TICKET_SUMMARY` = `fields.summary`
- `$TICKET_TYPE` = `fields.issuetype.name`
- `$TICKET_STATUS` = `fields.status.name`
- `$TICKET_ASSIGNEE` = `fields.assignee.displayName` (or "Unassigned")
- `$TICKET_DESCRIPTION` = `fields.description` (rendered text)

**Step 4: Interactive confirmation** (skip if `$RUN_MODE` is true)

Set `$TICKET_URL` = `$JIRA_BASE_URL/browse/$JIRA_KEY`

If `$RUN_MODE` is false, print and wait for user confirmation:
```
  Ticket found:

    Key:       $JIRA_KEY
    Summary:   $TICKET_SUMMARY
    Type:      $TICKET_TYPE
    Status:    $TICKET_STATUS
    Assignee:  $TICKET_ASSIGNEE
    URL:       $TICKET_URL

  Is this the ticket you want to work on? (y/n)
```

If user rejects: STOP. Print `"Aborted. Provide a different ticket key or description."`

If `$RUN_MODE` is true: print the ticket info (same block including URL) but auto-confirm. Print `  > Auto-confirmed (--run mode)`

**Step 5: Generate JIRA-CONTEXT.md**

Generate `.planning/jira/JIRA-CONTEXT.md` from the fetched data:
1. `mkdir -p .planning/jira`
2. Read the template at `.claude/ink-workflows/templates/jira-context.md` using the Read tool
3. Read `/tmp/jira-issue.json`, `/tmp/jira-issue-changelog.json` using the Read tool to extract all fields
4. Write `.planning/jira/JIRA-CONTEXT.md` using Bash heredoc (`cat <<'JIRA_EOF' >`) following the template structure exactly
5. Clean up: `bash .claude/skills/ink-jira/jira-api.sh cleanup`

**Step 6: Update STATE.md**
```bash
node bin/ink-tools.js state set "CurrentTicket" "$JIRA_KEY"
```

Print: `  > Ticket $JIRA_KEY tracked — $TICKET_URL`
</section>

<section name="create_new_ticket">
## Create New Ticket from Natural Language

Requires: $TICKET_INPUT (natural language), $JIRA_PROJECT (Jira project key), $RUN_MODE

If `$JIRA_PROJECT` is empty: STOP. Print:
```
  --jira-project is required when creating a new ticket.
  Usage: /ink:autopilot "description" --jira-project PROJECT_KEY
```

**Step 1: Get current user email**
```bash
EMAIL=$(python3 -c "import json; print(json.load(open('$HOME/.claude.json'))['oauthAccount']['emailAddress'])")
```

**Step 2: Fetch valid issue types and LLM classifies**

First, fetch the valid issue types for the project:
```bash
VALID_TYPES=$(bash .claude/skills/ink-jira/jira-api.sh get-issue-types "$JIRA_PROJECT")
```

If empty or fails: STOP. Print `"ABORT -- Could not fetch issue types for project $JIRA_PROJECT."`

From `$TICKET_INPUT` and the list of `$VALID_TYPES`, the LLM determines:
- `$TICKET_TYPE`: MUST be one of the types returned by `get-issue-types`. Pick the closest match: "Bug" for problems/errors, "Feature" or "Story" for new features/enhancements, "Chore" or "Task" for maintenance/cleanup work. Never guess — only use types from the fetched list.
- `$TICKET_SUMMARY`: Concise summary (max 120 chars), professional tone
- `$TICKET_DESCRIPTION`: Structured description with context, expected behavior, and acceptance criteria

**Step 3: Interactive confirmation** (skip if `$RUN_MODE` is true)

If `$RUN_MODE` is false, print and wait for user confirmation:
```
  New ticket to create:

    Project:      $JIRA_PROJECT
    Type:         $TICKET_TYPE
    Summary:      $TICKET_SUMMARY
    Description:  $TICKET_DESCRIPTION (first 200 chars...)
    Assignee:     $EMAIL (you)

  Create this ticket? (y/n)
```

If user rejects: STOP. Print `"Aborted. Refine your description and try again."`

The user may also request modifications before confirming (e.g., "change the summary to X" or "make it a Task instead"). Apply changes and re-confirm.

If `$RUN_MODE` is true: print the ticket info (same block) but auto-confirm. Print `  > Auto-creating ticket (--run mode)`

**Step 4: Build ADF description and create ticket**

Write the description as simplified JSON to a temp file, convert to ADF, then create.

The input JSON for `build-adf` MUST use the `"sections"` format expected by `jira-adf-builder.py`:
```json
{
  "sections": [
    {"type": "paragraph", "text": "Main description text."},
    {"type": "heading", "level": 3, "text": "Scope"},
    {"type": "ordered_list", "items": ["Step 1", "Step 2"]},
    {"type": "heading", "level": 3, "text": "Acceptance Criteria"},
    {"type": "bullet_list", "items": ["Criterion A", "Criterion B"]}
  ]
}
```

```bash
DESC_FILE=$(mktemp /tmp/ink-ticket-desc-XXXXXX)
# Write sections JSON to $DESC_FILE following the format above

ADF_FILE=$(mktemp /tmp/ink-ticket-adf-XXXXXX)
bash .claude/skills/ink-jira/jira-api.sh build-adf "$DESC_FILE" "$ADF_FILE"

RESULT=$(bash .claude/skills/ink-jira/jira-api.sh create-issue \
  --project "$JIRA_PROJECT" \
  --type "$TICKET_TYPE" \
  --summary "$TICKET_SUMMARY" \
  --description-file "$ADF_FILE" \
  --assignee "$EMAIL")

rm -f "$DESC_FILE" "$ADF_FILE"
```

Extract `$JIRA_KEY` from `$RESULT` (JSON with `key` field).

Validate format:
```bash
echo "$JIRA_KEY" | grep -qE '^[A-Z]+-[0-9]+$'
```
If invalid: STOP. Print `"ABORT -- Ticket creation failed. API response: $RESULT"`

Set `$TICKET_URL` = `$JIRA_BASE_URL/browse/$JIRA_KEY`

**Step 4b: Add ink-monitor label**
```bash
bash .claude/skills/ink-jira/jira-api.sh add-label "$JIRA_KEY" 2>/dev/null || echo "Warning: failed to add ink-monitor label to $JIRA_KEY"
```

**Step 5: Register ticket in sentinel**
```bash
node -e 'var fs=require("fs"),p=require("path"),k=process.argv[1],f=p.join(process.cwd(),".claude",".ink-state.json"),d;try{d=JSON.parse(fs.readFileSync(f,"utf8"))}catch(e){d={tool:"Ink-dev-helper"}};if(d.tickets==null)d.tickets={};if(d.tickets[k]==null)d.tickets[k]={usages:[]};d.tickets[k].usages.push({command:"ticket-resolver",timestamp:new Date().toISOString(),intent:"created from natural language"});fs.writeFileSync(f,JSON.stringify(d,null,2))' "$JIRA_KEY" 2>/dev/null || true
```

**Step 6: Generate JIRA-CONTEXT.md**

Since we just created the ticket, we have all the data. Create `.planning/jira/JIRA-CONTEXT.md` using the template at `.claude/ink-workflows/templates/jira-context.md` with the known fields. Use `mkdir -p .planning/jira` first.

**Step 7: Update STATE.md**
```bash
node bin/ink-tools.js state set "CurrentTicket" "$JIRA_KEY"
```

Print: `  > Ticket created: $JIRA_KEY — $TICKET_URL`
</section>
