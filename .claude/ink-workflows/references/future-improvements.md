# Future Improvements Reference

Potential enhancements identified for Ink. **Not for immediate implementation** — documented for future consideration.

**Nota:** Las mejoras implementadas han sido removidas. Ver `.planning/codebase/IMPROVEMENTS.md` para mejoras activas.

**Última actualización:** 2026-01-26 (Phase 8 Gap Analysis)

---

## 1. Hallucination Detection

**Concept:** Catch when Claude references non-existent code.

**Potential integration:** Part of validate-plan check or execution verification.
- Cross-reference file paths with `ls`/`find`
- Verify function signatures with grep
- Flag hallucinated imports

**Why deferred:** Could be built into existing verification steps.
**Reconsideration (2026-01-26):** Worth implementing as part of validation workflow (Medium priority, 1-2 weeks effort)

---

## 2. Graph-Based Memory

**Concept:** Replace STATE.md with graph database for relationships.

**Potential integration:** FalkorDB, Graphiti, or similar.
- Decisions linked to phases that used them
- Files linked to features that created them
- Semantic search across project history

**Why deferred:** Adds infrastructure complexity. Current STATE.md + SUMMARY frontmatter may suffice.

---

## 3. MCP Server Integration

**Concept:** Connect external services (Supabase, Stripe, etc.) via MCP.

**Potential command:** `/ink:connect-mcp`
- Configure MCP servers in project
- Auto-discover available tools
- Integrate into execution context

**Why deferred:** Requires MCP infrastructure. Context7 currently handles research needs.

---

## 4. Auto Test Generation

**Concept:** Generate tests from specifications.

**Potential command:** `/ink:generate-tests`
- Parse SUMMARY accomplishments
- Generate test cases from behavior descriptions
- Create test file scaffolding

**Why deferred:** TDD workflow already handles test creation. May encourage low-quality tests.

---

## 5. ADR System

**Concept:** Formal Architecture Decision Records.

**Potential command:** `/ink:adr`
- Create ADR from template
- Link to phases that implemented decision
- Search past decisions

**Why deferred:** PROJECT.md Key Decisions table serves similar purpose. ADRs add overhead.

---

## 6. Cost/Token Tracking

**Concept:** Track LLM costs per task/phase.

**Potential integration:** SUMMARY metrics section
- Tokens consumed per task
- Cost estimation
- Budget alerts

**Why deferred:** Requires API integration. Duration metrics may be proxy enough.
**Reconsideration (2026-01-26):** Could be useful for budget tracking (Low priority, 1-2 weeks effort)

---

## Implementation Priority (if ever needed)

| Priority | Feature | Status |
|----------|---------|--------|
| 1-3 | Implemented features | DONE (removed from this file) |
| 4-9 | Others | Deferred |

---

## Decision

**These improvements are DEFERRED** because:
1. Current system already has 27+ commands
2. Adding more increases cognitive load
3. Simpler systems have higher adoption
4. Most can be achieved with existing commands + discipline

See: `.claude/ink-workflows/references/complexity-analysis.md` for reasoning.
