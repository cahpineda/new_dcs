<purpose>
Validate technical decisions against research and best practices.
Generate severity-based warnings to catch mistakes before coding.
Prevention over cure - critical mistakes cost 10-100x more to fix after coding.
</purpose>

<execution_order>
1. check_project - Verify PROJECT.md and ROADMAP.md exist
2. extract_decisions - Gather all technical decisions
3. research_best_practices - WebSearch for evidence
4. generate_warnings - Compare decisions vs research
5. assess_risk - Categorize by severity
6. create_recommendations - Prioritized action items
7. write_validation - Create VALIDATION.md
8. present_summary - Show results with next steps
</execution_order>

<step name="check_project">
**Primary:** `node bin/ink-tools.js state snapshot` — verifies .planning/ exists with PROJECT.md and ROADMAP.md

Missing → Error: "Run /ink:go to set up the project first"
Exists → Continue
</step>

<step name="extract_decisions">
Read PROJECT.md, ROADMAP.md, and .planning/research/* if exists.

**Categories to extract:**
- Database (type, product)
- Backend (language, framework, architecture)
- Frontend (framework, state, rendering)
- Authentication (JWT, sessions, OAuth)
- Hosting (platform, scaling)
- API Design (REST, GraphQL, gRPC)
- Testing (frameworks, coverage)
- Build/Deploy (CI/CD, containers)

Create decision inventory for validation.
</step>

<step name="research_best_practices">
WebSearch for each decision:
- "[X] vs [Y] for [use case] {year}"
- "[X] performance [workload]"
- "[X] common mistakes"
- "[Framework] production issues"

Collect: Performance numbers, industry usage, known issues, best practices.
</step>

<step name="generate_warnings">
**For each decision, ask:**
1. Right tool for the job?
2. Known compatibility issues?
3. Following best practices?
4. Better alternatives?

**Severity levels:**

| Severity | When | Cost |
|----------|------|------|
| Critical | Wrong DB type, incompatible tech, security holes | 10-100x later |
| Moderate | Suboptimal, missing features, harder to scale | 2-10x later |
| Minor | Nice-to-have, best practice suggestions | Easy to add |
| Info | Just noting alternatives | None |

**Warning format:**
```markdown
### WARNING-[NNN]: [Category]
**Severity:** [level]
**Your Proposal:** [choice]
**Research Recommends:** [alternative]
**Reason:** [specific reason]
**Impact if Ignored:** [consequences]
**Evidence:** [links, numbers]
```

**Also note GOOD decisions** with why they align with best practices.
</step>

<step name="assess_risk">
Categorize:

**High Risk:** Critical warnings, multiple moderate in same area
**Moderate Risk:** Single moderate warnings
**Low Risk:** No warnings, good decisions
</step>

<step name="create_recommendations">
```markdown
## Recommendations

### Must Address (Before Starting)
[All Critical - must fix before coding]
1. **[Issue]** - [Recommendation] - Effort: [hours/days]

### Should Address (Early in Project)
[All Moderate - fix in Phase 1]

### Nice to Have
[All Minor suggestions]
```
</step>

<step name="write_validation">
Write `.planning/VALIDATION.md` using templates/validation.md:
- Date and project info
- Validation summary (warning counts)
- All warnings formatted
- Validated (good) decisions
- Risk assessment
- Recommendations
- User acknowledgment section
</step>

<step name="present_summary">
```
Technical Decision Validation Complete
Created .planning/VALIDATION.md

Summary:
- Critical: [N] - MUST address before coding
- Moderate: [N] - Should address early
- Minor: [N] - Nice to have

[List critical warnings if any]

Next Steps:
[If critical:] Address critical warnings, update PROJECT.md, re-run validation
[If none:] Review VALIDATION.md, then /ink:plan-phase 1
```

If critical warnings exist, require acknowledgment before proceeding.
</step>

<success_criteria>
- [ ] All technical decisions extracted
- [ ] Warnings generated with evidence
- [ ] Severity indicators used consistently
- [ ] Risk assessment created
- [ ] VALIDATION.md created
- [ ] Clear summary presented
- [ ] Critical warnings require acknowledgment
</success_criteria>
