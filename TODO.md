# FixZone CRM ToDo

_Última actualización: 2026-08-04_ (sesión 10 — revisión general tras 6 semanas enfocadas en fixes descubiertos en uso real; ver Fase 18 y sección "Qué priorizar ahora" al final)

## Fase 1: Definir operacion interna

- [x] Definir lista inicial de empleados que tendran acceso.
- [x] Definir roles internos: owner, admin, tecnico, ventas, viewer.
- [x] Registrar sucursales iniciales: Puerto Vallarta y Puebla.
- [x] Registrar empleados iniciales: Kevin Mijangos, Carlos Mijangos, Gigi Vargas, Monica Torres, Diego Mijangos y Daniel Mijangos.
- [x] Decidir si se usaran correos Gmail existentes o dominio propio mas adelante.
- [x] Definir flujo real de reparacion: Cotizacion, Recibido, En reparacion, Listo, Entregado, Garantia.
- [x] Definir datos obligatorios de cliente: nombre, telefono — cliente e IMEI opcionales en tickets walk-in.
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
- [x] Log in con usuario y contraseña. Usuarios internos de base de datos.
- [x] Bloquear la app si el correo no existe en `employees`.
- [x] Conectar clientes a la base de datos.
- [x] Conectar productos e inventario a la base de datos.
- [x] Conectar tickets a la base de datos.
- [x] Conectar compras de insumos a la base de datos.
- [x] Conectar ingresos y egresos a la base de datos.
- [x] Agregar estados de carga, errores y confirmaciones (toasts de éxito/error + confirm modal).

## Fase 4: Tickets y recibos

- [x] Mejorar folio de ticket con formato fijo `[FZ] 0001`.
- [x] Agregar impresion de recibo de recepcion, pago y garantia.
- [x] Agregar plantilla con terminos y condiciones — incluidos en recibo de recepción (5 cláusulas estándar).
- [x] Permitir abonos, saldo pendiente y pagos parciales.
- [x] Pagos de tickets se registran automáticamente como Ingresos en Finanzas (backfill migration 20).
- [x] Agregar historial de eventos por ticket (detecta cambio de stage, timeline en modal de edición).
- [x] Agregar fotos de evidencia antes y despues del dispositivo. * Se soluciona con mWR de etapas * 
- [x] Modificar el tamaño del recibo — botones 58mm/80mm en el header, persiste en localStorage.
- [x] Impresión automática según estado del ticket (⚡ Auto en dropdown).
- [x] Clientes e IMEI opcionales en tickets walk-in — `supabase/19_nullable_customer_device.sql` aplicado.

## Fase 5: Inventario e insumos

- [x] Separar productos vendibles, refacciones e insumos internos (filtro en Productos + tipo guardado en DB).
- [x] Registrar entradas, salidas, ajustes y mermas (± Movimiento en sección Productos).
- [x] Descontar refacciones automaticamente cuando se usan en un ticket (al mover a Entregado).
- [x] Alertar stock bajo (banner en dashboard + tabla en reportes con cantidad faltante).
- [x] Importar inventario inicial Puerto Vallarta — `supabase/14_inventory_vallarta.sql` aplicado.
- [x] Compras de insumos vinculadas a producto del catálogo con incremento automático de stock — `supabase/15_supply_stock_link.sql`.
- [ ] Registrar proveedores (sección dedicada con nombre, contacto y RLS).
- [ ] Asociar compras de insumos con proveedor y comprobante — permitir adjuntar foto de comprobante.
- [ ] Exportar inventario a Excel.
- [x] Tabla de precios por dispositivo × servicio — costo de mano de obra, vista Precios con matriz editable, gestión de servicios, cotizador rápido con slider y −35% descuento base (migrations 21 + 21b + 22 aplicadas). Soporta variantes de precio por celda (ej. Original vs Genérica).
- [x] Precio base por servicio — `default_price` en service_types; Diagnóstico y Limpieza $350 fijos para todos los equipos (migration 22b).
- [x] Cotizador Precios → botón "Crear cotización" pre-llenado con precio calculado por fórmula de márgenes.
- [x] Traceabilidad bidireccional COT ↔ FZ — al aprobar cotización se asigna folio [FZ] nuevo, ambas cards muestran la referencia cruzada (migration 23).
- [ ] Reglas de margen sobre insumos — tabla configurable de rangos de costo con % de ganancia (ej. costo ≤ $1,500 → 110%, costo > $1,500 → 100%). Precio total = costo insumo + (costo × %ganancia) + mano de obra.
- [ ] Ticket de request de compra de insumos / material 

## Fase 6: Finanzas y reportes

- [x] Separar ingresos por servicios, ventas y anticipos.
- [x] Separar egresos por inventario, renta, nómina, etc.
- [x] Crear reporte de caja (hoy / 7 días / mes / todo con filtro de período).
- [x] Crear reporte mensual de ingresos y egresos (con desglose por categoría).
- [x] Crear reporte de tickets por estado (distribución con barra visual).
- [x] Crear reporte de empleados y productividad.
- [x] Crear reporte de utilidad estimada (ingresos − egresos por período, margen %, desglose por categoría).
- [x] Reporte de equipos más frecuentes — top 20 por sucursal con tickets, cerrados e ingresos (historial completo).
- [x] Exportar reportes a Excel — botón "Exportar período" filtra por período activo; "Todo" exporta todas las hojas.
- [x] Filtro de reportes por mes específico — además de Hoy/7 días/Mes actual/Todo, se puede elegir un mes concreto del historial.
- [ ] Descargar/exportar un rango de fechas personalizado (no solo mes calendario) — sigue pendiente, el filtro por mes cubrió parte del caso de uso original.
- [x] Considerar gastos de movilidad / gasolina — categorías "Gasolina" y "Movilidad" agregadas a egresos.
- [x] Integracion de metricas y assurance de traceabilidad bidireccional entre cotizaciones <> clientes <> tickets <> cotizaciones — auditoría dedicada, ver [Fase 18](#fase-18-auditoría-de-trazabilidad-y-datos).
- [x] Registrar método de pago interno — efectivo, transferencia, link de pago, terminal TC, terminal TD. Campo en form de transacción manual + abono guarda método como campo separado en DB (`payment_method`). Se muestra en tabla Finanzas bajo el concepto.
- [x] Métricas de método de pago — sección "💳 Ingresos por método de pago" en Reportes, filtrada por período y sucursal, con tarjeta por canal y % del total.
- [x] Unificar vocabulario de `payment_method` en todos los flujos — abono y POS usaban `"Tarjeta"` genérico en vez de `Terminal TC`/`Terminal TD`, causaba que el campo apareciera vacío al reabrir el registro. **No retroactivo**: registros viejos con `"Tarjeta"` siguen sin poder distinguirse entre TC/TD.
- [x] Drilldown clickeable en Reportes — tarjetas de cotizaciones, canales de adquisición ("¿Cómo nos conocieron?") y métodos de pago abren el registro/ticket de origen editable en vez de ser solo lectura.
- [x] Redondeo de aritmética monetaria (`round2()`) en abonos/descuentos — evita que sumas de punto flotante (`0.1+0.2`) dejen centavos basura visibles en inputs sin formatear.
- [x] Reporte de cancelaciones/equipos no reparables — `#reports-unrepairable`, período-filtrado, desglose por motivo estructurado (Irreparable, Cliente canceló, Precio muy alto, etc.).
- [x] Reporte de afluencia de clientes — heatmap día×hora (recepción/entrega) en Reportes (`#reports-traffic`, con modo Semana típica/Explorar) y widget compacto en Home (`#dashboard-traffic-chart`).

## Fase 7: Marketing

- [x] Carpetas de assets de marca creadas: `assets/brand/fixzone/` y `assets/brand/refaxzone/`.
- [x] Plantillas de mensaje WhatsApp editables — tab Automatización (ahora incluye plantilla de Cotización).
- [x] Códigos de descuento en Supabase (`discount_codes`) — válidos en Cotización, Ticket y POS, con scope, fecha de vigencia, máx. usos, activo/inactivo, tipo fijo o porcentaje.
- [x] Marketing UI — cards compactas, links editables inline sin ticket a IT (add/edit/delete, con icono, nombre, URL y descripción).
- [ ] Integración WhatsApp Business Cloud API — envío automático al cliente cuando cambia el estado del ticket (Listo, Pagado, Garantía). **BLOQUEADO**: requiere Meta Business verificado + número dedicado registrado en la API; aún no está decidido si se va a hacer esa verificación. No iniciar desarrollo hasta que se confirme y se tengan los accesos.
- [ ] Función para enviar recordatorios de garantía o promociones por WhatsApp / email.
- [ ] Crear sección de plantillas de email para clientes, editable.
- [ ] Permitir subir/gestionar imágenes y documentos desde la UI.
- [x] Botón 📋 Copiar en cada plantilla de WhatsApp vinculada a tickets.
- [x] Repertorio de mensajes rápidos — saludo, horarios, tiempo de reparación, garantía, equipo listo, despedida, etc. Editable, con botón copiar en cada uno.
- [x] Campo "¿Cómo nos conocieron?" en alta/edición de cliente (Instagram, Facebook, Transeúntes, Conocidos de Moni, Otro: especificar) + métrica en Reportes (`#reports-referral`) con desglose de clientes nuevos por canal del período.
- [x] Google Ads — `gtag`/conversion tracking (ID G-X4QFLJNES2) y script "gracias" para la página pública, requerido para medir campañas de Google Ads.

## Fase 8: Deploy interno

- [x] Elegir hosting: Cloudflare Pages (`fixzone-crm.pages.dev`).
- [x] Probar acceso desde celulares y computadoras del equipo.
- [x] Preparar versión privada para producción.
- [ ] Configurar respaldos automáticos de Supabase.
- [ ] Definir proceso formal para dar de alta y baja empleados.
- [ ] Configurar dominio propio (si se decide usar).

## Fase 9: Mejoras futuras

- [ ] Agregar notificaciones por WhatsApp o email automáticas (ticket listo, garantía por vencer).
- [ ] Agregar lector de códigos QR para consulta de tickets. --? Se referira a nosotros como Fixzone o a los clientes?
- [ ] Agregar integración contable si se requiere facturación formal. Prioridad media - 
- [ ] Actualizar logos en `assets/brand/` — los actuales son versiones antiguas.
- [x] Recibo de impresión de largo dinámico — alto del papel se ajusta al contenido real, sin espacio en blanco al final (`doPrint()` inyecta `@page { size: Xmm auto }` antes de cada impresión, evitando el bug de `var()` en `@page` de Chrome).
- [x] Autocomplete de equipo en tickets y cotizaciones — lista base ~100 modelos (iPhone/Samsung/Motorola/Xiaomi/Huawei), filtrado substring, opción agregar modelo nuevo.
- [x] Búsqueda avanzada por teléfono, IMEI, folio o cliente.
- [x] Filtrar dashboard por sucursal.
- [x] Editar datos de clientes.
- [x] Botón de perfil de usuario para cambiar contraseña.
- [x] Drag & drop en KANBANs (tickets + soporte IT).
- [x] Tooltips de sección al hacer hover en el nav.
- [x] Que exista un QR interno, en el ticket para que lo escanee el tecnico y ahi le aprezcan tres opciones: recibido | Proceso | Listo y en cada seccion que escoja pues sea para que pueda tomar las fotos y esas se suben y llegan al ticket al QR ahora si del cliente y se ven esas etapas tambien conforme el ticket se mueve.. 
- [x] Para el area de insumos y egresos, escaneo de comprobantes (cámara o subir imagen/PDF) con prellenado por IA (`scan-receipt` Edge Function, requiere `ANTHROPIC_API_KEY`). "Agregar" → manual | escanear; al escanear se acepta foto, imagen o PDF, se analiza y se abre el formulario prellenado con la foto adjunta.
- [x] Ordenar columnas del kanban — barra de orden: Más reciente ↓, Más antiguo ↑, Cliente A→Z, Prioridad.

## Fase 10: Fixes 

- [x] Finanzas: RLS y aparición en dashboard de nuevas transacciones.
- [x] Soporte IT: formulario, permisos y botón eliminar.
- [x] Tickets: RLS, fotos (Storage bucket), roles normalizados, campos opcionales.
- [x] Brand RefaxZone: paleta naranja correcta en todos los elementos y editor de marca.
- [x] Impresión: fuentes subidas, default 58mm, SUCURSAL removida, logo mono, auto-impresión por estado.
- [x] IMEI/color/accesorios se borran al editar — Fix: device record persiste con `customer_id` nullable.
- [x] Pagos de tickets crean transacción en Finanzas — backfill migration 20 aplicado.
- [x] dateStamp usa hora local (no UTC) — corrige "Ingresos hoy" después de las 7pm.
- [x] Tickets — carga de fotos existe solo al editar, no al crear (diseño intencional por ahora). * Se arregló con los QR de etapas* 
- [x] Logo de login y sidebar corregido — apunta a LOGO-FIXZONE.png (ruta logo-color.png no existía).
- [x] Teléfono del cliente en ticket — campo `clientPhone` opcional en el form; al editar se pre-llena del registro existente.
- [x] Auto-registrar cliente cuando hay nombre + teléfono al crear o editar un ticket (también actualiza teléfono si el cliente existe sin uno).
- [x] Texto largo de descripción en cards — `word-break:break-word` + `-webkit-line-clamp:2` en ticket card y cotización card.
- [x] Que en el chat de notificaciones , cuando IT manda mensaje diga IT. O mejor, como hay roles repetidos, que se muestr el nombre del usuario plis, solo primer nombre. — corregido: `addNotif()` ahora guarda `author_name` como el primer nombre real de `currentEmployee.full_name` (antes usaba `.name`, que no existía).
- [x] Mande mensaje en el centro de notificaciones y no le llegó a nadie, abrieron su centro de campanita y no aparecia nunfun mensaje de los que habia enviado. — corregido: centro de notificaciones migrado a tabla Supabase `notifications` (migration 31), avisos ahora compartidos entre todos los usuarios en lugar de localStorage por navegador. Requiere aplicar `31_notifications.sql`.
- [x] .photo-stage-group {} /* se usa?*/ — regla CSS vacía borrada de `ticket-track.html` (la clase sigue en el HTML, no requería estilos propios).
- [x] Edito y guardo los mensajes rapidos en la seccion de automatizacion , pero al dar guardar, no respeta los cambios. — `renderQuickMessages()`/`renderWATemplates()` se re-renderizaban sobre el modo edición y perdían los cambios; ahora tienen guardas anti-reset y autosave.
- [x] En "Diseño" al guardar un logo, se cambiaba el icono del logo de la página del CRM — agregada sección "📁 Biblioteca de assets de marca" (separada del "Editor de marca"). Permite subir logos en variantes (color, monocromático, sin fondo, negro), íconos sueltos, etc. a Storage (`ticket-photos/brand-assets/`), con galería para ver, copiar URL y descargar — sin afectar el branding activo del CRM. Cada archivo puede marcarse "Ambas marcas" o solo la sucursal activa. Migración `supabase/30_brand_assets.sql` ya aplicada y deployado (commit `81592b0`).
  - [ ] **Pendiente QA manual**: probar subir/copiar URL/descargar/eliminar un archivo real en la Biblioteca de assets de marca (sesión 2026-06-12 — sin archivos de prueba a la mano en esta compu).
- [x] cuando hago click en añadir "Compra" se abre la ventana pero despues se quita el formulario, y se queda el CRM mas tenue y tengo que presionar ESC. — Causa: `closeModal()` dejaba el modal en `.is-closing` (opacity:0) si se reabría mientras la animación de cierre anterior seguía corriendo. Fix: `openModal()` limpia el estado y reabre limpio; `closeModal()` usa un token para no pisar el modal reabierto.
- [x] Al agregar "Compra" hace lo de que se ve la pantalla mas atenuada y solo se puede salir con ESC - mismo fix que el punto anterior.
- [x] Insumos no tenía botón para eliminar registros — agregado ✕ Eliminar (borra de `supply_purchases`).
- [x] Doble click en "Guardar" (Tickets, Insumos, etc.) creaba registros duplicados mientras cargaba — el formulario ahora se bloquea (`dataset.submitting` + botón deshabilitado) hasta terminar el guardado.
- [x] Permitir decimales en "Total MXN" de compras/insumos y demás campos de precio — `step="0.01"` en todos los inputs monetarios (antes `step="1"` rechazaba centavos).
- [x] Escaneo de comprobantes acepta también PDF/imagen subida (no solo cámara) y tiene fallback a OCR local (Tesseract.js) si la IA de Anthropic no está disponible.
- [x] Escaneo de comprobantes con varios artículos (Insumos) — la IA detecta todas las líneas del ticket; si hay más de una, se muestra una pantalla de revisión donde se puede editar/eliminar cada línea antes de guardar como insumos separados ("Guardar todos").
- [x] POS checkout fallaba para empleados con rol `it` (RLS) — `supabase/28_it_role_pos_tables.sql` agrega las políticas "it can manage *" faltantes en `pos_sales`/`pos_sale_items`.
- [x] Teléfono/canal de referencia se perdían en silencio si el INSERT del cliente fallaba (típicamente RLS) — el ticket se guardaba igual, sin aviso de error. Corregido: ahora se lanza error explícito y se detiene el guardado (`createRemoteTicket`/`updateRemoteTicket`). **Nota:** el caso real que originó este fix ([FZ] 0094, 21/07) no fue recuperable — el dato nunca llegó a persistirse en ningún lado.
- [x] Ticket se guardaba aunque fallara el registro del equipo (`customer_devices`) — quedaba un ticket "huérfano" sin producto/IMEI. Ahora se hace rollback del INSERT de ticket si falla ese segundo paso.
- [x] Doble-submit generaba registros duplicados también en abono, movimiento manual (Finanzas) y devolución POS — no solo en el guardado general de formularios; mismo patrón de bloqueo (`dataset.submitting` + botón deshabilitado) extendido a esos tres flujos.
- [x] Descuentos con total incorrecto y límites de uso de código no aplicados en algunos flujos — corregido junto con el redondeo de aritmética monetaria.
- [x] Orden del kanban por columna usaba `updatedAt` (se recalculaba con cualquier edición, no solo cambio de etapa) — un ticket ya entregado subía al tope de "Entregado" solo por corregir una nota. Ahora usa `stage_changed_at` (migration 51), que solo se actualiza cuando cambia la etapa.
- [x] "Cancelar ticket" — nueva etapa terminal `Cancelado` con motivo estructurado (Irreparable, Cliente canceló, Precio muy alto, Encontró otro servicio, No recogió el equipo, Otro), reembolso automático al cliente si había abono, y opción de reembolso/devolución del insumo vinculado al proveedor con ajuste de stock.
- [x] Código de desbloqueo del equipo (NIP o patrón 3×3) capturable en ticket/cotización, con animación de reproducción en el detalle — nunca se muestra en impresiones/recibos de cara al cliente.
- [x] Vincular una compra de insumo (Egresos) al ticket para el que se compró — traceabilidad interna, badge 🎫 en Insumos y sección dedicada en el detalle del ticket.
- [x] Registrar un Egreso de Insumos directo desde Finanzas (antes solo se podía desde la sección Insumos) — mismo flujo de inventario/traceabilidad, con backfill retroactivo si se edita un Egreso viejo y se le agrega el artículo.
- [x] Devoluciones de venta POS — selecciona artículos/cantidades a devolver, restaura stock automáticamente y registra el reembolso como Egreso en Finanzas.
- [x] Notificaciones (campanita) y checklist de equipo en tiempo real vía Supabase Realtime — antes dependían solo del polling de 90s.

## Fase 11: Cotizaciones

- [x] Sección dedicada, cotización se convierte a ticket con un clic (Aprobar → Recibido).
- [x] Builder de partidas: + Servicio / + Producto, con qty, precio, tipo y eliminar fila; calcula total automáticamente.
- [x] Numeración `[COT] 0001` separada de `[FZ]` tickets.
- [x] Botón 💬 WhatsApp — genera mensaje con desglose de partidas y total (usa plantilla editable o mensaje automático).
- [x] Botón 🖨 Imprimir — PDF formal de cotización con tabla de partidas, subtotal, descuento, vigencia y firma.
- [x] Código de descuento aplicable desde el builder de cotización.
- [ ] Cambio de status de Cotización a "Venta concretada" (diferente de aprobar como reparación).
- [x] Partidas de cotización sincronizadas con service_types — tipo Servicio usa select del catálogo, auto-rellena precio desde service_prices (o default_price) al seleccionar equipo + servicio.
- [x] Campo "Costo insumo" en partidas Servicio — al ingresar el costo, calcPrecio() calcula el precio final automáticamente con la fórmula de márgenes (pantalla o glass según servicio).
- [x] Cotizador en Precios → botón "Crear cotización" pre-llenado con precio calculado.
- [x] Traceabilidad bidireccional: al aprobar, cotización guarda folio [FZ] y ticket guarda folio [COT] de origen. Ambas referencias visibles en las cards.
- [x] Métricas de cotizaciones en Reportes: total por período, tasa de conversión, monto promedio, cuántas se pierden sin aprobar (`#reports-cotizaciones`).

## Fase 12: Punto de Venta (POS)

- [x] Arquitectura POS separada de Ticket (sin IVA, cliente opcional, stock por trigger).
- [x] Catálogo filtrable, carrito con qty, descuento fijo o por código, método de pago.
- [x] Checkout: INSERT pos_sales → pos_sale_items → transaction Ingreso/Venta automático.
- [x] Historial de ventas recientes.
- [x] Recibo imprimible con folio, productos, total, método de pago y código de descuento si aplica.
- [x] Ligar venta POS a cliente del catálogo (opcional).
- [x] Campo de código de descuento con botón Aplicar — valida scope, fecha, usos.
- [x] Constraint `CHECK (stock >= 0)` en DB — `supabase/17_pos_stock_constraint.sql` aplicado.
- [x] Reporte de ventas POS por período (separado del reporte general de Finanzas) — `#reports-pos`.

## Fase 13: UX / Navegación

- [x] Sidebar compacto 220px, nav items 34px, entra completo en 100% de zoom.
- [x] Navegación por grupos con divisores: Operaciones / Inventario / Finanzas / Admin.
- [x] Botones circulares Ticket y POS en el header para acceso rápido (iconos Lucide SVG).
- [x] Cards de marketing compactas (padding reducido, fuente más pequeña).
- [x] Toasts de éxito/error y confirm modal reemplazando alert/confirm nativos.
- [x] **Sprint 3 — Design polish:** tipografía Outfit (body) + Orbitron solo brand mark, H1/H2 sin uppercase, iconografía unificada con Lucide, ghost-card shadows removidos, status badges con tokens de marca, marcatextos en finanzas corregido, atajos de teclado (N/P/D//, Escape), validación inline de formularios, empty states con CTAs, success toast, focus rings, scrollbar custom, reduced-motion.
- [x] Simplificar impresión de tickets — un solo botón 🖨 por card que imprime automáticamente el recibo correcto según el estado (recepción / pago / garantía). Opciones específicas disponibles desde el detalle del ticket.
- [x] Centro de notificaciones — Fase 1: migrado a tabla Supabase `notifications` (migration 31), avisos broadcast compartidos entre todos los usuarios, autor con primer nombre real, polling cada 30s. Fase 2 completada: avisos automáticos al asignar/cambiar de etapa un ticket y respuestas en hilos de soporte IT.
- [x] Kanban compacto — columnas 240px, acciones ocultas/hover-reveal, tipografía reducida.
- [x] Click en movimiento reciente en Home → abre vista Finanzas con el registro.
- [x] Refresh mantiene la tab activa (sessionStorage).
- [x] Kanban tipo Hubspot — expandir card al click para leer info completa (read-only). Ahora aplica a las 3 kanban: Tickets (`viewTicketDetail`), Cotizaciones (`viewQuoteDetail`) y Soporte (`viewSupportTaskDetail`, incluye hilo de conversación). Clic en botones de `.ticket-actions`/`.support-actions` no abre el detalle.
- [x] Revisar mobile en celular real (responsive implementado, pendiente QA).
- [x] Centro de notificaciones — Fase 2: avisos automáticos cuando se asigna un ticket a un técnico (al crear o editar) y cuando cambia de etapa (incluye drag&drop en kanban), dirigidos al técnico asignado. Comentarios IT ya notificaban desde Fase 13.
- [x] Desborde fuera del margen de los tickets y texto . Prioridad medai. *Arreglado con click en tickeet y abrir vista detalladad de ticket*
- [x] Checklist de tareas generales del equipo (investigar/cotizar/comprar/otro) — no ligadas a tickets ni a Soporte IT (eso sigue siendo solo IT). Ícono nuevo junto a la campanita, accesible desde cualquier pestaña sin entrar a una vista nueva; cualquier empleado activo crea/ve/marca como hecha, por sucursal, resueltas se tachan y se agrupan colapsadas, badge rojo cuando hay un item nuevo sin ver (`supabase/39_team_tasks.sql`).

## Fase 14 - IT 
- [x] Que en cada task de IT permita la comunciacion IT <> Usuario — hilo de comentarios (`support_task_comments`, migration 32) en el modal de Editar tarea (IT) y en el nuevo modal "Mis solicitudes" (ícono 📥 junto al botón de ayuda), con aviso al centro de notificaciones cuando hay respuesta.
- [x] Poner que se peuda adjuntar fotos en los tickets para IT que crean los usuarios. Migration 33 agrega `attachments.task_id` + policy adicional para que cualquier empleado activo gestione adjuntos de sus tareas de soporte (reutiliza bucket `ticket-photos`, prefijo `support/`). UI integrada en `renderSupportCommentThread()` — visible tanto en "Editar tarea" (IT) como en "Mis solicitudes" (usuario).

---

## Fase 15: UX Audit — Página pública fixzone.pages.dev

_Pendiente implementar — evaluación hecha en sesión 2026-06-06_

- [x] **[P0] Consolidar CTAs** — cada fila es tappable a WhatsApp con el servicio pre-llenado + bloque CTA verde prominente abajo.
- [x] **[P1] Añadir precio de referencia** — "desde $X" debajo de cada servicio. Actualizar precios reales en `docs/fixzone-menu.html`.
- [x] **[P1] Añadir prueba social** — Trust bar con rating ⭐, horario y dirección arriba del fold. Actualizar rating real en el archivo.
- [x] **[P2] Reemplazar bullets por íconos de servicio** — cada servicio tiene ícono específico en caja azul redondeada.
- [x] **[P2] Adaptar layout desktop** — card centrada sobre fondo gris, border-radius 20px y sombra en ≥520px.
- [x] **[P2] Dar más visibilidad al horario** — barra "Abierto hoy" con punto verde pulsante justo debajo del trust bar.
- [x] **[P3] Elevar el botón de Maps** — full-width, borde azul sólido, texto "Ver en Maps". Actualizar href con URL real.
- [x] **[PENDIENTE datos reales]** — Actualizar en `docs/fixzone-menu.html`: rating Google real, URL de Google Maps, y precios por servicio.

---

## Fase 16: UX Audit — CRM interno (fixzone-crm.pages.dev)

_Pendiente implementar — auditoría de código hecha en sesión 2026-06-06_

- [x] **[P0] Subir tamaño mínimo de fuente a 12px** — todas las instancias de `font-size: 11px/10px` en labels, badges, report cards y ticket detail subidas a 12px. Se dejaron en su tamaño original solo los íconos de `.nav-item span` (glifo dentro de caja fija 22px/18px, no es texto legible).
- [x] **[P0] Quitar `text-transform: uppercase` de `.field label`** — labels de formulario ahora en sentence case (se mantiene uppercase en badges de estado/rol y `th` de tablas, que no usan esta clase).
- [x] **[P1] Unificar íconos de nav a Lucide** — Todos los íconos del sidebar migrados a Lucide (`home`, `ticket`, `clipboard-list`, `shopping-cart`, `users`, `package`, `package-open`, `tags`, `wallet`, `bar-chart-3`, `user-cog`, `life-buoy`, `receipt`, `palette`, `zap`), sin colisiones entre vistas.
- [x] **[P1] Extender stagger de animación a todas las vistas** — `card-enter` ahora también aplica a `.report-card` (Reportes), `.metric` en Finanzas y filas de `#clients-table` (Clientes), con `--i` por elemento y delay acotado con `min()` para no acumular demasiado en listas largas.
- [x] **[P1] Definir escala de z-index semántica** — Tokens `--z-sticky` (90), `--z-tooltip` (1000), `--z-modal` (2000, reservado), `--z-toast` (9999) definidos en `:root`; aplicados a `.sidebar` (mobile), `.help-toast` y `.device-ac-dropdown`.
- [x] **[P2] Diferenciador visual sutil Puebla vs Puerto Vallarta** — `.sidebar` ahora tiene `border-top: 3px solid var(--fz-dash-accent)`, que ya difiere ligeramente entre FixZone y RefaxZone vía `brand-config.js`, sin tocar la paleta principal.
- [x] **[P2] Kanban ancho adaptable en pantallas grandes** — `.kanban-column` ahora usa `width: clamp(240px, 22vw, 320px)`.
- [x] **[P2] Metric grid responsive sin breakpoints fijos** — `.metric-grid, .inventory-grid, .finance-summary` ahora usan `repeat(auto-fill, minmax(200px, 1fr))`.
- [x] **[P2] Toasts descartables** — `.help-toast` y `.error-toast` ahora tienen `pointer-events: auto; cursor: pointer` y se cierran al hacer click (además del auto-dismiss existente).
- [x] **[P2] Skeleton loader en carga inicial** — `showApp()` se llama antes de `await reloadState()` en `afterLogin()`, revelando el shell con 3-4 `.skeleton-card` (shimmer) en `#metric-grid`, `#active-ticket-list` y `#recent-activity`, reemplazados por `renderMetrics()` al terminar la carga.
- [x] **[P3] Tracking codes en monospace, no Orbitron** — `.tracking-code` ahora usa `ui-monospace, 'SF Mono', monospace; font-weight: 700`.
- [x] **[P3] Hover de botón primario sin `filter: brightness()`** — `.primary-action:hover` ahora cambia `background` a `var(--fz-secondary)` en vez de `filter: brightness()`.

---

## Fase 17: Resiliencia técnica

_Salido del análisis FODA hecho en sesión 2026-06-23 — orden = prioridad por impacto/urgencia_

- [ ] **[P0] Configurar respaldos automáticos de Supabase** — activar PITR o backups diarios desde el dashboard del proyecto `zwmffnrkrrowmchluyyy`. Es la debilidad de mayor impacto: cualquier otro error (migración mal aplicada, RLS roto, borrado accidental) se vuelve irreversible sin esto. **Sigue sin hacerse desde que se detectó (sesión 2026-06-23) — 6+ semanas abierto y ya van 51 migraciones aplicadas en producción sin red de seguridad. Candidato #1 para esta sesión.**
- [x] **[P0] Reemplazar la regla de Contaduría hardcodeada por nombre** — `employees.can_access_contaduria` (boolean, migration 40), `currentPerms()` y `private.is_admin_it_or_kevin()` leen el flag; toggle "+ Contaduría" en la tabla de Usuarios para admin/it. Confirmado aplicado y en uso.
- [ ] **[P1] Probar migraciones en un proyecto Supabase secundario antes de aplicarlas en producción** — clonar el esquema actual a un segundo proyecto gratuito como staging mínimo.
- [~] **[P1] Migrar config de `localStorage` a Supabase** — tabla genérica `app_settings` (key/value jsonb, migration 41) creada y aplicada. **Hecho:** plantillas de WhatsApp (`wa_templates`), mensajes rápidos (`quick_messages`). **Pendiente:** links de marketing, `fixzone-pricing-config` — mismo patrón (`state.settings[key]` + `saveAppSetting(key, value)`), una sección por sprint.
- [ ] **[P1] Registrar qué migraciones ya corrieron** — tabla `schema_migrations` (o script de verificación) contra el listado en `supabase/`, para no depender de memoria/documentación al diagnosticar "funciona en mi compu pero no en producción". **Ya mordió dos veces en la práctica** (migration 45 `unlock_pattern` y el patrón general documentado en CLAUDE.md: código que se despliega y funciona local pero la migración nunca se corrió en Supabase) — subir prioridad, ya no es solo teórico.
- [ ] **[P2] Empezar a modularizar `src/app.js`** (ya ~13,000 líneas, subió desde ~10,000 hace 6 semanas) — extraer con `<script type="module">` (sin build step) los bloques más aislados primero: POS, descuentos, finanzas. Dejar tickets/kanban para el final.
- [~] **[P2] Cobertura de pruebas** — no hay tests unitarios de funciones puras (`calcPrecio()`, `applyDiscount()`, cálculos de reportes) todavía, pero sí se agregó `tests/e2e/test_traceability_fixes.py` (Playwright, contra Supabase real) para las 4 bugs de trazabilidad encontradas en la auditoría de agosto — ver [Fase 18](#fase-18-auditoría-de-trazabilidad-y-datos). Es cobertura de integración, no unitaria; el pendiente original sigue abierto.

---

## Fase 18: Auditoría de trazabilidad y datos

_Sesión 2026-07/08 — auditoría dedicada a bugs de sincronización entre registros vinculados (regla general adoptada desde entonces: un cambio en un registro vinculado debe reflejarse en ambos lados, siempre)._

- [x] Auditoría de trazabilidad bidireccional — 4 bugs de sincronización encontrados y corregidos (registro no reflejado en ambos extremos de un vínculo: ticket↔transacción, insumo↔stock, etc.), más la feature de reembolso de insumo al cancelar ticket. Cubiertos por `tests/e2e/test_traceability_fixes.py`.
- [x] Auditoría de integridad de datos — scripts en `supabase/audits/` (`data_integrity_audit.sql`, `diag_paid_amount_mismatch.sql`, `diag_device_created_after_ticket.sql`, `diag_ticket_0092_timestamps.sql`, `financial_dates_reconciliation.sql`). Baseline limpio confirmado.
- [x] Bug de doble-submit en abono sospechado como causa de montos duplicados — confirmado y corregido (`a8fe0bc`, ver Fase 10).
- [ ] **5 tickets con discrepancia real de monto ($) detectados en la auditoría de datos siguen pendientes de que Mónica los revise uno por uno** — no son atribuibles a un bug conocido; requieren criterio de negocio (¿cobro real vs. registrado, corrección manual, etc.?) antes de decidir si se corrigen en DB.
- [x] Bug de guardado silencioso del teléfono/canal de referencia — encontrado al investigar [FZ] 0094 (Tara Mcmrtry, teléfono no recuperable), causa raíz confirmada como el mismo patrón que motivó esta fase (ver Fase 10).
- [ ] **Conectar Claude Code a Supabase vía MCP** (server oficial, PAT con scope al proyecto, lectura+escritura) — configurado el 2026-08-04, pendiente de una sesión nueva para que las herramientas queden disponibles y se pueda usar para las próximas auditorías/consultas de logs sin ida y vuelta por SQL manual.

---

## Qué priorizar ahora (sesión 2026-08-04)

De todo lo pendiente en el documento, esto es lo que más vale la pena atacar primero, en orden:

1. **[P0] Respaldos automáticos de Supabase** (Fase 17) — es el único pendiente que puede convertir cualquier otro error en irreversible. Lleva 6+ semanas abierto sin acción; con 51 migraciones ya aplicadas en producción, el riesgo acumulado solo sube. Es literalmente configurar un toggle en el dashboard — bajo esfuerzo, altísimo impacto.
2. **[Fase 18] Revisar los 5 tickets con discrepancia de monto pendientes** — es la única tarea de la auditoría de datos que depende de tu criterio de negocio y no de código; sigue sin resolverse desde que se detectó.
3. **[P1] Tabla/registro de qué migraciones ya corrieron** (Fase 17) — ya causó al menos dos incidentes reales de "funciona en mi compu pero no en producción" (migration 45, y el patrón general documentado en CLAUDE.md). Barato de construir, evita depurar el mismo tipo de bug una y otra vez.
4. **Terminar de conectar el MCP de Supabase** — quedó configurado pero no verificado en una sesión nueva; una vez funcione, hace más rápidas las próximas auditorías y consultas de datos/logs sin depender de SQL manual copiado y pegado.
5. **[P1] Migrar el resto de `localStorage` a `app_settings`** (links de marketing, `fixzone-pricing-config`) — ya existe el patrón funcionando para plantillas de WhatsApp y mensajes rápidos; es repetir la misma receta, no diseño nuevo.

**Pendientes que siguen vigentes pero son menor prioridad ahora:** exportar inventario a Excel, registrar proveedores, reglas de margen configurables sobre insumos, staging de Supabase, modularizar `app.js`, tests unitarios, integración WhatsApp Business API (bloqueada por decisión de negocio, no técnica).

**Nada se identificó como obsoleto para eliminar del todo** — los pendientes sin marcar siguen siendo válidos; varios simplemente avanzaron parcialmente (ver anotaciones `[~]`) sin cerrarse del todo.