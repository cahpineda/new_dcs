# Research Template

Template for `.planning/phases/XX-name/{phase}-RESEARCH.md` - ecosystem research before planning.

**Purpose:** Document what Claude needs to implement a phase well - not just "which library" but "how experts build this."

---

## File Template

```markdown
# Phase [X]: [Name] - Research

**Researched:** [date]
**Domain:** [technology/problem domain]
**Confidence:** [HIGH/MEDIUM/LOW]

## Summary

[2-3 paragraph executive summary]
- What was researched
- Standard approach
- Key recommendations

**Primary recommendation:** [one-liner actionable guidance]

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| [name] | [ver] | [what it does] | [why experts use it] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| [name] | [ver] | [what it does] | [use case] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| [standard] | [alternative] | [when alternative makes sense] |

**Installation:**
```bash
npm install [packages]
```

## Architecture Patterns

### Project Structure
```
src/
├── [folder]/        # [purpose]
└── [folder]/        # [purpose]
```

### Pattern: [Name]
**What:** [description]
**When:** [conditions]
```typescript
// [minimal code example]
```

### Anti-Patterns
- **[Anti-pattern]:** [why bad, what instead]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| [problem] | [what you'd build] | [library] | [edge cases] |

**Key insight:** [why custom solutions are worse]

## Common Pitfalls

### [Pitfall Name]
- **What:** [description]
- **Why:** [root cause]
- **Avoid:** [prevention]
- **Signs:** [detection]

## Code Examples

### [Operation Name]
```typescript
// Source: [official docs]
[minimal code]
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| [old] | [new] | [what it means] |

## Open Questions

1. **[Question]** - What we know: [partial]. Recommendation: [how to handle]

## Sources

- **HIGH:** [Context7/official docs] - [topics]
- **MEDIUM:** [verified findings]
- **LOW:** [needs validation]

## Metadata

- **Scope:** [technology, ecosystem, patterns]
- **Confidence:** [breakdown by section]
- **Valid until:** [estimate]

---
*Phase: XX-name | Research completed: [date] | Ready for planning: [yes/no]*
```

---

## Guidelines

**When to create:**
- Before planning phases in niche/complex domains
- When Claude's training data is stale or sparse
- When "how do experts do this" matters

**Required sections:** Summary, Standard Stack, Architecture, Don't Hand-Roll, Pitfalls, Code Examples, Sources

**Content quality:**
- Standard stack: Specific versions
- Architecture: Code from authoritative sources
- Don't hand-roll: Explicit about what NOT to build
- Pitfalls: Include warning signs
- Sources: Mark confidence levels

**Integration:**
- RESEARCH.md loaded as @context in PLAN.md
- Standard stack informs library choices
- Pitfalls inform verification criteria

**Location:** `.planning/phases/XX-name/{phase}-RESEARCH.md`
