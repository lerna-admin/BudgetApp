# BudgetApp (app + API Next.js)

Implementación unificada en Next.js 15 (App Router) que expone:
- Frontend (React 19) con vistas Dashboard, Registro de movimientos, Deudas, Bancos, Perfil.
- API routes (Next) sobre PostgreSQL: autenticación, gastos/ingresos, deudas, categorías, cuentas, tarjetas, subcategorías personalizadas, tags.

## Requisitos
- Node.js >= 20
- npm >= 10
- PostgreSQL >= 13
- Archivo `.env` en `app/.env` (ya existe en repo de ejemplo):
  ```env
  DATABASE_URL=postgresql://user:pass@localhost:5432/budgetapp_dev
  DB_SSL=false
  PORT=4000
  AUTH_SECRET=cambia-esta-clave-antes-de-produccion
  ```

## Instalación
```bash
cd app
npm install
```

## Migraciones
Las migraciones viven en `app/migrations`. Incluyen esquema base, gastos, catálogo Tilbury, custom subcategorías, ingresos y destinos de ingresos, cuentas/tarjetas.

Ejecutar todas:
```bash
cd app
npm run migrate
```

## Correr en desarrollo
```bash
cd app
npm run dev   # levanta Next en http://localhost:3000
```

## Build de producción
```bash
cd app
npm run build
npm start
```

## Arquitectura (alta nivel)
- **Next.js App Router**: páginas en `src/app`.
- **Componentes clave**:
  - `dashboard-home.jsx`: Dashboard con KPIs (ingresos, gastos, ahorro), disponible calculado usando saldos de cuentas + movimientos; recientes.
  - `expense-register.jsx`: Registro de movimientos con drawer, filtros, subcategorías y aristas personalizadas, destinos de ingresos (efectivo/cuenta), tags con sugerencias, edición/eliminación.
  - `dashboard-sidebar.jsx`: Navegación (Dashboard, Registro de movimientos, Deudas, Herramientas, Configuración, Perfil, Bancos).
  - `bancos/page.jsx`: Gestión de cuentas y tarjetas (tabulado), usa `/api/accounts` y `/api/cards`.
  - `profile/page.jsx`: Perfil real (datos de sesión), muestra cuentas/tarjetas, selector de tema (light/mint/sunset) persistido en `localStorage` y `data-theme`.
- **API routes (Postgres)**:
  - Autenticación: `/api/auth/*` (existente).
  - Movimientos: `/api/expenses`, `/api/expenses/[id]` (CRUD, movement_type incluye income/expense/saving/investment/transfer; destino ingreso opcional).
  - Deudas: `/api/debts`, `/api/debts/[id]` (CRUD con interés EA y sincronización automática a presupuesto/transactions).
  - Catálogo categorías/subcategorías/aristas: `/api/expense-categories`, `/api/subcategories` (custom), `/api/tags` (sugerencias).
  - Cuentas/Tarjetas: `/api/accounts`, `/api/cards` (lista, alta, delete).
- **DB helper**: `src/lib/server/db.js` usa `DATABASE_URL` con `pg`.

## Flujo de datos
- El Dashboard y Registro leen movimientos desde `/api/expenses` (base de datos) y cuentas desde `/api/accounts` para calcular disponible.
- Ingresos permiten destino (efectivo o cuenta); se guardan en columnas `destination_account_id` y `destination_note` de `expenses`.
- Subcategorías personalizadas se guardan en `expense_custom_subcategories`; se crean desde el drawer de movimientos.
- Deudas nuevas/actualizadas se reflejan en `budgets.categories_json` y en `transactions` con `source = debt_registry`.

## Temas (UI)
- Tema actual se guarda en `localStorage` (`budgetapp-theme`) y aplica a `document.documentElement.dataset.theme`. Opciones: light, mint, sunset. Añade tus variables en `globals.css` si deseas personalizar paletas.

## Estructura de carpetas relevante
- `src/app/page.jsx` → Dashboard
- `src/app/gastos` → Registro de movimientos (UI + API en `src/app/api/expenses`)
- `src/app/deudas` → Gestión de deudas (UI + API en `src/app/api/debts`)
- `src/app/bancos` → Cuentas y tarjetas
- `src/app/profile` → Perfil
- `src/app/api/*` → Rutas API (Next)
- `src/lib/server/*` → Repositorios DB
- `migrations/` → SQL
- `documentation/UX-UI/propuesta-10.0/` → Propuesta visual (actualizada con ingresos, edición, estados vacíos)

## Prerrequisitos de sistema
- PostgreSQL corriendo y accesible desde `DATABASE_URL`.
- Abrir puertos: 3000 (Next) y el puerto de Postgres.
- Variables de entorno configuradas antes de `npm run migrate` y `npm run dev`.

## Notas operativas
- El backend Express previo fue removido; todo vive en Next (app + API). Las migraciones se ejecutan con `npm run migrate` desde `app/`.
- Disponible se calcula con: suma de balances de cuentas + ingresos – gastos – ahorro.

## Comandos útiles
- Ejecutar migraciones: `npm run migrate`
- Levantar dev: `npm run dev`
- Build/start: `npm run build && npm start`
