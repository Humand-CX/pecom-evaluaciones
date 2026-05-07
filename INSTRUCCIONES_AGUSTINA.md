# 👋 Instrucciones para Agustina - PeComEvaluaciones

**Fecha:** 2026-05-07  
**De:** Federica Correa  
**Para:** Agustina  
**Objetivo:** Trabajar en paralelo en features del roadmap

---

## 📋 Resumen de lo que ya está hecho

Federica completó la primera fase del proyecto implementando:

✅ **Ciclos configurables** - Ahora cada ciclo puede tener dimensiones y segmentos específicos  
✅ **Asignación de evaluadores** - Manual (1 evaluador → múltiples personas × dimensiones)  
✅ **Importación CSV** - Carga masiva de asignaciones con validación  
✅ **Filtrado automático** - Las vistas solo muestran dimensiones del ciclo  
✅ **Duplicación de dimensiones** - Clona dimensiones completas con un click  
✅ **Vista de detalles** - Panel con progreso, estadísticas y tabla de evaluadores  

**Documentación disponible:**
- `FLUJOS_IMPLEMENTADOS.md` - Descripción detallada de cada flujo (1000+ líneas)
- `DIAGRAMA_FLUJOS.txt` - Diagramas visuales en ASCII
- `STATUS.md` - Estado ejecutivo del proyecto

---

## 🚀 PASO 1: Preparar tu Ambiente

### 1.1 Clonar el repositorio (si aún no lo hiciste)
```bash
git clone https://github.com/Humand-CX/pecom-evaluaciones
cd pecom-evaluaciones
```

### 1.2 Crear tu rama personal
```bash
git checkout -b agustina/features
```

### 1.3 Instalar dependencias
```bash
npm install
```

### 1.4 Correr el proyecto
```bash
npm run dev
```

**Link local:** http://localhost:5173

---

## 🎯 PASO 2: Entender la Arquitectura Actual

### Estructura de carpetas relevante
```
src/
├── pages/
│   ├── Auth/Login
│   ├── Evaluador/
│   │   ├── CiclosActivos
│   │   └── MatrizEvaluacion
│   ├── Admin/
│   │   ├── GestionCiclos/       ← Aquí está la magia
│   │   ├── Dimensiones/
│   │   └── Resultados/
│   └── Home/
├── providers/
│   ├── AuthContext
│   ├── DimensionsContext        ← Maneja dimensiones
│   ├── SegmentsContext
│   ├── EvaluatorAssignmentsContext  ← ✨ NUEVO - Maneja asignaciones
│   └── (más)
├── types/
│   ├── segment.ts
│   ├── evaluatorAssignments.ts  ← ✨ NUEVO
│   └── (más)
└── (más)
```

### Tipos de datos principales
```typescript
// Cycle - Ahora incluye:
type Cycle = {
  id: string;
  name: string;
  project_name: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'closed' | 'draft';
  dimensionIds: string[];       // ← NUEVO
  segmentIds: string[];         // ← NUEVO
};

// EvaluatorAssignment - NUEVO tipo
type EvaluatorAssignment = {
  id: string;
  cycleId: string;
  dimensionId: string;
  evaluatorId: string;
  personId: string;
};
```

### Providers disponibles
```typescript
// Para usar en componentes:
import { useDimensions } from '@/providers/DimensionsContext';
import { useSegments } from '@/providers/SegmentsContext';
import { useEvaluatorAssignments } from '@/providers/EvaluatorAssignmentsContext';

// Ejemplo:
const { dimensions } = useDimensions();
const { assignments } = useEvaluatorAssignments();
```

---

## 📚 PASO 3: Revisar la Documentación

### Lee en este orden:
1. **STATUS.md** (10 min) - Resumen rápido del estado
2. **DIAGRAMA_FLUJOS.txt** (15 min) - Visualización de flujos
3. **FLUJOS_IMPLEMENTADOS.md** (30 min) - Detalle completo
4. **Código actual** - Review de componentes principales:
   - `src/pages/Admin/GestionCiclos/index.tsx`
   - `src/providers/EvaluatorAssignmentsContext.tsx`
   - `src/pages/Admin/GestionCiclos/CSVImportModal.tsx`

---

## 🔧 PASO 4: Elegir qué Feature Implementar

Aquí están las opciones del roadmap. Elige una o varias según tu preferencia:

### Option A: Filtrar personas por evaluador (FÁCIL - 2-3 horas)
**Descripción:** En la matriz de evaluación, si el evaluador está asignado solo a ciertas personas, mostrar solo esas.

**Componentes a modificar:**
- `src/pages/Evaluador/MatrizEvaluacion/index.tsx`

**Lógica:**
```typescript
// Obtener evaluador actual desde auth
const { user } = useAuth();

// Filtrar personas por asignaciones
const { assignments } = useEvaluatorAssignments();
const myAssignments = assignments.filter(a => a.evaluatorId === user.id);
const myPeople = MOCK_PEOPLE.filter(p => 
  myAssignments.some(a => a.personId === p.id)
);

// Usar myPeople en lugar de MOCK_PEOPLE en la matriz
```

**Archivos nuevos:** Ninguno  
**Archivos a modificar:** 1  
**Complejidad:** ⭐ Fácil

---

### Option B: Editar/Eliminar asignaciones (MEDIA - 4-5 horas)
**Descripción:** Agregar botones para editar o eliminar asignaciones después de creadas.

**Componentes a crear/modificar:**
- `src/pages/Admin/GestionCiclos/components/AssignmentsTable.tsx` (NUEVO)
- `src/pages/Admin/GestionCiclos/index.tsx` (modificar)
- `src/providers/EvaluatorAssignmentsContext.tsx` (agregar método deleteAssignment)

**Lógica:**
```typescript
// En EvaluatorAssignmentsContext agregar:
const updateAssignment = (id: string, updates: Partial<EvaluatorAssignment>) => {
  setAssignments(prev => 
    prev.map(a => a.id === id ? { ...a, ...updates } : a)
  );
};

// En tabla de asignaciones:
// [Editar] [Eliminar] botones por fila
// Modal/Drawer para editar
```

**Archivos nuevos:** 1 componente  
**Archivos a modificar:** 2  
**Complejidad:** ⭐⭐ Media

---

### Option C: Validar que evaluator_id existe (FÁCIL - 1-2 horas)
**Descripción:** En el CSV import, validar que el evaluator_id existe en la lista de evaluadores.

**Componentes a modificar:**
- `src/pages/Admin/GestionCiclos/CSVImportModal.tsx`

**Lógica:**
```typescript
// Agregar a validateRows()
if (!row.evaluator_id) {
  validationErrors.push({ row: rowNum, message: 'Falta evaluator_id' });
} else if (!MOCK_EVALUATORS.find(e => e.id === row.evaluator_id)) {
  validationErrors.push({ 
    row: rowNum, 
    message: `Evaluador no encontrado: ${row.evaluator_id}` 
  });
}
```

**Archivos nuevos:** Ninguno  
**Archivos a modificar:** 1  
**Complejidad:** ⭐ Fácil

---

### Option D: Exportar asignaciones a CSV (MEDIA - 3-4 horas)
**Descripción:** Agregar botón para descargar todas las asignaciones de un ciclo en CSV.

**Componentes a modificar:**
- `src/pages/Admin/GestionCiclos/CycleDetailsModal.tsx` (agregar botón)
- `src/pages/Admin/GestionCiclos/index.tsx` (agregar handler)

**Lógica:**
```typescript
const handleExportAssignments = (cycleId: string) => {
  const { assignments } = useEvaluatorAssignments();
  const cycleAssignments = assignments.filter(a => a.cycleId === cycleId);
  
  const headers = ['cycle_id', 'dimension_id', 'evaluator_id', 'person_id'];
  const rows = cycleAssignments.map(a => [
    a.cycleId, a.dimensionId, a.evaluatorId, a.personId
  ]);
  
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  // Descargar como archivo
};
```

**Archivos nuevos:** Ninguno  
**Archivos a modificar:** 2  
**Complejidad:** ⭐⭐ Media

---

### Option E: Notificaciones cuando se asignan evaluadores (MEDIA-DIFÍCIL - 5-6 horas)
**Descripción:** Toast/snackbar que notifica cuando se crean asignaciones.

**Componentes a modificar:**
- `src/pages/Admin/GestionCiclos/EvaluatorAssignmentModal.tsx`
- `src/pages/Admin/GestionCiclos/CSVImportModal.tsx`
- (posiblemente crear contexto de notificaciones)

**Lógica:**
```typescript
// Después de addBulkAssignments()
toast.success(`✅ ${assignments.length} asignaciones creadas`);

// O para cada CSV:
toast.info(`📊 Importadas ${preview.length} filas`);
```

**Archivos nuevos:** 0-1 (si creas contexto)  
**Archivos a modificar:** 2  
**Complejidad:** ⭐⭐⭐ Media-Difícil

---

## 🎓 PASO 5: Mi Recomendación

**Si es tu primer día:** Elige **Option C** (validar evaluator_id)
- Muy simple, toma 1-2 horas
- Te familiariza con el código
- Es una mejora real al sistema

**Luego:** Elige **Option A** (filtrar personas)
- Un poco más complejo (2-3 horas)
- Afecta UX importante
- Aprenderás sobre hooks y filtrados

**Si tienes tiempo:** Agrega **Option D** (exportar asignaciones)
- Complementa bien a Option A
- Mejora UX para admin

---

## 🔨 PASO 6: Workflow para Implementar

### 6.1 Crear rama local
```bash
git checkout -b agustina/features
```

### 6.2 Antes de empezar
```bash
# Traer cambios de main (opcional)
git pull origin main

# Verificar estar en tu rama
git branch  # Debe mostrar * agustina/features
```

### 6.3 Implementar feature

**Pseudocódigo del proceso:**
```
1. Abre archivo a modificar
2. Lee el código actual (entiende la estructura)
3. Agrupa cambios lógicamente
4. Prueba en http://localhost:5173
5. Haz commit cuando termines
6. Repite si hay más cambios
```

**Ejemplo de commit:**
```bash
git add src/pages/Admin/GestionCiclos/CSVImportModal.tsx
git commit -m "feat: Validar evaluator_id en CSV import

- Verifica que evaluator_id existe en MOCK_EVALUATORS
- Reporta error específico si no encontrado
- Ejemplo: 'Evaluador no encontrado: eval-999'

Co-Authored-By: Agustina <agustina@humand.co>"
```

### 6.4 Hacer push
```bash
git push -u origin agustina/features
```

### 6.5 Crear Pull Request
- Ve a GitHub → tu rama → "Compare & pull request"
- Título: Describe la feature en 1 línea
- Descripción: Qué hiciste, cómo testearlo
- Asigna a Federica como reviewer

---

## 📝 PASO 7: Checklist para tu PR

Antes de hacer push, verifica:

- [ ] El código compila sin errores (`npm run dev`)
- [ ] Probaste la feature en http://localhost:5173
- [ ] Los cambios están en archivos correctos
- [ ] Agregaste comentarios si es código complejo
- [ ] El commit tiene mensaje descriptivo
- [ ] Incluiste Co-Authored-By en el commit
- [ ] No hay archivos sin trackers innecesarios

---

## 💬 Preguntas Frecuentes

### "¿Dónde está el mock data?"
```typescript
// Personas
import { MOCK_PEOPLE } from '@/pages/Evaluador/MatrizEvaluacion/constants';

// Evaluadores
import { MOCK_EVALUATORS } from '@/pages/Evaluador/MatrizEvaluacion/constants';

// Ciclos
import { MOCK_CYCLES } from '@/pages/Evaluador/CiclosActivos/constants';
```

### "¿Cómo accedo a los contextos?"
```typescript
// Opción 1: Usa el hook directamente
const { dimensions } = useDimensions();

// Opción 2: Verifica si el componente está dentro del provider
// (Si no está, te dará error: "must be used within DimensionsProvider")
```

### "¿Cómo hago debugging?"
```typescript
// Usa console.log
console.log('assignments:', assignments);

// O abre DevTools de React
// Extensión: React Developer Tools en Chrome/Firefox
```

### "¿Qué pasa si tengo conflicto de merge?"
```bash
# Si alguien pushió a main entre tu último pull y ahora:
git pull origin main

# Resuelve conflictos en VS Code
# Luego:
git add .
git commit -m "chore: merge main into agustina/features"
git push
```

### "¿Puedo cambiar de rama sin guardar cambios?"
```bash
# Guarda los cambios sin commitear:
git stash

# Cambiar de rama
git checkout main

# Recuperar los cambios después:
git stash pop
```

---

## 🔗 Enlaces Útiles

- **Repo:** https://github.com/Humand-CX/pecom-evaluaciones
- **Notion (Plan):** https://www.notion.so/34c6757f31308175aa90e821bddcfe86
- **Notion (Features DB):** https://www.notion.so/31fe55be8d444844a55f7227e9a4b35a
- **Localhost:** http://localhost:5173

---

## 📞 Contacto

Si tienes dudas o preguntas:
- **Federica:** federica.correa@humand.co
- **Slack:** (si existe canal del proyecto)

---

## 🎉 ¡Listo!

Ahora estás listo para empezar:

1. ✅ Preparaste ambiente (`npm install`, `npm run dev`)
2. ✅ Revisaste documentación
3. ✅ Elegiste feature a implementar
4. ✅ Entiendes workflow de git

**Próximo paso:** Abre el código y empieza con Option C o A.

¡Mucho éxito! 🚀

---

## 📊 Resumen Rápido de Features Implementadas

Para que sepas qué está listo y no duplices trabajo:

| Feature | Estado | Quién |
|---------|--------|-------|
| Ciclos con dimensiones | ✅ Listo | Federica |
| Asignación manual de evaluadores | ✅ Listo | Federica |
| Importación CSV | ✅ Listo | Federica |
| Filtrado de dimensiones en matriz | ✅ Listo | Federica |
| Filtrado de dimensiones en resultados | ✅ Listo | Federica |
| Duplicación de dimensiones | ✅ Listo | Federica |
| Vista de detalles de ciclos | ✅ Listo | Federica |
| **Filtrar personas por evaluador** | ⏳ En roadmap | Agustina (?) |
| **Editar/Eliminar asignaciones** | ⏳ En roadmap | Agustina (?) |
| **Validar evaluator_id en CSV** | ⏳ En roadmap | Agustina (?) |
| **Exportar asignaciones a CSV** | ⏳ En roadmap | Agustina (?) |
| **Notificaciones de asignaciones** | ⏳ En roadmap | Agustina (?) |
| Migrar a Supabase | ⏳ Después | Ambas |

---

**Creado:** 2026-05-07 por Federica  
**Para:** Agustina
