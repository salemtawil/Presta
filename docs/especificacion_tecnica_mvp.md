# Especificacion tecnica - MVP web Presta

Fecha: 31 de julio de 2026  
Estado: borrador inicial  
Base documental: `docs/prestabit_plan_maestro_mvp_web.md`

## 1. Objetivo

Construir una aplicacion web operativa para gestionar prestamos, rutas, clientes, abonos, caja, gastos y reportes basicos desde escritorio.

El MVP debe priorizar el flujo financiero principal:

1. Crear ruta.
2. Crear cliente.
3. Crear prestamo.
4. Generar cuotas.
5. Registrar abono.
6. Consultar historial.
7. Ver resumen diario.

## 2. Stack propuesto

### Frontend

- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- Componentes UI propios inspirados en shadcn/ui.
- Lucide React para iconos.

### Backend

Para el primer MVP local:

- Next.js Route Handlers o Server Actions.
- Base de datos SQLite para desarrollo rapido.
- Prisma como ORM.

Para produccion:

- PostgreSQL.
- Prisma.
- Auth con sesiones httpOnly.

### Testing

- Vitest para motor financiero.
- Playwright para flujos criticos.

## 3. Principios de arquitectura

- La app no sera una landing; el primer viewport debe ser el dashboard operativo.
- El motor financiero debe ser testeable fuera de la UI.
- Los abonos deben registrarse como movimientos auditables.
- Evitar borrados destructivos en entidades financieras.
- La UI debe ser densa, clara y orientada a operacion diaria.
- Los permisos deben existir desde el modelo aunque el MVP empiece con un solo admin.

## 4. Modulos fase 1

### Auth

Alcance inicial:

- Login local/demo.
- Usuario admin sembrado.
- Logout.

Se pospone:

- Registro publico.
- Recuperacion de contrasena.
- OAuth.

### Dashboard

Debe mostrar:

- Ruta activa.
- Fecha.
- Cobrado hoy.
- Prestado hoy.
- Gastos hoy.
- Ganancia estimada.
- Clientes por cobrar.
- Movimientos recientes.

### Rutas

Funciones:

- Listar rutas.
- Crear ruta.
- Editar ruta.
- Activar/desactivar ruta.
- Seleccionar ruta activa.

### Clientes

Funciones:

- Listar clientes en tabla.
- Buscar por nombre, cedula, telefono o direccion.
- Filtrar por ruta y estado.
- Crear cliente.
- Editar cliente.
- Ver detalle.
- Notas basicas.

Campos:

- Tipo de documento.
- Documento.
- Nombre completo.
- Telefono.
- WhatsApp.
- Direccion casa.
- Direccion trabajo.
- Ruta.
- Grupo.
- Cupo.
- Calificacion.

### Prestamos

Funciones:

- Crear prestamo desde cliente.
- Calcular tabla de cuotas.
- Ver detalle de prestamo.
- Estado: activo, completado, vencido.
- Ver cuotas.

Campos:

- Cliente.
- Ruta.
- Capital.
- Porcentaje interes.
- Modalidad.
- Esquema de pago.
- Numero de cuotas.
- Valor cuota.
- Fecha inicio.
- No cobrar sabado.
- No cobrar domingo.
- Mora configurable.
- Cargos opcionales.

### Abonos

Funciones:

- Registrar abono.
- Tipo de abono: automatico, mixto, mora, cargos, descuento.
- Medio de pago: efectivo, transferencia, tarjeta, oficina.
- Distribucion capital/interes/mora/cargos/descuento.
- Historial del prestamo.
- Recibo simple.

### Gastos

Funciones:

- Crear gasto.
- Editar gasto.
- Anular/eliminar con auditoria.
- Filtrar por fecha/ruta.
- Ver total.

### Caja

Funciones:

- Ver saldo por ruta.
- Registrar ingreso.
- Registrar egreso.
- Ver movimientos.
- Relacionar abonos/gastos como fuentes.

### Resumen

Funciones:

- Filtro por ruta.
- Filtro por fecha/rango.
- Cobrado.
- Prestado.
- Gastos.
- Ganancia.
- Distribucion por medio de pago.
- Historial de movimientos.

### Balances

Funciones:

- Resumen cartera activa.
- Pendiente de cobro.
- Capital en calle.
- Interes estimado.
- Mora/cargos basicos.
- Desembolsos y recaudacion por rango.

### Usuarios y permisos

Fase 1 minima:

- Usuario admin.
- Modelo de permisos preparado.

Fase 1 ampliada si hay tiempo:

- Crear cobrador.
- Asignar rutas.
- Permisos basicos.

## 5. Modelo de datos inicial

### Company

- id
- name
- phone
- address
- currencySymbol
- receiptFooter
- plan
- licenseExpiresAt
- createdAt
- updatedAt

### User

- id
- companyId
- name
- email
- passwordHash
- role
- status
- createdAt
- updatedAt

### Route

- id
- companyId
- name
- description
- active
- createdAt
- updatedAt

### Client

- id
- companyId
- routeId
- documentType
- documentNumber
- fullName
- phone
- whatsapp
- homeAddress
- workAddress
- groupName
- creditLimit
- rating
- status
- notes
- createdAt
- updatedAt

### Loan

- id
- companyId
- routeId
- clientId
- code
- alias
- principal
- interestRate
- interestAmount
- totalAmount
- installmentAmount
- installmentCount
- modality
- paymentScheme
- startDate
- endDate
- status
- noChargeSaturday
- noChargeSunday
- createdById
- createdAt
- updatedAt

### Installment

- id
- loanId
- number
- dueDate
- principalAmount
- interestAmount
- moraAmount
- chargeAmount
- totalAmount
- paidAmount
- balance
- status
- createdAt
- updatedAt

### Payment

- id
- companyId
- routeId
- clientId
- loanId
- amount
- principalPaid
- interestPaid
- moraPaid
- chargesPaid
- discountAmount
- paymentType
- paymentMethod
- note
- createdById
- voidedAt
- voidReason
- createdAt

### Expense

- id
- companyId
- routeId
- concept
- category
- amount
- date
- createdById
- voidedAt
- createdAt
- updatedAt

### CashMovement

- id
- companyId
- routeId
- type
- amount
- concept
- sourceType
- sourceId
- createdById
- createdAt

### AuditLog

- id
- companyId
- userId
- action
- entityType
- entityId
- beforeJson
- afterJson
- createdAt

## 6. Motor financiero

Debe vivir en una libreria separada:

- `calculateLoanSchedule`
- `applyPayment`
- `calculateLoanStatus`
- `calculateDailySummary`
- `calculatePortfolioBalance`

Casos de prueba obligatorios:

- Prestamo de una cuota.
- Prestamo diario.
- Prestamo semanal.
- Pago completo.
- Pago parcial.
- Pago con mora.
- Pago con cargos.
- Descuento.
- No cobrar sabado/domingo.

Caso observado en PrestaBIT:

- Capital: `100000`.
- Interes: `0`.
- Resultado observado: total `100001`, ganancia `1`.

Decision pendiente:

- Replicar ese ajuste minimo o normalizar a `100000`.

## 7. Rutas de UI

- `/login`
- `/`
- `/clientes`
- `/clientes/nuevo`
- `/clientes/[id]`
- `/clientes/[id]/editar`
- `/clientes/[id]/prestamos/nuevo`
- `/prestamos`
- `/prestamos/[id]`
- `/prestamos/[id]/abonos/nuevo`
- `/gastos`
- `/caja`
- `/resumen`
- `/balances`
- `/rutas`
- `/usuarios`
- `/empresa`
- `/factura`

## 8. API interna

Inicialmente puede implementarse con Server Actions o Route Handlers.

Endpoints sugeridos si se usa REST:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/dashboard`
- `GET /api/routes`
- `POST /api/routes`
- `PATCH /api/routes/:id`
- `GET /api/clients`
- `POST /api/clients`
- `GET /api/clients/:id`
- `PATCH /api/clients/:id`
- `GET /api/loans`
- `POST /api/loans`
- `GET /api/loans/:id`
- `POST /api/loans/:id/payments`
- `GET /api/expenses`
- `POST /api/expenses`
- `PATCH /api/expenses/:id`
- `GET /api/cash`
- `POST /api/cash/movements`
- `GET /api/reports/summary`
- `GET /api/reports/balances`

## 9. Sprints sugeridos

### Sprint 1 - Base

- Scaffold app.
- Tailwind/UI base.
- Prisma/DB.
- Seed admin/demo.
- Layout dashboard.
- Rutas.

### Sprint 2 - Clientes

- Listado.
- Crear/editar cliente.
- Detalle cliente.
- Busqueda/filtros.

### Sprint 3 - Prestamos

- Motor financiero inicial.
- Crear prestamo.
- Tabla de cuotas.
- Detalle prestamo.
- Tests del motor.

### Sprint 4 - Abonos

- Registrar abono.
- Aplicar distribucion.
- Historial.
- Actualizar estados.
- Recibo simple.

### Sprint 5 - Operacion

- Gastos.
- Caja.
- Resumen.
- Balances basicos.

### Sprint 6 - Usuarios y pulido

- Permisos basicos.
- Empresa.
- Auditoria.
- QA con Playwright.

## 10. Criterios de aceptacion del MVP

El MVP se considera funcional si:

- Un admin puede crear una ruta.
- Puede crear un cliente.
- Puede crear un prestamo.
- El sistema genera cuotas.
- Puede registrar un abono.
- El saldo del prestamo cambia correctamente.
- El historial muestra desembolso y abonos.
- El dashboard refleja cobros/prestamos/gastos.
- Los balances basicos cuadran con los movimientos.
- Se puede generar un recibo simple.

## 11. Pendientes antes de programar fuerte

- Confirmar stack definitivo.
- Confirmar si usaremos backend nuevo o API existente.
- Decidir regla de redondeo.
- Definir moneda inicial.
- Definir si el login sera real desde el primer sprint.
- Definir si se necesita multiempresa o una empresa demo inicial.

