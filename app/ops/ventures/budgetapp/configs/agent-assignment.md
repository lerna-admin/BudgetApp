# Agent Assignment Matrix (budgetapp)

## Supervisor

- Inputs: tickets en `Ready`
- Action: clasificar y enrutar por `task_type`
- Output: subtask/dispatch al worker correcto

## Worker matrix

| agent_id | task_types | primary outputs |
|---|---|---|
| market-research | market_research, competitor_analysis | reportes de mercado, benchmark |
| product-design | product_design | user flow, wireframes, copy |
| web-dev | web_development | PRs, features, fixes |
| content-seo | content_seo | briefs, articulos, metadata |
| ops-automation | ops_automation | workflows n8n, cron, alertas |
| qa-review | qa_review | checklist de calidad, pass/fail |

## SLA sugerido

- P0: 2h respuesta / 24h cierre
- P1: 8h respuesta / 72h cierre
- P2: 24h respuesta / 7 dias cierre
- P3: 72h respuesta / 14 dias cierre

## Memory required

Todos los agentes deben:

1. Leer contexto previo del `thread_id`.
2. Escribir evento al inicio y cierre.
3. Guardar en `BUDGETAPP_MEMORY_LOG_PATH` o `$BUDGETAPP_STORAGE_ROOT/logs/logs.jsonl`.
