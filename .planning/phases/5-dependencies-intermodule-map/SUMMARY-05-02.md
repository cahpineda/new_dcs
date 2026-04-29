# Plan 05-02: Mapa de Dependencias Intermodulo — Resumen

**Mapa completo de dependencias entre módulos producido.**

## Logros

- MAPA-DEPENDENCIAS-INTERMODULO.md con 4 secciones completas (referencias de clases, tablas DB compartidas, hotspots, resumen)
- 58 dependencias entre módulos documentadas (class + DB)
- 10 tablas DB compartidas clasificadas por riesgo de separación
- 7 hotspots con estrategia de migración concreta
- Orden de reescritura por olas definido (Ola 0 → Ola 5)
- Módulos más acoplados vs. más independientes rankeados

## Hotspots Críticos Identificados

| # | Hotspot | Conexiones | Estrategia |
|---|---|---|---|
| 1 | `departure_control_controller` | 24 referencias directas | Migrar ÚLTIMO — requiere API de orquestación DCS |
| 2 | `passenger.class.php` + tabla | 9 módulos | Passenger Core Service (Ola 0) |
| 3 | `scheduled_flight` (tabla) | 12+ módulos | Flight Data Service (Ola 0) |
| 4 | `boarding_pass` (múltiples escritores) | 3 módulos escriben | Boarding Pass Service (Ola 0) |
| 5 | `seat_allocation` (3 escritores) | 4 módulos | Seat Service con mutex (Ola 0) |
| 6 | `ink_cupps_broker` | 80 connections | Hardware Abstraction Layer (Ola 0) |
| 7 | `ws_passenger::validate_pax_attributes` (10 versiones) | 132-142 connections | Consolidar en 1 versión con versionado por header (Ola 2) |

## Orden de Reescritura Sugerido

**Ola 0** (Servicios Compartidos — PRIMERO): Passenger Core Service, Flight Data Service, Boarding Pass Service, Seat Service, CUPPS Hardware Abstraction Layer  
**Ola 1** (Level 0): FIDS, Vehicles/GSE, Health/COVID, Turnaround  
**Ola 2** (Level 1): Baggage/BRS + SSBD, WS API (consolidar 10 versiones)  
**Ola 3** (Level 2): CUPPS/Periféricos, CUSS Kiosk, Check-in, Boarding, Seating  
**Ola 4** (Level 2C): W&B/AHM, APIS/Border, Crew  
**Ola 5** (Núcleo): Flight Management → Departure Control (ÚLTIMO)  

## Preparación para Fase 6

Fase 6 (Documento Final de Análisis) tiene todos los inputs necesarios:
- ESTRUCTURA-REPO.md + FRAMEWORK.md (Fase 1)
- MODULOS-CANDIDATOS.md + SCOPE-MODULOS.md + LIMITES-MODULOS.md (Fase 2)
- MULTITENANCY.md + AUTH.md (Fase 3)
- INTEGRACIONES-DESCUBIERTAS.md + CATALOGO-INTEGRACIONES.md (Fase 4)
- DEPENDENCIAS-EXTERNAS.md + MAPA-DEPENDENCIAS-INTERMODULO.md (Fase 5)

Total de evidencia recopilada: P2C session 795eedb2bd7c41538670d46cc1e11ff4 — todos los datos son trazables.
