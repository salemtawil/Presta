# Presta

Proyecto para planificar y construir un MVP web inspirado en PrestaBIT, a partir de la inspeccion de la app movil, APK/APKS y web admin existente.

## Estructura

- `docs/`: documento maestro y especificaciones del producto.
- `research/`: inspecciones tecnicas de APK, app movil y web existente.
- `assets/`: recursos visuales o material de referencia.
- `src/`: aplicacion web Next.js del MVP.

## Documentos principales

- `docs/prestabit_plan_maestro_mvp_web.md`: documento maestro con hallazgos, reglas, modelo, roadmap y backlog.
- `docs/especificacion_tecnica_mvp.md`: especificacion tecnica inicial para construir el MVP.
- `research/prestabit_inspeccion_app_apk.md`: inspeccion de APK y app movil.
- `research/prestabit_web_inspeccion.md`: inspeccion de `prestabit.vercel.app`.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Vitest para motor financiero
- Playwright para smoke tests y flujos criticos

## Desarrollo local

Desde `src/`, configurar `.env` con una URL Postgres:

```powershell
cd C:\Proyectos\Presta\src
npm.cmd ci
npm.cmd run db:generate
npm.cmd run db:deploy
npm.cmd run db:seed
npm.cmd run dev
```

## Validacion

Desde `src/`:

```powershell
npm.cmd test
npm.cmd run test:e2e
npm.cmd run lint
npm.cmd run build
npm.cmd audit --omit=dev
```

## Deploy

En Vercel, el **Root Directory** debe ser `src`.

Detalles completos: `docs/deploy_vercel_postgres.md`.
