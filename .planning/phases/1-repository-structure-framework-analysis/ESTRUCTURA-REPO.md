# Estructura del Repositorio cloud_2

> Fuente exclusiva: project2context MCP — https://github.com/inkaviation/cloud_2 (branch: main)
> Commit analizado: a0dde8702dc7cd569e2351942bacf6d36b85eaf0
> Fecha de análisis: 2026-04-29

---

## Resumen General

| Campo | Valor |
|-------|-------|
| Proyecto | cloud_2 |
| URL | https://github.com/inkaviation/cloud_2 |
| Rama | main |
| Lenguaje principal | PHP 8.2+ |
| Arquitectura | MVC-like personalizada (no framework estándar) |
| Framework REST | Slim Framework (endpoints legacy) |
| Frontend | jQuery + PHP view templates |
| Base de datos | MySQL / MariaDB |
| Módulos indexados | 5,362 (de 5,363 esperados) |
| Funciones | 31,576 |
| Clases | 2,357 |
| Total de entidades | 33,933 |
| Descripción | DCS System monolítico para cliente RX — gestiona check-in, asignación de asientos, gestión de vuelos, pagos (Stripe, Worldline), integraciones externas (Amadeus, Twilio, AWS/Google, RabbitMQ), y soporte multi-idioma/multi-moneda |

---

## Estructura de Directorios

### Directorios Raíz

| Directorio | Propósito |
|------------|-----------|
| `includes/` | Controladores y clases utilitarias del dominio DCS — patrón `*_controller.class.php` y `*.class.php` |
| `modules/` | Módulos PSR-4 bajo namespace `Ink\\` — funcionalidad moderna estructurada |
| `schemas/` | Definiciones de modelos de base de datos en PHP (capa ORM personalizada) — 300+ archivos |
| `view_template_custom/` | Templates jQuery/PHP para la interfaz web — 195+ archivos |
| `xero/` | Integración contable Xero con OAuth |
| `attest_ios_libs/` | Librerías de atestación iOS (phpseclib incluido) |
| `csrfp/` | Librería de protección CSRF |
| `voku_anti_xss/` | Librería Anti-XSS (vendor) |
| `websockets/` | Componente WebSocket Node.js/Express para actualizaciones en tiempo real |
| `fids/` | FIDS — Flight Information Display System (JS frontend) |
| `migrator/` | Scripts de migración de datos |
| `edifact_router/` | Router EDIFACT (dentro de includes/) |
| `big_query/` | Cliente PHP para Google BigQuery (dentro de includes/) |

### Archivos de Configuración Raíz

| Archivo | Propósito |
|---------|-----------|
| `configuration.php` | Configuración principal del sistema |
| `configuration_production.php` | Override para entorno de producción |
| `configuration_universal.php` | Configuración universal compartida |
| `edifact_router_config.php` | Configuración del router EDIFACT |
| `app_configurations.php` | Configuraciones de la aplicación |
| `cabin_configurations.php` | Configuraciones de cabina |

### Archivos de Procesos de Fondo

| Archivo | Propósito |
|---------|-----------|
| `queued_job_daemon.php` | Procesador de trabajos en cola (daemon principal) |
| `daemons_watch_dog.php` | Proceso watchdog para supervisar daemons |
| `daemon_killer.php` | Utilidad para detener daemons |

### Subdirectorios de `modules/` (namespace `Ink\\`)

| Subdirectorio | Archivos | Propósito |
|---------------|----------|-----------|
| `modules/cuws/` | 155 | Integración CUWS (SITA BAGS) — SOAP stubs, BaggageService, PaymentCardType |
| `modules/cuws/soap/src/` | 150 | Clases SOAP generadas: AddressType, BaggageService (Identify/Qualify/Verify), PaymentCardType |
| `modules/cuws/src/` | 5 | Lógica de negocio CUWS |
| `modules/Mobile/` | 38 | API móvil — versiones v3.7.0 a v3.18.0 (versionado explícito) |
| `modules/Ancillaries/` | 28 | Gestión de ancillaries — 3 variantes: Pribas, StandardV1, StandardV2 |
| `modules/QueuedJobs/` | 12 | Sistema de cola de trabajos en background |
| `modules/Logs/` | 8 | Sistema de logging estructurado |
| `modules/Cache/` | 5 | Capa de caché |
| `modules/Facades/` | 4 | Facades (patrón de diseño) |
| `modules/Providers/` | 2 | Service providers |
| `modules/core/` | 2 | Núcleo de la aplicación |
| `modules/DCS/` | 1 | Módulo DCS core |
| `modules/CloudApp.php` | 1 | Bootstrap principal de la aplicación |

---

## Controladores y Modelos

### Controladores (en `includes/`)

> Total encontrado: 200+ controladores (límite de búsqueda P2C). Lista parcial ordenada alfabéticamente.
> Patrón uniforme: `includes/{dominio}_controller.class.php`

| Controlador | Archivo |
|-------------|---------|
| access_remote_url | includes/access_remote_url_controller.class.php |
| advance_colombian_passenger_report | includes/advance_colombian_passenger_report_controller.class.php |
| advance_ecuadorian_passenger_report | includes/advance_ecuadorian_passenger_report_controller.class.php |
| advance_passenger_report | includes/advance_passenger_report_controller.class.php |
| ahm | includes/ahm_controller.class.php |
| ahm560 | includes/ahm560_controller.class.php |
| ahm560_document | includes/ahm560_document_controller.class.php |
| ahm560_pdf | includes/ahm560_pdf_controller.class.php |
| ahm560a1–ahm560d3 (18 variantes) | includes/ahm560a1_controller.class.php … includes/ahm560d3_controller.class.php |
| ahm_envelope | includes/ahm_envelope_controller.class.php |
| ai_agency | includes/ai_agency_controller.class.php |
| aircraft_stand | includes/aircraft_stand_controller.class.php |
| airline | includes/airline_controller.class.php |
| airplane | includes/airplane_controller.class.php |
| airplane_manufacturer | includes/airplane_manufacturer_controller.class.php |
| airplane_model | includes/airplane_model_controller.class.php |
| ajax_request | includes/ajax_request_controller.class.php |
| ajax_responder | includes/ajax_responder_controller.class.php |
| amadeus_afklm_passenger | includes/amadeus_afklm_passenger_controller.class.php |
| amazon_bucket_name | includes/amazon_bucket_name_controller.class.php |
| ancillary_instant | includes/ancillary_instant_controller.class.php |
| ancillary_item | includes/ancillary_item_controller.class.php |
| ancillary_item_type | includes/ancillary_item_type_controller.class.php |
| ancillary_product | includes/ancillary_product_controller.class.php |
| api_limit_rule | includes/api_limit_rule_controller.class.php |
| apis_matrix_report | includes/apis_matrix_report_controller.class.php |
| apis_response | includes/apis_response_controller.class.php |
| apis_switch | includes/apis_switch_controller.class.php |
| app_configuration | includes/app_configuration_controller.class.php |
| application | includes/application_controller.class.php |
| aws_event | includes/aws_event_controller.class.php |
| bag_drop_6_sigma_report | includes/bag_drop_6_sigma_report_controller.class.php |
| bag_drop_kiosk | includes/bag_drop_kiosk_controller.class.php |
| baggage_carousel | includes/baggage_carousel_controller.class.php |
| baggage_drop | includes/baggage_drop_controller.class.php |
| baggage_scan | includes/baggage_scan_controller.class.php |
| baggage_tag_number | includes/baggage_tag_number_controller.class.php |
| baggage_tag_report | includes/baggage_tag_report_controller.class.php |
| baggage_weight_report | includes/baggage_weight_report_controller.class.php |
| bags_cloud | includes/bags_cloud_controller.class.php |
| boarding_gate | includes/boarding_gate_controller.class.php |
| boarding_tab | includes/boarding_tab_controller.class.php |
| boarded_passenger | includes/boarded_passenger_controller.class.php |
| border_control_arrival | includes/border_control_arrival_controller.class.php |
| border_control_departure | includes/border_control_departure_controller.class.php |
| border_control_report | includes/border_control_report_controller.class.php |
| bq_postmaster | includes/bq_postmaster_controller.class.php |
| bq_queued_job | includes/bq_queued_job_controller.class.php |
| brs_bag_exception | includes/brs_bag_exception_controller.class.php |
| brs_container_flight | includes/brs_container_flight_controller.class.php |
| brs_report | includes/brs_report_controller.class.php |
| business_rule | includes/business_rule_controller.class.php |
| cabin_configuration | includes/cabin_configuration_controller.class.php |
| carrier | includes/carrier_controller.class.php |
| carrier_airplane_model | includes/carrier_airplane_model_controller.class.php |
| carrier_branding_passbook | includes/carrier_branding_passbook_controller.class.php |
| cart | includes/cart_controller.class.php |
| checkin_passenger | includes/checkin_passenger_controller.class.php |
| cupps_connection | includes/cupps_connection_controller.class.php |
| cupps_message | includes/cupps_message_controller.class.php |
| cupps_transaction | includes/cupps_transaction_controller.class.php |
| currency | includes/currency_controller.class.php |
| cuss_kiosk | includes/cuss_kiosk_controller.class.php |
| cuss_selfcheckin_kiosk | includes/cuss_selfcheckin_kiosk_controller.class.php |
| cuss_selfcheckin_bags_kiosk | includes/cuss_selfcheckin_bags_kiosk_controller.class.php |
| cuss_selfcheckin_jet2_kiosk | includes/cuss_selfcheckin_jet2_kiosk_controller.class.php |
| cuss_selfcheckin_wizz_kiosk | includes/cuss_selfcheckin_wizz_kiosk_controller.class.php |
| dcs | includes/dcs_controller.class.php |
| delay_code | includes/delay_code_controller.class.php |
| departure_control | includes/departure_control_controller.class.php |
| edifact | includes/edifact_router/edifact_controller.class.php |
| edifact_messages_log | includes/edifact_messages_log_controller.class.php |
| edifact_router_config | includes/edifact_router_config_controller.class.php |
| erplv5 | includes/edifact_router/erplv5_controller.class.php |
| excess_baggage_report | includes/excess_baggage_report_controller.class.php |
| excess_baggage_tariff | includes/excess_baggage_tariff_controller.class.php |
| fids_flight | includes/fids_flight_controller.class.php |
| fids_machine | includes/fids_machine_controller.class.php |
| fids_manager | includes/fids_manager_controller.class.php |
| financial_transaction | includes/financial_transaction_controller.class.php |
| flight_dashboard | includes/flight_dashboard_controller.class.php |
| flight_report | includes/flight_report_controller.class.php |
| flight_search | includes/flight_search_controller.class.php |
| gateway_server | includes/gateway_server_controller.class.php |
| generate_ssim | includes/generate_ssim_controller.class.php |
| matip | includes/edifact_router/matip_controller.class.php |

### Modelos (en `schemas/`)

> No se usa Eloquent ni ORM estándar. Los modelos son PHP schema files. Total: 300+ archivos.
> Patrón: `schemas/{entidad}.schema.php`

| Modelo | Archivo |
|--------|---------|
| access_remote_url | schemas/access_remote_url.schema.php |
| acknowledge_postmaster | schemas/acknowledge_postmaster.schema.php |
| action | schemas/action.schema.php |
| action_flight | schemas/action_flight.schema.php |
| addon | schemas/addon.schema.php |
| addon_type | schemas/addon_type.schema.php |
| ahm | schemas/ahm.schema.php |
| ahm560_document | schemas/ahm560_document.schema.php |
| ahm560_note | schemas/ahm560_note.schema.php |
| ahm560_pdf | schemas/ahm560_pdf.schema.php |
| ahm560a1 | schemas/ahm560a1.schema.php |
| ahm560a2 | schemas/ahm560a2.schema.php |
| ahm560a2_class | schemas/ahm560a2_class.schema.php |
| ahm560b1 | schemas/ahm560b1.schema.php |
| ahm560b1_extended_weight | schemas/ahm560b1_extended_weight.schema.php |
| ahm560b1_weight | schemas/ahm560b1_weight.schema.php |
| ahm560b2 | schemas/ahm560b2.schema.php |
| ahm560b3 | schemas/ahm560b3.schema.php |
| ahm560b3_item | schemas/ahm560b3_item.schema.php |
| ahm560c1–ahm560c14 (14 variantes + subtypes) | schemas/ahm560c1.schema.php … schemas/ahm560c14_ballast.schema.php |
| ahm560d1–ahm560d3 | schemas/ahm560d1.schema.php … schemas/ahm560d3.schema.php (inferido) |
| daemon | schemas/daemon.schema.php |

> Nota: 300 archivos schema encontrados. Los primeros 30 fueron listados explícitamente; el resto sigue el mismo patrón de nomenclatura.

---

## Vistas, Servicios, Jobs, Eventos y Middlewares

### Vistas

**Ubicación principal:** `view_template_custom/` — 195+ archivos

| Tipo | Descripción |
|------|-------------|
| PHP templates | Páginas de la aplicación — check-in, boarding, reports, admin |
| JavaScript (jQuery) | `login_auth.js`, `login_javascript.js`, `ancillary_products.js` |
| JS externo | `immigration_scan_data.class.js` — datos de escaneo migratorio |

**Otras vistas:**
- `fids/` — Frontend FIDS (Flight Information Display System) con `fids_configuration.js`
- `includes/FormValidation.js`, `includes/FusionCharts.js` — JS embebido legacy

**Patrón:** PHP inline + jQuery — no hay template engine estándar (no Twig, no Blade).

### Servicios (clases de lógica de negocio)

| Servicio | Archivo |
|----------|---------|
| login_service | includes/login_service.class.php |
| rabbitmq_client | includes/rabbitmq_client.class.php |
| stripe_payment | includes/stripe_payment.class.php |
| worldline_payment | includes/worldline_payment.class.php |
| worldline_legacy_payment | includes/worldline_legacy_payment.class.php |
| amadeus_dcs | includes/amadeus_dcs.class.php |
| amadeus_edifact_postmaster | includes/amadeus_edifact_postmaster.class.php |
| amadeus_afklm_passenger | includes/amadeus_afklm_passenger.class.php |
| amadeus_demo_dcs | includes/amadeus_demo_dcs.class.php |
| eticket_database_amadeus_control | includes/eticket_database_amadeus_control.class.php |
| twilio_client | includes/twilio_client.class.php |
| sms_message_master | includes/sms_message_master.class.php |
| big_query | includes/big_query.class.php |
| big_query_utility | includes/big_query_utility.class.php |
| bq_logger | includes/bq_logger.class.php |
| google_services_utility | includes/google_services_utility.class.php |
| sitagmsnet_postmaster | includes/sitagmsnet_postmaster.class.php |
| postmaster | includes/postmaster.class.php |
| email_postmaster | includes/email_postmaster.class.php |
| ink_passenger_handler | includes/ink_passenger_handler.class.php |
| user | includes/user.class.php |

### Jobs / Daemons

| Job/Daemon | Archivo | Tipo |
|------------|---------|------|
| queued_job_daemon | queued_job_daemon.php | Entrypoint PHP raíz |
| daemons_watch_dog | daemons_watch_dog.php | Entrypoint PHP raíz |
| daemon_killer | daemon_killer.php | Utilidad raíz |
| daemon (base) | includes/daemon.class.php | Clase base |
| daemon schema | schemas/daemon.schema.php | Modelo DB |
| queued_jobs_configure | includes/queued_jobs_configure.class.php | Config de colas |
| QueuedJobs (módulo) | modules/QueuedJobs/ (12 archivos) | Namespace Ink\\ |

### Middlewares

No existe directorio de middlewares estándar. El control transversal se implementa mediante:

| Mecanismo | Archivo/Directorio |
|-----------|-------------------|
| Protección CSRF | `csrfp/` (librería independiente) |
| Anti-XSS | `voku_anti_xss/` (vendor) |
| Validación de inputs | `includes/validator.class.php` |
| Control de acceso | A nivel de controlador (no middleware centralizado) |
| Autenticación | `includes/login_service.class.php` + `includes/user.class.php` |

---

## Configuración y Base de Datos

### Archivos de Configuración

| Archivo | Propósito |
|---------|-----------|
| `configuration.php` | Configuración principal (credenciales DB, paths, feature flags) |
| `configuration_production.php` | Override de producción |
| `configuration_universal.php` | Valores universales compartidos |
| `edifact_router_config.php` | Config router EDIFACT (tipos de mensaje, rutas) |
| `app_configurations.php` | Configuraciones de la aplicación |
| `cabin_configurations.php` | Configuraciones de cabina de aeronave |
| `includes/app_configuration.class.php` | Clase de configuración dinámica de app |
| `includes/app_configuration_country.class.php` | Config por país |
| `includes/app_configuration_doc_type.class.php` | Config de tipos de documento |
| `includes/airplane_cabin_configuration.class.php` | Config de cabina de aeronave |
| `includes/cabin_configuration.class.php` | Configuración de cabina |
| `includes/edifact_router_config.class.php` | Clase de config EDIFACT |
| `includes/queued_jobs_configure.class.php` | Configuración del sistema de colas |
| `includes/vmware_config.php` | Configuración VMware (infraestructura legacy) |

### Base de Datos

**Motor:** MySQL / MariaDB

**Capa de acceso a datos:** Schema system PHP personalizado — no usa Eloquent, Doctrine ni ningún ORM estándar.

| Directorio | Contenido |
|------------|-----------|
| `schemas/` | 300+ archivos `*.schema.php` — definen estructura de tablas y entidades del dominio DCS |
| `migrator/` | Scripts de migración de datos entre versiones (`cabin_configuration_migrator.class.php`, etc.) |

**Muestra de entidades en schemas/** (primeras 30 confirmadas por P2C):
access_remote_url, acknowledge_postmaster, action, action_flight, addon, addon_type, ahm, ahm560_document, ahm560_note, ahm560_pdf, ahm560a1, ahm560a2, ahm560a2_class, ahm560b1, ahm560b1_extended_weight, ahm560b1_weight, ahm560b2, ahm560b3, ahm560b3_item, ahm560c1–ahm560c14 (con subtipos), daemon

---

## Integraciones Externas (inventario inicial)

> Documentación detallada: planes 01-04 y fases posteriores. Este inventario es basado en archivos encontrados vía P2C.

| Sistema | Archivos clave | Protocolo |
|---------|---------------|-----------|
| **Amadeus** | `amadeus_dcs.class.php`, `amadeus_edifact_postmaster.class.php`, `amadeus_afklm_passenger.class.php`, `eticket_database_amadeus_control.class.php` | EDIFACT, AFKLM |
| **Stripe** | `stripe_payment.class.php` | REST API |
| **Worldline** | `worldline_payment.class.php`, `worldline_legacy_payment.class.php` | REST / Legacy |
| **Twilio** | `twilio_client.class.php` | REST SMS/Voice |
| **Google BigQuery** | `big_query.class.php`, `big_query_utility.class.php`, `google_services_utility.class.php` | Google Cloud API |
| **RabbitMQ** | `rabbitmq_client.class.php` | AMQP |
| **SITA CUWS** | `modules/cuws/soap/` (150 SOAP stubs) — BaggageService | SOAP/WSDL (IATA) |
| **SITAGMSNET** | `sitagmsnet_postmaster.class.php` | Mensajería SITA |
| **EDIFACT/MATIP** | `edifact_router/` (edifact, matip, erplv5 controllers) | EDIFACT |
| **Xero** | `xero/lib/XeroOAuth.php` | OAuth/REST |
| **AWS S3** | `amazon_bucket_name_controller.class.php` | AWS SDK |
