# UC-DASH-01: Dashboard de Presupuesto

### Información General

| Campo | Valor |
|-------|-------|
| **ID** | UC-DASH-01 |
| **Nombre** | Dashboard de Presupuesto |
| **Versión** | 1.0 |
| **Fecha** | 2026-02-18 |
| **Autor** | Alexandra Castano |
| **Prioridad** | Alta |
| **Frecuencia de uso** | Alta (diaria/semanal) |
| **Estado** | En desarrollo |

### Descripción Breve

Permite visualizar el estado del presupuesto con indicadores y gráficas basadas en la plantilla "Presupuesto plantilla 1".

### Actores

| Actor | Tipo | Descripción |
|-------|------|-------------|
| Usuario Autenticado | Primario | Usuario que consulta su dashboard de presupuesto |

### Precondiciones

1. El usuario tiene un presupuesto activo (mensual o anual).
2. Existen categorías, subcategorías y aristas configuradas.
3. El sistema está disponible.

### Postcondiciones

#### Éxito
1. El dashboard muestra indicadores y gráficas actualizadas.
2. Se reflejan los cambios de presupuesto y transacciones.

#### Fallo
1. No se carga el dashboard.
2. Se muestra mensaje de error apropiado.

### Flujo Básico

| Paso | Actor | Sistema |
|------|-------|---------|
| 1 | Usuario abre el dashboard de presupuesto. | - |
| 2 | - | Calcula totales de presupuesto, gasto real y balance. |
| 3 | - | Muestra fechas de inicio y fin del periodo seleccionado. |
| 4 | - | Renderiza gráficas y secciones del dashboard. |
| 5 | Usuario cambia el periodo (mes actual). | - |
| 6 | - | Actualiza métricas y gráficas del periodo. |

### Flujos Alternativos

#### FA-1: Sin transacciones

| Paso | Descripción |
|------|-------------|
| 2a | Si no hay transacciones, muestra valores en 0 y estado inicial. |

### Flujos de Excepción

Pendiente por validar con el usuario.

### Requisitos Especiales

#### Datos / Persistencia
- El dashboard se alimenta del presupuesto activo y las transacciones del periodo.
- El periodo visible corresponde al mes actual cuando se visualiza en formato mensual.

#### Rendimiento
- El dashboard debe responder en < 2s en condiciones normales.

#### Usabilidad
- Indicadores visibles y comparables entre presupuesto y gasto real.

### Estructura de Categorías, Subcategorías y Aristas

Ver el catálogo base en `UC.md` (UC-01: Crear presupuesto mensual).

### Gráficas y Secciones del Dashboard (Presupuesto plantilla 1)

| Sección/Gráfica | Descripción | Referencia en plantilla |
|---|---|---|
| Dashboard de Presupuesto | Resumen general del presupuesto del período. | "BUDGET DASHBOARD" |
| Resumen general | Indicadores de ingresos, ahorro, facturas, gastos y deudas. | "OVERVIEW" |
| Saldo por presupuestar | Monto pendiente por asignar al presupuesto. | "LEFT TO BUDGET" |
| Saldo por gastar | Monto disponible para gastar según el presupuesto. | "LEFT TO SPEND" |
| Presupuesto vs Real | Comparativo entre lo presupuestado y lo ejecutado. | "BUDGET VS ACTUAL" |
| Flujo de caja | Entradas y salidas de efectivo del período. | "CASH FLOW" |
| Facturas | Sección de facturas con presupuesto, gasto real y saldo. | "BILLS" |
| Gastos | Sección de gastos con presupuesto, gasto real y saldo. | "EXPENSES" |
| Deudas | Sección de deudas con presupuesto, pago real y saldo. | "DEBT" |
| Desglose | Distribución por ahorro, facturas, gastos y deudas. | "BREAKDOWN" |
| Fecha de inicio / Fecha de fin | Rango de fechas del período. | "Start Date" / "End Date" |
| Arrastre de saldo | Saldo inicial trasladado del período anterior. | "Rollover" |

### Puntos de Extensión

| Punto | Descripción |
|---|---|
| Cambio de periodo | Extiende el dashboard con filtros por mes y año |
| Exportación | Extiende el dashboard con exportación de gráficos (pendiente) |

### Reglas de Negocio

| ID | Regla |
|----|-------|
| RN-DASH-01 | El dashboard muestra datos del periodo activo (mes actual en vista mensual) por defecto. |
| RN-DASH-02 | El usuario puede cambiar a vista de 12 meses. |
| RN-DASH-03 | El usuario puede comparar el mismo mes en los últimos 3 años. |
| RN-DASH-04 | El usuario puede comparar por años completos. |
| RN-DASH-05 | Los indicadores deben reflejar la misma lógica de balance del presupuesto. |

### Trazabilidad

| Tipo | ID | Descripción |
|---|---|---|
| Requisito funcional | RF-02 | Presupuestos mensuales/anuales |
| Requisito funcional | RF-03 | Registro manual de transacciones |

### Historias de Usuario

## US-DASH-01: Visualizar dashboard de presupuesto

**Descripción**  
Como usuario, quiero ver un dashboard con gráficas y métricas para entender mi presupuesto.

**Criterios de aceptación**
- El dashboard muestra secciones equivalentes a la plantilla (Overview, Cash Flow, Budget vs Actual, etc.).
- Los datos se actualizan al cambiar el mes actual.
- Los indicadores muestran presupuesto, gasto y balance.
- El usuario puede alternar entre periodo activo, vista 12 meses y comparativos por meses/años.

---

## US-DASH-02: Comparar presupuesto vs gasto

**Descripción**  
Como usuario, quiero comparar mi presupuesto planificado con el gasto real para tomar decisiones.

**Criterios de aceptación**
- Se muestra comparación por categoría/subcategoría.
- Se actualiza automáticamente con cada transacción registrada.

### Mockups / Wireframes

> Pendiente: Enlazar mockups de Figma cuando estén disponibles.

### Historial de Cambios

| Versión | Fecha | Autor | Descripción |
|---------|-------|-------|-------------|
| 1.0 | 2026-02-18 | Alexandra Castano | Creación inicial |
