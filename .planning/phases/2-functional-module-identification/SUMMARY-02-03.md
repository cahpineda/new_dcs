# Plan 02-03: Límites y Validación de Módulos — Resumen

**Límites de módulos validados. Lista final lista para análisis profundo.**

## Logros

- LIMITES-MODULOS.md creado con 38+ dependencias cruzadas documentadas entre módulos
- 3 dependencias bidireccionales (CIRCULAR) identificadas: Check-in↔Boarding, Check-in↔CUSS, DC↔Flight
- 7 hotspots de alta complejidad catalogados con estrategia de migración concreta
- Lista final validada: 15 módulos + 1 co-núcleo (Departure Control + Flight Management)
- Decisión de fusión: SSBD → Baggage/BRS (mismo bounded context, comparten dominio baggage)

## Lista Final de Módulos

| Nivel | Módulos (15 + núcleo) |
|---|---|
| **Núcleo** | Departure Control, Flight Management |
| **Level 2** (Alto) | Check-in, CUSS/Kiosk, Boarding, Seating, W&B/AHM, WS API, CUPPS, Passenger Mgmt |
| **Level 1** (Medio) | Baggage+SSBD, APIS/Border |
| **Level 0** (Bajo) | FIDS, Turnaround, Vehículos/GSE, Health/COVID |

## Hotspots Críticos Identificados

1. **`departure_control_controller`** — 24 referencias directas → migrar último
2. **`passenger.class.php`** — 9 módulos → Core Service antes de migrar Level 2
3. **`scheduled_flight` (tabla)** — 12 módulos usan → Flight Data Service antes de migrar
4. **`boarding_pass` (tabla)** — 2 escritores (Check-in + WS API) → Boarding Pass Service
5. **`seat_allocation` (tabla)** — 3 escritores (Seating, Check-in, CUSS) → Seat Service
6. **`ink_cupps_broker`** — 80 conexiones → Hardware Abstraction Layer
7. **`ws_passenger::validate_pax_attributes`** — 132-142 conexiones, 10 versiones → consolidar en validación central

## Dependencias Circulares

| Par | Descripción |
|---|---|
| Check-in ↔ Boarding | Comparten `boarding_pass`; Check-in genera, Boarding actualiza |
| Check-in ↔ CUSS | CUSS usa `checkin_passenger_controller`; son el mismo dominio con diferente canal |
| Departure Control ↔ Flight Mgmt | Co-núcleo; se alimentan mutuamente |

## Preparación para Fases 3-5

- **Fase 3 (Multitenancy)**: 11+ tenants en `webci/{tenant}/` — cada módulo Level 2 que toca webci tiene implicaciones multitenancy
- **Fase 4 (Integraciones)**: WS API (10 versiones), APIS/Border (PNRGOV, immigration), CUPPS (hardware externo)
- **Fase 5 (Mapa de dependencias)**: Construir desde LIMITES-MODULOS.md — ya hay 38 dependencias base + 7 hotspots para el mapa
