# Plan Consolidado de Reescritura — DCS cloud_2

**Fuentes:** ACA-2962 (análisis P2C) + plan_definitivo.md (arquitectura + graphify)  
**Fecha:** 2026-04-30 | **Estado:** Listo para revisión tech lead

---

## 1. Premisa

**cloud_2** es el DCS monolítico de Ink Aviation — PHP 8.2+, sin framework estándar, arquitectura MVC custom con 5,362 módulos indexados, 2,357 clases, 31,576 funciones y 1,402 tablas (880 en webdcs + 522 en webdcs_lc). Sirve a 11+ aerolíneas (carriers) en producción.

**Dos god nodes confirmados:**
- **`.row()`** — hub de código (deg=16,611, grafo graphify): clase base ORM-like de la que heredan todas las entidades. El verdadero cuello de botella técnico.
- **`departure_control_controller.class.php`** — hub de dominio (21,488 LOC, 312 nodos, 24 dependencias directas P2C): orquestador del flujo DCS completo. Se migra **último**.

La customización por carrier hoy ocurre vía 512 archivos en `view_template_custom/`, de los cuales solo 2 son overrides reales de `view_template_standard/`. Los 486 restantes son pantallas únicas por carrier sin mecanismo de promoción a core. Este antipatrón es el objetivo principal de la nueva arquitectura.

---

## 2. Principios rectores (no negociables)

### Backend
1. **Una transición por feature, no tres por monolito.** Cada feature pasa de `legacy handler` a `api handler` en una operación atómica (handler_flip). Sin shared DB intermedia, sin CDC, sin fase 2/3.
2. **Verificación multi-signal o no se promueve.** El verifier 6/6 debe aprobar: contract + DOM + visual + behavior + perf + concurrency. Sin excepción.
3. **Rollback instantáneo siempre disponible.** El handler legacy se conserva intacto hasta N días de tráfico real sin regresión. No se borra código legacy en la misma iteración.
4. **Descubrimiento por código, no por documento.** Business rules, side-effect map y call paths vienen de MCP/graphify sobre el código real.
5. **Sin diseño upfront de sagas ni schemas globales.** Eventos y sagas emergen solo cuando dos features migradas necesitan coordinarse.

### Frontend / Multitenancy
6. **Cero `if carrier === X` en código del core.** Bloqueante en code review.
7. **Cero copia de archivo completo para customizar.** El antipatrón `view_template_custom/` no se replica.
8. **Multi-tenancy es ciudadano de primera clase.** `tenant_id` se propaga en todas las capas.
9. **Una pantalla puede estar migrada para N carriers y aún en legacy para M.** Coexistencia es la norma durante la migración.

---

## 3. Estado actual del monolito — datos verificados

| Métrica | Valor | Fuente |
|---|---|---|
| Módulos PHP indexados | **5,362** | P2C sesión 795eedb2 |
| Funciones | **31,576** | P2C |
| Clases | **2,357** | P2C |
| Tablas (webdcs) | **880** | plan_definitivo / graphify |
| Tablas (webdcs_lc) | **522** | plan_definitivo |
| Endpoints API públicos | **92** (Ink API 1.0.0) | plan_definitivo / graphify |
| Versiones de ws_class (back) | **12** (v1.0–v1.9 + ws_lc + ws_crs_xml) | graphify |
| Versiones WS API móvil | **10** (v3.7.0–v3.18.0) | P2C |
| God node dominio (LOC) | `departure_control_controller` — 21,488 LOC | graphify |
| God node código (degree) | `.row()` — deg=16,611, 13,976 cross-community edges | graphify |
| Archivos view_template_custom/ | **512** (486 únicos por carrier, solo 2 overrides reales) | graphify |
| Clases `*_apis.class.php` | **96** (mezcla: país/carrier/CRS en 3 ejes) | graphify |
| Communities Leiden | 4,402 (22 con >500 nodos, 2,816 singletons) → sin bounded contexts naturales | graphify |
| Tenants activos | **11+** aerolíneas | P2C (`webci/`) |
| Controladores legacy | **200+** (`includes/*.class.php`) | P2C |

**Antipatrones confirmados:**
- Forks de archivo por versión API (`ws_v1.X/`) y por carrier (`view_template_custom/`)
- God class dominio con responsabilidades transversales (`departure_control_controller`)
- God node ORM (`.row()`) con alcance universal — cualquier feature que toque persistencia lo hereda
- Instanciación dinámica por string: `row::get_instance("departure_control_controller", $db, $vars)` — invisible al grafo estático
- INSERTs sin transacciones (falta de integridad transaccional)
- Race conditions documentadas en seat assignment
- XCache obsoleto (PHP 8.2 incompatible) en `ink_autoload()` — posible bug activo en producción

---

## 4. Catálogo de módulos funcionales

### Lista final validada (15 módulos + co-núcleo)

| # | Módulo | Nivel Acoplamiento | Ola de Reescritura | Controladores (muestra) | Tablas Propias |
|---|---|---|---|---|---|
| N | **Departure Control** | Núcleo (Máximo) | Ola 5 — ÚLTIMO | `departure_control_controller`, `webborders_departure_controller` | `bq_departure_control_screen`, `bq_departure_control_session` |
| N | **Flight Management** | Co-Núcleo (Máximo) | Ola 5 (antes que DC) | `scheduled_flight_controller`, `flight_dashboard_controller`, `delay_code_controller` | `scheduled_flight`, `action_flight`, `flight_authority` |
| 1 | Check-in de Pasajeros | Level 2 (Alto) | Ola 3B | `webci_controller`, `checkin_passenger_controller`, `ajax_responder_controller` | `checkin_transaction`, `app_form_passenger` |
| 2 | CUSS / Kiosk | Level 2 (Alto) | Ola 3A | `cuss_selfcheckin_kiosk_controller`, `cuss_selfcheckin_jet2_kiosk_controller` | `kiosk_session`, `kiosk_session_passenger`, `cuss_kiosk` |
| 3 | Boarding & Gate | Level 2 (Alto) | Ola 3B | `boarding_gate_controller`, `selfboarding_controller`, `boarded_passenger_controller` | `boarding_gate`, `boarding_transaction`, `boarding_group_list` |
| 4 | Baggage + SSBD | Level 1/2 (Medio) | Ola 2 | `baggage_scan_controller`, `bags_cloud_controller`, `bag_drop_kiosk_controller` | `baggage_scan`, `baggage_tag`, `bag_drop_transaction` |
| 5 | Seating / Seat Map | Level 2 (Alto) | Ola 3B | `seat_controller`, `seating_service`, `cabin_configuration_controller` | `seat`, `seat_allocation`, `cabin_configuration` |
| 6 | W&B / AHM | Level 2 (Alto) | Ola 4 | `ahm_controller`, `ahm560_controller`, `loadsheet_controller` | `ahm`, `ahm_envelope` (18 schemas AHM) |
| 7 | Web Service API | Level 1 (Alto) | Ola 2 | `ws_v{N}/web_service_master` (12 vers.), `ws_v{N}/ws_passenger` | Sin tablas propias — opera sobre DB compartida |
| 8 | APIS / Border Control | Level 2 (Medio) | Ola 4 | `apis_switch_controller`, `convert_pnrgov_controller`, `immigration_controller` | `border_movement`, `attendee`, `apis_switch` |
| 9 | CUPPS / Periféricos | Level 2 (Medio) | Ola 3A | `ink_cupps_broker`, `ink_cuss_broker`, `cute_listener_controller` | `cupps_connection`, `cupps_message`, `cupps_transaction` |
| 10 | Passenger Management | Level 2 (Alto) | Ola 3B | `passenger_search_controller`, `passenger_photo_controller`, `ink_passenger_handler_controller` | `passenger`, `passenger_document`, `passenger_loyalty` |
| 11 | FIDS | Level 0 (Bajo) | Ola 1 | `fids_flight_controller`, `fids_machine_controller`, `fids_page_controller` | `fids_machine`, `fids_page`, `fids_page_element` |
| 12 | Turnaround / Ops | Level 0 (Bajo) | Ola 1 | `turnaround_plan_controller`, `turnaround_event_controller` | `turnaround_plan`, `turnaround_event` |
| 13 | Vehículos / GSE | Level 0 (Bajo) | Ola 1 | `vehicle_controller`, `vehicle_allocation_controller` | `vehicle`, `vehicle_allocation`, `vehicle_model` |
| 14 | Health / COVID | Level 0 (Bajo) | Ola 1 | `health_country_document_controller`, `health_product_controller` | `health_*` schemas |
| 15 | Financial / Pagos | — (Medio) | Ola 4 | `financial_transaction_controller`, `cart_controller`, `currency_controller` | `financial_transaction`, `cart`, `cc_transaction` |

### Tablas DB de mayor acoplamiento (blockers para extracción modular)

| Tabla | Módulos | Riesgo | Estrategia |
|---|---|---|---|
| `scheduled_flight` | 12+ módulos | **CRÍTICO** | Flight Data Service (Ola 0) — Read API + event sourcing |
| `passenger` | 9+ módulos | **CRÍTICO** | Passenger Core Service (Ola 0) — API interna única |
| `boarding_pass` | 3 módulos escritores | Alto | Boarding Pass Service (Ola 0) — ownership único |
| `seat_allocation` | 4 módulos (3 escritores) | Alto | Seat Service con mutex lógico (Ola 0) |
| `passenger_apis` | 3 módulos | Medio | Co-extracción con APIS/Border module |

---

## 5. Catálogo de integraciones externas

### Integraciones de alta criticidad (bloqueantes para la reescritura)

| Sistema | Protocolo | Flujo | Módulo(s) | Criticidad | Reescritura |
|---|---|---|---|---|---|
| **CUPPS/CUTE** | TCP propietario (broker) | Bidireccional | CUPPS, Check-in, Boarding, CUSS | **Crítica** | CUPPS HAL en Ola 0 — todos los módulos Layer 2 dependen de él |
| **SITA BaggageService** | SOAP/WSDL (91 stubs en `modules/cuws/`) | Consumidor | Baggage+SSBD | **Crítica** | Envolver en cliente moderno (Ola 2) |
| **APIS/Gobierno** | HTTP + EDI (PNRGOV) | Emisor | APIS/Border | **Crítica (regulatorio)** | Mantener exactamente — solo envolver interfaz (Ola 4) |
| **WS API (móvil)** | HTTP/JSON (10 versiones v3.7–v3.18) | Expuesta | Todos los módulos core | **Crítica** | Consolidar 12 variantes back → 1 endpoint versionado (Ola 2) |
| **RabbitMQ** | AMQP via MQ Gateway custom (`mq_client/`) | Bidireccional | Varios | Alta | Reemplazar con php-amqplib + worker estándar |
| **Redis** | Redis protocol | Interno | QueuedJobs, Cache | Alta | Mantener — abstraer en capa de infra |
| **WebSocket/Node.js** | Socket.io (`websockets/`) | Interno | Departure Control | **Alta** | Migrar simultáneamente con DC (Ola 5) |
| **BigQuery** | HTTP/REST (`modules/Logs/BQHandler.php`) | Emisor | Analytics/DCS | Alta | Mantener — abstraer en servicio de logging |
| **Radixx PSS** | HTTP/SOAP | Consumidor | Check-in, Boarding | Alta | Wrapper en Check-in module (Ola 3B) |
| **Amadeus (AFKLM)** | HTTP (`amadeus_afklm_passenger_controller`) | Consumidor | Passenger | Alta | Wrapper en Passenger module |

### Integraciones de criticidad media

| Sistema | Protocolo | Módulo | Nota |
|---|---|---|---|
| **Stripe / Worldline** | HTTP/REST | Financial | Wrappers modernos disponibles |
| **Xero** | OAuth/REST (`xero/`) | Financial | SDK oficial PHP disponible |
| **Twilio** | HTTP/REST | Notificaciones | Controlador específico sin identificar |
| **Timatic** | HTTP | APIS/Border | Verificación de documentos de viaje |
| **EDIFACT** | Archivo/EDI (`edifact_router/`) | Flight Mgmt | In-tree — extraer a servicio |
| **Apple Wallet** | HTTP/PKPass (`passbook/`) | Boarding | Mantener en módulo Boarding |
| **iOS Attestation** | HTTP (`attest_ios_libs/`) | Móvil | phpseclib vendorizado |
| **gRPC** | gRPC (`includes/grpc/`) | Desconocido | ⚠️ Target no identificado — requiere investigación |

---

## 6. Multitenancy y autenticación

### Mecanismo actual

```
HTTP Request → hostname → get_current_company_key($_SERVER['SERVER_NAME'])
    → carrier_key → webci/{carrier}/config.php
    → carga configuración por carrier
```

- **Tipo**: Shared Database, Row-Level Isolation — la tabla `carrier` es el discriminador de tenant
- **11+ tenants** en `webci/` (`webci/aerom/`, `webci/aeroperu/`, `webci/jet2/`, etc.)
- **Variantes documentadas**: Jet2 CUSS (`cuss_selfcheckin_jet2_kiosk_controller`), Wizz Air CUSS, APIS Colombia vs Ecuador, Ancillaries Pribas/StandardV1/StandardV2
- **Feature flags**: `ici_has_covid_section` y similares — implementación ad hoc, no sistema centralizado

### Sistema de autenticación/autorización (RBAC custom)

**Entry points**: `login.php`, `login_auth.php`, `login_cute.php`  
**Tablas RBAC**: `user`, `user_session`, `user_token`, `user_role`, `user_group`, `user_associated_role`, `user_associated_station`, `carrier_user`

**Efectivo auth = Usuario + Rol + Estación + Aerolínea**

**Crítico para la reescritura**: `load_session()` está llamado en 156+ controladores legacy — NO hay middleware central. No separable sin refactor de middleware completo.

**Ruta de extracción**: Auth Service con JWT, propagando `user_id/carrier_key/station_id` como headers de request. `user_token` (tabla existente) es el seed para auth moderna.

---

## 7. Arquitectura del nuevo sistema

### Backend — microservicios per-feature, no per-dominio upfront

Sin diseño global de bounded contexts a priori. Cada feature migrada vive en `core_dcs` como handler nuevo. Los servicios emergen agrupando features que comparten ownership de tablas. Tecnología: TypeScript por defecto.

**Premisa de co-existencia**: routing/proxy decide per-route si va a legacy PHP o nuevo handler. Switching por (carrier, ruta, %tráfico).

### Frontend — 5 capas de customización

```
Capa 0 — Config-as-data       (≈60% de pedidos) — campos, validaciones, copy, workflow steps
Capa 1 — Theme tokens         (≈15%) — logo, colores, fonts
Capa 2 — Feature flags        (≈10%) — activar/desactivar features por carrier
Capa 3 — Component slots      (≈10%) — extensión declarativa sin fork
Capa 4 — Plugin de código     (≈5%) — último recurso, review obligatorio, SDK público
```

**Regla invariante**: un pedido de carrier solo sube de capa si la inferior es genuinamente insuficiente.

**Adición frente a plan_definitivo** — Capa 1.5 (Regulación geográfica): los 96 `*_apis.class.php` se dividen en:
- Módulos de compliance por país (ortogonales al carrier — no van en carrier_config)
- Paquetes de integración CRS: `@dcs/integration-sabre`, `@dcs/integration-navitaire` (subtipo Capa 4)

### Multi-tenancy en el nuevo sistema

`tenant_id` se propaga en cada capa: HTTP middleware → Component context (`useTenant()`) → API calls → DB queries (`WHERE carrier_key=?`) → logs y métricas → tests parametrizados.

---

## 8. Pre-work obligatorio (antes del primer flip productivo)

### Backend

| # | Pre-work | Acción | Output |
|---|---|---|---|
| 3.1 | Inventario de duplicación API | `find_similar_code` por feature — agrupar 12 variantes en version clusters | `feature_table_ownership.json` → `api_version_clusters` |
| 3.2 | Baseline API (snapshot production-grade) | Capturar request/response/timing en los 92 endpoints (N≥10 por endpoint) | `golden/api/<endpoint>.json` |
| 3.3 | Matriz tabla→feature | `trace_call_path` + `side_effect_map` por endpoint | `feature_table_ownership.json` |
| 3.4 | Risk classifier con señales reales | God nodes de graphify + LOC + variantes API + departure_control touch | Risk scores per feature |
| 3.5 | Conversión a OpenAPI 3.0 | Convertir 92 endpoints MD a OpenAPI | `openapi/cloud_2.yaml` |
| **3.4b** | **Dynamic instantiation scanner** *(nuevo)* | Grep de strings que coincidan con nombres de clases conocidas (blind spot del AST) | `class_name → [callsites_dinamicos]` |
| **3.4c** | **XCache → APCu migration** *(urgente, nuevo)* | Reemplazar `xcache_set/xcache_get` en `ink_autoload()` con APCu | `ink_autoload()` funcional en PHP 8.2 — **antes de cualquier migración** |
| **3.4d** | **WS API version audit** *(nuevo)* | Mapear qué carriers consumen qué versión de ws_class (12 variantes) y qué versiones de WS API móvil (v3.7–v3.18) activas en producción | Matriz carrier × versión activa |
| 3.13 | Bridge node analysis | Extraer top-50 bridges del grafo, clasificar en utility/domain/antipattern | `bridge_classification.json` + módulo `legacy_helpers/` |

### Frontend

| # | Pre-work | Output |
|---|---|---|
| 3.6 | View Crawler (asset & reference discovery) | `golden/views/<screen>/<carrier>/<state>.json` |
| 3.7 | Translation/message template extractor | `translations_per_carrier.json` |
| 3.8 | Static asset inventory | `asset_manifest.json` |
| 3.9 | Customization inventory | `unique_screens_per_carrier.csv` (486 pantallas únicas por carrier — no es diff bidireccional) |

### Infraestructura

| # | Pre-work | Nivel autonomía |
|---|---|---|
| 3.10 | Routing/proxy layer (Nginx / CF Workers) | L1 — setup humano una vez |
| 3.11 | Session/cookie compatibility | L2 — validación de seguridad humana |
| 3.12 | Tenant resolution unificado | L1 — diseño inicial humano; después L5 |
| **3.14** | **Auth Service bootstrap** *(nuevo)* | L2 — definir contratos JWT, roles, estaciones antes de migrar cualquier módulo Level 2 |
| **3.15** | **CUPPS HAL interface** *(nuevo)* | L1 — definir la interfaz del Hardware Abstraction Layer antes de Ola 1 |

---

## 9. Estrategia de migración

### Alineación Olas (módulos) ↔ Tiers (features)

| Ola | Descripción | Módulos | Tier Backend | Tier Frontend |
|---|---|---|---|---|
| **Ola 0** | Servicios compartidos (pre-requisito universal) | Passenger Core Service, Flight Data Service, Boarding Pass Service, Seat Service, CUPPS HAL | B0 (read paths) + B2 (writes) | F0 (APIs internas) |
| **Ola 1** | Módulos Level 0 — sin dependencia a departure_control | FIDS, Vehicles/GSE, Health/COVID, Turnaround | B1 (read-only baja entropía) | F0 (read-only, dashboards) |
| **Ola 2** | Módulos Level 1 — dependencia indirecta | Baggage+SSBD, WS API (consolidar 12→1) | B2 (writes con ownership claro) | F1 (formularios sencillos) |
| **Ola 3A** | Level 2 — periféricos de hardware | CUPPS/Periféricos, CUSS Kiosk | B2/B3 | F1/F2 |
| **Ola 3B** | Level 2 — core del check-in | Check-in, Boarding, Seating, Passenger Mgmt | B2/B3 | F2 (wizards multi-step) |
| **Ola 4** | Level 2 — módulos especializados | W&B/AHM, APIS/Border, Financial, Crew | B2/B3 | F2/F3 |
| **Ola 5** | Núcleo | Flight Management → Departure Control (**ÚLTIMO**) | B3 (writes con coordinación) | F3 (operacionales críticas) |

### Tiers backend (basado en señales del código)

- **Tier B0** — Pilots: ≤3 variantes API, ≤5 tablas, 100% read-only, BR ≤10. Pilot: `GET /api/1.8/flight/block_seats`.
- **Tier B1** — Read-only baja entropía: solo lecturas, ≤3 tablas.
- **Tier B2** — Writes con ownership claro: ninguna otra feature no-migrada escribe sus tablas.
- **Tier B3** — Writes que comparten tablas: recién aquí se diseñan eventos/sagas entre features migradas.
- **Indefinido**: `departure_control_controller` — se desensambla extrayendo features individuales, no como bloque.

### Orden de extracción con integraciones involucradas

| Ola | Pre-requisitos | Integraciones a resolver |
|---|---|---|
| Ola 0 | — (primero absoluto) | CUPPS/CUTE protocol definition |
| Ola 1 | Flight Data Read API | Ninguna crítica |
| Ola 2 | Passenger Service, Flight Service | SITA BaggageService SOAP (91 stubs), WS API móvil (consolidación) |
| Ola 3A | CUPPS HAL, Passenger Service | CUPPS/CUTE hardware |
| Ola 3B | Passenger Service, Flight Service, Boarding Pass Service, Seat Service | CUPPS hardware, Radixx PSS, Amadeus |
| Ola 4 | Passenger Service, Flight Service | SITA (APIS), Timatic, Stripe/Worldline, Xero |
| Ola 5 (Flight Mgmt) | Todos los módulos Ola 1-4 | Radixx PSS, SSIM, EDIFACT |
| Ola 5 (Departure Control — ÚLTIMO) | Todos + WebSocket rewrite | WebSocket/Node.js, BigQuery, todos los periféricos |

---

## 10. Framework de verificación

### Verifier 6/6 — Backend / API

| Señal | Tool | Umbral pass |
|---|---|---|
| Contract | OpenAPI diff | 0 breaking changes |
| DOM | DOM hash + similarity | similarity ≥ 0.99 |
| Visual | pixel diff | <0.5% pixels diferentes |
| Behavior | replay traffic | response equality 100% en N=1,000 captures |
| Perf | latency p99 | p99_new ≤ p99_legacy × 1.10 |
| Concurrency | parallel captures | 0 race conditions en N=100 runs |

**Regla**: 6/6 verde = promote. Cualquier rojo = rollback automático + quarantine.

### Verifier 8/8 por carrier — Frontend

| Señal | Umbral |
|---|---|
| DOM structure | similarity ≥ 0.99, test IDs al 100% |
| Visual regression | <0.5% pixels diff en 3 viewports × N carriers |
| Accessibility (axe-core) | 0 violations nuevas |
| i18n completeness | 0 claves sin traducir por carrier activo |
| Asset integrity | 0 4xx/5xx en assets cargados |
| Behavior (Playwright) | 100% happy path + edge per carrier |
| Perf (Lighthouse) | LCP/CLS/TBT no degradan >10% |
| Tenancy isolation | 0 leaks cross-tenant |

**Regla front**: 8/8 verde por carrier = promote para ese carrier. Una pantalla puede estar migrada para 3 carriers y en legacy para 2.

---

## 11. Hotspots — riesgo para la reescritura

| # | Hotspot | Tipo | Ola impactada | Estrategia de migración |
|---|---|---|---|---|
| 1 | `departure_control_controller` | Clase (21,488 LOC) | Ola 5 | Desensamblar por features — no migrar como bloque. ÚLTIMO. |
| 2 | `.row()` clase base ORM | Clase (deg=16,611) | Pre-work 3.13 + B2 | ORM extraction antes de Tier B2. Handlers nuevos no heredan de `.row()`. |
| 3 | `passenger.class.php` + tabla `passenger` | Clase + Tabla | Ola 0 | Passenger Core Service — API interna única antes de cualquier extracción Level 2 |
| 4 | `scheduled_flight` (tabla) | Tabla (12+ módulos) | Ola 0 | Flight Data Service — read API y event sourcing |
| 5 | `boarding_pass` (3 escritores) | Tabla | Ola 0 | Boarding Pass Service — ownership único |
| 6 | `seat_allocation` (3 escritores) | Tabla | Ola 0 | Seat Service con mutex lógico |
| 7 | `ink_cupps_broker` | Clase (80 conexiones) | Ola 0 | Hardware Abstraction Layer — interfaz estable para todos los Level 2 |
| 8 | WS API 12 variantes | Clases (×12 copias) | Ola 2 | Consolidar en 1 endpoint con versionado por header. Auditar activos por carrier. |
| 9 | WebSocket/Node.js stack | Infraestructura | Ola 5 | Migrar simultáneamente con Departure Control — no separable |
| 10 | XCache obsoleto | Dependencia | **Pre-work urgente** | Reemplazar con APCu ANTES de cualquier migración — posible bug activo en PHP 8.2 |
| 11 | Instanciación dinámica | Antipatrón | Pre-work 3.4b | Dynamic instantiation scanner — el grafo estático no lo captura |
| 12 | `*_apis.class.php` (96 clases, 3 ejes) | Módulo mezclado | Ola 3B/4 | Separar en: módulos de compliance por país + paquetes `@dcs/integration-<crs>` |

---

## 12. Modelo de autonomía (resumen)

**Default: L4–L5 (autónomo).** El humano solo entra en 8 puntos específicos:

| Punto humano | Cuándo | Frecuencia estimada |
|---|---|---|
| 1. Setup inicial infra + tenant resolver | Una vez | 1 total |
| 2. Implementar handler nuevo | Per feature | 2/semana |
| 3. Diagnose tras rollback | Post-rollback | <1/semana |
| 4. Diseñar slot nuevo (contrato versionado) | Cuando surge | <1/mes |
| 5. Review de plugin Capa 4 | Por carrier | <1/mes |
| 6. Diseñar evento/saga cross-feature | Solo Tier B3 | <1/mes |
| 7. Bump major del SDK público | Breaking change | 1–2/año |
| 8. Circuit breaker (rollback rate >20% en 8 sem) | Excepción | 0–1/año |

**Tiempo humano estimado en estado estable**: ~20h/semana (1 dev parcial + arquitecto on-call).

**Automatizado por diseño** (sin revisión humana): selección de feature, pre-flip checklist, promote si 6/6 verde, rollback automático, aplicación de config/theme/flag, hot-reload Capa 0, cross-tenant isolation tests.

---

## 13. Pilot concreto — primer flip productivo

### Backend: `GET /api/1.8/flight/block_seats`

- Función: `includes/ws_v1.8/ws_flight.class.php:921`
- 16 funciones relacionadas trazables
- Race condition documentada → buen test de concurrencia
- Failure mode = double-booking (detectable)

**Pre-flip checklist**:
- [ ] XCache resuelto (pre-work 3.4c) — sin este paso no hay flip
- [ ] OpenAPI extraído
- [ ] Baseline N≥1,000 captures
- [ ] `feature_table_ownership` extraído
- [ ] Variantes activas en otras versiones de ws_class identificadas (pre-work 3.4d)
- [ ] Handler nuevo en `core_dcs` pasando 6/6 en shadow mode
- [ ] Rollback validado

**Criterio de éxito**: 14 días producción, 0 rollbacks, 0 race conditions, p99 ≤ legacy × 1.10.

### Frontend: pantalla de dashboard / listado read-only

- Read-only, baja customización entre carriers
- Valida la matriz de capas 0–3 con carriers reales

---

## 14. Métricas de éxito

### Backend (reportar cada 4 semanas)
1. Features migradas: count + % tráfico en handler nuevo
2. Rollbacks: count + root cause
3. Tablas con ownership resuelto: count / 827 activas
4. Variantes API consolidadas post-migración
5. God class footprint: LOC restante en `departure_control_controller` (objetivo: 0 antes de mes 18)

### Frontend
6. Distribución customizaciones por capa (objetivo: ≥75% en Capa 0–2 a los 12 meses)
7. Time-to-customize: <1 día Capa 0, <3 días Capa 1–3
8. Customer-blocking changes: <2/mes
9. Carrier divergence: % diff visual entre carriers en misma pantalla
10. Test matrix coverage: 100% (pantallas migradas × carriers)

### Grafo (adición de este plan)
11. Graph cohesion (intra/cross community ratio) — debe aumentar con el tiempo
12. Bridge node degree decay — top-10 bridges deben decrecer
13. `.row()` reach: features migradas que aún heredan de `.row()` — objetivo: 0

**Circuit breaker**: rollback rate >20% en 8 semanas → pausa de migración automática.

---

## 15. Reglas no negociables — consolidado

| # | Regla | Scope |
|---|---|---|
| 1 | Cero "vision documents" como autoridad — el orchestrator descubre el código real | Backend |
| 2 | Cero refactor del monolito sin feature en flip | Backend |
| 3 | Cero migración de tablas sin feature owner migrada o en flip activo | Backend |
| 4 | Cero `if carrier === X` en código del core | Frontend |
| 5 | Cero copia de archivo completo para customizar | Frontend |
| 6 | Cero overrides "temporales" — Capa 4 tiene fecha de revisión a 6 meses | Frontend |
| 7 | Cero deuda invisible — cada customización enumerable vía CLI | Frontend |
| 8 | Cero divergencia silenciosa — theme/config/flags validados contra schema en CI | Frontend |
| 9 | Cero acceso a internals desde plugins — solo SDK público | Frontend |
| 10 | Cero pantalla migrada sin matrix de tests por carrier | Frontend |
| 11 | Cero rollback manual — el verifier dispara automáticamente | Operación |
| 12 | Cero promote sin soak de 14 días en producción con tráfico real | Operación |
| 13 | Cero deprecation de handlers legacy hasta 100% tráfico en handler nuevo ≥30 días | Operación |
| **14** | **XCache resuelto (APCu) antes del primer flip** *(nuevo)* | Pre-work |
| **15** | **CUPPS HAL interface definida antes de migrar cualquier módulo Level 2** *(nuevo)* | Arquitectura |

---

## 16. Lo que NO se hace en este plan

- No se diseña arquitectura target completa antes de migrar
- No se eligen tecnologías per-servicio antes de 3 features migradas
- No se promete timeline de 12 meses — el throughput es features/semana
- No se construyen sagas ni EventBridge hasta que dos features migradas necesiten coordinarse
- No se desploma el monolito — cloud_2 queda como fallback ≥6 meses post-migración
- No se eliminan los `view_template_custom/` actuales sin reemplazo validado
- No se permite a un carrier auto-publicar plugins (review obligatorio)

---

## 17. Ítems que requieren verificación manual antes de comenzar

1. **gRPC target**: `includes/grpc/` — ¿qué servicio externo consumen estos stubs? No identificado.
2. **Twilio**: controlador específico no localizado — confirmar módulo propietario.
3. **Roles RBAC**: lista completa de roles definidos en `user_role` — requiere consulta a DB.
4. **Versiones de ws_class activas**: cuáles de las 12 variantes tienen tráfico real de producción.
5. **gRPC y WebSocket en DC**: si `includes/grpc/` apunta a un servicio externo que Departure Control necesita, este es un blocker no documentado para Ola 5.

---

## 18. Resumen ejecutivo

**Plan consolidado = análisis de dominio (ACA-2962: 15 módulos, 25+ integraciones, multitenancy, auth) + arquitectura de migración (plan_definitivo: orchestrator iterativo, 5 capas de customización, verifiers 6/6 y 8/8, autonomía L4–L5).**

La migración tiene dos god nodes que dicen cuándo termina: cuando el LOC de `departure_control_controller` llega a 0 y cuando `.row()` reach decae a 0 — ambos como consecuencia de las features migradas, no como objetivos directos de refactor.

**Comenzar por Ola 0** (servicios compartidos) antes de cualquier extracción modular. El primer flip productivo recomendado es `GET /api/1.8/flight/block_seats` (Tier B0, pilot validado). **XCache → APCu es pre-work urgente** — posible bug activo en producción que bloquea cualquier otra acción.

La migración termina cuando:
- Los 92 endpoints sirven desde handlers nuevos con ≥30 días sin rollbacks
- Las pantallas operacionales están en el nuevo front para todos los carriers activos
- ≥75% de customizaciones viven en Capa 0–2
- `departure_control_controller` tiene 0 LOC restante
- Graph cohesion aumenta consistentemente

Hasta entonces, cloud_2 corre como fallback. El orchestrator descubre la realidad iterativamente — el grafo de graphify alimenta directamente el risk_classifier y el code_analyzer.

---

*Artefactos de referencia: `.planning/phases/` (ACA-2962) | `docs/plan_definitivo.md` (plan original)*
