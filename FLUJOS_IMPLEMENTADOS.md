# 📋 Flujos Implementados en PeComEvaluaciones

## 1. **CONFIGURACIÓN DE CICLOS CON DIMENSIONES**

### Descripción General
Los administradores ahora pueden crear ciclos de evaluación especificando qué dimensiones se evaluarán en ese ciclo específico. Esto permite flexibilidad para tener diferentes dimensiones en diferentes ciclos.

### Componentes Involucrados
- `src/pages/Admin/GestionCiclos/index.tsx` - Página principal de gestión
- `src/pages/Admin/GestionCiclos/components/CycleForm/index.tsx` - Formulario
- `src/pages/Admin/GestionCiclos/schema.ts` - Validación con Zod
- `src/pages/Evaluador/CiclosActivos/types.ts` - Tipo Cycle

### Flujo paso a paso

#### **Crear Nuevo Ciclo:**
1. Admin accede a `/admin/ciclos`
2. Click en botón "Nuevo ciclo"
3. Se abre drawer con formulario que incluye:
   - Nombre del ciclo
   - Nombre del proyecto
   - Fecha inicio
   - Fecha fin
   - **Selector de Dimensiones** (checkboxes) - Nuevamente ✨
   - **Selector de Segmentos** (checkboxes) - Nuevamente ✨
4. Validación:
   - Todos los campos requeridos
   - Mínimo 1 dimensión seleccionada
   - Mínimo 1 segmento seleccionado
5. Click "Guardar" → ciclo guardado en estado con `dimensionIds: string[]` y `segmentIds: string[]`

#### **Editar Ciclo:**
1. En la tabla de ciclos, click en "⋮" (menú)
2. Click en "Editar"
3. Se abre drawer con formulario pre-cargado
4. Puede cambiar:
   - Nombre, proyecto, fechas
   - Dimensiones (agregar/quitar)
   - Segmentos (agregar/quitar)
5. Click "Guardar" → actualiza ciclo

### Datos Modificados
```typescript
// Antes
type Cycle = {
  id: string;
  name: string;
  project_name: string;
  start_date: string;
  end_date: string;
  status: CycleStatus;
}

// Ahora ✨
type Cycle = {
  id: string;
  name: string;
  project_name: string;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  dimensionIds: string[];      // ← NUEVO
  segmentIds: string[];        // ← NUEVO
}
```

---

## 2. **FILTRADO DE DIMENSIONES POR CICLO**

### Descripción General
Las vistas de evaluación y resultados ahora muestran SOLO las dimensiones que fueron configuradas para ese ciclo específico, en lugar de todas las disponibles.

### Componentes Involucrados
- `src/pages/Evaluador/MatrizEvaluacion/index.tsx`
- `src/pages/Admin/Resultados/index.tsx`

### Lógica de Filtrado

#### En MatrizEvaluacion (líneas 38-41):
```typescript
const activeD = cycle.dimensionIds && cycle.dimensionIds.length > 0
  ? allDimensions.filter(d => cycle.dimensionIds.includes(d.id))
  : allDimensions;
```

**Resultado:**
- Si el ciclo tiene `dimensionIds` → solo muestra esas dimensiones
- Si no → muestra todas las disponibles (fallback para compatibilidad)

#### En Resultados (líneas 47-50):
```typescript
const activeD = selectedCycle && selectedCycle.dimensionIds && selectedCycle.dimensionIds.length > 0
  ? allDimensions.filter(d => selectedCycle.dimensionIds.includes(d.id))
  : allDimensions;
```

**Impacto:**
- ✅ Matriz de evaluación muestra solo sub-dimensiones del ciclo
- ✅ CSV exportado incluye solo columnas de dimensiones del ciclo
- ✅ Cálculos de progreso usan solo las sub-dimensiones del ciclo

---

## 3. **ASIGNACIÓN DE EVALUADORES**

### Descripción General
Los administradores pueden asignar evaluadores a personas para un ciclo específico. Soporta dos modos: asignación manual (un evaluador para todos) y masiva (CSV).

### Componentes Involucrados
- `src/types/evaluatorAssignments.ts` - Tipo base
- `src/providers/EvaluatorAssignmentsContext.tsx` - Context con localStorage
- `src/pages/Admin/GestionCiclos/EvaluatorAssignmentModal.tsx` - Modal de UI
- `src/pages/Admin/GestionCiclos/CSVImportModal.tsx` - Modal CSV

### Tipo de Datos
```typescript
export type EvaluatorAssignment = {
  id: string;
  cycleId: string;
  dimensionId: string;
  evaluatorId: string;
  personId: string;
};
```

Cada asignación vincula:
- Un ciclo
- Una dimensión
- Un evaluador
- Una persona a evaluar

### Flujo Modo Manual

#### Desde Gestión de Ciclos:
1. Admin ve tabla de ciclos
2. Click en botón "Asignar" en una fila
3. Se abre drawer "Asignar Evaluadores"
4. Por defecto está seleccionado el modo "Manual: Un evaluador para todo"
5. Selector dropdown con lista de evaluadores
6. Muestra: "Asignar a X personas en Y dimensiones"
7. Selecciona un evaluador
8. Click "Asignar"
9. **Resultado:** Se crean N×M asignaciones (N personas × M dimensiones)
   ```
   personas[p1, p2, p3] × dimensiones[dim1, dim2] = 6 asignaciones
   ```

**Código (EvaluatorAssignmentModal.tsx líneas 43-68):**
```typescript
const handleManualAssign = async () => {
  const assignments = [];
  cyclePersons.forEach(person => {
    cycle.dimensionIds.forEach(dimensionId => {
      assignments.push({
        id: `${cycle.id}-${dimensionId}-${selectedEvaluator}-${person.id}`,
        cycleId: cycle.id,
        dimensionId,
        evaluatorId: selectedEvaluator,
        personId: person.id,
      });
    });
  });
  addBulkAssignments(assignments);
};
```

---

## 4. **IMPORTACIÓN CSV DE ASIGNACIONES MASIVAS**

### Descripción General
Los administradores pueden cargar un archivo CSV con múltiples asignaciones a la vez, en lugar de una por una.

### Acceso
1. Desde `/admin/ciclos` → botón "Importar asignaciones"
2. O desde modal de asignación → cambiar a modo "Masivo"

### Formato CSV Requerido
```csv
cycle_id,dimension_id,evaluator_id,person_id
cycle-1,dim-disciplina,eval-001,p1
cycle-1,dim-disciplina,eval-002,p2
cycle-1,dim-conocimiento,eval-001,p1
```

### Flujo Paso a Paso

#### 1. Upload de archivo
```
Click en área de upload → seleccionar .csv
```

#### 2. Parsing CSV
- Lee líneas y extrae headers
- Mapea valores a campos: cycle_id, dimension_id, evaluator_id, person_id
- Crea array de CSVRow

#### 3. Validación (líneas 61-91 CSVImportModal.tsx)
Valida cada fila:
- ✅ `cycle_id`: requerido, debe existir en MOCK_CYCLES
- ✅ `dimension_id`: requerido, debe existir en dimensions context
- ✅ `evaluator_id`: requerido (no valida existencia, más flexible)
- ✅ `person_id`: requerido, debe existir en MOCK_PEOPLE

**Errores reportados:**
```
Fila 2: Ciclo no encontrado: invalid-cycle-id
Fila 3: Dimensión no encontrada: invalid-dim
Fila 5: Persona no encontrada: invalid-person
```

#### 4. Preview (opcional pero recomendado)
- Si no hay errores, muestra preview de las primeras 3 filas
- Formato: `{cycle_id} → {dimension_id} → {evaluator_id} eval a {person_id}`
- Muestra cantidad total de filas

#### 5. Importar
- Click en "Importar"
- Crea array de EvaluatorAssignment
- Agrega a context con `addBulkAssignments()`
- Persiste en localStorage automáticamente
- Cierra modal

### Manejo de Errores
- Si hay errores de validación → **no permite importar**
- Muestra primeros 5 errores + contador de más
- Usuario debe corregir el CSV y reintentar

---

## 5. **CONTEXTO DE ASIGNACIONES DE EVALUADORES**

### Descripción General
Context global con localStorage que mantiene todas las asignaciones de evaluadores en el estado de la aplicación.

### Archivo
`src/providers/EvaluatorAssignmentsContext.tsx`

### Métodos Disponibles

```typescript
type EvaluatorAssignmentsContextValue = {
  assignments: EvaluatorAssignment[];                                    // Array global
  addAssignment: (assignment: EvaluatorAssignment) => void;            // Agregar una
  addBulkAssignments: (assignments: EvaluatorAssignment[]) => void;    // Agregar muchas
  deleteAssignment: (id: string) => void;                             // Eliminar una
  getAssignmentsByCycleDimension: (cycleId, dimensionId) => [];        // Filtrar por ciclo+dimensión
  getAssignmentsByEvaluator: (evaluatorId) => [];                      // Filtrar por evaluador
  deleteAssignmentsByCycle: (cycleId) => void;                         // Limpiar un ciclo
};
```

### Persistencia
- **Storage key:** `pecom-evaluator-assignments`
- **Tipo:** localStorage JSON
- **Auto-guardado:** Se persiste automáticamente en cada cambio (useEffect)
- **Auto-cargado:** Se restaura al montar el provider

### Uso en Componentes
```typescript
const { addBulkAssignments, assignments } = useEvaluatorAssignments();

// Agregar asignaciones
addBulkAssignments([...newAssignments]);

// Leer asignaciones
const myAssignments = assignments.filter(a => a.evaluatorId === 'eval-001');
```

---

## 6. **DUPLICACIÓN DE DIMENSIONES**

### Descripción General
Los administradores pueden clonar una dimensión completa con todas sus sub-dimensiones en un click.

### Acceso
En `/admin/dimensiones` → menú de opciones (⋮) en cada dimensión → "Duplicar"

### Flujo

1. Admin está viendo lista de dimensiones
2. Hover en una dimensión y click en icono "⋮" (tres puntos)
3. Menú abre con opciones:
   - Editar
   - **Duplicar** ← NUEVA
   - Agregar sub-dimensión
   - Eliminar

4. Click en "Duplicar"
5. **Sin confirmación** → duplica inmediatamente
6. Nueva dimensión aparece en la lista con:
   - Nombre original + " (Copia)"
   - Mismo nombre en todas las sub-dimensiones
   - Nuevos UUIDs para ambos (dimensión y subs)

### Implementación
`DimensionsContext.tsx` líneas 71-85:

```typescript
const duplicateDimension = (id: string) => {
  const dimensionToDuplicate = dimensions.find(d => d.id === id);
  if (!dimensionToDuplicate) return;

  const newDimension: Dimension = {
    id: crypto.randomUUID(),                      // Nuevo ID
    name: `${dimensionToDuplicate.name} (Copia)`, // Nuevo nombre
    subDimensions: dimensionToDuplicate.subDimensions.map(sd => ({
      id: crypto.randomUUID(),                    // Nuevo ID para cada sub
      name: sd.name,                              // Mismo nombre
    })),
  };

  setDimensions(prev => [...prev, newDimension]);
};
```

### Ejemplo Visual
```
ANTES:
├─ Disciplina Operacional
│  ├─ Compromiso con la Seguridad
│  ├─ Identificación de Peligros
│  └─ Cultura Segura
└─ Conocimiento Técnico

DESPUÉS de duplicar "Disciplina Operacional":
├─ Disciplina Operacional
│  ├─ Compromiso con la Seguridad
│  ├─ Identificación de Peligros
│  └─ Cultura Segura
├─ Disciplina Operacional (Copia)           ← NUEVA
│  ├─ Compromiso con la Seguridad           ← NUEVA (mismo nombre, diferente ID)
│  ├─ Identificación de Peligros
│  └─ Cultura Segura
└─ Conocimiento Técnico
```

---

## 7. **VISTA DE DETALLES DE CICLOS**

### Descripción General
Panel detallado que muestra toda la información de un ciclo incluyendo asignaciones de evaluadores y progreso de evaluaciones.

### Acceso
En `/admin/ciclos` → botón "Ver detalles" en cada fila

### Información Mostrada

#### Progreso del Ciclo
- Barra de progreso visual
- "X de Y respuestas completadas"
- Porcentaje completado
- Color: rojo (< 100%), verde (= 100%)

#### Dimensiones Asociadas
- Chips con los nombres de cada dimensión seleccionada
- Contador total

#### Estado de Evaluaciones (Tabla)
Columnas:
- **Persona** - Nombre y legajo
- **Segmento** - Segmento asignado
- **Evaluadores Asignados** - Lista de evaluadores
- **Estado** - Badges indicando:
  - "Sin evaluadores" (rojo)
  - "Completado" (verde)
  - "X/Y respuestas" (amarillo) si parcial

#### Resumen
- Total de personas evaluadas
- Cantidad de dimensiones
- Total de sub-dimensiones
- Total respuestas esperadas

### Cálculos Dinámicos
```
totalExpected = personas.length × subDimensions.length
totalCompleted = sum(completed scores por persona)
percentage = (totalCompleted / totalExpected) × 100
```

---

## 8. **INTEGRACIÓN EN APP.tsx**

### Cambios
El provider `EvaluatorAssignmentsProvider` está envuelto en la app:

```typescript
<DimensionsProvider>
  <SegmentsProvider>
    <EvaluatorAssignmentsProvider>        ← NUEVO
      <MenuLayerProvider>
        {/* ... resto del árbol */}
      </MenuLayerProvider>
    </EvaluatorAssignmentsProvider>
  </SegmentsProvider>
</DimensionsProvider>
```

**Orden de providers:** Importante que esté después de DimensionsProvider pero dentro de la estructura general.

---

## 📊 Diagrama de Flujos General

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN - /admin/ciclos                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌───────────────────┐  ┌──────────────┐  │
│  │ Nuevo Ciclo  │  │ Ver Detalles      │  │ Asignar      │  │
│  │              │  │                   │  │              │  │
│  │ ↓ Abre drawer│  │ ↓ Abre drawer     │  │ ↓ Abre drawer│  │
│  │ CycleForm    │  │ CycleDetailsModal │  │ Evaluator    │  │
│  │              │  │                   │  │ Assignment   │  │
│  │ - Nombre     │  │ - Progreso visual │  │              │  │
│  │ - Proyecto   │  │ - Dimensiones     │  │ MODO MANUAL: │  │
│  │ - Fechas     │  │ - Evaluadores     │  │ - Selector   │  │
│  │ - ✨ Dims    │  │ - Estado evaluac  │  │ - Crear N×M  │  │
│  │ - ✨ Segs    │  │                   │  │   asignac    │  │
│  │              │  │                   │  │              │  │
│  └──────────────┘  └───────────────────┘  │ MODO MASIVO: │  │
│                                            │ - CSV upload │  │
│                                            │ - Validación │  │
│                                            │ - Preview    │  │
│                                            │ - Importar   │  │
│                                            └──────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Botón: "Importar asignaciones"                         │  │
│  │ ↓ Abre CSVImportModal directamente                     │  │
│  │ (O accesible desde modal de Asignar en modo "Masivo") │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   EvaluatorAssignmentsContext
                   (localStorage persistence)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              EVALUADOR - /evaluador/matriz                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Filtra dimensiones por cycle.dimensionIds                  │
│  Muestra solo las sub-dimensiones del ciclo                │
│  Matriz de evaluación: Personas × Sub-dimensiones          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              ADMIN - /admin/resultados                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Filtra dimensiones por cycle.dimensionIds                  │
│  CSV export incluye solo dimensiones del ciclo              │
│  Tabla de resultados: Personas × Sub-dimensiones           │
│                                                               │
└─────────────────────────────────────────────────────────────┘

ADMIN - /admin/dimensiones
├─ Nueva dimensión
├─ Editar dimensión  
├─ ✨ Duplicar dimensión ← Nuevo flujo
├─ Agregar sub-dimensión
├─ Editar sub-dimensión
└─ Eliminar sub-dimensión
```

---

## 🔄 Flujo Completo de Ejemplo

### Escenario: Admin quiere evaluar a 5 personas con 2 dimensiones diferentes

**Paso 1: Crear Ciclo**
- Va a `/admin/ciclos`
- Click "Nuevo ciclo"
- Completa:
  - Nombre: "Q2 2024 - LAJE"
  - Proyecto: "LAJE"
  - Inicio: 2024-04-01
  - Fin: 2024-06-30
  - ✨ Dimensiones: Selecciona "Disciplina" y "Actitud"
  - ✨ Segmentos: Selecciona "Gerentes" y "Operarios"
- Click "Guardar"
- **Resultado:** Ciclo creado con `dimensionIds: ["disciplina", "actitud"]`

**Paso 2: Asignar Evaluadores (Masivo)**
- Todavía en `/admin/ciclos`
- Click "Importar asignaciones"
- Prepara CSV:
  ```csv
  cycle_id,dimension_id,evaluator_id,person_id
  [cycle-id],disciplina,eval-001,p1
  [cycle-id],disciplina,eval-002,p2
  [cycle-id],actitud,eval-001,p1
  [cycle-id],actitud,eval-003,p3
  ```
- Carga archivo
- Valida: ✅ Todo correcto
- Preview: muestra 4 filas
- Click "Importar"
- **Resultado:** 4 asignaciones creadas en localStorage

**Paso 3: Ver Detalles**
- En tabla de ciclos, click "Ver detalles"
- Drawer muestra:
  - Progreso: 0/X respuestas (aún no se completaron)
  - Dimensiones: Disciplina, Actitud (solo 2)
  - Tabla con personas, evaluadores asignados, estado

**Paso 4: Evaluadores Completan**
- Evaluadores van a `/evaluador/ciclos`
- Ven el ciclo "Q2 2024 - LAJE"
- Click para abrir matriz
- Ven tabla con 5 personas × 6 sub-dimensiones (3 de Disciplina + 3 de Actitud)
- Completan puntajes y envían

**Paso 5: Revisar Resultados**
- Admin va a `/admin/resultados`
- Selecciona ciclo "Q2 2024 - LAJE"
- Ve:
  - Tabla con resultados
  - Personas con puntajes "Nocivos" (1)
  - Barra de progreso actualizada
- Click "Exportar CSV"
- Descarga: nombre, legajo, disciplina-seg, disciplina-ident, disciplina-cultura, actitud-respons, actitud-collab, actitud-proactiv

---

## 📝 Validaciones y Restricciones

### Ciclos
- ✅ Nombre: requerido
- ✅ Proyecto: requerido
- ✅ Fechas: requeridas
- ✅ **Dimensiones:** mínimo 1 (ERROR: "Seleccioná al menos una dimensión")
- ✅ **Segmentos:** mínimo 1 (ERROR: "Seleccioná al menos un segmento")

### CSV Import
- ✅ cycle_id: requerido y debe existir
- ✅ dimension_id: requerido y debe existir
- ✅ evaluator_id: requerido (no valida existencia)
- ✅ person_id: requerido y debe existir
- ✅ NO permite importar si hay errores
- ✅ Muestra hasta 5 errores + contador

### Dimensiones
- ✅ Nombre: requerido
- ✅ Sub-dimensión: nombre requerido
- ✅ Al duplicar: genera nuevos UUIDs automáticamente
- ✅ Al duplicar: preserva estructura y nombres

---

## 🗄️ Almacenamiento

### localStorage Keys
- `pecom-cycles` → Ciclos (si se guardan localmente)
- `pecom-dimensions` → Dimensiones
- `pecom-evaluator-assignments` ← **NUEVA**
- `pecom-segments` → Segmentos

### Respeto a Estado
- Los cambios en un nivel no afectan otros
- Eliminar un ciclo no elimina las asignaciones (usuario debe limpiar)
- Eliminar una dimensión no afecta ciclos que la usan

---

## 🎯 Estados y Transiciones

### Estado de Ciclo
```
[DRAFT] ← Nuevo
  ↓
Puede editar dimensiones/segmentos
  ↓
[ACTIVE] ← Click "Activar"
  ↓
Evaluadores pueden ver y completar
  ↓
[CLOSED] ← Click "Cerrar"
  ↓
Lectura de resultados solamente
```

### Progreso de Evaluación
```
"0/X respuestas"   ← Sin evaluar
        ↓
"5/12 respuestas"  ← Progreso (aparece badge amarillo)
        ↓
"12/12 respuestas" ← Completo (aparece badge verde "Completado")
```

---

## 💾 Resumen de Cambios a Archivos Clave

| Archivo | Cambio | Tipo |
|---------|--------|------|
| `src/pages/Evaluador/CiclosActivos/types.ts` | Agregar `dimensionIds` y `segmentIds` a Cycle | Modificación |
| `src/types/evaluatorAssignments.ts` | Crear tipo EvaluatorAssignment | Creación |
| `src/providers/EvaluatorAssignmentsContext.tsx` | Crear context completo | Creación |
| `src/pages/Admin/GestionCiclos/schema.ts` | Validar dimensionIds y segmentIds | Modificación |
| `src/pages/Admin/GestionCiclos/components/CycleForm/index.tsx` | Agregar checkboxes para dims/segs | Modificación |
| `src/pages/Admin/GestionCiclos/CSVImportModal.tsx` | Crear modal CSV | Creación |
| `src/pages/Admin/GestionCiclos/EvaluatorAssignmentModal.tsx` | Crear modal asignación | Creación |
| `src/pages/Admin/GestionCiclos/CycleDetailsModal.tsx` | Crear modal detalles | Creación |
| `src/providers/DimensionsContext.tsx` | Agregar método `duplicateDimension` | Modificación |
| `src/pages/Admin/Dimensiones/index.tsx` | Agregar opción "Duplicar" en menú | Modificación |
| `src/pages/Evaluador/MatrizEvaluacion/index.tsx` | Filtrar dims por `cycle.dimensionIds` | Modificación |
| `src/pages/Admin/Resultados/index.tsx` | Filtrar dims por `cycle.dimensionIds` | Modificación |
| `src/App.tsx` | Envolver EvaluatorAssignmentsProvider | Modificación |

---

## ✨ Funcionalidades Clave Agregadas

✅ **Configuración flexible de dimensiones por ciclo**
✅ **Asignación manual de evaluadores**
✅ **Importación masiva CSV de asignaciones**
✅ **Validación robusta de CSV**
✅ **Duplicación de dimensiones con un click**
✅ **Filtrado automático de vistas según ciclo**
✅ **Persistencia en localStorage de asignaciones**
✅ **Vista detallada de ciclos con progreso**
✅ **Mensajes de error claros y específicos**
✅ **Interfaz intuitiva con drawers y modales**

---

## 🚀 Próximas Mejoras Posibles

- [ ] Filtrar personas por evaluador asignado
- [ ] Editar/eliminar asignaciones después de creadas
- [ ] Validar que evaluador_id existe en lista de evaluadores
- [ ] Exportar asignaciones a CSV
- [ ] Historial de cambios en ciclos
- [ ] Notificaciones a evaluadores cuando se asignan
- [ ] Soporte para Excel además de CSV
- [ ] Previsualización de resultados esperados

