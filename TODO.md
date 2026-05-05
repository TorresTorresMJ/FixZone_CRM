# FixZone CRM ToDo

## Fase 1: Definir operacion interna

- [ ] Definir lista inicial de empleados que tendran acceso.
- [ ] Definir roles internos: owner, admin, tecnico, ventas, viewer.
- [x] Registrar sucursales iniciales: Puerto Vallarta y Puebla.
- [x] Registrar empleados iniciales: Kevin Mijangos, Carlos Mijangos, Gigi Vargas, Monica Torres, Diego Mijangos y Daniel Mijangos.
- [ ] Decidir si se usaran correos Gmail existentes o dominio propio mas adelante.
- [x] Definir flujo real de reparacion: Cotizacion, Recibido, En reparacion, Listo, Entregado, Garantia.
- [ ] Definir datos obligatorios de cliente: nombre, telefono, email, direccion, notas.
- [ ] Definir datos obligatorios de equipo: marca, modelo, IMEI/serie, color, accesorios recibidos, estado fisico.

## Fase 2: Base de datos y seguridad

- [x] Crear proyecto en Supabase.
- [x] Registrar proyecto Supabase FixZone: `zwmffnrkrrowmchluyyy`.
- [ ] Configurar Google OAuth en Supabase Auth.
- [ ] Crear tabla `employees` con correo, rol y estado.
- [ ] Crear schema SQL inicial para clientes, equipos, tickets, productos, inventario, compras, finanzas y adjuntos.
- [ ] Activar Row Level Security en todas las tablas.
- [ ] Crear politicas RLS para permitir acceso solo a empleados activos.
- [ ] Crear permisos por rol.
- [ ] Crear tabla `audit_log` para registrar acciones importantes.

## Fase 3: Migrar app actual a Supabase

- [ ] Reemplazar `localStorage` por Supabase.
- [ ] $Agregar pantalla de login con Google.$ Log in será con creación de usuarios y contraseña.  Usuarios internos de base de datos. 
- [ ] Bloquear la app si el correo no existe en `employees`.
- [ ] Conectar clientes a la base de datos.
- [ ] Conectar productos e inventario a la base de datos.
- [ ] Conectar tickets a la base de datos.
- [ ] Conectar compras de insumos a la base de datos.
- [ ] Conectar ingresos y egresos a la base de datos.
- [ ] Agregar estados de carga, errores y confirmaciones.

## Fase 4: Tickets y recibos

- [x] Mejorar folio de ticket con formato fijo.
- [x] Agregar folio visible de seguimiento con formato `[FZ] 0001`.
- [ ] Agregar impresion de recibo de recepcion.
- [ ] Agregar impresion de recibo de pago.
- [ ] Agregar impresion de garantia.
- [ ] Agregar plantilla con terminos y condiciones.
- [ ] Permitir abonos, saldo pendiente y pagos parciales.
- [ ] Agregar historial de eventos por ticket.
- [ ] Agregar fotos de evidencia antes y despues.

## Fase 5: Inventario e insumos

- [ ] Separar productos vendibles, refacciones e insumos internos.
- [ ] Registrar entradas, salidas, ajustes y mermas.
- [ ] Descontar refacciones automaticamente cuando se usan en un ticket.
- [ ] Alertar stock bajo.
- [ ] Registrar proveedores.
- [ ] Asociar compras de insumos con proveedor y comprobante.
- [ ] Exportar inventario a Excel.

## Fase 6: Finanzas y reportes

- [ ] Separar ingresos por servicios, ventas y anticipos.
- [ ] Separar egresos por inventario, renta, nomina, herramientas y operacion.
- [ ] Crear reporte diario de caja.
- [ ] Crear reporte mensual de ingresos y egresos.
- [ ] Crear reporte de utilidad estimada.
- [ ] Crear reporte de tickets por estado.
- [ ] Crear reporte de empleados y productividad.
- [ ] Exportar reportes a Excel.

## Fase 7: Deploy interno

- [ ] Elegir hosting inicial para la app.
- [ ] Configurar variables de entorno.
- [ ] Configurar respaldos de Supabase.
- [ ] Probar acceso desde celulares y computadoras del equipo.
- [ ] Definir proceso para dar de alta y baja empleados.
- [ ] Preparar version privada para produccion.

## Fase 8: Mejoras futuras

- [ ] Agregar notificaciones por WhatsApp o email.
- [ ] Agregar cotizaciones antes de autorizar reparaciones.
- [ ] Agregar firma de cliente.
- [ ] Agregar lector de codigos QR para tickets.
- [ ] Agregar busqueda avanzada por telefono, IMEI, folio o cliente.
- [ ] Agregar dashboard por sucursal si FixZone crece.
- [ ] Agregar integracion contable si se requiere facturacion formal.
