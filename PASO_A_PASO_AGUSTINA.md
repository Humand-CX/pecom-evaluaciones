# 🚀 PASO A PASO PARA AGUSTINA

**Hola Agustina, sigue estos pasos exactamente en orden.**

---

## ⚠️ IMPORTANTE PRIMERO

**El localhost (http://localhost:5173) es SOLO en tu computadora.**

Cada una accede desde su máquina:
- 🖥️ Federica: http://localhost:5173 en su computadora
- 🖥️ Agustina: http://localhost:5173 en su computadora

**No necesitás ver el proyecto de la otra. Cada una trabaja en su rama.**

---

## PASO 1️⃣: Clonar el Repositorio

Abre terminal y escribe:

```bash
git clone https://github.com/Humand-CX/pecom-evaluaciones
```

Espera a que termine (va a descargar todo el código).

---

## PASO 2️⃣: Entrar a la Carpeta

```bash
cd pecom-evaluaciones
```

---

## PASO 3️⃣: Crear tu Rama Personal

```bash
git checkout -b agustina/features
```

**Importante:** Esto crea una rama nueva solo para vos. Ahora estás en `agustina/features` (no en `main`).

Verificá con:
```bash
git branch
```

Debería mostrar:
```
* agustina/features
  main
```

---

## PASO 4️⃣: Instalar Dependencias

```bash
npm install
```

Espera a que termine (va a descargar librerías, puede tardar 2-3 minutos).

---

## PASO 5️⃣: Correr el Proyecto Localmente

```bash
npm run dev
```

Debería decir algo como:
```
  VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

**Importante:** Dejá esta terminal abierta. **NO cierres** este proceso mientras estés desarrollando.

---

## PASO 6️⃣: Abrir el Proyecto

Abre tu navegador (Chrome, Firefox, etc) y ve a:

```
http://localhost:5173
```

**Debería abrir la app con el login.**

Datos para entrar:
- Usuario: `evaluador` (o `admin`)
- Contraseña: `password`

---

## PASO 7️⃣: Leer la Documentación

Antes de tocar código, **lee ESTO en tu computadora:**

```
cd pecom-evaluaciones
```

Abre estos archivos CON tu editor de texto (VS Code):

**En orden:**
1. `STATUS.md` - 10 minutos (resumen rápido)
2. `DIAGRAMA_FLUJOS.txt` - 15 minutos (diagramas)
3. `INSTRUCCIONES_AGUSTINA.md` - 30 minutos (detalle completo)

---

## PASO 8️⃣: Elegir qué Implementar

En `INSTRUCCIONES_AGUSTINA.md` hay **5 opciones de features** a implementar.

Elige UNA para empezar:

### ✅ **RECOMENDADO:** Validar evaluator_id en CSV (⭐ FÁCIL - 1-2 horas)
- Archivo a modificar: `src/pages/Admin/GestionCiclos/CSVImportModal.tsx`
- Qué hace: Verifica que el evaluador existe antes de importar CSV
- Todo está explicado en INSTRUCCIONES_AGUSTINA.md → "Option C"

### Otras opciones:
- A: Filtrar personas por evaluador (fácil, 2-3h)
- B: Editar/Eliminar asignaciones (media, 4-5h)
- D: Exportar asignaciones CSV (media, 3-4h)
- E: Notificaciones (difícil, 5-6h)

---

## PASO 9️⃣: Modificar el Código

### 9a. Abrir el archivo en VS Code

```bash
code .
```

Esto abre VS Code en la carpeta actual.

### 9b. Navegar al archivo a modificar

Ej: si elegiste Option C, ve a:
```
src/pages/Admin/GestionCiclos/CSVImportModal.tsx
```

### 9c. Hacer los cambios

Lee el código actual.
Entiende qué hace.
Haz los cambios necesarios (todo está documentado en INSTRUCCIONES_AGUSTINA.md).

### 9d. Testear en el navegador

- Vuelve a http://localhost:5173
- Probá tu feature
- Si hay errores, VS Code te los mostrará en la terminal

---

## PASO 🔟: Guardar los Cambios con Git

Cuando termines, abre una **NUEVA terminal** (NO cierres la que corre `npm run dev`):

### Crear carpeta nueva (opcional):
```bash
cd pecom-evaluaciones
```

### Ver qué archivos cambiaste:
```bash
git status
```

Debería mostrar:
```
On branch agustina/features
Changes not staged for commit:
  modified:   src/pages/Admin/GestionCiclos/CSVImportModal.tsx
```

### Guardar los cambios:
```bash
git add src/pages/Admin/GestionCiclos/CSVImportModal.tsx
```

### Hacer commit (guardar con mensaje):
```bash
git commit -m "feat: Validar evaluator_id en CSV import

- Verifica que evaluator_id existe en MOCK_EVALUATORS
- Reporta error específico si no encontrado

Co-Authored-By: Agustina <agustina@humand.co>"
```

**Importante:** Reemplazá el texto con lo que VOS hiciste.

---

## PASO 1️⃣1️⃣: Subir tu Rama a GitHub

```bash
git push -u origin agustina/features
```

Esto sube tu rama a GitHub.

---

## PASO 1️⃣2️⃣: Crear un Pull Request

Ve a GitHub:
```
https://github.com/Humand-CX/pecom-evaluaciones
```

Debería mostrarte un botón amarillo que dice:
```
Compare & pull request
```

Click en ese botón.

Completa:
- **Título:** Describe tu cambio en 1 línea
- **Descripción:** Qué hiciste, cómo lo testeaste

Click en "Create pull request".

---

## PASO 1️⃣3️⃣: Esperar Revisión

Federica va a:
1. Revisar tu código
2. Dejarte comentarios (si algo no está bien)
3. Mergear a `main` cuando esté OK

**Vos:** Solo espera notificaciones de GitHub.

---

## ✅ ¡LISTO!

Ya estás trabajando en paralelo.

---

## 🔄 PRÓXIMO FEATURE

Cuando termines:

1. Federica mergea tu PR
2. Vos haces:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b agustina/features
   ```
3. Elegís otro feature
4. Repetís desde PASO 9️⃣

---

## ❓ PREGUNTAS FRECUENTES

### "¿Qué es http://localhost:5173?"
Es TU proyecto corriendo EN TU COMPUTADORA.
- Federica ve su propio http://localhost:5173
- Vos ves el tuyo
- No tienen nada que ver

### "¿Puedo ver el proyecto de Federica?"
No, a menos que:
- Estén en la misma red WiFi
- Usen herramientas especiales (no necesarias)
- Cada una muestra su pantalla por Slack/Meet

**PARA ESTE PROYECTO:** Cada una trabaja en su compu.

### "¿Qué pasa si Federica y yo modificamos el mismo archivo?"
Git avisa. Se llama "conflicto".
- Resuelven entre ustedes
- No es dramático
- Está documentado en INSTRUCCIONES_AGUSTINA.md

### "¿Puedo tocar otros archivos?"
SÍ, pero:
- Foco en TU feature
- No toques lo que está funcionando
- Si rompés algo, `git reset` lo arregla

### "¿De dónde saco el usuario y contraseña?"
Para el login de http://localhost:5173:
- Usuario: `evaluador` o `admin`
- Contraseña: `password`

Es mock data, no importa.

### "¿Dónde están las dimensiones, personas, evaluadores?"
Archivo: `src/pages/Evaluador/MatrizEvaluacion/constants.ts`

Tienen datos mock (falsos) para testing.

### "Tengo un error, ¿qué hago?"
1. Lee el error en la terminal o consola
2. Busca en INSTRUCCIONES_AGUSTINA.md
3. Si no lo encuentras, preguntá a Federica
4. Envía screenshot del error

---

## 📞 FEDERICA

Si tenés dudas:
- **Email:** federica.correa@humand.co
- **Slack:** (si existe canal)

---

## 🎉 ¡ÉXITO!

Seguí estos pasos y funcioná 100%.

No es complicado. Es solo terminal + editor + GitHub.

**¡A programar!** 🚀

---

**Versión:** 1.0  
**Creado:** 2026-05-07  
**Para:** Agustina
