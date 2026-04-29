# UAT: [MILESTONE_OR_PHASE]

**Created:** [DATE]
**Last tested:** [DATE]
**Status:** [IN_PROGRESS / COMPLETE / BLOCKED]
**Tester:** User via /ink:verify-work
**Source:** [SUMMARY.md path that generated scenarios]

## Summary

| Status | Count |
|--------|-------|
| Pass   | [N]   |
| Fail   | [N]   |
| Blocked| [N]   |
| Skip   | [N]   |
| Untested| [N]  |

## Test Scenarios

| # | Scenario | Steps | Expected | Status | Severity | Issue | Diagnosis |
|---|----------|-------|----------|--------|----------|-------|-----------|
| 1 | [SCENARIO_NAME] | [STEPS_TO_PERFORM] | [EXPECTED_RESULT] | untested | - | - | - |
| 2 | [SCENARIO_NAME] | [STEPS_TO_PERFORM] | [EXPECTED_RESULT] | untested | - | - | - |

**Status values:** `pass`, `fail`, `blocked`, `skip`, `untested`
**Severity values:** `P0`, `P1`, `P2`, `P3`, `-` (auto-inferred from failure type)
**Issue column:** Link to UAT-NNN in ISSUES.md when fail/blocked
**Diagnosis column:** Link to DIAGNOSIS.md entry when investigated

## Severity Auto-Inference

| User Response | Severity | Definition |
|---------------|----------|------------|
| "Crashes/errors" | P0 | Critical — crash, data loss, security hole. Blocks release. |
| "Wrong behavior" | P1 | Major — feature broken, does unexpected thing. |
| "Missing feature" | P1 | Major — expected functionality absent. |
| "Partially works" | P2 | Moderate — feature degraded but has workaround. |
| "UI/visual issue" | P3 | Minor — cosmetic, no functional impact. |
| "Minor inconvenience" | P3 | Minor — low impact, usable. |

## Diagnosis Lifecycle

| Issue | Status | Agent | Root Cause | Fix Plan |
|-------|--------|-------|------------|----------|
| [UAT-NNN] | [pending/investigating/diagnosed/fixed] | - | - | - |

**Lifecycle:** pending → investigating (debug agent spawned) → diagnosed (root cause found) → fixed (fix plan executed)

---

<guidelines>
**One UAT.md per phase or milestone** being tested.

**Location:** `.planning/phases/XX-name/XX-UAT.md`

**Persistent state:** Survives session restarts — file-based, updated in-place by verify-work.md workflow. When user resumes testing, previously completed scenarios are preserved.

**Scenario generation:** Scenarios are extracted from SUMMARY.md deliverables during verify-work. Each user-observable outcome becomes one test scenario.

**Relationship to other files:**
- **UAT.md** (this): Master test plan — scenarios, status, severity
- **ISSUES.md**: Individual bug details — repro steps, expected/actual (created per-issue by verify-work)
- **DIAGNOSIS.md**: Root cause analysis — debug agent findings (created by diagnose-issues)
- **FIX.md**: Remediation plan — fix tasks per issue (created by plan-fix)

**Update protocol:**
1. verify-work creates UAT.md with scenarios (status: untested)
2. As user tests, status updated in-place (pass/fail/blocked/skip)
3. Failed scenarios get severity auto-inferred and ISSUES.md entry
4. diagnose-issues updates Diagnosis Lifecycle table
5. After fixes, status updated to pass on re-test
</guidelines>
