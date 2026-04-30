---
phase: 7-logging-auditing-strategy
plan: "07-01"
completed: 2026-04-30
duration: 60m
data_source: >
  Artefactos fases 2-6 (SCOPE-MODULOS.md, ANALISIS-CLOUD2.md, AUTH.md,
  CATALOGO-INTEGRACIONES.md, DEPENDENCIAS-EXTERNAS.md). P2C no disponible
  en sesión actual (error runtime Neo4j).
---

# Plan 07-01: Análisis y Estrategia de Logging/Auditoría — Resumen

## Logros

- Documentado el estado actual del logging en cloud_2: 5 mecanismos identificados (BQHandler/BigQuery, tablas transaccionales implícitas, user_session, cupps_logging_application, timatic_transaction)
- Creada tabla de cobertura para 21 eventos críticos del DCS — con clasificación evidenciada por evento
- Clasificados 43 eventos de auditoría en 4 categorías (A, B, C, D) con retenciones mínimas e inmutabilidad
- Definida arquitectura de 2 capas: `audit_events` append-only MySQL (Cat. A/B/C) + BigQuery estructurado (Cat. D)
- Diseñado schema de `audit_events` con `occurred_at`/`ingested_at` dual para detección de manipulación de timestamps
- Definidas 2 tablas satélite: `apis_submission_log` (payload cifrado AES-256) y `payment_audit_log` (PCI-DSS compliant)
- Especificada propagación de `correlation_id` para legacy PHP (session) y nuevo sistema (HTTP header)
- Definida `AuditLoggerInterface` con 33 `EventType` versionados como contrato v1.0
- Mapeados 19 módulos + pre-work con eventos obligatorios, categoría y ola de implementación
- Definido checklist de pre-release con 11 items gate-bloqueantes por módulo

## Gaps Críticos Identificados en cloud_2

| Gap | Severidad | Evento afectado |
|---|---|---|
| Sin gate override audit trail | Crítico | Supervisor autoriza embarque con restricción — sin registro |
| Sin log de denegación de embarque | Crítico | Regulatorio (EU 261/2004 y equivalentes) |
| Sin doble asignación de asiento en audit | Crítico | Puede resultar en incidente de seguridad aérea |
| Sin log de APIS submission | Crítico | `border_movement` existe pero sin request+response+timestamp del gobierno |
| Sin audit de login/logout histórico | Alto | `user_session` es estado activo, no log histórico |
| Sin correlation_id en ningún flujo | Alto | Imposible reconstruir operación multi-módulo ante incidente |
| Sin log de loadsheet approval con actor | Alto | El supervisor que firma el loadsheet no queda registrado |
| Sin log de acceso fallido | Alto | Detección de intrusión imposible |
| PII probable en BigQuery sin controles | Alto | `bq_imp_passenger_apis` en BQ — requiere verificación manual |
| Sin release de vuelo en audit | Crítico | El evento de máxima criticidad del DCS no tiene registro auditado |

## Estrategia para el Nuevo Sistema

**Principio central**: Audit inmutable primero, observabilidad después. Sin audit no hay release.

- **Capa 1** — `audit_events` MySQL append-only (DDL rechaza UPDATE/DELETE). Escritura síncrona para Cat. A — si falla el audit log, falla la operación. Tablas satélite para APIS (cifrado AES-256) y pagos (PCI-DSS).
- **Capa 2** — BigQuery Cat. D extendiendo `BQHandler.php` existente con schema estructurado. Retención rolling 30-90 días.
- **Correlation ID** — UUID v4 en entry points. Propagado via `$_SESSION` en legacy y `X-Correlation-Id` en nuevo sistema. Ambos sistemas escriben al mismo `audit_events`.
- **PII handling** — Solo IDs internos en audit. Datos personales en tabla `passenger` separada. Payload APIS cifrado AES-256-GCM con KMS.
- **Coexistencia** — `LegacyAuditLogger` PHP puro integrado en `load_session()` antes del primer flip de módulo.
- **Pre-work** — 10 tareas (PW-LOG-1 a PW-LOG-10) antes de Ola 0, en paralelo con su diseño (~2-3 semanas).

## Impacto en el Plan de Reescritura

1. **Pre-work de logging** se añade como fase explícita antes de Ola 0 (~2-3 semanas de ingeniería, paralelizable con diseño).
2. **Checklist de pre-release** con 11 items gate-bloqueantes se convierte en requisito de cada módulo.
3. **Auth Service** debe ser el primer módulo en emitir eventos (Cat. C) — sin él ningún evento tiene actor_id confiable.
4. **Olas 3B y 4** concentran la mayoría de eventos Cat. A (Check-in, Boarding, APIS, Financial, W&B) — requieren más tiempo de QA de auditoría.
5. **Gate override de supervisor** (Ola 3B) y **release de vuelo** (Ola 5) son los dos eventos de máxima criticidad — tests de auditoría dedicados antes de producción son no negociables.
