# Presta MVP Web

MVP operativo de Presta para clientes, prestamos, abonos, caja, rutas,
usuarios, auditoria, balances y configuracion de empresa.

## Getting Started

Configura `.env` desde `.env.example` con una URL Postgres y luego prepara la base:

```bash
npm run db:generate
npm run db:deploy
npm run db:seed
```

Levanta el servidor:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Vercel

Set Root Directory to `src`. The included `vercel.json` runs:

```bash
npm run vercel-build
```

Required variables:

- `DATABASE_URL`
- `PRESTA_SEED_EMAIL`
- `PRESTA_SEED_PASSWORD`
- `PRESTA_SEED_COMPANY`
- `PRESTA_SEED_DEMO_DATA`
- `PRESTA_SESSION_SECRET`

More detail: `../docs/deploy_vercel_postgres.md`.

Before deploying, use `../docs/pre_deploy_local_checklist.md`.

## Checks

```bash
npm test
npm run test:e2e
npm run lint
npm run build
```
