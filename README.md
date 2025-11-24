# BudgetApp

Aplicación web/móvil de presupuesto personal con monitoreo en tiempo real, alertas inteligentes e integración bancaria extensible; la primera fase de integraciones se enfocará en bancos colombianos, pero el producto no se limita a ese mercado. El proyecto se documenta bajo la metodología RUP para garantizar trazabilidad de decisiones y entregables por fase.

## Estado del repositorio
- **Código fuente**: carpeta `web-app/` con la plantilla principal a adaptar y `legacy-code/` con artefactos anteriores (referencias, experimentos).
- **Documentación**: carpeta `documentation/documents/` con los artefactos RUP que guían cada fase.
- **Histórico**: carpeta `historic/` en la raíz del workspace (fuera de este repo) donde se registran todas las conversaciones y decisiones.

## Documentación RUP
| Documento | Descripción |
|-----------|-------------|
| [Visión](documentation/documents/vision.md) | Objetivos estratégicos, métricas de negocio, usuarios meta y diferenciadores competitivos. |
| [Plan inicial](documentation/documents/plan_inicial.md) | Planeación por fases/iteraciones, matriz de riesgos, aprendizajes del Excel y benchmark de otras apps. |
| [Arquitectura](documentation/documents/arquitectura.md) | Vista técnica de referencia, componentes, integraciones bancarias y decisiones clave para un despliegue multi-país. |
| [Requisitos](documentation/documents/requisitos.md) | Detalle de requerimientos funcionales/no funcionales (en construcción). |
| [Casos de uso](documentation/documents/casos_de_uso.md) | Actores y flujos principales que cubren la experiencia de BudgetApp. |
| [OpenAPI](documentation/api/openapi.yaml) | Especificación 0.1.0 de los endpoints prioritarios (onboarding, presupuestos, transacciones, alertas, integraciones). |

> Cada iteración que avancemos agregará nuevos artefactos en este directorio (arquitectura, plan de pruebas, etc.) siguiendo la estructura RUP.

## Mock API
- El repositorio incluye un mock server basado en Prism para probar los contratos REST sin backend real.
- Ejecutar con `./scripts/mock-api.sh` (requiere `node` y descargará Prism vía `npx`); variables `PORT` y `HOST` son opcionales (`4010` y `0.0.0.0` por defecto).
- Los endpoints expuestos responden conforme a `documentation/api/openapi.yaml`, ideal para validar el flujo descrito en el documento de arquitectura.

## Cómo colaborar
1. Revisar los documentos anteriores antes de proponer cambios.
2. Registrar toda conversación relevante en `historic/<fecha>.log` según el proceso acordado con el stakeholder.
3. Usar la llave SSH `~/.ssh/id_ed25519_microimpulso` para interactuar con `git@github.com:lerna-admin/BudgetApp.git`.
