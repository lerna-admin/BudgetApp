# BudgetApp

Aplicación web/móvil de presupuesto personal con monitoreo en tiempo real, alertas inteligentes e integración bancaria extensible; la primera fase de integraciones se enfocará en bancos colombianos, pero el producto no se limita a ese mercado. El proyecto se documenta bajo la metodología RUP para garantizar trazabilidad de decisiones y entregables por fase.

## Estado del repositorio
- **Código fuente**: carpeta `code/` (plantilla base Next.js) y `nextjs-template-javascript/` para iteraciones iniciales.
- **Documentación**: carpeta `documentation/documents/` con los artefactos RUP que guían cada fase.
- **Histórico**: carpeta `historic/` en la raíz del workspace (fuera de este repo) donde se registran todas las conversaciones y decisiones.

## Documentación RUP
| Documento | Descripción |
|-----------|-------------|
| [Visión](documentation/documents/vision.md) | Objetivos estratégicos, métricas de negocio, usuarios meta y diferenciadores competitivos. |
| [Plan inicial](documentation/documents/plan_inicial.md) | Planeación por fases/iteraciones, matriz de riesgos, aprendizajes del Excel y benchmark de otras apps. |
| [Requisitos](documentation/documents/requisitos.md) | Detalle de requerimientos funcionales/no funcionales (en construcción). |
| [Casos de uso](documentation/documents/casos_de_uso.md) | Actores y flujos principales que cubren la experiencia de BudgetApp. |

> Cada iteración que avancemos agregará nuevos artefactos en este directorio (arquitectura, plan de pruebas, etc.) siguiendo la estructura RUP.

## Cómo colaborar
1. Revisar los documentos anteriores antes de proponer cambios.
2. Registrar toda conversación relevante en `historic/<fecha>.log` según el proceso acordado con el stakeholder.
3. Usar la llave SSH `~/.ssh/id_ed25519_microimpulso` para interactuar con `git@github.com:lerna-admin/BudgetApp.git`.
