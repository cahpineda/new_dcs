---
requested_issue_key: ACA-2962
ticket_status: In Progress
hierarchy_mode: all
generated: 2026-04-29
---

> **TASK SCOPE — IMPLEMENT ONLY:** `ACA-2962` (REQUESTED). All other issues in this file (parent hierarchy, related issues, same-epic issues) are **reference context only** — they explain the WHY and HOW, but must NOT be planned or implemented.

# ACA-2962: Analyze cloud2 monolith via project2context — full structural, integration and multitenancy audit (REQUESTED)

**Type:** Sub-task
**Status:** In Progress
**Priority:** Normal
**Assignee:** Carlos Hurtado (carlos.hurtado@inkaviation.com)
**Reporter:** Carlos Hurtado (carlos.hurtado@inkaviation.com)
**Created:** 2026-04-29
**Updated:** 2026-04-29

---

## Description

Using the `project2context` MCP connected to the cloud2 repository, perform an exhaustive analysis of the DCS monolith. This goes beyond surface-level module identification — the goal is to deeply understand the system's real architecture, how it handles multiple clients/tenants, all third-party integrations, external libraries, and any external dependencies that must be replicated or replaced in the rewrite. The output of this task is the foundational input for the entire modular rewrite strategy.

---

**Scope**

**1. General monolith structure**
- Traverse the full repository structure using `project2context`: routes, controllers, models, views, migrations, services, jobs, events, middlewares, and configuration files
- Identify the framework and version, and architectural patterns in use (MVC, repository pattern, service layer, etc.)
- Map the entry point of each functional flow relevant to the DCS

**2. Functional module identification**
- Group controllers, models, and views by functional domain to identify candidate independent modules
- For each candidate module document:
  - **FE:** views/templates, JS components, pages involved
  - **BE:** controllers, services, business logic, API routes
  - **DB:** owned tables, shared tables, foreign key dependencies

**3. Multitenancy analysis**
- Identify how the system distinguishes and isolates data across clients/airlines/airports (tenant ID, separate schemas, row-level security, etc.)
- Document which models and tables are tenant-aware
- Identify whether configurations, features, or workflows vary per tenant
- Detect any white-labeling or per-client customization logic
- Assess the impact of the current multitenant model on the design of each rewritten module

**4. Third-party integrations**
- Identify all external integrations present in the codebase (PSS, GDS, baggage systems, payment gateways, identity providers, messaging services, etc.)
- For each integration document:
  - System/vendor name
  - Protocol used (REST, SOAP, message queue, file-based, etc.)
  - Flow direction (cloud2 consumes / cloud2 exposes)
  - Functional module(s) that use it
  - Criticality and frequency of use
- Distinguish integrations that are mandatory for all tenants vs. optional per client

**5. External libraries and dependencies**
- Review `composer.json`, `package.json`, and any other dependency manifests
- Identify business-critical libraries (not just utilities) that must be replicated or replaced in the new architecture
- Flag dependencies with restrictive licenses or libraries that are deprecated or unmaintained

**6. Authentication and authorization**
- Document the auth model: how users authenticate, roles, and permission structure
- Assess whether auth is tightly coupled to the monolith or can be extracted as a separate service
- Map which functional modules have specific authorization rules

**7. Inter-module dependency map**
- Catalogue all cross-module dependencies between candidate modules
- Identify shared models/tables that represent high coupling
- Explicitly flag high-risk hotspots for the rewrite with notes on migration complexity

---

**Acceptance Criteria**
- [ ] cloud2 fully traversed with `project2context` with no relevant functional areas left unanalyzed
- [ ] Candidate module list defined with justification grounded in actual code groupings
- [ ] Each module has a documented FE / BE / DB scope sourced directly from the repository
- [ ] Multitenant model fully documented: mechanism, scope, and per-client variations
- [ ] All third-party integrations catalogued with protocol, flow direction, associated module, and criticality
- [ ] Relevant external dependencies inventoried with replacement notes where applicable
- [ ] Auth/authz model documented with separability assessment
- [ ] Inter-module dependency map produced with high-coupling hotspots explicitly flagged
- [ ] Output document reviewed and approved as input for the modular rewrite strategy feature

---

**Definition of Done**

A structured analysis document is delivered covering all sections above, sourced entirely from the cloud2 codebase via `project2context`. No section may be left as an assumption — every claim must be traceable to actual code found in the repository. The document is approved by the technical lead before the rewrite strategy work begins.

---

## Hierarchy

The complete hierarchy from Feature to this issue: Feature → Sub-task

### Feature: ACA-2961

**Summary:** DCS System Rewrite Strategy — Modular Architecture with Independent Commercialization
**Status:** In Progress
**Type:** Feature

**Description:** Define a comprehensive rewrite strategy for the DCS (Departure Control System) currently implemented as a PHP monolith in cloud2, decomposing it into independently deployable and commercially sellable modules. Each module must have its own defined scope covering Frontend (React), Backend (API/services), and Database (schema ownership), enabling Anthropic to license and deploy individual modules to clients without requiring the full system.

This strategy must be grounded in the actual cloud2 codebase — analyzed via `project2context` — to ensure the module boundaries, dependencies, and data flows reflect reality and not assumptions.

**Scope:**
- Analyze the cloud2 monolith using `project2context` to identify functional domains, bounded contexts, and existing module boundaries
- Identify and define each DCS module (e.g. Check-in, Seat Plan, Boarding, Flight Management, Baggage, etc.) based on actual code structure
- For each module, define: FE components/pages, BE services/endpoints, and DB schema ownership
- Map inter-module dependencies and data contracts (shared entities, cross-module API calls)
- Define a phased migration/rewrite roadmap that allows modules to be extracted and delivered incrementally
- Establish commercialization packaging per module (what's included, what APIs are exposed to clients)

**Acceptance Criteria:**
- cloud2 codebase fully analyzed and functional domains documented
- Complete list of DCS modules defined with clear boundaries
- Each module has a defined FE + BE + DB scope
- Inter-module dependency map produced
- Phased rewrite roadmap created with priority order and estimated complexity per module
- Strategy document reviewed and approved by technical lead

### ACA-2962 (REQUESTED)

**Summary:** Analyze cloud2 monolith via project2context — full structural, integration and multitenancy audit
**Status:** In Progress
**Type:** Sub-task
**Priority:** Normal

**Labels:** `ink-monitor`
**Components:** Departure Control System (Desktop) - DCS

---

## Related Issues

### Subtasks

No subtasks.

### Links

No linked issues.

### Other Issues from Same Epic

No epic link found for this issue — same-epic issues not available.

---

## Important History

### 2026-04-29 18:49 - Label Added

**Change:** ink-monitor label added
**By:** Carlos Hurtado

---

### 2026-04-29 18:22 - Description Added

**Change:** Full task description written with 7-section scope, acceptance criteria, and definition of done
**By:** Carlos Hurtado

---

### 2026-04-29 18:21 - Status Change

**From:** To Do → **To:** In Progress
**By:** Carlos Hurtado

---

### 2026-04-29 18:21 - Status Change

**From:** Technical Review → **To:** To Do
**By:** Carlos Hurtado

---

### 2026-04-29 18:21 - Time Estimate Set

**Change:** Original estimate set to 6h (21600s)
**By:** Carlos Hurtado

---

### 2026-04-29 18:21 - Assignment

**Assigned to:** Carlos Hurtado
**By:** Carlos Hurtado

---

### 2026-04-29 18:21 - Summary Corrected

**From:** "nalyze cloud2 monolith via project2context..." → **To:** "Analyze cloud2 monolith via project2context..."
**By:** Carlos Hurtado

---

### 2026-04-29 18:20 - Created

**Change:** Issue created and linked to parent ACA-2961
**By:** Carlos Hurtado

---

## Raw Fields

| Field | Value |
|-------|-------|
| key | ACA-2962 |
| id | 142762 |
| issuetype | Sub-task |
| status | In Progress |
| priority | Normal |
| assignee | Carlos Hurtado |
| reporter | Carlos Hurtado |
| creator | Carlos Hurtado |
| parent | ACA-2961 |
| project | ACA (AI Coding Agency) |
| labels | ink-monitor |
| components | (none) |
| customfield_10086 | Departure Control System (Desktop) - DCS |
| customfield_10473 | Low |
| created | 2026-04-29T18:20:06.325+0200 |
| updated | 2026-04-29T18:49:49.830+0200 |
| timeoriginalestimate | 21600 (6h) |
| timeestimate | 21600 (6h) |
| timespent | null |
| workratio | 0 |
| progress | 0% |
| votes | 0 |
| resolutiondate | null |
| duedate | null |
| environment | null |
| security | null |
| fixVersions | (none) |
| customfield_10019 | 1\|i0g6vd: |
| customfield_10000 | {} |

---

## Development Context

### What needs to be done?

Perform an exhaustive audit of the cloud2 DCS PHP monolith using the `project2context` MCP tool. The deliverable is a structured analysis document covering: (1) general structure and framework patterns, (2) functional module identification with FE/BE/DB scope per module, (3) multitenancy model and per-client isolation mechanisms, (4) all third-party integrations with protocol/direction/criticality, (5) external library inventory with replacement notes, (6) auth/authz model and separability assessment, (7) inter-module dependency map with high-coupling hotspots flagged.

### Why is it important?

This is the **foundational input** for the entire DCS modular rewrite strategy (ACA-2961). The goal is to decompose the monolith into independently deployable, commercially sellable modules — each with defined FE (React), BE (API), and DB (schema ownership) scope. No claim in the rewrite strategy may be based on assumptions; every module boundary must be traceable to actual code in the repository.

### What to consider?

- Use `project2context` MCP exclusively — do not rely on assumptions or general PHP/Laravel patterns
- The system is multitenant (multiple airlines/airports); isolation mechanism must be fully understood before module boundaries can be drawn
- Third-party integrations (PSS, GDS, baggage, payments, identity providers) are critical and some may be tenant-specific
- Auth/authz may be tightly coupled — assess extractability carefully
- High-coupling hotspots in the inter-module map directly determine rewrite complexity and sequencing
- This task is purely an analysis/document deliverable — no code changes

### What is NOT included?

- Module rewrite design or implementation
- API contract definition for new modules
- Migration roadmap (that belongs to subsequent tasks in ACA-2961)
- Commercialization packaging decisions

---

## Technical Information

**Relevant labels:** `ink-monitor`
**Affected components:** Departure Control System (Desktop) - DCS
**Risk level:** Low
**Estimate:** 6h

**Useful links:**
- [Jira Issue](https://inkinnovation.atlassian.net/browse/ACA-2962)
- [Parent Feature](https://inkinnovation.atlassian.net/browse/ACA-2961)

---

*Generated on: 2026-04-29 | Issue Key: ACA-2962 | Last updated: 2026-04-29*
