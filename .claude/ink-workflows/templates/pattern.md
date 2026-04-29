# Pattern Template

Template for `.planning/patterns/PATTERN-{DOMAIN}-{NNN}.md`

See @references/pattern-naming.md for naming conventions and domain codes.

---

```markdown
---
id: PATTERN-{DOMAIN}-{NNN}
name: {Pattern Name}
domain: {auth|api|db|cache|storage|async|ui|test}
language: {typescript|python|go|php|rust}
complexity: {simple|medium|complex}
created: {YYYY-MM-DD}
last_used: {YYYY-MM-DD}
use_count: {N}
tags: [tag1, tag2, tag3]
---

# PATTERN-{DOMAIN}-{NNN}: {Pattern Name}

## Summary

{One-line description of what this pattern solves}

## When to Use

- {Scenario 1 where this pattern applies}
- {Scenario 2 where this pattern applies}
- {Scenario 3 where this pattern applies}

## When NOT to Use

- {Scenario where this pattern is wrong}
- {Alternative to consider instead}

## Implementation

```{language}
{Core implementation code}
{Should be complete and working}
{Include imports and dependencies}
```

## Usage Example

```{language}
{How to use the pattern in practice}
{Show typical integration}
```

## Variations

### Variation 1: {Name}

{Description of when to use this variation}

```{language}
{Modified code for this variation}
```

### Variation 2: {Name}

{Description of when to use this variation}

```{language}
{Modified code for this variation}
```

## Configuration Points

| Parameter | Default | Description |
|-----------|---------|-------------|
| {param1} | {value} | {What it controls} |
| {param2} | {value} | {What it controls} |

## Dependencies

- `{package-name}`: {Why it's needed}
- `{package-name}`: {Why it's needed}

## Related Patterns

- `PATTERN-{DOMAIN}-{NNN}`: {How they relate}
- `PATTERN-{DOMAIN}-{NNN}`: {How they relate}

## Anti-Patterns to Avoid

- ❌ {Bad practice 1} - {Why it's bad}
- ❌ {Bad practice 2} - {Why it's bad}

## Source

{Where this pattern came from}
- Extracted from: `{file path}` on {date}
- Or: Based on {library/framework} documentation
- Or: Industry standard pattern

## Notes

{Any additional context, gotchas, or tips}
```

---

## Domain Codes

| Domain | Code | Examples |
|--------|------|----------|
| Authentication | AUTH | JWT, OAuth, session |
| API | API | REST endpoints, GraphQL |
| Database | DB | Queries, models, migrations |
| Caching | CACHE | Redis, in-memory, invalidation |
| Storage | STORAGE | S3, filesystem, uploads |
| Async | ASYNC | Queues, workers, events |
| UI | UI | Components, state, forms |
| Testing | TEST | Mocks, fixtures, helpers |
| Validation | VAL | Input, schema, sanitization |
| Error | ERR | Handling, logging, recovery |

## Naming Convention

```
PATTERN-{DOMAIN}-{NNN}

Examples:
PATTERN-AUTH-001  → JWT Authentication
PATTERN-AUTH-002  → OAuth2 Flow
PATTERN-DB-001    → Paginated Query
PATTERN-CACHE-001 → Redis Rate Limiter
PATTERN-API-001   → CRUD Endpoint
```

## Variable Generation Guide

| Variable | How to generate |
|----------|-----------------|
| `{DOMAIN}` | Select from Domain Codes table based on pattern functionality |
| `{NNN}` | Sequential 3-digit number within domain: `ls .planning/patterns/PATTERN-${DOMAIN}-*.md \| wc -l \| xargs printf "%03d"` |
| `{Pattern Name}` | Descriptive name: "[Action] [Object] [Context]" e.g., "Paginated Query with Cursor" |
| `{YYYY-MM-DD}` | Current date: `date +%Y-%m-%d` |
| `{language}` | Primary implementation language from project (check package.json, go.mod, etc.) |
| `{N}` (use_count) | Start at 0, increment when pattern is referenced in a plan |
| `tags` | Extract key concepts: ["async", "caching", "redis"] |

**Automated ID generation:**
```bash
generate_pattern_id() {
  local domain="$1"
  local existing=$(ls .planning/patterns/PATTERN-${domain}-*.md 2>/dev/null | wc -l | tr -d ' ')
  local next=$((existing + 1))
  printf "PATTERN-%s-%03d" "$domain" "$next"
}
# Usage: generate_pattern_id "AUTH" → PATTERN-AUTH-001
```

## Quality Criteria

Before saving a pattern, verify:

- [ ] Works standalone (copy-paste functional)
- [ ] Includes all imports/dependencies
- [ ] Has at least one usage example
- [ ] Documents when NOT to use
- [ ] Lists related anti-patterns
- [ ] Tested in actual project
