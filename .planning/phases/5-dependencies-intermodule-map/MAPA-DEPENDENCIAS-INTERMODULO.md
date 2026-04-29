---
plan: "05-02"
phase: 5-dependencies-intermodule-map
generated_at: 2026-04-29
data_source: >
  LIMITES-MODULOS.md, SCOPE-MODULOS.md, MODULOS-CANDIDATOS.md, CATALOGO-INTEGRACIONES.md,
  DEPENDENCIAS-EXTERNAS.md (todos derivados de P2C session 795eedb2bd7c41538670d46cc1e11ff4).
  departure_control_controller en el centro — 24 dependencias directas confirmadas via P2C.
---

# MAPA-DEPENDENCIAS-INTERMODULO.md — Mapa Completo de Dependencias entre Módulos

> **Metodología**: Mapa construido desde afuera hacia adentro — `departure_control` en el centro (24 dependencias directas, confirmadas P2C). Datos de dependencias de clase provienen de LIMITES-MODULOS.md; datos DB de SCOPE-MODULOS.md; integraciones externas de CATALOGO-INTEGRACIONES.md.

---

## Referencias de Clases entre Módulos

> Tipo: **Class** = un módulo instancia/llama clase de otro; **DB** = comparten tabla; **Context** = opera bajo mismo contexto de ejecución DCS; **Ext** = dependencia a sistema externo

| Módulo Origen | Clase Origen | Módulo Destino | Clase Destino | Tipo de Referencia |
|---|---|---|---|---|
| Check-in | `ajax_responder_controller::process_do_checkin()` | **Departure Control (Núcleo)** | `departure_control_controller` | Class |
| Check-in | `webci_controller::dispatch()` | Passenger Management | `passenger.class.php` | Class + DB |
| Check-in | `webci_controller::dispatch()` | Flight Management | `scheduled_flight_controller` | DB |
| Check-in | `checkin_passenger_controller` | Seating | `seat_master::seat_group_of_passenger()` | Class |
| Check-in | `checkin_passenger_controller` | Boarding | `boarding_pass` (tabla compartida) | DB ⚠️ CIRCULAR |
| Check-in | `webci_controller` | CUSS Kiosk | `checkin_passenger_controller` (compartido) | Class ⚠️ CIRCULAR |
| Check-in | `login_service.class.php` | Auth/Usuarios | `user`, `carrier_user` | DB |
| Check-in | — | CUPPS/Periféricos | `ink_cupps_broker` (hardware para agentes) | Class |
| Check-in | `webci/{tenant}/config.php` | Multitenancy | `company_key` / `carrier` | Context |
| CUSS Kiosk | `cuss_selfcheckin_kiosk_controller` | Check-in | `checkin_passenger_controller` | Class ⚠️ CIRCULAR |
| CUSS Kiosk | `kiosk_session_controller` | Passenger Management | `passenger` | DB |
| CUSS Kiosk | `kiosk_session_controller` | Flight Management | `scheduled_flight` | DB |
| CUSS Kiosk | `bq_departure_control_session` | **Departure Control (Núcleo)** | `departure_control_controller` | Context |
| CUSS Kiosk | `ink_cuss_broker` | CUPPS/Periféricos | `ink_cupps_broker` | Class |
| CUSS Kiosk | `cuss_selfcheckin_jet2_kiosk_controller` | — | Tenant Jet2 override | Context |
| Boarding | `boarding_tab_controller` (constructor) | **Departure Control (Núcleo)** | `departure_control_controller` | Class |
| Boarding | `boarding_gate_controller` | Passenger Management | `passenger` | DB |
| Boarding | `boarding_gate_controller` | Flight Management | `scheduled_flight` | DB |
| Boarding | `boarding_gate_controller` | Check-in | `boarding_pass` (lee la generada por check-in) | DB ⚠️ CIRCULAR |
| Boarding | `boarding_gate_controller` | CUPPS/Periféricos | `ink_cupps_broker` (scanner en puerta) | Class |
| Baggage/BRS | `baggage_scan_controller` | **Departure Control (Núcleo)** | `departure_control_controller` | Class |
| Baggage/BRS | `baggage_drop_controller` | Passenger Management | `passenger` | DB |
| Baggage/BRS | `baggage_scan_controller` | Flight Management | `scheduled_flight` | DB |
| Baggage/BRS | `bags_cloud_controller` | — | Amazon S3 | Ext |
| Baggage/BRS | `brs_report_controller` | — | SITA BaggageService SOAP | Ext |
| Seating | `seat_master::seat_group_of_passenger()` | **Departure Control (Núcleo)** | `departure_control_controller` | Class |
| Seating | `zone_balanced_seating` | **Departure Control (Núcleo)** | `departure_control_controller` | Class |
| Seating | `seat_controller` | Passenger Management | `passenger`, `seat_allocation` | DB |
| Seating | `cabin_configuration_controller` | Flight Management | `scheduled_flight` | DB |
| Seating | `airplane.class.php` | **Departure Control (Núcleo)** | `get_airplane_options_for_departure_control()` | Class |
| W&B / AHM | `ahm_controller` | **Departure Control (Núcleo)** | `departure_control_controller` (output DCS) | Context |
| W&B / AHM | `loadsheet_controller` | Seating | `cabin_passengers_distribution` | DB |
| W&B / AHM | `ahm_controller` | Passenger Management | `passenger` (via flight) | DB |
| W&B / AHM | `ahm_controller` | Flight Management | `scheduled_flight` | DB |
| WS API | `ws_passenger::validate_pax_attributes` | Passenger Management | `passenger.class.php` | Class |
| WS API | `ws_flight` | Flight Management | `scheduled_flight` | DB |
| WS API | `ws_seat_plan` | Seating | `seat_allocation` | DB |
| WS API | `ws_boarding_pass` | Boarding | `boarding_pass` | DB |
| WS API | `ws_baggage_tag` | Baggage/BRS | `baggage_tag` | DB |
| WS API | `web_service_master` | Auth/Usuarios | `user_token` | DB |
| WS API | — | — | Mobile apps (expone) | Ext |
| APIS/Border | `border_control_departure_controller` (constructor) | **Departure Control (Núcleo)** | `departure_control_controller` | Class |
| APIS/Border | `apis_matrix_report_controller` | Passenger Management | `passenger_apis` | DB |
| APIS/Border | `convert_pnrgov_controller` | Flight Management | `scheduled_flight` | DB |
| APIS/Border | `pnrgov_generator` | — | PNRGOV/Gobierno | Ext |
| APIS/Border | `timatic_controller` | — | Timatic IATA | Ext |
| CUPPS/Periféricos | `ink_cupps_broker::get_xml_event()` | **Departure Control (Núcleo)** | `departure_control_controller` | Context |
| CUPPS/Periféricos | `cupps_transaction_controller` | Passenger Management | `passenger` | DB |
| CUPPS/Periféricos | `cupps_connection_controller` | Auth/Usuarios | `station` (via carrier) | DB |
| Passenger Mgmt | `passenger::can_be_checked_in()` | **Departure Control (Núcleo)** | `departure_control_controller` | Class |
| Passenger Mgmt | `passenger::copy_from_passenger_for_transfer()` | **Departure Control (Núcleo)** | `departure_control_controller` | Class |
| Passenger Mgmt | `passenger.class.php` | Flight Management | `scheduled_flight` | DB |
| Flight Mgmt | `flight.class.php::get_boarding_groups_for_departure_control()` | **Departure Control (Núcleo)** | `departure_control_controller` | Class ⚠️ CIRCULAR |
| Flight Mgmt | `flight.class.php::load_flight_item_keys()` | **Departure Control (Núcleo)** | `departure_control_controller` | Class ⚠️ CIRCULAR |
| Flight Mgmt | `scheduled_flight_controller` | — | Radixx PSS | Ext |
| Flight Mgmt | `generate_ssim_controller` | — | SSIM (IATA format) | Ext |
| FIDS | `fids_flight_controller` | Flight Management | `scheduled_flight` (solo lectura) | DB (read-only) |
| Turnaround | `turnaround_plan_controller` | Flight Management | `scheduled_flight` | DB |
| Turnaround | `turnaround_report_controller` | **Departure Control (Núcleo)** | analytics DCS (indirecto) | Context |
| Vehicles/GSE | `vehicle_allocation_controller` | Flight Management | `scheduled_flight` | DB |
| Health/COVID | `health_*_controller` | Passenger Management | `passenger` | DB (read-only) |
| Departure Control (Núcleo) | `departure_control_controller` | Flight Management | `scheduled_flight` (co-núcleo) | Class ⚠️ CIRCULAR |
| Departure Control (Núcleo) | `bq_departure_control_screen` | — | Google BigQuery | Ext |
| Departure Control (Núcleo) | `amazon_bucket_export` | — | Amazon S3 | Ext |
| Departure Control (Núcleo) | — | WebSocket/Node.js | real-time UI updates | Ext |
| Crew | `crew_controller::get_departure_control_instance()` | **Departure Control (Núcleo)** | `departure_control_controller` | Class |
| TouchSuite | `touch_suite_handler_controller::get_controller_instance()` | **Departure Control (Núcleo)** | `departure_control_controller` | Class |

---

## Tablas DB Compartidas (Alto Acoplamiento)

| Tabla | Módulos que la Usan | Tipo de Uso | Riesgo de Separación |
|---|---|---|---|
| `scheduled_flight` ⚠️⚠️⚠️ | Departure Control, Flight Mgmt, Check-in, CUSS, Boarding, Baggage/BRS, Seating, W&B, APIS/Border, Turnaround, FIDS (R), Vehicles (R), WS API | **Múltiples escritores** | **Alto** — hub de todos los módulos operacionales. Candidato a Flight Data Service compartido. |
| `passenger` ⚠️⚠️⚠️ | Departure Control, Check-in, CUSS, Boarding, Baggage/BRS, APIS/Border, CUPPS, WS API, Health (R), Turnaround (R) | **Múltiples escritores** | **Alto** — entidad central. Candidato a Passenger Core Service. |
| `boarding_pass` ⚠️⚠️ | Check-in (genera), Boarding (actualiza), WS API (lee/genera mobile) | **Múltiples escritores** (Check-in + WS API generan, Boarding actualiza) | **Alto** — 3 módulos con escritura. Candidato a Boarding Pass Service. |
| `seat_allocation` ⚠️⚠️ | Seating (asigna), Check-in (asigna en check-in), CUSS (asigna en kiosk), WS API (lee/asigna) | **Múltiples escritores** (3 módulos asignan asientos) | **Alto** — conflict de concurrencia. Candidato a Seat Service con mutex. |
| `baggage_tag` ⚠️ | Baggage/BRS (genera), WS API (lee), Boarding (lee en embarque) | 1 escritor, múltiples lectores | **Medio** — Baggage/BRS tiene ownership claro. |
| `passenger_apis` ⚠️ | Passenger Mgmt (define), APIS/Border (usa), Check-in (valida) | 1 escritor principal, múltiples lectores | **Medio** — Passenger Mgmt tiene ownership, APIS la lee. |
| `cabin_configuration` ⚠️ | Seating (CRUD), W&B (lectura), WS API (lectura) | 1 escritor (Seating) | **Medio** — ownership en Seating, lectores secundarios. |
| `cupps_transaction` ⚠️ | CUPPS (genera), Check-in (via broker), Boarding (via broker) | CUPPS tiene ownership | **Bajo** — encapsulado en CUPPS module. |
| `kiosk_session` | CUSS (CRUD exclusivo) | 1 escritor | **Bajo** — propiedad exclusiva de CUSS. |
| `turnaround_plan` | Turnaround (CRUD exclusivo), DC (lectura analytics) | 1 escritor | **Bajo** — propiedad Turnaround, DC solo analytics. |

---

## Hotspots de Mayor Riesgo para la Reescritura

### `departure_control_controller.class.php`
- **Tipo**: Clase — Orquestador del sistema
- **Ruta real**: `includes/departure_control_controller.class.php`
- **Módulos afectados**: Check-in (via ajax_responder), Boarding (boarding_tab_controller), CUSS (analytics context), W&B/AHM (output context), APIS/Border (border_control_departure), Crew (get_departure_control_instance), TouchSuite (get_controller_instance), Passenger (can_be_checked_in), Flight (get_boarding_groups_for_departure_control), Seating (seat_group_of_passenger, zone_balanced_seating), airplane (get_airplane_options_for_departure_control), analytics (bq_departure_control_screen/session), anti_xss (validate_vars_departure_control), Amazon S3 (reduce_seat_plan), webborders
- **Complejidad de migración**: Alta
- **Nota de migración**: Migrar ÚLTIMO. Ningún módulo Level 2 puede extraerse sin primero definir una API de orquestación DCS. La migración de este módulo es el proyecto final del rewrite — requiere que todos los otros módulos ya tengan APIs internas.
- **Evidencia**: P2C `search_files content:"departure_control_controller"` — 24 referencias directas confirmadas (session 795eedb2).

### `passenger.class.php` + tabla `passenger`
- **Tipo**: Clase + Tabla DB
- **Ruta real**: `includes/passenger.class.php` / `schemas/passenger.schema.php`
- **Módulos afectados**: Check-in, Boarding, CUSS, Baggage/BRS, APIS/Border, CUPPS, WS API, Health, Turnaround
- **Complejidad de migración**: Alta
- **Nota de migración**: Extraer como **Passenger Core Service** antes de migrar cualquier módulo Level 2. El servicio expone: `can_be_checked_in()`, `copy_from_passenger_for_transfer()`, búsqueda, actualización. Todos los módulos Level 2 llaman a este servicio via API interna en lugar de instanciar `passenger.class.php` directamente.
- **Evidencia**: FK a `passenger` en 9+ schemas distintos documentados en SCOPE-MODULOS.md.

### `scheduled_flight` (tabla)
- **Tipo**: Tabla DB — hub de datos de vuelo
- **Ruta real**: `schemas/scheduled_flight.schema.php`
- **Módulos afectados**: Todos los módulos operacionales (12+)
- **Complejidad de migración**: Alta
- **Nota de migración**: Extraer como **Flight Data Service** con read API antes de migrar Level 1 y Level 2. Los módulos que solo leen (`scheduled_flight_key`) reciben flight context via evento o API call. Los módulos que escriben (Flight Management, DC) mantienen ownership en el servicio.
- **Evidencia**: FK en 25+ schemas en SCOPE-MODULOS.md.

### `boarding_pass` (tabla con múltiples escritores)
- **Tipo**: Tabla DB — shared write
- **Ruta real**: `schemas/boarding_pass.schema.php`
- **Módulos afectados**: Check-in (genera), Boarding (actualiza estado), WS API (genera mobile boarding pass)
- **Complejidad de migración**: Media
- **Nota de migración**: Crear **Boarding Pass Service** con ownership único. Check-in solicita boarding pass al servicio, WS API solicita boarding pass al servicio. Boarding actualiza estado via API. Elimina la dualidad de escritura.
- **Evidencia**: Marcada como "Compartida ⚠️" en tanto Check-in como Boarding en SCOPE-MODULOS.md.

### `seat_allocation` (tabla con 3 escritores)
- **Tipo**: Tabla DB — shared write (3 módulos)
- **Ruta real**: `schemas/seat_allocation.schema.php`
- **Módulos afectados**: Seating (asigna), Check-in (asigna durante check-in), CUSS (asigna en kiosk), WS API (asigna via mobile)
- **Complejidad de migración**: Media
- **Nota de migración**: Crear **Seat Service** con mutex lógico de asignación. Solo Seat Service puede asignar/desasignar asientos. Check-in, CUSS, WS API solicitan asignación al Seat Service — elimina race conditions.
- **Evidencia**: `schemas/seat_allocation.schema.php` marcada "Compartida" con FK a passenger, scheduled_flight, seat (SCOPE-MODULOS.md).

### `ink_cupps_broker.class.php`
- **Tipo**: Clase — Hub de hardware aeroportuario
- **Ruta real**: `includes/ink_cupps_broker.class.php`
- **Módulos afectados**: Check-in (agentes en mostrador), Boarding (scanner en puerta), CUSS (hardware kiosk), CUPPS module
- **Complejidad de migración**: Media
- **Nota de migración**: Abstraer como **CUPPS Hardware Service** (Hardware Abstraction Layer). Los módulos de negocio (Check-in, Boarding, CUSS) llaman al HAL para comandos de hardware — no conocen detalles CUPPS. Facilita el cambio de protocolo de hardware sin tocar módulos de negocio.
- **Evidencia**: P2C export_core_network — 80 edges, 2do más conectado del sistema (session 795eedb2).

### `ws_passenger.class.php::validate_pax_attributes` (10 versiones)
- **Tipo**: Función en 10 versiones paralelas
- **Ruta real**: `includes/ws_v{1.1-1.9}/ws_passenger.class.php`
- **Módulos afectados**: WS API (consumido por todas las versiones del mobile API)
- **Complejidad de migración**: Alta
- **Nota de migración**: Consolidar 10 versiones en 1 con versionado por header (`Accept-Version`). `validate_pax_attributes` debe convertirse en endpoint centralizado. Las 10 versiones activas simultáneamente son un riesgo de mantenimiento crítico.
- **Evidencia**: P2C export_core_network — 132-142 connections, nodo más conectado del sistema (session 795eedb2).

### WebSocket / Node.js (dependencia externa a Departure Control)
- **Tipo**: Integración externa — infraestructura real-time
- **Ruta real**: `ws_api.php`, `node_server_communications.php`, `websockets/client/socket.io.js`
- **Módulos afectados**: Departure Control (pantalla DCS en tiempo real)
- **Complejidad de migración**: Alta
- **Nota de migración**: La pantalla DCS depende de real-time updates. Al migrar Departure Control, el stack WebSocket debe migrarse simultáneamente o mantenerse como servicio de infraestructura compartida. No se puede hacer una migración gradual sin un plan claro de real-time.
- **Evidencia**: CATALOGO-INTEGRACIONES.md — WebSocket criticidad Alta.

---

## Resumen del Mapa de Dependencias

**Métricas:**
- Total de dependencias entre módulos documentadas: **58** (class + DB entre módulos)
- Tablas DB compartidas: **10** (4 de alto riesgo)
- Hotspots de alta complejidad: **7**
- Par de módulos con mayor acoplamiento: **Departure Control ↔ Flight Management** (circular, co-núcleo)

**Módulos más acoplados (mayor a menor):**

| Módulo | Deps Salientes | Deps Entrantes | Nivel de Acoplamiento |
|---|---|---|---|
| **Departure Control** | 5 (modules) | 14+ (24 refs totales) | **Máximo — Núcleo** |
| **Flight Management** | 3 (ext) | 12+ (todos leen scheduled_flight) | **Máximo — Co-núcleo** |
| **Passenger Management** | 1 (departure_control) | 9 (todos los ops) | **Muy Alto** |
| **WS API** | 5 (passenger, flight, seating, boarding, baggage) | 0 (solo expone) | **Alto** |
| **Check-in** | 6 (DC, passenger, flight, seating, boarding_pass, CUSS) | 2 (CUSS, boarding) | **Alto** |
| **CUSS Kiosk** | 5 (checkin, passenger, flight, DC, CUPPS) | 1 (checkin) | **Alto** |
| **Boarding** | 5 (DC, passenger, flight, boarding_pass, CUPPS) | 1 (check-in via boarding_pass) | **Alto** |
| **Seating** | 4 (DC x3, passenger, flight) | 3 (check-in, CUSS, WS API) | **Alto** |
| **APIS/Border** | 3 (DC, passenger, flight) + 2 ext | 0 | **Medio** |
| **Baggage/BRS** | 3 (DC, passenger, flight) + 2 ext | 1 (SSBD) | **Medio** |
| **W&B / AHM** | 4 (DC, seating, passenger, flight) | 0 | **Medio** |
| **CUPPS/Periféricos** | 3 (DC context, passenger, station) | 3 (checkin, boarding, CUSS) | **Medio** |
| **Turnaround** | 2 (flight, DC analytics) | 0 | **Bajo** |
| **Vehicles/GSE** | 1 (flight) | 0 | **Bajo** |
| **Health/COVID** | 1 (passenger) | 0 | **Bajo** |
| **FIDS** | 1 (flight, read-only) | 0 | **Muy Bajo** |

**Módulos más independientes (candidatos para reescritura prioritaria):**
1. **FIDS** — 1 dependencia (scheduled_flight, solo lectura). Extracción inmediata posible.
2. **Vehicles/GSE** — 1 dependencia (vehicle_allocation → scheduled_flight). Extracción inmediata posible con Flight Data Read API.
3. **Health/COVID** — 1 dependencia (passenger, solo validación). Feature-gated por `ici_has_covid_section`.
4. **Turnaround** — 2 dependencias débiles (flight lectura, DC analytics). Extracción con Flight Data Read API.

**Orden sugerido de reescritura basado en acoplamiento:**

| Ola | Módulos | Pre-requisito |
|---|---|---|
| **Ola 0 — Servicios Compartidos** | Passenger Core Service, Flight Data Service, Boarding Pass Service, Seat Service, CUPPS HAL | Ninguno — primero |
| **Ola 1 — Level 0** | FIDS, Vehicles/GSE, Health/COVID, Turnaround | Flight Data Read API (de Ola 0) |
| **Ola 2 — Level 1** | Baggage/BRS + SSBD, WS API (consolidar versiones) | Passenger Service, Flight Service (de Ola 0) |
| **Ola 3 — Level 2A** | CUPPS/Periféricos, CUSS Kiosk | CUPPS HAL, Passenger Service, Check-in API (de Ola 3B) |
| **Ola 3 — Level 2B** | Check-in, Boarding, Seating | Passenger Service, Flight Service, Boarding Pass Service, Seat Service |
| **Ola 4 — Level 2C** | W&B/AHM, APIS/Border, Crew | Passenger Service, Flight Service, DC API (pre-release) |
| **Ola 5 — Núcleo** | Flight Management, Departure Control | Todos los módulos anteriores con APIs internas definidas |

