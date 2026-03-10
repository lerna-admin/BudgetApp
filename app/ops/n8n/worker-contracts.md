# Worker Contracts

Formato canonico para comunicacion supervisor -> worker y worker -> supervisor.

## Input Contract

```json
{
  "project_id": "budgetapp",
  "task_id": "TASK-123",
  "venture_id": "saas-landing-audit",
  "task_type": "market_research",
  "priority": "P1",
  "due_date": "2026-03-05",
  "input_payload": {
    "links": [],
    "data": {},
    "instructions": []
  },
  "memory_context": {
    "last_events": [],
    "semantic_summary": "",
    "recent_decisions": []
  },
  "definition_of_done": [
    "At least 3 primary sources",
    "Top 5 competitors with pricing"
  ]
}
```

## Output Contract

```json
{
  "project_id": "budgetapp",
  "task_id": "TASK-123",
  "status": "done",
  "worker": "market-research",
  "summary": "Short summary of results",
  "artifacts": [
    {
      "type": "report",
      "path": "ops/ventures/saas-landing-audit/knowledge/market-report-2026-03-01.md"
    }
  ],
  "risks": [],
  "next_actions": [],
  "human_gate_required": false,
  "memory_write": {
    "event_type": "task_update",
    "content": "Completed retrieval and summary",
    "why_it_happened": "Task requested market report",
    "next_action": "Prepare competitor matrix",
    "confidence": 0.84
  }
}
```

## Estado permitido

- `done`
- `blocked`
- `needs_clarification`

## Reglas

1. Nunca devolver texto libre sin JSON estructurado.
2. Si falta input critico, usar `needs_clarification`.
3. Si hay bloqueo externo, usar `blocked` y proponer workaround.
