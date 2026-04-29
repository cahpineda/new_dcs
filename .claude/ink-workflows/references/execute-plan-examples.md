# Execute Plan Examples

This file contains examples and detailed guidance extracted from execute-plan.md for lazy loading. These examples are referenced from the main execution modules.

## Table of Contents

- [POC to Production Scaling](#poc-to-production-scaling)
- [Authentication Gates](#authentication-gates)
- [Deviation Documentation Examples](#deviation-documentation-examples)
- [Commit Message Examples](#commit-message-examples)
- [Summary Format Examples](#summary-format-examples)

---

## POC to Production Scaling

<a name="poc-to-production"></a>

When a POC passes, scale to production code by adding these concerns:

**1. Error Handling**
```
POC:        result = do_thing()
Production: try:
              result = do_thing()
            except SpecificError as e:
              logger.error(f"Failed: {e}")
              raise AppError("User-friendly message")
```

**2. Input Validation**
```
POC:        def process(data): ...
Production: def process(data: DataModel) -> Result:
              if not data.is_valid():
                raise ValidationError("Invalid input")
              ...
```

**3. Logging**
```
POC:        print("done")
Production: logger.info("Operation completed", extra={"user_id": user_id, "duration": elapsed})
```

**4. Type Safety**
```
POC:        def calculate(x, y): return x + y
Production: def calculate(x: Decimal, y: Decimal) -> Decimal:
              """Calculate sum with precision."""
              return x + y
```

**5. Integration**
```
POC:        redis.incr("key")
Production: rate_limiter = RateLimiter(redis_client)
            rate_limiter.check(user_id, limit=100, window=60)
```

**Checklist before committing scaled code:**
- [ ] Error cases handled
- [ ] Inputs validated
- [ ] Appropriate logging added
- [ ] Types annotated
- [ ] Integrated with existing patterns
- [ ] Tests cover POC scenario + edge cases

**POC Execution Flow:**

When a task has `<poc required="true">`:

1. **Extract POC details:**
   - Hypothesis: What we're testing
   - Test code: Minimal validation script
   - Success criteria: What proves it works
   - Edge cases: IDs from edge-cases.md (if specified)

2. **Execute POC first (happy path):**
   ```bash
   # Run POC test in isolated environment
   # For Python: python -c "..."
   # For Node: node -e "..."
   # For SQL: sqlite3 :memory: "..."
   ```

3. **Execute edge cases (if specified):**

   If `<edge_cases>` element present in POC:

   ```bash
   # Load edge cases catalog
   cat .claude/ink-workflows/references/edge-cases.md
   ```

   For each referenced edge case ID:
   - Extract the test scenario from catalog
   - Adapt POC test code for edge case
   - Execute and record result

   **Edge case execution format:**
   ```
   Testing edge cases for [hypothesis]...

   | Case | Scenario | Expected | Actual | Status |
   |------|----------|----------|--------|--------|
   | AUTH-006 | Token at expiry | Reject | Reject | ✓ PASS |
   | AUTH-007 | Malformed JWT | Reject | Reject | ✓ PASS |
   | AUTH-001 | Empty token | Reject | Crash | ✗ FAIL |
   ```

4. **Evaluate POC result:**

   **If POC PASSES (happy path + all edge cases):**
   ```
   ✓ POC PASS: [hypothesis confirmed]
   ✓ Edge cases: [N]/[N] passed
   Proceeding to production implementation...
   ```
   Continue to implementation.

   **If POC happy path FAILS:**
   ```
   ✗ POC FAIL: [what failed]

   Options:
   1. Revise approach - Different pattern/library
   2. Investigate further - More research needed
   3. Skip task - Mark as blocked

   DO NOT proceed to production code until POC passes.
   ```
   Use AskUserQuestion to determine next action.

   **If edge cases FAIL (but happy path passed):**
   ```
   ⚠️ POC PARTIAL: Happy path works, edge cases failed

   Failing edge cases:
   - AUTH-001: Empty token causes crash (expected: reject gracefully)
   - [other failures]

   Options:
   1. Fix edge cases now - Handle before production
   2. Log and proceed - Address edge cases during implementation
   3. Accept risk - Document as known limitation
   ```
   Use AskUserQuestion. If "Log and proceed":
   - Add to ISSUES.md: "ISS-XXX: Handle [edge case] in [feature]"
   - Note in task execution log
   - Proceed with implementation (will need to handle in production code)

---

## Authentication Gates

<a name="authentication-gates"></a>

**When you encounter authentication errors during `type="auto"` task execution:**

This is NOT a failure. Authentication gates are expected and normal. Handle them dynamically:

**Authentication error indicators:**

- CLI returns: "Error: Not authenticated", "Not logged in", "Unauthorized", "401", "403"
- API returns: "Authentication required", "Invalid API key", "Missing credentials"
- Command fails with: "Please run {tool} login" or "Set {ENV_VAR} environment variable"

**Authentication gate protocol:**

1. **Recognize it's an auth gate** - Not a bug, just needs credentials
2. **STOP current task execution** - Don't retry repeatedly
3. **Create dynamic checkpoint:human-action** - Present it to user immediately
4. **Provide exact authentication steps** - CLI commands, where to get keys
5. **Wait for user to authenticate** - Let them complete auth flow
6. **Verify authentication works** - Test that credentials are valid
7. **Retry the original task** - Resume automation where you left off
8. **Continue normally** - Don't treat this as an error in Summary

**Example: Vercel deployment hits auth error**

```
Task 3: Deploy to Vercel
Running: vercel --yes

Error: Not authenticated. Please run 'vercel login'

[Create checkpoint dynamically]

════════════════════════════════════════
CHECKPOINT: Authentication Required
════════════════════════════════════════

Task 3 of 8: Authenticate Vercel CLI

I tried to deploy but got authentication error.

What you need to do:
Run: vercel login

This will open your browser - complete the authentication flow.

I'll verify after: vercel whoami returns your account

Type "done" when authenticated
════════════════════════════════════════

[Wait for user response]

[User types "done"]

Verifying authentication...
Running: vercel whoami
✓ Authenticated as: user@example.com

Retrying deployment...
Running: vercel --yes
✓ Deployed to: https://myapp-abc123.vercel.app

Task 3 complete. Continuing to task 4...
```

**In Summary documentation:**

Document authentication gates as normal flow, not deviations:

```markdown
## Authentication Gates

During execution, I encountered authentication requirements:

1. Task 3: Vercel CLI required authentication
   - Paused for `vercel login`
   - Resumed after authentication
   - Deployed successfully

These are normal gates, not errors.
```

**Key principles:**

- Authentication gates are NOT failures or bugs
- They're expected interaction points during first-time setup
- Handle them gracefully and continue automation after unblocked
- Don't mark tasks as "failed" or "incomplete" due to auth gates
- Document them as normal flow, separate from deviations

---

## Deviation Documentation Examples

<a name="deviation-documentation-examples"></a>

**Example deviation documentation in SUMMARY.md:**

```markdown
## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed case-sensitive email uniqueness constraint**

- **Found during:** Task 4 (Follow/unfollow API implementation)
- **Issue:** User.email unique constraint was case-sensitive - Test@example.com and test@example.com were both allowed, causing duplicate accounts
- **Fix:** Changed to `CREATE UNIQUE INDEX users_email_unique ON users (LOWER(email))`
- **Files modified:** src/models/User.ts, migrations/003_fix_email_unique.sql
- **Verification:** Unique constraint test passes - duplicate emails properly rejected
- **Commit:** abc123f

**2. [Rule 2 - Missing Critical] Added JWT expiry validation to auth middleware**

- **Found during:** Task 3 (Protected route implementation)
- **Issue:** Auth middleware wasn't checking token expiry - expired tokens were being accepted
- **Fix:** Added exp claim validation in middleware, reject with 401 if expired
- **Files modified:** src/middleware/auth.ts, src/middleware/auth.test.ts
- **Verification:** Expired token test passes - properly rejects with 401
- **Commit:** def456g

### Deferred Enhancements

Logged to .planning/ISSUES.md for future consideration:

- ISS-001: Refactor UserService into smaller modules (discovered in Task 3)
- ISS-002: Add connection pooling for Redis (discovered in Task 6)

---

**Total deviations:** 4 auto-fixed (1 bug, 1 missing critical, 1 blocking, 1 architectural with approval), 3 deferred
**Impact on plan:** All auto-fixes necessary for correctness/security/performance. No scope creep.
```

---

## Commit Message Examples

<a name="commit-message-examples"></a>

**Standard plan task commits:**

```bash
# Feature implementation
git commit -m "feat(08-02): create user registration endpoint

- POST /auth/register validates email and password
- Checks for duplicate users
- Returns JWT token on success
"

# Bug fix
git commit -m "fix(08-02): correct email validation regex

- Fixed regex to accept plus-addressing
- Added tests for edge cases
"

# Performance improvement
git commit -m "perf(08-02): add database index for user lookups

- Added index on users.email for faster lookups
- Reduced query time from 200ms to 5ms
"
```

**TDD plan commits:**

```bash
# RED phase
git commit -m "test(08-02): add failing test for password hashing

- Test expects bcrypt hash with cost factor 10
- Currently fails (no implementation yet)
"

# GREEN phase
git commit -m "feat(08-02): implement password hashing

- Added bcrypt hashing with cost factor 10
- Test now passes
"

# REFACTOR phase (optional)
git commit -m "refactor(08-02): extract password hashing to utility

- Created PasswordService utility class
- Improved code organization
- Tests still pass
"
```

---

## Summary Format Examples

<a name="summary-format-examples"></a>

**Example SUMMARY.md structure:**

```markdown
# Phase 8 Plan 2: User Registration Summary

**JWT auth with refresh rotation using jose library**

## Accomplishments

- User registration endpoint implemented
- Password hashing with bcrypt (cost factor 10)
- Email confirmation flow added
- JWT token generation and validation

## Files Created/Modified

- `src/api/auth.ts` - Created (registration endpoint)
- `src/middleware/auth.ts` - Modified (added JWT validation)
- `src/models/User.ts` - Modified (added password field)
- `migrations/003_add_password.sql` - Created (database migration)

## Decisions Made

- Decided to use bcrypt for password hashing (cost factor 10)
- Chose jose library for JWT operations
- Implemented email confirmation before account activation

## Issues Encountered

None

## Metrics

- Duration: 45 min
- Started: 2025-01-19T10:00:00Z
- Completed: 2025-01-19T10:45:00Z
- Tasks completed: 3/3
- Files modified: 4

## Next Step

Ready for 08-03-PLAN.md: Password reset flow
```
