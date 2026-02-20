# Modelo Entidad-Relación propuesto

Este modelo amplía la documentación RUP existente y recoge las decisiones recientes (perfiles/objetivos, gamificación/badges, base relacional MVC). Lo que sigue debe servir como guía para moldear el backend PostgreSQL y los futuros contratos OpenAPI.

## 1. Entidades clave

| Entidad | Campos principales | Comentario |
|---------|--------------------|------------|
| `users` | `id`, `name`, `email UNIQUE`, `password_hash`, `country_id`, `role`, `status`, `created_at`, `updated_at` | Gestiona credenciales, perfiles y vínculo con `households`. Los `roles` incluyen `user`, `family_admin`, `admin`, `compliance`. El campo `status` controla si la cuenta está activa/suspendida. |
| `households` | `id`, `name`, `plan_type`, `billing_user_id`, `currency`, `members_json`, `created_at`, `updated_at` | Un hogar agrupa a varios usuarios; `members_json` sigue manteniendo relación con la tabla `users`. |
| `countries` | `code PK`, `name`, `currency`, `timezone`, `default_language`, `legal_notes`, `banking_provider`, `created_at` | Catálogo multi-país; el frontend y backend descargan este catálogo antes del onboarding. |
| `banks` | `id`, `name`, `institution_code`, `country_code`, `provider`, `status`, `created_at` | Catálogo de bancos que el usuario puede seleccionar; se extiende desde la nueva sección de configuración para crear bancos/monedas. |
| `accounts` | `id`, `user_id`, `bank_id`, `account_name`, `account_type`, `currency`, `balance`, `external_reference`, `created_at` | Guarda las cuentas bancarias/efectivo; sirve para el seguimiento de movimientos por cuenta. |
| `profiles` | `id`, `slug`, `name`, `description`, `objective`, `primary_goal`, `tags`, `status`, `created_at` | Cada perfil (ahorro, pago de deudas, inversión, mentalidad Tilbury) describe la intención. El `primary_goal` se usa para guiar acciones y notificaciones. |
| `profile_objectives` | `id`, `profile_id`, `metric`, `target_value`, `frequency`, `created_at` | Desglosa metas subyacentes a cada perfil (ej.: `savings_percent`, `debt_reduction`, `investment_contribution`). |
| `profile_selections` | `id`, `user_id`, `profile_id`, `selected_at`, `active`, `notes` | Historial de selección; cuando el usuario cambia de perfil el backend registra la intención actual. |
| `budgets` | `id`, `owner_type`, `owner_id`, `household_id`, `period`, `country_code`, `currency`, `status`, `start_balance`, `categories_json`, `totals_json`, `created_at`, `updated_at` | `status` controla `draft`, `active`, `closed`. Los borradores se guardan automáticamente durante el simulador y solo se consolidan al guardado manual. |
| `transactions` | `id`, `budget_id`, `account_id`, `country_code`, `date`, `amount`, `currency`, `category_id`, `method`, `status`, `source`, `notes`, `tags_json`, `created_at` | Incluye metadata de banco, tarjeta y moneda; el campo `source` distingue entre `manual`, `bank`, `investment`. `status` puede ser `pending`, `posted`, `archived`. |
| `alerts` | `id`, `user_id`, `household_id`, `type`, `triggered_at`, `payload_json`, `status` | Alerta por presupuesto excedido, chequeo de metas o movimientos sospechosos. |
| `achievements` | `id`, `slug`, `title`, `description`, `category`, `icon`, `criteria_json`, `created_at` | Badges/insignias para gamificación. Cada una tiene criterios (p.ej., `balance > 10k COP`, `5 drafts guardados`). |
| `profile_achievements` | `id`, `user_id`, `achievement_id`, `awarded_at`, `metadata_json` | Registro de badges entregadas, expone la “vista de juego” que se podrá mostrar en el desktop o mobile. |
| `gamification_logs` | `id`, `user_id`, `type`, `reference_id`, `details_json`, `created_at` | Traza eventos relevantes (cierre de presupuesto, ahorro completado, transferencia entre cuentas). Útil para alimentar dashboards y la experiencia lúdica. |
| `notifications` | `id`, `user_id`, `type`, `channel`, `payload_json`, `sent_at`, `status`, `created_at` | Notificaciones push/email/WhatsApp via backend; se orquesta con los eventos de gamification y objetivos de perfil.

## 2. Relaciones principales

1. `users` 1:N `households` (un `family_admin` puede crear varios hogares). `households` también puede tener múltiples presupuestos y members.
2. `users` 1:N `accounts`; cada cuenta referencia un `bank` y una `country`. Este vínculo alimenta el seguimiento “por cuenta” (Bancolombia→Lulo, Bancolombia→Bolsillo, etc.).
3. `profiles` 1:N `profile_objectives`; `profile_selections` mantiene la intención activa de cada usuario y permite evaluar si un presupuesto sigue la estrategia actual.
4. `budgets` 1:N `transactions`; `transactions.account_id` permite mostrar movimientos por cuenta en el dashboard. `transactions` también alimenta eventos de `achievements` y `alerts`.
5. `users` 1:N `profile_achievements` y `gamification_logs`; estos datos alimentan la vista de juego (desktop) y las notificaciones motivacionales.
6. `notifications` se disparan de `profile_selections`, `achievements`, `alerts` y `budget` (especialmente en el cierre con toast).

## 3. Consideraciones de gamificación y futuro “Desktop game view”

- Cada logro (`achievements`) se compone de criterios JSON (p.ej., `{
- Cada logro (`achievements`) se compone de criterios JSON (p. ej., `{"metric":"budget_closed","value":3,"period":"monthly"}`) que el backend evalúa contra eventos de `gamification_logs`. Esto permite entregar badges según hábitos (cerrar budgets en draft, transferencias entre cuentas, mantener saldo en cuentas clave).
- `profile_achievements` apunta a las insignias ya entregadas, y `gamification_logs` ofrece un relato cronológico de la actividad que se puede transformar en una vista de “juego” (dashboard estilo reto) en la aplicación de escritorio; esa interfaz puede mostrar niveles, barras de progreso y acciones sugeridas y será definida más adelante.
- Las notificaciones (`notifications`) actúan como canal para que el backend guíe al usuario según su perfil y objetivo actual; por ejemplo, al cambiar el perfil a “Mark Tilbury Inspired” se dispara un push que recomienda aumentar la contribución del 25 %. También activan los toasts cuando un presupuesto se cierra para bloquear modificaciones.

## 4. Siguientes pasos
1. Detallar cada entidad en migraciones SQL (PostgreSQL/Drizzle/Prisma) y añadir índices para `user_id`, `profile_id`, `account_id`.
2. Diseñar scripts de seed para `countries`, `banks`, `profiles`, `achievements` y `objectives`.
3. Actualizar servicios y repositorios del backend para que exposen los nuevos campos (metadatos de cuenta, objetivos de perfil) y consuman la tabla `profile_selections` para guiar la lógica de notificaciones.
4. Definir el UX “game view” del desktop/móvil, incluyendo qué métricas se muestran y cómo se desbloquea cada badge, para reflejarlo luego en las APIs (p. ej., `GET /api/gamification/status`).

La documentación completa de este MER reemplaza el uso actual de SQLite y sirve como fuente única para el equipo, permitiendo que cada integrante entienda cómo se relacionan los perfiles, presupuestos, movimientos y logros dentro de la nueva arquitectura MVC.
