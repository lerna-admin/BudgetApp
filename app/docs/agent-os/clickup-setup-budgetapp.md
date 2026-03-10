# ClickUp Setup (BudgetApp)

Objetivo: que el sistema lea tareas desde ClickUp y las enrute a agentes con minima intervencion.

## 1) Estructura minima en ClickUp

1. Crear un `Space` para BudgetApp.
2. Crear un `Folder`: `agent-ops`.
3. Crear un `List`: `budgetapp-execution`.

## 2) Estados recomendados

1. `Backlog`
2. `Ready`
3. `In Progress`
4. `Review Needed`
5. `Blocked`
6. `Done`

## 3) Campos personalizados obligatorios

1. `task_type` (Dropdown)
2. `venture_id` (Text)
3. `human_gate_required` (Checkbox)
4. `definition_of_done` (Long Text)
5. `owner_agent` (Text)

Valores sugeridos de `task_type`:

- `market_research`
- `competitor_analysis`
- `product_design`
- `web_development`
- `content_seo`
- `ops_automation`
- `qa_review`

## 4) Variables de entorno

Agregar en `app/.env`:

```bash
CLICKUP_API_TOKEN=replace_me
CLICKUP_TEAM_ID=replace_me
CLICKUP_SPACE_ID=replace_me
CLICKUP_LIST_ID=replace_me
CLICKUP_API_BASE_URL=https://api.clickup.com/api/v2
CLICKUP_ARRAY_MODE=bracket
```

Opcional para arrays de query:

```bash
CLICKUP_ARRAY_MODE=plain
```

## 5) Probar lectura de tareas Ready

```bash
cd /home/xanadu/projects/budgetapp/app
npm run clickup:scan -- --filter budget
npm run clickup:pull -- --list "$CLICKUP_LIST_ID" --status Ready --limit 20
```

## 6) Probar plan de asignacion a agentes

```bash
npm run clickup:dispatch -- --list "$CLICKUP_LIST_ID" --status Ready --limit 20
```

Si sale `unresolved`, falta `task_type` en el ticket.

## 7) Actualizar estado y comentario

```bash
npm run clickup:update -- --task <task_id> --status "In Progress" --comment "Tomado por supervisor"
```

## 8) Integracion con n8n

En n8n:

1. Trigger por webhook de ClickUp o polling cada 2-5 min.
2. Leer tareas `Ready`.
3. Ejecutar `supervisor-routing`.
4. Actualizar ClickUp al terminar cada worker.

Referencia del contrato interno:

- `ops/n8n/worker-contracts.md`
- `docs/agent-os/how-agents-work-budgetapp.md`
