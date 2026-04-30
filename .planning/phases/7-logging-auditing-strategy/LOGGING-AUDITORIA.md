---
plan: "07-01"
phase: 7-logging-auditing-strategy
generated_at: 2026-04-29
data_source: >
  Artefactos de fases 2-6 (SCOPE-MODULOS.md, ANALISIS-CLOUD2.md, AUTH.md,
  CATALOGO-INTEGRACIONES.md, DEPENDENCIAS-EXTERNAS.md). P2C no disponible en
  esta sesión (error de runtime Neo4j). Toda evidencia citada proviene de
  artefactos verificados en sesión P2C 795eedb2bd7c41538670d46cc1e11ff4.
estado: Completo — listo para revisión técnica
---

# LOGGING-AUDITORIA.md — Análisis y Estrategia de Logging/Auditoría del DCS cloud_2

**Ticket:** ACA-2962 | **Fase:** 7 | **Fecha:** 2026-04-29

---

## Resumen Ejecutivo

cloud_2 **no tiene un sistema de auditoría centralizado ni intencional**. El logging existente es de naturaleza analítica (BigQuery) y transaccional implícita (tablas de transacción que actúan como log de facto). No existe ningún componente con semántica de audit trail inmutable, no hay `correlation_id` en ningún flujo, y los eventos de seguridad/acceso no se registran de forma estructurada.

**Hallazgo crítico**: Ningún módulo de cloud_2 puede liberarse a producción en el sistema reescrito sin implementar los eventos de categoría A y B definidos en este documento. El DCS maneja operaciones de aviación civil con implicaciones regulatorias, legales y de seguridad de pasajeros.

---

## 1. Estado Actual del Logging en cloud_2

### 1.1 Mecanismos de Logging Existentes

#### Mecanismo 1: Google BigQuery via BQHandler

| Atributo | Valor |
|---|---|
| **Nombre** | `modules/Logs/BQHandler.php` + `big_query/` client |
| **Tipo** | Analítico — observabilidad de comportamiento de pantallas y sesiones |
| **Datos capturados** | Eventos de pantalla DCS, sesiones de usuario, interacciones de kiosk, transacciones de boarding/baggage (según schemas BQ) |
| **Destino** | Google BigQuery via REST API custom (sin SDK oficial Google Cloud) |
| **Mecanismo de envío** | Asíncrono via Redis (`modules/QueuedJobs/RedisDispatcher.php`) — jobs procesados por `process_job.php` |
| **Cobertura de módulos** | Departure Control, Check-in/CUSS (kiosk), Boarding, Baggage, W&B, Passenger, Flight |
| **Schemas BQ identificados (25+ archivos)** | `bq_departure_control_screen`, `bq_departure_control_session`, `bq_imp_kiosk_session`, `bq_imp_kiosk_session_passenger`, `bq_imp_kiosk_session_screen`, `bq_imp_boarding_transaction`, `bq_imp_boarded_passenger`, `bq_imp_bag_drop_transaction`, `bq_imp_baggage_tag`, `bq_imp_baggage_tracking`, `bq_imp_flight`, `bq_imp_flight_aircraft_movement`, `bq_imp_lc_loadsheet`, `bq_imp_passenger`, `bq_imp_passenger_ancillary_item`, `bq_imp_passenger_apis` |

**Evaluación**: Es observabilidad analítica, NO auditoría. No tiene semántica de append-only, no es inmutable, no registra el "quién hizo qué" con la granularidad requerida para audit trail. No tiene `correlation_id`.

#### Mecanismo 2: Tablas de Transacción (audit trail implícito)

Estas tablas actúan como registro de hechos pero no fueron diseñadas como audit log:

| Tabla | Módulo | Datos de auditoría implícitos | Limitaciones |
|---|---|---|---|
| `checkin_transaction` | Check-in | Transacción de check-in del pasajero | Sin actor_id (agente), sin correlation_id |
| `boarding_transaction` | Boarding | Evento de embarque | Sin supervisor override tracking |
| `boarded_passenger` | Boarding | Pasajero confirmado a bordo | Sin boarding_pass_number linking |
| `bag_drop_transaction` | Baggage/SSBD | Transacción de bag drop | Sin tag_id link |
| `baggage_scan` | Baggage/BRS | Scan de equipaje | Potencialmente incompleto para reconciliación |
| `passenger_status_change` | Passenger Mgmt | Cambios de estado de pasajero | Sin old_value/new_value tracking |
| `cupps_transaction` | CUPPS | Transacciones de periférico | Solo operacional — sin eventos de negocio |
| `cupps_message` | CUPPS | Mensajes CUPPS | Diagnóstico, no auditoría |
| `border_movement` | APIS/Border | Movimiento de frontera | Sin submission_id hacia gobierno |
| `kiosk_session`, `kiosk_session_passenger` | CUSS | Sesión de kiosk y pasajeros | Sin boarding_pass emitted tracking |
| `financial_transaction` | Financial | Transacción financiera | ⚠️ No evidenciado schema — requiere verificación |

#### Mecanismo 3: user_session (tracking de sesiones de agente)

| Atributo | Valor |
|---|---|
| **Nombre** | Tabla `user_session` (schema `user_session.schema.php`) |
| **Tipo** | Sesión de usuario — registro de sesiones activas |
| **Datos capturados** | `session_id`, `user_key`, `expires_at` (campos inferidos de arquitectura) |
| **Destino** | MySQL — tabla de sesiones activas |
| **Limitación crítica** | Diseñada para persistencia de sesión PHP, no como log de auditoría. No es append-only. No registra login/logout como eventos históricos. No registra IP, station, ni carrier en el evento. |

#### Mecanismo 4: CUPPS Logging Application

| Atributo | Valor |
|---|---|
| **Nombre** | Tabla `cupps_logging_application` (schema `cupps_logging_application.schema.php`) |
| **Tipo** | Log de aplicación CUPPS |
| **Datos capturados** | ⚠️ No evidenciado en detalle — requiere verificación manual del schema en repositorio |
| **Destino** | MySQL |
| **Evaluación** | Probablemente diagnóstico de conexiones CUPPS — no auditoría de negocio |

#### Mecanismo 5: Timatic Transaction

| Atributo | Valor |
|---|---|
| **Nombre** | Tabla `timatic_transaction` (schema `timatic_transaction.schema.php`) |
| **Tipo** | Registro de consultas Timatic (validación de documentos de viaje) |
| **Datos capturados** | ⚠️ No evidenciado en detalle — requiere verificación |
| **Evaluación** | Potencial audit record de verificación de elegibilidad de pasajero — valor regulatorio |

### 1.2 Lo que NO existe en cloud_2

| Gap | Impacto |
|---|---|
| **Sin audit log centralizado** | No hay tabla `audit_events` ni equivalente con semántica inmutable |
| **Sin correlation_id en ningún flujo** | Imposible reconstruir una operación multi-módulo (ej: check-in → seat → boarding pass → APIS) |
| **Sin registro de actor en eventos de negocio** | Las tablas de transacción no registran sistemáticamente qué agente realizó la acción |
| **Sin log de seguridad estructurado** | Login/logout de agentes no produce audit records históricos — solo sesión activa |
| **Sin registro de overrides de supervisor** | Los gate overrides (embarque de pasajero con restricción) no tienen audit trail verificado |
| **Sin log de submissions APIS** | No hay tabla dedicada `apis_submission_log` con request+response+timestamp |
| **Sin PII handling** | Los schemas BQ incluyen `bq_imp_passenger_apis` — probable exposición de PII en BigQuery sin controles |
| **Sin retención policy** | No hay evidencia de política de retención de datos en ningún mecanismo |

### 1.3 Tabla de Cobertura por Evento Crítico

| Evento | Se loguea hoy | Mecanismo | Brecha |
|---|---|---|---|
| Check-in de pasajero | ⚠️ Parcial | `checkin_transaction` (tabla transaccional) | Sin actor_id del agente, sin correlation_id, sin estado previo/posterior |
| Emisión de boarding pass | ⚠️ Parcial | `boarding_transaction` + BQ `bq_imp_boarding_transaction` | No hay log de quién emitió el boarding pass ni número de secuencia audit |
| Embarque de pasajero confirmado | ⚠️ Parcial | `boarded_passenger` + BQ `bq_imp_boarded_passenger` | Sin correlation con boarding_pass_key, sin actor |
| Asignación/cambio de asiento | ❌ No evidenciado | Ninguno identificado en schemas | `seat_allocation` es el estado actual, no historial de cambios — doble asignación no tiene audit trail |
| Tag de equipaje creado | ⚠️ Parcial | `baggage_scan` + `baggage_tag` + BQ | Sin chain: tag → pasajero → vuelo en evento único |
| Reconciliación de equipaje (SITA BRS) | ⚠️ Parcial | `baggage_brs_tag`, `brs_bag_exception` | Sin submission_id hacia SITA, sin timestamp de respuesta |
| Cambio de estado de vuelo | ⚠️ Parcial | `action_flight`, `flight_register` | No es log de auditoría — estado final, no historial de cambios |
| Login de agente | ⚠️ Solo sesión activa | `user_session` | No es audit log histórico — sin IP, sin station, sin carrier en evento |
| Logout de agente | ❌ No evidenciado | Ninguno identificado | Sin log de cierre de sesión |
| Acceso fallido | ❌ No evidenciado | Ninguno identificado | Brecha crítica de seguridad |
| Acción de supervisor (override de puerta) | ❌ No evidenciado | Ninguno identificado | El caso más crítico — embarcar pasajero con restricción sin audit trail |
| Cambio de rol/permiso de usuario | ❌ No evidenciado | Ninguno identificado | Sin log de administración de acceso |
| Envío a APIS/Gobierno | ❌ No evidenciado como log | `border_movement`, `passenger_apis` (estado) | Sin log de submission: qué se envió, cuándo, con qué respuesta del gobierno |
| Transacción de pago | ⚠️ Parcial | `financial_transaction` | ⚠️ No evidenciado schema completo — requiere verificación manual para PCI-DSS assessment |
| Reembolso/reversión de pago | ❌ No evidenciado | Ninguno identificado | Brecha financiera |
| Cambio de carga W&B (aprobado supervisor) | ⚠️ Parcial | `ahm`, `ahm560a1-d3` schemas + BQ `bq_imp_lc_loadsheet` | Sin firma digital de aprobación, sin actor del loadsheet final |
| Permiso de embarque (gate override) | ❌ No evidenciado | Ninguno identificado | **Brecha más crítica del sistema** |
| Denegación de embarque | ❌ No evidenciado | Ninguno identificado | Regulatoriamente requerido en varios países |
| Cambio de configuración de sistema | ❌ No evidenciado | Ninguno identificado | xadmin no tiene audit log detectado |
| Sesión de kiosk CUSS | ✅ Registrado | `kiosk_session`, `kiosk_session_passenger`, BQ | Relativamente bien cubierto — valor analítico, no audit inmutable |
| Pantalla DCS activa | ✅ Registrado | `bq_departure_control_screen`, `bq_departure_control_session` | Analytics de UI — no auditoría de acciones |
| Error de integración externa | ⚠️ Parcial | `cupps_message`, BQ | Solo CUPPS; SITA, APIS, pagos sin log estructurado de errores |
| Job de background fallido | ⚠️ Parcial | `modules/QueuedJobs/` (inferido) | ⚠️ Requiere verificación del mecanismo de dead-letter en QueuedJobs |

---

## 2. Clasificación de Requisitos de Auditoría

### Principio de clasificación

| Categoría | Nombre | Criterio | Destino | Inmutabilidad |
|---|---|---|---|---|
| **A** | Regulatorio/Legal | Exigido por ley, regulación aeronáutica, o contrato con autoridades | `audit_events` (append-only) o tabla dedicada | **Obligatoria** — sin UPDATE/DELETE |
| **B** | Operacional Crítico | Permite reconstruir el estado del vuelo ante un incidente o disputa | `audit_events` (append-only) | **Obligatoria** |
| **C** | Seguridad de Acceso | Autenticación, autorización, cambios de privilegio | `audit_events` (append-only) | **Obligatoria** |
| **D** | Diagnóstico/Observabilidad | Debugging, monitoreo de salud, performance | BigQuery (extensión del BQHandler existente) | No requerida — rolling window |

### Categoría A — Regulatorio/Legal (no negociable)

| Evento | Retención Mínima | Acceso Permitido | Inmutabilidad | Base Regulatoria |
|---|---|---|---|---|
| Envío APIS/PNRGOV a autoridades (request + response) | 5-7 años (según país) | Compliance, operaciones autorizadas | Obligatoria | ICAO Annex 9, DHS/UKBF requirements |
| Respuesta de gobierno a submission APIS (accepted/rejected/alert) | 5-7 años | Compliance | Obligatoria | Idem |
| Pasajero en lista de alerta o denegación detectado | 7 años | Compliance, legalauthority bajo solicitud | Obligatoria | ICAO / normativa nacional |
| Denegación de embarque (con causa) | 7 años | Compliance, carrier | Obligatoria | EU Regulation 261/2004, equivalentes |
| Embarque autorizado con override de supervisor (gate override) | 7 años | Compliance, supervisión | Obligatoria | Responsabilidad civil y penal del carrier |
| Transacción de pago procesada (transaction_id, monto, resultado) | 5-7 años (fiscal) | Finance, compliance | Obligatoria | PCI-DSS Req. 10.2, normativa fiscal local |
| Reembolso o reversión de pago | 5-7 años | Finance, compliance | Obligatoria | PCI-DSS, fiscal |
| Loadsheet aprobado por supervisor (W&B firmado) | 7 años | Operations, compliance, autoridad aeronáutica | Obligatoria | IATA AHM — Aircraft Handling Manual |
| Desviación de CG o límite de W&B detectada | 7 años | Compliance, safety | Obligatoria | IATA AHM, regulación de aeronavegabilidad |
| Release de vuelo (go decision) | 7 años | Operations, compliance | Obligatoria | Regulación CAA/EASA/FAA equivalente |
| Cancellación de vuelo con pasajeros checked-in | 5 años | Operations, compliance | Obligatoria | EU 261/2004, DOT equivalentes |
| Cambio de documento de pasajero (pasaporte, visa) en pre-vuelo | 5 años | Compliance | Obligatoria | ICAO Annex 9 |

### Categoría B — Operacional Crítico (SLA y reversibilidad)

| Evento | Retención Mínima | Acceso Permitido | Inmutabilidad | Razón |
|---|---|---|---|---|
| Check-in de pasajero completado (agente, vuelo, timestamp) | 24 meses | Operations, carrier | Obligatoria | Reconstruir estado del vuelo ante disputa |
| Check-in anulado o revertido | 24 meses | Operations | Obligatoria | Idem |
| Boarding pass emitido (número, pasajero, vuelo, agente/kiosk) | 24 meses | Operations | Obligatoria | Confirmar quién recibió boarding pass |
| Boarding pass anulado | 24 meses | Operations | Obligatoria | Prevenir boarding pass duplicado válido |
| Pasajero embarcado (confirmación de boarding scan) | 24 meses | Operations | Obligatoria | Último estado conocido del pasajero en vuelo |
| Asignación de asiento (inicial y cada cambio) | 24 meses | Operations | Obligatoria | Doble asignación detectada o disputada |
| Tag de equipaje creado (tag_id, pasajero, vuelo, agente) | 24 meses | Operations | Obligatoria | Trazabilidad de equipaje perdido/extraviado |
| Reconciliación de equipaje SITA (result, flight, bag count) | 24 meses | Operations | Obligatoria | IATA BRS requirement |
| Bag reconciliation exception (equipaje sin pasajero o viceversa) | 24 meses | Operations, safety | Obligatoria | Seguridad aérea — equipaje sin dueño |
| Estado de vuelo cambiado (delay, divert, cancel) con causa | 24 meses | Operations | Obligatoria | Reconstrucción de operación del día |
| Gate change (cambio de puerta de embarque) | 12 meses | Operations | Obligatoria | Operacional |
| Creación/modificación de pasajero (actor, campos modificados) | 24 meses | Operations | Obligatoria | PII audit — quién tocó los datos |
| Split PNR o merge PNR | 24 meses | Operations | Obligatoria | Trazabilidad de reserva |
| Upgrade de clase/asiento (quién autorizó) | 24 meses | Operations | Obligatoria | Operacional y financiero |
| Asignación de vehículo/GSE a vuelo | 12 meses | Operations | Recomendada | Operacional de turnaround |
| Apertura de DCS session para vuelo | 24 meses | Operations | Obligatoria | Inicio de operación del vuelo |
| Cierre de DCS session para vuelo | 24 meses | Operations | Obligatoria | Fin de operación — lista de cierre |

### Categoría C — Seguridad de Acceso

| Evento | Retención Mínima | Acceso Permitido | Inmutabilidad | Razón |
|---|---|---|---|---|
| Login exitoso de agente (user_key, IP, station, carrier, timestamp) | 24 meses | Security, compliance | Obligatoria | Trazabilidad de quién operó el sistema |
| Logout de agente (explícito o por timeout) | 24 meses | Security | Obligatoria | Delimitar ventana de responsabilidad |
| Intento de login fallido (user, IP, timestamp, razón) | 24 meses | Security | Obligatoria | Detección de intrusión |
| Token API emitido (user_token) | 24 meses | Security | Obligatoria | API access audit |
| Token API revocado | 24 meses | Security | Obligatoria | Idem |
| Cambio de contraseña de usuario | 24 meses | Security | Obligatoria | Seguridad de acceso |
| Cambio de rol asignado a usuario (quién hizo el cambio) | 24 meses | Security, compliance | Obligatoria | Privilegio escalation audit |
| Creación de nuevo usuario en sistema | 24 meses | Security | Obligatoria | Gestión de acceso |
| Desactivación de usuario | 24 meses | Security | Obligatoria | Offboarding audit |
| Acceso a xadmin (panel de administración) | 24 meses | Security | Obligatoria | Panel admin es de alto riesgo |
| Cambio de configuración de sistema (business_rule, app_configuration) | 24 meses | Security, compliance | Obligatoria | Cambios de configuración tienen impacto en todos los tenants |
| Cambio de feature flag por tenant | 24 meses | Security | Obligatoria | Activar/desactivar features en producción |

### Categoría D — Diagnóstico/Observabilidad

| Evento | Retención | Acceso | Notas |
|---|---|---|---|
| Error de integración CUPPS (timeout, disconnect, fault) | 30 días | Operations, ingeniería | Rolling — reemplazar BigQuery BQ existente con schema estructurado |
| Error de integración SITA SOAP (fault, timeout) | 30 días | Operations, ingeniería | — |
| Error de integración APIS (rejection, timeout, invalid format) | 30 días | Operations, ingeniería | Distinción: error de comunicación vs rechazo regulatorio (el rechazo va en Cat. A) |
| Error de pago (declinado, timeout de gateway) | 30 días | Operations | Sin datos de tarjeta — solo transaction_id y error_code |
| Latencia de operación crítica (check-in, boarding, APIS submission) | 7 días | Ingeniería | Performance monitoring |
| Job de background fallido o reintentado | 30 días | Ingeniería | QueuedJobs dead-letter events |
| XCache/APCu miss (autoloader health) | 7 días | Ingeniería | Aplica mientras persista el autoloader legacy |
| WebSocket disconnect (client) | 7 días | Ingeniería | DCS real-time health |
| Performance de pantalla DCS (load time, render) | 7 días | Ingeniería | Extensión del `bq_departure_control_screen` existente |
| Errores de validación de entrada (anti_xss, CSRF) | 30 días | Security (lectura) | Sin PII — solo tipo de error y endpoint |

---

## 3. Estrategia de Logging para el Sistema Reescrito

### 3.1 Arquitectura de Logging — Dos Capas

```
┌─────────────────────────────────────────────────────────────────┐
│                     CAPA 1: AUDIT LOG INMUTABLE                 │
│           Categorías A, B y C — append-only, MySQL              │
│                                                                 │
│  tabla: audit_events (append-only, sin UPDATE/DELETE por DDL)   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ id            BIGINT UNSIGNED AUTO_INCREMENT PK         │    │
│  │ event_type    VARCHAR(100) NOT NULL  (enum versionado)  │    │
│  │ entity_type   VARCHAR(50) NOT NULL   (passenger, flight)│    │
│  │ entity_id     VARCHAR(100) NOT NULL  (key del objeto)   │    │
│  │ actor_id      VARCHAR(100) NULL      (user_key o system)│    │
│  │ actor_type    ENUM('agent','system','kiosk','api')       │    │
│  │ carrier_key   VARCHAR(50) NOT NULL   (tenant)           │    │
│  │ station_id    VARCHAR(50) NULL       (contexto físico)  │    │
│  │ correlation_id CHAR(36) NULL         (UUID v4)          │    │
│  │ payload_json  JSON NOT NULL          (datos del evento) │    │
│  │ occurred_at   DATETIME(3) NOT NULL   (timestamp cliente)│    │
│  │ ingested_at   DATETIME(3) NOT NULL   (timestamp servidor│    │
│  │ category      CHAR(1) NOT NULL       (A, B, C)          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Tablas satélite especializadas:                                │
│  • apis_submission_log  (Cat. A — payload completo APIS)        │
│  • payment_audit_log    (Cat. A — PCI-DSS compliant)           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   CAPA 2: OBSERVABILIDAD / DIAGNÓSTICO          │
│           Categoría D — BigQuery (extensión BQHandler)          │
│                                                                 │
│  Extiende modules/Logs/BQHandler.php (ya existe en cloud_2)     │
│  Formato: JSON estructurado con schema fijo                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ timestamp       ISO8601                                 │    │
│  │ tenant_id       carrier_key                            │    │
│  │ correlation_id  UUID v4                                 │    │
│  │ service         "boarding", "checkin", etc.             │    │
│  │ severity        DEBUG | INFO | WARN | ERROR             │    │
│  │ event_name      string                                  │    │
│  │ duration_ms     integer (null si no aplica)             │    │
│  │ error_code      string (null si success)                │    │
│  │ metadata        JSON (sin PII)                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Retención: 30-90 días con compactación automática en BQ        │
└─────────────────────────────────────────────────────────────────┘
```

#### Propiedades de la Capa 1 (Audit Log)

- **Append-only por diseño**: La tabla `audit_events` debe crearse con un trigger o constraint que rechace UPDATE y DELETE. La única operación permitida es INSERT.
- **Escritura síncrona para Cat. A**: Si falla el insert en `audit_events` para un evento de categoría A, la operación de negocio FALLA. Sin audit = sin operación.
- **Escritura asíncrona para Cat. B y C**: Via cola interna (no Redis público) — si falla, reintento con backoff. La operación de negocio NO falla.
- **`occurred_at` vs `ingested_at`**: `occurred_at` viene del cliente (el servicio que genera el evento). `ingested_at` es generado por el servidor en el momento del INSERT. La diferencia detecta manipulación de timestamps y latencia de envío asíncrono.
- **Particionado**: Particionar `audit_events` por `ingested_at` (monthly) para performance de queries de compliance.

#### Tablas Satélite Especializadas

**`apis_submission_log`** (Cat. A — retención legal por país):
```sql
CREATE TABLE apis_submission_log (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  correlation_id  CHAR(36) NOT NULL,
  flight_key      INT NOT NULL,
  carrier_key     VARCHAR(50) NOT NULL,
  destination_country CHAR(2) NOT NULL,
  submission_type ENUM('APIS','PNRGOV') NOT NULL,
  payload_encrypted TEXT NOT NULL,  -- payload cifrado AES-256
  response_code   VARCHAR(20) NULL,
  response_body   TEXT NULL,
  submitted_at    DATETIME(3) NOT NULL,
  response_at     DATETIME(3) NULL,
  ingested_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);
-- Sin UPDATE/DELETE — append-only por política
-- payload_encrypted: AES-256-GCM, clave en KMS separado
```

**`payment_audit_log`** (Cat. A — PCI-DSS):
```sql
CREATE TABLE payment_audit_log (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  correlation_id  CHAR(36) NOT NULL,
  transaction_id  VARCHAR(100) NOT NULL,  -- ID del gateway de pago
  carrier_key     VARCHAR(50) NOT NULL,
  passenger_key   INT NOT NULL,           -- FK, no datos de tarjeta
  gateway         ENUM('stripe','worldline','other') NOT NULL,
  amount_cents    INT NOT NULL,
  currency        CHAR(3) NOT NULL,
  result          ENUM('approved','declined','refunded','error') NOT NULL,
  error_code      VARCHAR(50) NULL,
  occurred_at     DATETIME(3) NOT NULL,
  ingested_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  -- NUNCA almacenar número de tarjeta, CVV, ni datos de titular
);
```

### 3.2 Correlation ID — Trazabilidad End-to-End

El `correlation_id` es un UUID v4 que se genera en el entry point de cada operación y se propaga a través de todos los componentes que participan en esa operación.

#### Flujo de ejemplo — Check-in completo

```
[agente abre DCS] → correlation_id generado: "a3f8-..."
  │
  ├── check_passenger_controller → valida docs → audit_event (B): passenger.validated / corr: a3f8
  ├── seat assignment → seating_service → audit_event (B): seat.assigned / corr: a3f8
  ├── boarding_pass generation → audit_event (B): boarding_pass.issued / corr: a3f8
  ├── APIS submission → apis_submission_log: submission / corr: a3f8
  └── checkin_transaction creada → audit_event (B): checkin.completed / corr: a3f8

[investigación: pasajero X fue denegado en puerta]
  → SELECT * FROM audit_events WHERE correlation_id = 'a3f8-...' ORDER BY occurred_at
  → Reconstrucción completa del flujo en una query
```

#### Propagación técnica

| Contexto | Mecanismo de propagación |
|---|---|
| **Sistema nuevo — entre servicios HTTP** | Header `X-Correlation-Id: {uuid}` en cada request interno |
| **Sistema legacy PHP (durante coexistencia)** | Variable de sesión PHP `$_SESSION['correlation_id']` inyectada en entry point |
| **Jobs de background** | Campo `correlation_id` en el payload del job encolado en Redis |
| **BigQuery (Capa 2)** | Campo `correlation_id` en JSON del evento de observabilidad |
| **APIS submission** | Campo `correlation_id` en `apis_submission_log` |

#### Generación del correlation_id

```php
// AuditLogger.php — método de generación
public static function generateCorrelationId(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        random_int(0, 0xffff), random_int(0, 0xffff),
        random_int(0, 0xffff),
        random_int(0, 0x0fff) | 0x4000, // version 4
        random_int(0, 0x3fff) | 0x8000, // variant
        random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
    );
}
```

### 3.3 Manejo de PII (Personally Identifiable Information)

El DCS maneja PII sensible bajo GDPR, CCPA, y regulaciones de privacidad de múltiples países. La estrategia minimiza la exposición:

#### Principios

1. **Identificadores, no datos raw**: Los audit logs almacenan `passenger_key` (clave interna), no nombre, pasaporte, ni fecha de nacimiento. Para investigaciones que requieren datos personales: JOIN contra tabla `passenger` con control de acceso separado.
2. **PII excluida de Categoría D**: Los logs de observabilidad (BigQuery) no deben contener ningún dato personal. Solo IDs técnicos.
3. **Cifrado at-rest para payloads regulatorios**: `apis_submission_log.payload_encrypted` se cifra con AES-256-GCM. Clave en KMS separado (no en la misma DB).
4. **Datos de pago**: `payment_audit_log` almacena únicamente el `transaction_id` del gateway y el resultado. Nunca datos de tarjeta. Esto es requisito PCI-DSS Requirement 3.

#### Clasificación de campos por sensibilidad

| Nivel | Ejemplos | Dónde puede aparecer |
|---|---|---|
| **Alto — nunca en logs** | Número de tarjeta, CVV, datos biométricos | Ningún log — ni audit ni observabilidad |
| **Medio — solo en audit Cat. A cifrado** | Pasaporte, fecha nacimiento, número visa, datos APIS completos | Solo `apis_submission_log.payload_encrypted` |
| **Bajo — OK en audit con ID** | Nombre de pasajero, PNR | Solo como referencia en `audit_events.payload_json` si es imprescindible para audit trail; preferir `passenger_key` |
| **Seguro — OK en todos** | `passenger_key`, `flight_key`, `carrier_key`, `transaction_id` de gateway, IDs internos | `audit_events`, BigQuery, logs diagnóstico |

### 3.4 Estrategia por Integración Externa

| Integración | Qué auditar | Tabla/Destino | Retención | Notas de implementación |
|---|---|---|---|---|
| **APIS/Gobierno** | Request completo (cifrado) + response + timestamp + resultado | `apis_submission_log` (append-only) | Legal por país (5-7 años) | Cat. A. Payload cifrado AES-256. Requiere correlation_id. |
| **SITA BaggageService** | Tag ID, reconciliation result, flight, bag count, exception flags | `audit_events` Cat. B | 24 meses | El resultado de reconciliación (matched/unmatched) es el dato crítico |
| **CUPPS/CUTE** | Errores de periférico, timeouts, reconexiones, device_id | BigQuery Cat. D | 30 días | Solo observabilidad — no auditoría de negocio |
| **Pagos (Stripe/Worldline)** | Transaction ID, monto, currency, resultado — NUNCA datos de tarjeta | `payment_audit_log` (append-only) | 5-7 años | Cat. A. PCI-DSS compliant por diseño. |
| **Auth/JWT (nuevo sistema)** | Token emitido (user, issued_at, expires_at, scope), token revocado | `audit_events` Cat. C | 24 meses | — |
| **EDIFACT/Type B** | Mensaje enviado (tipo, destinatario, timestamp), acknowledgment | `audit_events` Cat. B | 24 meses | Mensajes operacionales + PNRGOV |
| **Timatic** | Consulta (ruta, nationality), resultado (admisible/no), timestamp | `audit_events` Cat. B | 24 meses | `timatic_transaction` existente puede servir como base |
| **Redis/QueuedJobs** | Job fallido (job_type, payload_id, attempt_count, error) | BigQuery Cat. D | 30 días | Solo observabilidad — dead-letter events |
| **RabbitMQ/MQ Gateway** | Mensaje crítico no entregado (tipo, destino, timestamp) | BigQuery Cat. D | 30 días | Solo errores — no audit de cada mensaje |
| **WebSocket/Node.js** | Disconnect, reconnect, latencia de evento crítico | BigQuery Cat. D | 7 días | UI health |
| **Amazon S3** | Upload de boarding pass PDF (object_key, size, timestamp) | `audit_events` Cat. B | 12 meses | Confirmar que el boarding pass fue archivado |
| **Amadeus/Radixx PSS** | PNR recibido, pasajero creado/actualizado desde PSS | `audit_events` Cat. B | 24 meses | Origen de datos del pasajero |
| **Xero** | Transacción financiera exportada a contabilidad | `audit_events` Cat. A | 7 años | Fiscal |

### 3.5 Servicio AuditLogger — Interfaz Estable

El servicio central de auditoría debe exponer una interfaz estable que todos los módulos del sistema nuevo usen. La interfaz no debe cambiar entre olas de reescritura.

```php
// Interfaz propuesta — AuditLoggerInterface.php
interface AuditLoggerInterface
{
    /**
     * Registra un evento de auditoría.
     * Para Cat. A: lanza excepción si falla (operación bloqueante)
     * Para Cat. B y C: encola con reintento (no bloqueante)
     */
    public function log(
        string $eventType,       // e.g. "checkin.completed", "boarding_pass.issued"
        string $entityType,      // e.g. "passenger", "flight", "boarding_pass"
        string $entityId,        // clave primaria de la entidad
        string $category,        // "A", "B", "C"
        array  $payload,         // datos del evento (sin PII raw)
        ?string $actorId = null, // user_key del agente (null = sistema)
        ?string $correlationId = null
    ): void;

    /**
     * Genera y persiste un nuevo correlation_id en el contexto de la request.
     * Llamar al inicio de cada operación de entry point.
     */
    public function startCorrelation(): string;

    /**
     * Retorna el correlation_id activo del contexto actual.
     */
    public function getCorrelationId(): ?string;
}
```

#### Enumeración de event_type — contrato versionado

Los `event_type` son un contrato. Se versionan como `{entity}.{accion}` y se registran en un enum PHP con su categoría:

```php
// EventType.php — enum versionado (v1.0 — expansible)
enum EventType: string
{
    // Categoría A
    case APIS_SUBMISSION_SENT       = 'apis.submission_sent';
    case APIS_SUBMISSION_ACCEPTED   = 'apis.submission_accepted';
    case APIS_SUBMISSION_REJECTED   = 'apis.submission_rejected';
    case PASSENGER_ALERT_DETECTED   = 'passenger.alert_detected';
    case BOARDING_DENIED            = 'boarding.denied';
    case BOARDING_OVERRIDE_APPROVED = 'boarding.override_approved';
    case LOADSHEET_APPROVED         = 'loadsheet.approved';
    case FLIGHT_RELEASED            = 'flight.released';
    case PAYMENT_PROCESSED          = 'payment.processed';
    case PAYMENT_REFUNDED           = 'payment.refunded';

    // Categoría B
    case CHECKIN_COMPLETED          = 'checkin.completed';
    case CHECKIN_REVERSED           = 'checkin.reversed';
    case BOARDING_PASS_ISSUED       = 'boarding_pass.issued';
    case BOARDING_PASS_VOIDED       = 'boarding_pass.voided';
    case PASSENGER_BOARDED          = 'passenger.boarded';
    case SEAT_ASSIGNED              = 'seat.assigned';
    case SEAT_CHANGED               = 'seat.changed';
    case SEAT_DOUBLE_ASSIGNED       = 'seat.double_assigned'; // incidente crítico
    case BAGGAGE_TAG_CREATED        = 'baggage.tag_created';
    case BAGGAGE_RECONCILED         = 'baggage.reconciled';
    case BAGGAGE_EXCEPTION          = 'baggage.exception';
    case FLIGHT_STATUS_CHANGED      = 'flight.status_changed';
    case DCS_SESSION_OPENED         = 'dcs_session.opened';
    case DCS_SESSION_CLOSED         = 'dcs_session.closed';

    // Categoría C
    case AUTH_LOGIN_SUCCESS         = 'auth.login_success';
    case AUTH_LOGIN_FAILED          = 'auth.login_failed';
    case AUTH_LOGOUT                = 'auth.logout';
    case AUTH_TOKEN_ISSUED          = 'auth.token_issued';
    case AUTH_TOKEN_REVOKED         = 'auth.token_revoked';
    case USER_ROLE_CHANGED          = 'user.role_changed';
    case USER_CREATED               = 'user.created';
    case USER_DEACTIVATED           = 'user.deactivated';
    case CONFIG_CHANGED             = 'config.changed';
}
```

### 3.6 Audit Log para el Período de Coexistencia (Legacy + Nuevo)

Durante la migración por olas, un mismo vuelo puede tener operaciones procesadas por el sistema legacy PHP y por el nuevo sistema. El audit trail debe ser coherente y unificado.

#### Principio de coexistencia

El mismo `audit_events` MySQL es la fuente de verdad para ambos sistemas. No hay dos sistemas de audit — hay un sistema de audit al que escriben dos runtimes distintos.

#### Implementación en lado legacy

```php
// Inyección de correlation_id en sesión PHP (lado legacy)
// Agregar en: includes/local_functions.php, función load_session()

function load_session() {
    // ... código existente de sesión ...

    // Inyección de correlation_id si no existe en sesión
    if (empty($_SESSION['correlation_id'])) {
        $_SESSION['correlation_id'] = generate_correlation_id();
    }

    // Inyección de audit logger via singleton (para módulos legacy que escriben Cat. A/B)
    if (!isset($GLOBALS['audit_logger'])) {
        $GLOBALS['audit_logger'] = new LegacyAuditLogger($_SESSION['correlation_id']);
    }
}
```

#### LegacyAuditLogger

Un wrapper PHP puro que escribe directamente a `audit_events` MySQL sin depender de la nueva infraestructura. Interfaz idéntica a `AuditLoggerInterface` para que los tests sean los mismos.

#### Trazabilidad de incidentes cross-ola

Si un pasajero hace check-in en legacy (Ola 3B no migrado aún) y aborda en el nuevo sistema (ya migrado):

```
-- Query de investigación de incidente cross-ola
SELECT * FROM audit_events
WHERE entity_type = 'passenger' AND entity_id = '{passenger_key}'
  AND flight_key = '{flight_key}'  -- (en payload_json via JSON_EXTRACT)
ORDER BY occurred_at;

-- Muestra AMBAS operaciones, legacy y nuevo, en orden cronológico
-- correlation_id puede diferir (dos entry points) pero el entity_id unifica
```

---

## 4. Logging por Módulo y Ola de Reescritura

### 4.1 Pre-work de Logging (Antes de Cualquier Ola)

Estos items son **pre-requisitos bloqueantes** para empezar Ola 0. Ningún módulo puede ser reescrito sin infraestructura de auditoría disponible.

| # | Tarea | Tipo | Responsable |
|---|---|---|---|
| PW-LOG-1 | Crear tabla `audit_events` append-only con DDL que rechace UPDATE/DELETE | DB migration | DBA + Backend |
| PW-LOG-2 | Crear tabla `apis_submission_log` append-only | DB migration | DBA + Backend |
| PW-LOG-3 | Crear tabla `payment_audit_log` append-only | DB migration | DBA + Backend |
| PW-LOG-4 | Implementar `AuditLoggerInterface` + `EventType` enum + `AuditLogger` service | Backend | Backend |
| PW-LOG-5 | Implementar `LegacyAuditLogger` (PHP puro para lado legacy) | Backend | Backend |
| PW-LOG-6 | Implementar propagación de `correlation_id` en routing proxy / entry points | Backend | Backend |
| PW-LOG-7 | Extender `BQHandler.php` con schema de observabilidad estructurado (Cat. D) | Backend | Backend |
| PW-LOG-8 | Definir y documentar enumeración `EventType` como contrato versionado v1.0 | Backend | Backend |
| PW-LOG-9 | Tests de `AuditLogger`: verificar que Cat. A falla la operación si insert falla | Tests | Backend |
| PW-LOG-10 | Configurar retention policy en BigQuery (30-90 días para Cat. D) | Infra | Infra/DevOps |

**Checklist de pre-work:**
- [ ] `audit_events` creada y sin permisos UPDATE/DELETE en usuario de aplicación
- [ ] `AuditLogger` con tests de contrato (escribe a DB, cat A es bloqueante)
- [ ] `LegacyAuditLogger` funcionando con integración en `load_session()`
- [ ] `correlation_id` generado y propagado en al menos 1 entry point de prueba
- [ ] BigQuery Cat. D schema desplegado y recibiendo eventos de prueba

### 4.2 Logging por Módulo y Ola

| Módulo | Ola | Eventos obligatorios | Categoría | Notas |
|---|---|---|---|---|
| **Auth Service** | Ola 0 (pre-work) | Login exitoso/fallido, logout, token emitido/revocado, cambio de rol, creación/desactivación de usuario | C | **Día 1 — antes del primer flip de módulo.** Sin auth logging no hay trazabilidad de ningún agente |
| **Passenger Core Service** | Ola 0 | Creación de pasajero, modificación de datos, cambio de status, cambio de documento | B | PII handling: solo `passenger_key` en audit, datos en tabla `passenger` separada |
| **Flight Data Service** | Ola 0 | Cambio de estado de vuelo, gate change, apertura/cierre DCS session | B | `flight_key` como entity_id |
| **Boarding Pass Service** | Ola 0 | Boarding pass emitido, boarding pass anulado | B | Incluir `boarding_pass_number` en payload como identificador |
| **Seat Service** | Ola 0 | Asignación inicial, cambio de asiento, doble asignación detectada | B | Doble asignación debe ser Cat. A — incidente de seguridad |
| **CUPPS HAL** | Ola 0 | Errores de periférico, reconexiones, timeouts por device_id | D | Solo observabilidad BigQuery — no audit |
| **FIDS** | Ola 1 | — | — | Sin eventos de auditoría críticos. Pantallas informativas. |
| **Turnaround/Ops** | Ola 1 | Eventos de turnaround (apertura, cierre, deviations) | D | Solo observabilidad |
| **Vehículos/GSE** | Ola 1 | Asignación de vehículo a vuelo (quién, qué vehículo, qué vuelo) | B | Operacional — reconstrucción de turnaround |
| **Health/COVID** | Ola 1 | — | — | Módulo en desuso gradual — mínimo audit si se mantiene |
| **Baggage + SSBD** | Ola 2 | Tag creado, reconciliación SITA (result + exception flags), bag drop transaction, bag exception | A+B | SITA reconciliation result es Cat. A (regulatorio BRS). Tag creado es Cat. B. |
| **WS API (mobile)** | Ola 2 | Errores de integración (D), acceso con token inválido (C) | C+D | Solo observabilidad para operaciones normales. Auth failures van a Cat. C. |
| **CUPPS/Periféricos** | Ola 3A | Transacción de periférico (B), fallo de device con impacto operacional (D) | B+D | Los fallos con impacto en pasajero (impresora boarding pass falla) son Cat. B |
| **CUSS Kiosk** | Ola 3A | Check-in en kiosk (B), boarding pass emitido en kiosk (B), sesión de kiosk (D) | B+D | El kiosk es actor_type='kiosk' en audit_events — no tiene user_key |
| **Check-in** | Ola 3B | Check-in completado (B), check-in revertido (B), upgrade de asiento en check-in (B), split/merge PNR (B) | B | **Core operacional — todos los eventos deben tener actor_id del agente y correlation_id** |
| **Boarding & Gate** | Ola 3B | Pasajero embarcado (B), boarding denied (A), gate override por supervisor (A), boarding pass scan (B) | A+B | Gate override y boarding denied son **Cat. A — regulatorio**. Sin negociación. |
| **Seating** | Ola 3B | Asignación de asiento (B), cambio de asiento (B), doble asignación detectada (A) | A+B | Doble asignación es Cat. A — puede resultar en incidente de seguridad aérea |
| **Passenger Mgmt** | Ola 3B | Modificación de datos de pasajero (B), cambio de documento (B) | B | PII: solo passenger_key + campos modificados (old/new sin datos sensibles) |
| **APIS/Border** | Ola 4 | Envío a gobierno (A), respuesta de gobierno (A), pasajero en lista de alerta (A), denegación por APIS (A) | A | **Todos Cat. A — retención legal. Payload cifrado en apis_submission_log.** |
| **Financial** | Ola 4 | Pago procesado (A), reembolso (A), pago fallido/rechazado (A) | A | PCI-DSS en payment_audit_log. Sin datos de tarjeta. |
| **W&B / AHM** | Ola 4 | Loadsheet generado (B), loadsheet aprobado por supervisor (A), desviación de CG (A), AHM envelope breach (A) | A+B | La firma del loadsheet es el evento más crítico en W&B — actor_id del supervisor que aprobó es obligatorio |
| **Flight Management** | Ola 5 | SSIM import (B), slot change (B), cancellación de vuelo con pasajeros (A) | A+B | Cancellación con pax = Cat. A (EU 261/2004, compensación) |
| **Departure Control** | Ola 5 | Apertura de DCS session (B), cierre de DCS session (B), release de vuelo — go decision (A), no-go decision (A) | A+B | **Release de vuelo es el evento de máxima criticidad de todo el sistema.** Requiere actor_id del supervisor que autorizó. |

### 4.3 Checklist de Pre-Release por Módulo

Para que cualquier módulo pueda salir a producción en el sistema reescrito, **DEBE** cumplir todos los ítems de la siguiente lista. Este checklist es un gate de release — no es opcional.

#### Gate obligatorio (bloquea release)

- [ ] **A.1** Todos los eventos de Categoría A implementados y escribiendo a `audit_events` o tabla satélite correspondiente
- [ ] **A.2** La escritura de Cat. A es síncrona — si falla el audit log, falla la operación
- [ ] **A.3** Los eventos de Categoría A tienen tests automáticos que verifican: operación X produce evento Y con campos Z
- [ ] **B.1** Todos los eventos de Categoría B implementados y escribiendo a `audit_events`
- [ ] **B.2** Tests automáticos para eventos Cat. B críticos (check-in, boarding, seat, baggage)
- [ ] **C.1** Todos los eventos de Categoría C del módulo implementados (si el módulo gestiona auth)
- [ ] **CID.1** `correlation_id` propagado y presente en TODOS los eventos del módulo
- [ ] **CID.2** Test: operación completa produce todos sus eventos con el mismo `correlation_id`
- [ ] **PII.1** PII excluida de logs de Categoría D (BigQuery) — test automatizado con regex
- [ ] **PII.2** `payload_json` en `audit_events` no contiene datos de tarjeta ni documentos de identidad raw
- [ ] **RET.1** Retention policy configurada para el destino de cada categoría del módulo

#### Recomendado (no bloquea release pero debe documentarse)

- [ ] **D.1** Eventos de Categoría D del módulo implementados en BigQuery Cat. D
- [ ] **MON.1** Dashboard de monitoring básico para los eventos Cat. D del módulo
- [ ] **DOC.1** `EventType` enum actualizado con los nuevos event_types del módulo

#### Evidencia requerida para aprobar el gate

Para cada módulo, el tech lead debe confirmar:
1. Log de tests automáticos mostrando Cat. A y Cat. B pasando
2. Query de muestra en `audit_events` mostrando eventos reales del módulo en staging
3. Confirmación de que `correlation_id` aparece en todos los eventos
4. Confirmación de ausencia de PII en BigQuery Cat. D (query de verificación)

---

## 5. Impacto en el Plan de Reescritura

### 5.1 Cambios al Orden de Olas

El pre-work de logging **debe completarse antes de Ola 0**. Esto no cambia el orden de olas pero agrega una fase previa explícita:

```
[Pre-work Logging] → [Ola 0: Servicios Compartidos] → [Ola 1] → ... → [Ola 5]
```

El pre-work de logging (~2-3 semanas de ingeniería) corre en paralelo con el diseño de Ola 0, no en secuencia.

### 5.2 Servicios de Ola 0 Afectados por Logging

| Servicio Ola 0 | Cambio por logging | Complejidad añadida |
|---|---|---|
| Auth Service | Debe emitir eventos Cat. C desde día 1 | Media — AuditLogger disponible, solo integrar |
| Passenger Core Service | Eventos de modificación de pasajero (Cat. B) — PII handling especial | Media |
| Boarding Pass Service | Eventos de emisión/anulación (Cat. B) | Baja |
| Seat Service | Evento de doble asignación (Cat. A) — síncrono y bloqueante | Media |
| CUPPS HAL | Solo Cat. D — BigQuery | Baja |

### 5.3 Risk Log de Logging

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Legacy PHP no genera eventos Cat. A antes del flip de un módulo | Alta | Crítico | LegacyAuditLogger integrado en `load_session()` antes de primer flip |
| Volumen de `audit_events` supera capacidad de la tabla sin particionado | Media | Alto | Particionado por `ingested_at` (monthly) en DDL inicial |
| `correlation_id` se pierde entre legacy y nuevo en flujo mixto | Media | Medio | Tests de integración end-to-end antes de cada flip de módulo |
| PII en BigQuery Cat. D por error de programador | Alta | Alto | Tests automáticos con regex PII en pipeline CI |
| Clave de cifrado de `apis_submission_log` gestionada incorrectamente | Baja | Crítico | KMS dedicado con rotación de claves — requisito no negociable |
| Gate de pre-release no aplicado consistentemente | Alta | Crítico | Checklist integrado en proceso de release — sign-off del tech lead requerido |

---

*Documento generado el 2026-04-29 — Fase 7 del análisis ACA-2962. Próxima revisión recomendada: antes del inicio de pre-work de Ola 0.*
