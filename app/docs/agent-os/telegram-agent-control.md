# Telegram Agent Control (DM only)

Objetivo: que Henry y Alexandra gestionen solicitudes al sistema por chat privado con el bot.

## Requisitos

1. `TELEGRAM_BOT_TOKEN`
2. `TELEGRAM_ALLOWED_USER_IDS` (IDs de Henry y Alexandra) o bootstrap
3. `CLICKUP_LIST_ID` configurado

Bootstrap opcional:

- `TELEGRAM_BOOTSTRAP_MAX_USERS=2` autoriza automaticamente los primeros 2 usuarios por DM.
- La allowlist persistida queda en `BUDGETAPP_STORAGE_ROOT/bot/telegram-allowlist.json`.

## Comandos

1. `/task <task_type> | <titulo> | <descripcion>`
2. `/status <task_id>`
3. `/ready <task_id>`
4. `/comment <task_id> | <comentario>`
5. `/ai` (estado del modo AI)
6. `/help`

Texto libre:

- Si Codex local esta activo (`TELEGRAM_CODEX_ENABLED=1`), interpreta la solicitud y puede ejecutar acciones operativas.
- Puede actualizar tareas existentes (titulo, descripcion, prioridad y asignacion) y listar/consultar tareas del proyecto.
- Si AI no esta disponible, fallback: crea tarea automatica e infiere `task_type`.
- Si envias audio/voice por DM, el bot lo transcribe localmente y ejecuta acciones con ese texto.

## Arranque

```bash
cd /home/xanadu/projects/budgetapp/app
npm run telegram:discover
npm run telegram:bot
```

## Seguridad

1. Solo usuarios en `TELEGRAM_ALLOWED_USER_IDS`.
2. Si usas bootstrap, solo los primeros N quedan autorizados.
3. Bot bloquea grupos y solo acepta chat privado.
4. Registro de eventos en memoria (`logs.jsonl`).

## Variables Codex Local

1. `TELEGRAM_CODEX_ENABLED` (`1` o `0`)
2. `TELEGRAM_CODEX_BIN` (default `codex`)
3. `TELEGRAM_CODEX_WORKDIR` (default repo `app/`)
4. `TELEGRAM_CODEX_TIMEOUT_MS` (default `120000`)
5. `TELEGRAM_CODEX_MAX_ACTIONS` (default `4`)
6. `TELEGRAM_TO_CLICKUP_USER_MAP` (JSON opcional para resolver asignaciones por requester)

## Variables Audio (STT local)

1. `TELEGRAM_AUDIO_ENABLED` (`1` o `0`)
2. `TELEGRAM_AUDIO_MAX_SECONDS` (maximo por audio)
3. `TELEGRAM_STT_LANGUAGE` (ej. `es`)
4. `TELEGRAM_STT_THREADS` (hilos para transcripcion)
5. `TELEGRAM_STT_WHISPER_BIN` (ruta a `whisper-cli`)
6. `TELEGRAM_STT_WHISPER_MODEL` (ruta al modelo `ggml-*.bin`)
