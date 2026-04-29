---
name: ink:jira
description: Analyze a Jira issue with configurable hierarchy depth
disable-model-invocation: false
user-invocable: false
allowed-tools: Bash, Write, Read, Grep, Glob
argument-hint: "[ISSUE-KEY] [--up|--down|--all]"
---

<objective>
Fetch a Jira issue via REST API and generate `.planning/jira/JIRA-CONTEXT.md` with complete context for working on the task. Single actor, zero handoffs.
</objective>

<process>

<step name="parse_arguments">
Parse `$ARGUMENTS`:

- **Issue key:** first word (e.g., `INK-9999`). Must match `[A-Z]+-[0-9]+`.
- **Hierarchy mode:** `--up`, `--down`, `--none`, or `--all` if present; otherwise defaults to `all`.

If no issue key or invalid format: stop and report `"Usage: /ink:jira ISSUE-KEY [--up|--down|--all]"`.
</step>

<step name="fetch_credentials">
Validate credentials at runtime. The script `jira-api.sh` obtains credentials internally in each invocation — they are never exposed in the console.

```bash
bash .claude/skills/ink-jira/jira-api.sh check-creds
```

If it prints `ERROR`: stop and report `"Jira credentials not found. Check that the credentials service is available."`.
</step>

<step name="add_ink_monitor_label">
**NON-NEGOTIABLE.** Must run before any data fetching. Do NOT skip or reorder.

```bash
bash .claude/skills/ink-jira/jira-api.sh add-label [ISSUE-KEY]
```

Report: `"ink-monitor label: HTTP ${status}"`. Continue regardless of status code.
</step>

<step name="fetch_jira_data">
Fetch main issue via REST API:

```bash
bash .claude/skills/ink-jira/jira-api.sh fetch-issue [ISSUE-KEY]
```

**If HTTP error or issue not found:** stop, report error with HTTP status, do NOT create file.

The script splits the response into 3 files to avoid Read tool token limits:
- `/tmp/jira-issue.json` — all fields (without changelog and renderedFields)
- `/tmp/jira-issue-changelog.json` — changelog only (for history section)
- `/tmp/jira-issue-rendered.json` — rendered HTML fields

**Data processing:** Use the **Read tool** to read these files — NEVER use `node -e` for JSON extraction (zsh corrupts `!==` operators). If a file is still too large, use `offset` and `limit` parameters.

**Hierarchy fetching (conditional on mode):**

For `--up` or `--all`: recursively fetch parent chain:

```bash
bash .claude/skills/ink-jira/jira-api.sh fetch-parent [PARENT-KEY]
```

For `--down` or `--all`: fetch subtasks and issue links. **This is mandatory — do NOT skip.**

**Step A — Extract subtask keys and link keys from the main issue.** Use the **Read tool** on `/tmp/jira-issue.json` and extract:
- `fields.subtasks[].key` — direct child subtasks
- `fields.issuelinks[].inwardIssue.key` and `fields.issuelinks[].outwardIssue.key` — linked issues

**Step B — Fetch each subtask with full details (recursively, max 3 levels deep).** For every subtask key found, run:
```bash
bash .claude/skills/ink-jira/jira-api.sh fetch-child [SUBTASK-KEY]
```
If a subtask itself has subtasks (`fields.subtasks`), recurse (max 3 levels total). Read each result with the **Read tool** to extract fields.

**Step C — Fetch each linked issue with summary details:**
```bash
bash .claude/skills/ink-jira/jira-api.sh fetch-link [LINK-KEY]
```
Group links by type (blocks, is blocked by, relates to, etc.) using `fields.issuelinks[].type.name` and direction (inward/outward).

**IMPORTANT:** You MUST actually execute these fetches for `--down` and `--all` modes. Do not skip or summarize — fetch every subtask and every linked issue individually.

For `--all` only: additionally fetch same-epic issues via:
```bash
bash .claude/skills/ink-jira/jira-api.sh fetch-epic [EPIC-KEY]
```

**SECURITY RULE:** The script handles credentials internally. NEVER add extra echo/print statements that could expose secrets.
</step>

<step name="format_and_write">
Create directory and write the context file:

```bash
mkdir -p .planning/jira
```

**CRITICAL — Data processing rules:**
- **NEVER use `node -e` for JSON processing.** zsh history expansion corrupts `!==` operators even in single-quoted scripts, causing `SyntaxError: missing ) after argument list`. Instead: use the **Read tool** to read `/tmp/jira-issue.json`, then parse and extract fields directly in your response.
- For the Raw Fields table: read the JSON with the Read tool, then construct the markdown table directly — do NOT use inline JS loops in bash.
- **ALWAYS use Bash** with `cat <<'JIRA_EOF' > .planning/jira/JIRA-CONTEXT.md` to create the file. The Write tool requires a prior Read of the target file, which fails on new files.

**STRICT TEMPLATE COMPLIANCE:** Before writing the file, you MUST read the template at `.claude/ink-workflows/templates/jira-context.md` using the **Read tool**. Then write `.planning/jira/JIRA-CONTEXT.md` following that template **exactly** — same section order, same formatting, same heading structure. Specific rules:

- **Do NOT invent alternative formats.** Use the exact format shown in the template (e.g., `**Field:** Value` on individual lines, NOT tables for issue fields; `###` subsections per hierarchy level, NOT tree diagrams; `###` entries for history, NOT tables).
- **Do NOT rename sections.** Use `### Subtasks`, NOT `### Siblings`. Use `### Links`, NOT `### Related`.
- **Do NOT reorder sections.** The template defines the order — follow it.
- **Do NOT omit conditional sections when the mode requires them.** For `all` mode: `## Hierarchy`, `## Related Issues` (with `### Subtasks`, `### Links`, AND `### Other Issues from Same Epic`) are ALL mandatory.
- **PII masking:** Use **display name ONLY** (e.g., "Juan Lopez"). NEVER include usernames or emails. If only a username is available (e.g., `marcela.trujillo`), convert to title case (e.g., "Marcela Trujillo").
- **YAML frontmatter** must include: `requested_issue_key`, `ticket_status`, `hierarchy_mode`, `generated`.

After the file is written, clean up temp files:
```bash
bash .claude/skills/ink-jira/jira-api.sh cleanup
```
</step>

<step name="return_summary">
Output exactly this structure:

```markdown
## JIRA CONTEXT COMPLETE

**Issue:** [KEY] - [Summary]
**Type:** [Story/Bug/Task]
**Status:** [Status]
**Hierarchy mode:** [none|up|down|all]
**File:** .planning/jira/JIRA-CONTEXT.md

**Content included:**

- Main issue with complete information and all custom fields
- [Hierarchy up to epic | Hierarchy skipped (mode: none/down)]
- [[N] related issues (subtasks, links) | Related issues skipped (mode: none)]
- [[N] same-epic issues (max 30) | Same-epic skipped (mode: none/up/down)]
- Important history
- Raw Fields section

Ready to use with /ink:go or /ink:debug.
```

On error:

```markdown
## JIRA CONTEXT FAILED

**Issue:** [KEY]
**Error:** [Error message]

**Diagnostic:**

- [What went wrong]
- [Possible solutions]

Please verify the issue key and Jira credentials.
```
</step>

</process>

<error_handling>
**If the issue doesn't exist:** show clear error, suggest verifying issue key, don't create file.
**If information is missing:** continue with available info, note what's missing in the file.
**If Jira connection fails:** show HTTP status, check credentials service reachability, don't create partial file.
</error_handling>

<constraints>
- No issue modification — read only (except ink-monitor label in step 3)
- No implementation — context files only
- No MCP for Jira — always direct HTTP calls
- No comment fetching — comments are excluded entirely
- No decision making — report what exists, don't filter by opinion
- NEVER use `node -e` for JSON processing — always use the Read tool to read JSON files and process data in-context
- Always use Bash heredoc (`cat <<'JIRA_EOF' >`) for creating `.planning/jira/JIRA-CONTEXT.md` — the Write tool errors on new files
</constraints>
