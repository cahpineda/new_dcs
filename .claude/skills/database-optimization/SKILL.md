---
name: database-optimization
description: Database performance optimization techniques. Use when working with slow queries, indexing, N+1 problems, or database performance issues.
disable-model-invocation: false
---

# Database Optimization

Common database performance optimizations and best practices.

## Indexing

### When to Index
- Columns in WHERE clauses
- Columns in JOIN conditions
- Columns in ORDER BY
- Columns in GROUP BY
- Foreign keys

### Types of Indexes
```sql
-- Single column
CREATE INDEX idx_users_email ON users(email);

-- Composite (order matters!)
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);

-- Unique
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Partial (PostgreSQL)
CREATE INDEX idx_active_users ON users(email) WHERE active = true;
```

### Index Trade-offs
- ✅ Faster SELECT queries
- ❌ Slower INSERT/UPDATE/DELETE
- ❌ More storage space

## N+1 Query Problem

### Problem
```javascript
// ❌ N+1 queries
const users = await User.findAll(); // 1 query
for (const user of users) {
  const orders = await Order.findByUserId(user.id); // N queries
}
```

### Solution 1: Eager Loading
```javascript
// ✅ 2 queries total
const users = await User.findAll({
  include: [{ model: Order }]
});
```

### Solution 2: Batch Loading
```javascript
// ✅ 2 queries total
const users = await User.findAll();
const userIds = users.map(u => u.id);
const orders = await Order.findAll({ where: { userId: userIds } });
```

## Query Optimization

### Use EXPLAIN
```sql
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE user_id = 123 AND created_at > '2024-01-01';
```

### Select Only Needed Columns
```sql
-- ❌ Bad
SELECT * FROM users;

-- ✅ Good
SELECT id, name, email FROM users;
```

### Avoid Functions in WHERE
```sql
-- ❌ Slow (no index usage)
WHERE YEAR(created_at) = 2024

-- ✅ Fast (uses index)
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'
```

### Use Proper JOIN Types
```sql
-- INNER JOIN (fastest, most common)
-- LEFT JOIN (when you need all left rows)
-- RIGHT JOIN (rare, consider reversing)
-- FULL OUTER JOIN (slowest, avoid if possible)
```

## Connection Pooling

```javascript
// ✅ Use connection pooling
const pool = new Pool({
  max: 20,              // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Caching Strategies

### Application-Level Cache
```javascript
const cache = new Map();

async function getUser(id) {
  if (cache.has(id)) return cache.get(id);

  const user = await User.findById(id);
  cache.set(id, user);
  return user;
}
```

### Redis Cache
```javascript
async function getUser(id) {
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);

  const user = await User.findById(id);
  await redis.setex(`user:${id}`, 3600, JSON.stringify(user));
  return user;
}
```

## Pagination

### Offset-Based (Simple)
```sql
SELECT * FROM products
ORDER BY created_at DESC
LIMIT 20 OFFSET 40;
```

### Cursor-Based (Better for Large Datasets)
```sql
SELECT * FROM products
WHERE id > :last_id
ORDER BY id
LIMIT 20;
```

## Denormalization

Trade consistency for performance in read-heavy scenarios.

```sql
-- Instead of joining every time
SELECT o.*, u.name as user_name
FROM orders o
JOIN users u ON o.user_id = u.id;

-- Denormalize
ALTER TABLE orders ADD COLUMN user_name VARCHAR(255);
-- Update when user name changes
```

## Batch Operations

```javascript
// ❌ Multiple queries
for (const item of items) {
  await Item.create(item);
}

// ✅ Single query
await Item.bulkCreate(items);
```

## Monitoring

### Key Metrics
- Query execution time
- Connection pool usage
- Cache hit rate
- Slow query log
- Index usage statistics

### Tools
- PostgreSQL: pg_stat_statements
- MySQL: slow query log
- Monitoring: Datadog, New Relic
- Profiling: EXPLAIN ANALYZE

## Best Practices

1. Add indexes on frequently queried columns
2. Avoid SELECT *
3. Use connection pooling
4. Implement caching layer
5. Batch operations when possible
6. Monitor slow queries
7. Use proper data types
8. Normalize first, denormalize selectively
9. Use database-specific optimizations
10. Profile before optimizing
