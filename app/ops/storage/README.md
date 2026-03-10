# Storage Configuration

Objetivo: guardar memoria, artefactos y logs fuera del disco principal.

## Variables

Set these vars in shell or `app/.env`:

```bash
BUDGETAPP_STORAGE_ROOT=/your/mounted-disk/budgetapp-data
BUDGETAPP_MEMORY_LOG_PATH=/your/mounted-disk/budgetapp-data/logs/logs.jsonl
```

If `BUDGETAPP_MEMORY_LOG_PATH` is not defined, the system uses:

`$BUDGETAPP_STORAGE_ROOT/logs/logs.jsonl`

## Check

Run:

```bash
npm run storage:check
```

If it fails, the mount is likely read-only or lacks permissions.

## Current detected external disk (example in this machine)

`/run/media/xanadu/174a84fe-b5e0-44ad-8f44-7110e3b4c3e4`

Mount must be `rw` before using it as storage root.

## Current configured path (budgetapp)

`/home/xanadu/disco_portatil/proyectos/budgetapp`
