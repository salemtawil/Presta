# Presta

Proyecto para planificar y construir un MVP web inspirado en PrestaBIT, a partir de la inspeccion de la app movil, APK/APKS y web admin existente.

## Estructura

- `docs/`: documento maestro y especificaciones del producto.
- `research/`: inspecciones tecnicas de APK, app movil y web existente.
- `assets/`: recursos visuales o material de referencia.
- `src/`: codigo de la futura aplicacion web.

## Documentos principales

- `docs/prestabit_plan_maestro_mvp_web.md`: documento maestro con hallazgos, reglas, modelo, roadmap y backlog.
- `docs/especificacion_tecnica_mvp.md`: especificacion tecnica inicial para construir el MVP.
- `research/prestabit_inspeccion_app_apk.md`: inspeccion de APK y app movil.
- `research/prestabit_web_inspeccion.md`: inspeccion de `prestabit.vercel.app`.

## Stack propuesto

- Next.js
- React
- TypeScript
- Tailwind CSS
- Prisma
- SQLite en desarrollo
- PostgreSQL en produccion
- Vitest para motor financiero
- Playwright para flujos criticos

## Siguiente paso sugerido

Crear el scaffold de la aplicacion dentro de `src/`:

- app Next.js
- modelo Prisma inicial
- seed demo
- motor financiero testeable
- layout base de dashboard

## Desarrollo local

Desde `src/`:

```powershell
npm.cmd run db:init
npm.cmd run db:generate
npm.cmd run db:seed
npm.cmd run dev
```

Notas:

- La base local usa SQLite en `src/prisma/dev.db`.
- `db:init` crea las tablas con SQLite nativo de Node.
- `db:push` queda disponible, pero en esta maquina el schema engine de Prisma falla sin detalle; por eso el flujo local usa `db:init`.
