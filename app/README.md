# App Next.js

Este proyecto es la nueva capa de presentación web enfocada en consumir el backend Mongo (MVC) de BudgetApp.
Se ejecuta independientemente y puede convivir con futuras apps móviles que reutilicen los mismos contratos.

## Instalación y arranque
```bash
cd app
npm install
npm run dev   # levanta Next.js en http://localhost:3000
```

## Variables de entorno recomendadas
En `app/.env` configura al menos:

```bash
DATABASE_URL=postgres://...
AUTH_SECRET=tu-secreto-largo

# Correo SMTP para recuperacion de contrasena
SMTP_HOST=smtp.tu-proveedor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario_smtp
SMTP_PASS=clave_smtp
SMTP_FROM=BudgetApp <no-reply@tudominio.com>
SMTP_REPLY_TO=soporte@tudominio.com

# URL publica para construir el enlace de reset
APP_BASE_URL=http://localhost:3000
```

Si prefieres una sola URL SMTP:
```bash
SMTP_URL=smtps://usuario:clave@smtp.tu-proveedor.com:465
```

Despues de configurar DB ejecuta migraciones:
```bash
npm run migrate
```

A medida que evolucionemos el front, puedes reemplazar esta carpeta por el diseño final, pero por ahora sirve como placeholder y guía para la integración con la API /pm2.
