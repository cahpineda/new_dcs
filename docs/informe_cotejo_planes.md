# Informe de Cotejo — plan_definitivo.md vs Análisis ACA-2962

**Fecha:** 2026-04-30 | **Output:** `docs/plan_reescritura_dcs_consolidado.md`

---

## Qué aportó plan_definitivo.md al plan consolidado

| Componente | Incorporado | Nota |
|---|---|---|
| Arquitectura de migración (handler_flip, tiers B0-B3) | ✅ Íntegro | Base del HOW — cómo migrar |
| 5 capas de customización (Capa 0–4) | ✅ Íntegro | Solución al antipatrón view_template_custom |
| Pre-works 3.1–3.9, 3.13 (inventarios, baselines, crawler, bridge analysis) | ✅ Íntegro | Lista de herramientas pre-migration |
| Verifier 6/6 backend + 8/8 por carrier frontend | ✅ Íntegro | Framework de verificación |
| Modelo de autonomía L0–L5, 8 puntos humanos | ✅ Resumido | Gobernanza operacional |
| Pilots concretos (block_seats, dashboard) | ✅ Íntegro | Validación del pipeline |
| 13 reglas no negociables | ✅ Íntegro + 2 nuevas | Reglas 14 y 15 añadidas |
| Métricas 1–10 + 3 métricas de grafo (11–13) | ✅ Íntegro | Monitoreo post-migración |
| Refinamientos graphify R1–R6 (.row(), instanciación dinámica, *_apis, bridge nodes) | ✅ Incorporados | Secc. 3, 8, 11 del plan consolidado |
| Timeline gantt (secciones, meses) | ⚡ No reproducido | Referencia al plan_definitivo — los tiempos son orientativos post-pilot |
| Diagramas Mermaid | ⚡ No reproducidos | Referencia al plan_definitivo — válidos tal como están |

---

## Qué aportó el análisis ACA-2962 (lo que faltaba en plan_definitivo.md)

### Gaps cubiertos

| Gap en plan_definitivo.md | Cobertura desde ACA-2962 |
|---|---|
| **Sin catálogo de módulos** — el plan habla de "features" y "tiers" pero nunca nombra los módulos funcionales del DCS | Sección 4: 15 módulos + co-núcleo con controladores reales, tablas propias, nivel de acoplamiento |
| **Sin scope FE/BE/DB por módulo** | Tablas propias vs compartidas documentadas; SCOPE-MODULOS.md disponible para drill-down |
| **Sin catálogo de integraciones externas** — plan_definitivo menciona "CUPPS", "SITA", "WS API" pero sin protocolo, módulo propietario ni criticidad | Sección 5: 25+ integraciones con protocolo, flujo, módulo, criticidad, estrategia de reescritura |
| **Sin documentación del mecanismo de multitenancy** — dice "multi-tenancy de primera clase" pero no describe el mecanismo actual | Sección 6: hostname → `get_current_company_key()` → carrier_key → `webci/{tenant}/`, 11+ tenants, variantes documentadas |
| **Sin documentación de auth/RBAC** — menciona "session/cookie compatibility" pero no el sistema actual | Sección 6: 3 entry points de login, 7 tablas RBAC, `load_session()` en 156+ controladores, no separable sin middleware |
| **Sin mapa de integraciones por módulo** — no sabe qué módulo depende de qué integración | Sección 9 (orden de extracción): integraciones involucradas por ola |
| **Sin inventario de dependencias externas** | No hay composer.json, librerías vendorizadas (jQuery, csrfp, voku_anti_xss), MQ Gateway custom, gRPC sin target |
| **Sin identificación de XCache como bug activo** | Hotspot #10: XCache PHP 8.2 incompatible en `ink_autoload()` — pre-work urgente (regla 14) |
| **Sin orden de reescritura por módulo** | Olas 0–5 alineadas con tiers B0–B3, con pre-requisitos explícitos por módulo |

---

## Correcciones y reconciliaciones entre fuentes

| Tema | plan_definitivo.md | ACA-2962 | Resolución en plan consolidado |
|---|---|---|---|
| **God node** | `.row()` deg=16,611 es el hub técnico real | `departure_control_controller` como nucleus (24 deps directas) | Ambos correctos — `.row()` es hub de código, DC es hub de dominio. Documentados por separado. |
| **Versiones de API** | 12 variantes de `ws_class` (v1.0–v1.9 + ws_lc + ws_crs_xml) | 10 versiones WS API móvil (v3.7.0–v3.18.0) | Son cosas distintas: variantes de archivo back (12) vs versiones de interfaz cliente móvil (10). Ambos presentes en el plan. |
| **Variantes de view_template_custom** | 512 archivos, solo 2 overrides reales | No documentado específicamente | Plan_definitivo prevalece (graphify, más granular). Pre-work 3.9 reformulado. |

---

## Items sin cobertura en ninguna de las dos fuentes (requieren investigación)

1. **gRPC target**: `includes/grpc/` existe pero el servicio externo destino es desconocido en ambas fuentes
2. **Twilio**: encontrado como dependencia pero controlador específico no localizado
3. **Lista completa de roles RBAC**: schema existe, valores reales requieren consulta a DB
4. **Versiones exactas de librerías vendorizadas** (jQuery, csrfp, voku_anti_xss)
5. **AWS Events controller** (`modules/AWSEvents/`): mencionado en ESTRUCTURA-REPO.md, no catalogado en integraciones

---

## Veredicto

**plan_definitivo.md** tiene la arquitectura de migración y el toolchain. Sabe el *cómo*.  
**ACA-2962** tiene el mapa del dominio, las integraciones, el auth y el orden por módulo. Sabe el *qué*.

El plan consolidado une ambos: usa el HOW de plan_definitivo y le incrusta el WHAT de ACA-2962. Sin ACA-2962, el orchestrator no sabe qué módulos extraer en qué orden ni qué integraciones gestionar. Sin plan_definitivo, el análisis de ACA-2962 no tiene mecanismo de ejecución.
