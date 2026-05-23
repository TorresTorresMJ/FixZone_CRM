# FixZone CRM ToDo

## Fase 1: Definir operacion interna

- [x] Definir lista inicial de empleados que tendran acceso.
- [x] Definir roles internos: owner, admin, tecnico, ventas, viewer.
- [x] Registrar sucursales iniciales: Puerto Vallarta y Puebla.
- [x] Registrar empleados iniciales: Kevin Mijangos, Carlos Mijangos, Gigi Vargas, Monica Torres, Diego Mijangos y Daniel Mijangos.
- [x] Decidir si se usaran correos Gmail existentes o dominio propio mas adelante.
- [x] Definir flujo real de reparacion: Cotizacion, Recibido, En reparacion, Listo, Entregado, Garantia.
- [ ] Definir datos obligatorios de cliente: nombre, telefono, email, direccion, notas.
- [x] Definir datos obligatorios de equipo: IMEI/serie, color, accesorios recibidos, estado fisico (campos en form de ticket, guardado en customer_devices). 
- [x] Cambiar a RefaxZone los nombres de FixZone cuando la sucursal sea puebla

## Fase 2: Base de datos y seguridad

- [x] Crear proyecto en Supabase.
- [x] Registrar proyecto Supabase FixZone: `zwmffnrkrrowmchluyyy`.
- [x] Configurar Google OAuth en Supabase Auth.
- [x] Crear tabla `employees` con correo, rol y estado.
- [x] Crear schema SQL inicial para clientes, equipos, tickets, productos, inventario, compras, finanzas y adjuntos.
- [x] Activar Row Level Security en todas las tablas.
- [x] Crear politicas RLS para permitir acceso solo a empleados activos.
- [x] Crear permisos por rol.
- [x] Crear tabla `audit_log` para registrar acciones importantes.

## Fase 3: Migrar app actual a Supabase

- [x] Reemplazar `localStorage` por Supabase (modo remoto activo en producción).
- [x] $Agregar pantalla de login con Google.$ Log in será con creación de usuarios y contraseña.  Usuarios internos de base de datos. 
- [x] Bloquear la app si el correo no existe en `employees`.
- [x] Conectar clientes a la base de datos.
- [x] Conectar productos e inventario a la base de datos.
- [x] Conectar tickets a la base de datos.
- [x] Conectar compras de insumos a la base de datos.
- [x] Conectar ingresos y egresos a la base de datos.
- [ ] Agregar estados de carga, errores y confirmaciones.

## Fase 4: Tickets y recibos

- [x] Mejorar folio de ticket con formato fijo.
- [x] Agregar folio visible de seguimiento con formato `[FZ] 0001`.
- [ ] Agregar impresion de recibo de recepcion.
- [ ] Agregar impresion de recibo de pago.
- [ ] Agregar impresion de garantia.
- [ ] Agregar plantilla con terminos y condiciones.
- [x] Permitir abonos, saldo pendiente y pagos parciales.
- [x] Agregar historial de eventos por ticket (detecta cambio de stage, timeline en modal de edición).
- [ ] Agregar fotos de evidencia antes y despues.
- [x] Modificar el tamaño del recibo — botones 58mm/80mm en el header, persiste en localStorage.

## Fase 5: Inventario e insumos

- [x] Separar productos vendibles, refacciones e insumos internos (filtro en Productos + tipo guardado en DB).
- [ ] Registrar entradas, salidas, ajustes y mermas.
- [x] Descontar refacciones automaticamente cuando se usan en un ticket (al mover a Entregado).
- [x] Alertar stock bajo (banner en dashboard + tabla en reportes con cantidad faltante).
- [ ] Registrar proveedores.
- [ ] Asociar compras de insumos con proveedor y comprobante [Permitir adjuntar foto de comprobante].
- [ ] Exportar inventario a Excel.

## Fase 6: Finanzas y reportes

- [x] Separar ingresos por servicios, ventas y anticipos (categorías TX_CATEGORIES_INCOME ya definidas y filtradas).
- [x] Separar egresos por inventario, renta, nómina, etc. (categorías TX_CATEGORIES_EXPENSE ya definidas y filtradas).
- [x] Crear reporte de caja (hoy / 7 días / mes / todo con filtro de período).
- [x] Crear reporte mensual de ingresos y egresos (con desglose por categoría).
- [ ] Crear reporte de utilidad estimada.
- [x] Crear reporte de tickets por estado (distribución con barra visual).
- [x] Crear reporte de empleados y productividad (tabla por empleado: tickets, cerrados, efectividad %, valor generado).
- [ ] Exportar reportes a Excel.

## Fase 7: Marketing
- [x] Carpetas de assets de marca creadas: `assets/brand/fixzone/` y `assets/brand/refaxzone/` con README de guía.
- [ ] Permitir subir/gestionar imagenes, documentos, pdf desde la UI (por ahora solo upload de logo en Editor de marca).
- [ ] Crear seccion de plantillas de email para clientes, editable.
- [x] Plantillas de mensaje WhatsApp editables (renderWATemplates — tab Automatización).
- [ ] Función para enviar recordatorios de garantia o promociones por WhatsApp / email.


## Fase 8: Deploy interno

- [x] Elegir hosting inicial para la app.
- [ ] Configurar variables de entorno.
- [ ] Configurar respaldos de Supabase.
- [x] Probar acceso desde celulares y computadoras del equipo.
- [ ] Definir proceso para dar de alta y baja empleados.
- [x] Preparar version privada para produccion.

## Fase 9: Mejoras futuras

- [ ] Agregar notificaciones por WhatsApp o email.
- [x] Agregar cotizaciones antes de autorizar reparaciones (sección Cotizaciones, botón Aprobar convierte a ticket).
- [x] Agregar firma de cliente.
- [ ] Agregar lector de codigos QR para tickets.
- [x] Búsqueda avanzada por teléfono, IMEI, folio o cliente (Sprint 2 — campos incluidos en ticket object).
- [x] Filtrar dashboard por sucursal FixZone: Puerto Vallarta | Puebla. Faltan: insumos, clientes, finanzas, resportes.
- [ ] Agregar integracion contable si se requiere facturacion formal.
- [ ] Agregar función para añadir imagenes a los tickets, para registrar como viene el dispositivo antes y después. 
- [x] Poder Editar los campos de datos de los clientes,
- [x] Agregar boton para añadir ingresos y egresos en Finanzas
- [x] Editar ingresos y egresos en Finanzas (botón Editar en tabla)
- [x] Categorías filtradas por tipo en form de Finanzas (Ingreso/Egreso)
- [x] Botón de usuario en header para cambiar contraseña (dropdown perfil)
- [x] Cards en los KANBAN se pueden mover arrastrándolas entre columnas (drag & drop, actualiza stage en Supabase).
- [x] Mini explicacion de que hace cada seccion o para que es, con un pequeño boton de ayuda donde al pasarle el cursor se despliegue el texto explicativo 

## Fase 10: Fixes
- [x] Arreglar error de Finanzas: RLS en tabla "transactions" — rol `it` no reconocido
- [x] Arreglar error de Finanzas: nueva transacción no aparecía en dashboard/finanzas
- [x] Editar Tasks (IT) — función duplicada/rota, schema incorrecto, handler inexistente
- [x] Nuevo registro Soporte — "Tipo no soportado" por mismatch en activeForm key
- [x] Botón Eliminar en Soporte no aparecía — `canDeleteTask` faltaba en PERMISSIONS
- [x] Eliminar botón "restaurar demo"
- [x] Tickets — se guardaba en Supabase pero no aparecía en KANBAN (reloadState fallback + branch vacío)
- [x] RLS bloqueaba escritura en service_tickets, products, suppliers, attachments para rol `it`
- [x] Fotos en tickets — Storage bucket `ticket-photos` sin políticas RLS
- [x] Roles normalizados: `it`→`admin`, `standard`→`technician`, `marketing`→`technician` en DB
- [x] Editor de permisos por rol en sección Usuarios (checkboxes, persistido en localStorage)
- [x] ROLE_LABELS actualizado: `technician` muestra "Estándar", `owner`/`admin`/`it` muestran "Admin"
- [ ] Tickets - Funcion para cargar imagenes existe solo al editar, no al crear (diseño intencional por ahora)
- [x] Brand RefaxZone — franja de color en topbar + CSS variables por sucursal
- [x] Brand RefaxZone — paleta naranja correcta en TODOS los elementos: nav, tabs, kanban, marketing cards, login, mini-buttons, drag-over (tokens CSS dinámicos, 13 reglas corregidas)
- [x] Editor de paleta de marca movido al tab Diseño (estaba en Automatización)
- [x] Editor de marca ampliado: upload de logo por sucursal (archivo PNG/SVG/WEBP o URL), guardado en localStorage, se aplica en sidebar y favicon
- [x] Campos "Notas internas", "Código de descuento" y "Descuento ($)" marcados como opcionales en formulario de ticket (sin required, con etiqueta "(opcional)")
- [x] Insumos y productos — hacer editables desde la UI
- [x] Editar ingresos y egresos en Finanzas
- [x] Mostrar categorías filtradas por tipo en Finanzas (Ingreso/Egreso)
- [x] Botón de perfil de usuario para cambiar contraseña (dropdown en header)
- [x] Cards del KANBAN arrastrables entre columnas (tickets + soporte IT)

## Fase 11 Cotizaciones: 
- [x] Nueva sección: Cotizaciones. Sección dedicada, cotización se convierte a ticket con un clic. Partes/refacciones se agregan directamente desde el modal de edición del ticket.
- [ ] Acceso para enviar la cotizacion a Whatsapp directamente, en PDF 
- [ ] Cambio de status de Cotizacion a venta concretada. 



