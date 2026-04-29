# Models & Schema Template

Template for `.planning/codebase/MODELS.md` - captures database schema, entities, and data structures.

**Purpose:** Document database tables, model definitions, and field types to PREVENT HALLUCINATED FIELD NAMES during SQL/database tasks. This is the anti-hallucination checkpoint.

---

## File Template

```markdown
# Models & Database Schema

**Analysis Date:** [YYYY-MM-DD]
**Schema Source:** [e.g., "prisma/schema.prisma", "src/models/*.ts", "migrations/*.sql"]

## Overview

**Database Type:** [e.g., "PostgreSQL", "MongoDB", "MySQL", "SQLite"]
**ORM/Client:** [e.g., "Prisma", "TypeORM", "Drizzle", "Mongoose", "Raw SQL"]
**Schema Location:** [file path(s) where schema is defined]

## Tables/Collections

| Name | Purpose | Key Fields |
|------|---------|------------|
| [table_name] | [brief description] | [important fields] |

## Detailed Schema

### [table_name]

**File:** `[path/to/model/definition]`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | [type] | PK | Primary key |
| [field] | [type] | [constraints] | [description] |

**Indexes:**
- [index_name]: [fields] ([type: unique/btree/etc])

**Relations:**
- [relation description]

### [next_table_name]

[Repeat structure for each table...]

## Relationships

**One-to-Many:**
- `[parent.id]` → `[child.parent_id]` - [description]

**Many-to-Many:**
- `[table_a]` ↔ `[table_b]` via `[junction_table]`

**One-to-One:**
- `[table_a.id]` ↔ `[table_b.id]`

## Enums/Types

| Name | Values | Used In |
|------|--------|---------|
| [enum_name] | [value1, value2, ...] | [table.field] |

## Common Queries

**Frequent patterns found in codebase:**
- [Query pattern 1: e.g., "Find user by email"]
- [Query pattern 2: e.g., "Get orders with user join"]

---

*Schema analysis: [date]*
*Update after any migration or model change*
```

<good_examples>
```markdown
# Models & Database Schema

**Analysis Date:** 2025-01-20
**Schema Source:** `prisma/schema.prisma`

## Overview

**Database Type:** PostgreSQL
**ORM/Client:** Prisma 5.x
**Schema Location:** `prisma/schema.prisma`

## Tables/Collections

| Name | Purpose | Key Fields |
|------|---------|------------|
| users | User accounts | id, email, name, role |
| orders | Purchase orders | id, userId, total, status |
| products | Product catalog | id, name, price, stock |
| order_items | Order line items | id, orderId, productId, quantity |

## Detailed Schema

### users

**File:** `prisma/schema.prisma:12`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT uuid() | Primary key |
| email | varchar(255) | UNIQUE, NOT NULL | User email address |
| name | varchar(100) | NOT NULL | Display name |
| passwordHash | varchar(255) | NOT NULL | Bcrypt hashed password |
| role | enum(UserRole) | DEFAULT 'USER' | User permission level |
| createdAt | timestamp | DEFAULT now() | Account creation time |
| updatedAt | timestamp | AUTO UPDATE | Last modification time |

**Indexes:**
- `users_email_key`: email (unique)
- `users_role_idx`: role (btree)

**Relations:**
- Has many `orders`

### orders

**File:** `prisma/schema.prisma:28`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK | Primary key |
| userId | uuid | FK(users.id), NOT NULL | Order owner |
| total | decimal(10,2) | NOT NULL | Order total amount |
| status | enum(OrderStatus) | DEFAULT 'PENDING' | Order state |
| shippingAddress | jsonb | NULL | Delivery address |
| createdAt | timestamp | DEFAULT now() | Order creation time |

**Indexes:**
- `orders_userId_idx`: userId (btree)
- `orders_status_idx`: status (btree)

**Relations:**
- Belongs to `users` via userId
- Has many `order_items`

### products

**File:** `prisma/schema.prisma:45`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK | Primary key |
| name | varchar(200) | NOT NULL | Product name |
| description | text | NULL | Product description |
| price | decimal(10,2) | NOT NULL | Unit price |
| stock | integer | DEFAULT 0 | Available quantity |
| sku | varchar(50) | UNIQUE | Stock keeping unit |

**Indexes:**
- `products_sku_key`: sku (unique)
- `products_name_idx`: name (btree, for search)

### order_items

**File:** `prisma/schema.prisma:58`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK | Primary key |
| orderId | uuid | FK(orders.id), NOT NULL | Parent order |
| productId | uuid | FK(products.id), NOT NULL | Product ordered |
| quantity | integer | NOT NULL, CHECK > 0 | Units ordered |
| unitPrice | decimal(10,2) | NOT NULL | Price at time of order |

**Relations:**
- Belongs to `orders` via orderId
- Belongs to `products` via productId

## Relationships

**One-to-Many:**
- `users.id` → `orders.userId` - User has many orders
- `orders.id` → `order_items.orderId` - Order has many line items

**Many-to-Many:**
- `orders` ↔ `products` via `order_items`

## Enums/Types

| Name | Values | Used In |
|------|--------|---------|
| UserRole | USER, ADMIN, MODERATOR | users.role |
| OrderStatus | PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED | orders.status |

## Common Queries

**Frequent patterns found in codebase:**
- Find user by email: `SELECT * FROM users WHERE email = ?`
- Get user orders with items: `users → orders → order_items → products` join
- Update stock after order: `UPDATE products SET stock = stock - ? WHERE id = ?`
- Calculate order total: `SUM(order_items.quantity * order_items.unitPrice)`

---

*Schema analysis: 2025-01-20*
*Update after any migration or model change*
```
</good_examples>

<guidelines>
**What belongs in MODELS.md:**
- All database tables/collections with their fields
- Field types, constraints, and descriptions
- Primary keys, foreign keys, indexes
- Relationships between tables
- Enums and custom types
- Common query patterns

**What does NOT belong here:**
- Application logic (that's in code)
- API endpoints (that's ARCHITECTURE.md)
- Business rules (defer to code comments)
- Historical migrations (just current state)

**When filling this template:**
- Check schema files first (Prisma, TypeORM entities, SQL migrations)
- Include ALL fields - this prevents hallucination
- Note exact field names (case matters: `userId` vs `user_id`)
- Include constraints (they affect queries)
- Document relationships for join queries

**Critical for preventing hallucination:**
- Before ANY SQL task, executor MUST verify fields exist here
- If field not in MODELS.md, executor cannot assume it exists
- Plan Checker (Dimension 7) validates SQL against this doc

**Useful for phase planning when:**
- Adding database queries (know exact field names)
- Creating migrations (understand current schema)
- Building API endpoints (know data shape)
- Writing joins (understand relationships)
</guidelines>
