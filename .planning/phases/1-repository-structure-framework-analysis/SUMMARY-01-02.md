---
plan: "01-02"
phase: 1-repository-structure-framework-analysis
status: completed
completed_at: 2026-04-29
---

# Plan 01-02: Framework & Entry Points — Resumen

## Logros

- FRAMEWORK.md creado: stack tecnológico completo, dos capas arquitectónicas (legacy/moderna), convenciones de nomenclatura, patrones detectados
- PUNTOS-ENTRADA.md creado: 15+ categorías de entry points clasificadas por dominio DCS, ~197 entry points totales
- Autoloader custom `ink_autoload()` documentado con código fuente real (lines 54-129, local_functions.php)
- Patrón dispatch multi-step documentado con evidencia de código (webci_controller::dispatch())
- Estructura completa de modules/ PSR-4-like mapeada (14 subdirectorios, 200 archivos)

**Workaround P2C activo**: Misma sesión HTTP directa (session `795eedb2bd7c41538670d46cc1e11ff4`). Sin composer.json ni package.json en el repo — arquitectura deliberadamente sin gestión de dependencias estándar.

## Hallazgos Clave

1. **Arquitectura dual confirmada**: Legacy MVC custom (`includes/`) + capa moderna PSR-4-like (`modules/`) coexisten sin integración formal — dos sistemas de autoloading paralelos
2. **eval() como ORM fallback**: `ink_autoload()` genera dinámicamente clases que extienden `row` para cualquier nombre de clase desconocido — deuda técnica crítica con implicaciones de seguridad
3. **XCache en PHP 8.2**: La librería XCache está deprecada en PHP 7+ y no soporta PHP 8 nativamente — posible que esté deshabilitada (XCACHE=false) o wrappeada
4. **REST aislado**: `rest/index.php` es el ÚNICO entry point stateless — el 95%+ del sistema es MVC stateful con sesiones PHP
5. **CUSS como tier de primera clase**: 4+ entry points específicos para hardware de aeropuerto (kioscos CUSS, bag drop, selfboarding) — no wrapper de web check-in
6. **Tenant por hostname**: `get_current_company_key($_SERVER['SERVER_NAME'])` resuelve tenant antes de cualquier lógica de negocio — confirmado en código fuente
7. **No hay tabla de rutas**: Cada `{module}.php` root instancia directamente su controlador — el routing es implícito por nombre de archivo
8. **WebSocket via Node.js**: Servidor Node.js separado (`websockets/`) con bridge PHP — arquitectura polyglot mínima

## Preparación para Plan 01-03

El siguiente plan (identificación de módulos funcionales) puede usar:

- **Entry points como ancla de dominio**: Los 20 root PHP scripts mapean directamente a dominios DCS (auth, web_checkin, selfboarding, ssbd, fids, etc.)
- **156 controladores en includes/**: Ya clasificados en ESTRUCTURA-REPO.md por dominio candidato
- **modules/ como módulos modernos**: 14 subdirectorios = candidatos de módulos autónomos para reescritura
- **Patrón dispatch como seam de extracción**: El método `dispatch()` + step machine es el punto natural para desacoplar lógica de negocio del controlador
- **Queries P2C sugeridas para 01-03**:
  - `query_dependencies` para mapear qué controladores dependen de qué clases
  - `trace_call_path` desde entry points hacia servicios compartidos
  - `search_files` content: `require_once` / `new {class}` para detectar acoplamiento entre módulos

## Estado de Artifacts

| Artifact | Estado | Ruta |
|---|---|---|
| FRAMEWORK.md | Completado | .planning/phases/1-repository-structure-framework-analysis/FRAMEWORK.md |
| PUNTOS-ENTRADA.md | Completado | .planning/phases/1-repository-structure-framework-analysis/PUNTOS-ENTRADA.md |
| SUMMARY-01-02.md | Este archivo | — |
