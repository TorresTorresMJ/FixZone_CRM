# FixZone Internal Platform Plan

## Regla base

FixZone CRM sera una plataforma interna. No se abrira registro publico. Cada empleado entra con su propio perfil y permisos.

## Autenticacion

Primera opcion recomendada:

- Supabase Auth con Google OAuth.
- Tabla interna `employees` para permitir solo correos autorizados.
- Roles por empleado: `owner`, `admin`, `technician`, `sales`, `viewer`.
- Estado por empleado: `active`, `paused`, `terminated`.

No es obligatorio comprar un dominio para correos al inicio. Se puede operar con cuentas Gmail/Google existentes si cada correo esta dado de alta en `employees`.

Cuando FixZone quiera una operacion mas formal, conviene usar Google Workspace con un dominio propio, por ejemplo `@fixzone.mx` o similar. Eso facilita identidad, recuperacion de cuentas, bajas de empleados y confianza hacia clientes.

## Base de datos

Supabase sera suficiente para la primera version productiva porque incluye:

- PostgreSQL.
- Auth.
- Row Level Security.
- Storage para fotos, evidencias, documentos y recibos.
- API directa para la app.

Proyecto Supabase creado:

- Nombre: FixZone
- Project ID: `zwmffnrkrrowmchluyyy`

Sucursales iniciales:

- Puerto Vallarta
- Puebla

Empleados iniciales:

- Kevin Mijangos
- Carlos Mijangos
- Gigi Vargas
- Monica Torres
- Diego Mijangos
- Daniel Mijangos

Tablas iniciales:

- `employees`: usuarios internos, roles y estado.
- `branches`: sucursales.
- `customers`: clientes.
- `customer_devices`: equipos de clientes.
- `products`: productos, refacciones y accesorios.
- `inventory_movements`: entradas, salidas, ajustes y mermas.
- `service_tickets`: tickets de reparacion.
- `ticket_events`: historial de cada ticket.
- `ticket_items`: refacciones, productos y mano de obra usados en tickets.
- `suppliers`: proveedores.
- `supply_purchases`: compras de insumos.
- `transactions`: ingresos y egresos.
- `attachments`: fotos, comprobantes, evidencias y documentos.
- `audit_log`: cambios importantes hechos por empleados.

## Seguridad

La seguridad no debe depender solo del frontend.

- Activar RLS en todas las tablas expuestas.
- Bloquear usuarios que no existan como empleados activos.
- Guardar permisos en `employees`, no en campos editables por el usuario.
- Registrar acciones sensibles en `audit_log`.
- Separar permisos por rol.

Ejemplos:

- Tecnico: ver y actualizar tickets asignados, agregar evidencias.
- Ventas: crear clientes, tickets e ingresos.
- Admin: inventario, compras, reportes, empleados.
- Owner: acceso total.

## Deploy

Para la primera version:

- Hosting simple para frontend.
- Supabase para backend y base de datos.

Cuando haga falta mayor control:

- Google Cloud Run para desplegar una app web o API privada.
- Google Cloud Storage si crecen archivos o respaldos.
- Google Workspace si se formalizan cuentas de empleados.

## Siguiente fase de implementacion

1. Convertir la app actual de `localStorage` a Supabase.
2. Crear proyecto Supabase y variables de entorno.
3. Crear schema SQL inicial con RLS.
4. Agregar pantalla de login con Google OAuth.
5. Crear panel de empleados y roles.
6. Migrar clientes, productos, tickets, insumos y finanzas a tablas reales.
7. Agregar auditoria y adjuntos por ticket.

## Stages de tickets

El Kanban operativo debe usar estos stages:

- Cotizacion
- Recibido
- En reparacion
- Listo
- Entregado
- Garantia

Cada ticket debe tener folio de seguimiento con formato `[FZ] 0001`, `[FZ] 0002`, etc.
