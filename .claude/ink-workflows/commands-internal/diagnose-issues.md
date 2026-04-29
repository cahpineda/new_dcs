---
name: ink:diagnose-issues
description: Spawn parallel debug agents to diagnose UAT failures
argument-hint: "[phase-plan, e.g., '47-01' or 'all']"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Task
  - AskUserQuestion
---

<objective>
Spawn parallel debug agents (one per failed UAT scenario) with pre-filled symptoms from UAT results. Each agent investigates root cause independently.

Purpose: Close the gap between "test found a problem" and "here's why it's broken" — automated root cause analysis at scale.
Output: DIAGNOSIS.md with root causes and suggested fixes per issue.
</objective>

<execution_context>
@.claude/agents/ink-debug-agent.md
@.claude/ink-workflows/templates/uat.md
</execution_context>

<context>
Scope: $ARGUMENTS (required — phase-plan number like "47-01", or "all" for all open issues)

**Load project state:**
@.planning/STATE.md
</context>

<process>

<step name="locate">
**Locate ISSUES.md files:**

Parse $ARGUMENTS:
- If specific plan (e.g., "47-01"): find `.planning/phases/*/{plan}-ISSUES.md`
- If "all": find all ISSUES.md files with open issues

```bash
# Specific plan
ISSUES_FILE=$(find .planning/phases -name "${PLAN_NUM}-ISSUES.md" 2>/dev/null | head -1)

# All open issues
ISSUES_FILES=$(find .planning/phases -name "*-ISSUES.md" 2>/dev/null)
```

If no ISSUES.md found:
```
No UAT issues found for ${ARGUMENTS}.

ISSUES.md files are created by /ink:verify-work when testing finds failures.
Run /ink:verify-work first to test and log issues.
```
Exit.
</step>

<step name="parse">
**Parse open issues:**

Read each ISSUES.md. Extract from "Open Issues" section:
- Issue ID (UAT-NNN)
- Title
- Severity (Blocker/Major/Minor/Cosmetic)
- Feature affected
- Description
- Expected behavior
- Actual behavior
- Repro steps (if available)

Skip issues in "Resolved Issues" section.
Filter: Only diagnose P0-P2 (skip P3/Cosmetic by default).

Report: "Found N open issues (X P0, Y P1, Z P2)"
</step>

<step name="triage">
**Triage and group related issues:**

Group issues that share:
- Same affected files
- Same feature area
- Related symptoms (e.g., both auth-related)

Each group becomes one diagnosis task. Solo issues are their own group.

This avoids spawning redundant agents investigating the same root cause.

Max groups: 4 (Claude Code parallel agent limit).
If more than 4 groups, prioritize by severity (P0 first), batch remainder.
</step>

<step name="spawn">
**Spawn parallel debug agents:**

Display banner:
```
Ink > DIAGNOSING UAT FAILURES
```

For each issue/group, spawn ink-debug-agent via Task tool:

```
◆ Spawning ink-debug-agent... (UAT-001: [title])
◆ Spawning ink-debug-agent... (UAT-002: [title])
```

Task prompt per agent:
```
<diagnosis_request>
Issue: ${ISSUE_ID}: ${ISSUE_TITLE}
Severity: ${SEVERITY}
Feature: ${FEATURE}
Description: ${DESCRIPTION}
Expected: ${EXPECTED}
Actual: ${ACTUAL}
Repro: ${REPRO_STEPS}

INSTRUCTIONS:
1. Investigate the root cause of this issue
2. Do NOT fix anything — only diagnose
3. Identify affected files and code paths
4. Suggest a fix approach with estimated effort
5. Rate your confidence: high/medium/low
</diagnosis_request>
```

Use `subagent_type="ink-debug-agent"` and `description="Diagnose: ${ISSUE_ID}"`.

Spawn all agents in a single message (parallel execution).
</step>

<step name="collect">
**Collect diagnosis results:**

For each completed agent:
```
✓ ink-debug-agent complete (UAT-001)
```

Extract from agent output:
- Root cause description
- Affected files list
- Suggested fix approach
- Confidence level (high/medium/low)
- Estimated effort (small/medium/large)
</step>

<step name="report">
**Write DIAGNOSIS.md:**

Create `.planning/phases/XX-name/{phase}-DIAGNOSIS.md`:

```markdown
# Diagnosis Report: Phase [X]

**Generated:** [DATE]
**Issues diagnosed:** [N]
**Source:** [ISSUES.md path(s)]

## Diagnoses

### UAT-001: [Title]

**Severity:** [P0/P1/P2]
**Root Cause:** [from debug agent]
**Affected Files:**
- [file1]
- [file2]
**Suggested Fix:** [approach description]
**Confidence:** [high/medium/low]
**Estimated Effort:** [small/medium/large]

---

## Summary

| Issue | Severity | Root Cause | Confidence | Fix Effort |
|-------|----------|------------|------------|------------|
| UAT-001 | P1 | [brief] | high | small |

## Next Steps

- `/ink:plan-fix {phase}-{plan}` — Create fix plan from these diagnoses
- `/ink:go plan gaps` — Create remediation phases for multiple issues
```
</step>

<step name="update_uat">
**Update UAT.md if exists:**

If `{phase}-UAT.md` exists, update:
- Diagnosis Lifecycle table: set status to `diagnosed`, fill root cause
- Scenario table: fill Diagnosis column with link to DIAGNOSIS.md entry
</step>

<step name="offer">
**Offer next action:**

Use AskUserQuestion:
- header: "Next"
- question: "Diagnosis complete. What would you like to do?"
- options:
  - "Plan fixes" — Create fix plans from diagnoses
  - "Review diagnoses" — Examine findings in detail
  - "Diagnose more" — Run diagnosis on remaining issues
  - "Done" — Finish diagnosis session
</step>

</process>

<success_criteria>
- [ ] ISSUES.md located and parsed
- [ ] Issues triaged and grouped
- [ ] Debug agents spawned in parallel (up to 4)
- [ ] DIAGNOSIS.md written with structured findings
- [ ] UAT.md updated if present
- [ ] User offered next steps
</success_criteria>
