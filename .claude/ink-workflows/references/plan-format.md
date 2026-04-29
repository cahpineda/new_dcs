<overview>
Claude-executable plans have a specific format that enables Claude to implement without interpretation. This reference defines what makes a plan executable vs. vague.

**Key insight:** PLAN.md IS the executable prompt. It contains everything Claude needs to execute the phase, including objective, context references, tasks, verification, success criteria, and output specification.
</overview>

<core_principle>
A plan is Claude-executable when Claude can read the PLAN.md and immediately start implementing without asking clarifying questions.

If Claude has to guess, interpret, or make assumptions - the task is too vague.
</core_principle>

<frontmatter_fields>
PLAN.md files use YAML frontmatter for metadata:

```yaml
---
phase: XX-name               # Phase directory name
plan: NN                     # Plan number within phase (01, 02, etc.)
type: execute                # Always "execute" for plans
depends_on: []               # Plan IDs this requires (e.g., ["01-01"]). Empty = independent.
files_modified: []           # Files this plan modifies (extracted from <files> elements)
wave: N                      # Optional: execution wave for parallel grouping
autonomous: true|false       # Optional: can run as subagent without checkpoints
domain: [optional]           # Domain skill if loaded

# Optional validation section
must_haves:
  truths:                    # Assertions that must be true after execution
    - "File X exists"
    - "Size under Y bytes"
  artifacts:                 # Files with constraints
    - path: "path/to/file"
      provides: "Description"
      max_bytes: 8192        # Optional size limit
  key_links:                 # Dependencies between files
    - from: "source/file"
      to: "target/file"
      via: "how they connect"
---
```

**Parallelization:** `depends_on: []` + no file conflicts with sibling plans = can run parallel.
</frontmatter_fields>

<prompt_structure>
Every PLAN.md follows this XML structure:

```markdown
---
phase: XX-name
plan: NN
type: execute
depends_on: []
files_modified: []
---

<objective>
[What and why]
Purpose: [...]
Output: [...]
</objective>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@relevant/source/files.ts
</context>

<tasks>
<task type="auto">
  <name>Task N: [Name]</name>
  <files>[paths]</files>
  <action>[what to do, what to avoid and WHY]</action>
  <verify>[command/check]</verify>
  <done>[criteria]</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>[what Claude automated]</what-built>
  <how-to-verify>[numbered verification steps]</how-to-verify>
  <resume-signal>[how to continue - "approved" or describe issues]</resume-signal>
</task>

<task type="checkpoint:decision" gate="blocking">
  <decision>[what needs deciding]</decision>
  <context>[why this matters]</context>
  <options>
    <option id="option-a"><name>[Name]</name><pros>[pros]</pros><cons>[cons]</cons></option>
    <option id="option-b"><name>[Name]</name><pros>[pros]</pros><cons>[cons]</cons></option>
  </options>
  <resume-signal>[how to indicate choice]</resume-signal>
</task>
</tasks>

<verification>
[Overall phase checks]
</verification>

<success_criteria>
[Measurable completion]
</success_criteria>

<output>
[SUMMARY.md specification]
</output>
```

</prompt_structure>

<task_anatomy>
Every task has four required fields:

<field name="files">
**What it is**: Exact file paths that will be created or modified.

**Good**: `src/app/api/auth/login/route.ts`, `prisma/schema.prisma`
**Bad**: "the auth files", "relevant components"

Be specific. If you don't know the file path, figure it out first.
</field>

<field name="action">
**What it is**: Specific implementation instructions, including what to avoid and WHY.

**Good**: "Create POST endpoint that accepts {email, password}, validates using bcrypt against User table, returns JWT in httpOnly cookie with 15-min expiry. Use jose library (not jsonwebtoken - CommonJS issues with Next.js Edge runtime)."

**Bad**: "Add authentication", "Make login work"

Include: technology choices, data structures, behavior details, pitfalls to avoid.
</field>

<field name="verify">
**What it is**: How to prove the task is complete.

**Good**:

- `npm test` passes
- `curl -X POST /api/auth/login` returns 200 with Set-Cookie header
- Build completes without errors

**Bad**: "It works", "Looks good", "User can log in"

Must be executable - a command, a test, an observable behavior.
</field>

<field name="done">
**What it is**: Acceptance criteria - the measurable state of completion.

**Good**: "Valid credentials return 200 + JWT cookie, invalid credentials return 401"

**Bad**: "Authentication is complete"

Should be testable without subjective judgment.
</field>
</task_anatomy>

<task_types>
Tasks have a `type` attribute that determines how they execute:

<type name="auto">
**Default task type** - Claude executes autonomously.

**Structure:**

```xml
<task type="auto">
  <name>Task 3: Create login endpoint with JWT</name>
  <files>src/app/api/auth/login/route.ts</files>
  <action>POST endpoint accepting {email, password}. Query User by email, compare password with bcrypt. On match, create JWT with jose library, set as httpOnly cookie (15-min expiry). Return 200. On mismatch, return 401.</action>
  <verify>curl -X POST localhost:3000/api/auth/login returns 200 with Set-Cookie header</verify>
  <done>Valid credentials → 200 + cookie. Invalid → 401.</done>
</task>
```

Use for: Everything Claude can do independently (code, tests, builds, file operations).
</type>

<type name="checkpoint:human-action">
**RARELY USED** (1%) - Only for actions with NO CLI/API (email verification links, SMS 2FA, 3D Secure). Structure: `<action>`, `<instructions>`, `<verification>`, `<resume-signal>`. NEVER for anything with CLI.
</type>

<type name="checkpoint:human-verify">
**90% of checkpoints** - Human verifies Claude's work. Structure: `<what-built>`, `<how-to-verify>` (numbered steps with URLs/commands), `<resume-signal>`. Use for: UI/UX, visual design, animation, accessibility.
</type>

<type name="checkpoint:decision">
**9% of checkpoints** - Human makes implementation choice. Structure: `<decision>`, `<context>`, `<options>` (id, name, pros, cons), `<resume-signal>`. Use for: tech selection, architecture, design choices.
</type>

**Golden rule:** If Claude CAN automate it, Claude MUST automate it. See `./checkpoints.md` for comprehensive guidance.
</task_types>

<tdd_plans>
**TDD work uses dedicated plans.**

TDD features require 2-3 execution cycles (RED → GREEN → REFACTOR), each with file reads, test runs, and potential debugging. This is fundamentally heavier than standard tasks and would consume 50-60% of context if embedded in a multi-task plan.

**When to create a TDD plan:**
- Business logic with defined inputs/outputs
- API endpoints with request/response contracts
- Data transformations and parsing
- Validation rules
- Algorithms with testable behavior

**When to use standard plans (skip TDD):**
- UI layout and styling
- Configuration changes
- Glue code connecting existing components
- One-off scripts

**Heuristic:** Can you write `expect(fn(input)).toBe(output)` before writing `fn`?
→ Yes: Create a TDD plan (one feature per plan)
→ No: Use standard plan, add tests after if needed

See `./tdd.md` for TDD plan structure and execution guidance.
</tdd_plans>

<context_references>
Use @file references to load context for the prompt:

```markdown
<context>
@.planning/PROJECT.md           # Project vision
@.planning/ROADMAP.md         # Phase structure
@.planning/phases/02-auth/DISCOVERY.md  # Discovery results
@src/lib/db.ts                # Existing database setup
@src/types/user.ts            # Existing type definitions
</context>
```

Reference files that Claude needs to understand before implementing.
</context_references>

<verification_section>
Overall phase verification (beyond individual task verification):

```markdown
<verification>
Before declaring phase complete:
- [ ] `npm run build` succeeds without errors
- [ ] `npm test` passes all tests
- [ ] No TypeScript errors
- [ ] Feature works end-to-end manually
</verification>
```

</verification_section>

<success_criteria_section>
Measurable criteria for phase completion:

```markdown
<success_criteria>

- All tasks completed
- All verification checks pass
- No errors or warnings introduced
- JWT auth flow works end-to-end
- Protected routes redirect unauthenticated users
  </success_criteria>
```

</success_criteria_section>

<output_section>
Specify the SUMMARY.md structure:

```markdown
<output>
After completion, create `.planning/phases/XX-name/SUMMARY.md`:

# Phase X: Name Summary

**[Substantive one-liner]**

## Accomplishments

## Files Created/Modified

## Decisions Made

## Issues Encountered

## Next Phase Readiness

</output>
```

</output_section>

<specificity_levels>
<too_vague>
`<action>Implement auth</action>` — Claude asks "How? What type? What library? Where?"
</too_vague>

<just_right>
`<action>POST endpoint accepting {email, password}. Query User by email, compare with bcrypt. On match, create JWT with jose (not jsonwebtoken—CommonJS issues with Edge). Set httpOnly cookie (15-min expiry). Return 200/401.</action>` — Claude implements immediately.
</just_right>

<too_detailed>Writing actual code in the plan. Trust Claude to implement from clear instructions.</too_detailed>
</specificity_levels>

<anti_patterns>
<vague_actions>

- "Set up the infrastructure"
- "Handle edge cases"
- "Make it production-ready"
- "Add proper error handling"

These require Claude to decide WHAT to do. Specify it.
</vague_actions>

<unverifiable_completion>

- "It works correctly"
- "User experience is good"
- "Code is clean"
- "Tests pass" (which tests? do they exist?)

These require subjective judgment. Make it objective.
</unverifiable_completion>

<missing_context>

- "Use the standard approach"
- "Follow best practices"
- "Like the other endpoints"

Claude doesn't know your standards. Be explicit.
</missing_context>
</anti_patterns>

<sizing_tasks>
Good task size: 15-60 minutes of Claude work.

**Too small**: "Add import statement for bcrypt" (combine with related task)
**Just right**: "Create login endpoint with JWT validation" (focused, specific)
**Too big**: "Implement full authentication system" (split into multiple plans)

If a task takes multiple sessions, break it down.
If a task is trivial, combine with related tasks.

**Note on scope:** If a phase has >3 tasks or spans multiple subsystems, split into multiple plans using the naming convention `{phase}-{plan}-PLAN.md`. See `./scope-estimation.md` for guidance.
</sizing_tasks>
