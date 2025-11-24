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
- `pnpm dev` – levanta Next.js en modo desarrollo (usa `NEXT_PUBLIC_API_BASE_URL`).
- `pnpm build && pnpm start` – build + server de producción.
- `pnpm lint` / `pnpm test` – linting y pruebas configuradas.
- **Próximo script**: `pnpm dev:mock` (propuesto) podría forzar el uso del mock API; por ahora basta con configurar `.env.local`.

## Uso con mock API
1. En la raíz del repo ejecutar `./scripts/mock-api.sh` (o `PORT=5000 ./scripts/mock-api.sh`).
2. En `web-app`, definir `NEXT_PUBLIC_API_BASE_URL=http://localhost:4010` (o puerto que corresponda).
3. `pnpm dev` y navegar a `http://localhost:3000` para comenzar el flujo (registro, onboarding, presupuestos, etc.).

### Cliente HTTP
- Se añadió `src/lib/api-client.js` con `apiFetch` y `apiEndpoints` que utilizan `NEXT_PUBLIC_API_BASE_URL`. Usa esta capa para todas las llamadas a la API (mock o real) en lugar de `fetch` directo.

## Configuración por país
El frontend mostrará opciones basadas en `country_config` (descrito en `documentation/documentos/arquitectura.md`). Por ahora sólo está habilitada Colombia, con moneda COP y proveedores Belvo/Minka.
