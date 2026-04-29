<purpose>
Deviation handling rules for plan execution.
How to handle work discovered during execution not in original plan.

See @execute-plan-core.md for main execution flow.
</purpose>

<deviation_rules>

## Automatic Deviation Handling

**During tasks, you WILL discover work not in plan.** Apply rules automatically, track for Summary.

---

**RULE 1: Auto-fix bugs**
Trigger: Broken behavior, incorrect output, errors
Action: Fix immediately, track for Summary

Examples: Wrong query, logic errors, type errors, null exceptions, security vulnerabilities

Process: Fix inline → Add tests → Track `[Rule 1 - Bug] [description]`

---

**RULE 2: Auto-add missing critical functionality**
Trigger: Missing essential features for correctness/security/basic operation
Action: Add immediately, track for Summary

Examples: Missing error handling, no input validation, no auth on protected routes, no CSRF protection

Process: Add functionality → Add tests → Track `[Rule 2 - Missing Critical] [description]`

---

**RULE 3: Auto-fix blocking issues**
Trigger: Something prevents completing current task
Action: Fix immediately, track for Summary

Examples: Missing dependency, wrong types, broken imports, missing env vars, build config errors

Process: Fix blocker → Verify task proceeds → Track `[Rule 3 - Blocking] [description]`

---

**RULE 4: Ask about architectural changes**
Trigger: Fix requires significant structural modification
Action: STOP, present to user, wait for decision

Examples: New database table, major schema changes, new service layer, switching frameworks

Process: STOP → Present decision:
```
Architectural Decision Needed
Task: [name]
Discovery: [what prompted this]
Proposed: [modification]
Impact: [what this affects]
Proceed? (yes / different / defer)
```
Wait → If approved, track `[Rule 4 - Architectural] [description]`

---

**RULE 5: Log non-critical enhancements**
Trigger: Improvement that isn't essential now
Action: Add to .planning/ISSUES.md, continue task

Examples: Performance optimization, code refactoring, better naming, nice-to-have UX

Process: Add to ISSUES.md → Notify `Logged: [brief] (ISS-XXX)` → Continue

---

**RULE 6: Log unwired code**
Trigger: Task creates a new file OR exports a new function/class/component
Action: Grep for imports/references to the new file/export. If 0 found, log warning.

Examples: New service file not imported anywhere, exported helper never referenced, new component not added to routes

Exceptions (skip check):
- Test files (`*.test.*`, `*.spec.*`, `__tests__/`)
- Config files (`*.config.*`, `.env*`, `tsconfig*`, `*.json`)
- Entry points (`index.*`, `main.*`, `app.*`, `server.*`)
- Migrations (`migrations/`, `*.migration.*`)
- Type declarations (`*.d.ts`, `types.*`)
- Files explicitly noted as "wired in later task" in the plan

Process: After task commit → Check new files/exports → If unwired, add to ISSUES.md with `[Rule 6 - Unwired] {file}: no imports found` → Continue (non-blocking)

---

**RULE PRIORITY:**
1. Rule 4 applies → STOP and ask
2. Rules 1-3 apply → Fix automatically
3. Rule 5 applies → Log to ISSUES.md
4. Rule 6 applies → Log wiring warning to ISSUES.md
5. Unsure → Apply Rule 4

**Decision guide:** "Does this affect correctness, security, or task completion?"
- YES → Rules 1-3
- NO → Rule 5
- MAYBE → Rule 4
- NEW FILE/EXPORT → Rule 6 (check wiring)

</deviation_rules>

<deviation_documentation>

## Documenting in Summary

**No deviations:**
```markdown
## Deviations from Plan
None - plan executed exactly as written.
```

**With deviations:**
```markdown
## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed case-sensitive email uniqueness**
- Found during: Task 4
- Issue: [description]
- Fix: [what was done]
- Files: [modified files]
- Commit: [hash]

### Deferred Enhancements
Logged to .planning/ISSUES.md:
- ISS-001: [description]

### Wiring Warnings
- [Rule 6 - Unwired] src/services/analytics.ts: no imports found
- [Rule 6 - Unwired] src/utils/format-date.ts: no imports found

Total: [N] auto-fixed, [N] deferred, [N] unwired
Impact: [assessment]
```

</deviation_documentation>
