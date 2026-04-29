<purpose>
Generate product catalogue pages for Confluence in the Ink Product Catalogue style.
Sourced from live codebase analysis via project2context MCP.
</purpose>

<process>

<step name="start">
When invoked with $ARGUMENTS:

1. Parse the user's description from $ARGUMENTS.
2. Read @.claude/ink-workflows/references/productcat-confluence.md for page IDs and section mapping.
3. Determine from the description what is being requested:
   - A **section overview page** (broad topic like "load control", "baggage drop") — goes under Departure Control folder directly
   - A **feature detail sub-page** (specific capability like "split baggage allowance", "seat upgrade at gate") — goes under an existing section
   - An **integration page** (a third-party or internal system integration) — goes under Integrations folder
4. If the page type and location are clear, proceed. If genuinely ambiguous between section vs feature, ask.
5. If the location is a sub-page, identify which section overview page it belongs under (from the confluence config reference). If the section does not exist yet, note that a section overview will need to be created first.
6. Ask no more than TWO clarifying questions total if something is ambiguous. Bias toward action.
</step>

<step name="research">
Before writing anything, use project2context MCP tools to gather grounding facts from the codebase.

First, verify P2C availability: `node bin/ink-tools.js mcp check project2context`

**If P2C available**, run these queries as relevant to the topic:
- `mcp__project2context__query_functions` — keywords from the feature name
- `mcp__project2context__search_api_by_functionality` — describe the feature in plain terms
- `mcp__project2context__query_classes` — keywords from the feature name
- `mcp__project2context__trace_call_path` — from entry function to outcome (if clear entry point)
- `mcp__project2context__find_similar_code` — describe the pattern (if needed)

**If P2C unavailable**, use Grep and Glob to find relevant code.

From this research, extract:
- What the feature actually does (not what you assume — what the code does)
- The key steps in the flow (entry point → processing → output)
- Edge cases and failure conditions (error handling, validation rules)
- What data is involved (inputs, outputs, key fields)
- Which other systems or modules it connects to

**Translation rule:** Convert every technical implementation detail to its user-visible equivalent:
- `validateTimatic()` → "validates the passenger's documents against IATA TIMATIC in real time"
- `BullMQ queue` → "processed reliably via a message queue, even during high traffic"
- `SSR WCHR` → "wheelchair assistance request (WCHR)"
- Database table reference → describe what data it represents to the user
</step>

<step name="generate">
Read @.claude/ink-workflows/references/productcat-style.md for style rules, personas, and format specifications.

Generate the page content in Confluence storage format (XHTML), following the style rules exactly for the determined page type (section overview or feature detail).

Save the generated content to `/tmp/productcat-content.html`.
</step>

<step name="verify">
Before publishing, programmatically verify:
- [ ] Relevant Personas banner present and uses correct persona names from the reference list
- [ ] Intro description banner present
- [ ] "How It Works" section has BOTH a Recommended Screenshot panel AND a Mermaid flowchart
- [ ] Mermaid diagram is `flowchart LR` and has no more than 12 nodes
- [ ] Key Capabilities (section pages) or How It Works numbered steps (feature pages) are present
- [ ] Business Value banner present on feature sub-pages
- [ ] What Can Go Wrong section present on feature sub-pages
- [ ] No em dashes in prose text (only &mdash; in HTML is acceptable)
- [ ] British English spelling (behaviour, colour, licence, recognise, programme)
- [ ] No overly technical internal code references (function names, table names, queue names) in final output

If any check fails, fix the content and re-verify before proceeding.
</step>

<step name="publish">
Publish to Confluence using ink:confluence skill:

```bash
bash .claude/skills/ink-confluence/confluence-api.sh write-page "<PAGE_TITLE>" <PARENT_ID> PRODUCTK /tmp/productcat-content.html
```

Where PARENT_ID comes from the classification in step 1 (read from productcat-confluence.md reference).

After publishing:
- Print the Confluence URL to the user
- If section overview: "Feature detail sub-pages can now be added under this section with `/ink:productcat [feature name]`"
- If feature sub-page: "You can add screenshots to the 'Recommended Screenshot' placeholders by editing the page in Confluence"

Clean up:
```bash
bash .claude/skills/ink-confluence/confluence-api.sh cleanup
rm -f /tmp/productcat-content.html
```
</step>

</process>
