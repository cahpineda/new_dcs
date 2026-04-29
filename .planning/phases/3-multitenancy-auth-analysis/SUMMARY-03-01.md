# Plan 03-01: Análisis de Multitenancy — Resumen

## Logros

- MULTITENANCY.md creado con 4 secciones completas
- Mecanismo de aislamiento identificado: **Shared DB + resolución por hostname** (no framework externo)
- 11+ tenants documentados con variantes específicas (Jet2, Wizz Air)
- 5 tipos de variaciones por cliente catalogadas con evidencia real
- Tabla de impacto multitenancy por módulo producida

## Mecanismo de Aislamiento Detectado

**Tipo**: Shared Database, Row-Level Isolation  
**Discriminador**: `$_SERVER['SERVER_NAME']` → `get_current_company_key()` → `company_key`  
**Entidad tenant**: `carrier` (aerolínea) — tabla central con FK en todas las tablas operacionales  
**Config por tenant**: `webci/{tenant}/config.php` — archivos PHP por aerolínea  
**Feature flags**: `ici_has_covid_section` y similares por empresa  
**Sin framework**: No hay stancl/tenancy, Eloquent traits, ni middleware global  

## Hallazgos Clave

1. **`get_current_company_key()` = tensor de multitenancy**: única función que resuelve el tenant, ubicada en `includes/local_functions.php`. Al migrar, este debe convertirse en middleware centralizado.
2. **CUSS tiene variantes por tenant como clases separadas** — `cuss_selfcheckin_jet2_kiosk_controller`, `cuss_selfcheckin_wizz_kiosk_controller` — implica que el "módulo CUSS" son en realidad 3 submódulos.
3. **APIS tiene variantes por país** (Colombia, Ecuador) — requerimientos regulatorios que deben preservarse en la reescritura.
4. **Todas las tablas operacionales son tenant-aware via FK transitiva**: `tabla → scheduled_flight → carrier_key`.
5. **station como contexto operacional**: `user_associated_station` liga al usuario no solo a la aerolínea sino al escritorio físico — este concepto es crítico para DCS.

## Preparación para Plan 03-02

Plan 03-02 (AUTH.md) tendrá como input:
- Entidad `carrier_user` (usuario por aerolínea) 
- Entidades auth: `user`, `user_session`, `user_role`, `user_group`, `user_token`, `user_associated_role`, `user_associated_station`
- Entry points de auth: `login.php`, `login_auth.php`, `login_cute.php`
- Context: `load_session()` en cada controller — no middleware global
