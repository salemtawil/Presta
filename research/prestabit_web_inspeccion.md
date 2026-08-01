# PrestaBIT Web - inspeccion de `prestabit.vercel.app`

Fecha: 31 de julio de 2026  
URL inspeccionada: `https://prestabit.vercel.app/`  
Tecnologia observada: Flutter Web + Firebase + API propia + PDF.js

## 1. Hallazgo principal

La web admin de PrestaBIT existe y no es solo una landing. Es una aplicacion Flutter Web con login, sidebar administrativo y varios modulos ya funcionales. Usa el mismo ecosistema que la app movil: Firebase, API `https://api.andresperezmelo.com.co/`, rutas/clientes/prestamos/gastos/caja/balances/factura y soporte WhatsApp.

Lo mas importante: la web sincronizo con los datos creados desde la app movil. El cliente `CLIENTE DEMO`, la ruta `RUTA DEMO`, el prestamo de prueba y el abono completo aparecieron en web. Esto confirma que la web puede servir como referencia directa para el MVP y para entender el contrato real de datos.

## 2. Login y dashboard

Pantalla publica:

- Login con email.
- Password.
- Recuperar contrasena.
- Registro.

Tras login:

- Sidebar fijo.
- Usuario `PRUEBA CODEX`.
- Plan `ORO`.
- Dias restantes.
- Detalles de cuenta: email, vencimiento, pais, telefono.
- Fecha actual.

## 3. Modulos visibles

### Inicio

Dashboard simple de cuenta/licencia:

- Saludo.
- Nombre de usuario.
- Dias restantes.
- Detalles de cuenta.

### Clientes

Modulo funcional tipo tabla desktop.

Incluye:

- Buscador por nombre o direccion.
- Filtros por ruta.
- Filtros por grupo.
- Filtros por estado.
- Boton `Nuevo Cliente`.
- Tabla con columnas: cliente, estado, direccion/grupo, saldo, acciones.
- Acciones por fila: crear prestamo, editar, accion financiera, mover/gestionar, eliminar.

El cliente de prueba aparece con:

- Nombre: `CLIENTE DEMO`.
- Estado: sin prestamos.
- Direccion: Direccion Demo.
- Saldo: `$0.00`.

### Nuevo cliente

Formulario modal muy completo:

- Identificacion.
- Nombre completo.
- Telefono.
- WhatsApp.
- Direccion casa.
- Fecha nacimiento.
- Direccion trabajo.
- Ruta asignada.
- Sexo.
- Crear registro.
- Gestion de fotografias.
- Galeria del cliente.
- Limite visible: 0/5 fotos.
- Explorar galeria global del sistema.

### Resumen

Modulo funcional y muy util para MVP.

Incluye:

- Filtro por rutas.
- Filtro por rango de fecha.
- Filtro de tipo/estado.
- Resumen de operaciones.
- Balance general.
- Cobrado.
- Prestado.
- Gastos.
- Ganancia total.
- Meta diaria.
- Detalle de recaudo: capital, interes, mora.
- Distribucion caja: efectivo, transferencia, tarjeta.
- Historial de movimientos.

Dato importante: reflejo el flujo hecho en movil:

- Cobrado: `$100,001.00`.
- Prestado: `$100,000.00`.
- Ganancia total: `$1.00`.
- Distribucion: efectivo `$100,001.00`.
- Historial: 2 registros, prestamo y abono.

### Solicitudes prestamos

Modulo de revision/listado.

Incluye:

- Filtro por estado.
- Filtro por ruta.
- Boton refrescar.
- Estado vacio: no hay solicitudes bajo este filtro.

No se vio boton de crear solicitud desde web.

### Gastos

Modulo funcional y mas completo que en movil.

Incluye:

- Formulario fijo de gasto.
- Concepto.
- Monto.
- Fecha.
- Limpiar.
- Guardar gasto.
- Filtro por rango de fechas.
- Total gastos.
- Historial de gastos.
- Tabla con concepto, fecha, monto, acciones.
- Editar y eliminar gasto.

Observacion: la cuenta de prueba ya tenia gastos previos visibles, por total `$764,845.00`. No fueron creados durante esta inspeccion.

### Prestamos

Modulo funcional de cartera.

Incluye:

- Gestion de prestamos.
- Filtros: ruta, modalidad, estado.
- Tabla con cliente, capital, inicio, modalidad, estado, saldo pendiente, acciones.
- Total prestamos.
- Total cartera.

El prestamo de prueba aparece:

- Cliente: `CLIENTE DEMO`.
- Ruta: `RUTA DEMO`.
- Capital: `$100,000.00`.
- Interes: `0%`.
- Inicio: `31/07/2026`.
- Finaliza: `01/08/2026`.
- Modalidad: diario.
- Estado: finalizado.
- Saldo pendiente: `$0.00`.

### Nuevo prestamo

Formulario modal de escritorio.

Incluye:

- Buscar por documento.
- Validar cliente.
- Datos del cliente.
- Capital a desembolsar.
- Amortizacion.
- Modalidad de pago.
- Esquema de pago.
- Porcentaje de interes.
- Fecha de inicio.
- Total de cuotas.
- Valor de cuota.
- No cobrar sabados.
- No cobrar domingos.
- Mora.
- Cargos.
- Fiador.
- Tabla.
- Finalizar registro.

Este formulario es una referencia fuerte para el MVP web porque organiza el flujo de prestamo mejor que el movil.

### Detalle cliente / accion financiera

Al abrir accion financiera de un cliente finalizado, aparece una vista tipo detalle con:

- Nombre del cliente.
- Documento.
- Direccion.
- Telefono.
- Notas.
- Botones de recordatorio/perfil.

Pero no se renderizo un detalle financiero completo cuando el prestamo ya estaba finalizado. Posible limitacion: la vista esta pensada para prestamos activos.

### Caja

Modulo funcional.

Incluye:

- Selector de ruta.
- Titulo `Caja`.
- Historial 30 dias.
- Resetear caja.
- Exportar PDF.
- Saldo disponible.
- Ingresos.
- Egresos.
- Nuevo movimiento.
- Tipo ingreso/egreso.
- Monto.
- Concepto.
- Registrar.
- Lista de movimientos.

Observacion: al entrar inicialmente mostro `Caja: null` y `ID Ruta: N/A` hasta seleccionar una ruta. Es un pequeno problema de estado inicial.

### Balances

Modulo tipo panel de control.

Incluye:

- Filtro por todas/ruta.
- Rango desde/hasta.
- Resumen de cartera.
- Pendiente cobro.
- En recuperacion.
- Capital, interes, mora, cargos.
- Mas estadisticas: balance, mora, ROI, reportes PDF.
- Resumen financiero.
- Desembolsos.
- Recaudacion.
- Abonos recibidos.
- Actualizar.

Observacion importante: para el mismo flujo de prueba, `Resumen` mostro cobro/prestamo, pero `Balances` mostro valores en cero. Puede ser por filtro, calculo de cartera finalizada o inconsistencia. Hay que validarlo antes de copiar la logica.

### Ajustes Empresa

Modulo funcional.

Incluye:

- Configuracion de empresa.
- Identidad corporativa.
- Nombre de empresa.
- Telefono comercial.
- Direccion fisica.
- Localizacion y recibos.
- Simbolo de moneda.
- Eslogan/lema.
- Pie de recibo.
- Guardar cambios.

### Gestionar Contratos

Estado: `Funcion en desarrollo`.

La app movil si genera contrato/PDF, pero web todavia no tiene gestion de contratos terminada.

### Gestion Rutas

Modulo funcional.

Incluye:

- Lista de rutas.
- Crear nueva ruta.
- Editar ruta.
- Eliminar ruta.

Nueva ruta:

- Nombre de la ruta.
- Descripcion.
- Agregar ruta.

### Gestion Cobradores / Usuarios

Modulo funcional.

Incluye:

- Gestion de usuarios.
- Buscador por nombre/email.
- Nuevo usuario.

Nuevo usuario:

- Nombre completo.
- Nombre de usuario con dominio `@prestabit.com`.
- Contrasena.
- Estado de cuenta activo/inactivo.
- Permisos del sistema.
- Botones seleccionar todos/ninguno.
- Rutas permitidas.
- Crear usuario.

Permisos visibles:

- Hacer pagos.
- Agregar clientes.
- Agregar prestamos.
- Agregar gastos.
- Agregar cargos.
- Editar clientes.
- Editar prestamos.
- Eliminar prestamos.
- Eliminar gastos.
- Eliminar abonos.
- Eliminar fotos.
- Reimprimir.
- Trabajar sin conexion.
- Ver resumen dia.
- Ver balances.
- Ver ganancias.

Esto define muy bien la matriz RBAC para el MVP.

### WhatsApp Bot

Modulo presente, pero requiere vinculacion.

Incluye:

- Configuracion de WhatsApp.
- Servicio desconectado.
- Boton `Vincular con QR`.
- Configuracion bloqueada hasta vincular cuenta WhatsApp.

No se genero QR ni se vinculo WhatsApp durante la inspeccion.

### Reportados

Estado: `Funcion en desarrollo`.

La app movil tiene flujo de reporte, pero web no lo tiene listo.

### Factura

Modulo funcional.

Incluye:

- Email de facturacion.
- Saldo a favor.
- Total a pagar.
- Vencimiento.
- Consumo del periodo.
- Clientes.
- Prestamos.
- WhatsApp.
- Cloud MB.
- Ejecuciones bot.
- Mensajes.
- Resumen de pago.
- Descargar PDF.
- Pagar ahora.
- Contactar soporte.

No se presiono pagar.

### Datos Cuenta

Modulo funcional.

Incluye:

- Perfil.
- Nombre.
- Plan ORO.
- Rol administrador.
- Informacion personal.
- Email.
- Telefono.
- Pais/region.
- Estado de suscripcion.
- Fecha de vencimiento.
- Renovacion necesaria.
- Gestionar suscripcion.
- Seguridad y sistema.
- Identificador interno.
- Fecha de registro.

### Configuracion

Estado: `Funcion en desarrollo`.

## 4. Tecnologia y archivos publicos

Archivos inspeccionados:

- `main.dart.js`
- `flutter_bootstrap.js`
- `manifest.json`

Observaciones:

- Flutter Web con renderer CanvasKit.
- PWA manifest basico.
- `display: standalone`.
- `orientation: portrait-primary`, aunque visualmente funciona desktop.
- PDF.js incluido.
- Firebase Auth/Database/Functions.
- Google APIs.
- OneDrive/Microsoft Graph.
- Google Drive appdata.
- PayPal.
- WhatsApp links.
- SQLite/local sync strings presentes en bundle web.

URLs/endpoints relevantes encontrados:

- `https://api.andresperezmelo.com.co/`
- `https://prestabiit-default-rtdb.firebaseio.com`
- `https://prestabiit.web.app/#/`
- `https://groons.web.app/prestabit/precios/precios.html`
- `https://us-central1-prestabiit.cloudfunctions.net/createPaypalPayment?amount=`
- `https://api.whatsapp.com/send?phone=573504706990...`
- `https://graph.microsoft.com/v1.0/me`
- `https://www.googleapis.com/auth/drive.appdata`
- `https://www.google.com/maps/search/?api=1&query=`

Endpoints web detectados en bundle:

- `auth/register`
- `auth/singin`
- `auth/sing_out`
- `auth/validate_token`
- `auth/update_password`
- `auth/get_subaccounts`
- `auth/update_subaccount`
- `auth/delete_subaccount`
- `auth/send_code`
- `prestabit/add_cliente`
- `prestabit/update_cliente/`
- `prestabit/delete_cliente/`
- `prestabit/add_prestamo`
- `prestabit/update_prestamo/`
- `prestabit/delete_prestamo/`
- `prestabit/add_abono/`
- `prestabit/add_cuotas/`
- `prestabit/update_cuotas/`
- `prestabit/prestamos_cliente/`
- `prestabit/cliente/`
- `prestabit/add_gasto`
- `prestabit/update_gasto/`
- `prestabit/delete_gasto/`
- `prestabit/gastos_por_rango`
- `prestabit/add_or_update_caja`
- `prestabit/get_caja/`
- `prestabit/reset_caja`
- `prestabit/rutas`
- `prestabit/add_ruta`
- `prestabit/edit_ruta`
- `prestabit/delete_ruta`
- `prestabit/solicitudes_prestamo`
- `prestabit/update_solicitud_prestamo/`
- `prestabit/delete_solicitud/`
- `prestabit/balances-data`
- `prestabit/balances-data-all`
- `prestabit/web/clientes`
- `prestabit/web/resumen`
- `prestabit/get_empresa`
- `prestabit/update_empresa/`
- `prestabit/pagar_factura`
- `whatsapp/session`
- `whatsapp/remove-session/`

## 5. Comparacion rapida web vs movil

Web ya resuelve mejor:

- Tablas desktop para clientes, gastos y prestamos.
- Resumen operativo con distribucion de caja.
- Gestion de usuarios/permisos.
- Facturacion.
- Rutas.
- Formulario de nuevo prestamo mas claro en escritorio.

Movil esta mas completo en:

- Detalle profundo del cliente/prestamo.
- Contrato prestamo/PDF/firma.
- Historial financiero completo dentro de ficha.
- Reporte de mala paga.
- Notas/recuperacion/congelar.
- Experiencia de campo.
- Recibos, impresion y compartir.

Web incompleto/en desarrollo:

- Gestionar contratos.
- Reportados.
- Configuracion.
- Detalle financiero de prestamo finalizado.

## 6. Implicaciones para el MVP

La web existente es util como referencia visual y funcional. Para el MVP nuevo, conviene tomar de aqui:

- Sidebar desktop.
- Tablas y filtros.
- Formulario de nuevo prestamo.
- Resumen operativo.
- Gestion de usuarios/permisos.
- Facturacion/consumo.

Pero no conviene copiarla sin criterio porque:

- Algunas pantallas estan en desarrollo.
- Hay posibles inconsistencias entre Resumen y Balances.
- Varias funciones sensibles estan presentes pero no completas.
- El DOM Flutter canvas dificulta accesibilidad, testing y SEO.
- La orientacion PWA dice `portrait-primary`, raro para una app admin desktop.

Recomendacion:

Construir el MVP web con React/Next.js o stack web semantico, usando esta web como referencia de producto, no como base tecnica. El resultado seria mas accesible, testeable y mantenible, manteniendo los contratos de negocio ya observados.

