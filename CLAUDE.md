# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

FixZone CRM is a **vanilla HTML/CSS/JS single-page app** for managing a cell-phone repair shop. It has no build step and no framework — the browser loads scripts directly via `<script>` tags in `index.html`. The backend is **Supabase** (PostgreSQL + Auth + RLS). Deployed on **Cloudflare Pages** (`fixzone-crm.pages.dev`) — push to `main` triggers auto-deploy.

There are two branches/brands operated from the same codebase:
- **Puerto Vallarta → FixZone** (blue palette, `#085ACB`)
- **Puebla → RefaxZone** (orange palette, `#E85D04`)

Brand theming is driven entirely by `src/brand-config.js` (`window.BRANCH_BRANDS`). Switching the active branch swaps CSS custom properties, logos, and copy at runtime. All dynamic colors use `--fz-primary`, `--fz-primary-rgb`, `--fz-secondary`, etc. — never the legacy `--fz-blue-*` tokens. A block of `!important` rules at the bottom of `app.css` ensures brand tokens override any earlier stylesheet values.

## Running the app

No build step needed. Open `index.html` in a browser or serve it with any static server:

```bash
npx serve .          # or any static file server
python3 -m http.server 8080
```

There is no test suite and no linter configured.

## Key files

| File | Purpose |
|---|---|
| `index.html` | App shell — all view sections are `<section class="view">` |
| `src/app.js` | All client-side logic (~5 500 lines, single file) |
| `src/supabase-config.js` | Supabase project URL and anon key (`window.FIXZONE_SUPABASE`) |
| `src/brand-config.js` | Per-branch brand config — colors, logos, copy, marketing links (`window.BRANCH_BRANDS`) |
| `src/styles/brand-tokens.css` | Static CSS custom properties (fallback values only — JS overrides at runtime) |
| `src/styles/app.css` | All styles — bottom section has `!important` block that binds brand CSS vars to UI elements |
| `assets/brand/fixzone/` | Brand assets folder for FixZone (logos, icons, patterns) |
| `assets/brand/refaxzone/` | Brand assets folder for RefaxZone (logos, icons, patterns) |
| `supabase/schema.sql` | Original DB schema |
| `supabase/02_security_rls.sql` | RLS helper functions and base policies |
| `supabase/03_fix_rls_functions.sql` | `is_active_employee()` and `has_employee_role()` use `auth_user_id OR email` |
| `supabase/08_fix_attachments_and_remaining.sql` | Additive `it` role policies for all tables |
| `supabase/09_normalize_all_roles.sql` | Normalizes frontend roles to DB roles in employees table |
| `supabase/10_storage_bucket_policies.sql` | RLS for `ticket-photos` Storage bucket |
| `supabase/12_discount_fields.sql` | Adds discount_code, discount_amount, discount_pct to service_tickets |
| `supabase/13_pos_tables.sql` | POS tables: pos_sales, pos_sale_items, stock-decrement trigger, RLS |
| `supabase/14_inventory_vallarta.sql` | Initial Puerto Vallarta product/inventory seed data |
| `supabase/15_supply_stock_link.sql` | Adds `product_id` FK to supply_purchases; auto-increments stock on purchase |
| `supabase/16_quote_items.sql` | `quote_items` JSONB column on service_tickets for cotización line items |
| `supabase/17_pos_stock_constraint.sql` | `CHECK (stock >= 0)` constraint on products |
| `supabase/18_discount_codes.sql` | `discount_codes` table with scope, date range, usage tracking, RLS |
| `supabase/19_nullable_customer_device.sql` | `customer_id` DROP NOT NULL in customer_devices (walk-in tickets) |
| `supabase/20_backfill_ticket_payments.sql` | Backfills missing Ingreso transactions for tickets with paid_amount > 0 |
| `supabase/21_service_prices.sql` | `service_types` + `service_prices` tables — price matrix device × service, RLS |
| `supabase/21b_dedup_service_types.sql` | Deduplicates service_types and adds UNIQUE(name) constraint |
| `supabase/22_variant_prices.sql` | Adds `variant` column to service_prices — multiple prices per cell (e.g. screen quality) |
| `supabase/22_service_type_default_price.sql` | Adds `default_price` to service_types — precio base global por servicio (ej. Diagnóstico $350) |
| `supabase/23_cotizacion_ref.sql` | Adds `cotizacion_ref` + `converted_to_ticket` to service_tickets — traceabilidad bidireccional |
| `supabase/24_ticket_payment_method.sql` | Adds `payment_method` to service_tickets — método de pago por ticket para uso interno y reportes |
| `supabase/25_transaction_receipt_url.sql` | Adds `receipt_url` to transactions — adjuntar comprobante a egresos registrados manualmente |
| `supabase/26_supply_purchase_transaction_link.sql` | Adds `transaction_id` FK to supply_purchases — vincula cada compra de insumos con su transacción de Egreso |
| `supabase/27_invoices.sql` | `invoices` table (Contaduría) — registro de facturas emitidas/recibidas, estado pendiente/facturado, vínculo opcional a `transactions`, RLS restringido a admin/it + Kevin Mijangos |
| `supabase/28_it_role_pos_tables.sql` | Additive `"it can manage *"` policies for `pos_sales`/`pos_sale_items` — migration 13 (POS tables) predates 08 and never got the `it` role policy, so employees with role `it` got an RLS violation on POS checkout |
| `supabase/30_brand_assets.sql` | `brand_assets` table (Diseño) — repositorio de archivos de marca (logos en variantes, íconos), RLS abierto a empleados activos, separado del Editor de marca |
| `supabase/31_notifications.sql` | `notifications` table (centro de notificaciones / campanita) — avisos compartidos en Supabase, `recipient_id`/`branch_id` null = broadcast a todos, `read_by` jsonb array de employee.id, RLS: cualquier empleado activo puede leer y marcar como leído, solo admin/it/owner pueden insertar |
| `supabase/32_support_task_comments.sql` | `support_task_comments` table — hilo de conversación IT ↔ Usuario por tarea de soporte (`support_tasks`), RLS abierto a empleados activos; agrega además una policy en `notifications` que permite a cualquier empleado activo enviar avisos dirigidos (`recipient_id` no nulo) — los broadcasts siguen restringidos a admin/it/owner |
| `supabase/33_support_task_attachments.sql` | Agrega `task_id` a `attachments` (FK a `support_tasks`, nullable) + policy adicional para que cualquier empleado activo gestione adjuntos de tareas de soporte (`task_id is not null`) — permite subir fotos a tickets de IT desde "Mis solicitudes" y "Editar tarea", reutilizando el bucket `ticket-photos` con prefijo `support/` |
| `supabase/34_customer_referral_source.sql` | Agrega `how_found` y `how_found_other` a `customers` — registra el canal por el que un cliente nuevo conoció el negocio (Instagram, Facebook, Transeúntes, Conocidos de Moni, Otro) |
| `supabase/35_ticket_waiting_part.sql` | Agrega `waiting_part` (boolean) y `waiting_part_note` a `service_tickets` — marca rápida "⏳ Esperando pieza" en la tarjeta del ticket, independiente de la etapa del kanban |
| `supabase/functions/scan-receipt/` | Edge Function — recibe imagen base64, llama a Gemini vision API (free tier, `gemini-3.1-flash-lite`), devuelve campos extraídos del comprobante (para insumos, devuelve un array `items[]` con una línea por producto del ticket). PDFs caen a llenado manual. Requiere secret `GEMINI_API_KEY`. |

## Architecture

### Navigation structure

The sidebar (220px wide) groups views by workflow with `<hr class="nav-divider">` separators:

| Group | Views |
|---|---|
| Operaciones | dashboard, tickets, cotizaciones, pos, clients |
| Inventario | products, supplies, precios |
| Finanzas | finance, reports |
| Admin | users, soporte, diseno, automatizacion |

Nav tooltips are defined in `NAV_TOOLTIPS` (keyed by `data-view`) and rendered by `initNavTooltips()`. Add a new entry there whenever a new view is added.

### Auth flow
Login uses **username + password**. The username is converted to an internal email (`username@fixzone.internal`) and passed to `supabase.auth.signInWithPassword`. After login, `resolveCurrentEmployee()` looks up the employee record by `auth_user_id` (not email). The app blocks access if the user is not in `employees` with `status = 'active'`.

### Role & permission system

**Frontend PERMISSIONS map** (keyed by DB role value stored in `employees.role`):

| DB role | UI label | Access level |
|---|---|---|
| `admin` | Admin | Full access |
| `technician` | Estándar | Tickets, clients, products, supplies, POS, view-only finance |
| `marketing` | Marketing | Tickets, clients, design, automation |
| `sales` | Ventas | Tickets, clients, products, supplies, POS, manage finance |
| `viewer` | Solo lectura | Dashboard, reports only |

The `PERMISSIONS` map in `app.js` is the source of truth for which tabs are visible and which actions are enabled. It is **editable at runtime** via the "Permisos por Rol" editor in the Usuarios section — saved to `localStorage` key `fixzone-role-permissions-v1` and loaded at startup via `loadSavedPermissions()`.

`PERM_SECTIONS` lists all tabs that can be toggled in the permissions editor. When adding a new view, add it to both `PERMISSIONS` (for each role) and `PERM_SECTIONS`.

**Important:** The Edge Function `create_employee` maps frontend role labels to DB roles at creation time:
- `it` → `owner` (then normalized to `admin` via migration 09)
- `standard` → `technician`
- `marketing` → `technician`
- `admin` → `admin`

### RLS architecture
All RLS policies use two helper functions in the `private` schema:
- `private.is_active_employee()` — checks `auth_user_id = auth.uid() OR lower(email) = current_user_email()` plus `status = 'active'`
- `private.has_employee_role(allowed_roles text[])` — same lookup plus `role = any(allowed_roles)`

Both functions are `security definer` (bypass RLS when querying employees, no circular dependency). The active DB roles in policies are `owner`, `admin`, `it`, `technician`, `sales`. Additive policies named `"it can manage *"` grant the `it` role the same write access as `admin` across all tables.

### Multi-branch data isolation
All per-branch tables have a `branch_id` FK to `public.branches`. The frontend filters with `branchTickets()`, `branchTransactions()`, etc. using `!t.branch || t.branch === activeBranchId` (permissive — records with unresolved branch show everywhere rather than disappearing). In remote mode, `branchSupplies()` and `branchTransactions()` use the same permissive logic.

### State management
- `state` is the in-memory object holding all data: `tickets`, `clients`, `products`, `supplies`, `transactions`, `employees`, `branches`, `supportTasks`, `posSales`, `discounts`, `serviceTypes`, `servicePrices`
- `reloadState()` fetches all tables from Supabase in a `Promise.all` and overwrites state. If any individual query returns empty, the corresponding key falls back to `seed` data
- `reloadState()` failure after a successful INSERT is **non-fatal** — caught with `console.warn`, UI still renders with the locally-added record
- `createRemoteTicket` and `createRemoteTransaction` use `.select().single()` to get the created row back and add it to state immediately, so the kanban/dashboard updates even if `reloadState()` subsequently fails

### View routing
Navigation is purely DOM-based: `.nav-item[data-view]` buttons toggle the `is-visible` class on `<section class="view" id="{view}-view">` elements via `setView()`.

### Modal / form system
A single `<dialog id="record-modal">` is reused for all create/edit forms. `app.js` dynamically builds form fields and wires save logic by inspecting `activeForm` (the form type string) and `editingTicketId` (the record ID being edited, used for all entity types not just tickets).

**Opening/closing `#record-modal`**: always use `openModal()` to open it (never call `modal.showModal()` directly) and `closeModal()` to close it. `closeModal()` plays a 150ms exit animation via `.is-closing` before calling `dlg.close()`. `openModal()` clears any in-flight close (token-based) and force-closes/reopens the dialog cleanly — this prevents the dialog from getting stuck with `.is-closing` (opacity:0) while `::backdrop` stays visible, which looked like the screen going dim until the user pressed ESC.

**Submit guard**: `recordForm`'s submit handler bails early if `recordForm.dataset.submitting === "true"` and disables `#save-record` while a save is in flight, to prevent duplicate records from rapid double-clicks on "Guardar".

**activeForm values and their handlers:**

| activeForm | create path | edit path |
|---|---|---|
| `"ticket"` | `createRemoteTicket` | `updateRemoteTicket` |
| `"client"` | `createRemoteClient` | `updateRemoteClient` |
| `"product"` | `createRemoteProduct` | `updateRemoteProduct` |
| `"supply"` | `createRemoteSupply` | `updateRemoteSupply` |
| `"transaction"` | `createRemoteTransaction` | `updateRemoteTransaction` |
| `"supportTasks"` | `saveRemoteSupportTask` | `updateRemoteSupportTask` |
| `"employee"` | Edge Function `create` | Edge Function `update` |

### Punto de Venta (POS)

The POS view (`#pos-view`) handles **direct retail sales** — selling products from inventory without opening a repair ticket.

**POS vs Ticket distinction:**
- **Ticket**: repair service — has a device, kanban stages, assigned technician, `ticket_items` for parts used in the repair
- **POS**: direct retail sale — no device, no stages, immediate checkout, stock decremented automatically via DB trigger

**POS state variables** (module-level in `app.js`):
- `posCart` — array of `{productId, name, qty, unitPrice, maxStock}`
- `posCatalogFilter` — `"all"` | `"producto"` | `"refaccion"`
- `posDiscount` — discount amount in MXN
- `posDiscountCode` — promo code string currently applied in the cart (empty string = none)
- `posPaymentMethod` — selected payment method string

**Checkout flow (`checkoutPos()`):**
1. INSERT `pos_sales` → get sale `id`
2. INSERT `pos_sale_items` for each cart line → DB trigger `pos_sale_items_decrement_stock` decrements `products.stock`
3. INSERT `transactions` (type: `"Ingreso"`, category: `"Venta"`, concept: `"POS: …"`)
4. UPDATE `pos_sales.transaction_id` to link the transaction
5. Update local state immediately; call `reloadState()` in background

**Important:** `supabase/13_pos_tables.sql` must be applied in the Supabase SQL Editor before the POS section works in production. Without it, checkout will fail with a table-not-found error.

**Discount codes in POS**: the cart panel shows a "Código descuento" text input + "Aplicar" button. On apply, `applyDiscount(subtotal, code, "pos")` validates against `state.discounts` (loaded from `discount_codes` table). A valid code sets `posDiscount` and `posDiscountCode`; typing a manual amount in the discount field clears `posDiscountCode`.

### Cotizaciones

Cotizaciones are quotes stored as `service_tickets` with `stage = "Cotización"`. They have their own serial (`[COT] 0001`) separate from repair tickets (`[FZ] 0001`).

**Quote line items** — stored in `ticket.quoteItems` (JSONB array in `quote_items` column, migration 16). Each item: `{type, description, qty, unitPrice}`. The builder (`buildQuoteItemsSection()`) renders add/remove rows and updates running totals with discount. Hidden inputs `name="discountCode"` and `name="discountAmount"` in the form are picked up automatically by `FormData` on submit.

**Discount in cotización**: `applyDiscount(subtotal, code, "cotizacion")` validates scope. The `#qi-apply-code` button updates the hidden inputs and shows status text. On approval (converting to ticket), the discount values are preserved in the ticket.

**Reportes — secciones activas** (cada una tiene un `<div id="reports-*">` en `index.html`, renderizado por `renderReports()`):
- `#reports-grid` — tarjetas resumen (ingresos, egresos, balance, tickets cerrados, inventario, stock bajo)
- `#reports-cash` — movimientos por categoría del período
- `#reports-profit` — utilidad estimada: tarjetas ingresos/egresos/neta, barra de margen %, tabla por categoría
- `#reports-pos` — ventas POS del período: tarjetas resumen (total, ticket promedio, # ventas, descuentos), desglose por método de pago, tabla detalle últimas 30 ventas
- `#reports-cotizaciones` — métricas de cotizaciones del período: tasa de conversión, convertidas/pendientes/no convertidas, monto promedio (todas vs convertidas), tabla detalle últimas 20
- `#reports-referral` — clientes nuevos del período agrupados por `how_found` ("¿Cómo nos conocieron?": Instagram, Facebook, Transeúntes, Conocidos de Moni, Otro, Sin especificar), con detalle de especificaciones libres para "Otro"
- `#reports-payment-methods` — ingresos por método de pago (Efectivo, Transferencia, Terminal TC/TD, Link de pago, etc.) del período
- `#reports-ticket-payment` — tickets pagados por método de pago del período (monto cobrado y # tickets por método)
- `#reports-monthly` — balance mensual histórico completo (ignora filtro de período)
- `#reports-tickets` — tickets por etapa con barra de distribución
- `#reports-devices` — top 20 equipos más frecuentes por sucursal (historial completo): tickets, cerrados, ingresos
- `#reports-stock` — productos con stock bajo
- `#reports-productivity` — productividad por empleado

**Print**: `printCotizacion(ticket)` writes a formal quote layout (logo, line-item table, subtotal, discount, total, validity, signature) into `#print-receipt` and calls `window.print()`. Width follows the 58/80mm toggle in localStorage (same as receipt printing).

**WhatsApp**: `shareQuoteWhatsApp(ticketId)` builds a `wa.me?text=` URL. If the `"cotizacion"` WA template (Automatización tab) is non-empty it fills `{cliente}`, `{total}`, `{items}` variables; otherwise it auto-formats a message with all line items. Opens in a new tab.

**Quote line items** — each item now has an optional `insumoCost` field. When `insumoCost > 0` and type is "Servicio", `calcPrecio({ insumo, tipo })` auto-calculates the final price using the configured margins. Glass is detected by `/glass/i` in the service name. Price field turns green when auto-calculated; technician can still override manually.

**Conversion**: "Aprobar" button on a cotización assigns a **new `[FZ]` tracking number**, saves the original `[COT]` folio as `cotizacion_ref` on the ticket, and saves the new `[FZ]` folio as `converted_to_ticket` on the cotización. Bidirectional traceability is visible on both cards.

**Cotizador → Cotización**: The `renderCotizador()` widget in the Precios view has a "📋 Crear cotización con este precio" button that pre-fills `openForm("cotizacion", prefill)` with the calculated price as a Servicio line item.

### Discount Codes

Discount codes live in the `discount_codes` Supabase table (migration 18). They are loaded into `state.discounts` at startup by `loadSupabaseState()`.

**Key functions:**
- `applyDiscount(baseAmount, code, scope)` — finds a matching active code from `state.discounts`, checks date range, scope array, and usage limit; returns `{amount, pct, label, valid, id}`.
- `markDiscountUsed(discountId)` — increments `used_count` in-memory and in Supabase. Called by `checkoutPos()` and cotización/ticket save paths when a code was applied.
- `renderDiscountManager()` — full CRUD UI in the Marketing tab; reads/writes `discount_codes` via Supabase.

**Schema**: `code` (unique), `type` (`fixed`|`percent`), `value`, `scope` (text array, e.g. `['pos','cotizacion','ticket']`), `valid_from`, `valid_until`, `max_uses`, `used_count`, `active`, `branch_id`.

**Scope values**: `"pos"`, `"cotizacion"`, `"ticket"` — a code with scope `['pos']` will be rejected when applied in a cotización.

### Contaduría

The Contaduría view (`#contaduria-view`, nav `data-view="contaduria"`) tracks invoices — both **emitidas** (issued to clients) and **recibidas** (received for expenses: insumos, herramientas, servicios como luz/internet, facturación de fin de mes), with a "pendiente / facturado" status and an optional PDF/image attachment.

**Access**: only `admin`/`it`/`owner` roles, plus a hardcoded exception for the employee **Kevin Mijangos** regardless of his DB role. `currentPerms()` adds `"contaduria"` to the tabs array when `currentEmployee.full_name` (case-insensitive) equals `"kevin mijangos"`. On the DB side, RLS uses `private.is_admin_it_or_kevin()` (migration 27), which checks the same condition by `full_name`.

**Schema** (`invoices` table, migration 27): `type` (`Emitida`|`Recibida`), `status` (`Pendiente`|`Facturado`), `folio`, `party_name`, `party_rfc`, `concept`, `amount`, `invoice_date`, `transaction_id` (optional FK to `transactions`), `file_url`, `branch_id`.

**State**: `state.invoices`, loaded by `loadSupabaseState()` and merged in `reloadState()`. `branchInvoices()` filters by `activeBranchId` (permissive, like other branch helpers).

**File attachment**: reuses `uploadReceiptFile()` / `buildReceiptUploadSection()` (same `ticket-photos` bucket, `receipts/` path) — no new storage bucket needed since storage RLS policies are bucket-wide, not path-scoped.

**Filters**: `renderContaduria()` applies `contaduriaStatusFilter` (`"all"|"Pendiente"|"Facturado"`) and `contaduriaTypeFilter` (`"all"|"Emitida"|"Recibida"`), set via `[data-cta-status]` / `[data-cta-type]` buttons in the filter bar.

### Device autocomplete

The "Producto / equipo" field in ticket and cotización forms uses `ftype = "device-autocomplete"` — renders a custom dropdown instead of native `<datalist>` (which is inconsistent across browsers).

**Key constants and functions:**
- `DEVICE_MODELS_KEY = "fixzone-device-models-v1"` — localStorage key for saved models
- `DEFAULT_DEVICE_MODELS` — ~100 pre-loaded models: iPhone 6–16, Samsung Galaxy S/A/Note/Fold, Motorola Moto G, Xiaomi/Redmi, Huawei, LG, tablets
- `loadDeviceModels()` — reads localStorage, falls back to `DEFAULT_DEVICE_MODELS`
- `saveDeviceModel(name)` — appends a new model to localStorage (deduplicates, re-sorts)
- `getAllDeviceNames()` — merges localStorage models + `state.tickets[].productName`, deduped, sorted
- `initDeviceAutocomplete(container?)` — attaches custom dropdown behavior to all `input[data-device-ac]` in the given container (default: `formFields`). Pass a different container (e.g. `mxEl` in `renderPrecios`) to use outside the modal.

**How it works:** `fieldTemplate("device-autocomplete")` renders `<div class="device-ac-wrapper"><input data-device-ac /></div>`. After `formFields.innerHTML = ...`, call `initDeviceAutocomplete()` to wire up filtering, keyboard nav, and the `+ Agregar "X"` option. Must be called in `openForm()` and both paths in `openEditTicket()`.

**Pitfall:** `initDeviceAutocomplete()` must be called **after** `formFields.innerHTML` is set — calling it before means no `input[data-device-ac]` elements exist yet.

### Marketing & Automation links

Marketing quick-links and automation tools are stored in `localStorage` (not Supabase):
- `fixzone-mkt-links-v1` — array of `{icon, name, url, desc}` objects
- `fixzone-auto-tools-v1` — same shape, default populated from `DEFAULT_AUTO_TOOLS`

**`renderMarketingLinksGrid(container, links, onSave)`** — reusable inline editor used by both marketing links and automation tools sections. Renders a grid of clickable cards in view mode; switches to row-based input form in edit mode. Anti-accumulation pattern: `container.cloneNode(false)` + `replaceWith()` on each call to avoid stacking click listeners.

### WhatsApp templates

Templates stored in `localStorage` key `fixzone-wa-templates-v1`. Default keys:
- `cotizacion` — empty by default (falls back to auto-formatted message with line items)
- `listo`, `abono`, `pagado`, `garantia` — status-based message templates

Available variables: `{cliente}`, `{equipo}`, `{sucursal}`, `{folio}`, `{monto}`, `{saldo}`, `{total}`, `{items}`. `fillWATemplate()` handles substitution. Templates are editable in the Automatización tab. Each template has a 📋 **Copiar** button to copy the raw text (with variables) to clipboard.

### Mensajes rápidos

Repertorio de mensajes de atención al cliente, copiables con un clic. Stored in `localStorage` key `fixzone-quick-messages-v1`. Default messages: saludo inicial, horarios, tiempo de reparación, garantía, equipo listo, despedida, no tenemos el modelo.

- `loadQuickMessages()` / `saveQuickMessages(msgs)` — read/write localStorage
- `renderQuickMessages()` — renders the section in `#quick-messages-manager` (Automatización tab). View mode shows cards with 📋 Copiar; edit mode allows add/delete/rename/reorder + Restaurar defaults.

### Tabla de Precios (vista Precios)

La vista `#precios-view` tiene dos secciones: la **matriz de precios** y el **cotizador rápido**.

**Tabla de precios (matrix):**
- Filas = modelos de dispositivo; columnas = tipos de servicio (`service_types`)
- Precios guardados en `service_prices` — `UNIQUE(device_model, service_type_id, branch_id, variant)`
- Cada celda puede tener **un precio único** o **variantes** (ej. "Original", "Genérica") — migration 22 añade columna `variant`
- Si hay una sola variante con precio > 0, muestra el precio directo; si hay múltiples, muestra `N precios ▾` con popover
- Tipos de servicio se gestionan (añadir/eliminar) desde la misma vista; eliminar un tipo borra todos sus precios en cascada
- `branchServicePrices()` filtra `state.servicePrices` por `branchId` activo

**Cotizador rápido** (`#precios-cotizador`):
- Rendered by `renderCotizador()`, called from `renderPrecios()` and the Tickets view
- Buttons: Pantalla / Glass; input: costo del insumo; sliders: márgenes (admin only)
- Formula: `calcPrecio({ insumo, tipo, config })` — returns `{ precioFinal, precioPantalla, ganancia, iva, mpCosto, comTec, utilidad, margenNeto }`
- Config stored in `localStorage` key `fixzone-pricing-config`; defaults in `PRICING_CONFIG_DEFAULT`
- "📋 Crear cotización" button pre-fills a new cotización with the calculated price

**Precio base por servicio** (`default_price` en `service_types`):
- Cada servicio puede tener un precio fijo que aplica cuando no hay precio específico en la matriz
- Editable inline en la sección "Servicios configurados" de la vista Precios
- Lookup en cotizaciones: device-specific price → fallback to `stype.defaultPrice`
- Migration `22_service_type_default_price.sql` añade la columna y seeds Diagnóstico/Limpieza en $350

**State:**
- `state.serviceTypes` — array de `{id, name, sortOrder, defaultPrice}`
- `state.servicePrices` — array de `{id, deviceModel, serviceTypeId, price, branchId, notes, variant}`

**Pitfalls:**
- Migrations 21 + 21b + 22 (`variant_prices`) + `22_service_type_default_price` + 23 deben estar aplicadas
- `21b_dedup_service_types.sql` solo corre si ya había duplicados; es seguro correrla siempre
- `22_service_type_default_price.sql` es independiente de `22_variant_prices.sql` — ambas deben aplicarse

### Print helpers

- `doPrint()` — must be used instead of `window.print()` in all print functions. Injects `<style id="fz-print-size">` with a hardcoded `@page { size: Xmm auto; margin:0 }` before printing. Chrome/Chromium does not evaluate `var()` inside `@page { size }`, so the CSS custom property `--receipt-width` is ignored without this fix — resulting in Letter/A4 paper and blank space at the bottom of every receipt.

### Supabase SQL files (apply in order)
SQL files in `supabase/` are applied manually in the Supabase SQL Editor:
1. `schema.sql` — base tables, triggers, indexes, sequences
2. `01_tables_and_seed.sql`, `01a_missing_purchase_tables.sql`, `01b_ticket_tables_repair.sql` — additive table patches
3. `02_security_rls.sql` — base RLS policies and helper functions
4. `03_fix_rls_functions.sql` — update helper functions to use `auth_user_id`
5. `07_restore_select_policies.sql` — restore SELECT policy on service_tickets
6. `08_fix_attachments_and_remaining.sql` — additive `it` role policies for all tables
7. `09_normalize_all_roles.sql` — normalize employee roles to valid DB values
8. `10_storage_bucket_policies.sql` — Storage bucket RLS for `ticket-photos`
9. `11_merge_owner_into_admin.sql` — merge `owner` → `admin`
10. `12_discount_fields.sql` — discount fields on service_tickets
11. `13_pos_tables.sql` — POS tables, RLS, and stock-decrement trigger
12. `14_inventory_vallarta.sql` — initial Puerto Vallarta product/inventory seed
13. `15_supply_stock_link.sql` — `product_id` FK on supply_purchases, auto-increments stock
14. `16_quote_items.sql` — `quote_items` JSONB column on service_tickets (cotización line items)
15. `17_pos_stock_constraint.sql` — `CHECK (stock >= 0)` constraint on products
16. `18_discount_codes.sql` — `discount_codes` table with scope, date range, usage tracking, RLS
17. `19_nullable_customer_device.sql` — `customer_id` DROP NOT NULL in customer_devices
18. `20_backfill_ticket_payments.sql` — backfill missing Ingreso transactions for paid tickets
19. `21_service_prices.sql` — `service_types` and `service_prices` tables with RLS
20. `21b_dedup_service_types.sql` — deduplicate service_types and add UNIQUE(name) (run only if 21 was already applied)
21. `22_variant_prices.sql` — add `variant` column to service_prices for multi-price cells
22. `22_service_type_default_price.sql` — add `default_price` to service_types; seed Diagnóstico/Limpieza $350
23. `23_cotizacion_ref.sql` — add `cotizacion_ref` + `converted_to_ticket` to service_tickets
24. `24_ticket_payment_method.sql` — add `payment_method` to service_tickets
25. `25_transaction_receipt_url.sql` — add `receipt_url` to transactions
26. `26_supply_purchase_transaction_link.sql` — add `transaction_id` FK to supply_purchases, linking each purchase to its Egreso transaction
27. `27_invoices.sql` — `invoices` table for Contaduría, `private.is_admin_it_or_kevin()` helper, RLS
28. `28_it_role_pos_tables.sql` — additive `"it can manage *"` policies for `pos_sales`/`pos_sale_items` (missed by migration 08, which predates the POS tables from migration 13)
29. `29_ticket_notes_anon.sql` — anon SELECT on `ticket_events` notes + `add_ticket_note_public()` for ticket-track/ticket-tech public pages
30. `30_brand_assets.sql` — `brand_assets` table for the Diseño brand asset library, RLS open to active employees
31. `31_notifications.sql` — `notifications` table for the centro de notificaciones (campanita) — shared broadcast/aviso storage, replaces the old localStorage-only notification center
32. `32_support_task_comments.sql` — `support_task_comments` table for IT ↔ Usuario comment threads on support tasks; also adds a `notifications` INSERT policy allowing any active employee to send targeted (non-broadcast) notifications
33. `33_support_task_attachments.sql` — adds `attachments.task_id` (FK to `support_tasks`) plus an additive RLS policy so any active employee can manage attachments where `task_id is not null`
34. `34_customer_referral_source.sql` — adds `how_found` and `how_found_other` to `customers` for the "¿Cómo nos conocieron?" referral-source field
35. `35_ticket_waiting_part.sql` — adds `waiting_part` (boolean) and `waiting_part_note` to `service_tickets` — quick "esperando pieza" flag, independent of kanban stage

Files 04–06 (intermediate fixes) are superseded by 07–11 and do not need to be re-applied.

### Edge Functions
Three Deno Edge Functions in `supabase/functions/`:
- `create_employee/` — create/update/delete/reset_password for employees. Uses service-role key. Maps frontend roles to DB roles at insert/update time. Sets `email = username@fixzone.internal` on insert so RLS email lookup works.
- `login-employee/` — legacy bcrypt login, not used in current auth flow.
- `scan-receipt/` — receives a base64 image of a purchase receipt and returns extracted fields (date, supplier, items[] — array of `{description, quantity, total}`, one per line item / or concept, category, amount for transactions / or invoice_date, type, party_name, party_rfc, folio, concept, amount for invoices) using Google Gemini's vision API (free tier, model `gemini-3.1-flash-lite`, `response_mime_type: application/json`). PDF input is not supported — falls back to manual entry. **Requires `GEMINI_API_KEY` set via `supabase secrets set GEMINI_API_KEY=...`** — get a free key at https://aistudio.google.com/apikey.

## Branch branding

To add or change brand config, edit `src/brand-config.js` under `window.BRANCH_BRANDS["Branch Name"]`. The object shape includes `colors` (CSS custom properties), `marketingLinks`, `autoFlows`, logo paths, and copy strings. `window.getBranchBrand(branchName)` is the accessor used throughout `app.js`.

**Runtime brand editor** (tab Diseño → "Editor de marca"): marketing can change the color palette and logo directly from the UI. Changes are saved to `localStorage` key `fixzone-brand-overrides-v1` keyed by branch name and re-applied on `applyBranchBrand()`. Logo can be uploaded as a file (stored as base64) or pasted as a URL. To reset to code defaults, use "Restaurar defaults" in the editor.

**Brand asset folders**: `assets/brand/fixzone/` and `assets/brand/refaxzone/` hold official logos and graphic files. Place PNG/SVG files here and reference their paths in `brand-config.js` (`logoSrc`, `logoMonoSrc`).

**CSS variable pattern**: `applyBranchBrand(branchName)` sets all `--fz-*` properties as inline styles on `:root` via `root.style.setProperty()`. Any CSS rule that needs brand-aware color must use `var(--fz-primary)`, `rgba(var(--fz-primary-rgb), alpha)`, etc. Never use `--fz-blue-*` tokens — those are legacy static values left as fallbacks in `brand-tokens.css`.

## UI language

All UI text, form labels, status values, and copy are in **Spanish**.

## Supabase project

- Project ID: `zwmffnrkrrowmchluyyy`
- Branches: `Puerto Vallarta`, `Puebla`
- Storage bucket: `ticket-photos` (public read, authenticated write/delete)
- Active employees: Kevin Mijangos, Carlos Mijangos, Gigi Vargas, Monica Torres, Diego Mijangos, Daniel Mijangos

## Common pitfalls

- **`editingTicketId` is used for all entity edits**, not just tickets. When editing a product, `editingTicketId = productId`. This is intentional (naming artifact).
- **`activeForm` must match exactly** — `"supportTasks"` (with 's') for both create and edit of support tasks. Using `"supportTask"` (without 's') causes "Tipo no soportado" error.
- **`branchIdByName(name)`** has a 3-step fallback: in-memory lookup → direct DB query → first branch. If branches fail to load, the last resort may return the wrong branch. Ensure `is_active_employee()` works for the current user.
- **RLS `with check` vs `using`**: INSERT only uses `with check`. SELECT only uses `using`. UPDATE uses both. A passing INSERT does not guarantee SELECT will return the row — both need separate policies.
- **`reloadState()` seed fallback**: if a table's SELECT returns 0 rows (RLS block or query error), that table falls back to hardcoded `seed` data. Newly created records won't appear. Check `pg_policies` if data seems stale.
- **Brand colors in CSS**: never add `rgba(47,111,255,...)` or `#2F6FFF` hardcoded in `app.css` — those won't switch with the branch. Always use `rgba(var(--fz-primary-rgb), alpha)` and `var(--fz-primary)`.
- **Optional form fields**: the `fieldTemplate(name, label, ftype, opts, wide, defaultValue, optional)` function controls `required` attribute. Pass `true` as 6th element in the field tuple (schema) and `optional` as 7th arg to `fieldTemplate` to make a field non-required. Currently: `discountCode`, `discountAmount`, `notes` are optional in the ticket schema.
- **`fieldTemplate` numeric inputs use `step="0.01"`** by default so monetary fields (`total`, `price`, `amount`, `repairAmount`, `paidAmount`, `discountAmount`, etc.) accept decimals. Standalone hardcoded `<input type="number">` for prices (cotizador, tabla de precios, quote items) also use `step="0.01"` — only true integer counters (`qty`, `part-qty`) should keep `step="1"`.
- **Deleting a supply (Insumos)**: `deleteRemoteSupply(supplyId)` deletes from `supply_purchases` (or local state if not a UUID) and is wired via `data-delete-supply` in `renderSupplies()`. It also deletes the linked Egreso transaction via `supply_purchases.transaction_id` (migration 26).
- **Editing a supply (Insumos)**: `updateRemoteSupply()` keeps the linked Egreso transaction (`supply_purchases.transaction_id`, migration 26) in sync — date, concept, and amount are updated together. Without migration 26 applied, `transaction_id` is always null and the linked transaction is left stale.
- **Sidebar tooltip position**: `NAV_TOOLTIPS` renders tooltips at `left: 220px` (sidebar width). If the sidebar width changes, update that value in `initNavTooltips()`.
- **Adding a new view**: (1) add nav button in `index.html`, (2) add `<section class="view" id="{name}-view">`, (3) add `"{name}"` to the relevant role tabs in `PERMISSIONS`, (4) add to `PERM_SECTIONS`, (5) add entry to `NAV_TOOLTIPS`, (6) call `render{Name}()` from `render()`.
- **POS requires migration 13**: `supabase/13_pos_tables.sql` must be applied in the Supabase SQL Editor. Until then, `checkoutPos()` will throw a table-not-found error.
- **Cotizaciones require migration 16**: `supabase/16_quote_items.sql` adds the `quote_items` JSONB column. Without it, saving a cotización with line items will silently discard them.
- **Discount codes require migration 18**: `supabase/18_discount_codes.sql`. Without it, `state.discounts` stays `[]` and all discount code lookups fail silently (returns `{valid: false}`).
- **`applyDiscount` scope must match exactly**: valid scope values are `"pos"`, `"cotizacion"`, `"ticket"`. A mismatch (e.g. passing `"tickets"`) always returns `{valid: false}` — check the scope array in the `discount_codes` row and the call site.
- **`markDiscountUsed` must be called after a successful save** — not before. If the INSERT/UPDATE fails after calling it, the usage counter will be incremented with no matching transaction.
- **`renderMarketingLinksGrid` anti-accumulation**: always call it with the same DOM node reference; it internally calls `container.cloneNode(false)` + `replaceWith()`. Do not attach external click listeners to the container after calling this function — they'll be lost on the next render.
- **Browser cache after deploy**: Cloudflare Pages may serve cached JS/CSS. Users should hard-refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`) after a new deploy if they see stale styles.
- **Tabla de Precios requires migrations 21 + 21b + 22**: Without 21, `state.serviceTypes` and `state.servicePrices` stay `[]` and the matrix renders empty. Without 22, the `variant` column is missing and multi-price upserts will fail with a constraint error.
- **`variant` column default is `''`** (empty string, not null): the UNIQUE constraint is `(device_model, service_type_id, branch_id, variant)`. Always pass `variant: ""` when upserting a single-price cell; omitting it causes a null vs "" mismatch that creates duplicate rows.
- **`22_service_type_default_price.sql` and `22_variant_prices.sql` are both numbered 22** — this is intentional (created independently). Apply both; order between them doesn't matter.
- **Traceability migrations require 23**: Without `23_cotizacion_ref.sql`, approving a cotización will throw a column-not-found error on `cotizacion_ref` update.
- **`calcPrecio()` formula**: `precio = (insumo × (1 + margen)) × 1.16 × 1.0406`. Glass applies an additional discount: `precioFinal = precioPantalla × (1 - glassDesc)`. Never hardcode margin values — always read from `loadPricingConfig()`.
- **Quote item `insumoCost`**: stored in `quoteItems` JSONB array per item. When > 0, `calcPrecio()` is called client-side to auto-fill `unitPrice`. The `insumoCost` is for internal reference only — not shown on client-facing receipts.
- **Contaduría requires migration 27**: `27_invoices.sql` creates the `invoices` table and `private.is_admin_it_or_kevin()`. Without it, `state.invoices` stays `[]` and the Contaduría view renders empty for everyone, including Kevin.
- **Contaduría access for Kevin is name-based, not role-based**: if Kevin Mijangos is ever renamed in `employees.full_name`, both `currentPerms()` (frontend) and `private.is_admin_it_or_kevin()` (RLS) must be updated to match — they compare `lower(full_name) = 'kevin mijangos'`.
- **POS checkout for `it`-role employees requires migration 28**: `28_it_role_pos_tables.sql` adds the missing `"it can manage *"` policies for `pos_sales`/`pos_sale_items`. Without it, employees with `role = 'it'` (never normalized to `admin`) get a "violates row-level security policy" error on `checkoutPos()`.
- **Escaneo de comprobantes con múltiples artículos (Insumos)**: `scan-receipt` now returns `items[]` (one entry per line item) instead of a single `item`/`quantity`/`total`. When `formType === "supply"` and `fields.items.length > 1`, `openReceiptScanner()` shows a review screen (`showMultiItemReview()`) where each line can be edited/removed before saving — "Guardar todos" calls `createRemoteSupply()` once per row, all sharing the same uploaded receipt file. Single-item receipts still prefill the normal supply form.
- **Biblioteca de assets de marca requires migration 30**: `30_brand_assets.sql` creates the `brand_assets` table. Without it, `state.brandAssets` stays `[]` and `renderBrandAssetLibrary()` (tab Diseño) renders an empty gallery — uploads will fail with a table-not-found error. This is intentionally separate from `renderBrandEditor()` (the "Editor de marca" above it): uploading here only stores a file + lists it for download/copy, it never touches `--fz-logo-src` or any active branding.
- **Centro de notificaciones requires migration 31**: `31_notifications.sql` creates the `notifications` table. Without it, `state.notifications` stays `[]`, the badge never shows unread counts, and `addNotif()` (sending an "aviso al equipo") fails with a table-not-found error. `addNotif()` is `async` — callers must `await` it. Broadcasts (`recipientId: null`) are still restricted to `admin`/`it`/`owner`; migration 32 additionally lets any active employee send a *targeted* notification (`recipientId` set).
- **Comunicación IT ↔ Usuario en tareas de soporte requires migration 32**: `32_support_task_comments.sql` creates `support_task_comments`. A regular employee creates a support task via the help (❓) modal (`support_tasks.created_by`); IT replies from the comment thread inside `openEditSupportTask()` (Soporte kanban → Editar), which notifies `task.createdBy`. The employee reads/replies from the "Mis solicitudes" modal (inbox icon in the topbar, `#my-requests-modal` / `renderMyRequestsModal()`), which notifies `task.assignedToId` (if the task is unassigned, the reply is saved but no notification is sent — IT still sees it next time they open the task). Both views share `renderSupportCommentThread(containerEl, task, notifyRecipientId)`.
- **Adjuntar fotos a tareas de soporte requires migration 33**: `33_support_task_attachments.sql` adds `attachments.task_id` plus a policy letting any active employee manage attachments where `task_id is not null`. Upload UI (`loadTaskPhotos`/`initTaskPhotoUpload`) is appended to `renderSupportCommentThread()`, so it shows in both "Editar tarea" (IT) and "Mis solicitudes" (usuario). Files go to bucket `ticket-photos` under `support/${taskId}/...` — no storage policy changes needed (existing policies are bucket-wide, not path-scoped). Deletion reuses the global `[data-delete-photo]` handler.
- **Notificaciones automáticas de tickets (Fase 2)**: `updateRemoteTicket()`/`createRemoteTicket()` call `addNotif()` when `assigned_employee_id` changes (recipient = newly assigned técnico) or when `stage` changes (recipient = técnico asignado), skipping self-notifications. **Pitfall**: `handleKanbanDrop()` applies an optimistic `state.tickets` update *before* calling `updateRemoteTicket()`, so `oldTicket.status` inside it would already equal the new stage — `r._prevStatus` is passed explicitly from `handleKanbanDrop()` to recover the real previous stage (also fixes the pre-existing bug where stock auto-deduction on "Entregado" never fired via drag&drop).
- **"¿Cómo nos conocieron?" requires migration 34**: `34_customer_referral_source.sql` adds `customers.how_found`/`how_found_other`. The field is in the cliente form (`formSchemas.client`, options from `REFERRAL_SOURCES`) and saved by `createRemoteClient`/`updateRemoteClient`. It's also editable from the ticket and cotización forms (`formSchemas.ticket`/`formSchemas.cotizacion`) — `createRemoteTicket`/`updateRemoteTicket` write it back to `customers.how_found`/`how_found_other` for the linked customer, even on already-closed ("Entregado") tickets. `how_found_other` is only persisted when `how_found === "Otro"`. `#reports-referral` groups `branchClients()` by `howFound` for clients whose `createdAt` falls in the selected period — clients created before migration 34 show under "Sin especificar". **Activo vs pendiente**: a new client only counts toward the "activos" total/channel number if they have at least one ticket with `status !== "Cotizacion"` (`hasConcretedService`); clients whose only record is an unconverted cotización show as "+N en cotización" under their channel and are excluded from the "activos" count until the cotización is converted to a ticket.
- **Kanban expandable cards (read-only)**: clicking a card in Tickets/Cotizaciones/Soporte opens `viewTicketDetail()`/`viewQuoteDetail()`/`viewSupportTaskDetail()` respectively (all reuse the `#tdv-dialog` pattern and `.tdv-grid`/`.detail-row` CSS classes from `app.css`). Each card's `onclick` checks `event.target.closest('.ticket-actions')` (or `.support-actions` for tasks) so clicking action buttons doesn't also open the detail view. `viewSupportTaskDetail()` embeds the same `renderSupportCommentThread()` used elsewhere.
- **Marca "⏳ Esperando pieza" requires migration 35**: `35_ticket_waiting_part.sql` adds `service_tickets.waiting_part`/`waiting_part_note`. `toggleWaitingPart(ticketId)` toggles the flag (prompts for an optional note via `prompt()` when turning it on) — wired via `[data-toggle-waiting]` on the ticket card and persisted directly to Supabase (not through `updateRemoteTicket`). Shows as an orange badge on the kanban card and in `viewTicketDetail()`. It is independent of `stage`/`status` — a ticket can be "esperando pieza" in any column.
- **`color`/`accessories` are optional in the ticket form**: both fields in `formSchemas.ticket` have `optional=true` — not every walk-in ticket has a known color or received accessories.
