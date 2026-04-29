---
plan: "04-01"
phase: 4-third-party-integrations-catalogue
generated_at: 2026-04-29
data_source: >
  FRAMEWORK.md, MODULOS-CANDIDATOS.md, PUNTOS-ENTRADA.md (P2C session 795eedb2).
  cloud_2 no tiene composer.json — no hay dependencias de Composer. Integraciones detectadas
  por: módulos vendorizados in-tree, clases de servicio en includes/ y modules/, entry points.
---

# INTEGRACIONES-DESCUBIERTAS.md — Integraciones Externas del Monolito cloud_2

> **Nota**: cloud_2 no tiene `composer.json`. Las integraciones están implementadas como:
> 1. Librerías vendorizadas in-tree (directorio propio en el repo)
> 2. Clases custom que consumen APIs externas directamente via curl o PHP SOAP
> 3. Módulos PHP propios que implementan protocolos de la industria

---

## Integraciones HTTP/REST

| Servicio/Clase | URL/Dominio | Operaciones | Archivo |
|---|---|---|---|
| **Radixx PSS** | Radixx reservation system | Creación de vuelos desde PNR | `includes/radixx_flights_creator_service.class.php` |
| **BigQuery** | `bigquery.googleapis.com` | INSERT analytics events | `modules/Logs/BQHandler.php` |
| **Amazon S3** | `s3.amazonaws.com` | PUT boarding pass PDFs / seat plans | `includes/amazon_bucket_export.class.php` |
| **Zabbix API** | Zabbix monitoring server | GET/POST monitoring data | `includes/ZabbixAPI.class.php` |
| **MODI/InkTouch API** | ink internal service | Comandos a dispositivos móviles | `modi_call_api.php` entry + `ink_touch_device` schema |
| **Node.js WS Bridge** | localhost (internal) | HTTP → WebSocket events | `node_server_communications.php` |

---

## Integraciones SOAP/EDI/Mensajería

| Protocolo | Sistema Externo | Clase/Archivo | Descripción |
|---|---|---|---|
| **SOAP (WSDL SITA)** | SITA BaggageService IATA | `modules/cuws/` (91 archivos de stubs) | Integración con sistema de rastreo de equipaje SITA — WorldTracer |
| **EDIFACT** | Sistemas de mensajería aérea IATA | `includes/ink_edifact_postmaster.class.php`, `edifact_router_config.php` | Mensajería EDIFACT (Type B) para APIS, PNR GOV |
| **MQ Gateway (AMQP)** | RabbitMQ / MQ interno | `mq_client/mq_gateway.php`, `mq_client/mq_gateway2.php`, `mq_node_receiver.php` | Sistema de mensajería interna entre procesos |
| **Redis Queue** | Redis server | `modules/QueuedJobs/RedisDispatcher.php` | Cola de trabajos en background |
| **WebSocket (Socket.io)** | Node.js server | `ws_api.php`, `websockets/client/socket.io.js` | Actualizaciones en tiempo real al UI DCS |
| **gRPC** | Servicios gRPC externos | `includes/grpc/` (stubs PHP) | Stubs generados para servicios gRPC — sistema externo no identificado |
| **PNR-GOV/PNRGOV** | Sistemas de gobierno / frontera | `includes/convert_pnrgov_controller.class.php`, `pnrgov_generator.php` | Generación de manifiestos de pasajeros para gobierno |

---

## Integraciones Sector Aéreo

| Sistema | Tipo | Clase/Archivo | Obligatorio/Opcional |
|---|---|---|---|
| **Timatic / IATA Travel Intelligence** | Validación documentos de viaje | `includes/timatic_controller.class.php`, `includes/timatic3_controller.class.php`, `includes/timatic_document_controller.class.php` | Opcional por tenant |
| **CUPPS / CUTE** | Protocolo hardware aeropuerto | `includes/ink_cupps_broker.class.php`, `includes/cupps_*.class.php`, `includes/cute_listener_controller.class.php` | Obligatorio para operación en mostrador |
| **CUSS** | Protocolo kioscos autoservicio | `includes/ink_cuss_broker.class.php`, `includes/cuss_*.class.php` | Opcional (tenants con kioscos) |
| **TouchSuite** | Sistema de dispositivos aeropuerto | `touch_suite_handler.php`, `touch_suite_tunnel.php`, `includes/touch_suite_handler_controller.class.php` | Opcional (tenants con TouchSuite) |
| **APIS (Advance Passenger Information)** | Datos pasajeros para gobierno | `includes/apis_*.class.php`, `includes/advance_passenger_report_controller.class.php` | Obligatorio (regulatorio) |
| **Biometría/Pasaporte** | Lectura documentos de identidad | `webci/apis.php`, `view_template_custom/common_webcute_bgr_reading.php` (lector tarjetas) | Opcional (tenants con hardware biométrico) |
| **SSIM / ACARS** | Horarios vuelos / mensajes aeronave | `includes/generate_ssim_controller.class.php`, `includes/create_ssim_controller.class.php` | Opcional |
| **Passbook (Apple)** | Boarding pass digital iOS | `passbook/index.php` | Opcional |
| **Radixx PSS** | Sistema de reservas (PNR) | `includes/radixx_flights_creator_service.class.php` | Obligatorio (al menos para tenants Radixx) |
| **FIDS externo** | Sistemas de pantallas aeropuerto | `includes/fids_*.class.php` (FIDS module) | Opcional |

---

## Dependencias Vendorizadas In-Tree (sin composer.json)

| Directorio / Librería | Propósito | Tipo |
|---|---|---|
| `voku_anti_xss/` | Protección XSS (PHP library) | Seguridad |
| `csrfp/` | CSRF Protection library | Seguridad |
| `modules/cuws/` | SOAP stubs SITA BaggageService (91 archivos WSDL) | Integración SITA |
| `websockets/client/socket.io.js` | Cliente Socket.io | WebSocket |
| `fids/` | Sistema FIDS propio (directorio separado) | Módulo semi-independiente |

---

## Notas de Descubrimiento

- **Sin composer.json confirmado**: cloud_2 no usa Composer — no hay sección de dependencias estándar. Todas las librerías externas están vendorizadas in-tree.
- **gRPC stubs**: Los stubs en `includes/grpc/` sugieren integración con un servicio gRPC externo (posiblemente Ink Platform services en microservicio). El sistema destino no fue identificado en esta sesión.
- **Payment gateway**: Módulo #18 (Financial) tiene schemas `cc_transaction` y `cart` que sugieren integración con pasarela de pago. La clase/proveedor específico (Stripe, Adyen, etc.) no fue identificado por P2C en esta sesión — requiere verificación manual.
- **WS API propia**: Las 10 versiones de WS API (v1.1–v1.9+) son una **integración expuesta** (cloud_2 como server) para clientes móviles — no una integración consumida.

