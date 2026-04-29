---
plan: "01-02"
phase: 1-repository-structure-framework-analysis
generated_at: 2026-04-29
data_source: project2context (HTTP workaround, session 795eedb2bd7c41538670d46cc1e11ff4)
tools_used: entrypoints_php_filtered (200 candidatos), find_front_controllers (250 scored), search_files path:index.php
---

# PUNTOS-ENTRADA.md — Entry Points del Monolito cloud_2

## Metodología

P2C identificó 250 candidatos via `find_front_controllers` (scoring heurístico) y 200 vía `entrypoints_php_filtered`. Se clasificaron por dominio DCS a partir de nomenclatura y señales de dispatch.

---

## 1. Autenticación

| Archivo | Tipo | Descripción |
|---|---|---|
| `login.php` | HTTP entry | Pantalla de login principal |
| `login_auth.php` | HTTP entry | Procesamiento de credenciales |
| `login_cute.php` | HTTP entry | Login para terminal CUTE (aeropuerto) |

---

## 2. Web Check-in

| Archivo | Tipo | Descripción |
|---|---|---|
| `web_checkin.php` | HTTP entry | Portada del flujo web check-in |
| `includes/webci_controller.class.php` | Controller | Controlador principal WEBCI — `dispatch()` maneja el flujo multi-step |

**Patrón de flujo**: `web_checkin.php` → `new webci_controller()` → `dispatch()` → steps: identify_passenger → select_passenger → ... → render_view()

---

## 3. Self Check-in Kiosk (CUSS)

| Archivo | Tipo | Descripción |
|---|---|---|
| `selfcheckin_kiosk_cuss_frame.php` | HTTP entry | Frame CUSS estándar para kioscos de auto check-in |
| `selfcheckin_jet2_kiosk_cuss_frame.php` | HTTP entry | Frame CUSS variante Jet2 (tenant-específico) |
| `includes/selfboarding_controller.class.php` | Controller | Controlador de autoservicio de embarque |
| `includes/bag_drop_kiosk_controller.class.php` | Controller | Controlador kiosko bag drop |

---

## 4. Embarque (Boarding)

| Archivo | Tipo | Descripción |
|---|---|---|
| `selfboarding.php` | HTTP entry | Embarque autoservicio |
| `includes/selfboarding_controller.class.php` | Controller | Controlador de selfboarding |

---

## 5. API REST (Slim Framework)

| Archivo | Tipo | Descripción |
|---|---|---|
| `rest/index.php` | REST entry | Punto de entrada único para la API REST — Slim Framework |

- Todas las rutas REST pasan por `rest/index.php`
- Routing definido vía Slim + `edifact_router_config.php` (detectado en plan 01-01)
- Este es el único entry point HTTP stateless — el resto del monolith es stateful (sesiones PHP)

---

## 6. WebSocket API

| Archivo | Tipo | Descripción |
|---|---|---|
| `ws_api.php` | WS entry | API WebSocket PHP (bridge con Node.js) |
| `node_server_communications.php` | PHP entry | Comunicaciones con servidor Node.js WebSocket |
| `mq_node_receiver.php` | PHP entry | Receptor de mensajes del servidor MQ/Node |

**Stack WebSocket**: Node.js + Socket.io (websockets/client/socket.io.js) ↔ PHP bridge

---

## 7. Procesamiento de Jobs en Background

| Archivo | Tipo | Descripción |
|---|---|---|
| `process_job.php` | Daemon entry | Procesador de jobs en cola (llamado por cron/supervisor) |
| `modules/QueuedJobs/RedisDispatcher.php` | Dispatcher | Dispatcher de jobs via Redis |
| `modules/QueuedJobs/JobsDispatcher.php` | Dispatcher | Dispatcher general de jobs |
| `modules/QueuedJobs/APIDispatcher.php` | Dispatcher | Dispatcher de jobs API |
| `modules/QueuedJobs/CloudJob.php` | Base | Job base para jobs en la nube |
| `modules/QueuedJobs/BaseJob.php` | Base | Clase base de todos los jobs |
| `modules/QueuedJobs/CloudUniqueJob.php` | Variant | Job único (dedup) |
| `includes/queued_job_dispatcher_controller.class.php` | Controller | Controlador dispatcher de jobs queued |

---

## 8. Message Queue (MQ) Client

| Archivo | Tipo | Descripción |
|---|---|---|
| `mq_client/mq_gateway.php` | MQ entry | Gateway MQ (versión 1) |
| `mq_client/mq_gateway2.php` | MQ entry | Gateway MQ (versión 2) |

---

## 9. TouchSuite / SSBD

| Archivo | Tipo | Descripción |
|---|---|---|
| `touch_suite_handler.php` | HTTP entry | Handler para integración TouchSuite |
| `touch_suite_tunnel.php` | HTTP entry | Túnel de comunicación TouchSuite |
| `ssbd_handler.php` | HTTP entry | Handler SSBD (Self-Service Bag Drop) |

---

## 10. MODI (Mobile Device Interface)

| Archivo | Tipo | Descripción |
|---|---|---|
| `modi_call_api.php` | HTTP entry | Interfaz MODI — llamadas a API mobile |

---

## 11. Documentos de Viaje / APIS

| Archivo | Tipo | Descripción |
|---|---|---|
| `pnrgov_generator.php` | Batch entry | Generador PNR GOV (Advance Passenger Information) |
| `update_onward_flights.php` | Batch entry | Actualización de vuelos de continuación |

---

## 12. Administración Interna (xadmin)

| Archivo | Tipo | Descripción |
|---|---|---|
| `xadmin/index.php` | Admin UI | Panel de administración principal |
| `xadmin/cacher/index.php` | Admin UI | Gestión de caché XCache |
| `xadmin/coverager/index.php` | Admin UI | Visualizador de cobertura XCache |
| `xadmin/diagnosis/index.php` | Admin UI | Diagnóstico del sistema |
| `xadmin/common/common.php` | Shared | Bootstrap común para xadmin |

---

## 13. Passbook / Mobile Boarding Pass

| Archivo | Tipo | Descripción |
|---|---|---|
| `passbook/index.php` | HTTP entry | Generación/entrega de boarding pass para Apple Passbook |

---

## 14. Operaciones DCS Batch

| Archivo | Tipo | Descripción |
|---|---|---|
| `statuses.php` | HTTP/Batch entry | Reporte de estados (vuelos, pasajeros) |
| `work_order_active.php` | HTTP entry | Gestión de órdenes de trabajo activas |
| `menzies_migrator.php` | Migration | Migrador de datos Menzies |

---

## 15. Controladores Legacy (`includes/`) — 156 archivos detectados

Los controladores en `includes/` siguen el patrón `{module}_controller.class.php`. Muestra representativa:

| Patrón | Módulos identificados |
|---|---|
| Check-in | `checkin_passenger_controller`, `webci_controller`, `update_identity_controller` |
| Kiosk CUSS | `selfcheckin_kiosk_controller`, `cuss_selfcheckin_controller`, `bag_drop_kiosk_controller` |
| Boarding | `selfboarding_controller`, `boarding_gate_controller` |
| Baggage | `baggage_drop_controller`, `bags_cloud_controller`, `excess_baggage_controller` |
| Jobs/Background | `queued_job_dispatcher_controller`, `node_server_communication_controller` |

> Total 156 controladores en `includes/` — listado completo en ESTRUCTURA-REPO.md (plan 01-01)

---

## 16. Vistas JavaScript (`view_template_custom/`)

5 archivos `.php` que generan JavaScript dinámicamente (entry points PHP → output JS):

| Archivo | Propósito |
|---|---|
| `machine_javascript.php` | JS para máquinas kiosko |
| `postmasters_javascript.php` | JS para postmasters/FIDS |
| `peripheral_javascript.php` | JS para periféricos |
| `message_templates_javascript.php` | Templates de mensajes JS |
| `health_tento_javascript.php` | JS de health monitoring |

---

## Resumen por Tipo

| Tipo | Cantidad | Descripción |
|---|---|---|
| Scripts root PHP | 20 | Entry points HTTP directos en raíz |
| Controladores `includes/` | 156 | Controladores legacy con dispatch() |
| Módulos QueuedJobs | 7 | Sistema de jobs + dispatchers |
| MQ Client | 2 | Gateways de mensajería |
| Vistas JS dinámicas | 5 | PHP que genera JavaScript |
| Admin (xadmin) | 4 | Panel de administración interna |
| REST (Slim) | 1 | `rest/index.php` — único endpoint stateless |
| WebSocket | 1 | `ws_api.php` |
| Passbook | 1 | Boarding pass digital |

**Total entry points identificados: ~197** (P2C scored 250, 200 filtrados — listado no exhaustivo)

---

## Observaciones Arquitectónicas

1. **Sin routing central**: No existe un archivo de rutas (`routes.php`, `web.php`). Cada entry point root PHP instancia directamente el controlador relevante.

2. **Dos estilos de entry points**:
   - **Legacy**: `{module}.php` root → `new {ModuleController}()` → `dispatch()`
   - **Modern**: `rest/index.php` (Slim) + `modules/QueuedJobs/` (Redis)

3. **CUSS/Kiosk como ciudadanos de primera clase**: Múltiples entry points específicos para hardware de aeropuerto (CUSS, bag drop, selfboarding) — no son adaptaciones del web check-in.

4. **Tenant-aware desde el entry point**: `get_current_company_key($_SERVER['SERVER_NAME'])` se llama en `webci_controller::dispatch()` — el tenant se resuelve antes de cualquier lógica de negocio.

5. **Daemon vs HTTP**: Los jobs de background (`process_job.php`, dispatchers Redis) son procesos de larga vida — no son HTTP workers. Implica gestión de procesos externa (Supervisor/cron).
