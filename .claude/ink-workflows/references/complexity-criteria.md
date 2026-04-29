# Complexity Criteria Reference

## Purpose

Evaluate task complexity BEFORE planning to determine:
- Whether POC is needed
- Whether to search for existing patterns
- Whether architecture review is required
- How many subtasks are appropriate

## Quick Classification

### Simple Tasks

**Characteristics:**
- Single file change
- Pattern already exists in codebase (copy-paste-modify)
- No external services involved
- Requirements are crystal clear
- Estimated: <30 lines of code

**Examples:**
- Add a new field to existing model
- Create endpoint following existing pattern
- Fix typo or simple bug
- Add validation to existing form
- Update configuration value

**Action:** Proceed directly to implementation. No POC needed.

---

### Medium Tasks

**Characteristics:**
- 2-3 files modified
- Adapting existing pattern to new use case
- One external integration (database query, API call)
- Some requirements need clarification
- Estimated: 30-150 lines of code

**Examples:**
- Add new entity with CRUD operations
- Integrate with external API (single endpoint)
- Add authentication to existing routes
- Create new service using existing patterns
- Refactor function to handle new cases

**Action:** Search for patterns first. POC recommended for uncertain parts.

---

### Complex Tasks

**Characteristics:**
- 4+ files modified
- New abstraction or pattern required
- Multiple external integrations
- Significant unknowns or uncertainty
- Performance or security critical
- Estimated: 150+ lines of code

**Examples:**
- Implement new payment system
- Add real-time features (WebSockets)
- Create new caching layer
- Implement complex business logic
- Add multi-tenancy support
- Build background job system

**Action:** POC required. Architecture review required. Pattern search required.

---

## Scoring System

| Indicator | Points | Category |
|-----------|--------|----------|
| Single file | 1 | Simple |
| Known pattern | 1 | Simple |
| No external integration | 1 | Simple |
| No new dependencies | 1 | Simple |
| Clear requirements | 1 | Simple |
| 2-3 files | 2 | Medium |
| Adapt pattern | 2 | Medium |
| One integration | 2 | Medium |
| One dependency | 2 | Medium |
| Some clarification needed | 2 | Medium |
| 4+ files | 3 | Complex |
| New abstraction | 3 | Complex |
| Multiple integrations | 3 | Complex |
| Multiple dependencies | 3 | Complex |
| Significant unknowns | 3 | Complex |
| Performance critical | 3 | Complex |
| Security sensitive | 3 | Complex |

**Scoring:**
- 0-5 points: Simple
- 6-12 points: Medium
- 13+ points: Complex

---

## Decision Matrix

| Complexity | POC | Pattern Search | Arch Review | Subtasks |
|------------|-----|----------------|-------------|----------|
| Simple | No | Optional | No | 1 |
| Medium | Recommended | Yes | No | 2-3 |
| Complex | Required | Required | Required | 3+ |

---

## Red Flags (Auto-Complex)

These indicators automatically classify a task as Complex:

1. **"I'm not sure how..."** - Uncertainty = Complex
2. **"This might affect..."** - Ripple effects = Complex
3. **"We've never done..."** - No precedent = Complex
4. **"Performance is critical..."** - Optimization = Complex
5. **"Security is important..."** - Security = Complex
6. **"Multiple services need..."** - Coordination = Complex

---

## Common Mistakes

### Underestimating Complexity

**Wrong:** "It's just adding a button"
**Reality:** Button triggers API call, needs loading state, error handling, success feedback, possibly optimistic updates.

**Wrong:** "It's just a simple query"
**Reality:** Query needs indexing, pagination, caching consideration, N+1 prevention.

**Wrong:** "It's similar to what we have"
**Reality:** Similar but different context, edge cases, requirements.

### Overestimating Complexity

**Wrong:** "This is complex because it's new to me"
**Reality:** New to you ≠ Complex. Check if pattern exists.

**Wrong:** "This touches many files"
**Reality:** Many files but same pattern = Medium, not Complex.

---

## Integration with Workflow

```
/ink:plan-phase N
    │
    ▼
┌─────────────────────┐
│ Evaluate Complexity │ ◄── Use this reference
└─────────────────────┘
    │
    ├── Simple ──► Direct planning
    │
    ├── Medium ──► Search patterns ──► Plan with POC (optional)
    │
    └── Complex ─► Search patterns ─► Arch review ─► Plan with POC (required)
```

---

## Example Evaluation

**Task:** "Add user profile image upload"

**Checklist:**
- [ ] Single file? No (controller, service, storage, model) = 3 points
- [x] Known pattern? No upload pattern exists = 0 points
- [ ] No external integration? S3/storage needed = 3 points
- [ ] No new dependencies? Need storage SDK = 2 points
- [ ] Clear requirements? Size limits? Formats? = 2 points

**Score:** 10 points → **Medium** (but borderline Complex)

**Decision:** POC for upload flow, search for storage patterns, consider architecture review for storage choice.
