# Plan Phase Examples

This file contains extensive examples extracted from `plan-phase.md` for lazy loading. These examples illustrate various aspects of the phase planning workflow.

**Reference:** See `@ink-workflows/workflows/plan-phase.md` for the main workflow.

---

## Table of Contents

- [Complexity Evaluation Examples](#complexity-evaluation-examples)
- [Pattern Search Examples](#pattern-search-examples)
- [Code Verification Examples](#code-verification-examples)
- [Architecture Review Examples](#architecture-review-examples)
- [Plan Format Examples](#plan-format-examples)
- [Task Quality Examples](#task-quality-examples)
- [Git Commit Examples](#git-commit-examples)

---

## Complexity Evaluation Examples

### Complexity Frontmatter Example

**Location:** Used in `evaluate_complexity` step

```yaml
complexity:
  level: simple|medium|complex
  score: N
  poc_required: true|false
  arch_review: true|false
  notes: "Brief justification"
```

### Complexity Actions Table

**Location:** Used in `evaluate_complexity` step

| Level | POC | Pattern Search | Arch Review |
|-------|-----|----------------|-------------|
| Simple | No | Optional | No |
| Medium | Recommended | Yes | No |
| Complex | Required | Required | Required |

---

## Pattern Search Examples

### Pattern Catalog Check Commands

**Location:** Used in `search_patterns` step

```bash
# Check if patterns exist
ls .planning/patterns/INDEX.md 2>/dev/null
```

```bash
# Read pattern index
cat .planning/patterns/INDEX.md

# Search by domain keywords from phase goal
# AUTH: login, auth, jwt, oauth, session, permission
# API: endpoint, route, controller, middleware
# DB: query, model, migration, schema
# CACHE: cache, redis, rate limit
# STORAGE: upload, file, s3, storage
# ASYNC: queue, job, worker, event
```

### Available Patterns Example

**Location:** Used in `search_patterns` step

```markdown
## Available Patterns

Found {N} patterns that may help with this phase:

### PATTERN-AUTH-001: JWT Authentication
**Match:** High - Phase mentions "user authentication"
**Complexity:** medium (matches phase complexity)
**Last used:** 5 days ago
**Action:** Consider using with modifications for [specific need]

### PATTERN-API-001: CRUD Endpoint
**Match:** Medium - Phase involves "user management API"
**Complexity:** simple
**Action:** Can be adapted for user endpoints
```

---

## Code Verification Examples

### Verification Scan Commands

**Location:** Used in `verify_existing_code` step

```bash
# Check for red flags
grep -E "TODO|FIXME|HACK|XXX|BUG" path/to/file.ts | head -5

# Check last modified date
git log --oneline -1 -- path/to/file.ts

# Check for recent bug fixes
git log --oneline --grep="fix" -- path/to/file.ts | head -3
```

### Trust Level Classification Table

**Location:** Used in `verify_existing_code` step

| Code Source | Trust Level | Verification |
|-------------|-------------|--------------|
| Recently written (this week) | High | Minimal - check exists |
| Same project, other phase | Medium | Scan for TODOs, check tests exist |
| From pattern catalog | Medium | Verify pattern still matches codebase |
| Legacy (>30 days no changes) | Low | Full scan, check for issues history |
| External/copied code | Zero | Full verification, security check |

### Code Verification Results Example

**Location:** Used in `verify_existing_code` step

```markdown
<code_verification>
  <file path="src/auth/jwt.ts">
    <trust_level>low</trust_level>
    <issues>
      - TODO: "add refresh token rotation" (line 45)
      - 3 bug fix commits in last month
    </issues>
    <recommendation>Review before reusing, may need updates</recommendation>
  </file>
</code_verification>
```

### Additional Verification Commands

**Location:** Used in `verify_existing_code` step

```bash
# Check test coverage exists
ls **/test*/*file*.test.* 2>/dev/null

# Check for type errors
npx tsc --noEmit 2>&1 | grep "file.ts" || true

# Check for security issues (basic)
grep -E "(eval|innerHTML|dangerouslySetInnerHTML)" path/to/file.ts
```

---

## Architecture Review Examples

### Architectural Domains Table

**Location:** Used in `architecture_review` step

| Domain | Keywords |
|--------|----------|
| Storage | storage, file, upload, save, image, s3, blob |
| Cache | cache, redis, rate limit, session, performance |
| Async | async, queue, job, worker, background, event |
| Auth | auth, login, jwt, oauth, token, permission |
| Database | database, db, query, model, schema, index |
| API | api, endpoint, rest, graphql, versioning |
| Scale | scale, horizontal, instances, distributed |

### Architecture Question Example

**Location:** Used in `architecture_review` step

Example for Storage:
```
header: "Storage Architecture"
question: "Will this application run on multiple server instances?"
options:
  - label: "Single instance"
    description: "Local filesystem acceptable"
  - label: "Multiple instances (Recommended)"
    description: "Need shared storage (S3, cloud storage)"
  - label: "Not decided yet"
    description: "Assume multiple for scalability"
```

### Architecture Context Example

**Location:** Used in `architecture_review` step

```xml
<architecture_context>
  <domain name="storage">
    <decision>S3 with signed URLs</decision>
    <rationale>Multi-instance deployment requires shared storage</rationale>
    <pattern>PATTERN-STORAGE-001</pattern>
  </domain>
  <checklist>
    - File type validation
    - Size limits enforced
    - Signed URLs for private content
  </checklist>
</architecture_context>
```

### Architecture Conflict Check Command

**Location:** Used in `architecture_review` step

```bash
# Check existing decisions in memory
grep -r "storage\|cache\|auth" .planning/memory/chapters/*.md 2>/dev/null
```

---

## Plan Format Examples

### Plan Frontmatter Example

**Location:** Used in `write_phase_prompt` step

```yaml
---
phase: XX-name
plan: NN
type: execute
depends_on: [plan IDs this plan requires, or empty array]
files_modified: [files this plan will modify]
domain: [optional]
---
```

### Context Section Example

**Location:** Used in `write_phase_prompt` step

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

## Task Quality Examples

### Good Tasks Examples

**Location:** Used in `<task_quality>` section

- "Add User model to Prisma schema with email, passwordHash, createdAt"
- "Create POST /api/auth/login endpoint with bcrypt validation"

### Bad Tasks Examples

**Location:** Used in `<task_quality>` section

- "Set up authentication" / "Make it secure" / "Handle edge cases"

---

## Git Commit Examples

### Git Commit Command Example

**Location:** Used in `git_commit` step

```bash
# Stage all PLAN.md files for this phase
git add .planning/phases/${PHASE}-*/${PHASE}-*-PLAN.md

# Also stage DISCOVERY.md if it was created during mandatory_discovery
git add .planning/phases/${PHASE}-*/DISCOVERY.md 2>/dev/null

git commit -m "$(cat <<'EOF'
docs(${PHASE}): create phase plan

Phase ${PHASE}: ${PHASE_NAME}
- [N] plan(s) created
- [X] total tasks defined
- Ready for execution
EOF
)"
```

---

## Additional Workflow Commands

### Load Project State Commands

**Location:** Used in `load_project_state` step

```bash
cat .planning/STATE.md
```

### Read Parallelization Config Command

**Location:** Used in `read_parallelization_config` step

```bash
cat .planning/config.json 2>/dev/null | jq '.parallelization'
```

### Load Codebase Context Commands

**Location:** Used in `load_codebase_context` step

```bash
ls .planning/codebase/*.md 2>/dev/null
```

### Identify Phase Commands

**Location:** Used in `identify_phase` step

```bash
cat .planning/ROADMAP.md
ls .planning/phases/
```

### Read Project History Commands

**Location:** Used in `read_project_history` step

```bash
for f in .planning/phases/*/*-SUMMARY.md; do
  # Extract frontmatter only (between first two --- markers)
  sed -n '1,/^---$/p; /^---$/q' "$f" | head -30
done
```

### Gather Phase Context Commands

**Location:** Used in `gather_phase_context` step

```bash
# If mid-project, understand current state
ls -la src/ 2>/dev/null
cat package.json 2>/dev/null | head -20

# Check for ecosystem research (from /ink:research-phase)
cat .planning/phases/XX-name/${PHASE}-RESEARCH.md 2>/dev/null

# Check for phase context (from /ink:discuss-phase)
cat .planning/phases/XX-name/${PHASE}-CONTEXT.md 2>/dev/null
```

### Estimate Scope Command

**Location:** Used in `estimate_scope` step

```bash
cat .planning/config.json 2>/dev/null | grep depth
```

---

## Parallelization Examples

### Sequential vs Parallel-Aware Restructuring

**Location:** Used in `parallelization_aware` step

| Sequential (current) | Parallel-aware |
|---------------------|----------------|
| Plan 01: All models | Plan 01: Feature A (model + API + UI) |
| Plan 02: All APIs | Plan 02: Feature B (model + API + UI) |
| Plan 03: All UIs | Plan 03: Feature C (model + API + UI) |

---

## Next Steps Example

**Location:** Used in `offer_next` step

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
