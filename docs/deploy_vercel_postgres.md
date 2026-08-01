# Deploy MVP Presta en Vercel

## Proyecto

El proyecto Next.js vive en:

```powershell
C:\Proyectos\Presta\src
```

En Vercel, configurar **Root Directory** como `src`.

## Variables

Configurar en Vercel:

- `DATABASE_URL`: URL Postgres con SSL.
- `PRESTA_SEED_EMAIL`: correo del admin inicial.
- `PRESTA_SEED_PASSWORD`: password inicial del admin.
- `PRESTA_SEED_COMPANY`: nombre de la empresa inicial.
- `PRESTA_SEED_DEMO_DATA`: `false` para produccion/piloto limpio, `true` para demo con datos.
- `PRESTA_SESSION_SECRET`: secreto largo para firmar sesiones.

## Base de datos

El schema principal usa Postgres y migraciones versionadas. El build de Vercel ejecuta:

```bash
npm run vercel-build
```

Ese comando hace:

```bash
prisma generate
prisma migrate deploy
prisma db seed
next build
```

Para preparar manualmente una base nueva desde local:

```powershell
cd C:\Proyectos\Presta\src
npm.cmd run db:generate
npm.cmd run db:deploy
npm.cmd run db:seed
```

## Desarrollo local

Desde este punto, el entorno local tambien necesita una URL Postgres en `.env`.
SQLite quedo como referencia historica del prototipo, no como datasource principal.

## Build

```powershell
cd C:\Proyectos\Presta\src
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

## Login temporal

El MVP usa usuarios de la tabla `User`. Mientras se implementa hashing real:

- Email inicial: valor de `PRESTA_SEED_EMAIL`
- Password inicial: valor de `PRESTA_SEED_PASSWORD`

## Pendiente para produccion estricta

- Revisar roles por accion en Server Actions.
- Separar seed inicial del build cuando ya exista administracion formal de usuarios.
- Agregar rotacion de password y recuperacion de cuenta.
