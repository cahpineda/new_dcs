# Common Guidelines

This file contains common guidelines extracted from multiple workflows to reduce duplication and enable lazy loading.

**Reference:** See individual workflows for context on when to apply these guidelines.

---

## Table of Contents

- [Design Principles](#design-principles)
- [Naming Conventions](#naming-conventions)
- [Format Standards](#format-standards)
- [Best Practices](#best-practices)
- [Anti-Patterns](#anti-patterns)

---

## Design Principles

### Secure by Design

**Used in:** plan-phase.md, execute-plan-core.md, validate-decisions.md

**Principle:** Assume hostile input on every boundary. Validate, parameterize, authenticate, fail closed.

**Application:**
- Always validate input at boundaries (API endpoints, file uploads, user input)
- Use parameterized queries for database operations
- Implement authentication and authorization checks
- Fail securely (deny by default, require explicit allow)

### Performance by Design

**Used in:** plan-phase.md, execute-plan-core.md, validate-decisions.md

**Principle:** Assume production load, not demo conditions. Plan for efficient data access, appropriate caching, minimal round trips.

**Application:**
- Design for expected production load, not just development
- Plan for efficient database queries (indexes, batch operations)
- Consider caching strategies early
- Minimize API round trips and data transfer

### Observable by Design

**Used in:** plan-phase.md, execute-plan-core.md, debug.md

**Principle:** Plan to debug your own work. Include meaningful error messages, appropriate logging, and clear failure states.

**Application:**
- Include meaningful error messages that help debugging
- Add appropriate logging at key decision points
- Design clear failure states (don't fail silently)
- Make debugging information accessible

---

## Naming Conventions

### File Naming

**Used in:** plan-phase.md, execute-plan-core.md, map-codebase.md

- **Plans:** `{phase}-{plan}-PLAN.md` (e.g., `01-01-PLAN.md`)
- **Summaries:** `{phase}-{plan}-SUMMARY.md` (e.g., `01-01-SUMMARY.md`)
- **Research:** `{phase}-RESEARCH.md` (e.g., `01-RESEARCH.md`)
- **Context:** `{phase}-CONTEXT.md` (e.g., `01-CONTEXT.md`)
- **Discovery:** `DISCOVERY.md` (in phase directory)

### Phase Numbering

**Used in:** plan-phase.md, create-roadmap.md

- **Integer phases:** Planned milestone work (1, 2, 3)
- **Decimal phases:** Urgent insertions between integers (2.1, 2.2)
- **Rules:**
  - Decimals between consecutive integers (2.1 between 2 and 3)
  - Filesystem sorting works automatically (2 < 2.1 < 2.2 < 3)
  - Directory format: `02.1-description/`
  - Plan format: `02.1-01-PLAN.md`
  - Validation: Integer X must exist and be complete, X+1 must exist, decimal X.Y must not exist, Y >= 1

### Commit Message Format

**Used in:** execute-plan-commits.md, execute-plan-core.md

**Format:** `{type}({phase}-{plan}): {task-name-or-description}`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `test` - Test-only changes
- `refactor` - Code cleanup
- `perf` - Performance improvement
- `docs` - Documentation changes
- `style` - Formatting fixes
- `chore` - Config/tooling changes

---

## Format Standards

### XML Task Format

**Used in:** plan-phase.md, execute-plan-core.md

```xml
<task type="auto">
  <name>Task Name</name>
  <complexity>simple|medium|complex</complexity>
  <files>file1.md, file2.md</files>
  <action>
    Specific implementation steps
  </action>
  <verify>
    Verification steps
  </verify>
  <done>
    Acceptance criteria
  </done>
</task>
```

### YAML Frontmatter Format

**Used in:** plan-phase.md, execute-plan-core.md

```yaml
---
phase: XX-name
plan: NN
type: execute|tdd
depends_on: []
files_modified: []
complexity:
  level: simple|medium|complex
  score: N
  poc_required: true|false
  arch_review: true|false
---
```

### Markdown Section Format

**Used in:** plan-phase.md, execute-plan-core.md, all workflows

- Use XML-style tags for structured sections: `<purpose>`, `<process>`, `<step>`
- Use markdown headers for document structure: `## Section`, `### Subsection`
- Use code blocks for examples: ` ```bash `, ` ```yaml `, ` ```markdown `
- Use tables for structured data
- Use lists for sequences and options

---

## Best Practices

### Task Definition

**Used in:** plan-phase.md, execute-plan-core.md

**Best practices:**
- Each task must specify: Files, Action, Verify, Done
- Tasks should be atomic (independently committable)
- Tasks should be specific and actionable
- Tasks should have clear acceptance criteria
- Maximum 2-3 tasks per plan for optimal context usage

### Plan Structure

**Used in:** plan-phase.md, execute-plan-core.md

**Best practices:**
- Each plan: 2-3 tasks max (~50% context target)
- Each plan: Independently committable
- Plans should be focused on single concern
- Plans should reference relevant context
- Plans should include verification steps

### Context Management

**Used in:** plan-phase.md, execute-plan-core.md, go-router.md

**Best practices:**
- Load only necessary context for current task
- Use lazy loading for specialized modules
- Reference prior summaries via @context when needed
- Avoid loading full workflow history unless necessary
- Use frontmatter dependency graph for intelligent context assembly

### Git Workflow

**Used in:** execute-plan-commits.md, execute-plan-core.md

**Best practices:**
- Commit after each task completion (atomic commits)
- Never use `git add .` or `git add -A` (stage files individually)
- Use descriptive commit messages with context
- Record commit hashes for SUMMARY.md
- Each commit should be independently revertable

### Error Handling

**Used in:** execute-plan-core.md, debug.md, verify-work.md

**Best practices:**
- Fail fast with clear error messages
- Document expected errors and recovery steps
- Include verification steps to catch errors early
- Use meaningful error messages that help debugging
- Don't fail silently - always report errors

---

## Anti-Patterns

### Task Anti-Patterns

**Used in:** plan-phase.md, execute-plan-core.md

**Avoid:**
- ❌ Story points or hour estimates
- ❌ Team assignments
- ❌ Acceptance criteria committees
- ❌ Sub-sub-sub tasks
- ❌ Vague tasks without Files/Action/Verify/Done

**Remember:** Tasks are instructions for Claude, not Jira tickets.

### Planning Anti-Patterns

**Used in:** plan-phase.md, execute-plan-core.md

**Avoid:**
- ❌ Creating plans with >3 tasks
- ❌ Mixing multiple concerns in one plan
- ❌ Skipping verification steps
- ❌ Not specifying files to modify
- ❌ Vague acceptance criteria

### Context Anti-Patterns

**Used in:** plan-phase.md, execute-plan-core.md, go-router.md

**Avoid:**
- ❌ Loading entire workflow history for simple tasks
- ❌ Loading all modules when only one is needed
- ❌ Not using lazy loading for specialized content
- ❌ Loading examples/guidelines inline instead of referencing
- ❌ Duplicating context across multiple plans

### Git Anti-Patterns

**Used in:** execute-plan-commits.md, execute-plan-core.md

**Avoid:**
- ❌ Using `git add .` or `git add -A`
- ❌ Committing multiple tasks together
- ❌ Vague commit messages
- ❌ Not recording commit hashes
- ❌ Committing without verification

---

## Complexity Guidelines

**Used in:** plan-phase.md, execute-plan-core.md

### Complexity Scoring

| Indicator | Points |
|-----------|--------|
| Single file modification | +1 (Simple) |
| Known pattern in codebase | +1 (Simple) |
| No external integration | +1 (Simple) |
| 2-3 files modified | +2 (Medium) |
| Adapting existing pattern | +2 (Medium) |
| One external integration | +2 (Medium) |
| 4+ files modified | +3 (Complex) |
| New abstraction required | +3 (Complex) |
| Multiple integrations | +3 (Complex) |
| Significant unknowns | +3 (Complex) |
| Performance/security critical | +3 (Complex) |

### Complexity Actions

| Level | POC | Pattern Search | Arch Review |
|-------|-----|----------------|-------------|
| Simple | No | Optional | No |
| Medium | Recommended | Yes | No |
| Complex | Required | Required | Required |

### Red Flags (Auto-Complex)

- "I'm not sure how to..."
- "This might affect other parts..."
- "We've never done this before..."
- Performance or security is critical

---

## Parallelization Guidelines

**Used in:** plan-phase.md, execute-phase.md

### When to Enable Parallelization

- Multiple plans with same file types (all touching models, all touching APIs)
- No genuine data dependencies between features
- Each vertical slice is self-contained

### When NOT to Enable Parallelization

- Genuine dependencies (Plan 02 uses types from Plan 01)
- Shared infrastructure (all features need auth setup first)
- Single-concern phases (all plans ARE vertical slices already)

### Plan Frontmatter for Parallelization

```yaml
depends_on: [plan IDs this plan requires, or empty array]
files_modified: [files this plan will modify]
```

**Note:** `/ink:execute-phase` uses these to detect parallelization opportunities automatically.
