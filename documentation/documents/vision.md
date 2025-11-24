# BudgetApp - Documento de Visión (RUP)

## 1. Propósito
Este documento describe la visión del producto BudgetApp dentro del marco RUP para alinear objetivos de negocio, usuarios y capacidades clave antes de avanzar a fases posteriores.

## 2. Antecedentes
- Plantilla actual en Excel utiliza procesos manuales para planificación mensual/anual.
- Necesidad de modernizar la experiencia, automatizar cálculos y habilitar monitoreo en tiempo real.

## 3. Objetivos de negocio
1. **Adopción sostenida**: crecimiento mensual de usuarios activos (meta preliminar: +15 % trimestral).
2. **Integración bancaria temprana**: conexión a bancos colombianos desde las primeras versiones para diferenciarnos.
3. **Monetización escalable**: establecer un modelo freemium con planes de pago (individual, familiar) que habilite ingresos recurrentes.

## 4. Métricas de éxito
- Usuarios activos mensuales (MAU) y tasa de retención >60 %.
- Porcentaje de cuentas conectadas a bancos >=70 % de los usuarios activos.
- Conversión del plan gratuito a planes de pago >=10 % en el primer año.

## 5. Problema y oportunidad
Las personas, especialmente jóvenes profesionales, carecen de visibilidad sobre su salud financiera; llevan presupuestos “en la mente”, lo que impide ahorrar o planear. BudgetApp debe diagnosticar automáticamente la salud financiera durante el onboarding, orientar decisiones diarias y ofrecer alertas antes de exceder el presupuesto.

## 6. Usuarios y stakeholders
- **Jóvenes profesionales**: ingresos variables o fijos, buscan control y alertas cuando sus gastos afectan metas.
- **Familias/parejas**: requieren presupuestos compartidos con cuentas separadas y una vista de gastos comunes.
- **Usuarios avanzados**: emprendedores o freelancers con múltiples tarjetas/cuentas que desean análisis de intereses y patrones de gasto.
- **Stakeholder principal**: Product Owner / Sponsor (usuario actual de la plantilla Excel).

## 7. Características clave (alto nivel)
1. **Onboarding financiero**: cuestionario inicial que calcule salud financiera y ofrezca recomendaciones inmediatas.
2. **Captura de transacciones**: manual y automática via integraciones bancarias; categorización asistida y reglas personalizadas.
3. **Presupuestos mensuales/anuales**: reflejan la lógica de la plantilla Excel, con dashboards web/móvil, metas y simuladores (“¿puedo permitírmelo?”).
4. **Alertas en tiempo real**: notificaciones multicanal cuando se exceden límites o se registran movimientos relevantes.
5. **Gestión de tarjetas y cuentas**: seguimiento de intereses, análisis de uso por tarjeta y sugerencias para optimizar deudas.
6. **Planes de pago**: freemium (usuario individual) y planes premium (familia, alertas avanzadas, integraciones adicionales).

## 8. Diferenciadores competitivos
- Disponibilidad simultánea en web y móvil, con experiencia consistente.
- Integración bancaria desde el inicio + registro de tarjetas para análisis de intereses.
- Motor de simulación previo a compras y alertas predictivas basadas en metas.

## 9. Restricciones y supuestos
- **Regulatorio**: integrarse a bancos colombianos puede requerir certificaciones o registro como fintech.
- **Técnico**: se usará el stack existente (Next.js, React, etc.) y se garantizará paridad funcional con la plantilla Excel.
- **Temporal**: MVP debe incluir onboarding, presupuestos base, captura de gastos y alertas mínimas.
- **Monetización**: iniciar con plan gratuito y evolucionar hacia suscripciones; la capa familiar es premium.

## 10. Riesgos iniciales
1. Obtención de permisos/regulaciones para conexiones bancarias en Colombia (posible necesidad de licencias fintech).
2. Complejidad de mantener sincronización en tiempo real con múltiples bancos.
3. Resistencia de usuarios a vincular cuentas bancarias (necesaria estrategia de confianza y seguridad).

## 11. Cronograma preliminar (Incepción → Transición)
- **Incepción**: documentación, visión, requisitos y plan inicial.
- **Elaboración**: diseño de arquitectura, casos de uso detallados, prototipos web/móvil y validación de integraciones bancarias.
- **Construcción**: desarrollo iterativo de módulos clave (onboarding, transacciones, dashboards, alertas).
- **Transición**: piloto con usuarios reales, incorporación de planes de pago y despliegue productivo.

## 12. Próximos pasos
1. Detallar requisitos funcionales/no funcionales.
2. Modelar actores y casos de uso.
3. Validar opciones regulatorias para integraciones bancarias.

