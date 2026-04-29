# POC Patterns Reference

## Purpose

Define the minimal viable test for each type of task to validate concepts before production implementation.

---

## POC by Domain

### Business Logic / Functions

**Objective:** Validate algorithm or transformation works correctly.

**Environment:** REPL or standalone script

**Pattern:**
```python
# POC: Discount calculator
def calculate_discount(price, discount_percent):
    return price * (1 - discount_percent / 100)

# Quick test
assert calculate_discount(100, 10) == 90
assert calculate_discount(50, 20) == 40
print("POC PASS")
```

**Success Criteria:**
- Function returns expected output for 2-3 test cases
- Edge cases identified (zero, negative, boundary values)

---

### API Endpoint

**Objective:** Validate request/response flow works.

**Environment:** TestClient (FastAPI) or supertest (Express)

**Pattern:**
```python
# POC: User creation endpoint
from fastapi.testclient import TestClient

def test_create_user_poc():
    response = client.post("/users", json={"email": "test@test.com"})
    assert response.status_code == 201
    assert "id" in response.json()
    print("POC PASS")
```

**Success Criteria:**
- Endpoint responds with correct status
- Response shape matches expectation
- Basic happy path works

---

### Database Query

**Objective:** Validate query returns expected data shape.

**Environment:** SQLite in-memory or test database

**Pattern:**
```python
# POC: Complex aggregation query
import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE orders (id INT, total DECIMAL, status TEXT)")
conn.execute("INSERT INTO orders VALUES (1, 100, 'completed'), (2, 50, 'pending')")

result = conn.execute("""
    SELECT status, SUM(total) as total
    FROM orders
    GROUP BY status
""").fetchall()

assert len(result) == 2
print("POC PASS:", result)
```

**Success Criteria:**
- Query executes without error
- Result shape matches expectation
- Performance acceptable (for large datasets)

---

### External API Integration

**Objective:** Validate we can communicate with external service.

**Environment:** Mock server or sandbox API

**Pattern:**
```python
# POC: Stripe payment intent
import requests
from unittest.mock import patch

def create_payment_intent(amount):
    # Real implementation would call Stripe
    response = requests.post("https://api.stripe.com/v1/payment_intents", ...)
    return response.json()

# Mock for POC
with patch('requests.post') as mock_post:
    mock_post.return_value.json.return_value = {"id": "pi_123", "status": "succeeded"}
    result = create_payment_intent(1000)
    assert result["status"] == "succeeded"
    print("POC PASS")
```

**Success Criteria:**
- Can construct valid request
- Can parse response
- Error cases identified

---

### File Processing

**Objective:** Validate file read/write/transform works.

**Environment:** Temp directory with test files

**Pattern:**
```python
# POC: CSV processing
import tempfile
import csv

with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
    writer = csv.writer(f)
    writer.writerow(['name', 'age'])
    writer.writerow(['Alice', 30])
    temp_path = f.name

# Read and transform
with open(temp_path) as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    assert rows[0]['name'] == 'Alice'
    print("POC PASS")
```

**Success Criteria:**
- Can read file format
- Can parse content correctly
- Can write output format

---

### Background Job / Async Processing

**Objective:** Validate job execution flow works.

**Environment:** Synchronous simulation

**Pattern:**
```python
# POC: Email notification job
def send_notification_job(user_id, message):
    # Simulate job logic
    user = {"id": user_id, "email": "test@test.com"}  # Mock DB lookup
    email_sent = True  # Mock email send
    return {"user_id": user_id, "sent": email_sent}

result = send_notification_job(123, "Hello")
assert result["sent"] == True
print("POC PASS")
```

**Success Criteria:**
- Job logic executes correctly
- Idempotency verified (run twice, same result)
- Failure handling identified

---

### UI Component (Visual)

**Objective:** Validate component renders correctly.

**Environment:** Storybook or isolated render test

**Pattern:**
```typescript
// POC: Button component
import { render, screen } from '@testing-library/react'

function Button({ label }: { label: string }) {
  return <button>{label}</button>
}

test('POC: button renders', () => {
  render(<Button label="Click me" />)
  expect(screen.getByText('Click me')).toBeInTheDocument()
  console.log('POC PASS')
})
```

**Success Criteria:**
- Component renders without error
- Basic props work
- Visual appearance acceptable (manual check)

---

### Authentication Flow

**Objective:** Validate auth mechanism works.

**Environment:** Test tokens, mock identity provider

**Pattern:**
```python
# POC: JWT validation
import jwt

SECRET = "test-secret"
token = jwt.encode({"user_id": 123, "exp": 9999999999}, SECRET)

# Validate
decoded = jwt.decode(token, SECRET, algorithms=["HS256"])
assert decoded["user_id"] == 123
print("POC PASS")
```

**Success Criteria:**
- Can generate valid token
- Can validate token
- Expiration works correctly

---

### Caching

**Objective:** Validate cache hit/miss behavior.

**Environment:** In-memory dict or local Redis

**Pattern:**
```python
# POC: Simple cache
cache = {}

def get_with_cache(key, fetch_fn):
    if key in cache:
        print("Cache HIT")
        return cache[key]
    print("Cache MISS")
    value = fetch_fn()
    cache[key] = value
    return value

# Test
result1 = get_with_cache("user:1", lambda: {"id": 1, "name": "Alice"})  # MISS
result2 = get_with_cache("user:1", lambda: {"id": 1, "name": "Alice"})  # HIT
assert result1 == result2
print("POC PASS")
```

**Success Criteria:**
- Cache stores value correctly
- Cache returns stored value
- Invalidation logic identified

---

## When to Skip POC

**Skip POC when:**
- Complexity is Simple (score 0-5)
- Pattern exists and is proven
- Change is trivial (config, typo, styling)
- No new logic, just wiring

**Never skip POC when:**
- Complexity is Complex (score 13+)
- External integration involved
- Performance is critical
- Security is involved
- Algorithm is non-trivial

---

## POC Failure Handling

**If POC fails:**

1. **Document the failure**
   - What was tried
   - Why it failed
   - What was learned

2. **Revise approach**
   - Different library?
   - Different algorithm?
   - Different architecture?

3. **Do NOT proceed**
   - Never write production code for a failed POC
   - A failed POC saved hours of wasted work

4. **Escalate if needed**
   - Complex POC failures may need architecture review
   - Consider `/ink:discuss-phase` to revisit approach

---

## Integration with PLAN.md

Each task with POC should include:

```markdown
### Task 2: Implement rate limiting

**Complexity:** Medium (score: 8)
**POC Required:** Yes

<poc>
**Hypothesis:** Redis INCR with EXPIRE provides atomic rate limiting.

**Minimal test:**
```python
import redis
r = redis.Redis()
key = "rate:user:123"
count = r.incr(key)
if count == 1:
    r.expire(key, 60)
assert count <= 10  # Rate limit
print("POC PASS")
```

**Success:** Counter increments atomically, expires after 60s.
</poc>

<action>
Only after POC passes:
1. Create RateLimiter class
2. Add error handling
3. Add logging
4. Integrate with middleware
</action>
```
