---
plan: "04-02"
phase: 4-third-party-integrations-catalogue
generated_at: 2026-04-29
data_source: INTEGRACIONES-DESCUBIERTAS.md + LIMITES-MODULOS.md + MULTITENANCY.md (P2C session 795eedb2)
---

# CATALOGO-INTEGRACIONES.md — Catálogo de Integraciones del Monolito cloud_2

---

### 1. CUPPS / CUTE (Common-Use Terminal Equipment)

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | CUPPS / CUTE — protocolo IATA para hardware aeroportuario |
| Protocolo | Binary protocol CUPPS + HTTP interno |
| Flujo | Bidireccional — cloud_2 controla hardware y recibe eventos |
| Módulo(s) | Check-in, Boarding, CUSS, CUPPS/Periféricos |
| Criticidad | **Alta** — sin CUPPS no hay acceso a impresoras, scanners, lectores de pasaporte en mostrador |
| Scope Tenants | Obligatoria para operación en mostrador de aeropuerto |
| Clase Principal | `includes/ink_cupps_broker.class.php` (80 conexiones en grafo P2C) |
| Descripción | Broker central de hardware CUTE. Gestiona periféricos: impresoras de boarding pass, scanners de documentos, lectores de tarjetas. 80 edges en core network — 2do nodo más conectado del sistema. |

---

### 2. CUSS (Common-Use Self-Service)

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | CUSS — protocolo IATA para kioscos autoservicio |
| Protocolo | Binary protocol CUSS + HTTP |
| Flujo | Bidireccional — cloud_2 controla el kiosk y recibe input del pasajero |
| Módulo(s) | CUSS Kiosk |
| Criticidad | **Alta** para tenants con kioscos — **Baja** para tenants sin hardware kiosk |
| Scope Tenants | Opcional — solo tenants con kioscos físicos en aeropuerto |
| Clase Principal | `includes/ink_cuss_broker.class.php` |
| Descripción | Broker para kioscos CUSS. Tiene variantes por tenant: estándar, Jet2, Wizz Air. El tenant determina el workflow del kiosk. |

---

### 3. SITA BaggageService (WorldTracer) — SOAP WSDL

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | SITA — WorldTracer Baggage Reconciliation System |
| Protocolo | SOAP/WSDL (IATA Baggage Service standard) |
| Flujo | cloud_2 consume — envía datos de equipaje a WorldTracer, recibe confirmaciones |
| Módulo(s) | Baggage/BRS |
| Criticidad | **Alta** — sin BRS no hay reconciliación de equipaje regulatoria |
| Scope Tenants | Obligatoria para operaciones reguladas (mayoría de aeropuertos) |
| Clase Principal | `modules/cuws/` (91 archivos de stubs WSDL) |
| Descripción | 91 archivos de stubs PHP generados desde WSDL de SITA BaggageService IATA. La integración más compleja por volumen de código de integración. |

---

### 4. Google BigQuery

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | Google BigQuery (Google Cloud) |
| Protocolo | REST/HTTP (Google Cloud API) |
| Flujo | cloud_2 produce — envía eventos de analytics, no consume datos |
| Módulo(s) | Departure Control, Check-in, CUSS, Boarding, Baggage, W&B (todos los módulos con BQ schemas) |
| Criticidad | **Media** — el DCS funciona sin BigQuery pero pierde analytics/reporting |
| Scope Tenants | Todos los tenants (analytics global) |
| Clase Principal | `modules/Logs/BQHandler.php` |
| Descripción | Handler que recibe eventos de todos los módulos y los encola para envío a BigQuery. Los schemas `bq_imp_*.schema.php` (25+ archivos) son las tablas de eventos por módulo. |

---

### 5. Amazon S3

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | Amazon Web Services S3 |
| Protocolo | REST/HTTP (AWS SDK calls) |
| Flujo | cloud_2 produce — sube documentos (boarding pass PDFs, seat plans) |
| Módulo(s) | Departure Control, Boarding (exportación de boarding pass) |
| Criticidad | **Media** — archivos pueden almacenarse localmente si S3 no disponible |
| Scope Tenants | Los tenants que usan exportación PDF/cloud storage |
| Clase Principal | `includes/amazon_bucket_export.class.php` |
| Descripción | Exportación de seat plans y boarding passes a S3. Detectado via dependencia en `departure_control_controller` (MODULOS-CANDIDATOS.md). |

---

### 6. APIS / Advance Passenger Information Systems

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | Sistemas de gobierno — DHS (USA), UKBF, reguladores nacionales |
| Protocolo | EDIFACT / REST (varía por país) |
| Flujo | cloud_2 produce — transmite datos de pasajeros a autoridades antes del vuelo |
| Módulo(s) | APIS/Border Control |
| Criticidad | **Alta** — regulatorio/legal en todos los países con requisitos APIS |
| Scope Tenants | Obligatoria para vuelos internacionales — todos los tenants operacionales |
| Clase Principal | `includes/apis_*.class.php`, `pnrgov_generator.php`, `includes/advance_passenger_report_controller.class.php` |
| Descripción | Sistema de información anticipada de pasajeros. Variantes por país: `advance_colombian_passenger_report`, `advance_ecuadorian_passenger_report`. PNRGOV para formato OAG/IATA. |

---

### 7. Radixx PSS (Passenger Service System)

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | Radixx — Reservation/PSS System |
| Protocolo | REST/HTTP (Radixx API) |
| Flujo | cloud_2 consume — recibe reservas (PNR) desde Radixx |
| Módulo(s) | Flight Management, Check-in |
| Criticidad | **Alta** para tenants Radixx — sin PNR no hay pasajeros para check-in |
| Scope Tenants | Solo tenants que usan Radixx como PSS |
| Clase Principal | `includes/radixx_flights_creator_service.class.php` |
| Descripción | Servicio de creación de vuelos desde datos de reserva Radixx. Indica que cloud_2 recibe datos de al menos un PSS externo. Puede haber integraciones con otros PSS no identificados. |

---

### 8. Timatic / IATA Travel Intelligence

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | Timatic — IATA Travel Document Check |
| Protocolo | REST/HTTP o SOAP (IATA Timatic API) |
| Flujo | cloud_2 consume — consulta requisitos de viaje por país |
| Módulo(s) | APIS/Border Control, Check-in |
| Criticidad | **Media** — el check-in puede operar sin Timatic pero sin validación de documentos |
| Scope Tenants | Opcional por contrato con IATA — los tenants con este servicio lo habilitan |
| Clase Principal | `includes/timatic_controller.class.php`, `includes/timatic3_controller.class.php` |
| Descripción | Dos versiones de integración Timatic (v1 y v3). Valida requisitos de visa, pasaporte, documentos de viaje por ruta. `timatic_transaction.schema.php` almacena resultados. |

---

### 9. EDIFACT / Type B Messaging

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | IATA EDIFACT (standard) — sistemas de mensajería aeronáutica |
| Protocolo | EDIFACT Type B (SITA/AIRIMP) |
| Flujo | Bidireccional — cloud_2 produce (PNRGOV, APIS) y consume (vuelos, PNR) |
| Módulo(s) | APIS/Border, Flight Management, Mensajería/Postmaster |
| Criticidad | **Alta** — usado para comunicaciones regulatorias y operacionales |
| Scope Tenants | Todos los tenants con operaciones internacionales |
| Clase Principal | `includes/ink_edifact_postmaster.class.php`, `edifact_router_config.php` |
| Descripción | Sistema EDIFACT para mensajería aeronáutica estándar. Usado para PNRGOV y mensajes operacionales. El router (`edifact_router_config.php`) define rutas de mensajes. |

---

### 10. MQ Gateway (AMQP/RabbitMQ)

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | RabbitMQ o similar AMQP broker |
| Protocolo | AMQP (Advanced Message Queuing Protocol) |
| Flujo | Bidireccional — cloud_2 produce y consume mensajes |
| Módulo(s) | Job processing, integraciones async |
| Criticidad | **Alta** — procesos críticos de background (jobs, notificaciones) |
| Scope Tenants | Todos (infraestructura global) |
| Clase Principal | `mq_client/mq_gateway.php`, `mq_client/mq_gateway2.php` |
| Descripción | Gateway de mensajería asíncrona. Dos versiones (gateway y gateway2) sugieren evolución del protocolo. `mq_node_receiver.php` recibe mensajes del servidor Node.js. |

---

### 11. Redis (Job Queue)

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | Redis |
| Protocolo | Redis protocol |
| Flujo | cloud_2 produce (encola jobs) y consume (procesa jobs) |
| Módulo(s) | Background processing — todos los módulos que disparan jobs |
| Criticidad | **Alta** — jobs críticos: analytics BigQuery, notificaciones, exportaciones |
| Scope Tenants | Todos |
| Clase Principal | `modules/QueuedJobs/RedisDispatcher.php`, `process_job.php` |
| Descripción | Sistema de colas de trabajo. `process_job.php` es el daemon que procesa jobs de Redis. Jobs incluyen: BQ events, exportaciones S3, notificaciones. |

---

### 12. WebSocket / Node.js (Real-time UI)

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | Node.js + Socket.io (propio Ink) |
| Protocolo | WebSocket (Socket.io protocol) |
| Flujo | Bidireccional — cloud_2 envía eventos al server Node.js, el browser los recibe |
| Módulo(s) | Departure Control (actualizaciones en tiempo real de la pantalla DCS) |
| Criticidad | **Alta** — la pantalla DCS necesita actualizaciones en tiempo real para operación |
| Scope Tenants | Todos (infraestructura de UI del DCS) |
| Clase Principal | `ws_api.php`, `node_server_communications.php`, `websockets/client/socket.io.js` |
| Descripción | Stack de tiempo real: PHP → Node.js server → WebSocket → Browser. Crítico para la pantalla DCS donde múltiples agentes ven la misma información actualizada simultáneamente. |

---

### 13. TouchSuite

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | TouchSuite — sistema de dispositivos de aeropuerto |
| Protocolo | HTTP tunnel (propietario TouchSuite) |
| Flujo | Bidireccional — cloud_2 envía comandos, TouchSuite reporta estados |
| Módulo(s) | CUPPS/Periféricos, Departure Control |
| Criticidad | **Media** — alternativa al CUPPS para algunos tenants |
| Scope Tenants | Solo tenants con dispositivos TouchSuite |
| Clase Principal | `touch_suite_handler.php`, `touch_suite_tunnel.php`, `includes/touch_suite_handler_controller.class.php` |
| Descripción | Sistema de gestión de dispositivos de aeropuerto (alternativa/complemento al CUPPS). Tiene handler y tunnel dedicados — protocolo propietario. |

---

### 14. Passbook (Apple Wallet)

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | Apple Wallet (Passbook API) |
| Protocolo | REST/HTTP (Apple Push Notification + Passbook format) |
| Flujo | cloud_2 produce — genera `.pkpass` para boarding pass digital |
| Módulo(s) | Check-in, Boarding |
| Criticidad | **Baja** — feature adicional de boarding pass digital |
| Scope Tenants | Opcional — tenants que ofrecen boarding pass en iPhone |
| Clase Principal | `passbook/index.php` |
| Descripción | Generación y entrega de boarding pass en formato Apple Wallet. Directorio `passbook/` isolado sugiere implementación separada del core DCS. |

---

### 15. SSIM / Horarios de Vuelo

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | IATA SSIM (Standard Schedules Information Manual) |
| Protocolo | File-based (SSIM format) |
| Flujo | cloud_2 produce — genera archivos SSIM de horarios |
| Módulo(s) | Flight Management |
| Criticidad | **Media** — necesario para compartir horarios con sistemas externos |
| Scope Tenants | Tenants que requieren interoperabilidad de horarios |
| Clase Principal | `includes/generate_ssim_controller.class.php`, `includes/create_ssim_controller.class.php` |
| Descripción | Generación de horarios en formato SSIM estándar IATA para compartir con GDS, airports. |

---

### 16. gRPC (servicios externos no identificados)

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | Sin identificar — stubs generados sugieren servicios Ink Platform |
| Protocolo | gRPC (Protocol Buffers) |
| Flujo | cloud_2 consume — stubs son del lado cliente |
| Módulo(s) | No determinado — stubs en `includes/grpc/` |
| Criticidad | No determinada — REQUIERE VERIFICACIÓN MANUAL |
| Scope Tenants | No determinado |
| Clase Principal | `includes/grpc/` (directorio de stubs generados) |
| Descripción | Stubs PHP generados para consumir servicios gRPC. Posiblemente son microservicios propios de Ink Platform (load_control, core_passengers, etc.) que cloud_2 consume via gRPC. |

---

### 17. MODI / InkTouch (Dispositivos Móviles de Aeropuerto)

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | InkTouch — sistema propio de Ink para dispositivos móviles de aeropuerto |
| Protocolo | HTTP REST |
| Flujo | Bidireccional — cloud_2 controla y recibe datos de dispositivos InkTouch |
| Módulo(s) | MODI/InkTouch module |
| Criticidad | **Media** — feature adicional para operaciones móviles en rampa |
| Scope Tenants | Tenants con dispositivos InkTouch |
| Clase Principal | `modi_call_api.php`, `ink_touch_device.schema.php`, `ink_touch_action_log.schema.php` |
| Descripción | Sistema de dispositivos móviles de aeropuerto (tabletas/handheld para rampa). Sistema propio de Ink — cloud_2 actúa como backend de los dispositivos. |

---

### 18. Zabbix (Monitoreo de Infraestructura)

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | Zabbix — open-source monitoring |
| Protocolo | Zabbix API (REST/HTTP) |
| Flujo | cloud_2 produce — envía métricas/alertas a Zabbix |
| Módulo(s) | Infraestructura (transversal) |
| Criticidad | **Baja** — monitoreo operacional, no afecta funcionamiento DCS |
| Scope Tenants | Todos (monitoreo global) |
| Clase Principal | `includes/ZabbixAPI.class.php` |
| Descripción | API de Zabbix para envío de métricas de infraestructura. Monitoreo del sistema. |

---

### 19. WS API Móvil (cloud_2 como server)

| Atributo | Valor |
|---|---|
| Sistema/Proveedor | Ink Mobile Apps (clientes iOS/Android) |
| Protocolo | REST/HTTP (custom WS protocol) — 10 versiones paralelas |
| Flujo | cloud_2 expone — los clientes móviles consumen esta API |
| Módulo(s) | WS API (propio) |
| Criticidad | **Alta** — los clientes móviles de aerolínea dependen de esta API |
| Scope Tenants | Todos los tenants con aplicación móvil |
| Clase Principal | `includes/ws_v{1.1-1.9}/web_service_master.class.php` (10 versiones) |
| Descripción | cloud_2 como **servidor** de API para apps móviles. 10 versiones paralelas activas simultáneamente. `ws_passenger::validate_pax_attributes` es el endpoint más crítico (132-142 conexiones). |

---

## Resumen Ejecutivo de Integraciones

### Tabla Resumen

| Sistema | Protocolo | Flujo | Módulo Principal | Criticidad | Scope |
|---|---|---|---|---|---|
| CUPPS/CUTE | Binary CUPPS | Bidireccional | Check-in, Boarding, CUSS | **Alta** | Obligatoria |
| CUSS | Binary CUSS | Bidireccional | CUSS Kiosk | Alta/Baja | Opcional |
| SITA BaggageService | SOAP WSDL | Consume | Baggage/BRS | **Alta** | Obligatoria |
| Google BigQuery | REST | Produce | Todos | Media | Todos |
| Amazon S3 | REST | Produce | DC, Boarding | Media | Algunos |
| APIS/Gobierno | EDIFACT/REST | Produce | APIS/Border | **Alta** | Obligatoria |
| Radixx PSS | REST | Consume | Flight, Check-in | **Alta** | Solo Radixx tenants |
| Timatic | REST/SOAP | Consume | APIS, Check-in | Media | Opcional |
| EDIFACT | Type B | Bidireccional | APIS, Flight, Postmaster | **Alta** | Internacionales |
| MQ Gateway | AMQP | Bidireccional | Jobs/Background | **Alta** | Todos |
| Redis | Redis | Bidireccional | Jobs/Background | **Alta** | Todos |
| WebSocket/Node.js | WebSocket | Bidireccional | Departure Control | **Alta** | Todos |
| TouchSuite | HTTP tunneling | Bidireccional | CUPPS, DC | Media | Algunos |
| Passbook/Apple | REST | Produce | Check-in, Boarding | Baja | Opcional |
| SSIM | File-based | Produce | Flight | Media | Algunos |
| gRPC | gRPC | Consume | No determinado | ? | ? |
| MODI/InkTouch | REST | Bidireccional | MODI module | Media | Algunos |
| Zabbix | REST | Produce | Infraestructura | Baja | Todos |
| WS API Móvil | REST (custom) | Expone | WS API | **Alta** | Todos |

### Totales

- **Integraciones de alta criticidad**: 8 (CUPPS, SITA, APIS, Radixx, EDIFACT, MQ, Redis, WebSocket/Node.js, WS API propia)
- **Integraciones opcionales por tenant**: 7 (CUSS, Timatic, TouchSuite, Passbook, SSIM, MODI, gRPC)
- **Protocolos usados**: REST, SOAP/WSDL, EDIFACT (Type B), AMQP, Redis, WebSocket, gRPC, Binary (CUPPS/CUSS), File-based (SSIM)
- **Módulos con más integraciones**: 1) APIS/Border (APIS, Timatic, EDIFACT), 2) Baggage/BRS (SITA, Redis, BigQuery), 3) Check-in (CUPPS, Radixx, Timatic, Passbook)

### Integraciones de Mayor Riesgo para la Reescritura

| Integración | Riesgo | Nota |
|---|---|---|
| **WebSocket/Node.js** | Alto | La pantalla DCS necesita real-time — el stack Node.js+Socket.io debe mantenerse o reemplazarse antes de migrar Departure Control |
| **CUPPS/CUTE (ink_cupps_broker)** | Alto | 80 conexiones — es el hub de hardware. Check-in, Boarding, CUSS dependen de él. Debe convertirse en Hardware Abstraction Service antes de migrar estos módulos |
| **SITA BaggageService SOAP** | Alto | 91 archivos de stubs WSDL — si el protocolo cambia, impacta masivamente. Encapsular en Baggage Integration Service |
| **WS API Móvil (10 versiones)** | Alto | Clientes móviles dependen de versiones específicas. La consolidación de versiones es un proyecto propio antes de migrar WS API |
| **Radixx PSS** | Medio | Dependencia de fuente de PNR. Si cloud_2 migra a módulos, el Flight Management Module debe mantener esta integración |
| **gRPC (no identificado)** | Desconocido | Los stubs existen pero el sistema destino no fue identificado — REQUIERE VERIFICACIÓN antes de planificar migración |

