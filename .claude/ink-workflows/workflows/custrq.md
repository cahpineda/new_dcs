<purpose>
Create an Ink Innovation Customer Request document by conversationally gathering product or feature requirements. Publishes to Confluence under the Customer Requests folder, organised by airline.
</purpose>

<process>

<step name="resolve-iata-code">
Whenever a customer name is provided (during collection or at generation time), check whether it looks like an IATA airline designator code — that is, it consists of only 2 or 3 letters (e.g. "RX", "EK", "BA", "UAL").

If it matches that pattern:
1. Use WebSearch to search for: `IATA airline designator code "[CODE]" airline name`
2. From the results, extract the full airline name (e.g. "RX" → "Riyadh Air").
3. Replace the customer value with the full airline name everywhere: in the document body, the Confluence page Customer field, and the folder name.
4. If the search returns no confident match (ambiguous or no results), keep the original code and add a note: "Customer code [CODE] could not be resolved to a full airline name — please verify."

Do not apply this check to names that already look like full names (contain a space, or more than 3 characters).
</step>

<step name="fetch-template">
At the start of every generate step, fetch the current template to check for changes:

```bash
bash .claude/skills/ink-confluence/confluence-api.sh fetch-page 1753481219
```

Then read the template content with the **Read tool**:
- Read `/tmp/confluence-page-1753481219.json`
- Extract `body.storage.value` to check if the template structure has changed

If the template has changed since the reference in @.claude/ink-workflows/references/custrq-template.md, update the document structure, roles list, systems list, and Confluence page builder accordingly before generating.
</step>

<step name="start">
When the skill is invoked with $ARGUMENTS:

1. Read the initial description from $ARGUMENTS.
2. Read @.claude/ink-workflows/references/custrq-template.md for required fields and template structure.
3. Analyse what can already be inferred from the description.
4. List internally what is known and what is still missing.
5. Greet the user briefly and confirm what you understood, then ask up to three questions about the most important missing fields.

If $ARGUMENTS is empty, ask the user to describe the feature or product they would like to document.

Do not ask for information that can be reasonably inferred from the description already given.
</step>

<step name="collect">
On each subsequent turn:

1. Acknowledge and record the information the user has just provided.
2. Check which required fields are still missing.
3. If the customer name is missing, blank, or "TBC", stop and ask for it before asking anything else. Do not proceed to generation without a real company name.
4. If required fields remain, ask up to three questions in a conversational tone. Prioritise the most important gaps first (customer name, problem, users, workflow, scenarios, user stories).
5. Before generating, always confirm who the document author should be (for the Version Control table "Author" column) if not already provided. This is a required field before generation.
6. If all required fields are collected, proceed to the "generate" step. Optionally confirm: "I have everything I need. Shall I generate the Customer Request document now?"

Keep each set of questions brief and focused. Do not repeat questions already answered.
</step>

<step name="generate">
When all required fields are collected, do the following in order:

**Part 1: Display the document in the chat**

Format rules:
- Use British English spelling throughout.
- Do not use em dashes. Use commas, colons, or rephrase instead.
- Do not use graphical icons or emoji.
- Bullet points and numbered lists are permitted.
- Do not insert horizontal lines or dividers between sections.
- Use bold headings for each section.
- Version Control row 1.0: date = today, changes = "First Draft/Customer Questionnaire", author = provided name or "TBC".

Display the full document in chat using the template structure from the reference.

**Part 2: Publish to Confluence**

Target location:
- Space key: PRODUCTK
- Parent folder ID: 1755316225 (Customer Requests)

**Folder logic:** Customer Request pages must live inside a child folder named after the customer/airline:

```bash
# Get or create the airline folder
bash .claude/skills/ink-confluence/confluence-api.sh get-or-create-folder "<CUSTOMER_NAME>" 1755316225 1171423245
```

Parse the returned JSON to get the folder ID.

**Page title format:** `[Feature Name]` — no "Customer Request:" prefix.

**Build and publish:**

1. Generate the Confluence storage format (XHTML) matching the template structure exactly. Use the roles and systems lists from the reference (or updated from live template if changed).

2. Save the XHTML content to `/tmp/custrq-content.html`.

3. Publish:
```bash
bash .claude/skills/ink-confluence/confluence-api.sh write-page "<PAGE_TITLE>" <FOLDER_ID> PRODUCTK /tmp/custrq-content.html
```

4. Print the Confluence URL to the user.

5. Clean up:
```bash
bash .claude/skills/ink-confluence/confluence-api.sh cleanup
rm -f /tmp/custrq-content.html
```

If the publish fails, show the error and offer to retry or save as a local markdown file.
</step>

</process>

<style_guide>
- Conversational but professional in tone during collection.
- Concise questions — one sentence each where possible.
- No jargon unless the user has used it first.
- When generating the document, adopt a formal, clear, document style.
- If the user provides information in American English spelling, silently convert it to British English in the final document.
- Do not flag or comment on spelling corrections — just apply them.
</style_guide>
