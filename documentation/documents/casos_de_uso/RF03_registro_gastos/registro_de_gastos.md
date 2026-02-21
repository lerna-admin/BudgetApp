# Casos de Uso - Registro de Gastos (RF-03)

## UC-BP-06: Registrar gasto manual

### Información General

| Campo | Valor |
|-------|-------|
| **ID** | UC-BP-06 |
| **Nombre** | Registrar gasto manual |
| **Versión** | 1.1 |
| **Fecha** | 2026-02-21 |
| **Autor** | Alexandra Castano |
| **Prioridad** | Alta |
| **Frecuencia de uso** | Alta (diaria) |
| **Estado** | En desarrollo |

### Descripción Breve

Permite al usuario registrar movimientos de **gastos y ahorros** en el log mensual con selección guiada por categoría, subcategoría y aristas. **No incluye ingresos**. Esta funcionalidad es crítica en móvil.

### Acciones disponibles cuando el presupuesto está listo

- Agregar un gasto.
- Agregar una inversión (como parte de la categoría Ahorros / subcategoría Ahorros).
- Movimiento entre cuentas (por ejemplo, de Bancolombia a Lulo, o de Bancolombia a bolsillo).
- Ahorro.

### Actores

| Actor | Tipo | Descripción |
|-------|------|-------------|
| Usuario | Primario | Persona que registra movimientos financieros en el log mensual. |

### Precondiciones

1. El usuario tiene acceso a la aplicación (web o móvil).
2. El usuario está autenticado.
3. El sistema está disponible y operativo.

### Postcondiciones

#### Éxito
1. Se registra el movimiento en el log mensual.
2. Se actualiza el balance y los totales del presupuesto.
3. Se muestra confirmación al usuario.

#### Fallo
1. No se registra el movimiento.
2. Se muestra mensaje de error apropiado al usuario.
3. Se registra el intento fallido en logs de auditoría.

### Flujo Básico

| Paso | Actor | Sistema |
|------|-------|---------|
| 1 | Usuario abre el registro de gastos del mes activo. | - |
| 2 | - | Muestra la tabla con columnas de captura y acciones disponibles. |
| 3 | Usuario selecciona tipo de movimiento (Gasto, Ahorro, Inversión dentro de Ahorros, Movimiento entre cuentas). | - |
| 4 | Usuario selecciona Categoría (Gastos/Ahorro) cuando aplica. | - |
| 5 | - | Muestra subcategorías asociadas a la categoría seleccionada. |
| 6 | Usuario selecciona Subcategoría. | - |
| 7 | - | Muestra aristas disponibles según la subcategoría (tomadas del presupuesto). |
| 8 | Usuario registra Fecha, Compra/Detalle, Valor, Arista, Método de pago y Tags. | - |
| 9 | - | Si el método es tarjeta o transferencia, solicita Banco; si es tarjeta, solicita Tarjeta; siempre solicita Moneda. |
| 10 | - | Guarda el movimiento; si es movimiento entre cuentas, no afecta el balance. |
| 11 | - | Muestra confirmación. |

### Flujos Alternativos

#### FA-1: Registro de ahorro
| Paso | Descripción |
|------|-------------|
| 3a | El usuario selecciona categoría “Ahorro”. |
| 10a | El sistema resta el valor del disponible y lo suma al ahorro del mes. |

#### FA-2: Registro sin internet (móvil)
| Paso | Descripción |
|------|-------------|
| 1a | El usuario no tiene conexión. |
| 2a | El sistema permite registrar el gasto y lo guarda localmente como “pendiente de sincronización”. |
| 3a | Al recuperar conexión, el sistema sincroniza los registros y confirma al usuario. |

### Flujos de Excepción

No hay.

### Requisitos Especiales

#### Datos / Persistencia
- Se usa **solo** la estructura de `Presupuesto plantilla 1.xlsx`:
  - Date, Amount, Category, Subcategory, Details.
- `Método de pago`, `Banco`, `Tarjeta`, `Moneda`, `Tags` y `Movimiento entre cuentas (origen/destino)` se guardan como metadatos en `Details` y se seleccionan desde catálogos reutilizables de la app.
- La información del log se filtra por mes activo.

#### Seguridad
- Solo usuarios autenticados pueden registrar movimientos.

#### Rendimiento
- El registro debe ser inmediato (sin recargar la vista).

#### Usabilidad
- Si no hay categoría seleccionada, no se muestran subcategorías.
- Las aristas solo aparecen después de elegir subcategoría.
- En móvil, el registro funciona también sin conexión.

#### Cumplimiento
- No aplica.

### Puntos de Extensión

| Punto | Descripción |
|---|---|
| Configuración de bancos y monedas | Extiende la selección de banco/tarjeta/moneda para presupuesto y gastos. |
| Importación de movimientos | Extiende con carga masiva CSV/XLS (si aplica). |

### Reglas de Negocio

| ID | Regla |
|----|-------|
| RN-RG-01 | Este UC solo permite registrar **Gastos y Ahorro** (no ingresos). |
| RN-RG-02 | Las subcategorías solo se muestran cuando hay categoría seleccionada. |
| RN-RG-03 | Las aristas disponibles dependen de la subcategoría y son las definidas en el presupuesto. |
| RN-RG-04 | Arista = rubro/subclasificación dentro de una subcategoría; no se crean aristas nuevas en el ingreso de gastos. |
| RN-RG-05 | Al registrar Ahorro, se resta del disponible y se suma al ahorro del mes. |
| RN-RG-06 | El movimiento registrado afecta balance y totales del presupuesto. |
| RN-RG-07 | Método de pago puede ser: tarjeta, efectivo, transferencia o préstamo. |
| RN-RG-08 | Si método es tarjeta o transferencia, se debe seleccionar banco; si es tarjeta, se debe seleccionar tarjeta; siempre se debe seleccionar moneda. |
| RN-RG-09 | Movimiento entre cuentas registra cuenta origen y destino para futura visualización por cuenta (informativo, no afecta balance). |
| RN-RG-10 | La inversión se registra dentro de la categoría Ahorros y subcategoría Ahorros. |

### Trazabilidad

| Tipo | ID | Descripción |
|---|---|---|
| Requisito funcional | RF-03 | Registro manual de transacciones |

### Diagrama de Secuencia

```mermaid
sequenceDiagram
    participant Usuario
    participant Sistema
    Usuario->>Sistema: Abre registro mensual
    Sistema-->>Usuario: Muestra acciones y columnas de captura
    Usuario->>Sistema: Selecciona tipo de movimiento
    Usuario->>Sistema: Selecciona categoría, subcategoría y arista
    Usuario->>Sistema: Ingresa fecha, detalle, valor, método, banco/tarjeta y moneda
    Sistema-->>Usuario: Guarda y actualiza balance
    Sistema-->>Usuario: Confirma registro
```

### Mockups / Wireframes

Pendiente por validar con el usuario.

### Historial de Cambios

| Versión | Fecha | Autor | Descripción |
|---------|-------|-------|-------------|
| 1.1 | 2026-02-21 | Alexandra Castano | Ajustes de acciones, método de pago, bancos, moneda y offline. |
| 1.0 | 2026-02-18 | Alexandra Castano | Creación inicial |
