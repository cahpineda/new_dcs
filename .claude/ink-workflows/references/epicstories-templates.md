# Epic and Story Templates

## Required Fields

Must be collected before generating:
- Feature name or title
- The business problem this solves (pain point + who it affects + current cost/impact)
- Which roles are affected (specific — gate agent, load controller, passenger, etc.)
- The desired outcome (one sentence, starting with a verb)
- At least three workflow steps describing how the feature works
- At least two user stories ("As a [role], I want to [action] so that [benefit]")
- What is explicitly out of scope (at least two items)
- System integrations involved (optional but strongly recommended)

Optional:
- Customer name and requestor
- Performance requirements (response times)
- Platform constraints (kiosk / mobile / web / API)
- Known dependencies on other systems or initiatives

## Epic Template

```
OUTCOME
[One sentence starting with a verb: "Reduce...", "Enable...", "Eliminate..." — operational or strategic problem. No feature description.]

CONTEXT
Affects:         [Specific role — never "users"]
Today:           [What fails, what is lost, what it costs without this. Specific.]
Expected value:  [What improves: retention, NPS, revenue, operational cost, risk]
Source:          [Customer request / QBR / listening tour / internal data / regulation]

OUT OF SCOPE
→ [What this Epic deliberately does NOT solve]
→ [What a separate Epic or initiative covers instead]
```

**Epic rules:**
- OUTCOME is exactly one sentence — no sub-clauses, no bullet points
- "Affects" names a specific role — never "users" or "the team"
- "Today" describes current pain — not the desired state
- OUT OF SCOPE has at least two entries
- Use aviation terminology where relevant: DCS, CUPPS, CUSS, NDC, load sheet, kiosk, gate agent

## Story Template

```
STORY
Title:    [As a [specific role], I want to [action] so that [benefit]]
Outcome:  [Which Epic OUTCOME this contributes to — one phrase]
Priority: [Must / Should / Could / Won't]

CONTEXT
Pre-conditions:  [What must be true before this flow begins]
Actors:          [User role / system / external integration]
Entry point:     [What triggers this interaction]
System state:    [What data exists / what does not exist]

BEHAVIOUR

Main flow:
  1. [User or system action]
  2. [System response]
  3. [Continue until outcome is reached — every step explicit]

Alternative flows:
  If [condition A]: [what the system does differently]
  If [condition B]: [what the system does differently]

Error flows:
  If [error X]:   [what the user sees] + [what the system does] + [what is logged]
  If [timeout Y]: [what the user sees] + [what the system does] + [what is logged]

CONSTRAINTS
Data:         [Field formats, max lengths, required vs optional]
Permissions:  [Who can trigger this / who cannot]
Validation:   [Business rules, time windows, limits]
Integration:  [Which system, which endpoint, which version]
Platform:     [kiosk / mobile / web / API only]

OUT OF SCOPE
→ [What the next story handles]
→ [What was deliberately excluded from this slice]

ACCEPTANCE CRITERIA

AC-01:
Given [pre-condition]
When  [action]
Then  [specific, verifiable system behaviour]

AC-02:
Given / When / Then ...

AC-03 (NEGATIVE CASE):
Given [pre-condition]
When  [invalid or edge-case action]
Then  [specific rejection or error behaviour]

OPEN QUESTIONS
□ [Question, if any] — Owner: [who resolves it]

READINESS:
Open questions: [N]
STATUS: READY / BLOCKED — [reason if blocked]
```

**Story rules:**
- Every error flow specifies: what the user sees + what the system does + what is logged
- Integration names the specific endpoint and version where known
- Minimum 3 Acceptance Criteria — at least 1 is a negative/error/rejection case
- Each AC "Then" is specific and independently verifiable
- If something is unclear, add an OPEN QUESTION with an owner

## Priority Mapping (Jira)

| Story priority | Jira priority |
|---------------|---------------|
| Must | Urgent |
| Should | High |
| Could | Normal |
| Won't | Low |

## Definition of Ready (DoR)

All 8 gates must pass before a Story enters a sprint.

**Auto-evaluated from story content** (set ☑ if condition met, □ if not):
- Clear objective & business value → OUTCOME + CONTEXT sections are complete
- Acceptance Criteria defined (Given/When/Then) → at least 3 AC blocks present
- No unresolved blockers or dependencies → OPEN QUESTIONS list is empty
- Security & compliance considered → CONSTRAINTS.Permissions field is filled
- Test scenarios identified → AC-03 (negative case) is present

**Manual gates** (always □ — team must confirm before sprint entry):
- Story estimated (≤ 8h or split)
- UI/UX ready (if applicable)
- Squad reviewed and confirmed viable

**Display format in preview and Jira:**
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

**DoR rules:**
- Auto-evaluated gates must reflect actual story content — do not mark ☑ if the field is missing or vague
- The three manual gates are always □ regardless of story content
- If two or more auto-evaluated gates are □, set the story READINESS STATUS to BLOCKED

## Definition of Done (DoD)

Standard checklist — applies to all Stories. Include verbatim below DoR in preview and Jira:

```
DoD CHECKLIST
Code:      PR approved · Branch naming standard · No merge conflicts
Coverage:  SonarQube ≥ 70% new code · 0 Blocker/Critical findings
Security:  No Critical or High vulnerabilities in PR
Tests:     XRay test cases created · All passing in CI pipeline
Docs:      README updated · API contracts updated if changed
Demo:      Functionality demonstrated in Sprint Review
```

**DoD rules:**
- Content is fixed — do not customise per story
- Always placed after DoR, before READINESS at the end of each story
