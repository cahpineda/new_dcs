<purpose>
Guide manual user acceptance testing with persistent state. Extract deliverables from SUMMARY.md, create/resume UAT.md, guide user through each test with auto-severity inference, log issues, and offer diagnosis for failures.
See @references/edge-cases.md for edge case testing patterns.

The USER performs all testing — Claude generates the checklist, guides the process, and captures issues.
</purpose>

<process>

<execution_order>
**MANDATORY EXECUTION SEQUENCE - Execute ALL steps in this order:**

1. `identify` - Determine what to test (from args or recent SUMMARY.md)
2. `load_or_create_uat` - Load existing UAT.md or prepare to create one
3. `extract` - Extract deliverables/features from SUMMARY.md
4. `generate` - Generate test scenarios and write to UAT.md
5. `guide` - Guide user through each test step
6. `collect` - Collect pass/fail results with auto-severity inference
7. `log` - Log issues to ISSUES.md and update UAT.md
8. `summarize` - Summarize test results
9. `offer` - Offer next action (diagnose, fix, retest, continue)

**IMPORTANT:** The USER performs all testing - Claude guides and captures.
</execution_order>

<step name="identify">
**Determine what to test:**

If $ARGUMENTS provided:
- Parse as phase number (e.g., "4") or plan number (e.g., "04-02")
- Find corresponding SUMMARY.md file(s)

If no arguments:
- Find most recently modified SUMMARY.md

```bash
find .planning/phases -name "*SUMMARY.md" -type f -exec ls -lt {} + | head -5
```

Read the SUMMARY.md to understand what was built.
Extract phase number and phase directory path.
</step>

<step name="load_or_create_uat">
**Check for existing UAT.md:**

Look for `{phase}-UAT.md` in the phase directory:
```bash
UAT_FILE=".planning/phases/${PHASE_DIR}/${PHASE_NUM}-UAT.md"
```

**If UAT.md exists (resuming):**
- Read existing UAT.md
- Count scenarios by status: pass, fail, blocked, skip, untested
- Display resume banner:
  ```
  Ink > RESUMING UAT — X passed, Y failed, Z untested
  ```
- Only present untested and previously-failed scenarios for testing
- Preserve all previous results

**If UAT.md does not exist:**
- Will create in the `generate` step
- Continue to extract deliverables
</step>

<step name="extract">
**Extract testable deliverables from SUMMARY.md:**

**Code discovery preference:** P2C FIRST (`query_dead_code` for dead code, `trace_call_path` for wiring) → Serena (`find_referencing_symbols` for wiring checks, `get_symbols_overview` for substance verification) → Grep/Glob/Read (last resort only if MCP unavailable).

Parse for:
1. **Accomplishments** - Features/functionality added
2. **Files Created/Modified** - What changed
3. **User-facing changes** - UI, workflows, interactions

Focus on USER-OBSERVABLE outcomes, not implementation details.

If resuming with existing UAT.md, skip extraction — scenarios already defined.
</step>

<step name="generate">
**Generate test scenarios and persist to UAT.md:**

Use template structure from `@templates/uat.md`:
- Each user-observable deliverable becomes one test scenario
- Include pre-flight checks (builds, runs)
- Include edge cases from @references/edge-cases.md

Write scenarios to `{phase}-UAT.md` in the phase directory.
All scenarios start as `untested` with severity `-`.

Present the scenario list to the user before starting tests.

If resuming: skip creation, show remaining untested/failed scenarios.
</step>

<step name="guide">
**Guide user through each test:**

For each test scenario (untested or previously failed), use AskUserQuestion:
- header: "[Scenario name]"
- question: "[Test description] - Did this work as expected?"
- options:
  - "Pass" — Works correctly
  - "Fail" — Doesn't work as expected
  - "Partial" — Works but with issues
  - "Skip" — Can't test right now
</step>

<step name="collect">
**Collect results with auto-severity inference:**

**If Pass:** Update UAT.md scenario status to `pass`. Move to next.

**If Fail or Partial:**
Follow up with AskUserQuestion:
- header: "Issue details"
- question: "What went wrong?"
- options:
  - "Crashes/errors" — Application error or exception
  - "Wrong behavior" — Does something unexpected
  - "Missing feature" — Expected functionality not present
  - "UI/visual issue" — Looks wrong but functions

**Auto-severity inference from response:**

| Response | Severity | Mapping |
|----------|----------|---------|
| Crashes/errors | P0 | Critical — crash, data loss, security |
| Wrong behavior | P1 | Major — feature broken |
| Missing feature | P1 | Major — functionality absent |
| Partial (with workaround) | P2 | Moderate — degraded but usable |
| UI/visual issue | P3 | Minor — cosmetic only |

Update UAT.md scenario in-place: set status (`fail`/`blocked`), set inferred severity.
</step>

<step name="log">
**Log issues to phase-scoped file and update UAT.md:**

If any issues found:

1. Create `.planning/phases/XX-name/{phase}-{plan}-ISSUES.md` if doesn't exist
2. Use template from `@templates/uat-issues.md`
3. Add each issue with auto-inferred severity:

```markdown
### UAT-[NNN]: [Brief description]

**Discovered:** [date] during user acceptance testing
**Phase/Plan:** [phase]-[plan]
**Severity:** [P0/P1/P2/P3]
**Description:** [User's description]
**Expected:** [What should have happened]
**Actual:** [What actually happened]
```

4. Update UAT.md: fill Issue column with UAT-NNN reference
5. Update UAT.md Summary table counts

Issues go to phase-scoped file, NOT global `.planning/ISSUES.md`.
</step>

<step name="summarize">
**Present test summary:**

```
# Test Results: [Plan/Phase Name]

**Tests run:** [N] | **Passed:** [N] | **Failed:** [N] | **Skipped:** [N]

## Issues by Severity
- P0 (Critical): [N]
- P1 (Major): [N]
- P2 (Moderate): [N]
- P3 (Minor): [N]

## Verdict
[Based on results:]
- ALL PASS: "All tests passed. Feature validated."
- P3 ONLY: "Feature works with minor issues logged."
- P1/P2: "Issues found — diagnosis recommended."
- P0: "Critical issues — must fix before continuing."
```

Update UAT.md Status field (IN_PROGRESS → COMPLETE or BLOCKED).
</step>

<step name="offer">
**Offer next actions based on results:**

Use AskUserQuestion:
- header: "Next"
- question: "What would you like to do?"

**If all passed:**
- "Continue to next phase" — Proceed with confidence
- "Test more" — Run additional manual tests
- "Done" — Finish testing session

**If P0-P2 issues found:**
- "Diagnose failures" — Spawn debug agents per issue (`diagnose-issues.md`)
- "Plan fixes" — Create fix plan directly (`plan-fix.md`)
- "Log and continue" — Issues logged, proceed anyway
- "Done" — Finish testing session

**If only P3 issues:**
- "Continue to next phase" — Minor issues logged, safe to proceed
- "Plan fixes" — Create fix plan for cosmetic issues
- "Done" — Finish testing session
</step>

</process>

<success_criteria>
- [ ] Test scope identified from SUMMARY.md
- [ ] UAT.md created or updated with test results
- [ ] User guided through each test via AskUserQuestion
- [ ] Auto-severity inferred from failure type (P0-P3)
- [ ] Any issues logged to phase-scoped ISSUES.md
- [ ] Diagnosis offered for P0-P2 failures
- [ ] Summary with verdict presented
- [ ] User knows next steps based on results
</success_criteria>
