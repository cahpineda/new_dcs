# Roadmap: DCS Cloud2 Monolith Analysis

## Overview

Six sequential phases that progressively build a complete picture of the cloud2 DCS monolith using the `project2context` MCP. Each phase delivers a documented section of the final analysis, culminating in a structured architecture document that serves as the foundational input for the modular rewrite strategy (ACA-2961). All claims must be traceable to actual code.

## Domain Expertise

None

## Phases

- [ ] **Phase 1: Repository Structure & Framework Analysis** — Traverse cloud2 repo, identify framework/version, architectural patterns, and DCS entry points
- [ ] **Phase 2: Functional Module Identification** — Group codebase by domain, document FE/BE/DB scope per candidate module
- [ ] **Phase 3: Multitenancy & Auth Analysis** — Document tenant isolation mechanism, per-client variations, auth/authz model
- [ ] **Phase 4: Third-party Integrations Catalogue** — Map all external integrations with protocol, flow direction, and criticality
- [ ] **Phase 5: Dependencies & Inter-module Map** — Inventory external libraries and produce inter-module dependency map with hotspots
- [ ] **Phase 6: Analysis Document Assembly** — Compile all findings into final structured document, verify acceptance criteria

## Phase Details

### Phase 1: Repository Structure & Framework Analysis
**Goal**: Produce a documented map of the cloud2 monolith structure: framework, version, architectural patterns (MVC, service layer, etc.), directory layout, and entry points for each DCS functional flow.
**Depends on**: Nothing (first phase)
**Research**: Likely (unfamiliar codebase — need project2context discovery)
**Research topics**: cloud2 repo structure, Laravel version, routing conventions, service layer patterns

Plans:
- [ ] 01-01: Traverse repo structure via project2context — routes, controllers, models, views, migrations, services, jobs, events, middlewares, config files
- [ ] 01-02: Identify framework version, architectural patterns, and map DCS functional flow entry points

### Phase 2: Functional Module Identification
**Goal**: Define candidate independent modules grounded in actual code groupings, each with documented FE/BE/DB scope.
**Depends on**: Phase 1
**Research**: Unlikely (uses Phase 1 structure map)

Plans:
- [ ] 02-01: Group controllers, models, and views by functional domain to identify candidate modules
- [ ] 02-02: Document each candidate module: FE (views/templates/JS), BE (controllers/services/routes), DB (owned tables, shared tables, FK dependencies)
- [ ] 02-03: Validate module boundaries — identify cross-cutting concerns and shared code

### Phase 3: Multitenancy & Auth Analysis
**Goal**: Fully document how cloud2 isolates data across tenants and how authentication/authorization works, with separability assessment.
**Depends on**: Phase 2
**Research**: Unlikely (uses existing code traversal)

Plans:
- [ ] 03-01: Multitenancy — identify isolation mechanism (tenant ID, schemas, RLS), tenant-aware models/tables, per-client config/feature variations, white-labeling logic
- [ ] 03-02: Auth/authz — document authentication flow, roles, permissions structure; assess whether auth can be extracted as a separate service; map module-specific authorization rules

### Phase 4: Third-party Integrations Catalogue
**Goal**: Complete catalogue of all external integrations in cloud2 — PSS, GDS, baggage systems, payment gateways, identity providers, messaging services — with protocol, direction, and criticality documented.
**Depends on**: Phase 2
**Research**: Likely (need to identify and understand external system contracts)
**Research topics**: PSS/GDS integration patterns in airline DCS systems

Plans:
- [ ] 04-01: Discover all external integrations via project2context — scan for HTTP clients, SOAP calls, queue producers/consumers, file-based exchanges, identity provider calls
- [ ] 04-02: Document each integration: vendor name, protocol, flow direction, owning module, criticality, mandatory-vs-optional-per-tenant classification

### Phase 5: Dependencies & Inter-module Map
**Goal**: Inventory all external dependencies (composer.json/package.json) with replacement notes, and produce a complete inter-module dependency map with high-coupling hotspots flagged.
**Depends on**: Phase 2
**Research**: Unlikely (uses dependency manifests and module map from Phase 2)

Plans:
- [ ] 05-01: Review composer.json, package.json, and other manifests — identify business-critical libraries, flag restrictive licenses and deprecated/unmaintained packages
- [ ] 05-02: Produce inter-module dependency map — catalogue cross-module dependencies, identify shared models/tables representing high coupling, flag high-risk hotspots with migration complexity notes

### Phase 6: Analysis Document Assembly
**Goal**: Compile all phase findings into the final structured analysis document covering all 7 scope dimensions. Verify all acceptance criteria are met.
**Depends on**: Phases 1–5
**Research**: Unlikely (assembly of existing findings)

Plans:
- [ ] 06-01: Assemble structured analysis document from all phase outputs, verify every claim is traceable to code
- [ ] 06-02: Verify acceptance criteria checklist (ACA-2962), prepare document for technical lead review

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Repository Structure & Framework Analysis | 0/2 | Not started | - |
| 2. Functional Module Identification | 0/3 | Not started | - |
| 3. Multitenancy & Auth Analysis | 0/2 | Not started | - |
| 4. Third-party Integrations Catalogue | 0/2 | Not started | - |
| 5. Dependencies & Inter-module Map | 0/2 | Not started | - |
| 6. Analysis Document Assembly | 0/2 | Not started | - |
---

### Phase 1: repository-structure-framework-analysis

**Goal:** [To be planned]

**Plans:** 0 plans

Plans:
- [ ] TBD (run /ink:plan-phase 1 to break down)
---

### Phase 2: functional-module-identification

**Goal:** [To be planned]

**Plans:** 0 plans

Plans:
- [ ] TBD (run /ink:plan-phase 2 to break down)
---

### Phase 3: multitenancy-auth-analysis

**Goal:** [To be planned]

**Plans:** 0 plans

Plans:
- [ ] TBD (run /ink:plan-phase 3 to break down)
---

### Phase 4: third-party-integrations-catalogue

**Goal:** [To be planned]

**Plans:** 0 plans

Plans:
- [ ] TBD (run /ink:plan-phase 4 to break down)
---

### Phase 5: dependencies-intermodule-map

**Goal:** [To be planned]

**Plans:** 0 plans

Plans:
- [ ] TBD (run /ink:plan-phase 5 to break down)
---

### Phase 6: analysis-document-assembly

**Goal:** [To be planned]

**Plans:** 0 plans

Plans:
- [ ] TBD (run /ink:plan-phase 6 to break down)
