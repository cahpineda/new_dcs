---
plan: "03-01"
phase: 3-multitenancy-auth-analysis
generated_at: 2026-04-29
data_source: >
  FRAMEWORK.md (P2C session 795eedb2), PUNTOS-ENTRADA.md, SCOPE-MODULOS.md, MODULOS-CANDIDATOS.md.
  P2C index no disponible en esta sesión — datos derivados de evidencia recopilada en sesiones anteriores.
---

# MULTITENANCY.md — Modelo de Multitenancy del Monolito cloud_2

> **Nota metodológica**: cloud_2 **NO usa un framework de multitenancy** estándar (sin stancl/tenancy, sin Eloquent, sin traits de tenant). El sistema es PHP puro con MVC custom. Todos los hallazgos son del codebase real via P2C sesión 795eedb2.

---

## Mecanismo de Aislamiento

### Tipo detectado: Shared DB con resolución de tenant por hostname + `carrier_key` row-level

**Flujo de resolución de tenant por request:**

```
HTTP Request
    → $_SERVER['SERVER_NAME']  (ej: "avior.inkdcs.com")
    → get_current_company_key($hostname)   [includes/local_functions.php]
    → company_key = "avior"
    → company = row::get_instance('company', $db, ['company_key' => $company_key])
    → Controller almacena $this->company en todo el dispatch()
```

**Evidencia**: `webci_controller::dispatch()` llama `get_current_company_key($_SERVER['SERVER_NAME'])` antes de cualquier lógica de negocio (FRAMEWORK.md, P2C trace de `webci_controller.class.php`).

### Descripción del mecanismo

| Aspecto | Valor | Evidencia |
|---|---|---|
| Estrategia | **Shared Database, Row-Level** | Tablas con FK a `carrier` / `company` — misma DB para todos los tenants |
| Discriminador | Hostname HTTP → `company_key` | `get_current_company_key($_SERVER['SERVER_NAME'])` |
| Entidad tenant | `carrier` / `company` | Schemas: `carrier.schema.php`, `carrier_user.schema.php` (MODULOS-CANDIDATOS.md) |
| Sin paquete externo | No hay composer.json ni traits | FRAMEWORK.md — sin Composer, sin framework |
| Config por tenant | `webci/{tenant}/config.php` | 11+ tenants en `webci/` directory (SCOPE-MODULOS.md) |
| Features por tenant | Variables de flag en config.php | `ici_has_covid_section` (FRAMEWORK.md) |

### Tenants identificados en `webci/`

Los siguientes tenants tienen configuración propia (directorio `webci/{tenant}/`):

| Tenant | Tipo | Variante CUSS |
|---|---|---|
| avior | Aerolínea | Estándar |
| airmalta | Aerolínea | Estándar |
| bermudair | Aerolínea | Estándar |
| amapola | Aerolínea | Estándar |
| ais | Aerolínea / GHA | Estándar |
| creebec | Aerolínea | Estándar |
| jet2 | Aerolínea | **Variante CUSS Jet2** (`cuss_selfcheckin_jet2_kiosk_controller`) |
| wizz | Aerolínea | **Variante CUSS Wizz Air** (`cuss_selfcheckin_wizz_kiosk_controller`) |
| + 3 más | — | No identificados por nombre en esta sesión |

---

## Modelos y Tablas Tenant-Aware

> **Nota**: cloud_2 no tiene Eloquent ni traits. La clasificación se hace por FK a `carrier`/`company_key` en los schemas.

### Entidades Tenant Core (el tenant mismo)

| Modelo/Tabla | Tipo | Descripción |
|---|---|---|
| `carrier` | ✅ Tenant root | La aerolínea/empresa. PK: `carrier_key` |
| `carrier_user` | ✅ Tenant-scoped | Relación usuario ↔ aerolínea |
| `company` (alias carrier) | ✅ Tenant root | Alias de `carrier` en algunos contextos |
| `station` | ✅ Tenant-scoped | Workstation/escritorio de aeropuerto por aerolínea |
| `user_associated_station` | ✅ Tenant-scoped | Usuario ↔ estación por aerolínea |

### Tablas Operacionales Tenant-Aware (row-level)

Todas las tablas operacionales tienen FK implícita o explícita a `carrier`/`scheduled_flight` (que ya está scoped por aerolínea):

| Tabla | Tenant-Aware | Vía |
|---|---|---|
| `scheduled_flight` | ✅ | Columna `carrier_key` directa |
| `passenger` | ✅ | Via `scheduled_flight_key` → `carrier_key` |
| `boarding_pass` | ✅ | Via `passenger_key` → `scheduled_flight` |
| `boarding_gate` | ✅ | Via `scheduled_flight_key` |
| `boarding_transaction` | ✅ | Via `scheduled_flight_key` |
| `seat_allocation` | ✅ | Via `scheduled_flight_key` |
| `baggage_scan` | ✅ | Via `scheduled_flight_key` |
| `kiosk_session` | ✅ | Via `scheduled_flight_key` |
| `cupps_connection` | ✅ | Via `station` → `carrier` |
| `ahm` | ✅ | Via `scheduled_flight_key` |
| `turnaround_plan` | ✅ | Via `scheduled_flight_key` |
| `vehicle_allocation` | ✅ | Via `scheduled_flight_key` |

### Tablas de Catálogo Global (NO tenant-aware)

| Tabla | Tipo | Descripción |
|---|---|---|
| `airplane_model` | ❌ Global | Tipos de avión — compartida entre aerolíneas |
| `country` | ❌ Global | Países — catálogo global |
| `user_role` | ❌ Global | Roles de usuario — definidos globalmente |
| `business_rule` | ⚠️ Parcial | Reglas de negocio — algunas globales, algunas por carrier |
| `cabin_configuration` | ⚠️ Parcial | Config de cabina — tiene FK a `carrier` pero estructura puede ser global |

---

## Variaciones por Cliente

### 1. Configuración PHP por Tenant (`webci/{tenant}/config.php`)

Cada tenant tiene un archivo de configuración override en `webci/{tenant}/config.php`:
- **Propósito**: Override de constantes, URLs, parámetros específicos del tenant
- **Ruta real**: `webci/avior/config.php`, `webci/airmalta/config.php`, etc.
- **Activación**: Cargado en `webci_controller::dispatch()` después de resolver `company_key`
- **Evidencia**: P2C search_files reveló directorio `webci/` con subdirectorios por tenant (SCOPE-MODULOS.md)

### 2. Variantes de CUSS por Tenant

| Controlador | Tenant | Ruta |
|---|---|---|
| `cuss_selfcheckin_kiosk_controller` | Estándar | `includes/cuss_selfcheckin_kiosk_controller.class.php` |
| `cuss_selfcheckin_jet2_kiosk_controller` | Jet2 | `includes/cuss_selfcheckin_jet2_kiosk_controller.class.php` |
| `cuss_selfcheckin_wizz_kiosk_controller` | Wizz Air | `includes/cuss_selfcheckin_wizz_kiosk_controller.class.php` |
| `cuss_selfcheckin_bags_kiosk_controller` | Bag drop integrado | `includes/cuss_selfcheckin_bags_kiosk_controller.class.php` |

Cada variante de kiosk tiene flujos distintos adaptados al workflow del tenant.

### 3. Feature Flags por Empresa

Detectados en código (FRAMEWORK.md):
- `ici_has_covid_section` — activa el módulo Health/COVID por empresa
- Estructura: variable de configuración cargada desde `webci/{tenant}/config.php` o tabla `app_configuration`

### 4. Variantes de APIS por País

El módulo APIS tiene controladores específicos por regulación de país:
- `advance_passenger_report_controller` — genérico
- `advance_colombian_passenger_report_controller` — específico Colombia
- `advance_ecuadorian_passenger_report_controller` — específico Ecuador

Evidencia: MODULOS-CANDIDATOS.md — módulo #12 APIS (P2C query_classes session 795eedb2).

### 5. Variantes de Ancillaries

Módulo Ancillaries tiene 3 implementaciones:
- **Pribas** — integración de fees PRIBAS
- **StandardV1** — ancillaries estándar V1
- **StandardV2** — ancillaries estándar V2

Evidencia: MODULOS-CANDIDATOS.md módulo #11 (`AncillariesCalculator`, `AncillariesParser`, variantes en `modules/Ancillaries/`).

### 6. WEBCI per-tenant entry point (`webci/apis.php`, `webci/choose_seat.php`)

Archivos PHP en raíz de `webci/` que son compartidos pero tienen lógica tenant-aware cargada al inicio:
- `webci/apis.php` — procesamiento APIS con variantes por tenant
- `webci/choose_seat.php` — selector de asiento con UI adaptada por tenant

---

## Impacto en la Reescritura Modular

| Módulo | Lógica Tenant | Tablas Tenant | Variaciones | Complejidad Multitenancy |
|---|---|---|---|---|
| Departure Control | Sí (núcleo opera por carrier) | Sí (todas son tenant-scoped) | No (genérico) | **Alta** — el núcleo de tenant-resolution vive aquí |
| Flight Management | Sí (`scheduled_flight.carrier_key`) | Sí | No | **Media** — carrier_key limpio en `scheduled_flight` |
| Check-in | Sí (`webci/{tenant}/config.php`) | Sí | Sí (11+ configs) | **Alta** — per-tenant config files + APIS por país |
| CUSS Kiosk | Sí (3 variantes de controlador) | Sí | **Sí (3 tenants)** | **Alta** — cada variante es casi un módulo distinto |
| Boarding | Sí | Sí | No | **Media** — sin variantes por tenant detectadas |
| Baggage/BRS | Sí | Sí | No | **Media** |
| Seating | Sí | Sí (seat_allocation → flight → carrier) | No | **Media** |
| W&B / AHM | Sí | Sí | No | **Media** |
| WS API | Sí (consulta vuelos/pasajeros del carrier) | Via herencia | Sí (10 versiones API móvil) | **Alta** — versiones API pueden variar por tenant |
| APIS / Border | Sí | Sí | **Sí (países)** | **Alta** — variantes por regulación nacional |
| CUPPS | Sí (station → carrier) | Sí | No detectadas | **Media** |
| Passenger Mgmt | Sí (passenger → flight → carrier) | Sí | No | **Media** |
| FIDS | Solo lectura carrier | Lectura | No | **Baja** |
| Turnaround | Solo lectura carrier | Via flight | No | **Baja** |
| Vehículos/GSE | Débil (vehicle_allocation → flight) | Via flight | No | **Baja** |
| Health/COVID | Feature-gated (`ici_has_covid_section`) | Via passenger | No | **Baja** — solo activo si flag = true |

### Riesgos Específicos para la Reescritura

1. **`get_current_company_key()` es el tensor de multitenancy**: Esta función en `local_functions.php` es el punto de resolución del tenant. Al reescribir, debe convertirse en middleware centralizado.

2. **CUSS como caso especial**: Las 3 variantes de CUSS (estándar, Jet2, Wizz) son módulos funcionalmente distintos empaquetados como variantes de clase. Al extraer CUSS como módulo independiente, los workflows por tenant deben ser configurables, no hard-coded.

3. **Tenant config en PHP files**: `webci/{tenant}/config.php` es configuración como código — difícil de actualizar en runtime. La reescritura debe mover esto a base de datos o config service.

4. **APIS por país**: Las variantes colombiana y ecuatoriana de APIS son requerimientos regulatorios que varían por país de operación del tenant. No se pueden generalizar fácilmente.

5. **station → carrier coupling**: La asociación usuario↔estación↔aerolínea es el modelo de autorización real del sistema. No es solo "quién eres" sino "en qué escritorio estás trabajando". La reescritura modular debe preservar este concepto de "estación como contexto operacional".

