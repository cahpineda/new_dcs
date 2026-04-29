---
plan: "02-03"
phase: 2-functional-module-identification
generated_at: 2026-04-29
data_source: >
  SCOPE-MODULOS.md (P2C session 795eedb2bd7c41538670d46cc1e11ff4) + MODULOS-CANDIDATOS.md.
  P2C unavailable para nuevas consultas en esta sesión (índice cloud_2 no disponible).
  Dependencias documentadas desde evidencia de sesión previa verificada.
---

# LIMITES-MODULOS.md — Límites, Dependencias y Validación Final de Módulos

> **Metodología**: Dependencias derivadas de SCOPE-MODULOS.md (16 módulos con DB scope completo, P2C session 795eedb2...). Las dependencias DB-layer son directamente trazables a schemas. Las dependencias class-layer citan el controlador/método específico confirmado en la sesión anterior.

---

## Dependencias Cruzadas

> Tipo de dependencia: **DB** = comparten tabla; **Class** = un módulo instancia/llama a clase de otro; **Context** = opera bajo mismo contexto de ejecución

| Módulo Origen | Depende de | Qué usa | Tipo de Dependencia |
|---|---|---|---|
| Check-in | Flight Management | `scheduled_flight` (FK en `checkin_transaction`) | DB |
| Check-in | Passenger Management | `passenger` (FK en `checkin_transaction`, `app_form_passenger`) | DB |
| Check-in | Seating | `seat_allocation` (lee/asigna asiento durante check-in) | DB |
| Check-in | Departure Control | `departure_control_controller` via `ajax_responder::process_do_checkin()` | Class |
| Check-in | Boarding | Comparte tabla `boarding_pass` (Check-in genera, Boarding lee) | DB ⚠️ CIRCULAR |
| CUSS Kiosk | Flight Management | `scheduled_flight` (FK en `kiosk_session`) | DB |
| CUSS Kiosk | Passenger Management | `passenger` (FK en `kiosk_session_passenger`) | DB |
| CUSS Kiosk | Check-in | `checkin_passenger_controller` — CUSS es canal de check-in | Class ⚠️ CIRCULAR |
| CUSS Kiosk | Departure Control | `bq_departure_control_session` registra sesiones kiosk bajo DCS | Context |
| CUSS Kiosk | CUPPS | `ink_cuss_broker` gestiona hardware kiosk CUSS | Class |
| Boarding | Flight Management | `scheduled_flight` (FK en `boarding_transaction`, `boarded_passenger`, `boarding_gate`) | DB |
| Boarding | Passenger Management | `passenger` (FK en `boarding_transaction`, `boarded_passenger`) | DB |
| Boarding | Check-in | Lee `boarding_pass` generado por Check-in | DB ⚠️ CIRCULAR |
| Boarding | Departure Control | `boarding_tab_controller` recibe instancia DCS en constructor | Class |
| Boarding | CUPPS | Hardware scanners gestionados por `ink_cupps_broker` | Class |
| Baggage/BRS | Flight Management | `scheduled_flight` (FK en `baggage_scan`, `baggage_carousel`, `brs_container_flight`) | DB |
| Baggage/BRS | Passenger Management | `passenger` (FK en `baggage_scan`, `baggage_tag`) | DB |
| Baggage/BRS | Departure Control | Departure control gestiona estado de equipaje (direct reference) | Class |
| Bag Drop (SSBD) | Flight Management | `scheduled_flight` (FK en `bag_drop_transaction`) | DB |
| Bag Drop (SSBD) | Passenger Management | `passenger` (FK en `bag_drop_transaction`, `baggage_photo`) | DB |
| Bag Drop (SSBD) | Baggage/BRS | SSBD alimenta pipeline BRS — comparte tags de equipaje | DB |
| Seating | Flight Management | `scheduled_flight` (FK en `cabin_passengers_distribution`) | DB |
| Seating | Passenger Management | `passenger` (FK en `seat_allocation`) | DB |
| Seating | Departure Control | `seat_master::seat_group_of_passenger()` + `zone_balanced_seating` opera bajo DCS | Class |
| W&B / AHM | Flight Management | `scheduled_flight` (FK en `ahm`) | DB |
| W&B / AHM | Seating | Lee distribución de cabina (`cabin_passengers_distribution`) para cálculo de CG | DB |
| W&B / AHM | Passenger Management | Lee asignaciones de pasajeros para loadsheet | DB |
| W&B / AHM | Departure Control | AHM/loadsheet son outputs de pantalla DCS | Context |
| WS API | Passenger Management | `passenger` — todas las versiones consultan este modelo | DB + Class |
| WS API | Flight Management | `scheduled_flight` — todas las versiones consultan vuelos | DB |
| WS API | Seating | `seat_allocation` — WS API lee/actualiza asientos | DB |
| WS API | Boarding | `boarding_pass` — consulta y genera pases | DB |
| WS API | Baggage/BRS | `baggage_tag` — consulta tags equipaje | DB |
| FIDS | Flight Management | `scheduled_flight` — solo lectura para pantallas informativas | DB (read-only) |
| APIS/Border | Passenger Management | `passenger_apis` (compartida — Passenger la define, APIS la usa) | DB |
| APIS/Border | Flight Management | `scheduled_flight` (FK en `border_movement`, `attendee`) | DB |
| APIS/Border | Departure Control | `border_control_departure_controller` obtiene instancia DCS | Class |
| CUPPS | Passenger Management | `passenger` (FK en `cupps_transaction`) | DB |
| Turnaround | Flight Management | `scheduled_flight` (FK en `turnaround_plan`) | DB |
| Vehicles/GSE | Flight Management | `scheduled_flight` (FK en `vehicle_allocation`) | DB (única dep.) |
| Health/COVID | Passenger Management | `passenger` (referencia para validaciones sanitarias) | DB (read-only) |

**Dependencias bidireccionales confirmadas (⚠️ CIRCULAR)**:

| Par de Módulos | Descripción del Ciclo |
|---|---|
| **Check-in ↔ Boarding** | Check-in genera `boarding_pass`; Boarding la lee y actualiza estado. Ambos escriben en tabla compartida. |
| **Check-in ↔ CUSS** | CUSS usa `checkin_passenger_controller` de Check-in. CUSS es un canal de check-in con hardware. |
| **Departure Control ↔ Flight Management** | Flight.php::get_boarding_groups_for_departure_control() alimenta DCS; DCS usa scheduled_flight_controller para estado de vuelo. |

---

## Hotspots de Alta Complejidad

Un hotspot es cualquier elemento referenciado por 3+ módulos, tabla con múltiples escritores, o servicio con lógica de múltiples dominios mezclados.

### `departure_control_controller.class.php`
- **Tipo**: Clase
- **Ruta real**: `includes/departure_control_controller.class.php`
- **Módulos afectados**: Check-in, Boarding, CUSS (contexto), W&B/AHM, APIS/Border, FIDS (contexto), Flight Management, + 18 más (24 referencias directas confirmadas por P2C)
- **Complejidad de migración**: Alta
- **Nota de migración**: Migrar ÚLTIMO. Requiere que todos los módulos Level 2 ya tengan API de orquestación. No extraíble en ninguna ola anterior.
- **Evidencia**: P2C export_core_network session 795eedb2 — 24 archivos referencian directamente esta clase.

### `passenger.class.php`
- **Tipo**: Clase + Tabla `passenger`
- **Ruta real**: `includes/passenger.class.php` / `schemas/passenger.schema.php`
- **Módulos afectados**: Check-in, Boarding, CUSS, Baggage/BRS, SSBD, APIS/Border, CUPPS, WS API, Health
- **Complejidad de migración**: Alta
- **Nota de migración**: Candidato a "Core Domain Service" compartido. No duplicar por módulo — su lógica de dominio (`can_be_checked_in()`, `copy_from_passenger_for_transfer()`) es transversal. Estrategia: extraer como servicio de pasajero independiente con API interna antes de migrar Level 2.
- **Evidencia**: FK a `passenger` en 9+ schemas distintos (SCOPE-MODULOS.md).

### `scheduled_flight` (tabla)
- **Tipo**: Tabla DB
- **Ruta real**: `schemas/scheduled_flight.schema.php`
- **Módulos afectados**: Check-in, Boarding, Baggage, CUSS, W&B, APIS, Turnaround, FIDS, Vehicles, WS API, Flight Management, Departure Control
- **Complejidad de migración**: Alta
- **Nota de migración**: "Servicio de vuelo compartido" — no se puede duplicar. Estrategia: mantener como tabla central hasta que todos los módulos tengan APIs de lectura. Al migrar, convertir en microservicio de Flight Data con event sourcing (flight_status_changed events).
- **Evidencia**: FK en 25+ schemas documentados en SCOPE-MODULOS.md.

### `boarding_pass` (tabla — escritura múltiple)
- **Tipo**: Tabla DB con múltiples escritores
- **Ruta real**: `schemas/boarding_pass.schema.php` / `schemas/boarding_pass_number.schema.php`
- **Módulos afectados**: Check-in (genera), Boarding (actualiza), WS API (consulta y genera mobile)
- **Complejidad de migración**: Media
- **Nota de migración**: Dos módulos **escriben** en esta tabla → alto riesgo de race conditions al separar. Estrategia: extraer como "Boarding Pass Service" con ownership claro. Check-in y WS API deberán llamar a este servicio vía API interna.
- **Evidencia**: `schemas/boarding_pass.schema.php` marcada como "Compartida" en tanto Check-in como Boarding (SCOPE-MODULOS.md).

### `seat_allocation` (tabla — escritura múltiple)
- **Tipo**: Tabla DB con múltiples escritores
- **Ruta real**: `schemas/seat_allocation.schema.php`
- **Módulos afectados**: Seating (asigna), Check-in (asigna durante checkin), CUSS (asigna en kiosk), WS API (lee/asigna mobile)
- **Complejidad de migración**: Media
- **Nota de migración**: 3 módulos distintos escriben asientos → conflict resolution al separar es crítico. Estrategia: Seating como "Seat Service" con mutex lógico. Check-in y CUSS llaman a Seat Service para asignar.
- **Evidencia**: `schemas/seat_allocation.schema.php` marcada "Compartida" con FK a passenger, scheduled_flight, seat (SCOPE-MODULOS.md).

### `ink_cupps_broker.class.php`
- **Tipo**: Clase
- **Ruta real**: `includes/ink_cupps_broker.class.php`
- **Módulos afectados**: Check-in (agentes usan periféricos), Boarding (scanner de documentos), CUSS (kiosk hardware), CUPPS module
- **Complejidad de migración**: Media
- **Nota de migración**: Hub de hardware — 80 conexiones (2do más conectado P2C). Abstraer como "Hardware Abstraction Layer" o CUPPS microservice. Módulos de negocio no deben conocer detalles CUPPS.
- **Evidencia**: P2C export_core_network session 795eedb2 — 80 edges en grafo de core network.

### `ws_passenger::validate_pax_attributes` (función)
- **Tipo**: Función
- **Ruta real**: `includes/ws_v{N}/ws_passenger.class.php` (10 versiones)
- **Módulos afectados**: WS API (hub), Passenger, Seating, Boarding
- **Complejidad de migración**: Alta
- **Nota de migración**: El nodo de código más conectado del sistema (132-142 conexiones). Existe en 10 versiones paralelas (v1.1–v1.9). Al migrar WS API, esta función debe ser extraída como endpoint de validación central. Las 10 versiones deben consolidarse o mantenerse como fachada versionada.
- **Evidencia**: P2C export_core_network session 795eedb2 — 132-142 connections en grafo de core network.

---

## Lista Final de Módulos Validada

> Basada en análisis de dependencias y hotspots. Dos módulos se **fusionan** (SSBD → Baggage/BRS). Total: 15 módulos + 1 núcleo.

### Decisión de fusión:
- **Bag Drop (SSBD) → fusionado con Baggage/BRS**: SSBD es el canal físico de ingreso de equipaje. Comparte dominio de negocio (baggage_tag, bag_drop_transaction alimenta a BRS), entry points físicamente próximos, y la separación añadiría acoplamiento artificial. Bajo DDD = mismo bounded context.

| # | Módulo | Descripción | Nivel Acoplamiento | Nota de Riesgo |
|---|---|---|---|---|
| 0 | **Departure Control** | Orquestador DCS — núcleo del sistema | **Núcleo** | Migrar último — 24 dependencias directas |
| 0 | **Flight Management** | Gestión de vuelos programados (`scheduled_flight`) | **Núcleo** | Co-núcleo con DC — tabla scheduled_flight referenciada por todos |
| 1 | Check-in de Pasajeros | Web check-in y check-in de agente | **Alto** | Circular con CUSS y Boarding; shared boarding_pass |
| 2 | CUSS / Kiosk | Kioscos autoservicio (check-in channel) | **Alto** | Circular con Check-in; requiere Hardware Abstraction Layer |
| 3 | Boarding & Gate | Embarque en puerta | **Alto** | Circular con Check-in (boarding_pass); instancia DCS directa |
| 4 | Baggage & BRS + SSBD | Gestión de equipaje y bag drop | **Medio** | Multiple writers en baggage_tag; scheduled_flight + passenger hub |
| 5 | Seating / Seat Map | Asignación y mapa de asientos | **Alto** | seat_allocation — 3 módulos escriben; departure_control directo |
| 6 | Weight & Balance / AHM | Loadsheet y balance de carga | **Alto** | Output directo de pantalla DCS; depende de Seating + Passenger |
| 7 | Web Service API | API móvil (v1.1–v1.9+, 70 archivos) | **Alto** | Hub técnico (132 conexiones); 10 versiones paralelas sin consolidar |
| 8 | APIS / Border Control | Validación documentos y control frontera | **Medio** | departure_control instancia directa; passenger_apis compartida |
| 9 | CUPPS / Periféricos | Hardware de aeropuerto (CUTE/CUPPS) | **Alto** | 80 conexiones; dep de Check-in, Boarding, CUSS simultáneamente |
| 10 | Passenger Management | Entidad transversal de pasajero | **Alto** | `passenger.class.php` referenciada por 9 módulos — candidata a Core Service |
| 11 | FIDS | Pantallas de información de vuelo | **Bajo** | Solo lectura de scheduled_flight — Level 0 limpio |
| 12 | Turnaround / Ops Tierra | Eventos de turnaround de avión | **Bajo** | Solo FK a scheduled_flight; analytics DCS indirecto |
| 13 | Vehículos / GSE | Gestión de vehículos de tierra | **Bajo** | Una sola FK: vehicle_allocation → scheduled_flight |
| 14 | Health / COVID | Validación sanitaria de pasajeros | **Bajo** | Solo referencia passenger para validación |

### Módulos Nivel 0 — Extracción Inmediata

| Módulo | Motivo | Riesgo |
|---|---|---|
| FIDS | Sin departure_control, sin escrituras en tablas compartidas | Bajo |
| Turnaround | Solo FK a scheduled_flight (lectura de contexto) | Bajo |
| Vehículos/GSE | Una sola FK débil a scheduled_flight | Bajo |
| Health/COVID | Solo passenger (validación, no operacional) | Bajo |

### Módulos a Preparar antes de Extraer Level 2

Antes de poder extraer Check-in, Boarding, CUSS, Seating, W&B, APIS/Border, CUPPS:

1. **Passenger Service API**: `passenger.class.php` debe ser servicio interno con API antes que cualquier módulo Level 2 migre.
2. **Flight Data API**: `scheduled_flight` debe ser servicio interno de lectura antes que módulos externos lo necesiten.
3. **Boarding Pass Service**: Resolver dualidad Check-in↔Boarding en escritura de `boarding_pass`.
4. **Seat Service**: Resolver escritura múltiple de `seat_allocation`.
5. **Hardware Abstraction Layer**: `ink_cupps_broker` debe ser servicio antes que Check-in, Boarding, CUSS migren.

