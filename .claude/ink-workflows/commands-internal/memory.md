---
name: ink:memory
description: Query, update, or verify project memory
argument-hint: "[concept] or [update|verify|sync] [concept]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Access and maintain the hierarchical project memory system.
- Query: Find information about a concept
- Update: Modify a chapter with new information
- Verify: Check memory-code consistency
- Sync: Synchronize all chapters with codebase
</objective>

<instructions>

## 1. Parse Command

```
/ink:memory                    → Show INDEX and recent updates
/ink:memory auth               → Load CAP-AUTH chapter
/ink:memory update auth        → Update CAP-AUTH with recent changes
/ink:memory verify             → Verify all chapters against codebase
/ink:memory verify auth        → Verify specific chapter
/ink:memory sync               → Sync all chapters with codebase
/ink:memory add [concept]      → Add new concept to INDEX
/ink:memory health             → Show health metrics for all chapters
/ink:memory import             → Import learnings from recent sessions
/ink:memory consolidation      → Check all chapters for size issues
```

## 2. Initialize Memory (if needed)

```bash
# Check if memory exists
if [ ! -d ".planning/memory" ]; then
  echo "Memory not initialized. Creating structure..."
  mkdir -p .planning/memory/chapters
  # Create INDEX.md from template
fi
```

## 3. Query Mode (default)

### Show Index
```bash
cat .planning/memory/INDEX.md
```

Present summary:
```markdown
# Project Memory

**Concepts:** 12 across 6 domains
**Last updated:** 2 hours ago

## Quick Access

| Domain | Concepts | Recent |
|--------|----------|--------|
| AUTH | 3 | Token refresh added |
| API | 4 | Rate limiting added |
| DB | 2 | New user fields |

Type concept name for details (e.g., "auth", "caching")
```

### Load Chapter

When user specifies concept:

```bash
# Find matching chapter
CHAPTER=$(grep -l "{concept}" .planning/memory/chapters/*.md | head -1)
cat "$CHAPTER"
```

Present with context:
```markdown
# CAP-AUTH: Authentication

**Updated:** 2 hours ago
**Key Files:** src/auth/*.ts

## Summary
JWT-based authentication with refresh tokens...

## Key Decisions
1. Stateless tokens (no session storage)
2. 15min access / 7d refresh TTL

## Quick Reference
- Generate token: `generateToken(user)`
- Validate: `validateToken(token)`
- Middleware: `authMiddleware`

[Show full chapter? y/n]
```

## 4. Update Mode

```
/ink:memory update {concept}
```

### Analyze Recent Changes

```bash
# Find recent changes to key files
git log --oneline -5 --name-only -- src/auth/

# Read current chapter
cat .planning/memory/chapters/CAP-AUTH.md

# Find what's new
git diff HEAD~5 -- src/auth/
```

### Update Chapter

```markdown
## Updates to Apply

Based on recent commits:

1. **New function:** `rotateRefreshToken()` in refresh.ts
2. **Config change:** Token TTL increased to 30min
3. **New dependency:** Added `redis` for token storage

Apply these updates to CAP-AUTH? [y/n]
```

If confirmed, update chapter:
- Add new functions to "Key Functions"
- Update configuration table
- Add to History section
- Update `updated` timestamp

## 5. Verify Mode

```
/ink:memory verify [concept]
```

### Verify Consistency

Check that memory chapters match actual codebase state.

```bash
# If concept specified, verify only that chapter
# Otherwise verify all chapters

for chapter in .planning/memory/chapters/CAP-*.md; do
  # Extract key_files from frontmatter
  KEY_FILES=$(grep -A20 "key_files:" "$chapter" | grep "path:" | sed 's/.*path: //')
  UPDATED=$(grep "updated:" "$chapter" | sed 's/updated: //')

  # Check files exist
  for file in $KEY_FILES; do
    [ ! -f "$file" ] && echo "MISSING: $file"
  done

  # Check for changes since update
  COMMITS=$(git log --oneline --since="$UPDATED" -- $KEY_FILES 2>/dev/null | wc -l)
  [ "$COMMITS" -gt 0 ] && echo "STALE: $COMMITS commits since update"

  # Check functions still exist
  FUNCS=$(grep -E "^- \`\w+\(" "$chapter" | sed 's/.*`\(\w*\)(.*/\1/')
  for func in $FUNCS; do
    grep -rq "function $func\|def $func\|$func\s*=" $KEY_FILES 2>/dev/null || echo "MISSING FUNC: $func"
  done
done
```

### Verification Report

```markdown
# Memory Verification Report

| Chapter | Status | Issues |
|---------|--------|--------|
| CAP-AUTH | STALE | 5 commits behind |
| CAP-API | OK | - |
| CAP-DB | ERROR | 2 files missing |

## Details

### CAP-AUTH - STALE

**Last Updated:** 2024-01-15
**Commits Since:** 5

Recent changes:
- abc123 feat: add refresh token rotation
- def456 fix: token expiry calculation

**Recommendation:** Run `/ink:memory update auth`

### CAP-DB - ERROR

**Missing Files:**
- src/models/user.ts (renamed?)
- src/db/migrations/001.ts (moved?)

**Recommendation:** Update key_files list
```

---

## 6. Sync Mode

```
/ink:memory sync
```

### Full Synchronization

```bash
# Get all chapters
for chapter in .planning/memory/chapters/*.md; do
  # Extract key_files from frontmatter
  KEY_FILES=$(grep -A20 "key_files:" "$chapter" | grep "path:" | sed 's/.*path: //')

  # Check if files still exist
  for file in $KEY_FILES; do
    [ ! -f "$file" ] && echo "Missing: $file in $chapter"
  done

  # Check for major changes
  git diff --stat HEAD~10 -- $KEY_FILES
done
```

### Report

```markdown
# Memory Sync Report

## Chapters Checked: 6

### Up to Date (4)
- CAP-AUTH ✓
- CAP-API ✓
- CAP-DB ✓
- CAP-CONFIG ✓

### Need Updates (2)
- CAP-CACHE: 3 commits since last update
- CAP-STORAGE: New file `uploads.ts` not documented

### Issues (0)
- No missing files
- No orphaned chapters

## Actions

1. Update CAP-CACHE with recent changes
2. Add uploads.ts to CAP-STORAGE

Run `/ink:memory update cache` to update?
```

## 7. Add Concept

```
/ink:memory add payments
```

### Create New Chapter

```markdown
Creating new chapter: CAP-PAYMENTS

What files are related to this concept?
> src/payments/*.ts, src/services/stripe.ts

What key decisions have been made?
> Using Stripe, webhook-based confirmation

Creating .planning/memory/chapters/CAP-PAYMENTS.md...
Updating INDEX.md...

✓ Chapter created. Update with details using:
  /ink:memory update payments
```

## 8. Update INDEX

After any chapter change:

```bash
# Count concepts per domain
AUTH_COUNT=$(grep -c "CAP-AUTH" .planning/memory/chapters/*.md)

# Update counts in INDEX.md
sed -i '' "s/AUTH | [0-9]*/AUTH | $AUTH_COUNT/" .planning/memory/INDEX.md

# Update last modified
sed -i '' "s/Last updated:.*/Last updated: $(date +%Y-%m-%d)/" .planning/memory/INDEX.md
```

## 9. Health Check

```
/ink:memory health
```

### Calculate Health Metrics

```bash
for chapter in .planning/memory/chapters/CAP-*.md; do
  [ ! -f "$chapter" ] && continue
  NAME=$(basename "$chapter" .md)

  # Extract frontmatter fields
  STATUS=$(grep "^status:" "$chapter" | sed 's/status: //')
  CONFIDENCE=$(grep "^confidence:" "$chapter" | sed 's/confidence: //')
  CREATED=$(grep "^created:" "$chapter" | sed 's/created: //')
  LAST_ACCESSED=$(grep "^last_accessed:" "$chapter" | sed 's/last_accessed: //')
  ACCESS_COUNT=$(grep "^access_count:" "$chapter" | sed 's/access_count: //')

  # Calculate age and freshness in days
  AGE_DAYS=$(( ($(date +%s) - $(date -j -f "%Y-%m-%d" "$CREATED" +%s 2>/dev/null || echo 0)) / 86400 ))
  FRESH_DAYS=$(( ($(date +%s) - $(date -j -f "%Y-%m-%d" "$LAST_ACCESSED" +%s 2>/dev/null || echo 0)) / 86400 ))

  # Count stale citations (files modified since verified date)
  TOTAL_CITATIONS=0
  STALE_CITATIONS=0
  # For each key_files entry, check git log since verified date
  # STALE = commits exist on that file after verified date

  # Score formula: freshness 40% + staleness 30% + frequency 20% + confidence 10%
  # Higher score = healthier chapter
done
```

### Health Report

```markdown
# Memory Health Report

| Chapter | Status | Score | Age | Last Access | Accesses | Stale Files | Action |
|---------|--------|-------|-----|-------------|----------|-------------|--------|
| CAP-AUTH | active | 85 | 5d | 1d ago | 12 | 0/3 | OK |
| CAP-DB | active | 32 | 45d | 38d ago | 2 | 2/4 | ARCHIVE? |

## Scoring

- **Freshness (40%):** 100 if accessed today, decays linearly. 0 if >60 days stale.
- **Staleness (30%):** 100 if 0 stale citations, 0 if >50% stale.
- **Frequency (20%):** Based on access_count relative to chapter age.
- **Confidence (10%):** Direct from frontmatter (0.0-1.0 scaled to 0-100).

## Thresholds

| Score | Action |
|-------|--------|
| >70 | OK — healthy chapter |
| 40-70 | UPDATE — consider refreshing |
| <40 | ARCHIVE? — may be outdated |

## Recommendations

For chapters scoring <40:
- Run `/ink:memory verify {chapter}` to check citations
- Run `/ink:memory update {chapter}` to refresh content
- Or archive if no longer relevant
```

---

## 10. Session Memory Import

```
/ink:memory import
```

### Scan Recent Sessions

```bash
# Find project-specific session summaries from last 7 days
PROJECT_DIR=$(basename "$(pwd)")
SESSION_PATH="$HOME/.claude/projects/"

# Search for summary files modified in last 7 days
find "$SESSION_PATH" -name "summary.md" -path "*/session-memory/*" -mtime -7 2>/dev/null | while read summary; do
  echo "=== $summary ==="
  # Extract key decisions and learnings
  grep -A5 -i "decision\|learning\|chose\|resolved\|root cause\|the issue was" "$summary" 2>/dev/null
done
```

### Present Findings

```markdown
# Session Memory Import

**Scanned:** 5 recent sessions (last 7 days)

## Candidate Learnings

| # | Source Session | Finding | Maps To |
|---|---------------|---------|---------|
| 1 | "Fix auth flow" (2d ago) | Decided: use httpOnly cookies over localStorage | CAP-AUTH (existing) |
| 2 | "DB migration" (3d ago) | Root cause: index missing on user_email | CAP-DB (new) |
| 3 | "Refactor API" (5d ago) | Chose: middleware validation over inline | CAP-API (new) |

## Actions

Select findings to import (comma-separated, or "all"):
> 1, 2

Importing...
- Finding 1 → Appended to CAP-AUTH Key Decisions
- Finding 2 → Created new CAP-DB chapter

✓ Imported 2 learnings into memory
```

### Import Rules

- User ALWAYS approves before writing to chapters
- New chapters created with `confidence: 0.7` (lower than manually curated)
- Existing chapters: append to Key Decisions section only
- Never overwrite existing content — append only
- Skip findings that duplicate existing key_decisions

---

## 11. Consolidation Check

```
/ink:memory consolidation
```

### Check Chapter Sizes

```bash
# Read thresholds from config (or use defaults)
SPLIT_THRESHOLD=$(cat .planning/config.json 2>/dev/null | grep -o '"splitThreshold"[[:space:]]*:[[:space:]]*[0-9]*' | grep -o '[0-9]*' || echo 300)
MERGE_THRESHOLD=$(cat .planning/config.json 2>/dev/null | grep -o '"mergeThreshold"[[:space:]]*:[[:space:]]*[0-9]*' | grep -o '[0-9]*' || echo 50)

echo "Checking chapter sizes (split: $SPLIT_THRESHOLD, merge: $MERGE_THRESHOLD)..."

for chapter in .planning/memory/chapters/CAP-*.md; do
  [ ! -f "$chapter" ] && continue
  LINES=$(wc -l < "$chapter" | tr -d ' ')
  NAME=$(basename "$chapter" .md)

  if [ "$LINES" -gt "$SPLIT_THRESHOLD" ]; then
    echo "OVERSIZED: $NAME ($LINES lines > $SPLIT_THRESHOLD)"
  elif [ "$LINES" -lt "$MERGE_THRESHOLD" ]; then
    echo "UNDERSIZED: $NAME ($LINES lines < $MERGE_THRESHOLD)"
  else
    echo "OK: $NAME ($LINES lines)"
  fi
done
```

### Consolidation Report

Present a report summarizing chapter sizes:

```markdown
# Chapter Consolidation Report

## Oversized (Need Split)

| Chapter | Lines | Recommendation |
|---------|-------|----------------|
| CAP-AUTH | 412 | Split into CAP-AUTH-CORE + CAP-AUTH-OAUTH |

**Action:** Review and manually split oversized chapters.
Splitting strategy: By section headers or by file paths.

## Undersized (Consider Merge)

| Chapter | Lines | Merge Candidate |
|---------|-------|-----------------|
| CAP-CACHE | 23 | Merge into CAP-DB |

**Action:** Consider merging with related chapters.

## OK

| Chapter | Lines |
|---------|-------|
| CAP-API | 187 |
| CAP-DB | 245 |
```

**Note:** Auto-splitting is not implemented. This detects issues for manual resolution.

</instructions>

<examples>

**Example 1: Quick lookup**
```
User: /ink:memory auth

Claude:
# CAP-AUTH: Authentication

**Status:** Current (updated 2 hours ago)

## Summary
JWT-based stateless authentication with refresh token rotation.

## Key Decisions
- Access token: 15 min TTL
- Refresh token: 7 days, stored in Redis
- Stateless: No server-side sessions

## Key Files
- `src/auth/jwt.ts` - Token operations
- `src/auth/middleware.ts` - Route protection
- `src/auth/refresh.ts` - Token rotation

## Quick Reference
```typescript
// Generate tokens
const { access, refresh } = generateToken(user)

// Protect route
app.get('/api/me', authMiddleware, handler)

// Refresh
const newTokens = await refreshTokens(refreshToken)
```

Need more details? [Full chapter / Related: API, DB]
```

**Example 2: Update after work**
```
User: /ink:memory update api

Claude:
Analyzing recent changes to API layer...

## Changes Detected

Since last update (3 days ago):

1. **New endpoint:** POST /api/uploads (uploads.ts)
2. **Modified:** Rate limiting increased to 100/min
3. **New middleware:** `validateBody` for request validation

## Proposed Updates

```diff
+ ### Upload Endpoint
+ - `POST /api/uploads` - File upload with validation
+ - Max size: 10MB
+ - Allowed types: image/*, application/pdf

  ### Configuration
- | Rate limit | 60/min |
+ | Rate limit | 100/min |

+ ### Middleware
+ - `validateBody(schema)` - Zod schema validation
```

Apply these updates to CAP-API? [y/n]

User: y

Claude:
✓ CAP-API updated
✓ INDEX.md updated (last modified: today)
```

</examples>

<edge_cases>

**No memory directory:**
```
Memory not initialized.

Initialize now? This will create:
- .planning/memory/INDEX.md
- .planning/memory/chapters/

[y/n]
```

**Concept not found:**
```
Concept "payments" not found in memory.

Similar concepts:
- billing (CAP-API)
- subscriptions (CAP-DB)

Create new chapter for "payments"? [y/n]
```

**Chapter out of sync:**
```
⚠️ CAP-AUTH may be outdated

Key file `src/auth/jwt.ts` modified 5 times since last chapter update.

Options:
1. View diff and update
2. Mark as reviewed (no changes needed)
3. Ignore for now
```

</edge_cases>
