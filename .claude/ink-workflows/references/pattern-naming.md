# Pattern Naming Convention

## Format

```
PATTERN-{DOMAIN}-{NNN}
```

- **PATTERN**: Fixed prefix for all patterns
- **DOMAIN**: 2-7 letter domain code (uppercase)
- **NNN**: Sequential number within domain (001-999)

---

## Domain Codes

| Code | Domain | Description |
|------|--------|-------------|
| `AUTH` | Authentication | Login, JWT, OAuth, sessions, permissions |
| `API` | API Design | Endpoints, REST, GraphQL, middleware |
| `DB` | Database | Queries, models, migrations, transactions |
| `CACHE` | Caching | Redis, in-memory, invalidation, TTL |
| `STORAGE` | File Storage | S3, uploads, filesystem, CDN |
| `ASYNC` | Async Processing | Queues, workers, events, pub/sub |
| `UI` | User Interface | Components, state, forms, modals |
| `TEST` | Testing | Mocks, fixtures, helpers, factories |
| `VAL` | Validation | Input, schema, sanitization, types |
| `ERR` | Error Handling | Exceptions, logging, recovery, retry |
| `PERF` | Performance | Optimization, batching, lazy loading |
| `SEC` | Security | Encryption, hashing, CSRF, XSS |
| `INT` | Integration | External APIs, webhooks, SDKs |
| `CONFIG` | Configuration | Environment, settings, feature flags |

---

## Examples

```
PATTERN-AUTH-001    JWT Authentication with Refresh Tokens
PATTERN-AUTH-002    OAuth2 Authorization Code Flow
PATTERN-AUTH-003    Role-Based Access Control (RBAC)

PATTERN-API-001     RESTful CRUD Endpoint
PATTERN-API-002     Paginated List Endpoint
PATTERN-API-003     File Upload Endpoint

PATTERN-DB-001      Paginated Query with Cursor
PATTERN-DB-002      Soft Delete Pattern
PATTERN-DB-003      Optimistic Locking

PATTERN-CACHE-001   Redis Rate Limiter
PATTERN-CACHE-002   Cache-Aside Pattern
PATTERN-CACHE-003   Write-Through Cache

PATTERN-ASYNC-001   Idempotent Job Handler
PATTERN-ASYNC-002   Retry with Exponential Backoff
PATTERN-ASYNC-003   Dead Letter Queue Handler

PATTERN-ERR-001     Structured Error Response
PATTERN-ERR-002     Global Exception Handler
PATTERN-ERR-003     Circuit Breaker
```

---

## File Structure

```
.planning/patterns/
├── INDEX.md                    # Pattern registry
├── AUTH/
│   ├── PATTERN-AUTH-001.md
│   ├── PATTERN-AUTH-002.md
│   └── PATTERN-AUTH-003.md
├── API/
│   ├── PATTERN-API-001.md
│   └── PATTERN-API-002.md
├── DB/
│   └── PATTERN-DB-001.md
└── CACHE/
    └── PATTERN-CACHE-001.md
```

---

## INDEX.md Format

```markdown
# Pattern Index

Last updated: {date}
Total patterns: {count}

## By Domain

### AUTH ({count})
| ID | Name | Complexity | Last Used |
|----|------|------------|-----------|
| AUTH-001 | JWT Authentication | medium | 2024-01-20 |
| AUTH-002 | OAuth2 Flow | complex | 2024-01-15 |

### API ({count})
| ID | Name | Complexity | Last Used |
|----|------|------------|-----------|
| API-001 | CRUD Endpoint | simple | 2024-01-22 |

## By Tag

- `stateless`: AUTH-001, API-001
- `redis`: CACHE-001, CACHE-002
- `async`: ASYNC-001, ASYNC-002
```

---

## Naming Best Practices

### DO

- Use descriptive names: `JWT Authentication with Refresh Tokens`
- Include the main technology: `Redis Rate Limiter`
- Be specific: `Paginated Query with Cursor` not just `Pagination`

### DON'T

- Use generic names: ~~`Auth Pattern`~~
- Include version: ~~`JWT Auth v2`~~ (use variations instead)
- Use abbreviations in names: ~~`JWT Auth w/ RT`~~

---

## When to Create New vs. Add Variation

**Create NEW pattern when:**
- Fundamentally different approach
- Different use cases
- Different dependencies
- Can't be achieved by modifying existing

**Add VARIATION when:**
- Same core logic
- Minor configuration difference
- Same dependencies
- Could use same pattern with tweaks

---

## Deprecating Patterns

When a pattern is superseded:

```markdown
---
id: PATTERN-AUTH-001
status: deprecated
superseded_by: PATTERN-AUTH-004
deprecation_reason: Security vulnerability in JWT library
---
```

Don't delete patterns - mark as deprecated with reason and replacement.
