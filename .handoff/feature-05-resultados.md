# Handoff: Resultados

**Module**: Admin
**Screen**: Resultados
**Order**: 5 of 5
**Notion**: https://www.notion.so/34c6757f313081a2af22eb8bf77e232b

## State

All 5 screens are complete. This is the last feature.

## Screens built

1. Login (`/login`) — Auth con employeeInternalId + password, branding Pecom
2. Ciclos activos (`/evaluador/ciclos`) — Cards de ciclos con estado (activo/cerrado/borrador)
3. Matriz de evaluación (`/evaluador/matriz/:cycleId`) — Grilla por dimensión+persona, puntajes 1-5, confirmación al enviar
4. Gestión de ciclos (`/admin/ciclos`) — CRUD de ciclos via drawer+menu, tabla con pills de estado
5. Banco de dimensiones (`/admin/dimensiones`) — CRUD de dimensiones y sub-dimensiones, persistido en localStorage
6. Resultados (`/admin/resultados`) — Tabla matrix con headers rotados, filtro por ciclo, alertas Nocivo, exportar CSV

## Non-obvious decisions

- `table-layout: fixed` + `<colgroup>`: 140px nombre + 52px×8 sub-dims = 556px total. Sin esto los colSpan de los headers de dimensión expanden las columnas.
- Headers de sub-dimensiones rotados (`writing-mode: vertical-rl` + `rotate(180deg)`), `height: 160` con `overflow: hidden` — ~16 chars visibles.
- Score coloring es solo texto (sin fondo): error.main para 1, warning.dark para 2-3, success.dark para 4-5.
- CSV export via `Blob + URL.createObjectURL`.
- `DimensionsProvider` usa localStorage (`pecom-dimensions`). `Resultados` lee de `DIMENSIONS` hardcodeado en MatrizEvaluacion/constants — no del context. Para conectar ambos, cambiar la importación en Resultados/index.tsx.
- En DEV, `ProtectedRoute` bypasa auth automáticamente (`import.meta.env.DEV`).

## Next steps (not started)

- Supabase integration (reemplazar mocks)
- Vercel deployment
- Conexión con API Humand
