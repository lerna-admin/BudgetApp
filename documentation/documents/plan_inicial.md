# BudgetApp - Plan Inicial (RUP)

## 1. Objetivo
Establecer el plan inicial del proyecto BudgetApp bajo metodología RUP, definiendo fases, hitos, entregables, tiempos estimados y riesgos para guiar el trabajo conjunto.

## 2. Resumen de Fases y Duración Tentativa
| Fase RUP | Duración estimada | Hitos clave | Entregables principales |
|----------|------------------|-------------|-------------------------|
| Incepción | 3 semanas | Aprobación del Documento de Visión y Requisitos | Visión, Requisitos, Casos de Uso, Plan de Proyecto (este documento) |
| Elaboración | 6 semanas | Arquitectura validada + prototipo funcional web/móvil | Modelo de dominio, Diagramas UML, Prototipos UI, PoC integración bancaria, Backlog priorizado |
| Construcción | 12 semanas (iteraciones de 3 semanas) | Incrementos funcionales listos para pilotos | Releases iterativos (MVP y evoluciones), pruebas unitarias/integración, manuales parciales |
| Transición | 4 semanas | Lanzamiento piloto y plan comercial | Deploy productivo, plan de planes de pago, materiales de soporte, retroalimentación post-piloto |

> Nota: Duraciones sujetas a ajuste tras validar disponibilidad del equipo e integraciones bancarias.

## 3. Detalle por Fase

### 3.1 Incepción
- Actividades: Refinar requerimientos, priorizar backlog, analizar regulaciones bancarias, planificar iteraciones.
- Entregables adicionales: Matriz de riesgos inicial, estrategia de comunicación, estimación de recursos.
- Criterio de salida: Requisitos base aprobados y riesgos críticos identificados.

### 3.2 Elaboración
- Actividades: Diseñar arquitectura (web, móvil, backend, integraciones), definir modelo de datos, desarrollar prototipos navegables (web/móvil), validar integración bancaria mediante sandbox, definir estrategia de seguridad y cumplimiento.
- Entregables: Documento de arquitectura, prototipos UI, pruebas de concepto, plan de pruebas, backlog detallado para construcción.
- Criterio de salida: Arquitectura demostrada, riesgos técnicos mitigados (< Alto) y backlog listo para construcción.

### 3.3 Construcción
- Actividades: Implementar funcionalidades en iteraciones (3 semanas), pruebas continuas, preparación de infraestructura, documentación técnica/usuario.
- Entregables por iteración: Build funcional, reporte de pruebas, actualización de documentación.
- Criterio de salida: MVP validado con usuarios internos/pilotos, métricas de rendimiento cumplidas.

### 3.4 Transición
- Actividades: Pruebas beta, migración/importación de datos (desde Excel), capacitación, soporte inicial, despliegue a producción, puesta en marcha de planes de pago.
- Entregables: Release GA, manuales finales, métricas post-lanzamiento, plan de soporte y mejoras.
- Criterio de salida: Aprobación de stakeholders, adopción inicial conforme a objetivos.

## 4. Iteraciones y Entregables (Vista Detallada)
| Iteración | Fase | Duración | Objetivos principales | Entregables |
|-----------|------|----------|----------------------|-------------|
| I1 | Incepción | 1 semana | Visión y objetivos claros | Visión aprobada |
| I2 | Incepción | 1 semana | Requisitos y casos de uso | Documento de requisitos, Casos de uso |
| I3 | Incepción | 1 semana | Planificación y matriz de riesgos | Plan inicial (este), matriz de riesgos, plan de iteraciones |
| E1 | Elaboración | 3 semanas | Modelo de dominio y arquitectura inicial | Documento de arquitectura v1, prototipo web |
| E2 | Elaboración | 3 semanas | Prototipo móvil + PoC bancaria + seguridad | Prototipo móvil, PoC integración bancaria, plan de seguridad |
| C1 | Construcción | 3 semanas | Onboarding + presupuestos base | Release 0.1, pruebas unitarias |
| C2 | Construcción | 3 semanas | Transacciones, alertas básicas | Release 0.2, pruebas integración |
| C3 | Construcción | 3 semanas | Integración bancaria completa + simulador | Release 0.3, reporte de rendimiento |
| C4 | Construcción | 3 semanas | Plan familiar + planes de pago | Release 0.4 (MVP), manuales parciales |
| T1 | Transición | 2 semanas | Piloto con usuarios reales | Release piloto, feedback report |
| T2 | Transición | 2 semanas | Despliegue general y plan comercial | Release GA, plan de soporte |

## 5. Recursos y Roles
- **Product Owner/Stakeholder**: define prioridades, valida entregables.
- **Analista/Arquitecto (rol asumido por agente)**: documentación, arquitectura, prototipos.
- **Equipo de desarrollo**: Frontend web, móvil, backend, devops (asignar nombres cuando estén disponibles).
- **Especialista legal/fintech**: evalúa cumplimiento bancario.
- **Soporte/Marketing**: prepara materiales de adopción y planes de pago.

## 6. Matriz de Riesgos (inicial)
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|-----------|
| Integración bancaria restringida en Colombia | Alta | Alta | Investigar proveedores certificados, evaluar alianzas con fintech registrada, fase PoC temprana. |
| Bajas tasas de vinculación de cuentas bancarias | Media | Alta | Diseñar comunicación de seguridad, ofrecer beneficios claros sin conexión y campañas educativas. |
| Complejidad para mantener apps web y móvil en paralelo | Media | Media | Reutilizar componentes (design system), uso de monorepo y librerías compartidas. |
| Retrasos por falta de equipo especializado | Media | Alta | Definir staffing tempranamente, considerar outsourcing puntual. |
| Regulaciones de datos personales | Media | Alta | Implementar cumplimiento legal (Habeas Data) y asesoría jurídica desde Incepción. |

## 7. Dependencias y Supuestos
- Acceso a sandbox bancarios en la fase de Elaboración.
- Herramientas de desarrollo disponibles (Next.js, React Native, Supabase, etc.).
- Stakeholder disponible para revisiones semanales.

## 8. Plan de Comunicación
- Reunión semanal de seguimiento con stakeholder.
- Revisión de iteración al final de cada ciclo (demo + retro).
- Documentación almacenada en `documentation/documents/`.

## 9. Próximos pasos inmediatos
1. Completar matriz de riesgos detallada y plan de mitigación.
2. Estimar recursos humanos y asignar responsables por iteración.
3. Validar con stakeholder la duración/orden de iteraciones y realizar ajustes necesarios.
4. Avanzar con documentación de arquitectura (fase Elaboración).
