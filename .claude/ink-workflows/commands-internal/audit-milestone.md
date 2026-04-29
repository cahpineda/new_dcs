---
name: ink:audit-milestone
description: Audit milestone for requirements coverage, artifact completeness, and integration wiring
arguments:
  - name: version
    description: Milestone version to audit (defaults to current)
    required: false
---

# Audit Milestone

Comprehensive milestone audit with scored report. Run before completing a milestone.

<objective>
Verify milestone quality across 4 dimensions: requirements coverage, artifact completeness, phase verification status, and cross-phase integration wiring. Produce scored audit report that feeds into plan-milestone-gaps for remediation.

See @references/ui-brand.md for output formatting (banners, spawning indicators, "Next Up" blocks).
</objective>

<execution_flow>

## Step 1: Initialize & Scope

`node bin/ink-tools.js state snapshot` for current milestone context.
`node bin/ink-tools.js phase list` for all phases and their status.

Extract:
- **Milestone version** (from STATE.md or `$version` argument)
- **Milestone name** and phase range
- **Phase count** and completion status

Read ROADMAP.md sections for each phase to extract success criteria.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Ink ► MILESTONE AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Auditing v{X.Y} {Name}
Phases: {range} ({N} phases)
```

## Step 2: Phase Verification Aggregation

For each phase in milestone:

1. `node bin/ink-tools.js phase resolve <N>` for directory path
2. Read all `*-SUMMARY.md` files — extract:
   - `key-files.created` and `key-files.modified` from frontmatter
   - `one-liner` description
   - `tags` for categorization
3. Check for `*-VERIFICATION.md` existence
   - If exists: extract `status`, `score`, failed requirements
   - If missing: mark as **unverified**

Aggregate into:
```yaml
phase_results:
  - phase: N
    name: "phase-name"
    plans: M
    summaries: M
    verified: true|false
    verification_status: "passed"|"partial"|"failed"|null
    files_created: [...]
    files_modified: [...]
```

## Step 3: Requirements Coverage

For each phase in ROADMAP.md, extract **Success Criteria** items.

Map each requirement to evidence from SUMMARY.md files:
- **SATISFIED** ✓ — Clear evidence in SUMMARY (file created, test passing, feature working)
- **PARTIAL** ◆ — Some evidence but incomplete (e.g., file exists but not all criteria met)
- **UNSATISFIED** ✗ — No evidence found
- **DEFERRED** ⊘ — Explicitly deferred in ROADMAP or SUMMARY

Calculate: `requirements_score = (satisfied + 0.5 * partial) / total * 100`

## Step 4: Artifact Completeness

From all SUMMARY.md `key-files.created`, verify each file still exists:

```bash
# For each created file
ls -la "$FILE_PATH" 2>/dev/null
```

Check artifact expectations by type:
- **Agent files:** Exists in `.claude/agents/`, listed in `README.md`
- **Workflow files:** Exists in `.claude/ink-workflows/`, has routing or @-reference
- **Reference files:** Exists in `.claude/ink-workflows/references/`, @-referenced
- **Test files:** Exists, can be listed

Calculate: `artifact_score = existing / expected * 100`

## Step 5: Integration Check

◆ Spawning ink-integration-checker-agent...

```
Task(
  subagent_type="ink-integration-checker-agent",
  prompt="<context>
    milestone: v{X.Y}
    phase_range: {start}-{end}
    phase_outputs: {JSON of phase_results from Step 2}
  </context>
  Verify cross-phase integration wiring for this milestone.",
  description="Integration check v{X.Y}"
)
```

✓ ink-integration-checker-agent complete: integration report

Extract from agent output:
- `connected`, `orphaned`, `warnings`, `broken_dependencies` counts
- Issue list for report

Calculate: `integration_score = connected / (connected + orphaned) * 100`

## Step 6: Compute Scores

```yaml
scores:
  requirements: N%     # From Step 3
  artifacts: N%        # From Step 4
  integration: N%      # From Step 5
  phase_coverage: N%   # phases_with_verification / total_phases * 100
  overall: N%          # Weighted: req 40% + artifacts 25% + integration 25% + coverage 10%
```

**Status determination:**
- `passed` — overall ≥ 90%, zero critical gaps
- `tech_debt` — overall ≥ 70%, zero critical gaps, deferred items exist
- `gaps_found` — overall < 70% OR any critical gap (unsatisfied requirement, orphaned artifact)

## Step 7: Generate Audit Report

```bash
mkdir -p .planning/milestones
```

Write `.planning/milestones/{version}-MILESTONE-AUDIT.md`:

```yaml
---
milestone: "v{X.Y}"
name: "{Milestone Name}"
audited: "{date}"
status: "passed" | "gaps_found" | "tech_debt"
scores:
  requirements: {N}
  artifacts: {N}
  integration: {N}
  phase_coverage: {N}
  overall: {N}
phases_audited: {N}
critical_gaps: {N}
---
```

Sections:
1. **Executive Summary** — 2-3 sentences, overall status, key finding
2. **Requirements Coverage** — Table: Requirement | Phase | Status (✓/◆/✗/⊘) | Evidence
3. **Artifact Completeness** — Table: Artifact | Phase | Exists | Wired | Status
4. **Integration Report** — From integration-checker (connected/orphaned/warnings)
5. **Unverified Phases** — Phases without VERIFICATION.md
6. **Gaps** — Categorized: critical (unsatisfied req, orphaned), major (partial, warned), minor (unverified)
7. **Recommendations** — Next steps based on status

## Step 8: Report to User

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Ink ► MILESTONE AUDIT COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

v{X.Y} {Name}
Overall: {N}% | Req: {N}% | Artifacts: {N}% | Integration: {N}%
Status: {PASSED ✓ / GAPS FOUND ✗ / TECH DEBT ⚠}
Gaps: {N} critical, {N} major, {N} minor
Report: .planning/milestones/{version}-MILESTONE-AUDIT.md
```

**If status = gaps_found:**
```
## ▶ Next Up
**Plan Gaps** — Create remediation phases for {N} gaps
`/ink:go plan gaps`
```

**If status = passed:**
```
## ▶ Next Up
**Complete Milestone** — Ship v{X.Y}
`/ink:go complete milestone`
```

**If status = tech_debt:**
```
## ▶ Next Up
**Review Debt** — {N} deferred items to review
`/ink:go plan gaps` or `/ink:go complete milestone`
```

</execution_flow>

<success_criteria>
- Audit report generated with scores across 4 dimensions
- Integration checker spawned for wiring verification
- Clear status determination (passed/gaps_found/tech_debt)
- Actionable next step based on result
</success_criteria>

<references>
- @commands-internal/plan-milestone-gaps.md
- @.claude/ink-workflows/workflows/complete-milestone.md
- @.claude/agents/ink-integration-checker-agent.md
</references>
