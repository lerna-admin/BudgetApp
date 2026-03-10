# Board Schema

Este esquema funciona en Linear, Jira, ClickUp o Notion.
Para `budgetapp`, el gestor oficial actual es ClickUp.

## Estados

1. Backlog
2. Ready
3. In Progress
4. Review Needed
5. Blocked
6. Done
7. Archived

## Campos minimos por ticket

- `venture_id` (slug)
- `task_type` (ver `docs/agent-os/task-types.md`)
- `priority` (`P0` | `P1` | `P2` | `P3`)
- `owner_agent` (supervisor o worker asignado)
- `input_payload` (JSON o links)
- `definition_of_done`
- `due_date`
- `human_gate_required` (`true` | `false`)
- `status`

## SLA sugerido

- `P0`: respuesta en 2h, cierre en 24h
- `P1`: respuesta en 8h, cierre en 72h
- `P2`: respuesta en 24h, cierre en 7 dias
- `P3`: respuesta en 72h, cierre en 14 dias

## Reglas de automatizacion

1. Si `status=Ready`, supervisor enruta en menos de 15 minutos.
2. Si `status=Blocked`, abrir subtask de desbloqueo en menos de 30 minutos.
3. Si `status=Review Needed`, activar `qa_review`.
4. Si `human_gate_required=true`, esperar aprobacion antes de `Done`.
