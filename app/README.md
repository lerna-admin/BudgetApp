# App Next.js

Este proyecto es la nueva capa de presentación web enfocada en consumir el backend Mongo (MVC) de BudgetApp.
Se ejecuta independientemente y puede convivir con futuras apps móviles que reutilicen los mismos contratos.

## Instalación y arranque
```bash
cd app
npm install
npm run dev   # levanta Next.js en http://localhost:3000
```

## Recuperacion de contrasena por correo
En `app/.env` configura:

```bash
DATABASE_URL=postgres://...
AUTH_SECRET=tu-secreto-largo

SMTP_HOST=smtp.tu-proveedor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario_smtp
SMTP_PASS=clave_smtp
SMTP_FROM=BudgetApp <no-reply@tudominio.com>
SMTP_REPLY_TO=soporte@tudominio.com

APP_BASE_URL=http://localhost:3000
```

Alternativa:
```bash
SMTP_URL=smtps://usuario:clave@smtp.tu-proveedor.com:465
```

Aplica migraciones:
```bash
npm run migrate
```

A medida que evolucionemos el front, puedes reemplazar esta carpeta por el diseño final, pero por ahora sirve como placeholder y guía para la integración con la API /pm2.

## Agent OS (multi negocio)

Se agrego un starter kit para operar multiples ideas de negocio con agentes:

- `docs/agent-os/README.md`
- `ops/task-manager/`
- `ops/n8n/`
- `scripts/init-venture.js`

Comando:

```bash
npm run venture:init -- <venture-slug>
```

Storage externo (opcional):

```bash
npm run storage:check
```

ClickUp (gestor de tareas):

```bash
npm run clickup:pull -- --list "$CLICKUP_LIST_ID" --status Ready --limit 20
npm run clickup:dispatch -- --list "$CLICKUP_LIST_ID" --status Ready --limit 20
```

Telegram (gestion por chat privado):

```bash
npm run telegram:discover
npm run telegram:bot
```

Variables:

- `TELEGRAM_ALLOWED_USER_IDS`: whitelist fija (recomendado cuando ya tienes IDs).
- `TELEGRAM_BOOTSTRAP_MAX_USERS`: si `>0`, auto-autoriza primeros N usuarios por DM y persiste allowlist en `BUDGETAPP_STORAGE_ROOT/bot/telegram-allowlist.json`.
- `TELEGRAM_CODEX_ENABLED`: habilita modo AI local con Codex (`1`/`0`).
- `TELEGRAM_CODEX_BIN`: binario a ejecutar (default `codex`).
- `TELEGRAM_CODEX_WORKDIR`: repo/directorio de contexto para `codex exec`.
- `TELEGRAM_CODEX_TIMEOUT_MS`: timeout por mensaje.
- `TELEGRAM_CODEX_MAX_ACTIONS`: maximo de acciones operativas a ejecutar por mensaje.
- `TELEGRAM_TO_CLICKUP_USER_MAP`: mapa JSON opcional `telegram_user_id -> clickup_user_id` para asignaciones automaticas (ej: `"asignamela a mi"`).
- `TELEGRAM_AUDIO_ENABLED`: habilita procesamiento de audios/voice por DM.
- `TELEGRAM_AUDIO_MAX_SECONDS`: duracion maxima permitida por audio.
- `TELEGRAM_STT_LANGUAGE`: idioma para transcripcion local (`es`, `en`, etc.).
- `TELEGRAM_STT_THREADS`: hilos para `whisper-cli`.
- `TELEGRAM_STT_WHISPER_BIN`: ruta al binario local `whisper-cli`.
- `TELEGRAM_STT_WHISPER_MODEL`: ruta al modelo local (ej. `ggml-tiny.bin`).
