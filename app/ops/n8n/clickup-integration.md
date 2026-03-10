# ClickUp -> Supervisor Integration

## Endpoints usados (ClickUp API v2)

1. `GET /v2/list/{list_id}/task` para leer tareas.
2. `PUT /v2/task/{task_id}` para cambiar estado.
3. `POST /v2/task/{task_id}/comment` para comentar resultados.
4. `POST /v2/team/{team_id}/webhook` para crear webhook (opcional).

## Flujo recomendado

1. Trigger:
- webhook de ClickUp, o polling cron cada 2-5 min.

2. Fetch:
- pedir tareas con `statuses=Ready`.

3. Routing:
- enviar cada tarea a `supervisor-routing` con:
  - `task_id`
  - `task_type`
  - `venture_id`
  - `input_payload`

4. Worker output:
- actualizar task status en ClickUp.
- agregar comentario con resumen y links de artefactos.

## Payload minimo hacia supervisor

```json
{
  "task_id": "86a23abc",
  "task_type": "web_development",
  "venture_id": "budgetapp",
  "input_payload": {
    "source": "clickup",
    "task_url": "https://app.clickup.com/t/86a23abc"
  }
}
```
