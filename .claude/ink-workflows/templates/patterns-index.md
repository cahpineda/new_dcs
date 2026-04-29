# Pattern Index

Template for `.planning/patterns/INDEX.md`

---

```markdown
# Pattern Index

**Last updated:** {date}
**Total patterns:** 0

## Quick Reference

| Domain | Count | Description |
|--------|-------|-------------|
| AUTH | 0 | Authentication, authorization, sessions |
| API | 0 | Endpoints, REST, GraphQL, middleware |
| DB | 0 | Queries, models, migrations |
| CACHE | 0 | Redis, in-memory, invalidation |
| STORAGE | 0 | S3, uploads, filesystem |
| ASYNC | 0 | Queues, workers, events |
| UI | 0 | Components, state, forms |
| TEST | 0 | Mocks, fixtures, helpers |
| VAL | 0 | Input, schema, sanitization |
| ERR | 0 | Exceptions, logging, recovery |

## All Patterns

_No patterns yet. Patterns are saved automatically after successful implementations._

<!-- Pattern entries will be added here as:

### AUTH

| ID | Name | Complexity | Last Used | Uses |
|----|------|------------|-----------|------|
| AUTH-001 | JWT Authentication | medium | 2024-01-20 | 12 |

-->

## By Tag

_Tags will appear here as patterns are added_

<!-- Format:
- `stateless`: AUTH-001, API-001
- `redis`: CACHE-001, CACHE-002
-->

## Recently Used

_Recently used patterns will appear here_

<!-- Format:
1. PATTERN-AUTH-001 (2024-01-20)
2. PATTERN-DB-001 (2024-01-19)
-->

## Most Used

_Frequently used patterns will appear here_

<!-- Format:
1. PATTERN-AUTH-001 (12 uses)
2. PATTERN-CACHE-001 (8 uses)
-->
```

---

## Directory Structure

When creating patterns directory:

```bash
mkdir -p .planning/patterns
cat > .planning/patterns/INDEX.md << 'EOF'
# Pattern Index

**Last updated:** $(date +%Y-%m-%d)
**Total patterns:** 0

## Quick Reference

| Domain | Count | Description |
|--------|-------|-------------|
| AUTH | 0 | Authentication, authorization, sessions |
| API | 0 | Endpoints, REST, GraphQL, middleware |
| DB | 0 | Queries, models, migrations |
| CACHE | 0 | Redis, in-memory, invalidation |
| STORAGE | 0 | S3, uploads, filesystem |
| ASYNC | 0 | Queues, workers, events |

## All Patterns

_No patterns yet. Patterns are saved automatically after successful implementations._
EOF
```

## Integration Points

- **Planning phase**: Searches this index for relevant patterns
- **Execution phase**: Updates `last_used` when pattern referenced
- **Post-task**: Auto-saves new patterns after successful implementations
