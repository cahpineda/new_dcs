---
name: ink:plan-milestone-gaps
description: Create phases to close all gaps identified by milestone audit
arguments:
  - name: audit_file
    description: Path to milestone audit file (defaults to latest)
    required: false
---

# Plan Milestone Gaps

Analyze milestone audit results and create remediation phases for any gaps found.

<objective>
Read the milestone audit report, identify all gaps/failures, and generate new phases to close them before milestone completion.
</objective>

<execution_flow>

## Step 1: Locate Audit File

```bash
# If audit_file provided, use it
# Otherwise, find the latest audit
AUDIT_FILE="${audit_file:-$(ls -t .planning/milestones/*-MILESTONE-AUDIT.md 2>/dev/null | head -1)}"

if [ ! -f "$AUDIT_FILE" ]; then
  echo "No milestone audit found. Run /ink:audit-milestone first."
  exit 1
fi
```

## Step 2: Parse Audit Results

Extract from audit file:
- **Milestone name and version**
- **Total requirements**
- **Failed requirements** (status != COMPLETE and status != DEFERRED)
- **Partial requirements** (status == PARTIAL)
- **Deferred requirements** (status == DEFERRED) — note but don't remediate
- **Integration issues** (cross-phase problems)
- **Quality gate failures**

## Step 3: Categorize Gaps

Group gaps by type:

| Category | Example Gaps |
|----------|--------------|
| **Missing artifacts** | File doesn't exist, stub content |
| **Broken wiring** | Agent not connected to routing |
| **Failed requirements** | Requirement not satisfied |
| **Integration gaps** | Cross-phase connection broken |
| **Quality failures** | Tests failing, lint errors |

## Step 4: Generate Remediation Phases

For each gap category with issues:

**Create remediation phase:**

```markdown
## Phase [N+0.1]: Gap Remediation - [Category]

**Goal:** Close gaps identified in milestone audit

**Requirements:**
- [REQ-XX]: [description] (was: FAILED)
- [REQ-YY]: [description] (was: PARTIAL)

**Plans:**
- [N+0.1]-01-PLAN.md: [specific fix for gap 1]
- [N+0.1]-02-PLAN.md: [specific fix for gap 2]

**Success criteria:**
- [ ] All listed requirements now COMPLETE
- [ ] Audit re-run shows no failures
```

## Step 5: Update ROADMAP.md

Insert remediation phases before milestone completion:

```markdown
## Gap Remediation (auto-generated)

| Phase | Description | Plans | Status |
|-------|-------------|-------|--------|
| [N].1 | Gap: Missing artifacts | 2 | Pending |
| [N].2 | Gap: Integration wiring | 1 | Pending |
```

## Step 6: Create Phase Directories

```bash
for GAP_PHASE in $GAP_PHASES; do
  mkdir -p ".planning/phases/${GAP_PHASE}"
done
```

## Step 7: Generate Plan Files

For each gap, create a targeted PLAN.md:

```yaml
---
phase: [N].X-gap-remediation
plan: 01
type: execute
autonomous: true
must_haves:
  truths:
    - "[Requirement] is now satisfied"
  artifacts:
    - path: "[missing file]"
      provides: "[what it should provide]"
---

<objective>
Fix gap: [specific gap description]
</objective>

<tasks>
<task type="auto">
  <name>Fix: [gap]</name>
  <action>
  [Specific instructions to fix the gap]
  </action>
  <verify>
  [How to verify the fix]
  </verify>
</task>
</tasks>
```

## Step 8: Report

```
## Gap Remediation Plan

**Audit:** ${AUDIT_FILE}
**Gaps found:** [N]
**Remediation phases:** [M]

### Phases Created

| Phase | Gaps Addressed | Plans |
|-------|----------------|-------|
| [N].1 | 3 missing artifacts | 2 |
| [N].2 | 1 integration issue | 1 |

### Deferred (Not Remediated)

These gaps are intentionally deferred to future milestones:
- [INTG-01]: Jira integration (deferred to v2.1)
- [INTG-02]: KB integration (deferred to v2.1)

---

Next steps:
1. Review generated plans in `.planning/phases/[N].X-*/`
2. Run /ink:execute-phase [N].1 to start remediation
3. Re-run /ink:audit-milestone after all phases complete
```

</execution_flow>

<gap_severity>

| Severity | Action |
|----------|--------|
| **Blocker** | Must fix before milestone complete |
| **Major** | Should fix, creates tech debt if skipped |
| **Minor** | Can defer, document in ISSUES.md |

</gap_severity>

<success_criteria>
- All non-deferred gaps have remediation plans
- Plans are specific and actionable
- ROADMAP.md updated with remediation phases
- Phase directories created
- Clear report of what was created
</success_criteria>

<references>
- @.planning/ROADMAP.md
- @.claude/ink-workflows/templates/phase-prompt.md
</references>
