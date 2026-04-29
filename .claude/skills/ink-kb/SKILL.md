---
name: ink-kb
description: Query INK's knowledge base for business rules, documentation, policies, data validation standards, and technical guidelines. Use when you need context about INK business processes, integration patterns, compliance requirements, or operational standards.
argument-hint: "[query]"
hooks:
  UserPromptSubmit:
    - matcher: ""
      hooks:
        - type: prompt
          prompt: |
            You improve vague queries for INK Aviation's knowledge base.

            QUERY: $ARGUMENTS

            If the query is short or vague (1-3 words, lacks specific context):
            - Expand it into a complete, specific question about INK Aviation
            - Add relevant domain terms where appropriate: aviation, compliance, validation, authentication, approval, data retention, policy, workflow
            - Keep the improvement concise (1 sentence)
            - Return ONLY: {"ok": false, "reason": "<improved query text>"}

            If the query is already a clear, complete question:
            - Return ONLY: {"ok": true}

            EXAMPLES:
            - "email" → {"ok": false, "reason": "What are the email validation rules and formats accepted in INK Aviation's platform?"}
            - "user access" → {"ok": false, "reason": "What are the user access control and authorization policies in INK Aviation?"}
            - "What are the data retention policies for customer records?" → {"ok": true}
            - "invoice approval workflow steps" → {"ok": true}
          model: claude-3-5-haiku-20241022
          timeout: 20
          statusMessage: Improving KB query...
allowed-tools:
  - Read
  - Grep
  - Bash
  - mcp__ink-kb-mcp__list_folders
  - mcp__ink-kb-mcp__rag_query_simple
disable-model-invocation: false
user-invocable: true
---

<objective>
Query INK's Knowledge Base for information about business rules, policies, and technical documentation.
</objective>

<usage>
/ink:kb [your query]

Examples:
- /ink:kb What are the validation rules for users?
- /ink:kb data retention policy
- /ink:kb payment approval workflow
</usage>

<process>

<step name="validate_query">
If there is no query in $ARGUMENTS:

```
Usage: /ink:kb <query>

Examples:
  /ink:kb validation rules for users
  /ink:kb data retention policy
  /ink:kb confluence documentation about X

See [examples.md](examples.md) for more examples.
```

Exit if no query provided.
</step>

<step name="detect_folder">
Detect if the query explicitly references a folder:

1. **Check for folder keywords in query:**
   - Extract $ARGUMENTS and analyze for folder references
   - Common folder keywords: "policies", "confluence", "test-drive", or specific folder names
   - Match case-insensitive

2. **If folder is explicitly mentioned:**
   - Set `$SELECTED_FOLDER` to the mentioned folder
   - Remove folder reference from query text for cleaner search
   - Skip to step "execute_query"

3. **If NO folder is explicitly mentioned:**
   - Proceed to "select_folder" step
</step>

<step name="select_folder">
Automatically select the most appropriate folder using descriptions from the MCP:

1. **List available folders with descriptions:**
   - Call `list_folders` from `ink-kb-mcp`
   - The tool returns folders with names and descriptions
   - Store result in `$AVAILABLE_FOLDERS`

2. **Select best folder using folder descriptions:**
   - Read the name and description of each folder
   - Compare the user's query intent against each folder's description
   - Assign a confidence level: **high** (one folder clearly fits) or **low** (ambiguous/no clear match)

3. **If confidence is HIGH:**
   - Set `$SELECTED_FOLDER` to the best matching folder
   - Log: `[Auto-selected folder: {$SELECTED_FOLDER}]`
   - Proceed to `execute_query`

4. **If confidence is LOW — ask the user to choose:**
   - Display available folders with their names and descriptions:
   ```
   I'm not sure which folder best matches your query. Please choose one:

   1. **{folder_name}** — {description}
   2. **{folder_name}** — {description}
   ...

   Reply with the number or folder name to continue.
   ```
   - Wait for user response
   - Set `$SELECTED_FOLDER` to the user's selection
   - Proceed to `execute_query`
</step>

<step name="execute_query">
Execute RAG query on the Knowledge Base:

1. **Call rag_query_simple:**
   - Tool: `rag_query_simple` from `ink-kb-mcp`
   - Parameters:
     - `folder_path`: $SELECTED_FOLDER
     - `query`: $ARGUMENTS (cleaned query text)

2. **Present response:**

```
## Knowledge Base Result

**Query:** {$ARGUMENTS}
**Folder:** {$SELECTED_FOLDER}

### Answer

[response from tool]

### Sources

- [source 1]
- [source 2]

**Chunks analyzed:** [chunks_used]
```

See [reference.md](reference.md) for MCP details.
</step>

</process>

<references>
- [reference.md](reference.md) - MCP server documentation
- [examples.md](examples.md) - Query examples
</references>
