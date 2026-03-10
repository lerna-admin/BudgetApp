# How Agents Work In BudgetApp

## Estructura

1. Tu creas/priorizas tickets en el gestor.
2. `supervisor` lee tickets en `Ready`.
3. `supervisor` enruta por `task_type`.
4. Worker ejecuta tarea.
5. Worker escribe memoria y actualiza ticket.

## Agentes actuales

1. `supervisor`
2. `market-research`
3. `product-design`
4. `web-dev`
5. `content-seo`
6. `ops-automation`
7. `qa-review`

## Mapa de asignacion (task_type -> agente)

1. `market_research` -> `market-research`
2. `competitor_analysis` -> `market-research`
3. `product_design` -> `product-design`
4. `web_development` -> `web-dev`
5. `content_seo` -> `content-seo`
6. `ops_automation` -> `ops-automation`
7. `qa_review` -> `qa-review`

## Como crear un nuevo agente

1. Define que `task_type` resolvera.
2. Crea workflow n8n `worker-<nombre>` con `Execute Workflow Trigger`.
3. Registra el agente en `ops/ventures/budgetapp/configs/agents.yaml`.
4. Agrega regla en `ops/n8n/supervisor-routing.json`.
5. Asegura output con `ops/n8n/worker-contracts.md`.
6. Activa lectura/escritura de memoria obligatoria.

## Que haces tu (interaccion minima)

1. Mover tickets a `Ready`.
2. Aprobar gates criticos (legal, presupuesto, produccion).
3. Repriorizar semanalmente.

## Que no debes hacer

1. Crear tickets sin `task_type`.
2. Permitir workers sin memoria.
3. Saltar QA para cambios de producto o publicacion.
