# Plan 02-02: Scope Módulos FE/BE/DB — Resumen

**Scope completo de cada módulo documentado.**

## Logros

- 16 módulos funcionales documentados con scope FE/BE/DB completo y clasificación de acoplamiento a `departure_control`
- Clasificación Level 0/1/2/Núcleo producida para todos los módulos candidatos
- Tablas DB compartidas identificadas y marcadas ⚠️ con módulos co-propietarios
- Dependencia departure_control (sí/no/directo) documentada por módulo

## Módulos con Mayor Complejidad DB

Tablas críticas compartidas por múltiples módulos — candidatas a "servicio de datos compartido":

| Tabla | Módulos que la Usan | Severidad |
|-------|---------------------|-----------|
| `scheduled_flight` | Departure Control, Flight Mgmt, Check-in, CUSS, Boarding, WS API, Baggage, FIDS, W&B, APIS | CRÍTICO ⚠️⚠️⚠️ |
| `passenger` | Departure Control, Check-in, CUSS, Boarding, WS API, Baggage, APIS, Seating | CRÍTICO ⚠️⚠️⚠️ |
| `boarding_pass` | Departure Control, Boarding, Check-in, WS API, Baggage | Alto ⚠️⚠️ |
| `seat_assignment` | Seating, Check-in, CUSS, WS API | Alto ⚠️⚠️ |
| `baggage_record` | Baggage/BRS, Departure Control, Boarding | Medio ⚠️ |

## Hallazgos Clave

1. **Departure Control como ROOT entry point con suite JS completa**: `departure_control.php` tiene 10 archivos JS propios (`departure_control_javascript.php`, `_library.php`, `_suite.php`, `_jquery.php`, `_min_1/2/3.php`) más vistas en `view_template_custom/`
2. **WS API con 10 versiones paralelas**: `includes/ws_v{1.1-1.9}/` cada una con 7 archivos (web_service_master, ws_passenger, ws_flight, ws_seat_plan, ws_boarding_pass, ws_baggage_tag, ws_class). `ws_passenger.class.php::validate_pax_attributes` es el nodo de código más conectado del sistema (132-142 conexiones)
3. **webci/ — Customizaciones por tenant**: 11+ tenants (avior, airmalta, bermudair, amapola, ais, creebec, ...) con overrides en `webci/{tenant}/` — patrón de multitenant por directorio, no por base de datos
4. **FIDS completamente independiente**: Sin dependencia a departure_control, sin tablas compartidas críticas → candidato Level 0 más limpio para extracción
5. **Health/COVID desacoplado**: Sin departure_control dependency, módulo standalone → Level 0
6. **Vehicles/GSE independiente**: Sin departure_control, tablas propias → Level 0
7. **Flight Management como co-núcleo**: `scheduled_flight` es la tabla más referenciada del sistema junto con `passenger` — Flight Mgmt y Departure Control forman el núcleo de datos conjunto

## Clasificación Level de Acoplamiento

| Nivel | Módulos | Estrategia |
|-------|---------|------------|
| **Level 0** (sin departure_control) | FIDS, Vehicles/GSE, Health/COVID | Extraíbles inmediatamente |
| **Level 1** (dependencia indirecta) | Baggage/BRS, Self-Service Bag Drop, WS API | Segunda ola — requieren contratos de datos |
| **Level 2** (dependencia directa) | Check-in, CUSS, Boarding, APIS/Travel Docs, CUPPS, Seating, W&B/AHM | Tercera ola — requieren API de orquestación |
| **Núcleo** | Departure Control + Flight Management | Migrar últimos |

## Preparación para Plan 02-03

Plan 02-03 ejecutará `LIMITES-MODULOS.md` con:
- Mapeo de dependencias cruzadas entre módulos peers (no solo a departure_control)
- Identificación de dependencias bidireccionales ⚠️ CIRCULAR
- Hotspots de alta complejidad de separación con estrategia concreta
- Lista final validada de módulos con nivel de acoplamiento Alto/Medio/Bajo

Inputs listos: `SCOPE-MODULOS.md` (este plan) + `MODULOS-CANDIDATOS.md` (plan 02-01)
