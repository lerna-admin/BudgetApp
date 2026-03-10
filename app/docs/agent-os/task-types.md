# Task Types And Definition Of Done

Todas las tareas deben declarar `task_type` para que el supervisor rote al worker correcto.

## market_research

Input minimo:
- mercado/segmento
- region
- pregunta de negocio

Output obligatorio:
- tamano de mercado (supuestos claros)
- top 5 competidores
- oportunidades no cubiertas
- fuentes enlazadas

DoD:
- al menos 3 fuentes primarias
- riesgos y supuestos explicitos

## competitor_analysis

Input minimo:
- lista de competidores
- criterio de comparacion

Output obligatorio:
- matriz comparativa
- pricing/posicionamiento
- gaps y propuesta de diferenciacion

DoD:
- comparacion accionable para producto y marketing

## product_design

Input minimo:
- problema del usuario
- objetivo de conversion

Output obligatorio:
- user flow
- wireframe low fidelity
- copy inicial de landing

DoD:
- flujo sin huecos
- CTA principal y CTA secundario definidos

## web_development

Input minimo:
- alcance tecnico
- repositorio objetivo
- criterios de aceptacion

Output obligatorio:
- PR o commit
- pruebas ejecutadas
- notas de despliegue

DoD:
- build verde
- criterios de aceptacion cumplidos

## content_seo

Input minimo:
- keyword cluster
- etapa de funnel
- formato (post, mail, social)

Output obligatorio:
- brief
- contenido producido
- metadata SEO
- plan de distribucion

DoD:
- contenido publicable sin edicion mayor
- objetivo y CTA consistentes

## ops_automation

Input minimo:
- proceso a automatizar
- trigger
- sistema origen y destino

Output obligatorio:
- workflow n8n exportable
- manejo de errores
- alertas

DoD:
- idempotencia definida
- logging y reintentos configurados

## qa_review

Input minimo:
- artefacto candidato
- checklist aplicable

Output obligatorio:
- resultado: pass | fail
- defectos
- recomendaciones

DoD:
- evidencia adjunta
- criterio de aprobado reproducible
