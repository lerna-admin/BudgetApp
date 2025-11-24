# BudgetApp - Resumen de Requisitos (RUP)

## 1. Alcance del sistema
BudgetApp permitirá a personas y familias planificar, controlar y optimizar su presupuesto mensual/anual mediante captura de gastos, integración bancaria, alertas proactivas y análisis de salud financiera. La aplicación estará disponible en web y dispositivos móviles, con planes gratuitos y de pago.

## 2. Actores principales
- **Usuario Individual**: gestiona su presupuesto personal.
- **Usuario Familiar**: comparte presupuestos con otros miembros (vista de gastos comunes y privados).
- **Integración Bancaria**: servicios financieros externos que proveen movimientos automáticos.
- **Administrador del Sistema**: configura planes, precios, catálogos y monitorea indicadores.

## 3. Requisitos funcionales (priorizados)
| ID | Prioridad | Descripción |
|----|-----------|-------------|
| RF-01 | Alta | Onboarding con cuestionario que calcule la salud financiera inicial (ingresos, gastos, deudas, metas) y entregue un diagnóstico. |
| RF-02 | Alta | Gestión de presupuestos mensuales/anuales replicando la lógica de la plantilla Excel (categorías, subcategorías, metas y saldos). |
| RF-03 | Alta | Registro manual de transacciones (fecha, monto, categoría, subcategoría, método de pago, notas, adjuntos). |
| RF-04 | Alta | Integración bancaria (primera ola enfocada en entidades colombianas) para importar movimientos automáticamente y reconciliarlos con categorías, preservando una arquitectura lista para sumar nuevos países. |
| RF-05 | Alta | Motor de categorización asistida con reglas editables por el usuario y aprendizaje según correcciones. |
| RF-06 | Alta | Alertas en tiempo real (push, correo, WhatsApp opcional) cuando se excede un presupuesto o ocurre un cargo relevante. |
| RF-07 | Media | Simulador “¿puedo permitírmelo?” que evalúe un gasto futuro contra disponibilidad en el mes y metas. |
| RF-08 | Media | Gestión de tarjetas y cuentas: registrar intereses, límites, fechas de corte/pago y generar recomendaciones. |
| RF-09 | Media | Funcionalidad familiar: presupuestos compartidos con permisos (gastos comunes vs privados) y consolidado por hogar. |
| RF-10 | Media | Panel de suscripciones/recurrencias que detecte pagos repetitivos y sugiera acciones (cancelar, negociar). |
| RF-11 | Baja | Centro de educación financiera con tips personalizados según resultados del diagnóstico. |
| RF-12 | Baja | APIs/exports (CSV, XLSX) para respaldar datos o integrarse con contabilidad externa. |

## 4. Requisitos no funcionales
- **Disponibilidad**: 99 % mensual para servicios web/móvil.
- **Seguridad**: autenticación multifactor, cifrado de datos sensibles (en reposo y tránsito), cumplimiento normativo por país (Habeas Data/Ley 1581 en Colombia, equivalentes LATAM y lineamientos internacionales).
- **Escalabilidad**: soportar al menos 50k usuarios activos con crecimiento horizontal de servicios.
- **Usabilidad**: onboarding guiado <10 minutos, accesibilidad AA (WCAG 2.1), experiencia consistente web/móvil.
- **Rendimiento**: respuesta <2s en vistas críticas (dashboard, registro de transacciones); sincronización bancaria en <5 minutos tras recibir webhooks.
- **Portabilidad**: aplicaciones móviles híbridas (React Native / Expo) aprovechando componentes compartidos con la web.
- **Mantenibilidad**: arquitectura modular basada en microservicios/APIs y desacople entre captura, analítica y notificaciones.

## 5. Supuestos
- Existen APIs de bancos/locales (Plaid/Belvo u otras) disponibles para cuentas colombianas en la fase inicial y con roadmap para nuevos territorios.
- Los usuarios están dispuestos a conectar cuentas siempre que se comunique claramente la seguridad.
- El MVP operará inicialmente en Colombia pero debe diseñarse para escalar a otros países sin reprocesos significativos.

## 6. Dependencias
- Proveedor de integración bancaria (evaluar Plaid, Belvo, Minka u otro).
- Servicios de mensajería (Firebase Cloud Messaging, Twilio, WhatsApp Business).
- Infraestructura de autenticación y pagos (Supabase Auth / Clerk + Stripe para suscripciones).

## 7. Requisitos abiertos / por definir
1. Detalle de regulaciones y licencias necesarias para conectarse a bancos colombianos (y cómo varían al expandirnos).
2. Alcance exacto de la capa familiar (cantidad de miembros, límites de cuentas).
3. Estrategia de planes y precios (tiers, límites del plan gratuito).
4. Localización e idiomas iniciales (español obligatorio, inglés opcional).
5. Estrategia de almacenamiento de documentos/adjuntos asociados a transacciones.

## 8. Próximos pasos
- Elaborar especificaciones de casos de uso priorizados (RF-01 a RF-06).
- Definir criterios de aceptación y métricas por requisito.
- Coordinar investigación regulatoria para el requisito RF-04.
