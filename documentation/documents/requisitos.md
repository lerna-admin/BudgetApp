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
| RF-02 | Alta | Gestión de presupuestos mensuales/anuales replicando la lógica de la plantilla Excel (categorías, subcategorías, metas y saldos) e incluye selección de perfil antes de crear el presupuesto para activar alertas y recomendaciones (sin modificar la estructura de la plantilla). El usuario puede cambiar de perfil durante el año sin afectar información histórica. |
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
| RF-13 | Alta | Servicio `country_config` consultable (REST) que entregue configuración de países, monedas, proveedores y restricciones para sincronizar el frontend, backend y los mocks. |
| RF-14 | Alta | Gestión básica de usuarios (registro, login, roles admin/user) con sesiones basadas en tokens para proteger el dashboard y poder administrar catálogos. |
| RF-15 | Alta | Gamificación inicial: Mapa de avance de metas del año con conteo de pasos por dia) |
| RF-16 | Alta | Gamificación: Contador de monedas por ingreso de gastos para personalizar el avatar y los iconos de los hitos |
| RF-17 | Alta | Cierre de mes y limpieza: Actualización de información de acuerdo al estado real del usuario e inicio de presupuesto del siguiente mes |
| RF-18 | Alta | Importar archivos: archivos csv y xsl con las columnas asociadas a nuestra plantilla |
| RF-19 | Media | División de cuentas compartidas: registrar compras con ítems y participantes para calcular cuánto paga cada persona. |
| RF-20 | Media | Selector de tema y paleta: la interfaz permitirá elegir entre propuestas (paletas de color) y modo claro/oscuro en tiempo real, persistiendo la preferencia del usuario. |
| RF-21 | Alta | Pre-onboarding recomendado "Conoce tu realidad": cuando el usuario no tenga cuentas, deudas, metas o recurrentes, el sistema debe preguntarle si desea registrar su realidad financiera antes de crear presupuesto. |
| RF-22 | Alta | Registro de realidad financiera mínima: cuentas bancarias (nombre, saldo), deudas (origen, saldo actual, tasa EA opcional), metas de ahorro (nombre, valor objetivo, fecha objetivo) y gastos recurrentes/bills (concepto, monto, frecuencia, día de pago). |
| RF-23 | Alta | Si una deuda no tiene tasa reportada, el sistema usará una tasa por defecto de 23 % EA (configurable) para estimar interés y sugerir cuota mensual de salida. |
| RF-24 | Alta | Al crear presupuesto, el sistema debe precargar automáticamente deudas y pagos recurrentes (ej.: casa, carro, servicios, celular, administración) como compromisos editables para evitar omisiones de fin de mes. |
| RF-25 | Media | Durante la creación del presupuesto, el usuario podrá crear nuevas metas de ahorro, deudas o cuentas bancarias sin salir del flujo; estos datos se sincronizan con su realidad financiera. |

### Detalle RF-19: División de cuentas compartidas
- La división se crea con título obligatorio y único (sin duplicados por mayúsculas/minúsculas), moneda y participantes (incluye al usuario).
- Se puede crear la división sin ítems: al pasar al paso de ítems se persiste en base de datos.
- Ítems con campos obligatorios: descripción, valor (> 0), pagó, participantes.
- Validación estricta: la suma de los participantes debe ser 100% del ítem. Si solo hay 1 participante, debe ser 100%.
- Reparto por defecto exacto y en partes iguales (ajuste automático de centavos).
- “Quién pagó” permite seleccionar varias personas; por defecto se divide en partes iguales y, mediante toggle, se puede definir valor y porcentaje por pagador.
- Edición manual de valores y porcentajes con recalculo automático del resto.
- Agregar amigos existentes directamente en el paso de ítems (no solo en la creación de la división).
- Guardar ítems en BD, limpiar formulario tras guardar, mostrar resumen de ítems debajo del formulario y total acumulado.
- Mostrar balances en el paso de ítems por encima del formulario y a todo el ancho.
- Formato numérico en la moneda seleccionada con separadores `.` para miles y `,` para decimales.
- Resumen de divisiones con fecha de creación, número de integrantes, número de ítems y valor total.
- Permitir editar y eliminar ítems; permitir eliminar divisiones.
- Persistencia de la vista de ítems al refrescar (restaurar división y paso desde la URL).
- Interfaz responsive optimizada para web y con proyección a móvil.
- Desde la lista de divisiones existe un botón de Balancear que abre un modal con el detalle de quién debe a quién.
- El balance permite saldar deudas totales o parciales por cada relación, persistiendo los pagos y actualizando los balances.

## 4. Requisitos no funcionales
- **Disponibilidad**: 99 % mensual para servicios web/móvil.
- **Seguridad**: autenticación multifactor, cifrado de datos sensibles (en reposo y tránsito), cumplimiento normativo por país (Habeas Data/Ley 1581 en Colombia, equivalentes LATAM y lineamientos internacionales) y RBAC con roles `user`, `family_admin`, `admin`, `compliance`.
- **Escalabilidad**: soportar al menos 50k usuarios activos con crecimiento horizontal de servicios.
- **Usabilidad**: onboarding guiado <10 minutos, accesibilidad AA (WCAG 2.1), experiencia consistente web/móvil.
- **Rendimiento**: respuesta <2s en vistas críticas (dashboard, registro de transacciones); sincronización bancaria en <5 minutos tras recibir webhooks.
- **Portabilidad**: aplicaciones móviles híbridas (React Native / Expo) aprovechando componentes compartidos con la web.
- **Mantenibilidad**: arquitectura modular basada en microservicios/APIs y desacople entre captura, analítica y notificaciones.

## 5. Supuestos
- Existen APIs de bancos/locales (Plaid/Belvo u otras) disponibles para cuentas colombianas en la fase inicial y con roadmap para nuevos territorios.
- Los usuarios están dispuestos a conectar cuentas siempre que se comunique claramente la seguridad.
- El MVP operará inicialmente en Colombia pero debe diseñarse para escalar a otros países sin reprocesos significativos.
- El catálogo de países (`country_config`) se administrará centralmente; cada registro define moneda, proveedores bancarios disponibles, canales de notificación permitidos y requisitos legales.
  - Cada usuario referencia un país principal; para cuentas familiares o empresas se permitirá seleccionar múltiples países (ej. miembros viviendo en regiones distintas) con reglas heredadas del catálogo.

## 6. Dependencias
- Proveedor de integración bancaria (evaluar Plaid, Belvo, Minka u otro).
- Servicios de mensajería (Firebase Cloud Messaging, Twilio, WhatsApp Business).
- Infraestructura de autenticación y pagos (Supabase Auth / Clerk + Stripe para suscripciones).

## 7. Requisitos abiertos / por definir
1. Detalle de regulaciones y licencias necesarias para conectarse a bancos colombianos (y cómo varían al expandirnos).
2. Alcance exacto de la capa familiar (cantidad de miembros, límites de cuentas).
3. Estrategia de planes y precios (tiers, límites del plan gratuito).
4. Localización e idiomas iniciales (español obligatorio, inglés opcional) vinculados al `country_config`.
5. Estrategia de almacenamiento de documentos/adjuntos asociados a transacciones.

## 8. Próximos pasos
- Elaborar especificaciones de casos de uso priorizados (RF-01 a RF-06).
- Definir criterios de aceptación y métricas por requisito.
- Coordinar investigación regulatoria para el requisito RF-04.
- Diseñar y exponer el endpoint de catálogo de países (RF-13) incluyendo la carga inicial de Colombia/México/Brasil.
