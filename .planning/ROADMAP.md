# Roadmap: DCS Cloud2 Monolith Analysis

## Overview

Six sequential phases that progressively build a complete picture of the cloud2 DCS monolith using the `project2context` MCP. Each phase delivers a documented section of the final analysis, culminating in a structured architecture document that serves as the foundational input for the modular rewrite strategy (ACA-2961). All claims must be traceable to actual code.

## Hallazgo Arquitectónico Crítico (2026-04-29)

**`departure_control_controller.class.php` es el núcleo del sistema DCS.**

P2C confirma 24 archivos que referencian directamente este controlador:
- `passenger.class.php` — `can_be_checked_in()`, `copy_from_passenger_for_transfer()`
- `flight.class.php` — `get_boarding_groups_for_departure_control()`, carga de pasajeros
- `seat_master.class.php`, `zone_balanced_seating.class.php` — asignación de asientos en contexto DCS
- `crew_controller.class.php` — `get_departure_control_instance()`
- `boarding_tab_controller.class.php` — vista de embarque usa el contexto DCS
- `border_control_departure_controller.class.php` — control de frontera obtiene instancia DCS
- `ajax_responder_controller.class.php` — `process_do_checkin()` opera bajo contexto DCS
- `bq_departure_control_screen/session` — analytics de sesiones DCS
- `touch_suite_handler_controller.class.php` — TouchSuite obtiene instancia DCS
- `local_functions.php` — `is_departure_control_desk_request()` define el MODO de ejecución

**Implicaciones para el análisis:**
- El análisis de cada módulo debe iniciarse preguntando: "¿Cómo interactúa con `departure_control_controller`?"
- `departure_control_controller` NO debe tratarse como un módulo más — es el **orquestador** del que dependen todos los demás módulos operacionales
- Para la reescritura: `departure_control` debe ser el ÚLTIMO componente en migrarse, o debe existir como capa de orquestación desde el inicio
- El **orden de reescritura** (Phase 5 output) debe organizar módulos de menor a mayor dependencia con `departure_control`

**Núcleo de código (P2C export_core_network, 1,416 nodos, 3,843 edges):**
- Nodo más conectado: `ws_passenger.class.php::validate_pax_attributes` (v1.3–v1.8, 132–142 conexiones) — el API WS es el hub técnico
- `ink_cupps_broker.class.php::get_xml_event` (80 conexiones) — CUPPS como segundo hub
- `departure_control_controller` aparece como hub de dominio (24 referencias directas) pero es menos conectado en el grafo técnico — confirma que es un orquestador de negocio, no un helper técnico

## Domain Expertise

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
**Architectural note**: `departure_control_controller` is the operational nucleus — it must receive special depth treatment in 02-02 and serve as the primary hotspot in 02-03. Every module's relationship to departure_control must be documented.

Plans:
- [ ] 02-01: Group controllers, models, and views by functional domain to identify candidate modules
- [ ] 02-02: Document each candidate module: FE (views/templates/JS), BE (controllers/services/routes), DB (owned tables, shared tables, FK dependencies) — **departure_control analyzed with extra depth as nucleus**
- [ ] 02-03: Validate module boundaries — identify cross-cutting concerns and shared code — **departure_control is the primary hotspot; trace all 24 direct dependencies**

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
**Goal**: Inventory all external dependencies with replacement notes, and produce a complete inter-module dependency map with `departure_control_controller` as the center node. Hotspots flagged with migration order.
**Depends on**: Phase 2
**Research**: Unlikely (uses dependency manifests and module map from Phase 2)
**Architectural note**: The dependency map must be built **outward from `departure_control_controller`** — modules that have no path to departure_control are candidates for early independent extraction.

Plans:
- [ ] 05-01: Review dependency manifests (no composer.json found — focus on vendored libraries in includes/, voku_anti_xss/, xero/, attest_ios_libs/) — identify business-critical libraries and deprecated packages
- [ ] 05-02: Produce inter-module dependency map centered on `departure_control_controller` — identify which modules can be extracted independently (no departure_control dependency) vs which require it; produce rewrite order sorted by departure_control coupling depth

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
| 1. Repository Structure & Framework Analysis | 2/2 | ✅ Complete | 2026-04-29 |
| 2. Functional Module Identification | 3/3 | ✅ Complete | 2026-04-29 |
| 3. Multitenancy & Auth Analysis | 2/2 | ✅ Complete | 2026-04-29 |
| 4. Third-party Integrations Catalogue | 2/2 | ✅ Complete | 2026-04-29 |
| 5. Dependencies & Inter-module Map | 2/2 | ✅ Complete | 2026-04-29 |
| 6. Analysis Document Assembly | 2/2 | ✅ Complete | 2026-04-29 |
| 7. Logging & Auditing Strategy | 1/1 | ✅ Complete | 2026-04-30 |

**Overall: 14/14 plans complete — análisis ACA-2962 finalizado.**

---

### Phase 1: repository-structure-framework-analysis ✅

**Goal:** Documentar estructura del repositorio, stack tecnológico, patrones arquitectónicos y puntos de entrada del DCS.

**Key outputs:** `ESTRUCTURA-REPO.md`, `FRAMEWORK.md`, `PUNTOS-ENTRADA.md`

**Key findings:** PHP 8.2+ sin framework estándar. MVC custom. Slim solo en `rest/index.php`. XCache obsoleto en `ink_autoload()` — posible bug activo en PHP 8.2. 200+ controladores legacy en `includes/`. 10 entry points identificados.

Plans:
- [x] 01-01: Traversal de estructura, directorios, clases, entry points
- [x] 01-02: Framework, stack, patrones arquitectónicos, convenciones

---

### Phase 2: functional-module-identification ✅

**Goal:** Identificar módulos funcionales con límites claros y scope FE/BE/DB por módulo.

**Key outputs:** `MODULOS-CANDIDATOS.md`, `SCOPE-MODULOS.md`, `LIMITES-MODULOS.md`

**Key findings:** 15 módulos + co-núcleo (DC + Flight Management). SSBD fusionado en Baggage/BRS. Clasificación Level 0/1/2/Núcleo por acoplamiento con `departure_control_controller`. 3 dependencias circulares. 5 shared services necesarios antes de cualquier extracción Level 2.

Plans:
- [x] 02-01: Agrupación de controladores por dominio funcional
- [x] 02-02: Scope FE/BE/DB por módulo (tablas propias, compartidas, FK)
- [x] 02-03: Validación de límites, dependencias cruzadas, hotspots

---

### Phase 3: multitenancy-auth-analysis ✅

**Goal:** Documentar mecanismo de multitenancy y sistema de auth/authz con evaluación de separabilidad.

**Key outputs:** `MULTITENANCY.md`, `AUTH.md`

**Key findings:** Shared DB Row-Level Isolation via `get_current_company_key($_SERVER['SERVER_NAME'])`. 11+ tenants en `webci/`. RBAC custom con 7 tablas. `load_session()` en 156+ controladores — no separable sin refactor de middleware. `user_token` es el seed para auth moderna.

Plans:
- [x] 03-01: Mecanismo de tenant isolation, variaciones por cliente
- [x] 03-02: Flujo de auth, roles, permisos, separabilidad

---

### Phase 4: third-party-integrations-catalogue ✅

**Goal:** Catálogo completo de integraciones externas con protocolo, flujo y criticidad.

**Key outputs:** `INTEGRACIONES-DESCUBIERTAS.md`, `CATALOGO-INTEGRACIONES.md`

**Key findings:** 25+ integraciones (19 con ficha completa). Alta criticidad: CUPPS/CUTE (80 conexiones), SITA BaggageService SOAP (91 stubs WSDL), APIS/Gobierno (regulatorio), WS API (12 variantes). gRPC (`includes/grpc/`) sin target identificado — requiere verificación.

Plans:
- [x] 04-01: Descubrimiento de integraciones vía P2C
- [x] 04-02: Catálogo completo con protocolo, flujo, módulo, criticidad

---

### Phase 5: dependencies-intermodule-map ✅

**Goal:** Inventario de dependencias externas y mapa completo de dependencias inter-módulos con hotspots.

**Key outputs:** `DEPENDENCIAS-EXTERNAS.md`, `MAPA-DEPENDENCIAS-INTERMODULO.md`

**Key findings:** Sin composer.json — todo vendorizado in-tree. 58 dependencias inter-módulo documentadas. 9 hotspots (`.row()` deg=16,611 es el hub de código real). Orden de reescritura en 5 olas definido. `scheduled_flight` y `passenger` como tablas de mayor acoplamiento (12+ y 9+ módulos respectivamente).

Plans:
- [x] 05-01: Inventario de dependencias externas PHP/JS
- [x] 05-02: Mapa inter-módulos, tablas compartidas, hotspots, orden de reescritura

---

### Phase 6: analysis-document-assembly ✅

**Goal:** Ensamblar documento final que responde todos los criterios de aceptación de ACA-2962.

**Key outputs:** `ANALISIS-CLOUD2.md`, `AC-CHECKLIST.md`, `INDICE-ARTEFACTOS.md`

**Key findings:** 8/9 criterios de aceptación cumplidos. Criterio 9 (aprobación tech lead) pendiente de acción humana. Documento consolidado + informe de cotejo contra `plan_definitivo.md` generados en `docs/`.

Plans:
- [x] 06-01: Ensamblaje del documento de análisis (8 secciones + Apéndice)
- [x] 06-02: Verificación AC, cierre de brechas, índice de artefactos
---

### Phase 7: logging-auditing-strategy ✅

**Goal:** Auditar el estado actual de logging/auditoría en cloud_2, identificar gaps críticos, y definir la estrategia completa de logging y auditoría para el sistema reescrito. Ningún módulo puede liberarse a producción sin audit trail completo.

**Depends on:** Phase 6

**Key outputs:** `LOGGING-AUDITORIA.md`

**Key findings:** cloud_2 no tiene sistema de auditoría centralizado. 10 gaps críticos identificados — los más graves: gate override de supervisor sin registro, denegación de embarque sin log, doble asignación de asiento sin historial, APIS submission sin log dedicado, release de vuelo sin audit. Estrategia de 2 capas definida: `audit_events` append-only (Cat. A/B/C) + BigQuery Cat. D. 43 eventos clasificados, 11 gates de pre-release por módulo. Pre-work de logging (~2-3 semanas) necesario antes de Ola 0.

Plans:
- [x] 07-01: Auditar logging actual + clasificar requisitos + definir estrategia 2 capas + mapear por módulo/ola
