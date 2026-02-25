# Inicio local Next.js + PostgreSQL

Este directorio centraliza lo necesario para arrancar la implementacion inicial.

## Alcance implementado
- Login
- Registro
- Perfil de usuario

El resto de secciones del frontend estan visibles, pero enlazan a `#` por ahora.

## 1) Instalar PostgreSQL
Ejemplo Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

## 2) Crear usuario y base de datos
Ejecuta el script SQL de este directorio:

```bash
sudo -u postgres psql -f inicio-nextjs-local/01_init_postgres.sql
```

## 3) Configurar variables de entorno backend

```bash
cd backend
cp .env.example .env 2>/dev/null || true
cat > .env <<'ENV'
DATABASE_URL=postgresql://budgetapp:budgetapp@localhost:5432/budgetapp_dev
DB_SSL=false
PORT=4000
AUTH_SECRET=cambia-esta-clave-antes-de-produccion
ENV
```

## 4) Migrar y sembrar datos

```bash
cd backend
npm install
npm run migrate
npm run seed
```

Esto crea tablas y carga perfiles iniciales (Tilbury y otros).

## 5) Levantar backend

```bash
cd backend
npm run dev
```

Backend esperado en `http://localhost:4000`.

## 6) Levantar frontend Next.js

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:4000 npm run dev
```

Frontend esperado en `http://localhost:3000`.

## 7) Flujo funcional para validar
1. Abrir `/register` y crear usuario.
2. Confirmar redireccion a `/profile`.
3. Cerrar sesion.
4. Abrir `/login` e iniciar sesion con el mismo usuario.
