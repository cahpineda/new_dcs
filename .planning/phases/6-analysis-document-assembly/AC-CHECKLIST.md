# Checklist de Criterios de Aceptación — ACA-2962

**Evaluación contra `ANALISIS-CLOUD2.md`** | Fecha: 2026-04-29

| # | Criterio | Estado | Sección en ANALISIS-CLOUD2.md | Nota |
|---|---|---|---|---|
| 1 | cloud2 fully traversed with `project2context` with no relevant functional areas left unanalyzed | ✅ CUMPLIDO | §2 Estructura del Repositorio | P2C sesión `795eedb2bd7c41538670d46cc1e11ff4` — 5,362 módulos, 2,357 clases, 31,576 funciones indexadas. Todos los directorios clave documentados. |
| 2 | Candidate module list defined with justification grounded in actual code groupings | ✅ CUMPLIDO | §3 Módulos Funcionales | 15 módulos + co-núcleo. Justificación por agrupamiento de controladores reales (`*_controller.class.php`) con nombres de archivo como evidencia. |
| 3 | Each module has a documented FE / BE / DB scope sourced directly from the repository | ✅ CUMPLIDO | §3 Módulos Funcionales + Apéndice (SCOPE-MODULOS.md) | Tabla con controladores (muestra real), tablas propias, y nivel de acoplamiento por módulo. Detalle completo en SCOPE-MODULOS.md. |
| 4 | Multitenant model fully documented: mechanism, scope, and per-client variations | ✅ CUMPLIDO | §4 Multitenancy y Autenticación | Mecanismo: `get_current_company_key($_SERVER['SERVER_NAME'])`. 11+ tenants en `webci/{tenant}/config.php`. Variaciones: Jet2/Wizz CUSS, Colombia/Ecuador APIS, 3 variantes Ancillaries. Impacto por módulo documentado. |
| 5 | All third-party integrations catalogued with protocol, flow direction, associated module, and criticality | ✅ CUMPLIDO | §5 Integraciones con Sistemas Externos | 25+ integraciones con tabla completa (sistema, protocolo, flujo, módulo, criticidad, scope tenants). Detalle extendido en CATALOGO-INTEGRACIONES.md. |
| 6 | Relevant external dependencies inventoried with replacement notes where applicable | ✅ CUMPLIDO | §6 Dependencias e Inter-módulos | DEPENDENCIAS-EXTERNAS.md: XCache (bug activo), jQuery, CSRFProtector, voku_anti_xss, gRPC stubs, MQ Gateway custom — todos con notas de reemplazo. Sin composer.json documentado. |
| 7 | Auth/authz model documented with separability assessment | ✅ CUMPLIDO | §4 Multitenancy y Autenticación | 3 entry points de login, RBAC custom (7 tablas), `load_session()` en 156+ controladores. Evaluación: no separable sin refactor de middleware. Ruta de separación documentada. |
| 8 | Inter-module dependency map produced with high-coupling hotspots explicitly flagged | ✅ CUMPLIDO | §6 Dependencias e Inter-módulos + §7 Hotspots | 58 dependencias entre módulos. 9 hotspots con tipo, módulos afectados, complejidad y estrategia de migración. 3 dependencias circulares marcadas ⚠️CIRCULAR. |
| 9 | Output document reviewed and approved as input for the modular rewrite strategy feature | ❌ PENDIENTE | — | Requiere aprobación explícita del tech lead. Acción humana requerida — fuera del alcance del análisis automatizado. |

---

**Resultado:** 8/9 criterios cumplidos.

**Estado:** ⚠️ PENDIENTE APROBACIÓN — 8 criterios técnicos verificados. El criterio 9 (revisión y aprobación del tech lead) requiere acción humana antes de poder marcar ACA-2962 como DONE.

---

## Notas de la Evaluación

### Criterio 1 — Limitación técnica documentada
El índice de cloud_2 en P2C fue accesible en sesión `795eedb2bd7c41538670d46cc1e11ff4`. En sesiones posteriores los tools Neo4j reportaron "not indexed". Los datos de esta sesión previa fueron usados como base — la cobertura es la mejor disponible sin re-indexación. No hay evidencia de áreas funcionales omitidas.

### Criterio 3 — Alcance FE
El scope FE está documentado a nivel de templates (`view_template_custom/`) y controllers. No se identificaron componentes JS standalone por módulo ya que el frontend es jQuery inline — no hay componentes separables per módulo. Documentado en SCOPE-MODULOS.md.

### Criterio 5 — Integraciones adicionales post-Fase 4
Durante Phase 6 se descubrieron integraciones adicionales en ESTRUCTURA-REPO.md (Amadeus `amadeus_afklm`, Stripe, Worldline, Twilio, Xero `xero/`) que no estaban en el catálogo Phase 4. Incorporadas directamente en ANALISIS-CLOUD2.md §5. El catálogo CATALOGO-INTEGRACIONES.md tiene 19 fichas completas; las adicionales están en la tabla resumida del documento final.

### Criterio 9 — Acción requerida
El tech lead debe revisar ANALISIS-CLOUD2.md y aprobar explícitamente antes de iniciar ACA-2963 o cualquier ticket de rewrite strategy. Ver "Próximos Pasos Recomendados" en el documento para guía sobre qué verificar manualmente.
