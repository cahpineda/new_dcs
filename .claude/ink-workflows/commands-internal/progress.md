---
name: ink:progress
description: Check project progress, show context, and route to next action (execute or plan)
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
  - SlashCommand
---

<objective>
Check project progress, summarize recent work and what's ahead, then intelligently route to the next action - either executing an existing plan or creating the next one.

Provides situational awareness before continuing work.
</objective>


<process>

<step name="verify">
**Verify planning structure exists:**

If no `.planning/` directory:

```
No planning structure found.

Run /ink:new-project to start a new project.
```

Exit.

If missing STATE.md or ROADMAP.md: inform what's missing, suggest running `/ink:new-project`.
</step>

<step name="load">
**Primary:** `node bin/ink-tools.js state snapshot` returns full state JSON. `node bin/ink-tools.js config dump` for config.
**Fallback:** Load full project context manually:
- Read `.planning/STATE.md` for living memory (position, decisions, issues)
- Read `.planning/ROADMAP.md` for phase structure and objectives
- Read `.planning/PROJECT.md` for current state (What This Is, Core Value, Requirements)
  </step>

<step name="recent">
**Gather recent work context:**

- Find the 2-3 most recent SUMMARY.md files
- Extract from each: what was accomplished, key decisions, any issues logged
- This shows "what we've been working on"
  </step>

<step name="position">
**Primary:** `node bin/ink-tools.js phase count <N>` returns plans, summaries, remaining counts. `node bin/ink-tools.js state snapshot` for phase position, blockers, and pending todos.
**Fallback:** Parse current position manually:
- From STATE.md: current phase, plan number, status
- Calculate: total plans, completed plans, remaining plans
- Note any blockers, concerns, or deferred issues
- Check for CONTEXT.md: For phases without PLAN.md files, check if `{phase}-CONTEXT.md` exists in phase directory
- Count pending todos: `ls .planning/todos/pending/*.md 2>/dev/null | wc -l`
- Check for active debug sessions: `ls .planning/debug/*.md 2>/dev/null | grep -v resolved | wc -l`
  </step>

<step name="report">
**Present rich status report:**

```
# [Project Name]

**Progress:** [████████░░] 8/10 plans complete

## Recent Work
- [Phase X, Plan Y]: [what was accomplished - 1 line]
- [Phase X, Plan Z]: [what was accomplished - 1 line]

## Current Position
Phase [N] of [total]: [phase-name]
Plan [M] of [phase-total]: [status]
CONTEXT: [✓ if CONTEXT.md exists | - if not]

## Key Decisions Made
- [decision 1 from STATE.md]
- [decision 2]

## Open Issues
- [any deferred issues or blockers]

## Pending Todos
- [count] pending — /ink:check-todos to review

## Active Debug Sessions
- [count] active — /ink:debug to continue
(Only show this section if count > 0)

## What's Next
[Next phase/plan objective from ROADMAP]
```

</step>

<step name="route">
**Determine next action based on verified counts.**

**Step 1: Count plans, summaries, and issues in current phase**

**Primary:** `node bin/ink-tools.js phase count <N>` returns plans, summaries, remaining counts. `node bin/ink-tools.js phase next-plan <N>` returns next unexecuted plan.
**Fallback:** List files in the current phase directory:

```bash
ls -1 .planning/phases/[current-phase-dir]/*-PLAN.md 2>/dev/null | wc -l
ls -1 .planning/phases/[current-phase-dir]/*-SUMMARY.md 2>/dev/null | wc -l
ls -1 .planning/phases/[current-phase-dir]/*-ISSUES.md 2>/dev/null | wc -l
ls -1 .planning/phases/[current-phase-dir]/*-FIX.md 2>/dev/null | wc -l
ls -1 .planning/phases/[current-phase-dir]/*-FIX-SUMMARY.md 2>/dev/null | wc -l
```

State: "This phase has {X} plans, {Y} summaries, {Z} issues files, {W} fix plans."

**Step 1.5: Check for unaddressed UAT issues**

For each *-ISSUES.md file, check if matching *-FIX.md exists.
For each *-FIX.md file, check if matching *-FIX-SUMMARY.md exists.

Track:
- `issues_without_fix`: ISSUES.md files without FIX.md
- `fixes_without_summary`: FIX.md files without FIX-SUMMARY.md

**Step 2: Route based on counts**

| Condition | Meaning | Action |
|-----------|---------|--------|
| fixes_without_summary > 0 | Unexecuted fix plans exist | Go to **Route A** (with FIX.md) |
| issues_without_fix > 0 | UAT issues need fix plans | Go to **Route E** |
| summaries < plans | Unexecuted plans exist | Go to **Route A** |
| summaries = plans AND plans > 0 | Phase complete | Go to Step 3 |
| plans = 0 | Phase not yet planned | Go to **Route B** |

---

**Route A: Unexecuted plan exists**

Find the first PLAN.md without matching SUMMARY.md.
Read its `<objective>` section.

```
---

## ▶ Next Up

**{phase}-{plan}: [Plan Name]** — [objective summary from PLAN.md]

`/ink:execute-plan [full-path-to-PLAN.md]`

<sub>`/clear` first → fresh context window</sub>

---
```

---

**Route B: Phase needs planning**

Check if `{phase}-CONTEXT.md` exists in phase directory.

**If CONTEXT.md exists:**

```
---

## ▶ Next Up

**Phase {N}: {Name}** — {Goal from ROADMAP.md}
<sub>✓ Context gathered, ready to plan</sub>

`/ink:plan-phase {phase-number}`

<sub>`/clear` first → fresh context window</sub>

---
```

**If CONTEXT.md does NOT exist:**

```
---

## ▶ Next Up

**Phase {N}: {Name}** — {Goal from ROADMAP.md}

`/ink:plan-phase {phase}`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- `/ink:discuss-phase {phase}` — gather context first
- `/ink:research-phase {phase}` — investigate unknowns
- `/ink:list-phase-assumptions {phase}` — see Claude's assumptions

---
```

---

**Route E: UAT issues need fix plans**

ISSUES.md exists without matching FIX.md. User needs to plan fixes.

```
---

## ⚠ UAT Issues Found

**{plan}-ISSUES.md** has {N} issues without a fix plan.

`/ink:plan-fix {plan}`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- `/ink:execute-plan [path]` — continue with other work first
- `/ink:verify-work {phase}` — run more UAT testing

---
```

---

**Step 3: Check milestone status (only when phase complete)**

Read ROADMAP.md and identify:
1. Current phase number
2. All phase numbers in the current milestone section

Count total phases and identify the highest phase number.

State: "Current phase is {X}. Milestone has {N} phases (highest: {Y})."

**Route based on milestone status:**

| Condition | Meaning | Action |
|-----------|---------|--------|
| current phase < highest phase | More phases remain | Go to **Route C** |
| current phase = highest phase | Milestone complete | Go to **Route D** |

---

**Route C: Phase complete, more phases remain**

Read ROADMAP.md to get the next phase's name and goal.

```
---

## ✓ Phase {Z} Complete

## ▶ Next Up

**Phase {Z+1}: {Name}** — {Goal from ROADMAP.md}

`/ink:plan-phase {Z+1}`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- `/ink:verify-work {Z}` — user acceptance test before continuing
- `/ink:discuss-phase {Z+1}` — gather context first
- `/ink:research-phase {Z+1}` — investigate unknowns

---
```

---

**Route D: Milestone complete**

```
---

## 🎉 Milestone Complete

All {N} phases finished!

## ▶ Next Up

**Complete Milestone** — archive and prepare for next

`/ink:complete-milestone`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- `/ink:verify-work` — user acceptance test before completing milestone

---
```

</step>

<step name="edge_cases">
**Handle edge cases:**

- Phase complete but next phase not planned → offer `/ink:plan-phase [next]`
- All work complete → offer milestone completion
- Blockers present → highlight before offering to continue
- Handoff file exists → mention it, offer `/ink:resume-work`
  </step>

</process>

<success_criteria>

- [ ] Rich context provided (recent work, decisions, issues)
- [ ] Current position clear with visual progress
- [ ] What's next clearly explained
- [ ] Smart routing: /ink:execute-plan if plan exists, /ink:plan-phase if not
- [ ] User confirms before any action
- [ ] Seamless handoff to appropriate ink command
      </success_criteria>
