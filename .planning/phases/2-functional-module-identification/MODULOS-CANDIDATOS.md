---
plan: "02-01"
phase: 2-functional-module-identification
generated_at: 2026-04-29
data_source: project2context (search_files path, query_classes, query_functions) — session 795eedb2bd7c41538670d46cc1e11ff4
---

# MODULOS-CANDIDATOS.md — Módulos Funcionales del Monolito cloud_2

## ⚠️ Módulo Núcleo — Hallazgo Crítico (2026-04-29)

**`departure_control_controller.class.php` es el núcleo del sistema DCS.**

Evidencia P2C (`search_files content: "departure_control_controller"` — 24 referencias directas):

| Archivo que referencia | Función/Método | Tipo de dependencia |
|---|---|---|
| `includes/local_functions.php` | `is_departure_control_desk_request()` | Define el **modo de ejecución** del request |
| `includes/passenger.class.php` | `can_be_checked_in()`, `copy_from_passenger_for_transfer()` | Pasajero consulta contexto DCS |
| `includes/flight.class.php` | `get_boarding_groups_for_departure_control()`, `load_flight_item_keys()`, etc. | Vuelo opera bajo contexto DCS |
| `includes/seat_master.class.php` | `seat_group_of_passenger()` | Asignación de asientos usa instancia DCS |
| `includes/zone_balanced_seating.class.php` | `seat_group_of_passenger()` | Seating balanceado opera bajo DCS |
| `includes/crew_controller.class.php` | `get_departure_control_instance()` | Tripulación obtiene instancia DCS |
| `includes/boarding_tab_controller.class.php` | constructor | Vista de boarding usa contexto DCS |
| `includes/border_control_departure_controller.class.php` | constructor | Control de frontera obtiene instancia DCS |
| `includes/ajax_responder_controller.class.php` | `process_do_checkin()` | AJAX check-in opera bajo DCS |
| `includes/airplane.class.php` | `get_airplane_options_for_departure_control()` | Opciones de avión filtradas por DCS |
| `includes/touch_suite_handler_controller.class.php` | `get_controller_instance()` | TouchSuite obtiene instancia DCS |
| `includes/bq_departure_control_screen.class.php` | constructor | Analytics de pantalla DCS |
| `includes/bq_departure_control_session.class.php` | constructor | Analytics de sesión DCS |
| `includes/webborders_departure_controller.class.php` | constructor | Web borders hereda de DCS |
| `includes/anti_xss.class.php` | `validate_vars_departure_control()` | Validación XSS específica para DCS |
| `includes/amazon_bucket_export.class.php` | `reduce_seat_plan()` | Export S3 usa contexto DCS |

**Implicaciones directas para el análisis de módulos:**
1. `departure_control_controller` NO es un módulo extraíble — es la **capa de orquestación** del sistema
2. Ningún módulo que dependa de él puede migrarse a microservicio sin primero definir una API de orquestación equivalente
3. La pregunta para cada módulo candidato es: **"¿Depende de la instancia departure_control? Si sí → no puede migrarse de forma independiente"**
4. Módulos SIN dependencia directa de departure_control son los candidatos de extracción prioritaria

**Módulos funcionalmente independientes de departure_control** (candidatos de extracción temprana):
- FIDS (flight information displays — pantallas informativas, no operacionales)
- Vehículos / GSE (gestión de vehículos en tierra)
- Health/COVID (módulo de salud)
- Reporting (reportes centrales)
- Sistema de impresión (print jobs — puede operar independiente)

---

## Módulos Candidatos Identificados

| # | Módulo | Controladores (muestra) | Schemas (muestra) | Vistas (muestra) | Justificación |
|---|---|---|---|---|---|
| 1 | **Check-in Pasajeros** | checkin_passenger, check_passenger, webci_controller, update_identity | checkin_transaction, app_form_passenger, app_form_status | webci_view_template, checkin_passenger_view | Flujo primario de check-in; entry point web_checkin.php |
| 2 | **Self Check-in Kiosk (CUSS)** | cuss_selfcheckin_kiosk, cuss_selfcheckin_jet2_kiosk, cuss_selfcheckin_wizz_kiosk, cuss_selfcheckin_bags_kiosk, selfcheckin_kiosk_controller, kiosk_session_controller, kiosk_manager_controller, kiosks_monitor_controller | kiosk_session, kiosk_session_passenger, kiosk_session_screen, cuss_kiosk | kiosk_session_view, selfcheckin_kiosk_view | Hardware kiosk CUSS — 4+ tenants con variantes |
| 3 | **Boarding & Gate** | boarding_gate, boarding_tab, boarded_passenger, selfboarding_controller | boarding_gate, boarded_passenger, boarding_pass, boarding_transaction, boarding_group_list | boarding_gate_view, selfboarding_view | Flujo de embarque en puerta; entry points selfboarding.php |
| 4 | **Bag Drop / SSBD** | bag_drop_kiosk, bag_drop_6_sigma_report | bag_drop_transaction, bag_characteristic, baggage_photo | bag_drop_kiosk_view | Self-Service Bag Drop; entry point ssbd_handler.php |
| 5 | **Baggage Management** | baggage_carousel, baggage_drop, baggage_scan, baggage_tag_number, baggage_tag_report, baggage_weight_report, bags_cloud, brs_bag_exception, brs_container_flight, brs_mark_reason, brs_report, brsoverview_report | baggage_scan, baggage_tag, baggage_scan_status, brs_bag_exception, brs_container_flight, brs_type_of_storage, baggage_brs_tag | baggage_carousel_view, bags_cloud_view, brs_report_view | Gestión física del equipaje — BRS, carousel, scan |
| 6 | **Excess Baggage / Tarifas** | excess_baggage_tariff, excess_baggage_report, excess_bag_factor, excess_bag_sub_tariff | ancillary_excess_tariff, cached_sub_tariff, ancillary_items_fee, ancillary_receipt | excess_baggage_view | Cobro y reporte de exceso de equipaje |
| 7 | **Flight Management** | scheduled_flight, scheduled_flight_controller, flight_authority, flight_dashboard, flight_search, flight_register, flight_report, departure_control, delay_code, duplicate_flight, generate_ssim, create_ssim_flight | scheduled_flight, action_flight, flight_authority, flight_register | scheduled_flight_view, flight_dashboard_view, departure_control_view | Ciclo de vida del vuelo — desde schedule hasta salida |
| 8 | **Passenger Management** | passenger, passenger_document, passenger_photo_controller, passenger_search_controller, passenger_report_controller, passenger_journey_report_controller, passenger_fee_controller, ink_passenger_handler_controller | passenger, passenger_document, passenger_identifier, passenger_name_record, passenger_status_change, passenger_contact, passenger_loyalty, passenger_photo | passenger_view, passenger_search_view | Datos del pasajero — PNR, documentos, historial |
| 9 | **Seating / Seat Map** | seat, seat_allocation, seat_iata_code_controller, seat_master, seat_plan_updater, seat_preference, cabin_configuration, cabin_passengers_distribution | seat, seat_allocation, seat_iata_code, airplane_cabin_configuration, cabin_configuration, boarding_group_list | seat_view, cabin_configuration_view | Asignación de asientos, configuración de cabina |
| 10 | **Weight & Balance / AHM** | ahm, ahm560, ahm560_document, ahm560_pdf, ahm560a1–ahm560d3 (18 secciones), ahm_envelope, loadsheet_controller | ahm, ahm560a1–ahm560d3, ahm_envelope, ahm_envelope_mac, ahm_distribution | ahm_view_javascript, ahm560_view | Loadsheet e informe AHM — 18 secciones del estándar IATA AHM |
| 11 | **Ancillaries / Servicios Adicionales** | ancillary_item, ancillary_item_type, ancillary_product, ancillary_instant | ancillary_item, ancillary_product, ancillary_items_purchase, ancillary_product_route | ancillary_instant_view, ancillary_item_javascript | Ancillaries (Pribas/StandardV1/V2) — 3 variantes tenant |
| 12 | **APIS / Documentación de Viaje** | apis_matrix_report, apis_response, apis_switch, advance_passenger_report, advance_colombian_passenger_report, advance_ecuadorian_passenger_report, border_control_arrival, border_control_departure, immigration_controller, convert_pnrgov, pnrgov | apis_switch, border_movement, attendee, attendee_document | advance_passenger_report_view, border_control_view | APIS (Advance Passenger Info), PNR-GOV, manifiestos de frontera |
| 13 | **Timatic / Validación Documentos** | timatic, timatic3, timatic_controller, timatic_document_controller, timatic_report_controller | timatic_transaction, timatic_document | timatic_view | Validación de requisitos de viaje via TIMATIC (IATA) |
| 14 | **FIDS** | fids_flight, fids_machine, fids_manager, fids_monitor_group, fids_page, fids_page_element, fids_page_element_mm, fids_page_group, fids_page_group_mm | (en fids/ directorio separado) | fids_machine_view, fids_page_view | Sistema de información de vuelos para pantallas en aeropuerto |
| 15 | **CUPPS / Periféricos** | cupps_connection, cupps_message, cupps_peripheral_usage, cupps_state, cupps_transaction, cupps_logging_application, cute_listener | (en includes/) | cupps_view | Common-Use Passenger Processing System + periféricos |
| 16 | **Mensajería / Postmaster** | postmaster, postmaster_controller, postmaster_attachment, postmaster_bq_packager, message_template_controller, message_scheduler, notification_event_controller, edifact_router_config | postmaster, postmaster_file, postmaster_payload, message_template | postmaster_view, message_template_view | Sistema de mensajería interna + EDIFACT + notificaciones |
| 17 | **Turnaround / Operaciones** | turnaround_plan_controller, turnaround_event_controller, turnaround_plan_event_controller, turnaround_report_controller | turnaround_plan, turnaround_event, turnaround_plan_event, bq_imp_flight_turnaround_event | turnaround_report_view | Gestión del ciclo de operaciones en tierra |
| 18 | **Financial / Pagos** | financial_transaction, cart, currency, exchange_rate, billing_unit | financial_transaction, cart, cc_transaction, billing_transaction | financial_view, cart_view | Transacciones financieras, carrito de compras |
| 19 | **Configuración / Admin** | app_configuration, carrier, airline, airplane, airplane_model, create_carrier, cabin_configuration, business_rule, country, station_controller | app_configuration, carrier, carrier_user, airplane, airplane_model, business_rule, station | app_configuration_view, carrier_view, airline_view | Config de aerolínea, aviones, estaciones, reglas de negocio |
| 20 | **Autenticación / Usuarios** | user_controller, user_group_controller, user_role_controller, user_session_controller, user_token_controller, user_manager | user, user_session, user_role, user_token, user_group, user_associated_role, user_associated_station | user_view, user_group_view | Gestión de usuarios, roles, sesiones, permisos |
| 21 | **Impresión (Print Jobs)** | print_job_controller, print_set_controller, printer_simulator | print_job, print_set | (no vistas dedicadas) | Sistema de impresión de pases de abordar, etiquetas |
| 22 | **Salud / COVID (Health)** | health_country_document_controller, health_product_controller, health_type_of_test_controller, health_tento_report_controller, health_revenue_report_controller | (no schemas explícitos encontrados) | health_tento_report_view | Módulo de salud para COVID/requisitos sanitarios |
| 23 | **Tripulación (Crew)** | crew, crew_group, crew_location | (en schemas/) | (no vistas separadas) | Gestión de tripulación y asignación |
| 24 | **Vehículos / Terrestre** | vehicle_controller, vehicle_allocation_controller, vehicle_history_controller, vehicle_manifest_controller, vehicle_manufacturer_controller, vehicle_model_controller, vehicle_type_controller, vehicle_traceability_controller | vehicle, vehicle_allocation, vehicle_history, vehicle_model | vehicle_view | Gestión de vehículos en tierra (GSE) |
| 25 | **MODI / InkTouch** | (entry: modi_call_api.php, touch_suite_handler.php) | ink_touch_device, ink_touch_action_log, ink_touch_user_action_log | (no vistas PHP dedicadas) | Dispositivos móviles de aeropuerto + TouchSuite |
| 26 | **Ink Integration Layer** | ink_cupps_broker, ink_cuss_broker, ink_dcs_cargo, ink_edifact_postmaster, ink_integrations, ink_loop_dcs | (no schemas propios) | — | Capa de integración interna Ink — brokers y adaptadores |
| 27 | **Reportes Centrales** | central_report, report_master_controller, report_user_permission_controller, system_report_controller | report_master | central_report_view | Framework de reportes configurables |

---

## Controladores Sin Clasificar

Los siguientes controladores requieren inspección adicional de código para clasificación precisa:

| Controlador | Posible Dominio | Motivo de Ambigüedad |
|---|---|---|
| `access_remote_url` | Sistema / Infra | Nombre genérico — acceso remoto a URLs |
| `ajax_request`, `ajax_responder` | Shared/Infra | Handlers genéricos de AJAX |
| `ai_agency` | PSS/Agencia? | Posible integración con agencias IA |
| `amazon_bucket_name` | Infra/Storage | Gestión de buckets S3 |
| `attendee` | APIS/Event | Podría ser manifiesto de pasajeros en eventos |
| `aws_event` | Infra | Eventos AWS — posiblemente webhooks |
| `big_query_job` | Analytics | Jobs para envío a BigQuery |
| `bq_postmaster`, `bq_queued_job` | Analytics/MQ | Wrappers BQ para postmaster y jobs |
| `cabinly` | Seating? | No claro — podría ser cabina u otro sistema |
| `central_migration` | Infra/DB | Migraciones de base de datos |
| `cfdi_catalog` | Payments/MX | Catálogo CFDI (facturación Mexico) |
| `change`, `changelog` | Admin/System | Sistema de control de cambios |
| `cms_document`, `cms_document_element` | Config/CMS | Documentos de configuración — CMS interno |
| `commercial_company` | Config | Empresa comercial — relación con tenants |
| `common` | Shared | Clase base/compartida |
| `contract` | Config/Comercial | Contratos — posiblemente multi-tenant |
| `data_housekeeping` | System | Limpieza de datos |
| `dcs` | Core/Config | Descriptor genérico del DCS |
| `deleted_passenger` | Passenger/GDPR | Gestión de borrado de pasajeros (GDPR) |
| `department` | Config/Users | Departamentos de organización |
| `depot_report` | Baggage? | Informe de depósito |
| `edifact_router/*` | Mensajería | Ya clasificado en Mensajería pero podría ser módulo propio |
| `export_json_object` | Infra | Export genérico de objetos JSON |
| `gateway_server` | Infra | Servidor gateway |
| `gearman_monitor` | Infra | Monitor de Gearman (job server legacy) |
| `health_managment` | Health | Gestión general de salud (typo en nombre) |
| `print_debug` | Infra/Debug | Debugging de impresión |
| `system_test*` | QA | Suite de pruebas del sistema |
| `transfer`, `transfer_report_controller` | Pasajeros | Transferencia de pasajeros |
| `update_action`, `update_action_controller` | Infra | Actualizaciones de acciones |

---

## Código Transversal y Compartido

### Infraestructura Base (Alta complejidad de extracción)

| Componente | Archivo | Módulos que lo usan | Impacto en reescritura |
|---|---|---|---|
| `row` base class | `includes/row.class.php` (inferido) | **TODOS los módulos** — todos los schemas extienden `row` | Crítico: requiere reemplazar ORM completo |
| `ink_autoload()` | `includes/local_functions.php:54-129` | **TODOS** | Crítico: define cómo se cargan TODAS las clases legacy |
| `local_functions.php` | `includes/local_functions.php` | **TODOS** | Crítico: funciones globales compartidas |
| `session` service | `includes/session_service.class.php` | Todos los controladores | Alto: auth y estado por tenant |
| Dispatch pattern | Base controller | Todos los controladores legacy | Alto: patrón arquitectónico central |

### Caching (Fácilmente extraíble — capa ya modularizada)

| Componente | Archivo | Módulos que lo usan | Impacto |
|---|---|---|---|
| `modules/Cache/` | Cacher, GlobalCacher, CacheElement, CacheGroup | Múltiples módulos vía Facade | Bajo: ya modularizado con Facade |
| `modules/Facades/Cache` | `modules/Facades/Cache.php` | Cualquier módulo que use caché | Bajo: interfaz limpia |
| XCache | `do_key_exists()`, `xcache_set()` | ink_autoload, session | Medio: XCache deprecado en PHP 8 |

### Logging / Analytics (Fácilmente extraíble)

| Componente | Archivo | Módulos que lo usan | Impacto |
|---|---|---|---|
| `modules/Logs/ActionLogger` | `modules/Logs/ActionLogger.php` | Múltiples módulos operacionales | Bajo: ya encapsulado |
| `modules/Logs/BQHandler` | `modules/Logs/BQHandler.php` | Cualquier módulo con analytics | Bajo: interfaz limpia |
| BigQuery schemas `bq_imp_*` | `schemas/bq_imp_*.schema.php` (17 tablas) | Logging/Analytics de todos los flujos | Bajo: captura eventos |

### Base de Datos (Alta complejidad)

| Componente | Archivo | Módulos que lo usan | Impacto |
|---|---|---|---|
| `modules/Facades/DB` | `modules/Facades/DB.php` | Todos los módulos modernos | Medio: wrapper DB — debe reemplazarse con ORM estándar |
| Schema system `*.schema.php` | `schemas/` (300+) | **Todos los módulos** | Crítico: 300+ definiciones de tabla sin migraciones SQL |
| `eval()` en ink_autoload | `includes/local_functions.php:120` | Fallback global | Crítico: genera modelos dinámicamente — inseguro y no testeable |

### Jobs / Background Processing (Fácilmente extraíble)

| Componente | Archivo | Módulos que lo usan | Impacto |
|---|---|---|---|
| `modules/QueuedJobs/BaseJob` | `modules/QueuedJobs/BaseJob.php` | Check-in, Boarding, Baggage, Messaging | Bajo: ya modularizado |
| `modules/QueuedJobs/RedisDispatcher` | `modules/QueuedJobs/RedisDispatcher.php` | Todos los módulos que disparan jobs | Bajo: interfaz clara |

### Business Rules (Medio)

| Componente | Archivo | Módulos que lo usan | Impacto |
|---|---|---|---|
| `business_rule`, `business_rule_option` | `includes/business_rule_controller.class.php` | Potencialmente todos los módulos | Medio: reglas transversales — requiere análisis de referencias |

---

## Resumen por Tamaño de Módulo

| Tamaño | Módulos |
|---|---|
| **Grande** (20+ controladores) | Passenger Management (40+), Weight & Balance/AHM (20+), Kiosk/CUSS (15+), Flight Management (15+) |
| **Mediano** (5-19 controladores) | Check-in (8), Boarding (5), Seating (8), APIS/Border (8), FIDS (9), CUPPS (6), Mensajería (10+), Users/Auth (10+), Config/Admin (10+), Vehicles (8+), Health (8+), Turnaround (5), Baggage (10+) |
| **Pequeño** (<5 controladores) | Ancillaries (4), Timatic (4), Printing (3), Crew (3), Bag Drop (2), Financial (4), MODI/InkTouch (2) |

---

## Observaciones Críticas para la Reescritura

1. **Acoplamiento máximo con `row`**: Los 300+ schemas extienden una clase base `row` — la extracción de cualquier módulo requiere desacoplar este ORM primero o replicar la interfaz.

2. **Passenger Management es el núcleo**: El módulo más grande (40+ controladores) con dependencias cruzadas a casi todos los demás módulos — es el núcleo del monolith y el más costoso de extraer.

3. **AHM/Loadsheet tiene 18 secciones**: Cada `ahm560c{N}` es una sección del AHM 560 (IATA standard) — parecen independientes entre sí pero forman un documento unificado. Candidato a extraer como un solo módulo.

4. **Módulo Health aislado**: Los controladores `health_*` están bien delimitados — candidato de extracción de baja complejidad.

5. **FIDS independiente**: Los controladores `fids_*` tienen su propio subdirectorio (`fids/`) y pueden ser un servicio independiente.

6. **Vehicles independiente**: El módulo de vehículos GSE es autónomo — candidato para extracción temprana.

7. **Multitenancy por variante de kiosk**: `cuss_selfcheckin_jet2_kiosk`, `cuss_selfcheckin_wizz_kiosk` son variantes por tenant — el módulo CUSS tiene lógica tenant-específica embedded.
