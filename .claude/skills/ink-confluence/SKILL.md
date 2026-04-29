---
name: ink:confluence
description: Read, write, and manage Confluence pages and folders — fetch content, search spaces, create/update pages, manage folders
disable-model-invocation: false
user-invocable: true
allowed-tools: Bash, Write, Read, Grep, Glob
argument-hint: "[read|write|search|folder] [page-id|title|query] [options]"
---

<objective>
Interact with Confluence via REST API — read pages, search content, create/update pages, and manage folders. Single actor, zero handoffs. All operations go through `confluence-api.sh` which handles credentials internally.
</objective>

<process>

<step name="parse_arguments">
Parse `$ARGUMENTS`:

- **Mode:** first word — `read`, `write`, `search`, `folder`, or `delete`. Must be one of these.
- **Options:** remaining arguments parsed by mode (see below).

**Modes and arguments:**

| Mode | Usage | Required args |
|------|-------|---------------|
| `read` | `read <page-id> [--children]` | page-id |
| `write` | `write --title "X" --parent <id> --space <key> --file <path>` | title, parent, space, file |
| `write` | `write --page-id <id> --file <path> [--title "X"] [--parent <id>]` | page-id, file |
| `search` | `search "query text" --space <key>` | query, space |
| `search` | `search --title "Exact Title" --space <key>` | title, space |
| `folder` | `folder list <parent-id>` | parent-id |
| `folder` | `folder create --title "X" --parent <id> --space-id <numeric-id>` | title, parent, space-id |
| `folder` | `folder get-or-create --title "X" --parent <id> --space-id <numeric-id>` | title, parent, space-id |
| `delete` | `delete <page-id>` | page-id |

If no mode or invalid mode: stop and report usage.
If required args missing: stop and report which args are needed.
</step>

<step name="fetch_credentials">
Validate credentials at runtime. The script `confluence-api.sh` obtains credentials internally from the same service as Jira — they are never exposed in the console.

```bash
bash .claude/skills/ink-confluence/confluence-api.sh check-creds
```

If it prints `ERROR`: stop and report `"Confluence credentials not found. Check that the credentials service is available and that ~/.claude.json contains your oauthAccount.emailAddress."`.
</step>

<step name="execute_operation">
Execute the operation based on mode:

**read:**
```bash
bash .claude/skills/ink-confluence/confluence-api.sh fetch-page <PAGE-ID>
# Output: /tmp/confluence-page-{id}.json
```
If `--children` flag present:
```bash
bash .claude/skills/ink-confluence/confluence-api.sh fetch-children <PAGE-ID>
# Output: /tmp/confluence-children-{id}.json
```

**write (by title — smart create-or-update):**
```bash
bash .claude/skills/ink-confluence/confluence-api.sh write-page "<TITLE>" <PARENT-ID> <SPACE-KEY> <FILE-PATH>
# Output: JSON with id, url, action (created/updated)
```

**write (by page-id — update existing):**
```bash
bash .claude/skills/ink-confluence/confluence-api.sh update-page <PAGE-ID> <FILE-PATH> [TITLE] [PARENT-ID]
# Output: JSON with id, url, action (updated), version
```

**search (free text):**
```bash
bash .claude/skills/ink-confluence/confluence-api.sh search "<QUERY>" <SPACE-KEY>
# Output: /tmp/confluence-search.json
```

**search (exact title):**
```bash
bash .claude/skills/ink-confluence/confluence-api.sh check-exists "<TITLE>" <SPACE-KEY>
# Output: /tmp/confluence-search.json
```

**folder list:**
```bash
bash .claude/skills/ink-confluence/confluence-api.sh list-folder-children <PARENT-ID>
# Output: /tmp/confluence-folder-children-{id}.json
```

**folder create:**
```bash
bash .claude/skills/ink-confluence/confluence-api.sh create-folder "<TITLE>" <PARENT-ID> <SPACE-ID>
# Output: JSON with id, title, action (created)
```

**folder get-or-create:**
```bash
bash .claude/skills/ink-confluence/confluence-api.sh get-or-create-folder "<TITLE>" <PARENT-ID> <SPACE-ID>
# Output: JSON with id, title, action (found/created)
```

**delete:**
```bash
bash .claude/skills/ink-confluence/confluence-api.sh delete-page <PAGE-ID>
# Output: JSON with id, action (deleted)
```
</step>

<step name="process_results">
Read JSON results using the **Read tool** — NEVER use `node -e` for JSON processing (ZSH history expansion corrupts `!==` operators).

**For read mode:**
- Read `/tmp/confluence-page-{id}.json` with the Read tool
- Extract: title, version number, ancestor path, body.storage.value (content)
- If content is very large (>5000 chars), show first 2000 chars with a note about truncation

**For read --children:**
- Also read `/tmp/confluence-children-{id}.json`
- Extract: list of child pages with title, id, version

**For write mode:**
- Parse the JSON output from stdout (id, url, action)
- No temp file to read

**For search mode:**
- Read `/tmp/confluence-search.json`
- Extract: results array with title, id, type, URL for each match

**For folder mode:**
- Read `/tmp/confluence-folder-children-{id}.json` (for list)
- Or parse stdout JSON (for create/get-or-create)

**For delete mode:**
- Parse the JSON output from stdout (id, action)
</step>

<step name="output">
Format and display results:

**read:**
```markdown
## Confluence Page

**Title:** [title]
**ID:** [id]
**Version:** [number]
**Path:** [ancestor1] > [ancestor2] > [title]

### Content
[body.storage.value — rendered or raw depending on length]
```

**write:**
```markdown
## Page [Created/Updated]

**Title:** [title]
**ID:** [id]
**URL:** [full URL]
**Version:** [number, if updated]
```

**search:**
```markdown
## Search Results ([count] found)

| Title | ID | Type | URL |
|-------|-----|------|-----|
| [title] | [id] | [page/blogpost] | [url] |
```

**folder:**
```markdown
## Folder Contents ([count] items)

| Title | ID | Type |
|-------|-----|------|
| [title] | [id] | [folder/page] |
```

**delete:**
```markdown
## Page Deleted

**ID:** [id]
**Status:** Deleted successfully
```

On error: show HTTP status code and error message with a suggestion (check page ID, check permissions, check space key).
</step>

<step name="cleanup">
After processing, clean up temp files:

```bash
bash .claude/skills/ink-confluence/confluence-api.sh cleanup
```
</step>

</process>

<error_handling>
**If credentials fail:** show clear error, suggest checking ~/.claude.json and credential service reachability.
**If page not found (404):** show error, suggest verifying page ID or title.
**If permission denied (403):** show error, note that the user may not have access to the space or page.
**If space not found:** show error, suggest checking space key.
**If content file not found:** show error, verify file path before calling write operations.
</error_handling>

<constraints>
- No page modification without explicit user request — read operations are safe, write/delete require intent
- Credentials never exposed in output — all credential handling is in confluence-api.sh
- NEVER use `node -e` for JSON processing — always use the Read tool to read JSON files and process data in-context
- Use Bash to call confluence-api.sh subcommands — do not construct HTTP requests directly
- Always run cleanup after operations complete
</constraints>
