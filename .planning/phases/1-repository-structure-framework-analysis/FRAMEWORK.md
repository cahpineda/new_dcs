---
plan: "01-02"
phase: 1-repository-structure-framework-analysis
generated_at: 2026-04-29
data_source: project2context (HTTP workaround, session 795eedb2bd7c41538670d46cc1e11ff4)
---

# FRAMEWORK.md — Stack, Arquitectura y Convenciones del Monolito cloud_2

## 1. Stack Tecnológico

### Backend
| Componente | Detalle | Evidencia P2C |
|---|---|---|
| Lenguaje | PHP 8.2+ | query_repository_summary: "primary_language: PHP" |
| Framework web | **Sin framework estándar** (PHP puro + helpers propios) | Sin composer.json ni autoloader de framework |
| API REST | **Slim Framework** (solo en `rest/index.php`) | edifact_router_config.php (01-01), rest/index.php identificado como único entry point REST |
| ORM / DB | **Custom "row" base class** (`schemas/*.schema.php`) | ink_autoload: eval genera clases que extienden `row`; sin Eloquent/Doctrine |
| Autoloader | **Autoloader custom `ink_autoload()`** + spl_autoload_register | `includes/local_functions.php:54-129` |
| Caching | **XCache** (legacy in-process) + **Redis** (job queue) | ink_autoload usa `xcache_set/do_key_exists`; modules/QueuedJobs/RedisDispatcher.php |
| Colas de trabajo | Sistema de jobs custom sobre **Redis** + proceso daemon | modules/QueuedJobs/ (12 archivos); process_job.php entry point |
| Mensajería | **MQ Gateway** (AMQP/RabbitMQ-like) | mq_client/mq_gateway.php, mq_client/mq_gateway2.php, mq_node_receiver.php |
| WebSockets | **Node.js** + **Socket.io** | websockets/client/socket.io.js; node_server_communications.php |
| gRPC | Stubs PHP en `includes/grpc/` | ink_autoload detecta namespaces con backslash → grpc/{ns}/gen/pb-php/ |
| Protobuf/SOAP | SOAP stubs SITA (cuws, 91 archivos) | modules/cuws/ — WSDL SITA BaggageService IATA |
| Monitoreo infra | **Zabbix** | includes/ZabbixAPI.class.php |
| Analytics | **Google BigQuery** | modules/Logs/BQHandler.php; postmaster_bq_packager (01-01) |

### Frontend
| Componente | Detalle | Evidencia P2C |
|---|---|---|
| Framework JS | **jQuery** (sin framework moderno) | view_template_custom/*.js, search_files devuelve funciones jQuery |
| Vistas | PHP inline en `view_template_custom/` (195+ archivos) | entrypoints_php_filtered: view_template_custom/*.php |
| Seguridad XSS | `voku_anti_xss/` (biblioteca vendorizada in-tree) | directorio voku_anti_xss/ con ClassLoader propio |

### Base de Datos
| Componente | Detalle |
|---|---|
| Motor | MySQL / MariaDB |
| Schema system | PHP custom: `schemas/*.schema.php` (300+ archivos) |
| Sin migraciones SQL | Usar `migrator/` custom para cambios de esquema |
| Sin ORM estándar | Base class `row` con eval() para generación dinámica de modelos |

---

## 2. Arquitectura — Dos Capas (Legacy + Moderna)

### Capa Legacy: Controladores Flat (`includes/*.class.php`)

**Patrón dispatch por pasos:**

```
[entry_point.php]
    → new {ModuleController}($params)
    → ->dispatch()
        → convert_url_parameters()
        → load_session()
        → switch($current_step):
            case 'identify_passenger': → handle_identify_passenger()
            case 'select_passenger':   → handle_select_passenger()
            ...
        → render_view($next_step)
```

Evidencia: `includes/webci_controller.class.php::dispatch()` (P2C trace completo)

- **Sin tabla de rutas explícita** — el `current_step` viene de parámetros HTTP
- Estado mantenido en sesión PHP entre requests
- Cada módulo DCS tiene su propio controlador: `{module}_controller.class.php`
- Los views se renderizan inline desde `view_template_custom/{step}.php`

**Autoloader custom:**

```php
// includes/local_functions.php:54-129
function ink_autoload($className) {
  // 1. XCache hit → require cached path
  // 2. INCLUDES_PATH/{ClassName}.class.php
  // 3. CENTRAL_INCLUDES/{ClassName}.class.php
  // 4. EDIFACT_INCLUDES/{ClassName}.class.php
  // 5. WS_INCLUDES/{ClassName}.class.php
  // 6. Si namespace (backslash) → grpc/{ns}/gen/pb-php/
  // 7. Fallback: eval() genera clase vacía que extiende 'row'
}
```

El fallback con `eval()` es arquitecturalmente significativo: cualquier clase no encontrada se crea dinámicamente extendiendo `row`, lo que permite instanciar cualquier tabla DB sin definir un modelo explícito.

### Capa Moderna: Módulos PSR-4-like (`modules/`)

Sin namespace `Ink\` formal — cada módulo usa su propio namespace o ninguno. Estructura Laravel-inspired pero sin Laravel:

| Directorio | Patrón | Clases clave |
|---|---|---|
| `modules/core/` | Infraestructura base | class_loader.class.php, service.class.php |
| `modules/Facades/` | Facades (estilo Laravel) | Cache, DB, Facade, LocalCache |
| `modules/Providers/` | Service Providers | CacheProvider, LocalCacheProvider |
| `modules/Cache/` | Caching layer | Cacher, GlobalCacher, CacheElement, CacheGroup |
| `modules/Logs/` | Logging + BigQuery | ActionLog, ActionLogger, BQHandler, Formatter |
| `modules/QueuedJobs/` | Job queue system | BaseJob, CloudJob, CloudUniqueJob, RedisDispatcher, JobsDispatcher, APIDispatcher |
| `modules/Ancillaries/` | Ancillary services (28 files) | AncillariesCalculator, AncillariesModule, AncillariesParser, AncillariesService |
| `modules/Mobile/` | Mobile API (38 files) | Core (múltiples versiones), Turnaround |
| `modules/DCS/` | DCS-specific | SeatValidator |
| `modules/Testing/` | Test helpers | APITestCase, BusinessHelper, DBHelper, DBTestCase |
| `modules/cuws/` | SOAP stubs SITA (91 files) | BaggageService IATA WSDL stubs |
| `modules/Captcha/` | Captcha | CaptchaEnabler |
| `modules/CloudApp.php` | Bootstrap de la app | Punto central de inicialización |

### REST API (Slim Framework)

```
rest/index.php → Slim app → routing via edifact_router_config.php
```

- Capa REST aislada del sistema legacy
- Sólo accesible via `rest/` — el resto del monolith es MVC stateful
- Slim Framework detectado por edifact_router_config.php (plan 01-01)

---

## 3. Convenciones de Nomenclatura

### Archivos PHP (Legacy)
| Patrón | Descripción | Ejemplo |
|---|---|---|
| `{name}.class.php` | Controladores y clases en `includes/` | `checkin_passenger.class.php` |
| `{name}.schema.php` | Definiciones de tabla DB en `schemas/` | `flight.schema.php` |
| `{name}_controller.class.php` | Controladores de módulo DCS | `selfboarding_controller.class.php` |
| `{name}_service.class.php` | Servicios en `includes/` | `radixx_flights_creator_service.class.php` |
| `{name}.php` | Scripts de entrada (root) | `web_checkin.php`, `process_job.php` |

### Archivos PHP (Moderno)
| Patrón | Descripción | Ejemplo |
|---|---|---|
| `PascalCase.php` | Clases en `modules/` | `AncillariesService.php`, `GlobalCacher.php` |
| `{Name}Provider.php` | Service providers | `CacheProvider.php` |
| `{Name}Dispatcher.php` | Dispatchers de jobs | `RedisDispatcher.php`, `APIDispatcher.php` |
| `Base{Name}.php` | Clases base | `BaseJob.php` |

### Clases PHP
| Patrón | Layer | Ejemplo |
|---|---|---|
| `snake_case` | Legacy (includes/) | `checkin_passenger`, `boarding_gate` |
| `PascalCase` | Modern (modules/) | `AncillariesService`, `CacheElement` |

### Funciones PHP
- Legacy: `snake_case` (e.g., `ink_autoload`, `cute_autoload`)
- Modern: `camelCase` (e.g., `handleIdentifyPassenger`)

### Tablas DB (implícito en `row` base class)
- Nombre tabla = `{ClassName}s` (pluralización simple)
- PK = `{ClassName}_key`
- Ejemplo: clase `flight` → tabla `flights`, PK `flight_key`

### Vistas
- `view_template_custom/{module_step}.php` — patrón flat sin subdirectorios
- JavaScript colocado en `view_template_custom/{module}_javascript.php` (archivos PHP que generan JS dinámico)

---

## 4. Patrones Detectados

### Sin Middleware Centralizado
- **CSRF**: Manejado via biblioteca `csrfp/` (CSRFProtector)
- **Auth/Session**: `load_session()` llamado en cada controlador dispatch — no hay middleware global
- **XSS**: `voku_anti_xss/` vendorizado in-tree, activado vía Bootup.php

### Inyección de Dependencias: Ninguna
- Sin DI container
- `row::get_instance($class, $db, $vars, $key)` para instanciar modelos
- Dependencias pasadas como parámetros de constructor

### Logging
- Legacy: Output directo / print statements
- Moderno: `modules/Logs/ActionLogger.php` + BigQuery via `BQHandler.php`

### Testing
- `modules/Testing/` contiene helpers: `APITestCase`, `DBTestCase`, `DBHelper`, `BusinessHelper`
- No hay evidencia de cobertura de tests en módulos legacy (includes/)

### Multitenancy (indicios — detalle en plan 01-04)
- `get_current_company_key($_SERVER['SERVER_NAME'])` en `webci_controller::dispatch()` — tenant por hostname
- `company` cargado por `company_key` en cada request
- `ici_has_covid_section` sugiere features por empresa

---

## Hallazgos Clave

1. **Doble sistema de carga**: `ink_autoload()` custom para legacy + PSR-4-like manual para modules/ — sin Composer
2. **eval() como fallback de ORM**: Cualquier nombre de clase desconocido se convierte en modelo DB dinámico — deuda técnica significativa
3. **XCache**: Sistema de caché en memoria in-process — deprecado en PHP 7+, posible problema de compatibilidad con PHP 8.2
4. **REST aislado**: Slim Framework solo en `rest/index.php` — el 95% del sistema es MVC stateful sin REST
5. **Módulos PSR-4-like pero sin Composer**: Estructura moderna pero sin gestión formal de dependencias
6. **Sin marco de tests en legacy**: Testing solo existe para la capa moderna (modules/Testing/)
7. **Tenant por hostname**: `$_SERVER['SERVER_NAME']` determina la empresa activa — multitenancy básica a nivel de controlador
