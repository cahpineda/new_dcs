---
plan: "02-02"
phase: 2-functional-module-identification
generated_at: 2026-04-29
data_source: project2context (search_files, query_functions, export_core_network) — session 795eedb2bd7c41538670d46cc1e11ff4
---

# SCOPE-MODULOS.md — Scope FE/BE/DB por Módulo

> **Metodología**: Datos de `view_template_custom/` (200 results), `includes/` (200+ controllers), `schemas/` (200+ schemas), WS API versions (100 files), `webci/` (50+ tenant overrides). Todas las rutas son verificadas via P2C.

---

## ⚠️ MÓDULO NÚCLEO: Departure Control

> Este módulo NO es candidato de extracción — es el orquestador del sistema. Todo el análisis de dependencias se construye desde aquí.

**Dependencia departure_control**: ES el núcleo — N/A

#### FE (Frontend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Entry point PHP | `departure_control.php` | Pantalla principal DCS — entry point HTTP raíz |
| JS principal | `departure_control_javascript.php` | Bundle JS completo del DCS |
| JS library | `departure_control_javascript_library.php` | Librería JS del DCS |
| JS library min | `departure_control_javascript_library_min.php` | Versión minificada |
| JS min 1/2/3 | `departure_control_javascript_min_1/2/3.php` | Splits minificados |
| JS suite | `departure_control_javascript_suite.php` | Suite JS combinada |
| jQuery | `departure_control_jquery.php` | Integración jQuery DCS |
| JS module | `view_template_custom/departure_control.js` | Módulo JS de la pantalla principal |
| AJAX handler | `view_template_custom/departure_control_ajax.js` | Handlers AJAX del DCS |
| Constantes JS | `view_template_custom/departure_control_constants_javascript.js` | Constantes JS del DCS |
| Vuelo tab JS | `view_template_custom/departure_control_flight_tab.js` | Tab de vuelo en pantalla DCS |
| Item JS | `view_template_custom/departure_control_item.js` | Item de pasajero en DCS |

#### BE (Backend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Controlador núcleo | `includes/departure_control_controller.class.php` | **Orquestador principal del DCS** |
| Controlador web borders | `includes/webborders_departure_controller.class.php` | Vista de web borders bajo DCS |
| Controlador border control | `includes/border_control_departure_controller.class.php` | Control de frontera en contexto DCS |
| Analytics screen | `includes/bq_departure_control_screen.class.php` | BigQuery: eventos de pantalla DCS |
| Analytics session | `includes/bq_departure_control_session.class.php` | BigQuery: sesiones DCS |
| Detector de contexto | `includes/local_functions.php::is_departure_control_desk_request()` | Define si el request es DCS |

#### DB (Base de Datos)
| Schema | Tipo | Descripción |
|---|---|---|
| `schemas/bq_departure_control_screen.schema.php` | Propio | Registro de pantallas DCS en BQ |
| `schemas/bq_departure_control_session.schema.php` | Propio | Registro de sesiones DCS en BQ |
| (tablas del sistema completo) | Compartida ⚠️ | DCS lee/escribe en passenger, flight, seat, boarding, baggage — toda la DB del sistema |

---

## 1. Check-in de Pasajeros (Departure Control subsistema)

**Dependencia departure_control**: ✅ DIRECTA — opera bajo contexto DCS (`ajax_responder::process_do_checkin()`)

#### FE (Frontend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Template | `view_template_custom/checkin_passengers_template.php` | Template HTML del check-in |
| JS APIS | `view_template_custom/apis_responses_javascript.php` | JS para respuestas APIS |
| JS webci vars | `view_template_custom/common_webcute_js_vars.php` | Variables JS comunes |
| JS bgr reading | `view_template_custom/common_webcute_bgr_reading.php` | Lectura de tarjetas |
| Tenant overrides | `webci/{tenant}/config.php` (11+ tenants) | Config PHP por tenant (avior, airmalta, bermudair, amapola, ais, creebec, ...) |
| APIs PHP | `webci/apis.php` | Procesamiento APIS web check-in |
| Seat choice | `webci/choose_seat.php` | Selector de asiento WEBCI |

#### BE (Backend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Controlador principal | `includes/webci_controller.class.php` | Flujo multi-step web check-in |
| Controlador pasajero | `includes/checkin_passenger_controller.class.php` | Operaciones de check-in de pasajero |
| Controlador check | `includes/check_passenger_controller.class.php` | Validaciones pre-check-in |
| Controlador identidad | `includes/update_identity_controller.class.php` | Actualización de identidad |
| Controlador AJAX | `includes/ajax_responder_controller.class.php` | Handler AJAX incl. `process_do_checkin()` |
| Entry point | `web_checkin.php` | Entry HTTP root |
| Servicio login | `includes/login_service.class.php` | Autenticación para WEBCI |

#### DB (Base de Datos)
| Schema | Tipo | Dependencias |
|---|---|---|
| `schemas/checkin_transaction.schema.php` | Propia | → passenger, scheduled_flight ⚠️ |
| `schemas/app_form_passenger.schema.php` | Propia | → app_form, passenger ⚠️ |
| `schemas/app_form_status.schema.php` | Propia | — |
| `schemas/boarding_pass.schema.php` | Compartida ⚠️ | Boarding también la usa |
| `schemas/boarding_pass_number.schema.php` | Compartida ⚠️ | Boarding también la usa |

---

## 2. Self Check-in Kiosk (CUSS)

**Dependencia departure_control**: ✅ DIRECTA — `bq_departure_control_session` registra sesiones kiosk bajo DCS

#### FE (Frontend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Entry point CUSS std | `selfcheckin_kiosk_cuss_frame.php` | Frame CUSS estándar |
| Entry point CUSS Jet2 | `selfcheckin_jet2_kiosk_cuss_frame.php` | Frame CUSS Jet2 (tenant) |
| Entry point CUSS Wizz | (via cuss_selfcheckin_wizz_kiosk_controller) | Frame CUSS Wizz Air (tenant) |
| JS kiosk session | (en includes/) | JS embebido en controladores kiosk |

#### BE (Backend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Controlador CUSS std | `includes/cuss_selfcheckin_kiosk_controller.class.php` | Kiosk estándar CUSS |
| Controlador CUSS Jet2 | `includes/cuss_selfcheckin_jet2_kiosk_controller.class.php` | Kiosk Jet2 |
| Controlador CUSS Wizz | `includes/cuss_selfcheckin_wizz_kiosk_controller.class.php` | Kiosk Wizz Air |
| Controlador CUSS bags | `includes/cuss_selfcheckin_bags_kiosk_controller.class.php` | Kiosk bag drop integrado |
| Controlador kiosk std | `includes/cuss_kiosk_standard_controller.class.php` | Kiosk estándar genérico |
| Manager | `includes/kiosk_manager_controller.class.php` | Gestión de kioscos |
| Session ctrl | `includes/kiosk_session_controller.class.php` | Sesiones de kiosk |
| Monitor | `includes/kiosks_monitor_controller.class.php` | Monitoreo de kioscos |
| selfcheckin ctrl | `includes/selfcheckin_kiosk_controller.class.php` | Controlador autoservicio check-in |

#### DB (Base de Datos)
| Schema | Tipo | Dependencias |
|---|---|---|
| `schemas/kiosk_session.schema.php` | Propia | → passenger, scheduled_flight ⚠️ |
| `schemas/kiosk_session_passenger.schema.php` | Propia | → kiosk_session, passenger ⚠️ |
| `schemas/kiosk_session_screen.schema.php` | Propia | → kiosk_session |
| `schemas/kiosk_session_screen_action.schema.php` | Propia | → kiosk_session_screen |
| `schemas/cuss_kiosk.schema.php` | Propia | — |
| `schemas/bq_imp_kiosk_session.schema.php` | Propia (BQ) | Analytics de sesiones kiosk |
| `schemas/bq_imp_kiosk_session_passenger.schema.php` | Propia (BQ) | Analytics por pasajero |
| `schemas/bq_imp_kiosk_session_screen.schema.php` | Propia (BQ) | Analytics por pantalla |

---

## 3. Boarding & Gate

**Dependencia departure_control**: ✅ DIRECTA — `boarding_tab_controller` recibe instancia DCS en constructor

#### FE (Frontend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Entry point | `selfboarding.php` | Embarque autoservicio |
| JS | `view_template_custom/boarding_gate_javascript.php` | JS pantalla de puerta |
| Template | `view_template_custom/boarding_gate_view_template.php` | HTML puerta de embarque |
| JS class | `view_template_custom/boarding_master.class.js` | Clase JS boarding master |
| JS tab class | `view_template_custom/boarding_tab.class.js` | Clase JS boarding tab |
| Informe | `view_template_custom/boarding_transaction_report_view_template.php` | Informe de transacciones |

#### BE (Backend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Controlador gate | `includes/boarding_gate_controller.class.php` | Operaciones de puerta de embarque |
| Controlador tab | `includes/boarding_tab_controller.class.php` | Vista de tab boarding en DCS |
| Controlador autoservicio | `includes/selfboarding_controller.class.php` | Autoservicio de embarque |
| Pasajero embarcado | `includes/boarded_passenger_controller.class.php` | Registro de pasajeros embarcados |

#### DB (Base de Datos)
| Schema | Tipo | Dependencias |
|---|---|---|
| `schemas/boarding_gate.schema.php` | Propia | → scheduled_flight ⚠️ |
| `schemas/boarding_transaction.schema.php` | Propia | → passenger, scheduled_flight ⚠️ |
| `schemas/boarded_passenger.schema.php` | Propia | → passenger, scheduled_flight ⚠️ |
| `schemas/boarding_pass.schema.php` | Compartida ⚠️ | Check-in también genera boarding pass |
| `schemas/boarding_group_list.schema.php` | Propia | → carrier |
| `schemas/boarding_group_list_item.schema.php` | Propia | → boarding_group_list |
| `schemas/bq_imp_boarding_transaction.schema.php` | Propia (BQ) | Analytics de boarding |
| `schemas/bq_imp_boarded_passenger.schema.php` | Propia (BQ) | Analytics de pasajeros embarcados |

---

## 4. Bag Drop / SSBD

**Dependencia departure_control**: ✅ INDIRECTA — SSBD opera como canal de baggage que alimenta departure control

#### FE (Frontend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Entry point | `ssbd_handler.php` | Handler Self-Service Bag Drop |
| Informe 6-sigma | `view_template_custom/bag_drop_6_sigma_report_view_template.php` | Reporte sigma |

#### BE (Backend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Controlador kiosk | `includes/bag_drop_kiosk_controller.class.php` | Kiosk de bag drop |
| Informe | `includes/bag_drop_6_sigma_report_controller.class.php` | Reporte 6-sigma bag drop |

#### DB (Base de Datos)
| Schema | Tipo | Dependencias |
|---|---|---|
| `schemas/bag_drop_transaction.schema.php` | Propia | → passenger, scheduled_flight ⚠️ |
| `schemas/bag_characteristic.schema.php` | Propia | → bag_drop_transaction |
| `schemas/baggage_photo.schema.php` | Propia | → passenger |
| `schemas/bq_imp_bag_drop_transaction.schema.php` | Propia (BQ) | Analytics |

---

## 5. Baggage Management (BRS)

**Dependencia departure_control**: ✅ DIRECTA — departure control gestiona el estado de equipaje

#### FE (Frontend)
| Tipo | Ruta | Descripción |
|---|---|---|
| JS carousel | (en includes/) | Interface carousel de recogida |
| JS scan | `view_template_custom/baggage_scan_javascript.php` | JS de escáner de equipaje |
| Template drop | `view_template_custom/baggage_drop_view_template.php` | HTML drop de equipaje |
| JS bags cloud | `view_template_custom/bags_cloud_javascript.php` | JS bags cloud |
| JS tag report | `view_template_custom/baggage_tag_report_javascript.php` | JS informe de tags |
| Template tag report | `view_template_custom/baggage_tag_report_view_template.php` | HTML informe de tags |
| Template BRS report | `view_template_custom/brs_report_view_template.php` | Informe BRS |
| JS/Template BRS overview | `view_template_custom/brsoverview_report_javascript.php` + `_view_template.php` | BRS overview |

#### BE (Backend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Carousel | `includes/baggage_carousel_controller.class.php` | Carrusel de recogida de equipaje |
| Drop | `includes/baggage_drop_controller.class.php` | Drop de equipaje |
| Scan | `includes/baggage_scan_controller.class.php` | Escáner BRS |
| Tag number | `includes/baggage_tag_number_controller.class.php` | Asignación de números de tag |
| Tag report | `includes/baggage_tag_report_controller.class.php` | Informe de tags |
| Weight report | `includes/baggage_weight_report_controller.class.php` | Informe de pesos |
| Bags cloud | `includes/bags_cloud_controller.class.php` | Gestión bags en cloud |
| BRS report | `includes/brs_report_controller.class.php` | Informe BRS |
| BRS overview | `includes/brsoverview_report_controller.class.php` | Overview BRS |

#### DB (Base de Datos)
| Schema | Tipo | Dependencias |
|---|---|---|
| `schemas/baggage_scan.schema.php` | Propia | → passenger, scheduled_flight ⚠️ |
| `schemas/baggage_tag.schema.php` | Propia | → passenger, baggage_scan |
| `schemas/baggage_brs_tag.schema.php` | Propia | → baggage_tag |
| `schemas/baggage_scan_status.schema.php` | Propia | → baggage_scan |
| `schemas/baggage_carousel.schema.php` | Propia | → scheduled_flight ⚠️ |
| `schemas/brs_bag_exception.schema.php` | Propia | — |
| `schemas/brs_container_flight.schema.php` | Propia | → scheduled_flight ⚠️ |
| `schemas/brs_mark_reason.schema.php` | Propia | — |
| `schemas/brs_type_of_storage.schema.php` | Propia | — |
| `schemas/bq_imp_baggage_tag.schema.php` | Propia (BQ) | Analytics |
| `schemas/bq_imp_baggage_tracking.schema.php` | Propia (BQ) | Analytics |

---

## 6. Flight Management

**Dependencia departure_control**: ✅ DIRECTA — `flight.class.php::get_boarding_groups_for_departure_control()` y múltiples métodos alimentan DCS

#### FE (Frontend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Dashboard JS | `view_template_custom/flight_dashboard_view_template.php` (inferred) | Dashboard de vuelos |
| JS archived | `view_template_custom/archived_fligth_report_javascript.php` | Informe de vuelos archivados |
| Template archived | `view_template_custom/archived_fligth_report_edit_template.php` | Template edición |

#### BE (Backend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Scheduled flight | `includes/scheduled_flight_controller.class.php` | CRUD vuelos programados |
| Departure control | `includes/departure_control_controller.class.php` | Orchestrator (núcleo) |
| Flight dashboard | `includes/flight_dashboard_controller.class.php` | Dashboard operacional |
| Flight search | `includes/flight_search_controller.class.php` | Búsqueda de vuelos |
| Flight register | `includes/flight_register_controller.class.php` | Registro de vuelos |
| Flight report | `includes/flight_report_controller.class.php` | Informes de vuelos |
| Flight authority | `includes/flight_authority_controller.class.php` | Autorizaciones de vuelo |
| Departure ctrl ctrl | `includes/departure_control_controller.class.php` | Control de partida |
| Generate SSIM | `includes/generate_ssim_controller.class.php` | Generación SSIM |
| Delay code | `includes/delay_code_controller.class.php` | Códigos de retraso |

#### DB (Base de Datos)
| Schema | Tipo | Dependencias |
|---|---|---|
| `schemas/scheduled_flight.schema.php` | **Central** ⚠️⚠️ | **Referenciada por todos los módulos operacionales** |
| `schemas/action_flight.schema.php` | Propia | → scheduled_flight ⚠️ |
| `schemas/flight_authority.schema.php` | Propia | → scheduled_flight |
| `schemas/flight_register.schema.php` | Propia | → scheduled_flight |
| `schemas/bq_imp_flight.schema.php` | Propia (BQ) | Analytics |
| `schemas/bq_imp_flight_aircraft_movement.schema.php` | Propia (BQ) | Analytics |

---

## 7. Passenger Management

**Dependencia departure_control**: ✅ DIRECTA — `passenger::can_be_checked_in()` consulta contexto DCS; `copy_from_passenger_for_transfer()` también

#### FE (Frontend)
| Tipo | Ruta | Descripción |
|---|---|---|
| (Vistas dispersas por módulos) | — | El pasajero es entidad transversal — no tiene UI propia |

#### BE (Backend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Clase central | `includes/passenger.class.php` | **Entidad central** — incluye `can_be_checked_in()` |
| Controlador | `includes/checkin_passenger_controller.class.php` | Operaciones check-in |
| Foto | `includes/passenger_photo_controller.class.php` | Fotos de pasajeros |
| Búsqueda | `includes/passenger_search_controller.class.php` | Búsqueda de pasajeros |
| Handler Ink | `includes/ink_passenger_handler_controller.class.php` | Handler interno |
| Fee | `includes/passenger_fee_controller.class.php` | Tarifas de pasajero |
| Informe jornada | `includes/passenger_journey_report_controller.class.php` | Informe jornada |
| Handler handback | `includes/passenger_handback_report_controller.class.php` | Informe handback |

#### DB (Base de Datos)
| Schema | Tipo | Dependencias |
|---|---|---|
| `schemas/passenger.schema.php` (inferido) | **Central** ⚠️⚠️ | **Referenciada por todos los módulos que registran personas** |
| `schemas/passenger_status_change.schema.php` | Propia | → passenger, scheduled_flight ⚠️ |
| `schemas/passenger_document.schema.php` | Propia | → passenger |
| `schemas/passenger_apis.schema.php` | Propia | → passenger |
| `schemas/passenger_contact.schema.php` | Propia | → passenger |
| `schemas/passenger_ancillary_item.schema.php` | Compartida ⚠️ | → passenger + Ancillaries |
| `schemas/passenger_loyalty.schema.php` | Propia | → passenger |
| `schemas/passenger_name_record.schema.php` | Propia | → passenger |
| `schemas/bq_imp_passenger.schema.php` | Propia (BQ) | Analytics |
| `schemas/bq_imp_passenger_ancillary_item.schema.php` | Propia (BQ) | Analytics |
| `schemas/bq_imp_passenger_apis.schema.php` | Propia (BQ) | Analytics |

---

## 8. Seating / Seat Map

**Dependencia departure_control**: ✅ DIRECTA — `seat_master::seat_group_of_passenger()` + `zone_balanced_seating` operan bajo DCS; `airplane::get_airplane_options_for_departure_control()`

#### FE (Frontend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Cabin config JS | `view_template_custom/cabin_configuration_javascript.php` | JS configuración de cabina |
| Cabin config template | `view_template_custom/cabin_configuration_view_template.php` | HTML configuración cabina |
| Cabin config edit | `view_template_custom/cabin_configuration_edit_template.php` | Template edición cabina |
| Ajax cabin | `view_template_custom/ajax_cabin_configuration.php` | AJAX configuración cabina |
| Cabinly | `view_template_custom/cabinly_view_template.php` | Template cabinly |
| Cargo editor | `view_template_custom/cargo_editor_template.php` | Editor de carga |

#### BE (Backend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Seat master | `includes/seat_master.class.php` | Gestión maestra de asientos |
| Seat controller | `includes/seat_controller.class.php` | CRUD asientos |
| Seat plan updater | `includes/seat_plan_updater_controller.class.php` | Actualización de planos |
| Seat IATA code | `includes/seat_iata_code_controller.class.php` | Códigos IATA de asientos |
| Seating service | `includes/seating_service.class.php` | Servicio de asignación |
| Cabin configuration | `includes/cabin_configuration_controller.class.php` | Config de cabina |
| Zone balanced | `includes/zone_balanced_seating.class.php` | Seating balanceado por zonas |

#### DB (Base de Datos)
| Schema | Tipo | Dependencias |
|---|---|---|
| `schemas/seat.schema.php` | Propia | → airplane_cabin_configuration ⚠️ |
| `schemas/seat_allocation.schema.php` | Compartida ⚠️ | → passenger, scheduled_flight, seat ⚠️ |
| `schemas/seat_iata_code.schema.php` | Propia | — |
| `schemas/airplane_cabin_configuration.schema.php` | Compartida ⚠️ | → airplane_model, cabin_configuration ⚠️ |
| `schemas/cabin_configuration.schema.php` | Propia | → carrier ⚠️ |
| `schemas/cabin_configuration_section.schema.php` | Propia | → cabin_configuration |
| `schemas/cabin_passengers_distribution.schema.php` | Propia | → scheduled_flight ⚠️ |

---

## 9. Weight & Balance / AHM

**Dependencia departure_control**: ✅ DIRECTA — AHM/loadsheet son outputs de la pantalla DCS

#### FE (Frontend)
| Tipo | Ruta | Descripción |
|---|---|---|
| AHM JS | `view_template_custom/ahm_view_javascript.php` | JS de la pantalla AHM |
| AHM560 template | `view_template_custom/ahm560_view_template.php` (inferred) | Template AHM 560 |

#### BE (Backend)
| Tipo | Ruta | Descripción |
|---|---|---|
| AHM principal | `includes/ahm_controller.class.php` | Controlador AHM master |
| AHM560 | `includes/ahm560_controller.class.php` | AHM 560 sections |
| AHM560 A1-D3 | `includes/ahm560a1_controller.class.php` ... `ahm560d3_controller.class.php` | 18 secciones del AHM 560 |
| Loadsheet | `includes/loadsheet_controller.class.php` | Loadsheet del vuelo |
| AHM envelope | `includes/ahm_envelope_controller.class.php` | Envolvente CG del avión |
| Load control svc | `includes/load_control_service.class.php` | Servicio de control de carga |

#### DB (Base de Datos)
| Schema | Tipo | Dependencias |
|---|---|---|
| `schemas/ahm.schema.php` | Propia | → scheduled_flight ⚠️ |
| `schemas/ahm560a1-d3.schema.php` (18 schemas) | Propia | → ahm ⚠️ |
| `schemas/ahm_envelope.schema.php` | Propia | → airplane_model ⚠️ |
| `schemas/ahm_distribution.schema.php` | Propia | → ahm |
| `schemas/bq_imp_lc_loadsheet.schema.php` | Propia (BQ) | Analytics loadsheet |

---

## 10. Web Service API (Mobile — versiones v1.1 a v1.9+)

**Dependencia departure_control**: ⚪ INDIRECTA — WS API consulta estado del pasajero/vuelo (managed by DCS)

**Nota**: Este es el **hub técnico** del sistema (132-142 conexiones en grafo P2C). Las múltiples versiones soportan clientes móviles con versiones distintas activas simultáneamente.

#### FE (Frontend)
Sin frontend propio — API headless.

#### BE (Backend)
| Tipo | Ruta | Descripción |
|---|---|---|
| WS Master v1.1–v1.9 | `includes/ws_v{N}/web_service_master.class.php` | Punto de entrada del web service |
| WS Passenger (hub) | `includes/ws_v{N}/ws_passenger.class.php` | **Más conectado del sistema** — `validate_pax_attributes` |
| WS Flight | `includes/ws_v{N}/ws_flight.class.php` | Operaciones de vuelo |
| WS Seat Plan | `includes/ws_v{N}/ws_seat_plan.class.php` | Plano de asientos |
| WS Boarding Pass | `includes/ws_v{N}/ws_boarding_pass.class.php` | Pases de abordar |
| WS Baggage Tag | `includes/ws_v{N}/ws_baggage_tag.class.php` | Tags de equipaje |
| WS Class | `includes/ws_v{N}/ws_class.class.php` | Clases base del WS |
| Mobile modules | `modules/Mobile/` (38 files) | Módulo Mobile moderno (Core, Turnaround) |
| REST entry | `rest/index.php` | Entry point Slim Framework |

#### DB (Base de Datos)
Sin tablas propias — opera sobre passenger, scheduled_flight, seat_allocation, boarding_pass, baggage_tag (todas compartidas con módulos operacionales).

---

## 11. FIDS (Flight Information Display System)

**Dependencia departure_control**: ⚪ NINGUNA — sistema de pantallas informativas, solo lee datos de vuelo

> **Candidato de extracción independiente (Nivel 0)**

#### FE (Frontend)
| Tipo | Ruta | Descripción |
|---|---|---|
| FIDS directorio | `fids/` (directorio propio) | Sistema FIDS autónomo |

#### BE (Backend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Flight | `includes/fids_flight_controller.class.php` | Info de vuelo para FIDS |
| Machine | `includes/fids_machine_controller.class.php` | Pantallas FIDS |
| Manager | `includes/fids_manager_controller.class.php` | Gestión FIDS |
| Monitor group | `includes/fids_monitor_group_controller.class.php` | Grupos de monitores |
| Page | `includes/fids_page_controller.class.php` | Páginas FIDS |
| Page element | `includes/fids_page_element_controller.class.php` | Elementos de página |
| Page group | `includes/fids_page_group_controller.class.php` | Grupos de páginas |

#### DB (Base de Datos)
| Schema | Tipo | Dependencias |
|---|---|---|
| `schemas/fids_machine.schema.php` (inferred) | Propia | — |
| `schemas/fids_page.schema.php` (inferred) | Propia | — |
| (tablas FIDS) | Propia | Lee scheduled_flight (solo lectura) ⚠️ |

---

## 12. CUPPS / Periféricos

**Dependencia departure_control**: ✅ DIRECTA — `ink_cupps_broker::get_xml_event()` (80 conexiones en grafo P2C) opera bajo contexto DCS

#### FE (Frontend)
Sin vistas HTML propias — protocolo binario CUPPS/hardware.

#### BE (Backend)
| Tipo | Ruta | Descripción |
|---|---|---|
| CUPPS Broker (hub) | `includes/ink_cupps_broker.class.php` | **2do más conectado del sistema** — 80 edges |
| CUSS Broker | `includes/ink_cuss_broker.class.php` | Broker para kioscos CUSS |
| CUPPS listener | `includes/cute_listener_controller.class.php` | Listener CUTE |
| Conexión | `includes/cupps_connection_controller.class.php` | Gestión de conexiones |
| Mensaje | `includes/cupps_message_controller.class.php` | Mensajes CUPPS |
| Transacción | `includes/cupps_transaction_controller.class.php` | Transacciones CUPPS |
| Estado | `includes/cupps_state_controller.class.php` | Estado de periféricos |

#### DB (Base de Datos)
| Schema | Tipo | Dependencias |
|---|---|---|
| `schemas/cupps_connection.schema.php` | Propia | → station ⚠️ |
| `schemas/cupps_message.schema.php` | Propia | → cupps_connection |
| `schemas/cupps_transaction.schema.php` | Propia | → cupps_connection, passenger ⚠️ |
| `schemas/cupps_peripheral_usage.schema.php` | Propia | — |
| `schemas/cupps_logging_application.schema.php` | Propia | — |

---

## 13. APIS / Travel Documents / Border Control

**Dependencia departure_control**: ✅ DIRECTA — border control departure obtiene instancia DCS

#### FE (Frontend)
| Tipo | Ruta | Descripción |
|---|---|---|
| APIS matrix | `view_template_custom/apis_matrix_report_view_template.php` | Reporte APIS |
| APIS responses JS | `view_template_custom/apis_responses_javascript.php` | JS respuestas APIS |
| APIS switch JS | `view_template_custom/apis_switch_javascript.php` | JS switch APIS |
| Border control | `view_template_custom/border_control_view_template.php` | HTML control de frontera |
| Border report | `view_template_custom/border_control_report_view_template.php` | Informe frontera |
| Border use report | `view_template_custom/border_control_use_report_view_template.php` | Informe uso frontera |
| PNRGOV converter | `view_template_custom/convert_pnrgov_view_template.php` | Converter PNR-GOV |
| Advance pax report | `view_template_custom/advance_passenger_report_view_template.php` | Informe anticipado |

#### BE (Backend)
| Tipo | Ruta | Descripción |
|---|---|---|
| APIS matrix | `includes/apis_matrix_report_controller.class.php` | Matriz APIS |
| APIS switch | `includes/apis_switch_controller.class.php` | Switch APIS |
| APIS response | `includes/apis_response_controller.class.php` | Respuestas APIS |
| Border departure | `includes/border_control_departure_controller.class.php` | Control frontera salida |
| Border arrival | `includes/border_control_arrival_controller.class.php` | Control frontera llegada |
| Convert PNRGOV | `includes/convert_pnrgov_controller.class.php` | Conversión PNR-GOV |
| Advance pax report | `includes/advance_passenger_report_controller.class.php` | Reporte anticipado |
| Immigration | `includes/immigration_controller.class.php` | Inmigración |

#### DB (Base de Datos)
| Schema | Tipo | Dependencias |
|---|---|---|
| `schemas/passenger_apis.schema.php` | Compartida ⚠️ | → passenger ⚠️ |
| `schemas/apis_switch.schema.php` | Propia | — |
| `schemas/border_movement.schema.php` | Propia | → passenger, scheduled_flight ⚠️ |
| `schemas/attendee.schema.php` | Propia | → scheduled_flight ⚠️ |
| `schemas/attendee_document.schema.php` | Propia | → attendee |

---

## 14. Vehículos / GSE

**Dependencia departure_control**: ⚪ NINGUNA — gestión de vehículos de tierra es operacionalmente independiente

> **Candidato de extracción independiente (Nivel 0)**

#### FE (Frontend)
| Tipo | Ruta | Descripción |
|---|---|---|
| (vistas en view_template_custom/) | `view_template_custom/vehicle*` | Vistas de gestión de vehículos |

#### BE (Backend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Controladores (8) | `includes/vehicle_*_controller.class.php` | CRUD vehículos, modelos, tipos, historial, asignación, manufactura, trazabilidad, manifiesto |

#### DB (Base de Datos)
| Schema | Tipo | Dependencias |
|---|---|---|
| `schemas/vehicle.schema.php` | Propia | — |
| `schemas/vehicle_allocation.schema.php` | Propia | → scheduled_flight ⚠️ (única dep) |
| `schemas/vehicle_history.schema.php` | Propia | → vehicle |
| `schemas/vehicle_model.schema.php` | Propia | — |
| `schemas/vehicle_type.schema.php` | Propia | — |

---

## 15. Health / COVID

**Dependencia departure_control**: ⚪ NINGUNA — módulo de validación sanitaria es autónomo

> **Candidato de extracción independiente (Nivel 0)**

#### FE (Frontend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Health reports | `view_template_custom/health_tento_report*` | Reportes salud |

#### BE (Backend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Controladores (8) | `includes/health_*_controller.class.php` | CRUD tipos, productos, documentos, grupos, reports |

#### DB (Base de Datos)
| Schema | Tipo | Dependencias |
|---|---|---|
| (health_* schemas) | Propia | Referencias a passenger para validaciones ⚠️ |

---

## 16. Turnaround / Operaciones en Tierra

**Dependencia departure_control**: ✅ INDIRECTA — eventos de turnaround se usan en analytics DCS

#### FE (Frontend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Turnaround reports | `view_template_custom/turnaround_report*` | Informes de turnaround |

#### BE (Backend)
| Tipo | Ruta | Descripción |
|---|---|---|
| Plan | `includes/turnaround_plan_controller.class.php` | Plan de turnaround |
| Event | `includes/turnaround_event_controller.class.php` | Eventos del plan |
| Plan event | `includes/turnaround_plan_event_controller.class.php` | Eventos específicos |
| Report | `includes/turnaround_report_controller.class.php` | Informes |
| Mobile module | `modules/Mobile/Turnaround.php` | API Mobile turnaround |

#### DB (Base de Datos)
| Schema | Tipo | Dependencias |
|---|---|---|
| `schemas/turnaround_plan.schema.php` | Propia | → scheduled_flight ⚠️ |
| `schemas/turnaround_event.schema.php` | Propia | — |
| `schemas/turnaround_plan_event.schema.php` | Propia | → turnaround_plan |
| `schemas/bq_imp_flight_turnaround_event.schema.php` | Propia (BQ) | Analytics |
| `schemas/bq_imp_inkturn_flight_data.schema.php` | Propia (BQ) | Analytics InkTurn |

---

## Tablas Más Compartidas (Puntos de Acoplamiento Máximo)

| Tabla | Módulos que la usan | Riesgo |
|---|---|---|
| `scheduled_flight` ⚠️⚠️⚠️ | Check-in, Boarding, Baggage, CUSS, W&B, APIS, Passenger, Turnaround, FIDS, Vehicle, WS API | **CRÍTICO** — hub de todos los módulos operacionales |
| `passenger` ⚠️⚠️⚠️ | Check-in, Boarding, Baggage, CUSS, APIS, CUPPS, WS API, Ancillaries | **CRÍTICO** — entidad central del sistema |
| `boarding_pass` ⚠️ | Check-in (genera), Boarding (lee), WS API (consulta) | Alto |
| `seat_allocation` ⚠️ | Seating, Check-in, CUSS, WS API | Alto |
| `cabin_configuration` ⚠️ | Seating, Config/Admin, WS API | Medio |

---

## Clasificación por Dependencia departure_control

| Nivel | Módulos | Estrategia de extracción |
|---|---|---|
| **Nivel 0** (extracción independiente) | FIDS, Vehículos/GSE, Health/COVID, Sistema de Impresión, Turnaround (parcial), Reportes Centrales | Pueden migrarse a microservicio sin dependencia DCS |
| **Nivel 1** (dependencia indirecta) | Baggage/BRS, SSBD/Bag Drop, Web Service API, Turnaround | Dependen de scheduled_flight/passenger (hub DB) |
| **Nivel 2** (dependencia directa de instancia) | Check-in, CUSS, Boarding, APIS/Border, CUPPS, Seating, W&B/AHM | Obtienen instancia departure_control o usan `is_departure_control_desk_request()` |
| **Núcleo** (último en migrarse) | Departure Control + Flight Management | El orquestador del sistema — requiere API de orquestación antes de extraer |
