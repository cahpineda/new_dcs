# Chapter Template

Template for `.planning/memory/chapters/CAP-{DOMAIN}.md`

---

```markdown
---
id: CAP-{DOMAIN}
name: {Chapter Name}
status: active
superseded_by: null
confidence: 0.95
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
last_accessed: {YYYY-MM-DD}
access_count: 0
key_files:
  - path: src/path/to/main.ts
    symbol: mainFunction
    verified: {YYYY-MM-DD}
  - path: src/path/to/related.ts
    symbol: relatedHelper
    verified: {YYYY-MM-DD}
key_decisions:
  - {Decision 1 summary}
  - {Decision 2 summary}
tags: [tag1, tag2, tag3]
---

# {Chapter Name}

## Summary

{2-3 sentences explaining what this chapter covers and why it matters}

## Current State

### What Exists

{Brief description of current implementation}

**Key Files:**
- `src/auth/jwt.ts` - Token generation and validation
- `src/auth/middleware.ts` - Authentication middleware
- `src/auth/refresh.ts` - Refresh token handling

**Key Functions:**
- `generateToken(user)` - Creates access + refresh tokens
- `validateToken(token)` - Verifies and decodes token
- `refreshTokens(refreshToken)` - Issues new token pair

### Configuration

| Setting | Value | Location |
|---------|-------|----------|
| Access token TTL | 15 minutes | `src/config/auth.ts` |
| Refresh token TTL | 7 days | `src/config/auth.ts` |
| JWT secret | env var | `JWT_SECRET` |

## Key Decisions

### Decision 1: {Title}

**Context:** {Why this decision was needed}

**Decision:** {What was decided}

**Rationale:** {Why this choice over alternatives}

**Consequences:**
- {Positive consequence}
- {Tradeoff accepted}

**Alternatives Considered:**
- {Alternative 1}: Rejected because {reason}
- {Alternative 2}: Rejected because {reason}

### Decision 2: {Title}

{Same structure as above}

## Observed Patterns

<!-- Patterns discovered during execution. Decay: verified >30d = stale, excluded from planner context. -->

- **[Pattern name]**: [What it does and when to use it]. Files: `path/to/file.ts`. Verified: {YYYY-MM-DD}

## Dependencies

**Internal:**
- CAP-DB: User model for token payload
- CAP-CACHE: Redis for refresh token storage

**External:**
- `jsonwebtoken`: Token generation
- `bcrypt`: Password hashing

## Common Tasks

### Add new protected endpoint

1. Import auth middleware from `src/auth/middleware.ts`
2. Apply to route: `router.get('/path', authMiddleware, handler)`
3. Access user via `req.user`

### Change token expiration

1. Update `ACCESS_TOKEN_TTL` in `src/config/auth.ts`
2. No migration needed (new tokens use new TTL)

### Add new role

1. Add role to `UserRole` enum in `src/types/user.ts`
2. Update permission matrix in `src/auth/permissions.ts`
3. Add role check where needed

## Known Issues

- [ ] Refresh token rotation not yet implemented
- [ ] No token revocation mechanism

## Related Chapters

- CAP-API: Uses auth middleware
- CAP-DB: User model definition
- CAP-CACHE: Refresh token storage

## History

| Date | Change | Phase |
|------|--------|-------|
| {date} | Initial auth implementation | Phase 2 |
| {date} | Added refresh tokens | Phase 3 |
| {date} | Added role-based access | Phase 5 |
```

---

## Chapter Domains

| ID | Domain | Typical Content |
|----|--------|-----------------|
| CAP-AUTH | Authentication | Login, tokens, sessions, permissions |
| CAP-API | API Layer | Endpoints, middleware, validation |
| CAP-DB | Database | Models, queries, migrations |
| CAP-CACHE | Caching | Redis, in-memory, invalidation |
| CAP-STORAGE | File Storage | Uploads, S3, CDN |
| CAP-ASYNC | Async Processing | Queues, workers, events |
| CAP-UI | User Interface | Components, state, routing |
| CAP-ERR | Error Handling | Exceptions, logging, alerts |
| CAP-CONFIG | Configuration | Environment, feature flags |
| CAP-DEPLOY | Deployment | CI/CD, infrastructure |
| CAP-TEST | Testing | Setup, patterns, fixtures |
| CAP-OBS | Observability | Monitoring, tracing, metrics |

## Size Guidelines

- **Target:** 100-200 lines per chapter
- **Maximum:** 300 lines (split if larger)
- **Minimum:** 50 lines (merge if smaller)

## Update Triggers

Update chapter when:
- Key file is modified
- New decision affects this domain
- Pattern is added/changed
- Configuration changes
- New dependency added

## Integration

Chapters are updated by `/ink:execute-plan` after each task:
1. Detect which chapters affected (by file paths)
2. Load current chapter content
3. Update relevant sections
4. Save with new `updated` timestamp
