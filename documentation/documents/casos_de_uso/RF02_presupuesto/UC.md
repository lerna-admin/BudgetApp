# budget-presupuesto.md

## 1. Casos de Uso – Gestión de Presupuestos
# UC-01: Crear presupuesto mensual

## Información General

| Campo | Valor |
|-------|-------|
| **ID** | UC-01 |
| **Nombre** | Crear presupuesto mensual |
| **Versión** | 1.0 |
| **Fecha** | 2026-02-02 |
| **Autor** | Alexandra Castaño |
| **Prioridad** | Alta |
| **Frecuencia de uso** | Alta (cada usuario) |
| **Estado** | En desarrollo |

## Descripción Breve
Permite al usuario crear un presupuesto para un mes específico.

## Actores

| Actor | Tipo | Descripción |
|-------|------|-------------|
| Usuario nuevo | Primario | Persona que desea crear por primera vez un presupuesto sin tener una base diferente a la plantilla por defecto|
| Usuario con un presupuesto creado | Primario | Persona que ya tiene presupuesto de meses anteriores pero desea crear el del mes siguiente |
| suario con un presupuesto creado en otra plataforma| Secundario | Persona que desea importar un archivo para ingresar la información de presupuestos anteriores |

## Precondiciones

1. El usuario tiene acceso a la aplicación (web o móvil)
2. El usuario está autenticado
3. El sistema está disponible y operativo


### Éxito
1. Se crea el presupuesto mensual
2. Se muestra mensaje exitoso

### Fallo
1. No se crea el presupuesto mensual
2. Se muestra mensaje de error apropiado al usuario
3. Se registra el intento fallido en logs de auditoría

**Flujo principal**:
1. Usuario selecciona creación rápida mensual.
2. Define fecha inicio y fin (dd-mm-yyyy).
3. Selecciona plantilla base: vacía.
4. El sistema carga categorías y subcategorías por defecto.
5. El usuario registra los ingresos iniciales para el presupuesto.
6. Usuario registra los valores estimados a gastar y a ahorrar en las subcategorias en la columna 'Plan' y su descripción en 'Descripción'
6. El sistema calcula balance dinámicamente.
7. Usuario guarda como borrador
  7.1. cierra el presupuesto.

**Flujo secundario**:
1. Usuario selecciona creación rápida mensual.
2. Define fecha inicio y fin (dd-mm-yyyy).
3. Selecciona plantilla base: vacía.
4. El sistema carga categorías y subcategorías por defecto.
5. El usuario edita los nombres de la categoria y subcategorias por defecto.
6. El usuario registra los ingresos iniciales para el presupuesto.
7. Usuario registra los valores estimados a gastar y a ahorrar en las subcategorias en la columna 'Plan' y su descripción en 'Descripción'
8. El sistema calcula balance dinámicamente.
9. Usuario guarda como borrador o cierra el presupuesto.

### UC-02: Crear presupuesto anual
| Campo | Valor |
|-------|-------|
| **ID** | UC-02 |
| **Nombre** | Crear presupuesto anual |
| **Versión** | 1.0 |
| **Fecha** | 2026-02-02 |
| **Autor** | Alexandra Castaño |
| **Prioridad** | Alta |
| **Frecuencia de uso** | Alta (cada usuario) |
| **Estado** | En desarrollo |
**Descripción**: Permite crear un presupuesto anual con vista consolidada y mensual.
**Flujo principal**:
1. Usuario selecciona creación rápida anual.
2. El sistema replica categorías y subcategorías para todos los meses.
3. Se visualiza sumatoria anual por categoría y subcategoría.
4. Usuario puede alternar entre vista anual y mensual sin pérdida de datos.

### UC-BP-03: Editar categorías y subcategorías
**Descripción**: Permite modificar categorías por mes.
**Regla clave**: Si una categoría tiene transacciones asociadas, el sistema alerta y aplica el cambio global.

### UC-BP-04: Simular presupuesto
**Descripción**: Permite crear simulaciones fuera del presupuesto activo sin afectar datos reales.

### UC-BP-05: Cerrar presupuesto
**Descripción**: Permite marcar un presupuesto como cerrado.
**Postcondición**: El presupuesto no puede eliminarse.

---

## 2. Features e Historias de Usuario

### Épica: Gestión de presupuestos mensuales/anuales

#### Feature: Creación de presupuesto
- **US-BP-01**: Como usuario, quiero crear un presupuesto mensual desde cero o con ejemplo para planificar mis gastos.
- **US-BP-02**: Como usuario, quiero crear un presupuesto anual y ver el consolidado por categorías.

#### Feature: Gestión de plantilla
- **US-BP-03**: Como usuario, quiero editar categorías y subcategorías usando UTF-8.
- **US-BP-04**: Como usuario, quiero limpiar toda la plantilla de ejemplo con una sola acción.

#### Feature: Balance dinámico
- **US-BP-05**: Como usuario, quiero que el balance se actualice automáticamente al ingresar montos.

#### Feature: Multiplataforma
- **US-BP-06**: Como usuario, quiero que los cambios en web y mobile estén siempre sincronizados.

#### Feature: Tags y simulaciones
- **US-BP-07**: Como usuario, quiero asignar tags personalizadas para futuros gráficos.
- **US-BP-08**: Como usuario, quiero crear simulaciones sin afectar mi presupuesto real.

---

# README2.md

## Gestión de Presupuesto – Historias de Usuario

### Épica: Gestión de presupuestos mensuales/anuales
Replicar y digitalizar la lógica de una plantilla Excel de presupuesto, permitiendo planificación, control y simulación de presupuestos mensuales y anuales sincronizados entre web y mobile.

---

## US-BP-01: Crear presupuesto mensual

**Descripción**  
Como usuario, quiero crear un presupuesto mensual desde cero o usando una plantilla de ejemplo, para planificar mis ingresos y gastos del mes.

**Criterios de aceptación**
- El usuario puede elegir entre plantilla vacía o plantilla con datos de ejemplo.
- La plantilla de ejemplo puede limpiarse completamente con una sola acción.
- El presupuesto incluye fecha inicio y fin en formato dd-mm-yyyy.
- El presupuesto se guarda inicialmente como borrador.

---

## US-BP-02: Crear presupuesto anual

**Descripción**  
Como usuario, quiero crear un presupuesto anual para visualizar y planificar mis finanzas de todo el año.

**Criterios de aceptación**
- El presupuesto anual replica las mismas categorías y subcategorías en todos los meses.
- El sistema muestra una fila de sumatoria anual por categoría y subcategoría.
- Las categorías se resaltan visualmente frente a las subcategorías.
- El usuario puede alternar entre vista anual y mensual sin pérdida de información.

---

## US-BP-03: Gestión de entradas de dinero

**Descripción**  
Como usuario, quiero registrar una o varias entradas de dinero asociadas a categorías y subcategorías, para reflejar correctamente mis ingresos.

**Criterios de aceptación**
- Cada entrada debe asociarse obligatoriamente a una categoría y subcategoría.
- El balance se actualiza automáticamente con cada entrada.
- Si el presupuesto está cerrado, no se permite editar ni eliminar entradas.

---

## US-BP-04: Cálculo dinámico de balance

**Descripción**  
Como usuario, quiero que el balance del presupuesto se calcule automáticamente para conocer mi disponibilidad.

**Criterios de aceptación**
- El balance se calcula como: total entradas – total cantidades presupuestadas.
- El balance se actualiza en tiempo real ante cualquier cambio.
- El balance es solo de lectura cuando el presupuesto está cerrado.

---

## US-BP-05: Gestión de categorías y subcategorías

**Descripción**  
Como usuario, quiero crear y editar categorías y subcategorías para adaptar el presupuesto a mis necesidades.

**Criterios de aceptación**
- Las categorías y subcategorías permiten caracteres UTF-8.
- El usuario puede crear nuevas categorías y subcategorías.
- Al editar una categoría existente, el cambio se sobreescribe históricamente.
- El sistema advierte al usuario si la categoría tiene transacciones asociadas.
- El cambio impacta transacciones, presupuestos y gráficos relacionados.

---

## US-BP-06: Visualización mensual ↔ anual

**Descripción**  
Como usuario, quiero poder visualizar mi presupuesto en formato mensual o anual indistintamente.

**Criterios de aceptación**
- Un presupuesto mensual puede visualizarse en vista anual.
- Un presupuesto anual puede visualizarse por mes.
- Los valores ingresados se mantienen consistentes entre vistas.

---

## US-BP-07: Gestión de idioma

**Descripción**  
Como usuario, quiero que los títulos y categorías por defecto se adapten al idioma seleccionado.

**Criterios de aceptación**
- El sistema soporta al menos español e inglés.
- El cambio de idioma afecta títulos, categorías y subcategorías por defecto.
- Los datos personalizados del usuario no se traducen automáticamente.

---

## US-BP-08: Tags personalizadas

**Descripción**  
Como usuario, quiero asignar tags personalizadas a mi presupuesto para análisis y gráficos futuros.

**Criterios de aceptación**
- El usuario puede crear, editar y eliminar tags.
- Las tags pueden asociarse a categorías y subcategorías.
- Las tags se almacenan para uso analítico posterior.

---

## US-BP-09: Simulación de presupuesto

**Descripción**  
Como usuario, quiero crear simulaciones de presupuesto para evaluar escenarios sin afectar mi presupuesto real.

**Criterios de aceptación**
- La simulación usa exactamente la misma plantilla que el presupuesto real.
- Las simulaciones no afectan presupuestos activos.
- El usuario puede copiar una simulación y guardarla como presupuesto real.

---

## US-BP-10: Cierre de presupuesto

**Descripción**  
Como usuario, quiero cerrar un presupuesto para dejarlo como histórico.

**Criterios de aceptación**
- Un presupuesto cerrado no puede editarse.
- Un presupuesto cerrado no puede eliminarse.
- El estado de cerrado es visible claramente para el usuario.

