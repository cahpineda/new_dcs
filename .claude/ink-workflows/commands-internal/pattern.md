---
name: ink:pattern
description: Save or find reusable code patterns
argument-hint: "[save|find] [name or keywords]"
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
Manage the pattern catalog - save new patterns from code or find existing patterns to reuse.
</objective>

<instructions>

## Route by Subcommand

```
/ink:pattern                     → Show pattern catalog summary
/ink:pattern find [keywords]     → Search for patterns
/ink:pattern save [name]         → Save new pattern from code
```

---

## Mode: show (default)

List available patterns in catalog.

```bash
# Check if catalog exists
if [ ! -f ".planning/patterns/INDEX.md" ]; then
  echo "No pattern catalog. Create with /ink:pattern save [name]"
  exit 0
fi

cat .planning/patterns/INDEX.md
```

**Output:**
```markdown
# Pattern Catalog

**Total:** 8 patterns across 4 domains

| ID | Name | Domain | Complexity | Last Used |
|----|------|--------|------------|-----------|
| AUTH-001 | JWT Authentication | auth | medium | 2 days ago |
| AUTH-002 | OAuth2 Flow | auth | complex | 1 week ago |
| API-001 | CRUD Endpoint | api | simple | today |
| DB-001 | Soft Delete | database | simple | 3 days ago |

Use `/ink:pattern find [keywords]` to search
```

---

## Mode: find

Search patterns by keywords, domain, or complexity.

### 1. Parse Search

```
/ink:pattern find auth           → Search by domain
/ink:pattern find jwt token      → Search by keywords
/ink:pattern find --simple       → Filter by complexity
```

### 2. Search Catalog

```bash
# Search INDEX.md and pattern files
grep -ril "$KEYWORDS" .planning/patterns/*.md 2>/dev/null
```

### 3. Rank Results

**Scoring:**
- Exact name match: +10
- Domain match: +5
- Keyword in title: +3
- Keyword in content: +1
- Same complexity: +2
- Recently used: +1

### 4. Present Results

```markdown
# Pattern Search: "jwt auth"

## Best Matches

### 1. PATTERN-AUTH-001: JWT Authentication (Score: 15)

**Match:** High - exact domain + keywords
**Complexity:** medium
**When to use:** Stateless APIs, multiple instances

**Quick preview:**
```typescript
const token = jwt.sign({ userId }, SECRET, { expiresIn: '15m' })
```

[View full pattern] [Apply to current task]

### 2. PATTERN-AUTH-002: OAuth2 Flow (Score: 8)

**Match:** Medium - same domain
**Complexity:** complex

[View] [Apply]

---

No good matches? Describe what you need and I'll check if it should be a new pattern.
```

---

## Mode: save

Extract pattern from existing code and save to catalog.

### 1. Identify Source

```
/ink:pattern save jwt-auth                    → Ask for source file
/ink:pattern save jwt-auth src/auth/jwt.ts    → Use specified file
```

### 2. Analyze Code

```bash
# Read source file
cat "$SOURCE_FILE"

# Extract functions, classes, key logic
grep -E "^(export|function|class|const|async)" "$SOURCE_FILE"
```

### 3. Interview for Pattern

Use AskUserQuestion:

```
Creating pattern: JWT Authentication

Questions:
1. When should this pattern be used?
   [ ] Stateless APIs
   [ ] Multi-instance deployments
   [ ] Mobile app backends
   [ ] Other: ___

2. What's the complexity level?
   [ ] Simple (copy-paste)
   [ ] Medium (needs adaptation)
   [ ] Complex (requires understanding)

3. What can be customized?
   [ ] Token expiry time
   [ ] Payload fields
   [ ] Secret source
   [ ] Other: ___
```

### 4. Generate Pattern File

```markdown
---
id: PATTERN-AUTH-001
name: JWT Authentication
domain: auth
complexity: medium
created: 2024-01-24
last_used: 2024-01-24
source: src/auth/jwt.ts
---

# JWT Authentication

## When to Use

- Stateless API authentication
- Multiple server instances (no shared sessions)
- Mobile or SPA clients

## When NOT to Use

- Need immediate token revocation
- Server-rendered apps (use sessions)
- High security requirements (add refresh tokens)

## Implementation

```typescript
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET!

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, SECRET, { expiresIn: '15m' })
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, SECRET) as { userId: string }
}

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })

  try {
    req.user = verifyToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
```

## Customization Points

| Point | Default | Options |
|-------|---------|---------|
| Expiry | 15m | 5m, 30m, 1h, 24h |
| Algorithm | HS256 | RS256 for asymmetric |
| Payload | userId | Add roles, permissions |

## Variations

### With Refresh Tokens

Add refresh token for longer sessions:

```typescript
export function generateTokenPair(userId: string) {
  const access = jwt.sign({ userId }, SECRET, { expiresIn: '15m' })
  const refresh = jwt.sign({ userId, type: 'refresh' }, SECRET, { expiresIn: '7d' })
  return { access, refresh }
}
```

## Related Patterns

- PATTERN-AUTH-002: OAuth2 (for third-party auth)
- PATTERN-CACHE-001: Redis Session (for server-side sessions)

## Anti-Patterns to Avoid

- Storing tokens in localStorage (XSS vulnerable)
- Long-lived access tokens without refresh
- Sensitive data in payload (tokens are readable)
```

### 5. Update INDEX.md

```bash
# Add to index
echo "| AUTH-001 | JWT Authentication | auth | medium | today |" >> .planning/patterns/INDEX.md

# Sort by domain
sort -t'|' -k3 .planning/patterns/INDEX.md -o .planning/patterns/INDEX.md
```

### 6. Commit (ask user first)

**Ask user before committing:**

```
## Ready to Commit Pattern

**Files to commit:**
- .planning/patterns/PATTERN-[ID].md
- .planning/patterns/INDEX.md

**Proposed commit message:**
`docs: add PATTERN-AUTH-001 JWT Authentication`

**Options:**
1. **Commit now** - Proceed with commit
2. **Skip commit** - Continue without committing
3. **Modify message** - Change commit message first

Would you like to commit these changes?
```

**If user confirms commit:**
```bash
git add .planning/patterns/
git commit -m "docs: add PATTERN-AUTH-001 JWT Authentication"
```

</instructions>

<examples>

**Example 1: Find pattern**
```
User: /ink:pattern find rate limit

Claude: Searching patterns for "rate limit"...

# Pattern Search Results

## Best Match

### PATTERN-API-003: Rate Limiting (Score: 12)

**Domain:** api | **Complexity:** simple

**When to use:**
- Public APIs
- Prevent abuse
- Fair usage enforcement

**Quick code:**
```typescript
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests'
})
app.use('/api/', limiter)
```

View full pattern? [y/n]
```

**Example 2: Save new pattern**
```
User: /ink:pattern save soft-delete src/models/base.ts

Claude: Analyzing src/models/base.ts...

Found reusable pattern: Soft Delete

## Pattern Details

**Functions found:**
- `softDelete(id)` - Mark as deleted
- `restore(id)` - Restore deleted
- `findActive()` - Exclude deleted

**Questions:**

1. Complexity level?
   > Simple - just add deletedAt column

2. Key customization points?
   > Column name, cascade behavior

Creating PATTERN-DB-002: Soft Delete...

✓ Pattern saved to .planning/patterns/PATTERN-DB-002.md
✓ INDEX.md updated
✓ Committed: docs: add PATTERN-DB-002 Soft Delete
```

**Example 3: Show catalog**
```
User: /ink:pattern

Claude:
# Pattern Catalog

**8 patterns** across 4 domains

| Domain | Patterns | Most Used |
|--------|----------|-----------|
| auth | 2 | JWT Authentication |
| api | 3 | CRUD Endpoint |
| db | 2 | Soft Delete |
| cache | 1 | Redis Cache |

Recent activity:
- Today: Used API-001 in Phase 3
- Yesterday: Created DB-002

Commands:
- `/ink:pattern find [keywords]` - Search
- `/ink:pattern save [name]` - Add new
```

</examples>

<edge_cases>

**No catalog exists:**
```
Pattern catalog not initialized.

Create now? This will:
- Create .planning/patterns/
- Create INDEX.md

Then use `/ink:pattern save [name]` to add first pattern.
```

**No matches found:**
```
No patterns match "websocket real-time"

This could be a new pattern opportunity.
After implementing, save with:
/ink:pattern save websocket-handler src/ws/handler.ts
```

**Pattern already exists:**
```
Pattern AUTH-001 already exists.

Options:
1. Update existing pattern
2. Create variation (AUTH-001b)
3. Cancel
```

</edge_cases>
