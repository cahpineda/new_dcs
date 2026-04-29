# Plan 04-01: Descubrimiento de Integraciones — Resumen

## Logros

- INTEGRACIONES-DESCUBIERTAS.md creado con 4 secciones
- 6 integraciones HTTP/REST identificadas con clases reales
- 7 integraciones SOAP/EDI/Mensajería catalogadas
- 10 integraciones del sector aéreo documentadas
- 5 dependencias vendorizadas in-tree identificadas
- Ausencia de composer.json confirmada — sin SDKs de Composer

## Total de Integraciones Encontradas

**23 integraciones/dependencias externas identificadas** (con evidencia de ruta real):
- HTTP/REST: 6 (BigQuery, S3, Radixx, Zabbix, MODI, Node.js bridge)
- SOAP/EDI: 7 (SITA CUWS, EDIFACT, MQ, Redis, WebSocket, gRPC, PNRGOV)
- Sector aéreo: 10 (Timatic, CUPPS, CUSS, TouchSuite, APIS, Biometría, SSIM, Passbook, Radixx, FIDS)
- 2 pendientes (payment gateway, gRPC target) — requieren verificación manual

## Integraciones Más Críticas (primeras impresiones)

1. **CUPPS/CUTE** — sin esto el DCS no puede operar en mostrador (hardware dependency)
2. **APIS (Advance Passenger Information)** — regulatorio/legal, obligatorio en todos los países
3. **SITA BaggageService SOAP** — rastreo de equipaje (WorldTracer) — core para BRS
4. **BigQuery** — analytics del sistema completo — usado por departure_control y todos los módulos
5. **Radixx PSS** — fuente de datos de reservas — sin PNR no hay pasajeros para check-in

## Preparación para Plan 04-02

Plan 04-02 documentará cada integración con:
- Atributos completos (protocolo, flujo, criticidad, scope tenants)
- Módulo(s) que la usan (de LIMITES-MODULOS.md)
- Riesgo para la reescritura modular
