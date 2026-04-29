# Common Examples

This file contains common examples extracted from multiple workflows to reduce duplication and enable lazy loading.

**Reference:** See individual workflows for context on when to use these examples.

---

## Table of Contents

- [Commit Message Examples](#commit-message-examples)
- [File Format Examples](#file-format-examples)
- [Bash Command Examples](#bash-command-examples)
- [Task Quality Examples](#task-quality-examples)
- [Verification Examples](#verification-examples)

---

## Commit Message Examples

### Standard Commit Format

**Used in:** execute-plan-commits.md, execute-plan-core.md, plan-phase.md, create-roadmap.md, map-codebase.md, research-phase.md, complete-milestone.md, discuss-phase.md, create-milestone.md, debug.md, execute-phase.md

**Format:** `{type}({phase}-{plan}): {task-name-or-description}`

```bash
git commit -m "{type}({phase}-{plan}): {concise task description}

- {key change 1}
- {key change 2}
- {key change 3}
"
```

### Commit Type Reference

| Type | When to Use | Example |
|------|-------------|---------|
| `feat` | New feature, endpoint, component, functionality | feat(08-02): create user registration endpoint |
| `fix` | Bug fix, error correction | fix(08-02): correct email validation regex |
| `test` | Test-only changes (TDD RED phase) | test(08-02): add failing test for password hashing |
| `refactor` | Code cleanup, no behavior change (TDD REFACTOR phase) | refactor(08-02): extract validation to helper |
| `perf` | Performance improvement | perf(08-02): add database index for user lookups |
| `docs` | Documentation changes | docs(08-02): add API endpoint documentation |
| `style` | Formatting, linting fixes | style(08-02): format auth module |
| `chore` | Config, tooling, dependencies | chore(08-02): add bcrypt dependency |

### Commit Message Examples

**Standard plan task:**
```bash
git commit -m "feat(08-02): create user registration endpoint

- POST /auth/register validates email and password
- Checks for duplicate users
- Returns JWT token on success
"
```

**Bug fix:**
```bash
git commit -m "fix(08-02): correct email validation regex

- Fixed regex to accept plus-addressing
- Added tests for edge cases
"
```

**Documentation:**
```bash
git commit -m "docs(08-02): add API endpoint documentation

- Documented request/response formats
- Added authentication examples
"
```

**Phase completion:**
```bash
git commit -m "docs(${PHASE}): create phase plan

Phase ${PHASE}: ${PHASE_NAME}
- [N] plan(s) created
- [X] total tasks defined
- Ready for execution
"
```

**Note:** TDD plans have their own commit pattern (test/feat/refactor for RED/GREEN/REFACTOR phases). See @execute-plan-tdd.md for TDD commit patterns.

---

## File Format Examples

### PLAN.md Frontmatter Example

**Used in:** plan-phase.md, execute-plan-core.md

```yaml
---
phase: XX-name
plan: NN
type: execute
depends_on: [plan IDs this plan requires, or empty array]
files_modified: [files this plan will modify]
domain: [optional]
complexity:
  level: simple|medium|complex
  score: N
  poc_required: true|false
  arch_review: true|false
  notes: "Brief justification"
---
```

### SUMMARY.md Frontmatter Example

**Used in:** execute-plan-core.md, create-milestone.md, complete-milestone.md

```yaml
---
phase: XX-name
plan: NN
status: completed
completed_date: YYYY-MM-DD
---
```

### Context Section Example

**Used in:** plan-phase.md, execute-plan-core.md

```markdown
<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

# Auto-selected based on dependency graph (from frontmatter):
@.planning/phases/XX-name/YY-ZZ-SUMMARY.md
@.planning/phases/AA-name/BB-CC-SUMMARY.md

# Key files from frontmatter (relevant to this phase):
@path/to/important/file.ts
@path/to/another/file.ts

**Tech stack available:** [extracted from frontmatter tech-stack.added]
**Established patterns:** [extracted from frontmatter patterns-established]
**Constraining decisions:**
- [Phase X]: [decision from frontmatter]
- [Phase Y]: [decision from frontmatter]

**Issues being addressed:** [If any from ISSUES.md]
</context>
```

---

## Bash Command Examples

### Check Project State

**Used in:** go-router.md, plan-phase.md, validate-decisions.md

```bash
ls .planning/PROJECT.md .planning/ROADMAP.md
cat .planning/STATE.md
```

### Check for Codebase Map

**Used in:** plan-phase.md, map-codebase.md

```bash
ls .planning/codebase/*.md 2>/dev/null
```

### Check for Research/Discovery

**Used in:** plan-phase.md, research-phase.md

```bash
# Check for ecosystem research
cat .planning/phases/XX-name/${PHASE}-RESEARCH.md 2>/dev/null

# Check for phase context
cat .planning/phases/XX-name/${PHASE}-CONTEXT.md 2>/dev/null

# Check for discovery
cat .planning/phases/XX-name/DISCOVERY.md 2>/dev/null
```

### Read Parallelization Config

**Used in:** plan-phase.md, execute-phase.md

```bash
cat .planning/config.json 2>/dev/null | jq '.parallelization'
```

### Extract Commit Hash

**Used in:** execute-plan-commits.md, execute-plan-core.md

```bash
TASK_COMMIT=$(git rev-parse --short HEAD)
echo "Task ${TASK_NUM} committed: ${TASK_COMMIT}"
TASK_COMMITS+=("Task ${TASK_NUM}: ${TASK_COMMIT}")
```

### Git Status Check

**Used in:** execute-plan-commits.md, execute-plan-core.md

```bash
git status --short
```

---

## Task Quality Examples

### Good Tasks

**Used in:** plan-phase.md, execute-plan-core.md

**Good tasks:** Specific files, actions, verification
- "Add User model to Prisma schema with email, passwordHash, createdAt"
- "Create POST /api/auth/login endpoint with bcrypt validation"
- "Add validation function to check email format before saving"

### Bad Tasks

**Used in:** plan-phase.md, execute-plan-core.md

**Bad tasks:** Vague, not actionable
- "Set up authentication" / "Make it secure" / "Handle edge cases"
- "Improve performance" / "Add tests" / "Fix bugs"

**Rule:** If you can't specify Files + Action + Verify + Done, the task is too vague.

---

## Verification Examples

### Task Verification Checklist

**Used in:** execute-plan-core.md, verify-work.md

```markdown
- [ ] Files created/modified as specified
- [ ] Action completed successfully
- [ ] Verification steps passed
- [ ] Done criteria met
- [ ] No errors or warnings
```

### Code Verification Commands

**Used in:** plan-phase.md, verify-work.md

```bash
# Check for red flags
grep -E "TODO|FIXME|HACK|XXX|BUG" path/to/file.ts | head -5

# Check last modified date
git log --oneline -1 -- path/to/file.ts

# Check for recent bug fixes
git log --oneline --grep="fix" -- path/to/file.ts | head -3

# Check test coverage exists
ls **/test*/*file*.test.* 2>/dev/null

# Check for type errors
npx tsc --noEmit 2>&1 | grep "file.ts" || true

# Check for security issues (basic)
grep -E "(eval|innerHTML|dangerouslySetInnerHTML)" path/to/file.ts
```

---

## Next Steps Format Example

**Used in:** plan-phase.md, execute-plan-core.md, create-roadmap.md

```
Phase {X} planned: {N} plan(s) created in .planning/phases/XX-name/

---

## Next Up

[If 1 plan created:]
**{phase}-01: [Plan Name]** - [objective summary]

`/ink:execute-plan .planning/phases/XX-name/{phase}-01-PLAN.md`

[If 2+ plans created:]
**Phase {X}: [Phase Name]** - {N} plans ready

`/ink:execute-phase {X}`

<sub>`/clear` first - fresh context window</sub>

---

**Also available:**
- Review/adjust tasks before executing
[If 2+ plans: - `/ink:execute-plan {phase}-01-PLAN.md` - run plans one at a time interactively]
[If 2+ plans: - View all plans: `ls .planning/phases/XX-name/*-PLAN.md`]

---
```
