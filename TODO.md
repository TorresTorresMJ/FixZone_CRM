# FixZone CRM ToDo

_Última actualización: 2026-06-07_ (sesión 5)

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
- [ ] Ver y descargar reportes de períodos anteriores o rangos personalizados.
- [x] Considerar gastos de movilidad / gasolina — categorías "Gasolina" y "Movilidad" agregadas a egresos.
- Integracion de metricas y assurance de traceabilidad bidireccional entre cotizaciones <> clientes <> tickets <> cotizaciones - Prioridad media
- [x] Registrar método de pago interno — efectivo, transferencia, link de pago, terminal TC, terminal TD. Campo en form de transacción manual + abono guarda método como campo separado en DB (`payment_method`). Se muestra en tabla Finanzas bajo el concepto.
- [x] Métricas de método de pago — sección "💳 Ingresos por método de pago" en Reportes, filtrada por período y sucursal, con tarjeta por canal y % del total.

## Fase 7: Marketing

- [x] Carpetas de assets de marca creadas: `assets/brand/fixzone/` y `assets/brand/refaxzone/`.
- [x] Plantillas de mensaje WhatsApp editables — tab Automatización (ahora incluye plantilla de Cotización).
- [x] Códigos de descuento en Supabase (`discount_codes`) — válidos en Cotización, Ticket y POS, con scope, fecha de vigencia, máx. usos, activo/inactivo, tipo fijo o porcentaje.
- [x] Marketing UI — cards compactas, links editables inline sin ticket a IT (add/edit/delete, con icono, nombre, URL y descripción).
- [ ] Integración WhatsApp Business Cloud API — envío automático al cliente cuando cambia el estado del ticket (Listo, Pagado, Garantía). Prerequisito: Meta Business verificado + número dedicado registrado en la API. Programación lista en 1 sprint una vez que estén los accesos. - Priority
- [ ] Función para enviar recordatorios de garantía o promociones por WhatsApp / email.
- [ ] Crear sección de plantillas de email para clientes, editable.
- [ ] Permitir subir/gestionar imágenes y documentos desde la UI.
- [x] Botón 📋 Copiar en cada plantilla de WhatsApp vinculada a tickets.
- [x] Repertorio de mensajes rápidos — saludo, horarios, tiempo de reparación, garantía, equipo listo, despedida, etc. Editable, con botón copiar en cada uno.

## Fase 8: Deploy interno

- [x] Elegir hosting: Cloudflare Pages (`fixzone-crm.pages.dev`).
- [x] Probar acceso desde celulares y computadoras del equipo.
- [x] Preparar versión privada para producción.
- [ ] Configurar respaldos automáticos de Supabase.
- [ ] Definir proceso formal para dar de alta y baja empleados.
- [ ] Configurar dominio propio (si se decide usar).

## Fase 9: Mejoras futuras

- [ ] Agregar notificaciones por WhatsApp o email automáticas (ticket listo, garantía por vencer).
- [ ] Agregar lector de códigos QR para consulta de tickets.
- [ ] Agregar integración contable si se requiere facturación formal. Prioridad media
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
- [ ] Para el area de insumos, agragar el escaneo de tickets con la camara y que al leerlo , escanee y detecte los campos para un prellenado,  y asi aparezzca el formulario antes de guardar, donde se verifiquen o corrihan los campos y al guardar se guarde la foto Y el llenado del formulario porfavor. Esto para mantener mas facil el registro para los reportes. Asi que sea "Agregar" -> aparezcan las opciones : manual | escanear ; Y manual se abre el formulario asi tal cual esta y para adjuntar el archivo del ticket, y si ponen escanear se abra la camara , tomen la foto y haga el prellenado adjuntando esa foto.  Priority 
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
- [ ](image-3.png)Que en el chat de notificaciones , cuando IT manda mensaje diga IT. O mejor, como hay roles repetidos, que se muestr el nombre del usuario plis, solo primer nombre. 
- [ ] Mande mensaje en el centro de notificaciones y no le llegó a nadie, abrieron su centro de campanita y no aparecia nunfun mensaje de los que habia enviado. 
- [ ] .photo-stage-group {} /* se usa?*/ si no, borrar la regla vacia. prioridad media - cleaning dead code 
- [ ]Edito y guardo los mensajes rapidos en la seccion de automatizacion , pero al dar guardar, no respeta los cambios. Prioridad alta 
- [ ] En "Diseño" al guardar un logo , se cambio el icono del logo de la pagina del CRM, NO queiro eso. Queiro que ahi solo sea un fodler para rapido acceso o source of truth de los elementos de la marca. Quiero poder subir los logos monocromaticos, logo sin fondo png, logo black, varios, que sea un folder en linea que en cualquier momento se pueda acceder, descargar, copiar, para hacer uso de él. Incluso que no sea el logo si no por ejemplo el icono del telefono del logo, etc. prioridad alta 
- [ ] cuando hago click en añadir "Compra" se abre la ventana pero despues se quita el formulario, y se queda el CRM mas tenue y tengo que presionar ESC. Prioridad alta
- [ ] Al agregar "Compra" hace lo de que se ve la pantalla mas atenuada y solo se puede salir con ESC - PRIORIDAD URGENTE 

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
- [ ] Métricas de cotizaciones en Reportes: total por período, tasa de conversión, monto promedio, cuántas se pierden sin aprobar.

## Fase 12: Punto de Venta (POS)

- [x] Arquitectura POS separada de Ticket (sin IVA, cliente opcional, stock por trigger).
- [x] Catálogo filtrable, carrito con qty, descuento fijo o por código, método de pago.
- [x] Checkout: INSERT pos_sales → pos_sale_items → transaction Ingreso/Venta automático.
- [x] Historial de ventas recientes.
- [x] Recibo imprimible con folio, productos, total, método de pago y código de descuento si aplica.
- [x] Ligar venta POS a cliente del catálogo (opcional).
- [x] Campo de código de descuento con botón Aplicar — valida scope, fecha, usos.
- [x] Constraint `CHECK (stock >= 0)` en DB — `supabase/17_pos_stock_constraint.sql` aplicado.
- [ ] Reporte de ventas POS por período (separado del reporte general de Finanzas).

## Fase 13: UX / Navegación

- [x] Sidebar compacto 220px, nav items 34px, entra completo en 100% de zoom.
- [x] Navegación por grupos con divisores: Operaciones / Inventario / Finanzas / Admin.
- [x] Botones circulares Ticket y POS en el header para acceso rápido (iconos Lucide SVG).
- [x] Cards de marketing compactas (padding reducido, fuente más pequeña).
- [x] Toasts de éxito/error y confirm modal reemplazando alert/confirm nativos.
- [x] **Sprint 3 — Design polish:** tipografía Outfit (body) + Orbitron solo brand mark, H1/H2 sin uppercase, iconografía unificada con Lucide, ghost-card shadows removidos, status badges con tokens de marca, marcatextos en finanzas corregido, atajos de teclado (N/P/D//, Escape), validación inline de formularios, empty states con CTAs, success toast, focus rings, scrollbar custom, reduced-motion.
- [x] Simplificar impresión de tickets — un solo botón 🖨 por card que imprime automáticamente el recibo correcto según el estado (recepción / pago / garantía). Opciones específicas disponibles desde el detalle del ticket.
- [ ] Centro de notificaciones — avisos en tiempo real para: ticket asignado, cambio de stage, respuesta en ticket IT. Tickets de Soporte IT con hilo de comentarios y seguimiento de estado visible para quien lo levantó.
- [x] Kanban compacto — columnas 240px, acciones ocultas/hover-reveal, tipografía reducida.
- [x] Click en movimiento reciente en Home → abre vista Finanzas con el registro.
- [x] Refresh mantiene la tab activa (sessionStorage).
- [ ] Kanban tipo Hubspot — expandir card al click para leer info completa (read-only). Actualmente hay que ir a Editar.
- [x] Revisar mobile en celular real (responsive implementado, pendiente QA).
- [ ] Centro de notificaciones en tiempo real — ticket asignado, cambio de stage, comentarios IT.
- [x] Desborde fuera del margen de los tickets y texto . Prioridad medai. *Arreglado con click en tickeet y abrir vista detalladad de ticket*

## Fase 14 - IT 
- [ ] Que en cada task de IT permita la comunciacion IT <> Usuario
- [ ] Poner que se peuda adjuntar fotos en los tickets para IT que crean los usuarios. 

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

- [ ] **[P0] Subir tamaño mínimo de fuente a 12px** — 29 instancias de `font-size: 11px/10px` en labels, badges, report cards, ticket detail. Problema real de legibilidad en mostrador con luz ambiental.
- [ ] **[P0] Quitar `text-transform: uppercase` de `.field label`** — Cada label de formulario está en ALL CAPS 11px. Cambiar a `sentence case` o `Title Case`. Mantener uppercase solo en badges de estado/rol y `th` de tablas.
- [ ] **[P1] Unificar íconos de nav a Lucide** — La navegación mezcla emoji unicode (`⌂ ✦ ◎ ◈ ◉ ₱ $ ≡ ⚙ ⚡`) con Lucide sin criterio. Tickets y Diseño usan el mismo símbolo ✦. Migrar todo a Lucide.
- [ ] **[P1] Extender stagger de animación a todas las vistas** — `card-enter` solo existe en Dashboard y Tickets. Clientes, Productos, Finanzas, Reportes entran planos. Añadir a `.product-card`, filas de clientes, `.report-card`.
- [ ] **[P1] Definir escala de z-index semántica** — Dos elementos con `z-index: 9999` sin escala documentada. Definir tokens: `--z-sticky`, `--z-modal`, `--z-toast`, `--z-tooltip`.
- [ ] **[P1] Corregir colores de RefaxZone (Puebla)** — `brand-config.js` líneas 72-80 muestran `#085ACB` azul para Puebla. Debería ser naranja `#E85D04` según diseño original. El multi-branch theming no está funcionando correctamente.
- [ ] **[P2] Kanban ancho adaptable en pantallas grandes** — `width: 240px` fijo desperdicia espacio en 1440px+. Cambiar a `width: clamp(240px, 22vw, 320px)`.
- [ ] **[P2] Metric grid responsive sin breakpoints fijos** — `repeat(4, minmax(0,1fr))` se estira en pantallas anchas. Cambiar a `repeat(auto-fill, minmax(200px, 1fr))`.
- [ ] **[P2] Toasts descartables** — Ambos toasts tienen `pointer-events: none`. El usuario no puede cerrarlos si bloquean UI. Añadir click para dismiss.
- [ ] **[P2] Skeleton loader en carga inicial** — Durante el `Promise.all` de Supabase las vistas aparecen vacías. Añadir 3-4 cards skeleton con shimmer para mejorar percepción de velocidad.
- [ ] **[P3] Tracking codes en monospace, no Orbitron** — `[FZ] 0001` en Orbitron es difícil de escanear repetidamente. Cambiar a `ui-monospace, 'SF Mono', monospace; font-weight: 700`.
- [ ] **[P3] Hover de botón primario sin `filter: brightness()`** — Causa nuevo stacking context. Cambiar a variante de color directa en el `background` del `:hover`.