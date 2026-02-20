# Backend MVC

Este servicio implementa el backend independiente que alimentará al frontend y a la futura app móvil.
Separa claramente:
- `controllers/` (entrada HTTP). 
- `services/` (reglas de negocio).
- `repositories/` (acceso a la base de datos).

## Requisitos previos
1. Node.js 20+ y npm/ pnpm.
2. Una base relacional (PostgreSQL recomendado). Definir `DATABASE_URL` y, opcionalmente, `DB_SSL=true`.

## Instalación, migraciones y arranque
```bash
cd backend
npm install
npm run migrate    # aplica el MER (PostgreSQL)
npm run seed       # opcional: carga catálogos/profiles iniciales
npm run dev        # ejecuta Express en http://localhost:4000
```

## Variables de entorno
- `DATABASE_URL`: conexión PostgreSQL (`postgresql://user:pass@host:5432/budgetapp_dev`).
- `DB_SSL`: `true` si la base requiere TLS.
- `PORT`: puerto HTTP (por defecto 4000).

Si la base no está disponible, el backend responde con datos de muestra y también puedes conectar la opción `profiles` para crear una tabla `profiles(id, name, objective, tags jsonb, updated_at)`. Ejecutar las migraciones/seed solo funciona cuando `DATABASE_URL` está definido.
