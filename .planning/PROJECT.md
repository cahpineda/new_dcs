# DCS Cloud2 Monolith Analysis

## What This Is

Workspace for performing an exhaustive, code-grounded analysis of the cloud2 DCS monolith using the `project2context` MCP. The output is a structured architecture document covering structure, functional modules, multitenancy, third-party integrations, external dependencies, auth/authz, and inter-module dependencies — foundational input for the DCS modular rewrite strategy (ACA-2961).

## Core Value

A complete analysis document where every claim is traceable to actual code in the cloud2 repository — no assumptions allowed.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] cloud2 fully traversed with `project2context` — no relevant functional areas left unanalyzed
- [ ] General monolith structure documented: framework, version, architectural patterns, entry points
- [ ] Candidate module list defined with FE/BE/DB scope per module, grounded in actual code groupings
- [ ] Multitenant model fully documented: isolation mechanism, scope, per-client variations
- [ ] All third-party integrations catalogued: vendor, protocol, flow direction, module, criticality
- [ ] External dependencies inventoried from composer.json/package.json with replacement notes
- [ ] Auth/authz model documented with separability assessment
- [ ] Inter-module dependency map produced with high-coupling hotspots explicitly flagged
- [ ] Output document reviewed and approved as input for the modular rewrite strategy

### Out of Scope

- Actual rewrite planning or architecture design — that's ACA-2961's scope
- Implementation of any new modules — analysis only
- Database migration scripts — out of this task's scope
- Any code changes to cloud2 — read-only analysis

## Context

This workspace is the execution environment for sub-task ACA-2962, part of the DCS System Rewrite Strategy (ACA-2961). The cloud2 repository is a Laravel-based DCS (Departure Control System) monolith serving multiple airline/airport tenants. The `project2context` MCP is configured in `.mcp.json` and connected to the cloud2 repository.

**Key risks:**
- Multitenancy implementation may be deeply embedded and hard to isolate
- PSS/GDS integrations are likely airline-specific (optional per tenant)
- Shared DB tables = highest coupling risk for modular rewrite

## Constraints

- **Traceability**: Every claim in the output must be traceable to actual code — no assumptions
- **Tooling**: Use `project2context` MCP exclusively for code traversal; no manual guessing
- **Approval**: Output document must be approved by technical lead before rewrite strategy begins
- **Scope**: Analysis only — no code changes to cloud2

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use project2context MCP for all traversal | Deterministic, code-grounded results | — Pending |
| Sequential phase execution | More reliable than parallel for analysis tasks | — Pending |

---
*Last updated: 2026-04-29 after initialization (ACA-2962)*
