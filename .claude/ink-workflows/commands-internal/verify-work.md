---
name: ink:verify-work
description: Guide manual user acceptance testing of recently built features
argument-hint: "[optional: phase or plan number, e.g., '4' or '04-02']"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Edit
  - Write
  - AskUserQuestion
---

<objective>
Guide the user through manual acceptance testing of recently built features.

Purpose: Validate that what Claude thinks was built actually works from the user's perspective. The USER performs all testing — Claude generates the test checklist, guides the process, and captures issues.

Output: Persistent UAT.md with test results, any issues logged to phase-scoped ISSUES.md
</objective>

<execution_context>
@.claude/ink-workflows/workflows/verify-work.md
@.claude/ink-workflows/templates/uat-issues.md
@.claude/ink-workflows/templates/uat.md
</execution_context>

<context>
Scope: $ARGUMENTS (optional)
- If provided: Test specific phase or plan (e.g., "4" or "04-02")
- If not provided: Test most recently completed plan

**Load project state:**
@.planning/STATE.md

**Load roadmap:**
@.planning/ROADMAP.md
</context>

<process>
1. Validate arguments (if provided, parse as phase or plan number)
2. Find relevant SUMMARY.md (specified or most recent)
3. Follow verify-work.md workflow:
   - Load or create persistent UAT.md (resume previous session if exists)
   - Extract testable deliverables from SUMMARY.md
   - Generate test scenarios with auto-severity inference (P0-P3)
   - Guide through each test via AskUserQuestion
   - Collect results, auto-infer severity from failure type
   - Log issues to `.planning/phases/XX-name/{phase}-{plan}-ISSUES.md`
   - Update UAT.md with results in-place
   - Present summary with verdict
4. Offer next steps based on results:
   - If all passed: Continue to next phase
   - If P0-P2 issues: Diagnose failures or plan fixes
   - If P3 only: Continue with minor issues logged
</process>

<anti_patterns>
- Don't run automated tests (that's for CI/test suites)
- Don't make assumptions about test results — USER reports outcomes
- Don't skip the guidance — walk through each test
- Don't dismiss minor issues — log everything user reports
- Don't fix issues during testing — capture for later
</anti_patterns>

<success_criteria>
- [ ] Test scope identified from SUMMARY.md
- [ ] UAT.md created or updated with test results
- [ ] User guided through each test via AskUserQuestion
- [ ] Auto-severity inferred from failure type (P0-P3)
- [ ] Any issues logged to phase-scoped ISSUES.md (not global)
- [ ] Diagnosis offered for P0-P2 failures
- [ ] Summary presented with verdict
- [ ] User knows next steps based on results
</success_criteria>
