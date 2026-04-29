# Plan 03-02: Auth y Autorización — Resumen

## Logros

- AUTH.md creado con 4 secciones completas
- Flujo de autenticación documentado: session-based custom PHP, 3 entry points
- 8 entidades del sistema RBAC identificadas con schemas reales
- Separabilidad evaluada: No separable actualmente — Alta complejidad
- Autorización por módulo mapeada para los 15 módulos + núcleo

## Mecanismo Auth Detectado

**Tipo**: Session-Based Custom PHP (sin Laravel Auth, JWT, OAuth2)  
**Entry points**: `login.php`, `login_auth.php` (main) + `login_cute.php` (CUTE terminal)  
**RBAC**: Custom — `user_role`, `user_group`, `user_associated_role`, `user_associated_station`  
**Autorización real** = Usuario + Rol + Estación + Aerolínea (carrier_user)  
**Token API**: `user_token` para REST API (Slim) — única auth moderna detectada  
**CSRF**: `csrfp/` library vendorizada. **XSS**: `voku_anti_xss/` + `anti_xss.class.php`  

## ¿Es Separable el Auth?

**No actualmente** — `load_session()` está en 156+ controladores sin middleware centralizado.

**Ruta propuesta:**
1. Centralizar en Auth Service interno con JWT antes de cualquier extracción modular
2. Convertir `load_session()` en middleware que llame al Auth Service
3. Pasar user/carrier/station como request headers a módulos extraídos

**El REST API (`rest/index.php`) ya usa `user_token`** — es la semilla de una separación moderna. La reescritura debe partir de aquí para extender auth moderna a todos los módulos.

## Preparación para Fase 4

- Fase 4 (Integraciones) necesita considerar: `user_token` es el mecanismo de auth para integraciones REST
- CUPPS y CUSS usan auth de dispositivo (station_key) — las integraciones de hardware de Fase 4 deben mapear este mecanismo
- APIS/Border tiene auth específica de contexto (inmigración) — importante para integración con sistemas externos de gobierno

