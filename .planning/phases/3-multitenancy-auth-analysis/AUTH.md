---
plan: "03-02"
phase: 3-multitenancy-auth-analysis
generated_at: 2026-04-29
data_source: >
  MODULOS-CANDIDATOS.md (P2C session 795eedb2), PUNTOS-ENTRADA.md, FRAMEWORK.md, SCOPE-MODULOS.md.
  cloud_2 es PHP puro custom — no hay Laravel Auth, Sanctum, Passport, ni Policies/Gates.
---

# AUTH.md — Autenticación y Autorización del Monolito cloud_2

> **Nota**: cloud_2 usa autenticación custom session-based sin framework estándar. No hay `config/auth.php`, `AuthServiceProvider`, Guards de Laravel, ni Policies/Gates. Todos los datos son del codebase real via P2C sesión 795eedb2.

---

## Flujo de Autenticación

### Método detectado: Session-Based Custom PHP

**No hay tokens JWT, OAuth2, ni SSO detectados en la capa principal.**

#### Entry Points de Autenticación

| Archivo | Propósito | Tipo |
|---|---|---|
| `login.php` | Pantalla de login principal del sistema | HTTP entry |
| `login_auth.php` | Procesamiento de credenciales — valida usuario/contraseña | HTTP entry |
| `login_cute.php` | Login para terminal CUTE (aeropuerto) — contexto de escritorio | HTTP entry |

**Evidencia**: PUNTOS-ENTRADA.md sección "1. Autenticación" — identificados por P2C `find_front_controllers` (session 795eedb2).

#### Flujo de Login (inferido de arquitectura)

```
[login.php]
    → input: username, password, company_key (implícito por hostname)
    → login_auth.php → login_service.class.php::authenticate()
    → valida contra tabla `user` (user_key, password_hash)
    → verifica `carrier_user` (usuario pertenece a aerolínea del hostname)
    → crea registro `user_session` (session_id, user_key, expires_at)
    → PHP session_start() → session vars: user_key, company_key, station_key
    → redirect a departure_control.php o web_checkin.php
```

#### Login CUTE (escritorio de aeropuerto)

- `login_cute.php` es el entry point específico para terminales CUTE en mostrador de aeropuerto
- Establece contexto de estación (`station_key`) además del usuario
- Implica modelo: Usuario + Estación = sesión DCS completa
- Sin este contexto de estación, algunas funciones DCS no están disponibles

#### Persistencia de Sesión

| Aspecto | Valor | Evidencia |
|---|---|---|
| Mecanismo | PHP sessions (server-side) | `load_session()` en cada controller dispatch — FRAMEWORK.md |
| Storage | Probable filesystem PHP (`/tmp/`) o base de datos (`user_session` tabla) | `user_session.schema.php` existe — MODULOS-CANDIDATOS.md |
| Token API | `user_token` tabla detectada | Posiblemente para acceso API REST (Slim endpoint) o mobile |
| Tiempo de expiración | No determinable sin acceso actual a P2C | — |
| CSRF | Biblioteca `csrfp/` (CSRFProtector) | FRAMEWORK.md — library vendorizada in-tree |
| XSS | `voku_anti_xss/` + `includes/anti_xss.class.php` | FRAMEWORK.md + MODULOS-CANDIDATOS.md módulo #26 |

#### Servicio de Auth

- `includes/login_service.class.php` — servicio de autenticación para WEBCI (SCOPE-MODULOS.md)
- Sin equivalente documentado para DCS principal — posiblemente auth integrada en dispatch()

---

## Roles y Permisos

### Sistema de RBAC: Implementación Custom (sin paquete externo)

**No hay spatie/laravel-permission ni paquete RBAC externo en composer.json (sin composer.json).**

#### Entidades del Sistema de Auth/RBAC

| Entidad | Schema | Descripción |
|---|---|---|
| `user` | `user.schema.php` (inferido) | Usuario del sistema — PK: `user_key` |
| `user_session` | `user_session.schema.php` | Sesión activa del usuario |
| `user_token` | `user_token.schema.php` | Token de API para acceso programático |
| `user_role` | `user_role.schema.php` | Definición de roles del sistema |
| `user_group` | `user_group.schema.php` | Grupos de usuarios |
| `user_associated_role` | `user_associated_role.schema.php` | Tabla pivot: usuario ↔ rol |
| `user_associated_station` | `user_associated_station.schema.php` | Tabla pivot: usuario ↔ estación |
| `carrier_user` | `carrier_user.schema.php` | Tabla pivot: usuario ↔ aerolínea (tenant) |

**Evidencia**: MODULOS-CANDIDATOS.md módulo #20 "Autenticación / Usuarios" — todos los schemas listados (P2C `query_classes` session 795eedb2).

#### Controladores de Auth

| Controlador | Ruta | Responsabilidad |
|---|---|---|
| `user_controller` | `includes/user_controller.class.php` | CRUD de usuarios |
| `user_group_controller` | `includes/user_group_controller.class.php` | Gestión de grupos |
| `user_role_controller` | `includes/user_role_controller.class.php` | Gestión de roles |
| `user_session_controller` | `includes/user_session_controller.class.php` | Gestión de sesiones |
| `user_token_controller` | `includes/user_token_controller.class.php` | Gestión de tokens API |
| `user_manager` | `includes/user_manager.class.php` (inferido) | Manager central de auth |

#### Modelo de Roles

El sistema tiene una estructura de roles probable de 3 dimensiones:

```
Usuario
├── user_associated_role     → tiene uno o más Roles (permisos de sistema)
├── user_associated_station  → está asignado a una o más Estaciones (contexto físico)
└── carrier_user             → pertenece a una Aerolínea (tenant)
```

**La autorización efectiva = Rol + Estación + Aerolínea**

Un usuario puede tener:
- Diferentes roles en diferentes aerolíneas (carrier_user multi-tenant)
- Diferentes estaciones en el mismo aeropuerto (check-in desk, gate, bag drop)
- La combinación determina qué módulos DCS puede operar

#### Roles conocidos (inferidos por controladores)

No es posible listar roles exactos sin acceso a P2C actual o a seeders de DB. Estructura probable basada en módulos:

| Rol probable | Acceso principal |
|---|---|
| Agent (check-in) | Check-in, WEBCI, passenger management |
| Gate Agent | Boarding, seating |
| Ramp Agent | Baggage, BRS, bag drop |
| Supervisor | Departure Control (full) |
| System Admin | xadmin, configuration, user management |
| CUSS Operator | CUSS kiosk management |
| FIDS Operator | FIDS management |

---

## Evaluación de Separabilidad

### Auth en cloud_2: Embebido en cada controlador

**El sistema de auth NO es un servicio separable en el estado actual.** Razones:

#### Acoplamiento Estructural

1. **`load_session()` en 156+ controladores**: Cada controlador del sistema llama a `load_session()` en su método `dispatch()`. No hay middleware centralizado que intercepte antes del controlador.
   - Evidencia: FRAMEWORK.md — "Auth/Session: `load_session()` llamado en cada controlador dispatch — no hay middleware global"

2. **Contexto de estación embebido**: El concepto `station_key` está atado a la sesión PHP y es consultado por controladores DCS directamente — no es separable sin cambiar todas las referencias.

3. **`carrier_user` coupling**: La validación de "¿este usuario puede operar en esta aerolínea?" ocurre en login y se persiste en sesión. Extraer auth requeriría que los módulos llamen a un Auth Service para cada verificación.

4. **`user_token` para API**: La tabla `user_token` sugiere que el REST API (`rest/index.php` / Slim) usa token-based auth separada. Esto indica una separación parcial — el REST API ya tiene su propio auth flow.

#### Evaluación

| Aspecto | Valor |
|---|---|
| ¿Auth separable actualmente? | **No** — sin refactoring |
| ¿Se puede extraer como microservicio? | **Parcialmente** — REST API ya tiene auth separada (user_token) |
| ¿Qué bloquea la extracción? | `load_session()` en 156 controladores + station context en sesión PHP |
| Complejidad de extracción | **Alta** |
| Ruta propuesta | Auth como servicio compartido (no por módulo) — centralizarlo primero antes de cualquier extracción modular |

#### Dependencias que bloquean extracción

| Dependencia | Tipo | Impacto |
|---|---|---|
| `load_session()` en `includes/` | Función en 156+ controladores | Alto — refactoring masivo |
| `$_SESSION['user_key']` en lógica de negocio | PHP sessions | Alto — acoplado a HTTP session |
| `station_key` en contexto DCS | Binding físico | Alto — específico de DCS |
| `carrier_user` validación | Lógica en login_auth.php | Medio — encapsulable |

#### Ruta propuesta para reescritura

**Fase previa a cualquier extracción modular:**
1. Centralizar auth en un Auth Service (HTTP internal) con JWT
2. Convertir `load_session()` en middleware que llame al Auth Service
3. Pasar contexto de usuario/carrier/station como request headers
4. Los módulos extraídos reciben contexto de auth via headers — no acceden directamente a sesiones PHP

---

## Autorización por Módulo

### Mecanismo de autorización: Custom — sin Policies ni Gates

**No hay `app/Policies/`, `Gate::define()`, ni `@can` directivas.** La autorización es implícita:
- Si tienes acceso al entry point → tienes acceso al módulo
- La granularidad real está en `user_role` + `user_associated_station`

| Módulo | Mecanismo de Auth | Permisos Implícitos | Notas |
|---|---|---|---|
| Departure Control | Sesión activa + station_key | Solo usuarios con estación DCS configurada | Station = autorización real |
| Check-in (WEBCI) | `login_service.class.php` | carrier_user valida acceso a aerolínea | Auth separada por ser web check-in |
| CUSS Kiosk | Sesión de kiosk (`kiosk_session`) | Sin autenticación de usuario — sesión de dispositivo | El kiosko es anónimo al pasajero |
| Boarding | Sesión + station_key de tipo "gate" | Agentes de puerta | Station type diferencia agentes |
| Baggage/BRS | Sesión + role | Agentes de rampa | — |
| WS API | `user_token` | Token-based (REST) | Único módulo con auth moderna |
| APIS/Border | Sesión + role de control de frontera | Agentes de inmigración | Contexto especial de frontera |
| CUPPS | station_key → carrier | Hardware autorizado por estación | No usuario — dispositivo |
| FIDS | Sin auth de usuario detectada | Pantallas públicas | Acceso abierto / sistema |
| xadmin | Auth propia (`xadmin/common/common.php`) | Admins de sistema | Auth administrativa separada |
| Turnaround | Sesión | Agentes operaciones | — |
| Vehículos/GSE | Sesión | Agentes de rampa | — |
| Health/COVID | Sesión + feature flag | Solo si `ici_has_covid_section = true` | Feature gated |
| Configuración/Admin | Sesión + rol admin | Rol de administrador | — |
| User Management | Sesión + rol admin | Solo administradores | — |

### ⚠️ Módulos sin verificación de autorización explícita detectada

Los siguientes módulos potencialmente **no verifican autorización al nivel de módulo** — accesibles a cualquier usuario autenticado:

- **FIDS**: Pantallas informativas — sin auth detectada en entry points
- **Turnaround**: Sin verificación de rol explícita
- **Reportes Centrales**: Acceso controlado solo por sesión activa

Estos representan un **riesgo de seguridad** si la separación modular expone sus APIs directamente.

