---
name: ink:qa-test-cases
description: Generate test cases using ink-qa-rag — retrieves similar existing tests, suggests reuse, and creates new cases aligned with validated patterns
argument-hint: [TICKET-KEY | "ticket title and description" | --jira]
allowed-tools:
  - Read
  - Bash
  - mcp__ink-qa-rag__rag_query
---

<objective>
Generate high-quality, non-duplicative test cases for a given ticket by:
1. Querying `ink-qa-rag` for semantically similar existing test cases and test sets
2. Identifying which existing tests already cover the scenario (suggest reuse)
3. Detecting coverage gaps and generating new test cases aligned with existing patterns

This is RAG-augmented generation — not naive prompting. Output is grounded in institutional test knowledge.
</objective>

<context>
Arguments: $ARGUMENTS

**Input modes (in priority order):**
- `TICKET-KEY` (e.g., `ACA-1234`): Read from `.planning/jira/JIRA-CONTEXT-[KEY].md` or `.planning/jira/JIRA-CONTEXT.md`
- `--jira`: Read from `.planning/jira/JIRA-CONTEXT.md` (active ticket)
- `"inline text"`: Use provided title/description directly
- No args: Read from `.planning/jira/JIRA-CONTEXT.md` if it exists, else prompt user for input

**Output:** Markdown test case document displayed in chat (and optionally saved)
</context>

<process>

## Step 1 — Parse Input and Extract Ticket Context

**Determine input mode from `$ARGUMENTS`:**

- If arg matches `[A-Z]+-[0-9]+`: Look for `.planning/jira/JIRA-CONTEXT-[KEY].md`, fallback to `.planning/jira/JIRA-CONTEXT.md`
- If arg is `--jira` or empty: Read `.planning/jira/JIRA-CONTEXT.md`
- Otherwise: treat `$ARGUMENTS` as inline ticket description

**Extract from Jira context file (if used):**

Read the file with the Read tool. Extract:
- `ticket_title`: from the `# KEY: Summary` heading
- `ticket_description`: the ## Description section content
- `ticket_type`: Bug / Story / Feature / Sub-task
- `ticket_key`: from frontmatter `requested_issue_key`
- `affected_system`: from Raw Fields (customfield_10086 if present)

**If no input is available:** Stop and output:
```
No ticket context found. Provide input as:
  /ink:qa-test-cases ACA-1234          # from saved Jira context
  /ink:qa-test-cases "Login fails..."  # inline description
  /ink:qa-test-cases --jira            # active ticket
```

---

## Step 2 — RAG Query Strategy (4 targeted queries)

Run all 4 queries using `mcp__ink-qa-rag__rag_query`. Execute them to maximize coverage from different angles.

**Query construction rules:**
- Keep queries focused and specific (1-2 sentences max)
- Use functional language, not Jira ticket language
- Include the affected system/module when known

**Query 1 — Broad semantic match (mode: mix)**
Find existing test cases covering the same feature or functional area:
```
Query: "test cases for [ticket_title] [affected_system if known]"
Mode: mix
```

**Query 2 — Happy path / functional scenarios (mode: local)**
Find existing positive/functional tests for the main flow:
```
Query: "functional test cases [main action from description] expected behavior [affected_system]"
Mode: local
```

**Query 3 — Edge cases and negative scenarios (mode: global)**
Find existing negative and boundary tests for this domain:
```
Query: "negative test cases error handling edge cases [domain/module from description]"
Mode: global
```

**Query 4 — Test set discovery (mode: mix)**
Find test sets that group related tests — to understand coverage context:
```
Query: "test set [affected_system or feature area] validation regression"
Mode: mix
```

After running all queries, collect and deduplicate results by test case ID/title.

> **Note:** The RAG returns test cases in full XRay format — each result includes `Description`, `Preconditions`, `Expected Result`, and `Steps[]` with `Action`, `Data`, and `Expected Result` per step. Extract and use **all these fields explicitly** in the analysis below, not just titles or summaries.

---

## Step 3 — Analyze Retrieved Context (XRay-structured)

The `ink-qa-rag` MCP returns test cases with the full XRay structure. Parse each retrieved test case field by field:

**A. From `Description` fields:**
- Understand exactly which functional scenario each existing test covers
- Compare against the ticket's acceptance criteria word by word
- Flag tests whose Description directly overlaps the new ticket's scope

**B. From `Preconditions` fields:**
- Extract reusable precondition blocks (system state, user roles, data setup)
- Identify the standard precondition patterns for this domain/module
- These preconditions can be copied verbatim or minimally adapted for new test cases

**C. From `Expected Result` fields (test level):**
- Understand what "done" looks like for similar scenarios in this system
- Use as a template for writing the overall Expected Result of new test cases
- Detect overlap: if an existing Expected Result matches the ticket's acceptance criteria → flag as reuse candidate

**D. From `Steps[].Action` fields:**
- Extract the action vocabulary used in this domain (specific UI elements, button names, field labels, API operations)
- Identify standard navigation sequences that apply to the new scenario (can be reused as-is)
- Note imperative verb patterns: "Click on", "Paste", "Enter", "Select", "Navigate to", etc.

**E. From `Steps[].Data` fields:**
- Extract real test data formats already validated: MRZ strings, flight numbers, passenger IDs, document types, date formats
- These are ready-to-use data values — reuse them in new test cases when the data type matches
- If Data is "None" consistently for a step type → follow the same pattern

**F. From `Steps[].Expected Result` (per-step) fields:**
- Learn how immediate system responses are described for this module (UI messages, state changes, field values populated)
- Copy or adapt the phrasing style for new step-level Expected Results
- Multiple outcomes per step use `-` bullet prefix — follow that convention

**G. Reusability classification (based on full structure):**
- **Full reuse**: Description + Expected Result + Steps cover the scenario completely → suggest as-is
- **Partial reuse**: Steps 1-N are identical, but missing edge/negative variant → suggest + note what to change
- **Step-level reuse**: Individual steps (Action/Data/Expected Result rows) can be copy-pasted into new test cases

**H. Coverage gaps (what's NOT covered):**
- Map each acceptance criterion from the ticket against existing `Description` and `Expected Result` fields
- For each gap: note which step sequences are available to reuse vs. which need to be written fresh

---

## Step 4 — Generate New Test Cases

For each coverage gap identified in Step 3, generate a new test case **directly grounded in the retrieved XRay data**:
- Reuse `Preconditions` blocks from similar tests (adapt minimally)
- Reuse or extend `Steps[]` sequences extracted from retrieved tests
- Use `Data` values from similar tests when the data type matches
- Match the `Expected Result` phrasing style from existing tests in the same module

**Test case types to generate:**
- Functional (happy path) — verify the main scenario works
- Edge cases — boundary values, unusual inputs, system limits
- Negative scenarios — invalid inputs, error flows, unauthorized access
- Regression guard — ensure existing behavior is not broken by the change

**Format each test case as (XRay-compatible structure):**

```markdown
### TC-[NNN]: [Action verb] + [what] + [condition/context]

**Type:** Functional | Edge Case | Negative | Regression
**Priority:** High | Medium | Low
**Test Set:** [suggested test set name from RAG]

**Description:**
[One sentence stating what this test verifies — matches the XRay "Description" field]

**Preconditions:**
- [System/environment condition that must be true before starting]
- [User role, permissions, or account state required]
- [Data or configuration that must exist]

**Expected Result:**
[Overall expected outcome of the entire test — the final state the system must reach]

**Steps:**

| # | Action | Data | Expected Result |
|---|--------|------|-----------------|
| 1 | [What to do — imperative verb, specific UI element or API] | [Test data value, or "None"] | [Observable outcome after this specific action] |
| 2 | [Next action] | [Data value or "None"] | [What happens immediately after this step] |
| 3 | [Next action] | [Data value or "None"] | [Specific observable outcome] |

**Notes:** [Optional — edge case rationale, related existing test ID, known constraints]
```

**Step writing rules (from XRay patterns):**
- **Action**: imperative verb + specific element (e.g., "Click on the F9 search field.", "Paste the MRZ code string into the search field.")
- **Data**: specific test value when the step requires input (e.g., "MRZ: P<ESPESP1234567891ESP8001011M2501010<<<<<<<<<<<<<<<4"), or "None" when no data is needed
- **Expected Result per step**: what the system does *immediately* after that action (e.g., "-The F9 search field is highlighted.\n-The system focuses on the search input field.")
- Multiple expected results per step use `-` bullet prefix on separate lines
- Overall **Expected Result** (test level) = the final verified state, not repeated from steps

**Naming TC-NNN:**
- Number sequentially starting at TC-001 within this output
- Use existing numbering conventions found in RAG results if available

---

## Step 5 — Output Report

Display the final structured report:

```markdown
# Test Cases — [TICKET-KEY]: [Ticket Title]

> Generated: [date] | RAG queries: 4 | Source: ink-qa-rag

---

## Existing Tests to Reuse

> These tests already exist in the system and cover this scenario. Review before creating new ones.

| Test Case | Coverage | Reusability | Test Set |
|-----------|----------|-------------|----------|
| [ID/Title from RAG] | [what it covers] | Full / Partial | [set name] |

[If none found: "No existing tests found with sufficient overlap — all scenarios require new test cases."]

---

## Relevant Test Sets

> Add new test cases to these existing test sets:

- **[Test Set Name]**: [what it covers, why relevant]

[If none found: "No existing test sets identified — consider creating a new test set for [feature/module]."]

---

## New Test Cases

> [N] new test cases generated based on coverage gaps. Patterns aligned with existing tests from ink-qa-rag.

### Functional Tests

[Test cases here]

### Edge Cases

[Test cases here]

### Negative Scenarios

[Test cases here]

---

## Coverage Summary

| Acceptance Criteria | Covered By |
|--------------------|------------|
| [Criterion from ticket] | Existing: [TC-ID] / New: TC-001 |
| [Criterion] | New: TC-002, TC-003 |

---

## RAG Query Summary

| Query | Mode | Results |
|-------|------|---------|
| Broad match: [title] | mix | [N] results |
| Functional: [main action] | local | [N] results |
| Negative/edge: [domain] | global | [N] results |
| Test sets: [area] | mix | [N] results |
```

---

## Step 6 — Optional Save

After displaying the report, ask:

```
Save test cases to file? (y/n)
  → Yes: saves to .planning/qa/TEST-CASES-[TICKET-KEY]-[timestamp].md
  → No: output only (default)
```

If user confirms save, write the full report to the file using the Bash tool with a heredoc.

</process>

<success_criteria>
- [ ] Ticket context extracted (from Jira file or inline input)
- [ ] All 4 RAG queries executed against ink-qa-rag
- [ ] Existing tests identified and classified (reuse / partial / reference)
- [ ] Relevant test sets surfaced
- [ ] Coverage gaps mapped against acceptance criteria
- [ ] New test cases generated for each uncovered gap
- [ ] Every test case includes: Description, Preconditions, Expected Result (test level), and Steps table
- [ ] Every step in the Steps table has 3 columns: Action | Data | Expected Result
- [ ] Step Actions use imperative verbs with specific UI elements or API targets
- [ ] Step Data column uses "None" when no data is needed, or explicit test values
- [ ] Step Expected Results describe the *immediate* system response after that action
- [ ] RAG results parsed field by field: Description, Preconditions, Expected Result, Steps[].Action, Steps[].Data, Steps[].Expected Result
- [ ] Precondition blocks reused/adapted from retrieved tests (not invented from scratch)
- [ ] Step Actions use vocabulary extracted from retrieved tests (real UI element names, real API operations)
- [ ] Data values reused from retrieved tests when type matches (real MRZ strings, flight numbers, etc.)
- [ ] Step-level Expected Results match phrasing style of retrieved tests from the same module
- [ ] All new test cases follow naming, detail level, and structure patterns from retrieved existing tests
- [ ] Output report is structured, actionable, and XRay-ready
- [ ] No obvious duplication of existing test cases
</success_criteria>

<error_handling>
**ink-qa-rag unavailable:** If MCP queries fail, note "RAG unavailable — generating without historical context" and proceed to generate test cases from ticket description alone (mark output as "⚠️ Generated without RAG context — verify against existing test cases manually").

**No RAG results:** If queries return empty, proceed with generation using ticket description only. Include a note: "No similar test cases found in knowledge base for this domain."

**Partial results:** If only some queries return results, use what's available. Note which queries returned data.
</error_handling>

<references>
- MCP: mcp__ink-qa-rag__rag_query (modes: mix, hybrid, local, global, naive, bypass)
- @.claude/ink-workflows/references/mcp-integration-guide.md
</references>
