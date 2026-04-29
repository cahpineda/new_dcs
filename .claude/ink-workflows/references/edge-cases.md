# Edge Cases Catalog

## Purpose

Provide domain-specific edge cases to test during POC execution and implementation.
Helps catch issues that wouldn't be found with happy-path testing alone.

---

## Edge Cases by Domain

### Authentication (AUTH)

| Case ID | Scenario | What to Test |
|---------|----------|--------------|
| AUTH-001 | Empty credentials | Empty string for username/password |
| AUTH-002 | SQL injection in login | `'; DROP TABLE users; --` in username |
| AUTH-003 | Very long password | 10000+ character password |
| AUTH-004 | Unicode in credentials | Emoji, Chinese characters, RTL text |
| AUTH-005 | Concurrent login attempts | Same user, multiple simultaneous requests |
| AUTH-006 | Token at boundary | Token expires exactly during request |
| AUTH-007 | Invalid token format | Malformed JWT, missing parts |
| AUTH-008 | Case sensitivity | User@Email.com vs user@email.com |
| AUTH-009 | Whitespace handling | Leading/trailing spaces in email |
| AUTH-010 | Rate limit boundary | Exactly at limit, one over limit |

### API Endpoints (API)

| Case ID | Scenario | What to Test |
|---------|----------|--------------|
| API-001 | Empty request body | `{}` or null body |
| API-002 | Missing required fields | Omit each required field individually |
| API-003 | Extra unknown fields | Include fields not in schema |
| API-004 | Wrong data types | String where number expected, etc. |
| API-005 | Boundary values | 0, -1, MAX_INT, empty array |
| API-006 | Large payload | Request near/over size limit |
| API-007 | Concurrent modifications | Two users editing same resource |
| API-008 | Invalid ID formats | Non-existent ID, malformed UUID |
| API-009 | Pagination edge | Page 0, page beyond total, negative page |
| API-010 | Special characters | `<script>`, `../`, null bytes in strings |

### Database (DB)

| Case ID | Scenario | What to Test |
|---------|----------|--------------|
| DB-001 | Unique constraint | Insert duplicate key |
| DB-002 | Foreign key missing | Reference non-existent parent |
| DB-003 | Null in non-nullable | Insert null where not allowed |
| DB-004 | String truncation | String longer than column allows |
| DB-005 | Transaction rollback | Failure mid-transaction |
| DB-006 | Concurrent writes | Same row updated simultaneously |
| DB-007 | Empty result set | Query returns 0 rows |
| DB-008 | Large result set | Query returns 100k+ rows |
| DB-009 | Connection timeout | Database unreachable |
| DB-010 | Date edge cases | Leap year, timezone boundaries |

### File Storage (STORAGE)

| Case ID | Scenario | What to Test |
|---------|----------|--------------|
| STOR-001 | Zero byte file | Empty file upload |
| STOR-002 | Max size file | File exactly at limit |
| STOR-003 | Over limit file | File 1 byte over limit |
| STOR-004 | Invalid file type | Rename .exe to .jpg |
| STOR-005 | Path traversal | Filename with `../` |
| STOR-006 | Unicode filename | Emoji, special chars in name |
| STOR-007 | Duplicate filename | Upload same name twice |
| STOR-008 | Concurrent upload | Same user, multiple uploads |
| STOR-009 | Interrupted upload | Connection drops mid-upload |
| STOR-010 | Storage full | Disk/quota exceeded |

### Caching (CACHE)

| Case ID | Scenario | What to Test |
|---------|----------|--------------|
| CACHE-001 | Cache miss | First request, empty cache |
| CACHE-002 | Cache hit | Subsequent request |
| CACHE-003 | Cache expiry | Access exactly at TTL |
| CACHE-004 | Cache stampede | Many requests after expiry |
| CACHE-005 | Invalid cached data | Corrupted cache entry |
| CACHE-006 | Cache invalidation | Update source, check cache |
| CACHE-007 | Large cached value | Near memory limit |
| CACHE-008 | Cache unavailable | Redis down, fallback behavior |
| CACHE-009 | Negative cache | Cache "not found" results |
| CACHE-010 | Cache key collision | Different data, same key pattern |

### Async/Queue (ASYNC)

| Case ID | Scenario | What to Test |
|---------|----------|--------------|
| ASYNC-001 | Job failure | Task throws exception |
| ASYNC-002 | Retry exhaustion | Max retries exceeded |
| ASYNC-003 | Duplicate job | Same job submitted twice |
| ASYNC-004 | Job timeout | Task runs longer than limit |
| ASYNC-005 | Queue full | Backpressure handling |
| ASYNC-006 | Worker crash | Worker dies mid-job |
| ASYNC-007 | Out of order | Job B completes before Job A |
| ASYNC-008 | Idempotency | Same job runs twice |
| ASYNC-009 | Dead letter | Permanently failed jobs |
| ASYNC-010 | Priority inversion | Low priority blocks high |

### Payments (PAY)

| Case ID | Scenario | What to Test |
|---------|----------|--------------|
| PAY-001 | Card declined | Various decline reasons |
| PAY-002 | Insufficient funds | Partial amount available |
| PAY-003 | 3D Secure required | Authentication challenge |
| PAY-004 | Duplicate charge | Same payment submitted twice |
| PAY-005 | Refund > original | Refund more than charged |
| PAY-006 | Currency mismatch | USD charge, EUR refund |
| PAY-007 | Webhook duplicate | Same event sent multiple times |
| PAY-008 | Webhook out of order | Payment before customer created |
| PAY-009 | Network timeout | Stripe API unreachable |
| PAY-010 | Idempotency key collision | Reused key, different amount |

---

## How to Use

### During POC Execution

```markdown
<poc required="true">
  <hypothesis>JWT token validation works correctly</hypothesis>
  <test>
    # Happy path
    token = create_token(user_id=1)
    assert validate_token(token) == True

    # Edge cases from AUTH domain
    assert validate_token("") == False  # AUTH-007: Empty token
    assert validate_token("invalid.format") == False  # AUTH-007: Malformed
    assert validate_token(expired_token) == False  # AUTH-006: Expired
  </test>
  <success_criteria>All validations pass</success_criteria>
  <edge_cases>AUTH-006, AUTH-007</edge_cases>
</poc>
```

### During Task Implementation

After implementing happy path, systematically test relevant edge cases:

1. Identify domain (AUTH, API, DB, etc.)
2. Select 3-5 most relevant cases for the feature
3. Add tests or manual verification for each
4. Document any edge cases NOT handled (log to ISSUES.md)

### Edge Case Selection Heuristics

**Always test:**
- Empty/null inputs (first defense)
- Boundary values (off-by-one errors)
- Invalid format (type safety)
- Authentication/authorization bypass attempts

**Test when relevant:**
- Concurrent access (multi-user features)
- Large data (performance features)
- Network failures (external integrations)
- Duplicate operations (idempotency concerns)

---

## Adding New Edge Cases

When you discover a new edge case during development:

1. Identify the domain
2. Assign next available ID (e.g., AUTH-011)
3. Add to this catalog with scenario and test description
4. Reference in SUMMARY.md if it caused a deviation

```markdown
| AUTH-011 | Password with only spaces | "     " as password |
```

---

## Integration Points

- **`/ink:go plan`**: POC sections reference edge case IDs
- **`/ink:go execute`**: Reports edge case failures in POC results
- **Validation step in execution**: Checks if edge cases are considered (automatic)
- **SUMMARY.md**: Documents which edge cases were tested
