# Plan 05-01: Dependencias Externas — Resumen

## Logros

- DEPENDENCIAS-EXTERNAS.md creado con inventario completo adaptado a cloud_2 (sin composer.json)
- 8 librerías PHP vendorizadas in-tree documentadas
- 2 dependencias JS in-tree (jQuery, Socket.io)
- 6 implementaciones custom de protocolos documentadas
- Sistema de testing analizado — 0 cobertura en legacy (156+ controladores)
- 3 alertas de compatibilidad PHP 8.2 identificadas

## Dependencias Críticas Identificadas

1. **XCache (CRÍTICO)** — obsoleto, PHP 8.2 incompatible, riesgo de runtime activo en `ink_autoload()`
2. **gRPC stubs** — destino desconocido, requiere investigación manual
3. **SITA WSDL stubs (91 archivos)** — cualquier cambio WSDL rompe la integración BRS
4. **Sin testing en legacy** — 156+ controladores sin red de seguridad

## Alertas de Licencia

Sin información de licencias disponible (no hay composer.json con metadatos de licencia). Las librerías vendorizadas in-tree tienen licencias desconocidas en esta sesión — **requiere auditoría manual de licencias** antes de distribución comercial.

## Preparación para Plan 05-02

Plan 05-02 producirá MAPA-DEPENDENCIAS-INTERMODULO.md con:
- Mapa de referencias de clases entre módulos (usando LIMITES-MODULOS.md como base)
- Tablas DB compartidas clasificadas por riesgo
- Hotspots con estrategia de migración concreta
- Orden de reescritura por nivel de acoplamiento a departure_control

Inputs listos: LIMITES-MODULOS.md (38 dependencias, 7 hotspots), SCOPE-MODULOS.md, DEPENDENCIAS-EXTERNAS.md
