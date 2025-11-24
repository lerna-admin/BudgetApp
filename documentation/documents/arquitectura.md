# BudgetApp - Documento de Arquitectura (RUP)

## 1. Propósito
Definir la arquitectura de referencia para BudgetApp (web/móvil) a fin de guiar el diseño detallado, las integraciones bancarias iniciales en Colombia y la futura expansión multi-país, alineado con la fase de Elaboración del proceso RUP.

## 2. Alcance y supuestos
- MVP contempla onboarding financiero, presupuestos, registro manual/automático de transacciones, alertas y capa familiar básica.
- Frontend web en Next.js (React) y app móvil en React Native/Expo reutilizando un design system común.
- Backend inicial en Node.js (NestJS/Express) desplegado en servicios containerizados (Render/Heroku/AWS Fargate) con base de datos Postgres (posible uso de Supabase para acelerar).
- Mensajería en tiempo real y notificaciones vía Firebase Cloud Messaging (push) + Twilio/WhatsApp para canales alternos.
- Integración bancaria: proveedor tipo Belvo/Minka (primer despliegue con bancos colombianos) con diseño multi-tenant para sumar nuevas regiones sin reescrituras.

## 3. Vista lógica (componentes principales)
| Capa | Componentes | Responsabilidades clave |
|------|-------------|-------------------------|
| Presentación | Web App Next.js, Mobile App React Native, Design System compartido | Experiencia omnicanal, localización, autenticación, invocación de APIs, almacenamiento offline básico. |
| API/Backend | API Gateway/BFF, Servicios de Dominio (Onboarding, Presupuestos, Transacciones, Finanzas Familiares, Notificaciones), Servicio de Integraciones | Exponer APIs REST/GraphQL, aplicar validaciones/reglas de negocio, orquestar flujos de integración bancaria y alertas. |
| Datos/Analítica | PostgreSQL (OLTP), Redis (cache/sesiones), almacén analítico futuro (BigQuery/Redshift) | Persistencia de usuarios, presupuestos, transacciones, auditorías; agregaciones para dashboards y métricas de salud financiera. |
| Integraciones | Conector Bancario (Belvo/Minka), Mensajería (FCM/Twilio), Pagos (Stripe), Observabilidad (Datadog/Sentry) | Sincronización de movimientos, envíos de notificaciones multi-canal, cobro de planes, monitoreo y trazabilidad. |

## 4. Flujo de alto nivel
1. **Autenticación**: usuario se registra/inicia sesión mediante proveedor (Supabase Auth / Clerk) con MFA opcional. Token JWT se usa contra el API Gateway.
2. **Onboarding**: Web/Móvil consume `/onboarding` para registrar ingresos, deudas y metas; el servicio calcula salud financiera y guarda snapshot en Postgres.
3. **Presupuestos**: Frontend invoca `/budgets` para CRUD de categorías/subcategorías; reglas se guardan y se comparten entre miembros familiares mediante ACLs.
4. **Integración bancaria**: usuario inicia flujo OAuth/Belvo Link; el Servicio de Integraciones suscribe webhooks y encola movimientos en una cola (p. ej. SQS). El Servicio de Transacciones procesa eventos, ejecuta reglas de categorización y actualiza dashboards.
5. **Alertas**: reglas configurables se evalúan (cron + eventos); se envían push/email/WhatsApp via Notificaciones.
6. **Planes de pago**: Stripe gestiona suscripciones; backend sincroniza beneficios (familia, alertas avanzadas) mediante webhooks.

## 5. Modelo de datos (alto nivel)
- `users`: perfil, preferencias, país/región, tipo de plan.
- `households`: agrupa usuarios para planes familiares; controla permisos.
- `budgets`: registros mensuales/anuales con moneda, metas por categoría y estado.
- `categories` / `subcategories`: catálogo jerárquico configurable.
- `transactions`: origen (manual/bancario), estado, etiquetas, vínculo a cuentas.
- `accounts`: tarjetas/cuentas bancarias conectadas (proveedor, país, currency).
- `alerts` y `notifications`: reglas configuradas y bitácora de envíos.
- `integrations`: tokens/estados para proveedores bancarios, mensajería y pagos.

## 6. Consideraciones de integración bancaria
- **Proveedor**: Belvo/Minka ofrece API única para bancos colombianos; se encapsula en el Servicio de Integraciones para poder cambiar de proveedor o agregar otro (Plaid, Tink) al entrar a nuevos países.
- **Multi-país**: se abstrae la lógica con entidades `financial_institution` y `country` para mapear endpoints, horarios y normativas.
- **Seguridad**: tokens almacenados cifrados (KMS) y rotados periódicamente; se implementa Webhook Signature Validation para evitar spoofing.
- **Latencia**: uso de colas/eventos para desacoplar ingestión; front recibe notificaciones de nuevas transacciones mediante WebSockets/Server-Sent Events.

## 7. Seguridad y cumplimiento
- Autenticación multifactor y gestión de sesiones con refresh tokens rotativos.
- Cifrado AES-256 para datos sensibles (tokens bancarios, documentos, PII) y TLS 1.2+ en tránsito.
- Segmentación de entornos (dev/stage/prod) con políticas IAM de mínimo privilegio.
- Auditoría: trail de cambios en budgets/transactions, logging estructurado (ELK/CloudWatch).
- Cumplimiento: regulación colombiana (Habeas Data, SFC) para fase inicial y compatibilidad con estándares internacionales (PCI DSS para Stripe, GDPR/LGPD cuando se expanda).

## 8. Disponibilidad, rendimiento y escalabilidad
- Despliegue en contenedores con auto-escalado horizontal; CDN (Vercel/CloudFront) para web.
- Uso de Feature Flags para habilitar mercados/regiones sin nuevos despliegues.
- Estrategia de caching (Redis) para dashboards y catálogos; colas para cargas pesadas (importaciones masivas, simuladores).
- Observabilidad: métricas (Prometheus), tracing distribuido (OpenTelemetry) y alertas automáticas.

## 9. Decisiones arquitectónicas clave
1. **Monorepo con packages compartidos** (design system, modelos TypeScript) para mantener paridad web/móvil.
2. **API Gateway + microservicios ligeros** para permitir escala por dominio y facilitar incorporación de equipos futuros.
3. **Proveedor bancario abstraído**: se encapsula en adaptadores para soportar múltiples países sin dependencias directas en el core.
4. **Infraestructura como código** (Terraform/Pulumi) para reproducibilidad y gestión de entornos.
5. **Uso inicial de Supabase/Managed Postgres** para acelerar MVP, con plan para migrar a infra dedicada cuando superemos 50k usuarios.

## 10. Riesgos técnicos y mitigación
| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Latencia/errores del proveedor bancario | Alto | Colas + reintentos exponenciales, almacenamiento temporal de movimientos, monitoreo dedicado y opción de failover manual. |
| Complejidad de mantener paridad web/móvil | Medio | Librería de componentes compartidos, pruebas visuales y automatización de builds móviles. |
| Cumplimiento multi-país | Alto | Asesoría legal temprana, configuración por país (feature flags) y cifrado adaptable. |
| Escalamiento de notificaciones en tiempo real | Medio | Arquitectura event-driven, uso de servicios manejados (FCM, SNS) y particionamiento por canal. |
| Dependencia de un único proveedor bancario | Alto | Contrato con al menos un proveedor alterno, diseño de adaptadores e indicadores que disparen la incorporación de otro servicio. |

## 11. Diagramas de referencia

### 11.1 Componentes (vista lógica)
```mermaid
graph TD
    subgraph Clientes
        U1[Usuario Web] -->|HTTPS| WApp[Web App Next.js]
        U2[Usuario Móvil] -->|HTTPS| MApp[Mobile App RN]
    end
    WApp -->|GraphQL/REST| BFF
    MApp -->|GraphQL/REST| BFF
    subgraph Backend
        BFF[API Gateway / BFF]
        OB[Servicio Onboarding]
        BG[Servicio Presupuestos]
        TX[Servicio Transacciones]
        FA[Servicio Familia]
        NT[Servicio Notificaciones]
        IN[Servicio Integraciones Bancarias]
    end
    BFF --> OB
    BFF --> BG
    BFF --> TX
    BFF --> FA
    BFF --> NT
    TX --> IN
    IN -->|Webhooks/Queues| PB[(Proveedor Bancario)]
    TX -->|SQL| DB[(PostgreSQL)]
    BG -->|SQL| DB
    OB -->|SQL| DB
    FA -->|SQL| DB
    NT -->|Redis| Cache[(Redis)]
    NT -->|APIs| MSG[(FCM/Twilio)]
```

### 11.2 Despliegue
```mermaid
graph LR
    subgraph Cliente
        Browser --> CDN
        Mobile --> AppStore/OTA
    end
    CDN --> WebApp[Vercel / Static Next.js]
    Mobile --> RNApp[Expo OTA Updates]
    WebApp --> ALB
    RNApp --> ALB
    subgraph Infraestructura
        ALB[Application Load Balancer]
        APICluster[(API Containers)]
        WorkerCluster[(Workers/Queues)]
        DB[(Managed Postgres/Supabase)]
        Cache[(Redis/Memcached)]
        Queue[(SQS/Rabbit)]
    end
    ALB --> APICluster
    APICluster --> DB
    APICluster --> Cache
    APICluster --> Queue
    Queue --> WorkerCluster
    WorkerCluster --> DB
    WorkerCluster --> Integraciones[(Belvo/Minka, Stripe, Twilio, FCM)]
```

### 11.3 Secuencia – Importación de transacción bancaria
```mermaid
sequenceDiagram
    participant Bank as Banco
    participant Provider as Proveedor Bancario
    participant Integrations as Servicio Integraciones
    participant Queue as Cola/Event Bus
    participant Transactions as Servicio Transacciones
    participant API as API/BFF
    participant Client as Web/Móvil

    Client->>API: Solicita conectar cuenta
    API->>Provider: Inicia Link/OAuth
    Provider-->>Client: Modal de autorización
    Client->>Bank: Credenciales (canal seguro del proveedor)
    Bank-->>Provider: Token de acceso
    Provider-->>Integrations: Webhook movimiento nuevo
    Integrations->>Queue: Encola evento de transacción
    Queue->>Transactions: Consume evento
    Transactions->>DB: Guarda transacción y aplica reglas de categoría
    Transactions->>API: Emite evento SSE/WebSocket
    API-->>Client: Notifica nueva transacción
    Transactions->>Notifications: Solicita alerta si aplica
```

## 12. Contratos de API iniciales
| Recurso | Método/Endpoint | Request (resumen) | Response | Notas |
|---------|-----------------|-------------------|----------|-------|
| Onboarding | `POST /api/onboarding` | `{ ingresos, gastosMensuales, deudas[], metas[] }` | `201 Created` + `{ scoreSalud, recomendaciones[] }` | Restringir a usuarios autenticados; guarda snapshot inicial. |
| Presupuestos | `GET /api/budgets?period=2025-12` | Headers `Authorization` | `{ period, currency, categories: [{id, asignado, gastado}] }` | Soporta filtros por periodo y household. |
| Presupuestos | `POST /api/budgets` | `{ period, currency, categories[] }` | `201 Created` + presupuesto completo | Valida límites según plan (individual/familiar). |
| Transacciones | `POST /api/transactions` | `{ date, amount, categoryId, method, notes, attachments[] }` | `201` + `{ id, status }` | Método manual; attachments almacenados en storage seguro. |
| Transacciones (importadas) | `GET /api/transactions?source=bank&status=pending` | — | Lista de movimientos pendientes de confirmar | Permite reconciliar manualmente. |
| Integraciones bancarias | `POST /api/integrations/banks/link-token` | `{ institutionId, country }` | `{ linkToken }` | Token efímero para iniciar flujo con proveedor. |
| Alertas | `POST /api/alerts` | `{ type, threshold, channels[] }` | `201` | Reglas guardadas y asociadas al usuario/household. |

> Todas las APIs devolverán errores estructurados (`code`, `message`, `details`) y se documentarán en OpenAPI v3 para facilitar SDKs.

## 13. Próximos pasos
1. Validar los diagramas anteriores con el stakeholder y convertirlos a versiones finales (UML) para los entregables oficiales de Elaboración.
2. Publicar el contrato OpenAPI/GraphQL completo (incluyendo esquemas de error y webhooks) y generar SDKs automáticos.
3. Prototipar el BFF/API Gateway y probar la integración bancaria en sandbox (Belvo/Minka) para ajustar latencias y colas.
4. Establecer infraestructura base (monorepo, pipelines CI/CD, Supabase/Postgres administrado) y definir políticas de backup/DR.
5. Completar el plan de seguridad y respuesta a incidentes antes de permitir el piloto con datos reales.
