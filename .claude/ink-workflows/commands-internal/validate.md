---
name: ink:validate
description: Validate plans, contracts, or memory consistency
argument-hint: "[plan|contracts|memory] [options]"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Unified validation command for pre-flight checks on plans, API/DB contracts, and memory consistency.
</objective>

<instructions>

## Route by Subcommand

```
/ink:validate              → Auto-detect what to validate
/ink:validate plan [path]  → Validate plan references and anti-patterns
/ink:validate contracts    → Validate API specs and DB schemas
/ink:validate memory       → Verify memory-code consistency
```

---

## Mode: plan

**Validates that a PLAN.md references real files, functions, and dependencies.**

### 1. Find Plan

```bash
# If path provided, use it
# Otherwise find most recent unexecuted plan
PLAN=$(ls .planning/phases/*/*-PLAN.md 2>/dev/null | while read p; do
  SUMMARY="${p/-PLAN.md/-SUMMARY.md}"
  [ ! -f "$SUMMARY" ] && echo "$p" && break
done)
```

### 2. Extract & Validate References

**Files:**
```bash
FILES=$(grep -oE "src/[a-zA-Z0-9/_.-]+\.(ts|js|py|go|php)" "$PLAN" | sort -u)
for f in $FILES; do [ ! -f "$f" ] && echo "MISSING: $f"; done
```

**Dependencies:**
```bash
DEPS=$(grep -oE "(import|from|require).*['\"]([^'\"]+)['\"]" "$PLAN" | grep -v "^\." | sort -u)
# Check against package.json / requirements.txt
```

**Functions:**
```bash
FUNCS=$(grep -oE "(function|def|class|const)\s+\w+" "$PLAN" | awk '{print $2}' | sort -u)
# Search codebase for definitions
```

### 3. Detect Anti-Patterns

Reference: `.claude/ink-workflows/references/anti-patterns.md`

**Critical (Block):**
- Hardcoded secrets: `api_key = "sk_live_..."`
- SQL injection: string interpolation in queries

**Warning (Confirm):**
- N+1 queries
- Missing pagination
- Missing timeouts

**Note (Inform):**
- TODOs/FIXMEs in plan and referenced files
- Stale files (>30 days unchanged)

### 4. Report

```markdown
# Pre-Flight Check: [Plan Name]

| Category | Found | Issues | Status |
|----------|-------|--------|--------|
| Files | X | Y missing | PASS/FAIL |
| Dependencies | X | Y missing | PASS/FAIL |
| Anti-Patterns | - | Z detected | PASS/WARN |

**Overall:** READY / WARNING / BLOCKED
```

---

## Mode: contracts

**Validates API specs and database schemas.**

### 1. Detect Contracts

```bash
# API
HAS_OPENAPI=$(find . -name "openapi.yaml" -o -name "swagger.json" 2>/dev/null | head -1)
HAS_GRAPHQL=$(find . -name "*.graphql" 2>/dev/null | head -1)

# Database
HAS_PRISMA=$(test -f prisma/schema.prisma && echo "yes")
HAS_TYPEORM=$(grep -rq "@Entity" --include="*.ts" 2>/dev/null && echo "yes")
```

### 2. Validate API

```bash
# OpenAPI
npx @stoplight/spectral-cli lint openapi.yaml 2>/dev/null

# GraphQL
npx graphql-inspector validate schema.graphql 2>/dev/null
```

### 3. Validate Database

```bash
# Prisma
npx prisma validate 2>/dev/null
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma 2>/dev/null
```

### 4. Check Breaking Changes

```bash
# Compare vs previous commit
npx @openapitools/openapi-diff openapi.yaml HEAD~1:openapi.yaml 2>/dev/null
```

### 5. Report

```markdown
# Contract Validation

| Contract | Type | Status | Issues |
|----------|------|--------|--------|
| openapi.yaml | API | PASS/FAIL | X |
| schema.prisma | DB | PASS/FAIL | X |

**Breaking Changes:** Y detected
```

---

## Mode: memory

**Verifies project memory is consistent with codebase.**

### 1. Check Memory Exists

```bash
if [ ! -d ".planning/memory" ]; then
  echo "No memory found. Initialize with /ink:memory"
  exit 0
fi
```

### 2. For Each Chapter

```bash
for chapter in .planning/memory/chapters/CAP-*.md; do
  # Extract key_files
  KEY_FILES=$(grep -A20 "key_files:" "$chapter" | grep "path:" | sed 's/.*path: //')

  # Check files exist
  for f in $KEY_FILES; do
    [ ! -f "$f" ] && echo "MISSING: $f in $chapter"
  done

  # Check for changes since update
  UPDATED=$(grep "updated:" "$chapter" | sed 's/updated: //')
  COMMITS=$(git log --oneline --since="$UPDATED" -- $KEY_FILES 2>/dev/null | wc -l)
  [ "$COMMITS" -gt 0 ] && echo "STALE: $chapter ($COMMITS commits behind)"
done
```

### 3. Report

```markdown
# Memory Verification

| Chapter | Status | Issues |
|---------|--------|--------|
| CAP-AUTH | OK | - |
| CAP-API | STALE | 5 commits behind |
| CAP-DB | ERROR | 2 files missing |

**Action:** Run `/ink:memory update [chapter]` to fix
```

---

## Auto-Detect Mode

When no subcommand given:

```bash
# Priority order
if [ -f ".planning/phases/*/*-PLAN.md" ]; then
  # Find unexecuted plan
  run_validate_plan
elif [ -f "openapi.yaml" ] || [ -f "prisma/schema.prisma" ]; then
  run_validate_contracts
elif [ -d ".planning/memory" ]; then
  run_validate_memory
else
  echo "Nothing to validate. Specify: plan, contracts, or memory"
fi
```

</instructions>

<examples>

**Example 1: Validate plan (default)**
```
User: /ink:validate

Claude: Found unexecuted plan: 02-01-PLAN.md

# Pre-Flight Check: User Authentication

| Category | Found | Missing | Status |
|----------|-------|---------|--------|
| Files | 4 | 0 | PASS |
| Dependencies | 3 | 0 | PASS |
| Anti-Patterns | - | 1 warning | WARN |

**Warning:** N+1 query pattern detected in Task 2

Overall: READY (with warnings)
```

**Example 2: Validate contracts**
```
User: /ink:validate contracts

Claude: Validating API and database contracts...

# Contract Validation

| Contract | Type | Status |
|----------|------|--------|
| openapi.yaml | API | PASS |
| schema.prisma | DB | WARN |

**DB Warning:** Missing index on User.email

No breaking changes detected.
```

**Example 3: Validate memory**
```
User: /ink:validate memory

Claude: Verifying memory consistency...

# Memory Verification

| Chapter | Status | Issue |
|---------|--------|-------|
| CAP-AUTH | STALE | 3 commits behind |
| CAP-API | OK | - |
| CAP-DB | OK | - |

Run `/ink:memory update auth` to sync CAP-AUTH.
```

</examples>
