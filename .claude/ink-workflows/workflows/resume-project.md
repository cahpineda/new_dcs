<purpose>
Restore full project context and present clear status for session continuity.
"Where were we?" should have an immediate, complete answer.

See @references/ui-brand.md for output formatting ("Next Up" blocks).
</purpose>

<trigger>
- Starting a new session on existing project
- User says "continue", "what's next", "where were we", "resume"
- User returns after time away
</trigger>

<execution_order>
1. detect_existing_project - Check .planning/ exists
2. load_state - Parse STATE.md and PROJECT.md
3. check_incomplete_work - Find .continue-here or incomplete plans
4. present_status - Show current status
5. determine_next_action - Identify primary action
6. offer_options - Present choices to user
7. route_to_workflow - Execute user choice
</execution_order>

<step name="detect_existing_project">
`node bin/ink-tools.js state snapshot` — if returns data with `raw_exists: true`, project exists. If error, check which files are missing.

- STATE.md exists → load_state
- Only ROADMAP/PROJECT exist → Offer to reconstruct STATE.md
- .planning/ missing → Route to /ink:new-project
</step>

<step name="load_state">
`node bin/ink-tools.js state snapshot` returns current_phase, total_phases, status, session (last_session, stopped_at), progress, next_actions, has_blockers, has_pending_todos as JSON.

**Extract from STATE.md:**
- Current Position: Phase X of Y, Plan A of B, Status
- Progress bar
- Recent Decisions
- Blockers/Concerns
- Session Continuity (where we left off)

**Extract from PROJECT.md:**
- What This Is (one-liner)
- Requirements (Validated, Active)
- Key Decisions
</step>

<step name="check_incomplete_work">
`node bin/ink-tools.js phase next-plan <N>` returns next unexecuted plan. `node bin/ink-tools.js phase count <N>` for plan/summary counts and remaining count.

Flag any incomplete work found.
</step>

<step name="present_status">
```
PROJECT STATUS
Building: [one-liner from PROJECT.md]

Phase: [X] of [Y] - [Phase name]
Plan:  [A] of [B] - [Status]
Progress: [progress bar] XX%

Last activity: [date] - [what happened]

[If incomplete work:] Incomplete work detected: [details]
[If blockers:] Carried concerns: [list]
```
</step>

<step name="determine_next_action">
`node bin/ink-tools.js init go` returns suggested_route, project/roadmap existence, is_brownfield, current_phase, and config — use suggested_route for routing.

1. .continue-here exists → Resume from checkpoint
2. Incomplete plan (PLAN without SUMMARY) → Complete it
3. All plans complete in phase → Transition to next
4. Phase ready to plan:
   - CONTEXT.md missing → Suggest /ink:discuss-phase first
   - CONTEXT.md exists → Suggest /ink:plan-phase
5. Phase ready to execute → Execute next plan
</step>

<step name="offer_options">
```
What would you like to do?

1. [Primary action based on state]
2. Review current phase status
3. Check deferred issues ([N] open)
4. Something else
```

Wait for user selection.
</step>

<step name="route_to_workflow">
Based on selection:

- **Execute plan** → Show "Next Up" block (see @references/continuation-format.md):
  ```
  ## ▶ Next Up
  **{phase}-{plan}: [Plan Name]** — [objective from PLAN.md]
  `/ink:go`
  ```

- **Plan phase** → Show "Next Up" block:
  ```
  ## ▶ Next Up
  **Phase [N]: [Name]** — [goal from ROADMAP.md]
  `/ink:go`
  ```

- **Transition** → ./transition.md
- **Review issues** → Read ISSUES.md, present summary
</step>

<reconstruction>
If STATE.md missing but artifacts exist:
1. Read PROJECT.md → Extract core info
2. Read ROADMAP.md → Find current phase
3. Scan *-SUMMARY.md → Extract decisions
4. Check for .continue-here → Session continuity

Reconstruct STATE.md, then proceed normally.
</reconstruction>

<quick_resume>
If user says just "continue" or "go":
- Load state silently
- Determine primary action
- Execute immediately without options

"Continuing from [state]... [action]"
</quick_resume>

<success_criteria>
- [ ] STATE.md loaded (or reconstructed)
- [ ] Incomplete work detected and flagged
- [ ] Clear status presented
- [ ] Contextual actions offered
- [ ] User knows where project stands
</success_criteria>
