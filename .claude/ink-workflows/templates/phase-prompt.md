# Phase Prompt Template

Template for `.planning/phases/XX-name/{phase}-{plan}-PLAN.md` - executable phase plans.

**Naming:** `{phase}-{plan}-PLAN.md` (e.g., `01-02-PLAN.md` for Phase 1, Plan 2)

---

## File Template

```markdown
---
phase: XX-name
plan: NN
type: execute
depends_on: []              # Plan IDs required (e.g., ["01-01"]). Empty = independent.
files_modified: []          # Files from <files> elements
complexity:
  level: simple|medium|complex
  score: N                  # 0-5 simple, 6-12 medium, 13+ complex
  poc_required: true|false
---

<objective>
[What this phase accomplishes - from roadmap]

Purpose: [Why this matters]
Output: [Artifacts created]
</objective>

<execution_context>
@.claude/ink-workflows/workflows/execute-plan.md
@.claude/ink-workflows/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@src/path/to/relevant.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: [Action-oriented name]</name>
  <complexity>simple|medium|complex</complexity>
  <files>path/to/file.ext</files>
  <poc required="false">
    <hypothesis>If I [ACTION], then [EXPECTED_RESULT]</hypothesis>
    <test>```[language]
# Minimal validation code (<20 lines)
```</test>
    <success>What proves POC passed</success>
  </poc>
  <action>[What to do, how, what to avoid and WHY]</action>
  <verify>[Command to prove it worked]</verify>
  <done>[Measurable acceptance criteria]</done>
</task>

<task type="checkpoint:decision" gate="blocking">
  <decision>[What needs deciding]</decision>
  <context>[Why this matters]</context>
  <options>
    <option id="option-a"><name>[Name]</name><pros>[Benefits]</pros><cons>[Tradeoffs]</cons></option>
    <option id="option-b"><name>[Name]</name><pros>[Benefits]</pros><cons>[Tradeoffs]</cons></option>
  </options>
  <resume-signal>Select: option-a or option-b</resume-signal>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>[What needs verification]</what-built>
  <how-to-verify>
    1. Run: [command]
    2. Visit: [URL]
    3. Test: [interactions]
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- [ ] [Test command]
- [ ] [Build passes]
- [ ] [Behavior check]
</verification>

<success_criteria>
- All tasks completed
- All verification passes
- No errors introduced
</success_criteria>

<output>
Create `.planning/phases/XX-name/{phase}-{plan}-SUMMARY.md`
</output>
```

---

## Key Elements

- XML structure for Claude parsing
- @context references for file loading
- Task types: `auto`, `checkpoint:human-action`, `checkpoint:human-verify`, `checkpoint:decision`
- Action includes "what to avoid and WHY"
- Verification is executable
- Success criteria is measurable

## Scope Rules

**Plan sizing:**
- 2-3 tasks per plan (max 3)
- If >3 tasks, split into multiple plans
- Target ~50% context usage max

**When to split:**
- Different subsystems
- Clear dependency boundaries
- Risk of context overflow
- TDD candidates (one feature per TDD plan)

## Task Types

| Type | Use |
|------|-----|
| `type="auto"` | Execute without stopping |
| `type="checkpoint:human-action"` | User must do something |
| `type="checkpoint:human-verify"` | User must verify output |
| `type="checkpoint:decision"` | User must choose option |

**Gates:** `blocking` (must resolve) or `optional` (can skip)

## Dependencies

- `depends_on: []` + no file conflicts = can run parallel
- `depends_on: ["01-01"]` OR shared files = run sequentially
- execute-phase analyzes this automatically

## After Completion

Create SUMMARY.md with: Accomplishments, Files Modified, Decisions Made, Issues Encountered, Next Step
