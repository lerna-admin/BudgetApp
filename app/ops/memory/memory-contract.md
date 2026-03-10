# Memory IO Contract

Contrato obligatorio para cualquier agente o workflow que quiera participar del sistema.

## Write Contract

```json
{
  "project_id": "budgetapp",
  "venture_id": "budgetapp",
  "thread_id": "TASK-BUDGETAPP-005",
  "task_id": "BUDGETAPP-005",
  "agent_id": "web-dev",
  "event_type": "tool_result",
  "role": "assistant",
  "content": "Implemented landing hero section and CTA",
  "why_it_happened": "Task requires public landing with clear signup flow",
  "next_action": "Run QA checklist and attach screenshots",
  "confidence": 0.88,
  "metadata": {
    "tool": "codex",
    "artifact_path": "src/app/page.jsx",
    "log_file": "$BUDGETAPP_STORAGE_ROOT/logs/logs.jsonl"
  },
  "created_at": "2026-02-28T10:15:00Z"
}
```

## Read Contract

```json
{
  "project_id": "budgetapp",
  "venture_id": "budgetapp",
  "thread_id": "TASK-BUDGETAPP-005",
  "task_id": "BUDGETAPP-005",
  "agent_id": "web-dev",
  "query": {
    "last_n_events": 40,
    "include_semantic_summary": true,
    "include_decisions": true
  }
}
```

## Minimum fields

Required on write:

- `venture_id`
- `thread_id`
- `agent_id`
- `event_type`
- `content`
- `created_at`
- `project_id`

Required on read:

- `venture_id`
- `thread_id`
- `agent_id`
