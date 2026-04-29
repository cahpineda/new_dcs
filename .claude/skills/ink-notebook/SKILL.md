---
name: ink-notebook
description: Query your personal NotebookLM for citation-backed answers from your own documents. Use when you need answers grounded in your uploaded sources (PDFs, specs, ADRs, wikis) without loading files into context.
argument-hint: "[query]"
allowed-tools:
  - Read
  - Bash
  - mcp__notebooklm__ask_question
  - mcp__notebooklm__setup_auth
  - mcp__notebooklm__list_notebooks
  - mcp__notebooklm__add_notebook
  - mcp__notebooklm__select_notebook
  - mcp__notebooklm__search_notebooks
  - mcp__notebooklm__get_health
user-invocable: true
---

<objective>
Query the developer's personal Google NotebookLM notebook for citation-backed answers,
using the notebooklm MCP server instead of loading source documents into context.
</objective>

<usage>
/ink:notebook [your query]

Examples:
- /ink:notebook How does the checkout flow work?
- /ink:notebook authentication architecture decisions
- /ink:notebook What are the API rate limits?

First-time setup:
- /ink:notebook auth      → authenticate with Google
- /ink:notebook add [url] → add a notebook to your library
</usage>

<process>

<step name="validate_query">
If there is no query in $ARGUMENTS:

```
Usage: /ink:notebook <query>

Examples:
  /ink:notebook How does the checkout flow work?
  /ink:notebook authentication architecture decisions

First time? Run:
  /ink:notebook auth
```

Exit if no query provided.
</step>

<step name="handle_special_commands">
Parse $ARGUMENTS case-insensitively to detect special commands:

**"auth"** — `$ARGUMENTS.trim().toLowerCase() === "auth"`:
1. Call `mcp__notebooklm__setup_auth`
2. A Chrome window will open — log in with your Google account
3. Credentials are saved locally for future sessions
4. Display: "✓ Authenticated. Now add a notebook with /ink:notebook add [url]"
5. Stop.

**"add [url]"** — `$ARGUMENTS.trim().toLowerCase().startsWith("add ")`:
1. Extract URL: everything after the first word → `const url = $ARGUMENTS.trim().slice(4).trim()`
2. If url is empty → display:
   ```
   Usage: /ink:notebook add [notebook URL]
   Get the URL from notebooklm.google.com → Share → Anyone with link
   ```
   Stop.
3. Call `mcp__notebooklm__add_notebook` with the extracted URL — the tool guides through metadata (name, description, topics) conversationally
4. Stop.

**"list"** — `$ARGUMENTS.trim().toLowerCase() === "list"`:
1. Call `mcp__notebooklm__list_notebooks`
2. Display the result
3. Stop.

**"health"** — `$ARGUMENTS.trim().toLowerCase() === "health"`:
1. Call `mcp__notebooklm__get_health`
2. Display auth state, active sessions, configuration
3. Stop.

If none of the above match, proceed to `query_notebook`.
</step>

<step name="query_notebook">
Query the active notebook with the user's question:

1. **Call the query tool:**
   - Tool: `mcp__notebooklm__ask_question`
   - Parameter `question`: $ARGUMENTS
   - Optional `session_id`: reuse if available for follow-up questions

2. **If the tool returns an auth error:** Display:
   ```
   Not authenticated yet. Run:
     /ink:notebook auth
   Then log in with your Google account.
   ```
   Stop.

3. **If no notebook is selected:** Display:
   ```
   No notebook selected. Add one first:
     /ink:notebook add [your notebook URL]

   Get the URL from notebooklm.google.com → Share → Anyone with link.
   ```
   Stop.
</step>

<step name="present_results">
Format and display the response:

```
## NotebookLM Result

**Query:** {$ARGUMENTS}

### Answer

{response from tool}

### Sources

{citations from tool, one per line prefixed with -}
```

If the tool returns no citations, omit the Sources section.
</step>

</process>
