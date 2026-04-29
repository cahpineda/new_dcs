---
requested_issue_key: ACA-2962
hierarchy_mode: up
generated: 2026-04-29
---

> **TASK SCOPE — IMPLEMENT ONLY:** `ACA-2962` (REQUESTED). All other issues in this file (parent hierarchy, related issues) are **reference context only** — they explain the WHY and HOW, but must NOT be planned or implemented.

# ACA-2962: Analyze cloud2 monolith via project2context — full structural, integration and multitenancy audit (REQUESTED)

**Type:** Sub-task
**Status:** In Progress
**Priority:** Normal
**Assignee:** Carlos Hurtado (carlos.hurtado@inkaviation.com)
**Reporter:** Carlos Hurtado (carlos.hurtado@inkaviation.com)
**Created:** 2026-04-29
**Updated:** 2026-04-29
**Estimate:** 6h

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

### Parent Feature: ACA-2961

**Summary:** DCS System Rewrite Strategy — Modular Architecture with Independent Commercialization
**Status:** In Progress
**Type:** Feature

**Description:** Parent feature driving the full modular rewrite strategy for the DCS system. This sub-task (ACA-2962) provides the foundational analysis that feeds into the overall rewrite plan.

### ACA-2962 (REQUESTED)

**Summary:** Analyze cloud2 monolith via project2context — full structural, integration and multitenancy audit
**Status:** In Progress
**Type:** Sub-task
**Priority:** Normal

**Labels:** `ink-monitor`
**Components:** —
**Fix Versions:** —

---

## Important History

### 2026-04-29 — Label added

**ink-monitor** label added
**By:** Carlos Hurtado

---

### 2026-04-29 — Description added

Full scope and acceptance criteria written.
**By:** Carlos Hurtado

---

### 2026-04-29 — Status Change

**From:** Technical Review → To Do → **In Progress**
**By:** Carlos Hurtado

---

### 2026-04-29 — Assignment

**Assigned to:** Carlos Hurtado
**By:** Carlos Hurtado

---

### 2026-04-29 — Parent set

**Parent:** ACA-2961 — DCS System Rewrite Strategy
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
| assignee | Carlos Hurtado (carlos.hurtado@inkaviation.com) |
| reporter | Carlos Hurtado (carlos.hurtado@inkaviation.com) |
| parent | ACA-2961 |
| labels | ink-monitor |
| components | — |
| fixVersions | — |
| timeoriginalestimate | 21600 (6h) |
| timeestimate | 21600 (6h) |
| timespent | — |
| created | 2026-04-29T18:20:06+0200 |
| updated | 2026-04-29T18:49:49+0200 |
| project | ACA — AI Coding Agency |
| customfield_10086 | Departure Control System (Desktop) - DCS |

---

## Development Context

### What needs to be done?

Use the `project2context` MCP (connected to the cloud2 repository) to perform a comprehensive, code-grounded audit of the DCS monolith across 7 dimensions: structure, functional modules, multitenancy, third-party integrations, external dependencies, auth/authz, and inter-module dependencies. The output is a structured analysis document that becomes the foundation for the modular rewrite strategy.

### Why is it important?

This is the first sub-task of ACA-2961 (DCS System Rewrite Strategy). No rewrite planning can begin without this audit — it defines module boundaries, integration contracts, and migration complexity. Every claim in the output must be traceable to actual code.

### What to consider?

- Use `project2context` MCP tools exclusively for code traversal — no assumptions allowed
- The system is a multi-tenant DCS (Departure Control System) serving multiple airlines/airports
- Pay special attention to: tenant isolation mechanisms, PSS/GDS integrations, and shared DB tables (highest rewrite risk)
- Document every cross-module dependency — these become the migration hotspots
- The `project2context` MCP is already configured in `.mcp.json`

### What is NOT included?

- Actual rewrite planning or architecture design (that's ACA-2961's scope)
- Implementation of any new modules
- Database migration scripts
- Any code changes to cloud2

---

## Technical Information

**Relevant labels:** `ink-monitor`
**Affected components:** Departure Control System (Desktop) - DCS
**Product area:** `customfield_10086` = "Departure Control System (Desktop) - DCS"

**Useful links:**
- [Jira Issue](https://inkinnovation.atlassian.net/browse/ACA-2962)
- [Parent Feature](https://inkinnovation.atlassian.net/browse/ACA-2961)

---

*Generated on: 2026-04-29 | Issue Key: ACA-2962 | Last updated: 2026-04-29*
