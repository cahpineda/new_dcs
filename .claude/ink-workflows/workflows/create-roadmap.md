<purpose>
Define phases of implementation from PROJECT.md. Each phase delivers one coherent capability.
</purpose>

<required_reading>
1. ink-workflows/templates/roadmap.md
2. ink-workflows/templates/state.md
3. .planning/PROJECT.md (if exists)
</required_reading>

<process>

<execution_order>
1. check_brief - Verify PROJECT.md exists
2. detect_domain - Scan for domain expertise
3. identify_phases - Derive phases from requirements
4. detect_research_needs - Flag phases needing research
5. confirm_phases - User confirmation (interactive) or auto-approve (yolo)
6. decision_gate - Ready to create?
7. create_structure - mkdir .planning/phases
8. write_roadmap - Create ROADMAP.md
9. initialize_project_state - Create STATE.md
10. git_commit_initialization - Commit changes
11. offer_next - Show next steps
</execution_order>

<step name="check_brief">
**Primary:** `node bin/ink-tools.js project list-sections` — verify PROJECT.md exists and list sections
**Fallback:** Read .planning/PROJECT.md directly

If no brief: "No brief found. Create one first, or proceed with quick context?"
</step>

<step name="detect_domain">
```bash
ls ~/.claude/skills/expertise/ 2>/dev/null
```

Match keywords to domains: macOS/AppKit -> macos-apps, iOS/iPad -> iphone-apps, etc.
Ask: "Detected [domain] - include expertise? (Y/n)"
</step>

<step name="identify_phases">
Check depth: `node bin/ink-tools.js config get depth`

| Depth | Typical Phases | Plans/Phase |
|-------|----------------|-------------|
| Quick | 3-5 | 1-3 |
| Standard | 5-8 | 3-5 |
| Comprehensive | 8-12 | 5-10 |

Derive phases from actual work. Each phase delivers ONE verifiable capability.
Use integer phases (1, 2, 3). Decimals (2.1) for urgent insertions later.

Good phases are: Coherent (one capability), Sequential (dependencies), Independent (verifiable alone).
</step>

<step name="detect_research_needs">
For each phase, flag if research likely needed:

**Likely:** External APIs, auth systems, payment, real-time, new tech
**Unlikely:** Internal UI, CRUD, refactoring, existing patterns

Present: "Phase 2: Research Likely (external API). Topics: current Stripe docs, webhook patterns"
</step>

<step name="confirm_phases">
Yolo mode: Auto-approve phases.
Interactive: "Here's the breakdown: [phases]. Does this feel right? (yes/adjust)"
</step>

<step name="decision_gate">
Yolo: Auto-proceed to create.
Interactive: "Ready to create roadmap, or ask more questions?"
</step>

<step name="create_structure">
**Primary:** `node bin/ink-tools.js phase create <NN> "<name>"` — for each phase
**Fallback:** Use Write tool to create phase directories
</step>

<step name="write_roadmap">
Use templates/roadmap.md. Write to .planning/ROADMAP.md:
- Domain Expertise section
- Phase list with names, descriptions
- Dependencies
- Research flags (Likely/Unlikely with topics)
- Status tracking

**Primary:** Use `node bin/ink-tools.js phase create` for each phase directory.
</step>

<step name="initialize_project_state">
**CRITICAL — Preserve ticket/session fields:**
Before writing, check if .planning/STATE.md already exists.
If it does, read `CurrentTicket`, `CurrentSessionId`, and `PendingTicket` values from it.
After writing the new STATE.md below, re-inject those fields immediately after the first `##` heading.

Use templates/state.md. Write to .planning/STATE.md:

```markdown
# Project State

CurrentTicket: [PRESERVE from existing STATE.md if present]
CurrentSessionId: [PRESERVE from existing STATE.md if present]

## Project Reference
See: .planning/PROJECT.md (updated [today])
**Core value:** [From PROJECT.md]
**Current focus:** Phase 1 - [Name]

## Current Position
Phase: 1 of [N] ([Name])
Plan: Not started
Status: Ready to plan
Last activity: [today] - Project initialized
Progress: 0%

## Accumulated Context
### Decisions
(None yet)
### Blockers
None
```

**If no existing ticket/session was found, omit the CurrentTicket/CurrentSessionId lines.**
</step>

<step name="git_commit_initialization">
**Ask user before committing:**

```
## Ready to Commit Project Initialization

**Files to commit:**
- .planning/PROJECT.md
- .planning/ROADMAP.md
- .planning/STATE.md
- .planning/phases/

**Proposed commit message:**
`docs: initialize [project] ([N] phases)`

**Options:**
1. **Commit now** - Proceed with commit
2. **Skip commit** - Continue without committing
3. **Modify message** - Change commit message first

Would you like to commit these changes?
```

**If user confirms commit:**
```bash
git add .planning/PROJECT.md .planning/ROADMAP.md .planning/STATE.md .planning/phases/
git commit -m "docs: initialize [project] ([N] phases)"
```
</step>

<step name="offer_next">
```
Project initialized:
- Brief: .planning/PROJECT.md
- Roadmap: .planning/ROADMAP.md
- State: .planning/STATE.md

---
Next: /ink:plan-phase 1
```
</step>

</process>

<phase_naming>
Use `XX-kebab-case-name`: 01-foundation, 02-authentication, 03-core-features
</phase_naming>

<anti_patterns>
- No time estimates
- No Gantt charts
- No resource allocation
- No risk matrices
- Don't impose arbitrary phase counts
</anti_patterns>

<success_criteria>
- [ ] .planning/ROADMAP.md exists
- [ ] .planning/STATE.md exists
- [ ] Phases defined (count from work, not imposed)
- [ ] Research flags assigned
- [ ] Phase directories created
- [ ] Dependencies noted
</success_criteria>
