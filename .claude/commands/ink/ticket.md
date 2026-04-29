---
name: ink:ticket
description: Resolve or create a Jira ticket from a key or natural language description
argument-hint: "[TICKET-KEY or description] [--jira-project PROJECT_KEY]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

<objective>
Resolve a Jira ticket (existing or new) and set it as the active ticket.
Updates STATE.md and generates JIRA-CONTEXT.md.

If input contains a Jira key (e.g., ACA-2617): fetches the ticket and confirms interactively.
If input is natural language: classifies, generates summary, and creates a new ticket after confirmation.
</objective>

<process>
**Step 1: Parse arguments**

- `$TICKET_INPUT` = everything except flags
- `$JIRA_PROJECT` = value after `--jira-project` flag (required only for new tickets)

**Step 2: Validate credentials**

Load @.claude/ink-workflows/workflows/ticket-resolver.md `validate_credentials` section.

**Step 3: Detect and resolve**

Load @.claude/ink-workflows/workflows/ticket-resolver.md `detect_ticket` section.

Then load the appropriate section:
- If `$DETECTED_KEY` is set: load `fetch_existing_ticket` section
- If `$DETECTED_KEY` is empty: load `create_new_ticket` section

Note: `$RUN_MODE` is always false for /ink:ticket (interactive only).

**Step 4: Confirm result**

Print:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Ink > TICKET RESOLVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Key:      $JIRA_KEY
  Summary:  $TICKET_SUMMARY
  Type:     $TICKET_TYPE
  Status:   $TICKET_STATUS
  URL:      $TICKET_URL
  Context:  .planning/jira/JIRA-CONTEXT.md

  Active ticket updated in STATE.md.

  Run /ink:go to start working.
```
</process>
