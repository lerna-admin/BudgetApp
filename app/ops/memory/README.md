# Memory Storage (budgetapp only)

## Required local log file

- `BUDGETAPP_MEMORY_LOG_PATH`, or:
- `$BUDGETAPP_STORAGE_ROOT/logs/logs.jsonl`
- fallback local: `<repo>/app/logs/logs.jsonl`

## Why

1. Keep memory isolated per project.
2. Keep audit trail append-only.
3. Keep compatibility with local `proj` setup.

## Event format

Each line in `logs.jsonl` is one JSON object.

Use `scripts/memory-log.js` to write and `scripts/memory-search.js` to read.

## Disk mounted storage

If you want all data in mounted disk, set:

```bash
export BUDGETAPP_STORAGE_ROOT=\"/path/to/mounted-disk/budgetapp-data\"
```

The mount must be writable (`rw`).

## Optional database layer

For semantic retrieval and analytics, you can apply `ops/memory/schema.sql` in a dedicated Postgres database.
