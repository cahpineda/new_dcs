<purpose>
Template for VALIDATION.md - Technical decision validation report.
Used by validate-decisions workflow.
</purpose>

# Technical Decision Validation

> Generated: [DATE]
> Project: [PROJECT_NAME]

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 Critical | [N] | Must address before coding |
| 🟡 Moderate | [N] | Should address early |
| 🟢 Minor | [N] | Nice to have |
| ⚪ Info | [N] | For awareness |

**Total Warnings:** [N]

---

## Critical Warnings 🔴

[For each critical warning, use this format:]

### CRIT-001: [Warning Title]

**Decision:** [What was proposed/decided]

**Issue:** [Why this is problematic]

**Evidence:**
- [Specific data, benchmarks, research]
- [Links to documentation or standards]
- [Real-world examples]

**Impact:**
- [What could go wrong]
- [Cost of fixing later vs now]

**Recommendation:**
[Specific alternative or fix]

---

## Moderate Warnings 🟡

### MOD-001: [Warning Title]

**Decision:** [What was proposed/decided]

**Issue:** [Why this could be improved]

**Evidence:**
- [Supporting information]

**Recommendation:**
[Suggested improvement]

---

## Minor Warnings 🟢

### MIN-001: [Warning Title]

**Issue:** [Minor concern]

**Suggestion:** [Optional improvement]

---

## Informational Notes ⚪

### INFO-001: [Note Title]

[Awareness item - no action required]

---

## Validated Decisions ✅

Decisions that passed validation:

| Decision | Status | Notes |
|----------|--------|-------|
| [Tech choice 1] | ✅ Validated | [Brief note] |
| [Tech choice 2] | ✅ Validated | [Brief note] |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk 1] | High/Med/Low | High/Med/Low | [Mitigation strategy] |
| [Risk 2] | High/Med/Low | High/Med/Low | [Mitigation strategy] |

---

## Recommendations Summary

**Priority order:**

1. **[Highest priority fix]** - [Brief action]
2. **[Second priority]** - [Brief action]
3. **[Third priority]** - [Brief action]

---

## User Acknowledgment

**Required if critical warnings exist:**

- [ ] I have reviewed all critical warnings
- [ ] I understand the risks of proceeding without addressing them
- [ ] I have documented my rationale below for any ignored warnings

**Rationale for ignored warnings (if any):**

[Document why specific critical warnings are being ignored, if applicable]

---

*Validated by: ink-agent-dev-helper*
