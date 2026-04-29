---
plan: "01-01"
phase: 1-repository-structure-framework-analysis
status: completed
completed_at: 2026-04-29
---

# Plan 01-01: Estructura del Repositorio — Resumen

## Logros

- ESTRUCTURA-REPO.md creado con 5 secciones completas y datos reales de project2context
- Resumen general documentado: PHP 8.2+, 5,362 módulos, 33,933 entidades
- Árbol de directorios mapeado: includes/, modules/, schemas/, view_template_custom/, xero/, websockets/, fids/, csrfp/, voku_anti_xss/, migrator/
- 200+ controladores inventariados con rutas exactas (límite de búsqueda P2C)
- 300 schemas de DB listados (primeros 30 con rutas exactas)
- Vistas (195+ en view_template_custom/), servicios, jobs/daemons y mecanismos de middleware documentados
- Configuración (14 archivos clave) y capa de base de datos (schema system PHP personalizado) documentadas
- Inventario inicial de 11 integraciones externas identificadas con archivos clave

**Workaround aplicado:** P2C MCP inaccesible vía Claude Code (error H.reduce is not a function). Todas las queries ejecutadas via HTTP directo con sesión MCP manual. Datos 100% reales de P2C — cero suposiciones.

## Hallazgos Clave

1. **No hay framework MVC estándar** — arquitectura custom: `includes/` flat para controllers, `schemas/` para modelos DB, PHP inline para vistas
2. **Dualidad arquitectónica**: código legacy en `includes/*.class.php` + código moderno PSR-4 en `modules/` (namespace `Ink\\`)
3. **300+ entidades DB** definidas como PHP schema files — no hay migraciones SQL formales ni ORM (Eloquent/Doctrine)
4. **CUWS es SOAP** — `modules/cuws/soap/` contiene 150 stubs SOAP generados del WSDL de SITA BAGS (BaggageService IATA)
5. **Ancillaries tiene 3 variantes** de implementación: Pribas, StandardV1, StandardV2 — implicaciones directas para multi-tenancy
6. **Mobile API versionada explícitamente** — v3.7.0 a v3.18.0, sugiere múltiples clientes con versiones distintas activas
7. **No hay middleware centralizado** — auth, CSRF y validación implementados a nivel de controlador/librería
8. **BigQuery integrado** — postmaster_bq_packager, streaming_bq_packager, bq_logger → analytics enviadas a Google Cloud

## Preparación para Plan 01-02

El siguiente plan (01-02: Identificación de módulos funcionales) puede usar estos hallazgos directamente:

- **Candidatos de módulos identificados** por grouping de controladores:
  - Check-in: `checkin_passenger`, `selfcheckin_kiosk`, `cuss_selfcheckin_*`, `bag_drop_kiosk`
  - Boarding: `boarding_gate`, `boarding_tab`, `selfboarding`, `boarded_passenger`
  - Baggage: `baggage_scan`, `baggage_drop`, `baggage_carousel`, `bags_cloud`, `brs_*`, `excess_baggage_*`
  - Flight Management: `scheduled_flight`, `flight_dashboard`, `flight_search`, `departure_control`
  - Weight & Balance / AHM: `ahm`, `ahm560_*` (18+ variantes), `baggage_weight_report`
  - Ancillaries: `ancillary_product`, `ancillary_item` + `modules/Ancillaries/` (Pribas/Standard)
  - APIS (Advance Passenger Info): `apis_matrix_report`, `apis_response`, `apis_switch`
  - FIDS: `fids_flight`, `fids_machine`, `fids_manager`, `fids_page`, `fids_monitor_group`
  - CUPPS: `cupps_connection`, `cupps_message`, `cupps_transaction`
  - Configuration/Admin: `app_configuration`, `cabin_configuration`, `carrier`, `airline`
  - Payments: `financial_transaction`, `cart`, `excess_baggage_tariff`, `currency`

- **Archivos de contexto para P2C queries en 01-02**: usar `query_classes` con filtros por `file_contains:"includes/"` y `query_functions` para mapear BE por módulo candidato
- **Workaround P2C activo**: continuar usando HTTP directo hasta que se resuelva el bug H.reduce en Claude Code
