# Backend MVC

Este servicio implementa el backend independiente que alimentará al frontend y a la futura app móvil.
Separa claramente:
- `controllers/` (entrada HTTP). 
- `services/` (reglas de negocio).
- `repositories/` (acceso a la base de datos).

## Requisitos previos
1. Node.js 20+ y npm/ pnpm.
2. Una base relacional (PostgreSQL recomendado). Definir `DATABASE_URL` y, opcionalmente, `DB_SSL=true`.
3. Opcionalmente `docker compose` para levantar la base de datos local aislada (`backend/docker-compose.yml`).

## Instalación, migraciones y arranque (modo sin Docker)
```bash
cd backend
npm install
npm run migrate    # aplica el MER (PostgreSQL)
npm run seed       # opcional: carga catálogos/profiles iniciales
npm run dev        # ejecuta Express en http://localhost:4000
```

Este flujo es ahora el recomendado para desarrollo local para evitar la capa extra de Docker. Asegúrate de tener `DATABASE_URL` apuntando a tu instancia PostgreSQL local o remota.

## Despliegue (staging/producción)
En ambientes remotos se levantará como servicio `systemd` (no Docker). Prepararemos la unidad cuando se empaquete para staging/producción; por ahora el servicio corre con `npm run start` tras instalar dependencias y variables de entorno.

## Variables de entorno
- `DATABASE_URL`: conexión PostgreSQL (`postgresql://user:pass@host:5432/budgetapp_dev`).
- `DB_SSL`: `true` si la base requiere TLS.
- `PORT`: puerto HTTP (por defecto 4000).

Si arrancas el servicio con `docker compose`, puedes usar la URL `postgresql://budgetapp:budgetapp@localhost:5432/budgetapp_dev` (el servicio expone ese usuario/contraseña). Ejecutar las migraciones y seed requiere que `DATABASE_URL` apunte a una base existente.

## (Opcional) Base aislada con Docker Compose
Si en algún momento necesitas aislar dependencias, aún puedes usar `backend/docker-compose.yml`:
1. Instala `docker` y `docker compose`.
2. Desde la raíz del repo: `docker compose -f backend/docker-compose.yml up --build`.
3. El servicio `backend` ejecuta migraciones/seed y arranca en `http://localhost:4000`; el `frontend` expone `3000`.
4. Detén todo con `docker compose -f backend/docker-compose.yml down` (las bases persisten en `db-data`).

> Docker queda como opción secundaria; el flujo principal es instalar Node/PostgreSQL en la máquina y correr `npm run dev` o `npm run start`.

Si la base no está disponible, el backend responde con datos de muestra y también puedes conectar la opción `profiles` para crear una tabla `profiles(id, name, objective, tags jsonb, updated_at)`. Ejecutar las migraciones/seed solo funciona cuando `DATABASE_URL` está definido.
