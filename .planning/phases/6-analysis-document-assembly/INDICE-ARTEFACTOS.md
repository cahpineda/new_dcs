# Índice de Artefactos — ACA-2962

**Ticket:** ACA-2962 — Analyze cloud2 monolith via project2context  
**Padre:** ACA-2961 — DCS System Rewrite Strategy  
**Completado:** 2026-04-29 | **Estado:** 8/9 criterios cumplidos (pendiente aprobación tech lead)

---

## Documento Principal

| Archivo | Descripción | Estado |
|---|---|---|
| `ANALISIS-CLOUD2.md` | Documento final de análisis — 8 secciones + Apéndice + Notas Tech Lead | ✅ Completo |
| `AC-CHECKLIST.md` | Verificación de los 9 criterios de aceptación de ACA-2962 | ✅ Completo |

---

## Artefactos por Fase

### Fase 1: Estructura del Repositorio y Framework
**Directorio:** `.planning/phases/1-repository-structure-framework-analysis/`

| Archivo | Descripción |
|---|---|
| `01-01-PLAN.md` | Plan de ejecución Fase 1 |
| `ESTRUCTURA-REPO.md` | Mapa de directorios, estructura de clases, convenciones |
| `FRAMEWORK.md` | Stack tecnológico, patrones arquitectónicos, entry points |
| `PUNTOS-ENTRADA.md` | Entry points del sistema DCS |
| `SUMMARY-01-01.md` | Resumen de ejecución Plan 01-01 |

### Fase 2: Identificación de Módulos Funcionales
**Directorio:** `.planning/phases/2-functional-module-identification/`

| Archivo | Descripción |
|---|---|
| `02-01-PLAN.md` | Plan de ejecución Fase 2 — descubrimiento |
| `02-02-PLAN.md` | Plan de ejecución Fase 2 — scope FE/BE/DB |
| `02-03-PLAN.md` | Plan de ejecución Fase 2 — validación de límites |
| `MODULOS-CANDIDATOS.md` | Módulos candidatos identificados (27 agrupaciones iniciales) |
| `SCOPE-MODULOS.md` | Alcance FE/BE/DB detallado por módulo (16 módulos) |
| `LIMITES-MODULOS.md` | Lista final validada: 15 módulos + co-núcleo, dependencias cruzadas, hotspots |
| `SUMMARY-02-02.md` | Resumen Plan 02-02 |
| `SUMMARY-02-03.md` | Resumen Plan 02-03 |

### Fase 3: Multitenancy y Autenticación
**Directorio:** `.planning/phases/3-multitenancy-auth-analysis/`

| Archivo | Descripción |
|---|---|
| `03-01-PLAN.md` | Plan de ejecución Fase 3 — multitenancy |
| `03-02-PLAN.md` | Plan de ejecución Fase 3 — auth/authz |
| `MULTITENANCY.md` | Mecanismo SDBS, 11+ tenants, variaciones por cliente, impacto por módulo |
| `AUTH.md` | 3 entry points de login, RBAC 7 tablas, evaluación de separabilidad |
| `SUMMARY-03-01.md` | Resumen Plan 03-01 |
| `SUMMARY-03-02.md` | Resumen Plan 03-02 |

### Fase 4: Catálogo de Integraciones
**Directorio:** `.planning/phases/4-third-party-integrations-catalogue/`

| Archivo | Descripción |
|---|---|
| `04-01-PLAN.md` | Plan de ejecución Fase 4 — descubrimiento |
| `04-02-PLAN.md` | Plan de ejecución Fase 4 — catálogo completo |
| `INTEGRACIONES-DESCUBIERTAS.md` | 23+ integraciones descubiertas con evidencia P2C |
| `CATALOGO-INTEGRACIONES.md` | 19 integraciones con ficha completa (protocolo, flujo, módulo, criticidad) |
| `SUMMARY-04-01.md` | Resumen Plan 04-01 |
| `SUMMARY-04-02.md` | Resumen Plan 04-02 |

### Fase 5: Dependencias e Inter-módulos
**Directorio:** `.planning/phases/5-dependencies-intermodule-map/`

| Archivo | Descripción |
|---|---|
| `05-01-PLAN.md` | Plan de ejecución Fase 5 — dependencias externas |
| `05-02-PLAN.md` | Plan de ejecución Fase 5 — mapa inter-módulos |
| `DEPENDENCIAS-EXTERNAS.md` | Inventario PHP/JS sin composer.json, XCache bug, vendorizaciones |
| `MAPA-DEPENDENCIAS-INTERMODULO.md` | 58 dependencias, 10 tablas compartidas, 7 hotspots, 5-wave rewrite order |
| `SUMMARY-05-01.md` | Resumen Plan 05-01 |
| `SUMMARY-05-02.md` | Resumen Plan 05-02 |

### Fase 6: Ensamblaje del Documento de Análisis
**Directorio:** `.planning/phases/6-analysis-document-assembly/`

| Archivo | Descripción |
|---|---|
| `06-01-PLAN.md` | Plan de ejecución Fase 6 — ensamblaje |
| `06-02-PLAN.md` | Plan de ejecución Fase 6 — verificación AC y entrega |
| `ANALISIS-CLOUD2.md` | **Documento final** — todos los criterios ACA-2962 |
| `AC-CHECKLIST.md` | Checklist de criterios de aceptación |
| `INDICE-ARTEFACTOS.md` | Este archivo — índice completo de artefactos |
| `SUMMARY-06-01.md` | Resumen Plan 06-01 |
| `SUMMARY-06-02.md` | Resumen Plan 06-02 |

---

## Contexto del Proyecto

| Archivo | Descripción |
|---|---|
| `.planning/PROJECT.md` | Definición del proyecto, core value, scope |
| `.planning/ROADMAP.md` | Roadmap de 6 fases con planes |
| `.planning/STATE.md` | Estado de sesión y progreso |
| `.planning/jira/JIRA-CONTEXT.md` | Contexto completo de ACA-2962 con criterios de aceptación |

---

## Estado Final

| Métrica | Valor |
|---|---|
| Criterios de aceptación | 8/9 cumplidos |
| Fases completadas | 6/6 |
| Planes ejecutados | 13/13 |
| Artefactos producidos | 30+ documentos |
| Pendiente | Aprobación tech lead (criterio 9) |

**Para navegar el análisis**: comenzar por `ANALISIS-CLOUD2.md` para el resumen ejecutivo, luego usar los artefactos de fase para drill-down en áreas específicas.
