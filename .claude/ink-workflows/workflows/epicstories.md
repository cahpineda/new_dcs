<purpose>
Create a Jira Epic and Story specifications from a Customer Request document or conversationally gathered requirements. Generates structured previews, then creates them in Jira after user confirmation.
</purpose>

<process>

<step name="check-input">
When invoked with $ARGUMENTS:

1. Parse `--project PROJECT_KEY` if present; remove it from the description. If not provided, will auto-discover.
2. Read the remaining input. If it contains or references a Customer Request document (structured or freeform), extract as much of the required fields as possible.
3. Read @.claude/ink-workflows/references/epicstories-templates.md for Epic and Story template structure.
4. If $ARGUMENTS is empty or contains fewer than three of the required fields, greet the user briefly, explain you will gather the information needed to create a Jira Epic and Stories, and ask up to three questions. Start with:
   - What is the feature or capability?
   - What problem does it solve, and who does it affect?
   - What is the ideal workflow?
5. If the input already contains a Customer Request (indicated by headers like "Customer Request:", "Feature Request Details", or structured sections), treat it as the source document and proceed to generate-epic directly.
</step>

<step name="collect">
On each subsequent turn (if collecting):

1. Acknowledge and record what the user provided.
2. Check which required fields are still missing (see reference for required fields list).
3. Ask up to three focused questions. Priority order: problem/outcome, affected roles, workflow steps, out-of-scope, user stories.
4. When all required fields are collected, confirm: "I have everything I need. Shall I generate the Epic and Stories now?"

Do not repeat questions already answered.
</step>

<step name="generate-epic">
Generate the Epic using the template from @.claude/ink-workflows/references/epicstories-templates.md.

Display in chat:

```
---
EPIC PREVIEW
---

**OUTCOME**
[One sentence starting with a verb]

**CONTEXT**
Affects:         [Specific role]
Today:           [What fails, what is lost]
Expected value:  [What improves]
Source:          [Customer request / QBR / etc.]

**OUT OF SCOPE**
→ [Item 1]
→ [Item 2]
```

Enforce rules from the reference: OUTCOME is one sentence, "Affects" names a specific role (never "users"), OUT OF SCOPE has at least two entries.
</step>

<step name="generate-stories">
Generate three to five Stories using the template from the reference.

For each Story, display the full preview in chat with all sections: STORY, CONTEXT, BEHAVIOUR (main flow, alternative flows, error flows), CONSTRAINTS, OUT OF SCOPE, ACCEPTANCE CRITERIA, OPEN QUESTIONS, then DoR CHECKLIST, DoD CHECKLIST, and READINESS.

Enforce rules: every error flow specifies what user sees + system does + what is logged, minimum 3 AC with at least 1 negative case.

**After generating all sections for each story, append DoR and DoD:**

1. **Evaluate DoR gates** (auto-evaluated — check actual story content):
   - ☑ Clear objective & business value → OUTCOME + CONTEXT filled
   - ☑ Acceptance Criteria defined → at least 3 AC blocks with Given/When/Then
   - □ Story estimated (≤ 8h or split) → always □ (manual)
   - ☑ No unresolved blockers or dependencies → OPEN QUESTIONS is empty
   - □ UI/UX ready (if applicable) → always □ (manual)
   - ☑ Security & compliance considered → CONSTRAINTS.Permissions is filled
   - ☑ Test scenarios identified → AC-03 negative case present
   - □ Squad reviewed and confirmed viable → always □ (manual)

2. **Display DoR block:**
   ```
   DoR CHECKLIST
   ☑/□  Clear objective & business value
   ☑/□  Acceptance Criteria defined (Given/When/Then)
   □    Story estimated (≤ 8h or split)               ← team to confirm
   ☑/□  No unresolved blockers or dependencies
   □    UI/UX ready (if applicable)                   ← team to confirm
   ☑/□  Security & compliance considered
   ☑/□  Test scenarios identified
   □    Squad reviewed and confirmed viable            ← team to confirm
   ```

3. **Display DoD block (verbatim, same for every story):**
   ```
   DoD CHECKLIST
   Code:      PR approved · Branch naming standard · No merge conflicts
   Coverage:  SonarQube ≥ 70% new code · 0 Blocker/Critical findings
   Security:  No Critical or High vulnerabilities in PR
   Tests:     XRay test cases created · All passing in CI pipeline
   Docs:      README updated · API contracts updated if changed
   Demo:      Functionality demonstrated in Sprint Review
   ```

4. **Update READINESS** based on DoR evaluation:
   - If two or more auto-evaluated gates are □ → `STATUS: BLOCKED — [list failing gates]`
   - Otherwise → `STATUS: READY`
</step>

<step name="confirm">
After displaying the Epic preview and all Story previews, ask:

"Does this look right? Type 'yes' to create these in Jira, or tell me what you'd like to change."

If the user requests changes, apply them and re-display only the affected sections before asking again.
</step>

<step name="create-in-jira">
When the user confirms:

**1. Discover project:**

If `--project` was provided, use that key. Otherwise:
```bash
bash .claude/skills/ink-jira/jira-api.sh search-project "E2E TEST"
```
Read `/tmp/jira-projects.json` with Read tool. Extract project key from first result. If no results, try "E2E". If still none, show available projects and ask user to specify.

**2. Create Epic:**

Build the Epic ADF description as a simplified JSON structure and save to `/tmp/jira-adf-epic.json`:
```json
{
  "sections": [
    {"type": "heading", "level": 2, "text": "Outcome"},
    {"type": "paragraph", "text": "[OUTCOME text]"},
    {"type": "heading", "level": 2, "text": "Context"},
    {"type": "paragraph", "text": "Affects: [role]"},
    {"type": "paragraph", "text": "Today: [current pain]"},
    {"type": "paragraph", "text": "Expected value: [business value]"},
    {"type": "paragraph", "text": "Source: [source]"},
    {"type": "heading", "level": 2, "text": "Out of Scope"},
    {"type": "bullet_list", "items": ["[item 1]", "[item 2]"]}
  ]
}
```

Convert to ADF:
```bash
bash .claude/skills/ink-jira/jira-api.sh build-adf /tmp/jira-adf-epic.json /tmp/jira-adf-epic-built.json
```

Create the Epic:
```bash
bash .claude/skills/ink-jira/jira-api.sh create-issue \
  --project PROJECT_KEY \
  --type Epic \
  --summary "[OUTCOME sentence]" \
  --description-file /tmp/jira-adf-epic-built.json \
  --epic-name "[Short Epic label — 5 words max]"
```

Parse returned JSON to get Epic key.

**3. Create Stories:**

For each Story, build a simplified JSON that includes all sections plus the DoR checklist and DoD checklist, convert to ADF, and create:

The simplified JSON sections for each story must include the DoR and DoD blocks **after OPEN QUESTIONS and before READINESS**:

```json
{
  "sections": [
    ...(all story sections)...,
    {"type": "heading", "level": 2, "text": "DoR Checklist"},
    {"type": "paragraph", "text": "[auto-evaluated gates with ☑/□ from preview]"},
    {"type": "paragraph", "text": "□  Story estimated (≤ 8h or split) ← team to confirm"},
    {"type": "paragraph", "text": "□  UI/UX ready (if applicable) ← team to confirm"},
    {"type": "paragraph", "text": "□  Squad reviewed and confirmed viable ← team to confirm"},
    {"type": "heading", "level": 2, "text": "DoD Checklist"},
    {"type": "bullet_list", "items": [
      "Code: PR approved · Branch naming standard · No merge conflicts",
      "Coverage: SonarQube ≥ 70% new code · 0 Blocker/Critical findings",
      "Security: No Critical or High vulnerabilities in PR",
      "Tests: XRay test cases created · All passing in CI pipeline",
      "Docs: README updated · API contracts updated if changed",
      "Demo: Functionality demonstrated in Sprint Review"
    ]},
    {"type": "heading", "level": 2, "text": "Readiness"},
    {"type": "paragraph", "text": "STATUS: [READY / BLOCKED — reason]"}
  ]
}
```

```bash
# Build ADF for story N
bash .claude/skills/ink-jira/jira-api.sh build-adf /tmp/jira-adf-story-N.json /tmp/jira-adf-story-N-built.json

# Create story linked to Epic
bash .claude/skills/ink-jira/jira-api.sh create-issue \
  --project PROJECT_KEY \
  --type Story \
  --summary "[As a ... I want to ...]" \
  --description-file /tmp/jira-adf-story-N-built.json \
  --parent EPIC-KEY \
  --priority "[Urgent|High|Normal|Low]"
```

Priority mapping: Must→Urgent, Should→High, Could→Normal, Won't→Low.

**4. Show summary:**

```markdown
## Created in Jira

**Epic:** [URL]
**Stories:**
- Story 1: [URL] — [title snippet]
- Story 2: [URL] — [title snippet]
- ...
```

**5. Clean up:**
```bash
bash .claude/skills/ink-jira/jira-api.sh cleanup
rm -f /tmp/jira-adf-*.json
```

If any creation fails, show the full error, identify whether it is an authentication, project-key, or field-schema issue, and offer to retry or save as local markdown files.
</step>

</process>

<style_guide>
- Conversational but professional when collecting information.
- Concise questions — one sentence each where possible.
- When generating content, adopt precise document style — no filler phrases.
- Convert American English to British English silently in all generated content.
- Aviation terminology preferred where relevant: DCS, CUPPS, CUSS, NDC, load sheet, gate agent, load controller, kiosk.
- Do not summarise what you just did at the end of a response — the output speaks for itself.
</style_guide>
