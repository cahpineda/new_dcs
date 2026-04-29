<purpose>
Gather phase context through collaborative thinking before planning. Help the user articulate their vision for how this phase should work, look, and feel.

You are a thinking partner, not an interviewer. The user is the visionary — you are the builder. Your job is to understand their vision, not interrogate them about technical details you can figure out yourself.
</purpose>

<philosophy>
**User = founder/visionary. Claude = builder.**

The user doesn't know (and shouldn't need to know):
- Codebase patterns (you read the code)
- Technical risks (you identify during research)
- Implementation constraints (you figure those out)
- Success metrics (you infer from the work)

The user DOES know:
- How they imagine it working
- What it should look/feel like
- What's essential vs nice-to-have
- Any specific things they have in mind

Ask about vision. Figure out implementation yourself.
</philosophy>

<process>

<step name="validate_phase" priority="first">
Phase number: $ARGUMENTS (required)

Validate phase exists in roadmap:

**Primary:** `node bin/ink-tools.js roadmap get-phase ${PHASE}` — get phase details from roadmap

**If phase not found:**

```
Error: Phase ${PHASE} not found in roadmap.

Use /ink:progress to see available phases.
```

Exit workflow.

**If phase found:**
Parse phase details from roadmap:

- Phase number
- Phase name
- Phase description
- Status (should be "Not started" or "In progress")

Continue to check_existing.
</step>

<step name="check_existing">
Check if CONTEXT.md already exists for this phase:

**Primary:** Use Glob `.planning/phases/${PHASE}-*/*CONTEXT.md` to check for existing context files.

**If exists:**

```
Phase ${PHASE} already has context: [path to CONTEXT.md]

What's next?
1. Update context - Review and revise existing context
2. View existing - Show me the current context
3. Skip - Use existing context as-is
```

Wait for user response.

If "Update context": Load existing CONTEXT.md, continue to detect_mode
If "View existing": Read and display CONTEXT.md, then offer update/skip
If "Skip": Exit workflow

**If doesn't exist:**
Continue to detect_mode.
</step>

<step name="detect_mode">
Check `$MODE` argument (passed from agent/command):
- If "assumptions" → go to `assumptions_scan` step
- If "qa" or not set → go to `questioning` step
</step>

<step name="assumptions_scan">
**Identify feature type** from roadmap goal: visual (UI/frontend), API/CLI (backend endpoints), content (docs/templates), organization (refactoring/restructuring).

**Select gray area categories** by type:
- Visual: layout, density, interactions, empty states, responsive behavior
- API/CLI: response format, flags, error handling, verbosity, pagination
- Content: structure, tone, depth, flow, metadata
- Organization: grouping criteria, naming conventions, exceptions, migration

**Scan codebase** using MCP tools (P2C first, then Serena for specifics):
- `mcp__project2context__query_repository_summary` — understand project structure
- `mcp__serena__find_symbol` or `mcp__serena__get_symbols_overview` — find patterns per gray area
- Collect evidence: file paths, function names, existing conventions

**Propose decisions** with evidence:
```
## Proposed Decisions

### [Category]

**Decision:** Use [pattern] found in [file_path]
**Evidence:** `src/handlers/auth.ts:45` uses try-catch with `{ error: string, code: number }`
**Confidence:** High (3+ files follow this pattern)

---
Confirm (Y), correct, or skip (S) each decision.
```

Collect confirmations. Proceed to `write_context`.
</step>

<step name="questioning">
**CRITICAL: ALL questions use AskUserQuestion. Never ask inline text questions.**

Present initial context from roadmap, then immediately use AskUserQuestion:

```
Phase ${PHASE}: ${PHASE_NAME}

From the roadmap: ${PHASE_DESCRIPTION}
```

**1. Open:**

Use AskUserQuestion:
- header: "Vision"
- question: "How do you imagine this working?"
- options: 2-3 interpretations based on the phase description + "Let me describe it"

**2. Follow the thread:**

Based on their response, use AskUserQuestion:
- header: "[Topic they mentioned]"
- question: "You mentioned [X] — what would that look like?"
- options: 2-3 interpretations + "Something else"

**3. Sharpen the core:**

Use AskUserQuestion:
- header: "Essential"
- question: "What's the most important part of this phase?"
- options: Key aspects they've mentioned + "All equally important" + "Something else"

**4. Find boundaries:**

Use AskUserQuestion:
- header: "Scope"
- question: "What's explicitly out of scope for this phase?"
- options: Things that might be tempting + "Nothing specific" + "Let me list them"

**5. Capture specifics (optional):**

If they seem to have specific ideas, use AskUserQuestion:
- header: "Specifics"
- question: "Any particular look/feel/behavior in mind?"
- options: Contextual options based on what they've said + "No specifics" + "Let me describe"

CRITICAL — What NOT to ask:
- Technical risks (you figure those out)
- Codebase patterns (you read the code)
- Success metrics (too corporate)
- Constraints they didn't mention (don't interrogate)

**6. Decision gate:**

Use AskUserQuestion:
- header: "Ready?"
- question: "Ready to capture this context, or explore more?"
- options (ALL THREE REQUIRED):
  - "Create CONTEXT.md" - I've shared my vision
  - "Ask more questions" - Help me think through this more
  - "Let me add context" - I have more to share

If "Ask more questions" → return to step 2 with new probes.
If "Let me add context" → receive input → return to step 2.
Loop until "Create CONTEXT.md" selected.
</step>

<step name="write_context">
Create CONTEXT.md using template from `.claude/ink-workflows/templates/context.md`.

**File location:** `.planning/phases/${PHASE}-${SLUG}/${PHASE}-CONTEXT.md`

Create directory if it doesn't exist. Use roadmap phase name for slug (lowercase, hyphens).

**If Q&A mode:**
- Populate vision sections: `<vision>`, `<essential>`, `<boundaries>`, `<specifics>`, `<notes>`
- Populate `<locked_decisions>` from any explicitly stated decisions
- Set frontmatter: `mode: qa`

**If Assumptions Mode:**
- `<locked_decisions>` is primary content — fill with confirmed/corrected proposals including file-path evidence
- Vision sections may be minimal (fill with "Gathered via Assumptions Mode scan")
- Set frontmatter: `mode: assumptions`

Each locked decision: category, decision text, evidence (file path if Assumptions, "user stated" if Q&A), status (locked/deferred).

Set frontmatter `decision_count` to number of locked decisions. Write file.
</step>

<step name="confirm_creation">
Present CONTEXT.md summary:

```
Created: .planning/phases/${PHASE}-${SLUG}/${PHASE}-CONTEXT.md

## Vision
[How they imagine it working]

## Essential
[What must be nailed]

## Boundaries
[What's out of scope]

---

## ▶ Next Up

**Phase ${PHASE}: [Name]** — [Goal from ROADMAP.md]

`/ink:plan-phase ${PHASE}`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- `/ink:research-phase ${PHASE}` — investigate unknowns
- Review/edit CONTEXT.md before continuing

---
```

</step>

<step name="git_commit">
Ask user before committing. If confirmed:

```bash
git add .planning/phases/${PHASE}-${SLUG}/${PHASE}-CONTEXT.md
git commit -m "docs(${PHASE}): capture phase context"
```
</step>

</process>

<success_criteria>

- Phase validated against roadmap
- Vision gathered through collaborative thinking (not interrogation)
- User's imagination captured: how it works, what's essential, what's out of scope
- CONTEXT.md created in phase directory
- CONTEXT.md committed to git
- User knows next steps (typically: research or plan the phase)
</success_criteria>
