---
ticket: ACA-2962
proyecto_padre: ACA-2961 — DCS System Rewrite Strategy
generado: 2026-04-29
estado_criterios: 8/9 cumplidos (criterio 9 requiere aprobación humana)
herramienta_analisis: project2context MCP (sesión 795eedb2bd7c41538670d46cc1e11ff4)
repositorio_analizado: https://github.com/inkaviation/cloud_2 (branch main, commit a0dde8702dc)
analista: Sistema automatizado — Ink Innovation Agent (ACA-2962)
---

# Análisis del Monolito cloud_2

**Ticket:** ACA-2962 | **Fecha:** 2026-04-29 | **Estado:** Análisis Completo — Pendiente Aprobación Tech Lead

---

## 1. Resumen Ejecutivo

**cloud_2** es el DCS (Departure Control System) monolítico de Ink Aviation, implementado en **PHP 8.2+** con arquitectura MVC custom (sin framework estándar). Es un sistema de escala industrial:

| Métrica | Valor |
|---|---|
| Módulos indexados | **5,362** (P2C) |
| Clases | **2,357** |
| Funciones | **31,576** |
| Entidades totales | **33,933** |
| Controladores legacy | 200+ (`includes/*.class.php`) |
| Schemas de DB | 300+ (`schemas/*.schema.php`) |
| Tenants activos | 11+ aerolíneas |
| Versiones API móvil | 10 (v3.7.0–v3.18.0) |

**Multitenancy**: Shared Database, Row-Level Isolation — el tenant se resuelve por hostname HTTP (`get_current_company_key($_SERVER['SERVER_NAME'])`). La entidad `carrier` (aerolínea) es el discriminador de tenant. Sin framework de multitenancy — implementación custom en PHP puro.

**Integraciones externas**: **25+ sistemas** catalogados. Las 3 más críticas para la operación:
1. **CUPPS/CUTE** — hardware de aeropuerto (80 conexiones en grafo P2C). Sin CUPPS no hay operación en mostrador.
2. **SITA BaggageService SOAP** — reconciliación de equipaje regulatoria (91 stubs WSDL).
3. **APIS/Gobierno** — legalmente obligatorio en todos los países con vuelos internacionales.

**Top 3 hotspots de mayor riesgo para la reescritura**:
1. `departure_control_controller.class.php` — 24 dependencias directas, orquestador del sistema. Migrar ÚLTIMO.
2. `passenger.class.php` + tabla `passenger` — 9+ módulos dependen de esta entidad. Requiere Passenger Core Service antes de cualquier extracción modular.
3. `scheduled_flight` (tabla) — referenciada por 12+ módulos. Requiere Flight Data Service antes de migrar módulos Level 1/2.

**Recomendación de reescritura**: Comenzar con **Ola 0** (servicios compartidos: Passenger Core, Flight Data, Boarding Pass, Seat, CUPPS HAL). Los módulos Level 0 (FIDS, Vehicles, Health, Turnaround) pueden extraerse inmediatamente después. Departure Control se migra ÚLTIMO — después de que todos los módulos Level 2 tengan APIs internas.

---

## 2. Estructura del Repositorio y Framework

### Stack Tecnológico

| Componente | Valor |
|---|---|
| Lenguaje | PHP 8.2+ |
| Framework web | **Sin framework** — MVC custom en PHP puro |
| Framework REST | **Slim Framework** (`rest/index.php` únicamente) |
| Frontend | **jQuery** + PHP inline templates (`view_template_custom/`) |
| Base de datos | MySQL / MariaDB |
| Cache | XCache (⚠️ obsoleto) + LocalCache custom (`modules/Cache/`) |
| Cola de trabajos | Redis + sistema custom (`modules/QueuedJobs/`) |
| Mensajería | RabbitMQ via MQ Gateway custom (`mq_client/`) |
| WebSockets | Node.js + Socket.io (`websockets/`) |
| Analytics | Google BigQuery (`modules/Logs/BQHandler.php`) |
| gRPC | Stubs en `includes/grpc/` (destino no identificado) |
| Autoloader | Custom `ink_autoload()` con eval() fallback (`includes/local_functions.php:54-129`) |

### Arquitectura — Dos Capas

**Capa Legacy** (`includes/*.class.php`): Controladores flat con patrón dispatch-by-step.

```
[entry_point.php] → new {Controller}($params) → dispatch()
    → convert_url_parameters() → load_session()
    → switch($current_step): case 'step_name' → handle_step()
    → render_view($next_step)
```

Sin tabla de rutas explícita. Estado mantenido en sesión PHP entre requests.

**Capa Moderna** (`modules/`): PSR-4-like con namespaces, sin Composer.

| Módulo | Archivos | Propósito |
|---|---|---|
| `modules/cuws/` | 155 | SOAP stubs SITA BaggageService |
| `modules/Mobile/` | 38 | API móvil (v3.7.0–v3.18.0) |
| `modules/Ancillaries/` | 28 | Ancillaries (Pribas, StandardV1, StandardV2) |
| `modules/QueuedJobs/` | 12 | Job queue Redis |
| `modules/Logs/` | 8 | Logging + BigQuery |
| `modules/Cache/` | 5 | Caching layer |

### Mapa de Directorios

| Directorio | Propósito |
|---|---|
| `includes/` | 200+ controladores legacy (`*_controller.class.php`) |
| `modules/` | Módulos modernos PSR-4-like |
| `schemas/` | 300+ definiciones de tabla DB (ORM custom) |
| `view_template_custom/` | 195+ templates PHP/jQuery |
| `webci/` | Per-tenant web check-in overrides (`webci/{tenant}/config.php`) |
| `fids/` | FIDS autónomo (JS frontend) |
| `xero/` | Integración Xero (contabilidad OAuth) |
| `websockets/` | Node.js WebSocket server |
| `mq_client/` | MQ Gateway (RabbitMQ) |
| `csrfp/` | CSRF protection (vendorizado in-tree) |
| `voku_anti_xss/` | Anti-XSS library (vendorizado in-tree) |
| `big_query/` | BigQuery client PHP |
| `attest_ios_libs/` | iOS attestation (phpseclib) |
| `migrator/` | Scripts de migración de schema |
| `passbook/` | Apple Wallet boarding pass |
| `edifact_router/` | Router EDIFACT in-tree |
| `xadmin/` | Panel de administración interna |

### Convenciones de Nomenclatura

| Patrón | Capa | Ejemplo |
|---|---|---|
| `{name}_controller.class.php` | Legacy | `boarding_gate_controller.class.php` |
| `{name}.schema.php` | DB | `scheduled_flight.schema.php` |
| `{Name}.php` | Moderna | `AncillariesService.php` |
| `view_template_custom/{step}.php` | Views | `boarding_gate_view_template.php` |
| Tabla: `{ClassName}s`, PK: `{ClassName}_key` | DB | `flights`, PK: `flight_key` |

### Puntos de Entrada Principales

| Archivo | Tipo |
|---|---|
| `departure_control.php` | Pantalla DCS principal |
| `web_checkin.php` | Web check-in |
| `selfcheckin_kiosk_cuss_frame.php` | Kiosk CUSS estándar |
| `selfboarding.php` | Embarque autoservicio |
| `ssbd_handler.php` | Self-Service Bag Drop |
| `rest/index.php` | REST API (Slim Framework) |
| `ws_api.php` | WebSocket bridge |
| `login.php`, `login_auth.php`, `login_cute.php` | Autenticación |
| `process_job.php` / `queued_job_daemon.php` | Job daemon |
| `xadmin/index.php` | Admin panel |

---

## 3. Módulos Funcionales Identificados

### Lista Final de Módulos (15 + co-núcleo)

| # | Módulo | Nivel | Controladores (muestra) | Tablas Propias | Acoplamiento |
|---|---|---|---|---|---|
| N | **Departure Control** | Núcleo | `departure_control_controller`, `webborders_departure_controller`, `border_control_departure_controller` | `bq_departure_control_screen`, `bq_departure_control_session` | **Máximo** |
| N | **Flight Management** | Co-Núcleo | `scheduled_flight_controller`, `flight_dashboard_controller`, `flight_search_controller`, `delay_code_controller`, `generate_ssim_controller` | `scheduled_flight`, `action_flight`, `flight_authority`, `flight_register` | **Máximo** |
| 1 | Check-in de Pasajeros | Level 2 | `webci_controller`, `checkin_passenger_controller`, `check_passenger_controller`, `ajax_responder_controller` | `checkin_transaction`, `app_form_passenger`, `app_form_status` | **Alto** |
| 2 | CUSS / Kiosk | Level 2 | `cuss_selfcheckin_kiosk_controller`, `cuss_selfcheckin_jet2_kiosk_controller`, `cuss_selfcheckin_wizz_kiosk_controller`, `kiosk_session_controller` | `kiosk_session`, `kiosk_session_passenger`, `kiosk_session_screen`, `cuss_kiosk` | **Alto** |
| 3 | Boarding & Gate | Level 2 | `boarding_gate_controller`, `boarding_tab_controller`, `selfboarding_controller`, `boarded_passenger_controller` | `boarding_gate`, `boarding_transaction`, `boarded_passenger`, `boarding_group_list` | **Alto** |
| 4 | Baggage + SSBD | Level 1/2 | `baggage_scan_controller`, `baggage_carousel_controller`, `bags_cloud_controller`, `bag_drop_kiosk_controller` | `baggage_scan`, `baggage_tag`, `baggage_brs_tag`, `bag_drop_transaction` | **Medio** |
| 5 | Seating / Seat Map | Level 2 | `seat_controller`, `seat_master`, `seating_service`, `cabin_configuration_controller`, `zone_balanced_seating` | `seat`, `seat_allocation`, `cabin_configuration`, `airplane_cabin_configuration` | **Alto** |
| 6 | W&B / AHM | Level 2 | `ahm_controller`, `ahm560_controller`, `ahm560a1–d3` (18), `loadsheet_controller`, `ahm_envelope_controller` | `ahm`, `ahm560a1–d3` (18 schemas), `ahm_envelope`, `ahm_distribution` | **Alto** |
| 7 | Web Service API | Level 1 | `ws_v{N}/web_service_master` (10 vers.), `ws_v{N}/ws_passenger` (10 vers.) | Sin tablas propias — opera sobre DB compartida | **Alto** |
| 8 | APIS / Border Control | Level 2 | `apis_switch_controller`, `border_control_departure_controller`, `convert_pnrgov_controller`, `immigration_controller` | `border_movement`, `attendee`, `apis_switch` | **Medio** |
| 9 | CUPPS / Periféricos | Level 2 | `ink_cupps_broker`, `ink_cuss_broker`, `cute_listener_controller`, `cupps_connection_controller` | `cupps_connection`, `cupps_message`, `cupps_transaction` | **Medio** |
| 10 | Passenger Management | Level 2 | `passenger`, `passenger_search_controller`, `passenger_photo_controller`, `ink_passenger_handler_controller` | `passenger`, `passenger_document`, `passenger_status_change`, `passenger_loyalty` | **Alto** |
| 11 | FIDS | Level 0 | `fids_flight_controller`, `fids_machine_controller`, `fids_manager_controller`, `fids_page_controller` | `fids_machine`, `fids_page`, `fids_page_element` | **Bajo** |
| 12 | Turnaround / Ops | Level 0 | `turnaround_plan_controller`, `turnaround_event_controller`, `turnaround_report_controller` | `turnaround_plan`, `turnaround_event`, `turnaround_plan_event` | **Bajo** |
| 13 | Vehículos / GSE | Level 0 | `vehicle_controller`, `vehicle_allocation_controller`, `vehicle_history_controller` (8 ctrl.) | `vehicle`, `vehicle_allocation`, `vehicle_history`, `vehicle_model` | **Bajo** |
| 14 | Health / COVID | Level 0 | `health_country_document_controller`, `health_product_controller`, `health_tento_report_controller` (8 ctrl.) | `health_*` schemas | **Bajo** |
| 15 | Financial / Pagos | — | `financial_transaction_controller`, `cart_controller`, `currency_controller` | `financial_transaction`, `cart`, `cc_transaction`, `billing_transaction` | **Medio** |

### Tablas DB Compartidas (Puntos de Acoplamiento Máximo)

| Tabla | Módulos que la Usan | Riesgo |
|---|---|---|
| `scheduled_flight` ⚠️⚠️⚠️ | 12+ módulos | **CRÍTICO** |
| `passenger` ⚠️⚠️⚠️ | 9+ módulos | **CRÍTICO** |
| `boarding_pass` ⚠️⚠️ | 3 módulos (múltiples escritores) | Alto |
| `seat_allocation` ⚠️⚠️ | 4 módulos (3 escritores) | Alto |
| `passenger_apis` ⚠️ | 3 módulos | Medio |

---

## 4. Multitenancy y Autenticación

### Mecanismo de Multitenancy

**Tipo**: Shared Database + Row-Level Isolation por `carrier_key`

**Flujo de resolución de tenant**:
```
HTTP Request
    → $_SERVER['SERVER_NAME'] (ej: "avior.inkdcs.com")
    → get_current_company_key($hostname)   [includes/local_functions.php]
    → carrier_key = "avior"
    → $this->company = carrier loaded from DB
    → Todo el dispatch usa $this->company como contexto de tenant
```

**Sin framework de multitenancy** — implementación custom en cada controlador.

### Tenants Identificados (11+)

| Tenant | CUSS Variant |
|---|---|
| avior, airmalta, bermudair, amapola, ais, creebec | Estándar |
| jet2 | Variante propia (`cuss_selfcheckin_jet2_kiosk_controller`) |
| wizz | Variante propia (`cuss_selfcheckin_wizz_kiosk_controller`) |
| + 3 más | No identificados por nombre |

### Modelos Tenant-Aware

| Tipo | Tablas | Estado |
|---|---|---|
| Tenant root | `carrier`, `company` | ✅ Tenant root |
| Operacionales | `scheduled_flight`, `passenger`, `boarding_pass`, `seat_allocation`, etc. | ✅ Tenant-aware via FK transitiva |
| Catálogo global | `airplane_model`, `country`, `user_role` | ❌ Global |
| Feature flags | `app_configuration`, `business_rule` | ⚠️ Parcial |

### Variaciones por Cliente

1. **Config PHP**: `webci/{tenant}/config.php` (11+ archivos por tenant)
2. **Variantes CUSS**: 3 controladores distintos (estándar, Jet2, Wizz Air)
3. **Feature flags**: `ici_has_covid_section` y similares en config
4. **APIS por país**: variantes colombiana y ecuatoriana
5. **Ancillaries**: 3 variantes (Pribas, StandardV1, StandardV2)

### Sistema de Autenticación

**Tipo**: Session-Based Custom PHP — sin Laravel Auth, JWT, OAuth2

| Aspecto | Valor |
|---|---|
| Entry points | `login.php`, `login_auth.php`, `login_cute.php` |
| Mecanismo | PHP sessions (`load_session()` en cada controller dispatch) |
| CSRF | `csrfp/` (vendorizado in-tree) |
| XSS | `voku_anti_xss/` + `anti_xss.class.php` |
| Token API | `user_token` — para acceso REST API (Slim) |
| Auth CUTE | Separada — `login_cute.php` establece contexto de estación |

### Sistema RBAC

**Entidades auth** (schemas reales de P2C):
`user`, `user_session`, `user_token`, `user_role`, `user_group`, `user_associated_role`, `user_associated_station`, `carrier_user`

**Modelo de autorización efectivo** = Usuario + Rol + Estación + Aerolínea

**Controladores**: `user_controller`, `user_role_controller`, `user_session_controller`, `user_token_controller`

### Separabilidad del Auth

**No separable actualmente** — `load_session()` está en 156+ controladores sin middleware centralizado.

**Ruta recomendada**: Centralizar en Auth Service con JWT antes de cualquier extracción modular. El `user_token` (REST API) es la semilla de auth moderna.

---

## 5. Integraciones con Sistemas Externos

> **Total**: **25+ integraciones** catalogadas. **8 de alta criticidad**.

### Tabla Resumen Completa

| Sistema | Protocolo | Flujo | Módulo | Criticidad | Scope Tenants |
|---|---|---|---|---|---|
| CUPPS/CUTE | Binary CUPPS | Bidireccional | Check-in, Boarding, CUSS | **Alta** | Obligatoria |
| CUSS protocol | Binary CUSS | Bidireccional | CUSS Kiosk | Alta/Baja | Opcional |
| SITA BaggageService | SOAP/WSDL | Consume | Baggage/BRS | **Alta** | Obligatoria |
| APIS/Gobierno | EDIFACT/REST | Produce | APIS/Border | **Alta** | Obligatoria |
| Amadeus (AFKLM) | REST/SOAP | Consume | Check-in, Passenger | **Alta** | Tenants Amadeus |
| Radixx PSS | REST | Consume | Flight, Check-in | **Alta** | Tenants Radixx |
| EDIFACT Type B | EDIFACT | Bidireccional | APIS, Flight, Postmaster | **Alta** | Internacionales |
| RabbitMQ | AMQP | Bidireccional | Jobs/Background | **Alta** | Todos |
| Redis | Redis | Bidireccional | Jobs/Background | **Alta** | Todos |
| WebSocket/Node.js | WebSocket | Bidireccional | Departure Control | **Alta** | Todos |
| WS API Móvil (expone) | REST custom | Expone | WS API module | **Alta** | Todos |
| Google BigQuery | REST | Produce | Todos (analytics) | Media | Todos |
| Amazon S3 | REST | Produce | DC, Boarding | Media | Algunos |
| AWS Events | REST/HTTP | Consume/Produce | Infraestructura | Media | Todos |
| Stripe | REST | Consume | Financial | Media | Tenants con pago online |
| Worldline | REST/SOAP | Consume | Financial | Media | Tenants con pago en mostrador |
| Twilio | REST | Produce | Mensajería/Notificaciones | Media | Algunos |
| Xero | OAuth/REST | Bidireccional | Financial/Contabilidad | Media | Algunos |
| Timatic/IATA | REST/SOAP | Consume | APIS, Check-in | Media | Opcional |
| TouchSuite | HTTP tunneling | Bidireccional | CUPPS, DC | Media | Algunos |
| Zabbix | REST | Produce | Infraestructura | Baja | Todos |
| Passbook/Apple | REST | Produce | Check-in, Boarding | Baja | Opcional |
| SSIM/IATA | File-based | Produce | Flight Management | Media | Algunos |
| MODI/InkTouch | REST | Bidireccional | MODI module | Media | Algunos |
| gRPC (sin identificar) | gRPC | Consume | No determinado | ? | Requiere verificación |

> ⚠️ **Alta criticidad — bloqueantes para la reescritura**:
> - **CUPPS/CUTE**: 80 conexiones en grafo P2C. Debe convertirse en Hardware Abstraction Service antes de migrar Check-in, Boarding, CUSS.
> - **SITA BaggageService**: 91 archivos WSDL stubs. Encapsular en Baggage Integration Service antes de migrar Baggage/BRS.
> - **WebSocket/Node.js**: Pantalla DCS necesita real-time. Debe migrar junto con Departure Control (no antes ni después).
> - **WS API Móvil (10 versiones)**: Consolidar 10 versiones activas en 1 con versionado por header antes de migrar.

---

## 6. Dependencias e Inter-módulos

### Dependencias Externas Críticas (sin composer.json)

| Dependencia | Estado | Riesgo para Reescritura |
|---|---|---|
| **XCache** (PHP extension) | ⚠️ OBSOLETO — PHP 8.2 incompatible | Reemplazar por APCu en `ink_autoload()` URGENTE |
| **SITA WSDL stubs** (91 archivos) | In-tree sin versionado | Encapsular con wrapper antes de migrar BRS |
| **voku_anti_xss** (vendorizado) | Versión desconocida | Reemplazar con versión Composer en reescritura |
| **CSRFProtector** (vendorizado) | Sin actualizaciones automáticas | Reemplazar con middleware estándar |
| **gRPC stubs** | Destino no identificado | Requiere investigación manual |
| **MQ Gateway** (custom code) | Sin librería estándar AMQP | Reemplazar con php-amqplib |
| **jQuery** | Versión no verificada | Migrar a framework moderno por módulo |
| **Sin testing** en `includes/` | 0 cobertura en 156+ controladores | Escribir tests de caracterización antes de extraer |

### Mapa de Referencias de Clases entre Módulos

Las 58 dependencias documentadas están en `MAPA-DEPENDENCIAS-INTERMODULO.md`. Extracto de las más críticas:

| Módulo Origen | → | Módulo Destino | Via | Tipo |
|---|---|---|---|---|
| Check-in | → | **Departure Control** | `ajax_responder::process_do_checkin()` | Class |
| Boarding | → | **Departure Control** | `boarding_tab_controller` constructor | Class |
| CUSS | → | **Departure Control** | `bq_departure_control_session` | Context |
| Passenger Mgmt | → | **Departure Control** | `passenger::can_be_checked_in()` | Class |
| Flight Mgmt | ⟷ | **Departure Control** | `flight::get_boarding_groups_for_departure_control()` | Class ⚠️CIRCULAR |
| WS API | → | Passenger, Flight, Seating, Boarding, Baggage | Todas las tablas | DB |
| Check-in | ⟷ | Boarding | `boarding_pass` (tabla compartida) | DB ⚠️CIRCULAR |
| Check-in | ⟷ | CUSS | `checkin_passenger_controller` (compartido) | Class ⚠️CIRCULAR |

---

## 7. Hotspots y Riesgos para la Reescritura

| # | Hotspot | Tipo | Módulos Afectados | Complejidad | Estrategia de Migración |
|---|---|---|---|---|---|
| 1 | `departure_control_controller` | Clase | 14+ módulos (24 refs directas) | **Alta** | Migrar ÚLTIMO — requiere API de orquestación DCS |
| 2 | `passenger.class.php` + `passenger` tabla | Clase+Tabla | 9 módulos | **Alta** | Passenger Core Service (Ola 0) con API interna |
| 3 | `scheduled_flight` (tabla) | Tabla | 12+ módulos | **Alta** | Flight Data Service (Ola 0) — read API y event sourcing |
| 4 | `boarding_pass` (múltiples escritores) | Tabla | 3 módulos escriben | **Media** | Boarding Pass Service (Ola 0) — ownership único |
| 5 | `seat_allocation` (3 escritores) | Tabla | 4 módulos | **Media** | Seat Service con mutex lógico (Ola 0) |
| 6 | `ink_cupps_broker` | Clase | Check-in, Boarding, CUSS, CUPPS (80 cnx) | **Media** | Hardware Abstraction Layer (Ola 0) |
| 7 | `ws_passenger::validate_pax_attributes` | Función (×10) | WS API (132-142 cnx) | **Alta** | Consolidar 10 versiones — un endpoint con versionado por header |
| 8 | WebSocket/Node.js stack | Infra | Departure Control | **Alta** | Migrar simultáneamente con Departure Control (Ola 5) |
| 9 | XCache (obsoleto) | Dependencia | ink_autoload() — sistema completo | **Media** | Reemplazar con APCu ANTES de cualquier migración (bug activo) |

---

## 8. Orden Sugerido de Reescritura

> Principio: Del menos acoplado al más acoplado. Departure Control se migra ÚLTIMO.

| Ola | Módulos | Pre-requisitos | Integraciones Involucradas |
|---|---|---|---|
| **Ola 0** Servicios Compartidos | Passenger Core Service, Flight Data Service, Boarding Pass Service, Seat Service, CUPPS HAL | — (primero) | CUPPS/CUTE protocol |
| **Ola 1** Level 0 | FIDS, Vehicles/GSE, Health/COVID, Turnaround | Flight Data Read API (Ola 0) | Ninguna crítica |
| **Ola 2** Level 1 | Baggage+SSBD, WS API (consolidar 10→1 versión) | Passenger Service, Flight Service | SITA BaggageService SOAP, WS API móvil |
| **Ola 3** Level 2A | CUPPS/Periféricos, CUSS Kiosk | CUPPS HAL, Passenger Service | CUPPS/CUTE hardware |
| **Ola 3** Level 2B | Check-in, Boarding, Seating | Passenger Service, Flight Service, Boarding Pass Service, Seat Service | CUPPS hardware, Radixx PSS, Amadeus |
| **Ola 4** Level 2C | W&B/AHM, APIS/Border, Financial, Crew | Passenger Service, Flight Service | SITA (APIS), Timatic, Stripe/Worldline, Xero |
| **Ola 5** Núcleo | Flight Management | Todos los módulos previos | Radixx PSS, SSIM, EDIFACT |
| **Ola 5** Núcleo | **Departure Control** (ÚLTIMO) | Todos los módulos previos + WebSocket rewrite | WebSocket/Node.js, BigQuery, todos los periféricos |

**Complejidad estimada por módulo** (solo orientativa — requiere análisis de implementación):

| Módulo | Complejidad |
|---|---|
| FIDS, Vehicles, Health, Turnaround | Baja — pocos acoplamientos |
| Baggage+SSBD | Media — SITA SOAP complejo |
| WS API | Media-Alta — 10 versiones a consolidar |
| Check-in, Boarding, Seating | Alta — múltiples tablas compartidas |
| CUSS | Alta — variantes por tenant + hardware |
| W&B/AHM | Alta — 18 secciones AHM, cálculo CG |
| APIS/Border | Alta — regulatorio, variantes por país |
| Flight Management | Muy Alta — tabla más compartida |
| Departure Control | Máxima — orquestador de todo |

---

## Apéndice: Trazabilidad a Artefactos

| Sección | Artefacto Fuente | Fase |
|---|---|---|
| 2. Estructura y Framework | `ESTRUCTURA-REPO.md`, `FRAMEWORK.md`, `PUNTOS-ENTRADA.md` | Fase 1 |
| 3. Módulos Funcionales | `MODULOS-CANDIDATOS.md`, `SCOPE-MODULOS.md`, `LIMITES-MODULOS.md` | Fase 2 |
| 4. Multitenancy | `MULTITENANCY.md` | Fase 3 |
| 4. Auth/Authz | `AUTH.md` | Fase 3 |
| 5. Integraciones | `INTEGRACIONES-DESCUBIERTAS.md`, `CATALOGO-INTEGRACIONES.md` | Fase 4 |
| 6. Dependencias | `DEPENDENCIAS-EXTERNAS.md` | Fase 5 |
| 6-8. Mapa Inter-módulos, Hotspots, Orden | `MAPA-DEPENDENCIAS-INTERMODULO.md` | Fase 5 |

**Fuente primaria de datos**: project2context MCP, session `795eedb2bd7c41538670d46cc1e11ff4`, repositorio `https://github.com/inkaviation/cloud_2` (branch main, commit `a0dde8702dc7cd569e2351942bacf6d36b85eaf0`).

---

## Notas para el Tech Lead

### Metodología

Todos los datos provienen de **project2context (P2C) MCP**, un servicio de indexación semántica del repositorio. Las queries utilizadas fueron: `search_files`, `query_classes`, `query_functions`, `find_front_controllers`, `entrypoints_php_filtered`, `export_core_network`, `get_function_details`.

**Limitación técnica**: El índice de cloud_2 en P2C fue accesible solo durante la sesión `795eedb2bd7c41538670d46cc1e11ff4`. En sesiones posteriores, los tools basados en Neo4j (`query_dependencies`, `export_graph`) reportaron "not indexed". Las conclusiones de esta sesión posterior usaron evidencia de la sesión previa como base.

### Aspectos que Requieren Verificación Manual

1. **gRPC stubs**: `includes/grpc/` — ¿qué servicio externo consumen estos stubs? No identificado por P2C.
2. **Payment gateway específico**: `cc_transaction` sugiere Stripe/Worldline, confirmado por descripción P2C pero controlador específico no encontrado.
3. **XCache en PHP 8.2**: ¿Está actualmente dando error en producción? El `ink_autoload()` usa `xcache_set` — si XCache no está instalado, el fallback eval() sería el camino único.
4. **Versiones reales de librerías vendorizadas**: Verificar versiones de jQuery, CSRFProtector, voku_anti_xss para auditoría de seguridad.
5. **Twilio**: Encontrado en descripción P2C pero controlador específico no identificado en esta sesión.
6. **Lista completa de roles**: `user_role` schema existe pero los roles específicos definidos requieren consulta a DB o seeders.

### Próximos Pasos Recomendados (antes de iniciar reescritura)

1. **Urgente**: Resolver XCache en PHP 8.2 — posible bug activo en producción.
2. **Antes de Ola 0**: Definir APIs de Passenger Core Service, Flight Data Service — los contratos de API de Ola 0 son críticos para todas las olas posteriores.
3. **Antes de Ola 2**: Resolver consolidación de 10 versiones de WS API con el equipo mobile.
4. **Antes de Ola 5**: Planificar migración del stack WebSocket/Node.js — no se puede hacer después de migrar Departure Control.
5. **Investigar gRPC**: Identificar el servicio destino de `includes/grpc/` antes de planificar dependencias del núcleo.

### Referencias Cruzadas para Drill-Down

Todos los artefactos están en `.planning/phases/{N}-{nombre}/`. Los más detallados:
- `SCOPE-MODULOS.md` — scope completo FE/BE/DB por módulo con rutas reales
- `MAPA-DEPENDENCIAS-INTERMODULO.md` — 58 dependencias, tablas compartidas, hotspots
- `CATALOGO-INTEGRACIONES.md` — 19+ integraciones con atributos completos
- `AUTH.md` — RBAC, flujo de auth, separabilidad
- `MULTITENANCY.md` — mecanismo, tenants, variaciones, impacto por módulo

