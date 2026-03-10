# n8n Supervisor Setup

## 1) Import template

Import `ops/n8n/supervisor-routing.json` in n8n.

## 2) Create worker workflows

Create one workflow per worker:

1. `worker-market-research`
2. `worker-product-design`
3. `worker-web-dev`
4. `worker-content-seo`
5. `worker-ops-automation`
6. `worker-qa-review`

Each one should start with `Execute Workflow Trigger`.

## 3) Map workflow IDs

In `supervisor-routing.json`, replace each `workflowId` with the real n8n workflow ID.

## 4) Enforce output contract

Each worker must return JSON that matches `ops/n8n/worker-contracts.md`.

## 5) Connect to task manager

Add trigger and update nodes:

- Trigger when ticket moves to `Ready`.
- Write result when worker returns `done`, `blocked`, or `needs_clarification`.
- For ClickUp setup see `ops/n8n/clickup-integration.md`.

## 6) Mandatory memory write/read

Before each worker action:

1. Read latest memory context for `thread_id`.
2. Inject memory into worker input (`memory_context`).

After each worker action:

1. Write one append-only event in `BUDGETAPP_MEMORY_LOG_PATH` or `$BUDGETAPP_STORAGE_ROOT/logs/logs.jsonl`.
2. Include `project_id=budgetapp`, `venture_id`, `task_id`, `thread_id`, `agent_id`.
