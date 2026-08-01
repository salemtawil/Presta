# Checklist local antes de deploy

## Seguridad funcional

- Login con usuario activo.
- Cambio de password desde `/cuenta`.
- Empresa editable solo por `ADMIN`.
- Creacion de usuarios solo por `ADMIN`.
- Usuarios visibles para `ADMIN` y `MANAGER`.
- Anulaciones y cierres solo para `ADMIN` y `MANAGER`.
- Consultas y exportaciones filtradas por `companyId` del usuario autenticado.

## Flujos operativos

- Crear ruta.
- Crear usuario y asignarlo a ruta.
- Crear cliente.
- Crear prestamo.
- Registrar abono.
- Anular abono con motivo y confirmacion.
- Crear gasto.
- Anular gasto con motivo y confirmacion.
- Cerrar prestamo solo sin saldo.
- Anular prestamo solo sin abonos activos.
- Exportar balance CSV.

## Pantallas a revisar en movil

- Inicio.
- Clientes y detalle.
- Prestamos, detalle y contrato.
- Abonos y recibo.
- Caja.
- Gastos.
- Resumen.
- Balances.
- Rutas y detalle.
- Usuarios.
- Auditoria.
- Empresa.
- Cuenta.

## Validacion tecnica local

```powershell
cd C:\Proyectos\Presta\src
npm.cmd test
npm.cmd run test:e2e
npm.cmd run lint
npm.cmd run build
npm.cmd audit --omit=dev
```

`npm.cmd run test:e2e` ejecuta smoke tests de login/proteccion en desktop y movil.
El flujo completo queda preparado con:

```powershell
cd C:\Proyectos\Presta\src
$env:E2E_RUN_FULL="true"
$env:E2E_EMAIL="admin@presta.local"
$env:E2E_PASSWORD="password-real"
npm.cmd run test:e2e
```

Ese flujo completo requiere una base Postgres alcanzable y sembrada.

## Pendiente antes de piloto real

- Probar con una base Postgres real.
- Cargar datos iniciales reales o importarlos desde CSV.
- Definir usuarios iniciales y roles.
- Revisar textos legales del contrato.
- Revisar formato final de recibos impresos.
- Ejecutar `test:e2e:full` cuando exista Postgres local/remoto.
