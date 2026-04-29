<purpose>
Mark current phase complete and advance to next. Updates ROADMAP.md, evolves PROJECT.md, updates STATE.md.

See @references/ui-brand.md for output formatting (banners, "Next Up" blocks).
</purpose>

<required_reading>
1. .planning/STATE.md
2. .planning/PROJECT.md
3. .planning/ROADMAP.md
4. Current phase's *-PLAN.md and *-SUMMARY.md files
</required_reading>

<process>

<execution_order>
1. load_project_state - Read STATE.md and PROJECT.md
2. verify_completion - Check all plans have summaries
3. cleanup_handoff - Delete stale .continue-here.md files
4. update_roadmap - Mark phase complete
5. archive_prompts - Leave prompts in place
6. evolve_project - Update PROJECT.md requirements/decisions
7. update_current_position - Update STATE.md position
8. update_project_reference - Update reference section
9. review_accumulated_context - Review blockers, decisions
10. update_session_continuity - Update session info
11. offer_next_phase - Show next steps
</execution_order>

<step name="load_project_state">
`node bin/ink-tools.js state snapshot` returns full state as JSON (current_phase, status, session, progress, next_actions, blockers).
Also read PROJECT.md for evolution step.
</step>

<step name="verify_completion">
`node bin/ink-tools.js init verify <N>` returns plan/summary counts, verification items, and all_plans_complete flag.

If counts match: "Phase X complete - all Y plans finished. Ready to advance?"
If incomplete: Show missing summaries, ask: Continue phase / Mark complete anyway / Review

Note: "Mark complete anyway" is destructive - ALWAYS prompt regardless of mode.
</step>

<step name="cleanup_handoff">
**Primary:** Use Glob `.planning/phases/XX-current/.continue-here*.md` to find stale handoffs.
Delete any found - phase complete, handoffs stale.
</step>

<step name="update_roadmap">
`node bin/ink-tools.js phase complete <N>` marks phase done in ROADMAP (✅, status, checkboxes) atomically.
</step>

<step name="archive_prompts">
Prompts stay in place. completed/ subfolder handles archival.
</step>

<step name="evolve_project">
Read phase summaries, update PROJECT.md:

1. Requirements validated? -> Move to Validated: "- v [Req] - Phase X"
2. Requirements invalidated? -> Move to Out of Scope with reason
3. Requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions table
5. "What This Is" still accurate? -> Update if product changed
6. Update footer: "Last updated: [date] after Phase X"
</step>

<step name="update_current_position">
`node bin/ink-tools.js state set <field> <value>` updates any STATE.md field deterministically. Then `node bin/ink-tools.js state update-progress` recalculates progress bar.
</step>

<step name="update_project_reference">
Update STATE.md Project Reference:

```markdown
## Project Reference
See: .planning/PROJECT.md (updated [today])
**Core value:** [From PROJECT.md]
**Current focus:** [Next phase name]
```
</step>

<step name="review_accumulated_context">
Update STATE.md Accumulated Context:
- Note 3-5 recent decisions (full log in PROJECT.md)
- Remove resolved blockers
- Keep unresolved with phase prefix
- Add new concerns from summaries
- Update deferred issues count
</step>

<step name="update_session_continuity">
`node bin/ink-tools.js state record-session --stopped-at "Phase X complete, ready to plan Phase X+1"` updates all session fields atomically.
</step>

<step name="offer_next_phase">
Display phase completion banner (see @references/ui-brand.md):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Ink ► PHASE {N} COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Read ROADMAP.md, identify current milestone phases.

**If more phases remain (use "Next Up" format from @references/continuation-format.md):**
Yolo: Auto-invoke /ink:plan-phase [X+1]
Interactive: Show next phase, offer /ink:plan-phase [X+1]

**If milestone complete (all phases done):**
Yolo: Auto-invoke /ink:complete-milestone [version]
Interactive: Celebrate, offer /ink:complete-milestone [version]
</step>

</process>

<implicit_tracking>
Progress is implicit: "Plan phase 2" implies phase 1 done.
Forward motion IS progress. No separate update step needed.
</implicit_tracking>

<partial_completion>
If user wants to advance but phase incomplete:
- Show which plans missing
- Options: Mark complete anyway / Defer work / Stay and finish
- If marking incomplete: Update count "2/3 plans complete" (not 3/3)
</partial_completion>

<success_criteria>
- [ ] Phase summaries verified
- [ ] Handoffs cleaned up
- [ ] ROADMAP.md updated
- [ ] PROJECT.md evolved
- [ ] STATE.md updated (position, reference, context, session)
- [ ] User knows next steps
</success_criteria>
