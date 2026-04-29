---
name: ink:epicstories
description: Create Jira Epic and Stories from a Customer Request or feature description
argument-hint: "[Customer Request or feature description] [--project PROJECT_KEY]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

<objective>
Transform a Customer Request (or conversationally gathered requirements) into a Jira Epic and Story specifications, then create them in Jira. Use British spelling throughout.
</objective>

<process>

<step name="validate">
1. Validate Jira credentials:
   ```bash
   bash .claude/skills/ink-jira/jira-api.sh check-creds
   ```
   If ERROR: stop and report credentials issue.
2. Parse `--project` from $ARGUMENTS if present. If not provided, will auto-discover "E2E TEST" project.
3. Proceed to workflow.
</step>

<step name="execute">
Load and execute @.claude/ink-workflows/workflows/epicstories.md with `$ARGUMENTS` as input.
</step>

</process>
