# BudgetApp Web

Aplicación Next.js que implementa la experiencia web descrita en la documentación RUP (onboarding, dashboards, registro de transacciones). Durante la fase de Elaboración consume el mock API basado en la especificación OpenAPI.

## Requerimientos
- Node.js 20+
- pnpm o npm
- Mock API en ejecución (ver raíz del repo: `./scripts/mock-api.sh` por defecto en `http://localhost:4010`)

## Variables de entorno
Copiar `.env.example` a `.env.local` y ajustar según el entorno:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4010
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Scripts
- `pnpm install` – instala dependencias.
- `pnpm dev` – levanta Next.js en modo desarrollo (usa `NEXT_PUBLIC_API_BASE_URL` definido en tu entorno).
- `pnpm dev:mock` – fuerza `NEXT_PUBLIC_API_BASE_URL=http://localhost:4010` para consumir el mock (útil cuando corres `./scripts/mock-api.sh`).
- `npm run start:dev` – alias npm del modo desarrollo (`next dev`).
- `pnpm start` / `npm start` – ejecutan `next build` (a través de `prestart`) y luego `next start`, así no necesitas compilar el build manualmente antes de servirlo.
- `pnpm lint` / `pnpm test` – linting y pruebas configuradas.

## Uso con mock API
1. En la raíz del repo ejecutar `./scripts/mock-api.sh` (o `PORT=5000 ./scripts/mock-api.sh`).
2. En `web-app`, puedes definir `NEXT_PUBLIC_API_BASE_URL=http://localhost:4010` en `.env.local` o simplemente usar `pnpm dev:mock`.
3. `pnpm dev` (o `pnpm dev:mock`) y navegar a `http://localhost:3000` para comenzar el flujo (registro, onboarding, presupuestos, etc.).

### Cliente HTTP
- Se añadió `src/lib/api-client.js` con `apiFetch` y `apiEndpoints` que utilizan `NEXT_PUBLIC_API_BASE_URL`. Usa esta capa para todas las llamadas a la API (mock o real) en lugar de `fetch` directo.

## Configuración por país
El frontend mostrará opciones basadas en `country_config` (descrito en `documentation/documentos/arquitectura.md`). Por ahora sólo está habilitada Colombia, con moneda COP y proveedores Belvo/Minka.
