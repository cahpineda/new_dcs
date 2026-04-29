# Anti-Patterns Catalog

## Purpose

Detect common anti-patterns in plans and code before they cause production issues.

---

## Database Anti-Patterns

### N+1 Queries

**Pattern:** Loop that executes a query per iteration.

**Detection:**
```
for .* in .*:
    .*\.query\(|\.find\(|\.get\(|SELECT.*WHERE
```

**Example (BAD):**
```python
for user in users:
    orders = db.query(Order).filter(Order.user_id == user.id).all()
```

**Consequence:**
- 100 users = 101 queries (1 for users + 100 for orders)
- Saturates database connections
- Timeouts in production

**Solution:**
```python
# Eager loading / JOIN
users = db.query(User).options(joinedload(User.orders)).all()

# Or bulk fetch
user_ids = [u.id for u in users]
orders = db.query(Order).filter(Order.user_id.in_(user_ids)).all()
```

---

### Missing Pagination

**Pattern:** Query without LIMIT on list endpoints.

**Detection:**
```
SELECT.*FROM(?!.*LIMIT)
\.all\(\)(?!.*\[:|\[0:)
findMany\(\)(?!.*take:)
```

**Example (BAD):**
```python
@app.get("/users")
def get_users():
    return db.query(User).all()  # Returns ALL users
```

**Consequence:**
- Memory exhaustion with large datasets
- Slow response times
- Client timeout

**Solution:**
```python
@app.get("/users")
def get_users(skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()
```

---

### Missing Indexes

**Pattern:** Query filtering on columns without index.

**Detection:**
```
WHERE (?!id|.*_id)
filter\(.*\.(?!id)
ORDER BY (?!id|created_at)
```

**Consequence:**
- Full table scans
- Exponential slowdown as data grows

**Mitigation:** Note in plan that index may be needed.

---

## Security Anti-Patterns

### Hardcoded Secrets

**Pattern:** Credentials or API keys in source code.

**Detection:**
```
(api_key|apikey|secret|password|token|credential)\s*=\s*["'][^"']+["']
(sk_live_|pk_live_|ghp_|xoxb-)
```

**Example (BAD):**
```python
STRIPE_KEY = "sk_live_abc123..."
```

**Consequence:**
- Secrets exposed in git history
- Cannot rotate without deploy
- Fails security audits

**Solution:**
```python
STRIPE_KEY = os.environ["STRIPE_KEY"]
```

---

### SQL Injection

**Pattern:** String concatenation in SQL queries.

**Detection:**
```
(execute|query)\s*\(\s*f?["'].*\{.*\}
(execute|query)\s*\(\s*["'].*%s.*%\s*\(
\.format\(.*\).*(?:SELECT|INSERT|UPDATE|DELETE)
```

**Example (BAD):**
```python
db.execute(f"SELECT * FROM users WHERE id = {user_id}")
```

**Consequence:**
- Complete database compromise
- Data theft, deletion, modification

**Solution:**
```python
db.execute("SELECT * FROM users WHERE id = :id", {"id": user_id})
```

---

### Missing Input Validation

**Pattern:** Direct use of user input without validation.

**Detection:**
```
request\.(json|form|args|params)\[.*\](?!.*validate|.*schema|.*model)
```

**Example (BAD):**
```python
@app.post("/transfer")
def transfer():
    amount = request.json["amount"]  # Could be negative!
    to_account = request.json["to"]  # Could be any account!
```

**Solution:**
```python
class TransferRequest(BaseModel):
    amount: PositiveDecimal
    to_account: str = Field(regex=r"^ACC\d{10}$")

@app.post("/transfer")
def transfer(req: TransferRequest):
    ...
```

---

## Architecture Anti-Patterns

### Shared Mutable State

**Pattern:** Global variables modified across requests/threads.

**Detection:**
```
^[A-Z_]+ = \{\}|^[A-Z_]+ = \[\]
global \w+
```

**Example (BAD):**
```python
CACHE = {}  # Global dict

def get_user(id):
    if id not in CACHE:
        CACHE[id] = fetch_user(id)  # Race condition!
    return CACHE[id]
```

**Consequence:**
- Race conditions in multi-threaded/multi-process
- Data corruption
- Non-reproducible bugs

**Solution:**
```python
from functools import lru_cache
# Or use Redis for shared state
```

---

### Filesystem for Multi-Instance

**Pattern:** Local file storage in multi-instance deployment.

**Detection:**
```
(save|write|open)\s*\(\s*["']\/?(tmp|uploads|files|data)
Path\(.*\)\s*\.\s*write
```

**Example (BAD):**
```python
def save_avatar(user_id, file):
    path = f"/uploads/{user_id}.png"
    file.save(path)
```

**Consequence:**
- Files only exist on one server instance
- Lost on deployment/restart
- Inconsistent behavior

**Solution:**
```python
def save_avatar(user_id, file):
    s3.upload_file(file, bucket, f"avatars/{user_id}.png")
```

---

### God Object / Service

**Pattern:** Class with too many responsibilities.

**Detection:**
```
class \w+(Service|Manager|Handler).*:
  # Count methods > 15
  # Count lines > 500
```

**Consequence:**
- Impossible to test in isolation
- Changes have ripple effects
- Cannot scale independently

**Mitigation:** Note in plan review, suggest splitting.

---

## Performance Anti-Patterns

### Synchronous in Async Context

**Pattern:** Blocking calls in async functions.

**Detection:**
```
async def.*:
    .*requests\.(get|post)
    .*time\.sleep
    .*open\(
```

**Example (BAD):**
```python
async def fetch_data():
    response = requests.get(url)  # Blocks the event loop!
```

**Solution:**
```python
async def fetch_data():
    async with aiohttp.ClientSession() as session:
        response = await session.get(url)
```

---

### Missing Timeouts

**Pattern:** Network calls without timeout.

**Detection:**
```
requests\.(get|post)\([^)]*\)(?!.*timeout)
fetch\([^)]*\)(?!.*timeout|.*signal)
```

**Example (BAD):**
```python
response = requests.get("https://api.example.com/data")
```

**Consequence:**
- Request hangs indefinitely
- Thread/connection exhaustion
- Service degradation

**Solution:**
```python
response = requests.get(url, timeout=10)
```

---

## Code Quality Anti-Patterns

### TODO/FIXME in Production

**Pattern:** Incomplete code markers.

**Detection:**
```
(TODO|FIXME|HACK|XXX|BUG):?
```

**Consequence:**
- Known issues going to production
- Technical debt accumulation

**Mitigation:** Must resolve or create issue before commit.

---

### Empty Exception Handler

**Pattern:** Catching exceptions without handling.

**Detection:**
```
except.*:
    pass
except.*:
    \.\.\.
```

**Example (BAD):**
```python
try:
    risky_operation()
except Exception:
    pass  # Silently swallowed!
```

**Solution:**
```python
try:
    risky_operation()
except SpecificException as e:
    logger.error(f"Operation failed: {e}")
    raise
```

---

## Detection Integration

### In validate-plan

When validating a plan, scan for these patterns in:
1. Code blocks in the plan
2. Referenced files in the codebase
3. Action descriptions

### Report Format

```
⚠️ ANTI-PATTERN DETECTED

Pattern: N+1 Query
Location: Task 2, line 15
Code: for user in users: db.query(Order).filter(...)

Why it's a problem:
With 100 users, this creates 101 database queries instead of 1.
In production with thousands of users, this will cause timeouts.

Suggested fix:
Use eager loading: db.query(User).options(joinedload(User.orders))
Or bulk fetch: Order.query.filter(Order.user_id.in_(user_ids))
```

---

## Cross-Language Confusion (Critical)

**Reference:** @.claude/ink-workflows/references/cross-language/ for comprehensive detection patterns.

**Pattern:** Using functions/syntax from another programming language.

**Severity:** 🔴 **CRITICAL** - Always block. These will crash at runtime.

### Detection Patterns

**For JavaScript/TypeScript files (.js, .jsx, .ts, .tsx, .mjs, .mts):**
```regex
# PHP type-check functions (most common - almost always errors)
\b(isset|empty|is_null|is_array|is_string|is_int|is_numeric|is_bool|is_object|gettype)\s*\(

# Python capitalized booleans (always errors in JS)
\b(True|False|None)\b

# Python built-in functions
\b(len|str|int|float|list|dict|tuple|range|enumerate)\s*\(
```

**For Python files (.py):**
```regex
# JavaScript lowercase booleans (always errors in Python)
\b(true|false|null|undefined)\b

# JavaScript variable declarations
\b(const|let|var|function)\s+\w+

# Console functions
\bconsole\.(log|error|warn)\s*\(
```

### Example (BAD - PHP in JavaScript)

```javascript
if (isset(user.name)) {  // isset doesn't exist in JS!
    console.log(empty(user.roles));  // empty doesn't exist either!
}
```

### Consequence

- **Immediate runtime crash:** `ReferenceError: isset is not defined`
- Code cannot execute at all
- No partial functionality - complete failure
- Breaks production deployments

### Solution

```javascript
// Correct JavaScript equivalents
if (user.name !== undefined && user.name !== null) {
    console.log(!user.roles || user.roles.length === 0);
}
```

### Common Cross-Language Errors

| Wrong Code | File Type | Correct Code | Error Type |
|------------|-----------|--------------|------------|
| `isset(x)` | `.js` | `x !== undefined && x !== null` | PHP → JS |
| `empty(arr)` | `.js` | `!arr || arr.length === 0` | PHP → JS |
| `len(arr)` | `.js` | `arr.length` | Python → JS |
| `True`/`False` | `.js` | `true`/`false` | Python → JS |
| `true`/`false` | `.py` | `True`/`False` | JS → Python |
| `console.log(x)` | `.py` | `print(x)` | JS → Python |
| `null` | `.py` | `None` | JS → Python |

### Detection Strategy

1. Identify file extension to determine target language
2. Scan for function calls that don't exist in that language
3. Cross-reference against @.claude/ink-workflows/references/cross-language/ patterns
4. Flag as 🔴 Critical - these WILL crash at runtime

**See also:** @.claude/ink-workflows/references/cross-language/README.md for modular pattern files

---

### Severity Levels

| Level | Action |
|-------|--------|
| 🔴 Critical | Block execution until fixed (SQL injection, secrets) |
| 🟠 Warning | Warn and ask for confirmation (N+1, missing pagination) |
| 🟡 Note | Inform but proceed (TODO, missing timeout) |
