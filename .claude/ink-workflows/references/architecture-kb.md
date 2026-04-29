# Architecture Knowledge Base

## Purpose

Guide architectural decisions based on domain-specific considerations. This knowledge base helps avoid common production issues by asking the right questions early.

---

## Storage Decisions

### When Triggered
Keywords: `storage`, `file`, `upload`, `save`, `persist`, `image`, `document`, `attachment`

### Questions to Ask

| Question | Why It Matters |
|----------|----------------|
| How many files expected? | <100: any solution works. >10K: need scalable storage |
| Max file size? | >10MB: need streaming upload. >100MB: need chunked upload |
| Multiple server instances? | Yes: MUST use shared storage (S3, etc.), NOT local filesystem |
| Files need processing? | Yes: consider async processing queue |
| Public or private access? | Public: CDN. Private: signed URLs |
| Retention policy? | Need cleanup job or lifecycle rules |

### Decision Matrix

| Scenario | Recommended | Avoid |
|----------|-------------|-------|
| Single instance, small files | Local filesystem | - |
| Multiple instances | S3/Cloud storage | Local filesystem |
| Large files (>50MB) | S3 with multipart | Direct upload |
| Public static assets | CDN + S3 | Local + nginx |
| User uploads, private | S3 + signed URLs | Public bucket |

### Anti-Patterns
- ❌ Local filesystem with load balancer (files on wrong server)
- ❌ Database for large files (BLOB > 1MB)
- ❌ Public bucket for private data
- ❌ No size limits (DoS vector)

---

## Caching Decisions

### When Triggered
Keywords: `cache`, `redis`, `memcache`, `rate limit`, `session`, `fast`, `performance`

### Questions to Ask

| Question | Why It Matters |
|----------|----------------|
| Multiple server instances? | Yes: need distributed cache (Redis). No: in-memory OK |
| What's being cached? | Sessions: need persistence. API responses: can be volatile |
| Cache invalidation strategy? | TTL only? Event-based? Manual? |
| Data consistency requirement? | Strong: avoid caching. Eventual: cache freely |
| Size of cached data? | >100MB: need eviction policy |

### Decision Matrix

| Scenario | Recommended | Avoid |
|----------|-------------|-------|
| Single instance, simple | In-memory (lru-cache) | Redis (overkill) |
| Multiple instances | Redis | In-memory (inconsistent) |
| Session storage | Redis with persistence | In-memory (lost on restart) |
| API response cache | Redis or CDN | Database (slow) |
| Rate limiting | Redis (atomic counters) | In-memory (per-instance) |

### Anti-Patterns
- ❌ In-memory cache with multiple instances (each has different data)
- ❌ Caching user-specific data without user key (data leak)
- ❌ No TTL (stale data forever)
- ❌ Caching database primary keys only (N+1 on cache miss)

---

## Async Processing Decisions

### When Triggered
Keywords: `async`, `queue`, `job`, `worker`, `background`, `event`, `webhook`, `email`, `notification`

### Questions to Ask

| Question | Why It Matters |
|----------|----------------|
| Can operation fail? | Yes: need retry logic |
| What if job runs twice? | Must be idempotent |
| How long does it take? | >30s: definitely async. <5s: maybe sync |
| Order matters? | Yes: FIFO queue. No: parallel workers |
| What if job fails permanently? | Need dead letter queue + alerting |
| Need to track progress? | Job status tracking system |

### Decision Matrix

| Scenario | Recommended | Avoid |
|----------|-------------|-------|
| <5s, low volume | Synchronous | Queue (overkill) |
| >30s or high volume | Queue (BullMQ, Celery) | Synchronous (timeout) |
| Order critical | FIFO queue | Parallel workers |
| Fire-and-forget | Queue without result | Synchronous |
| Need result | Queue with callback/polling | Fire-and-forget |

### Anti-Patterns
- ❌ Non-idempotent jobs (duplicates cause problems)
- ❌ No timeout on jobs (hangs forever)
- ❌ No dead letter queue (failures disappear)
- ❌ Synchronous in request for >5s operations (timeout)

---

## Authentication Decisions

### When Triggered
Keywords: `auth`, `login`, `jwt`, `oauth`, `session`, `token`, `permission`, `role`

### Questions to Ask

| Question | Why It Matters |
|----------|----------------|
| Multiple server instances? | Yes: stateless (JWT) preferred |
| Need immediate revocation? | Yes: session-based or token blacklist |
| Mobile app client? | Yes: refresh tokens essential |
| Third-party login? | Yes: OAuth2 integration |
| Microservices? | Yes: JWT for service-to-service |

### Decision Matrix

| Scenario | Recommended | Avoid |
|----------|-------------|-------|
| Single instance web app | Session-based | JWT (overkill) |
| Multiple instances, API | JWT with short expiry | Server sessions |
| Mobile + Web clients | JWT + refresh tokens | Session cookies |
| Need instant logout | Redis session store | Pure JWT |
| Microservices | JWT for inter-service | Shared sessions |

### Anti-Patterns
- ❌ Long-lived JWT without refresh (can't revoke)
- ❌ JWT in localStorage (XSS vulnerable)
- ❌ Session without CSRF protection
- ❌ Plain text password storage
- ❌ No rate limiting on login (brute force)

---

## Database Decisions

### When Triggered
Keywords: `database`, `query`, `model`, `schema`, `transaction`, `migration`, `index`

### Questions to Ask

| Question | Why It Matters |
|----------|----------------|
| Expected data volume? | >1M rows: need indexing strategy |
| Read vs write ratio? | Read-heavy: consider read replicas |
| Complex relationships? | Yes: relational. No: maybe NoSQL |
| Need transactions? | Yes: PostgreSQL/MySQL. Maybe: MongoDB with care |
| Geographic distribution? | Yes: consider distributed DB |

### Decision Matrix

| Scenario | Recommended | Avoid |
|----------|-------------|-------|
| CRUD with relationships | PostgreSQL/MySQL | MongoDB |
| High write, simple structure | MongoDB/DynamoDB | Complex joins |
| Time series data | TimescaleDB/InfluxDB | Regular RDBMS |
| Full text search | Elasticsearch + primary DB | LIKE queries |
| Cache layer | Redis | Extra DB queries |

### Anti-Patterns
- ❌ N+1 queries (loop with query inside)
- ❌ No indexes on filtered columns
- ❌ SELECT * in production
- ❌ No connection pooling
- ❌ Long transactions holding locks

---

## API Design Decisions

### When Triggered
Keywords: `api`, `endpoint`, `rest`, `graphql`, `response`, `request`, `versioning`

### Questions to Ask

| Question | Why It Matters |
|----------|----------------|
| Public or internal API? | Public: stricter validation, versioning |
| Expected request volume? | High: rate limiting essential |
| Data shape varies? | Yes: GraphQL. No: REST |
| Long-running operations? | Yes: async + polling/webhooks |
| Backward compatibility? | Yes: versioning strategy |

### Decision Matrix

| Scenario | Recommended | Avoid |
|----------|-------------|-------|
| Simple CRUD, internal | REST | GraphQL (overkill) |
| Complex queries, many clients | GraphQL | Multiple REST endpoints |
| Public API | REST + versioning | Breaking changes |
| Real-time updates | WebSocket or SSE | Polling |
| File uploads | Multipart form | Base64 in JSON |

### Anti-Patterns
- ❌ No input validation (security risk)
- ❌ No rate limiting (DoS risk)
- ❌ Exposing internal IDs (information leak)
- ❌ No pagination on list endpoints (memory bomb)
- ❌ Returning full objects when partial needed

---

## Integration Checklist

When reviewing architectural decisions:

1. **Single vs Multiple Instances?** - Affects storage, caching, sessions
2. **Data Volume?** - Affects database, pagination, async
3. **Security Sensitivity?** - Affects auth, encryption, logging
4. **Failure Tolerance?** - Affects retries, fallbacks, monitoring
5. **Performance Requirements?** - Affects caching, indexing, async

---

## Quick Reference Card

| Domain | Key Question | Red Flag |
|--------|--------------|----------|
| Storage | Multiple instances? | Local filesystem |
| Cache | Shared across instances? | In-memory only |
| Async | Idempotent? | No retry logic |
| Auth | Revocation needed? | Long-lived JWT only |
| Database | Volume? | No indexes |
| API | Public? | No rate limiting |
