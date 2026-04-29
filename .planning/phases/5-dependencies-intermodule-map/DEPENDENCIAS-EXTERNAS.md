---
plan: "05-01"
phase: 5-dependencies-intermodule-map
generated_at: 2026-04-29
data_source: FRAMEWORK.md, MODULOS-CANDIDATOS.md, INTEGRACIONES-DESCUBIERTAS.md (P2C session 795eedb2)
nota_metodologica: >
  cloud_2 NO tiene composer.json ni package.json. Las dependencias externas están
  implementadas como: (1) librerías PHP vendorizadas en directorios propios in-tree,
  (2) clases custom que implementan protocolos externos, (3) archivos JS incluidos directamente.
  Este documento adapta el plan 05-01 a la arquitectura real de cloud_2.
---

# DEPENDENCIAS-EXTERNAS.md — Dependencias Externas del Monolito cloud_2

> **Contexto crítico**: cloud_2 es PHP puro sin Composer. No existen `composer.json` ni `package.json`. Toda dependencia externa está vendorizada in-tree o implementada con custom code. Esto es una **deuda técnica significativa** — las actualizaciones de seguridad son manuales.

---

## Dependencias PHP Vendorizadas In-Tree

### Framework y Routing

| Librería | Directorio/Archivo | Propósito | Reemplazable | Notas |
|---|---|---|---|---|
| **Slim Framework** | `rest/index.php` (incluido inline) | Routing REST para `rest/index.php` — único endpoint stateless | Sí — con cualquier router moderno | Solo 1 archivo usa Slim — aislado |
| **Sin framework web** | N/A — PHP puro | El 95% del sistema no usa framework | N/A | El dispatch pattern custom es el "framework" |

### Seguridad

| Librería | Directorio | Propósito | Reemplazable | Notas |
|---|---|---|---|---|
| **CSRFProtector** | `csrfp/` | Protección CSRF para formularios | Sí — middleware moderno | Vendorizado in-tree, actualizaciones manuales |
| **voku/anti-xss** | `voku_anti_xss/` | Sanitización XSS de inputs | Sí — librería moderna | Incluye ClassLoader propio — versión antigua |
| **anti_xss.class.php** | `includes/anti_xss.class.php` | Wrapper DCS para anti-xss + `validate_vars_departure_control()` | N/A — es custom | Custom wrapper sobre voku_anti_xss |

### Caching

| Librería | Tipo | Propósito | Estado | Nota crítica |
|---|---|---|---|---|
| **XCache** | In-process cache (PHP extension) | Cache de paths de clases en `ink_autoload()` + otras caches | ⚠️ **OBSOLETO** | XCache fue abandonado, incompatible con PHP 7.2+. En PHP 8.2 posiblemente no-op o error. **Riesgo de runtime.** |
| **LocalCache** (custom) | `modules/Cache/` | Cache local moderna — `CacheElement`, `CacheGroup` | Activo | Reemplazante moderno de XCache en capa modules/ |

### Integración SITA / IATA

| Librería | Directorio | Propósito | Reemplazable | Notas |
|---|---|---|---|---|
| **SITA BaggageService WSDL stubs** | `modules/cuws/` (91 archivos) | Stubs PHP para SOAP SITA WorldTracer | Solo con regeneración de stubs | Genera por WSDL — si el WSDL de SITA cambia, regenerar |

### WebSocket / Real-time

| Librería | Archivo | Propósito | Reemplazable | Notas |
|---|---|---|---|---|
| **Socket.io client** | `websockets/client/socket.io.js` | WebSocket cliente en browser | Sí — con WebSocket nativo o alternativa | Depende de Node.js server siendo Socket.io compatible |

### gRPC

| Librería | Directorio | Propósito | Estado |
|---|---|---|---|
| **gRPC PHP stubs** | `includes/grpc/` | Stubs de cliente gRPC generados desde proto files | Sistema destino no identificado — REQUIERE VERIFICACIÓN |

---

## Dependencias JavaScript (In-Tree)

> **No hay package.json**. JavaScript está incluido directamente como archivos en `view_template_custom/` y raíz.

| Librería | Archivo/Ruta | Versión | Propósito | Estado |
|---|---|---|---|---|
| **jQuery** | `departure_control_jquery.php` + vistas | Antigua (3.x o 2.x estimada) | DOM manipulation, AJAX — usada en toda la UI | ⚠️ Vendorizado in-tree, versión sin determinar |
| **Socket.io** | `websockets/client/socket.io.js` | Sin determinar | WebSocket client para UI DCS real-time | In-tree — versión no verificada |

**Nota**: No hay Vue.js, React, Alpine.js, Bootstrap, Tailwind, ni ningún framework JS moderno. La UI del DCS es **PHP generando HTML + jQuery** — sin build pipeline (webpack/vite). Esta es la stack JS real del sistema.

---

## Dependencias PHP Custom (Implementaciones Propias de Protocolos)

Estas no son librerías externas sino implementaciones custom de protocolos que normalmente se obtendrían como dependencia externa:

| Implementación | Archivo(s) | Protocolo | Notas |
|---|---|---|---|
| **MQ Gateway** | `mq_client/mq_gateway.php`, `mq_gateway2.php` | AMQP custom | Implementación custom — no usa librería AMQP estándar |
| **Redis Dispatcher** | `modules/QueuedJobs/RedisDispatcher.php` | Redis protocol | Posiblemente usa extensión PHP `redis` o `predis` incluida de forma no evidente |
| **BigQuery Handler** | `modules/Logs/BQHandler.php` | Google BigQuery REST API | Implementación custom via HTTP — no usa SDK oficial Google Cloud |
| **EDIFACT Router** | `includes/ink_edifact_postmaster.class.php`, `edifact_router_config.php` | EDIFACT Type B | Implementación custom del protocolo EDIFACT |
| **gRPC Client** | `includes/grpc/` | gRPC | Stubs generados — requiere extensión PHP `grpc` |

---

## Sistema de Testing

> **No hay framework de testing para código legacy** (`includes/`).

| Tool | Ubicación | Cobertura |
|---|---|---|
| **Testing custom (PHP)** | `modules/Testing/` | Solo módulos modernos (`modules/`) |
| `APITestCase` | `modules/Testing/APITestCase.php` | Tests de API REST (Slim) |
| `DBTestCase` | `modules/Testing/DBTestCase.php` | Tests con base de datos |
| `DBHelper` | `modules/Testing/DBHelper.php` | Helper de DB para tests |
| `BusinessHelper` | `modules/Testing/BusinessHelper.php` | Helper de lógica de negocio |
| **Sin cobertura** | `includes/*.class.php` (156+ controladores) | Sin tests en código legacy |

**Implicación para reescritura**: Los 156+ controladores legacy no tienen tests. Cualquier extracción modular debe escribir tests desde cero — no hay red de seguridad existente.

---

## Dependencias Críticas para la Reescritura

| Dependencia | Versión | Razón de Criticidad | Nota para Reescritura |
|---|---|---|---|
| **XCache** (extensión PHP) | Desconocida (legacy) | Obsoleto — incompatible PHP 7.2+. En PHP 8.2 es riesgo de runtime | Reemplazar por APCu o OPcache en `ink_autoload()` antes de cualquier migración. **Bug latente activo.** |
| **SITA WSDL stubs** (91 archivos) | Sin versión explícita | Si el WSDL de SITA cambia, 91 archivos deben regenerarse | Mantener con wrapper de integración — encapsular en `BaggageIntegrationService` antes de migrar Baggage/BRS |
| **voku_anti_xss** (vendorizado) | Sin versión explícita | Versión desconocida — puede tener vulnerabilidades XSS no parchadas | Reemplazar con versión oficial via Composer en la reescritura |
| **CSRFProtector** (vendorizado) | Sin versión explícita | Librería de seguridad sin actualizaciones automáticas | Reemplazar con middleware CSRF estándar del nuevo framework |
| **gRPC stubs** (`includes/grpc/`) | Sin versión explícita | Destino no identificado — no se puede planificar migración | **REQUIERE INVESTIGACIÓN MANUAL** antes de planificar Fase 5 completa |
| **MQ Gateway custom** | N/A (custom code) | Sin librería estándar — el protocolo MQ es implementación propia | Reemplazar con librería AMQP estándar (php-amqplib) en la reescritura |
| **jQuery** (versión no verificada) | No determinada | UI completa depende de jQuery — sin framework moderno | En reescritura modular, migrar a framework moderno (Vue/React) por módulo — no big bang |
| **Sin testing** en `includes/` | N/A | 156+ controladores sin tests — cero red de seguridad para refactoring | Primera tarea de cualquier extracción: escribir tests de caracterización |

---

## Alertas de Compatibilidad PHP 8.2

| Componente | Riesgo | Descripción |
|---|---|---|
| **XCache** | 🔴 **CRÍTICO** | XCache fue abandonado, no soporta PHP 7.2+. En PHP 8.2 es incompatible. El `ink_autoload()` usa `xcache_set/xcache_get` — si falla silenciosamente, toda la resolución de clases vía cache está rota. |
| **eval() en ink_autoload()** | 🟡 **Medio** | El fallback `eval()` genera clases dinámicamente. En PHP 8.2 `eval()` sigue funcionando pero está desaconsejado. El riesgo es de mantenibilidad, no compatibilidad. |
| **Slim Framework (versión antigua)** | 🟡 **Medio** | La versión de Slim incluida inline puede no ser compatible con PHP 8.2 si es v2 o v3 antigua. Verificar versión real. |

