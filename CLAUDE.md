# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

FixZone CRM is a **vanilla HTML/CSS/JS single-page app** for managing a cell-phone repair shop. It has no build step and no framework — the browser loads scripts directly via `<script>` tags in `index.html`. The backend is **Supabase** (PostgreSQL + Auth + RLS). Deployed on **Cloudflare Pages** (`fixzone-crm.pages.dev`) — push to `main` triggers auto-deploy.

Measurement ID:G-X4QFLJNES2

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

There is no linter configured. There is a small Playwright E2E regression suite at `tests/e2e/test_traceability_fixes.py` (see "Testing" below) — not a full test suite, just targeted coverage for the traceability bugs it was written to catch.

## Testing

`tests/e2e/test_traceability_fixes.py` uses the `webapp-testing` skill (Playwright, Python) to verify the traceability fixes documented in the pitfalls below, directly against the **live** Supabase project — there is no staging project for this app. All rows it creates are prefixed `__TEST__` and deleted in a `finally` block regardless of pass/fail, so it's safe to run repeatedly.

Requires `pip install playwright && playwright install chromium`, the app served locally (`python -m http.server 8080`), and `FIXZONE_TEST_USER`/`FIXZONE_TEST_PASS` env vars set to a real active-employee login (never hardcode credentials in the script or paste them into chat). Run with `python tests/e2e/test_traceability_fixes.py`.

**Windows PATH pitfall**: if `python`/`pip` aren't recognized after installing Python, check Settings → Apps → Advanced app settings → App execution aliases and disable the "App Installer" python.exe/python3.exe stubs — they shadow the real interpreter. Even after disabling them, an already-open shell (or one spawned from a stale Explorer session) won't see the updated PATH until you refresh it in that session: `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`.

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
| `supabase/36_ticket_due_date.sql` | Agrega `due_date` (date, nullable) a `service_tickets` — fecha límite asignable desde el formulario de ticket, usada para ordenar el kanban y mostrar avisos de vencido/vence hoy |
| `supabase/38_anon_photo_edit_delete.sql` | Agrega policies anon UPDATE/DELETE en `attachments` (`ticket_id is not null`) y anon DELETE en `storage.objects` para el bucket `ticket-photos` — permite que el técnico corrija la etapa de una foto ya subida o la elimine desde `ticket-tech.html` (página pública, sin login) |
| `supabase/39_team_tasks.sql` | `team_tasks` table — checklist de pendientes generales del equipo (Investigar/Cotizar/Comprar/Otro), no ligado a tickets ni a Soporte IT. RLS abierto a cualquier empleado activo para crear/ver/marcar como hecha. Accesible desde un ícono en el topbar (junto a la campanita), no es una vista del sidebar |
| `supabase/40_contaduria_access_flag.sql` | Agrega `employees.can_access_contaduria` (boolean) y actualiza `private.is_admin_it_or_kevin()` para usarlo en vez de comparar `full_name = 'kevin mijangos'` — reemplaza la excepción hardcodeada por un flag editable desde Usuarios |
| `supabase/41_app_settings.sql` | `app_settings` table — almacén genérico key/value (jsonb) para configuración que antes vivía solo en `localStorage` (plantillas de WhatsApp, mensajes rápidos, etc.), RLS abierto a empleados activos. Primera sección migrada: `wa_templates` |
| `supabase/42_realtime_notifications.sql` | Agrega `notifications` y `team_tasks` a la publicación `supabase_realtime` — permite que el frontend se suscriba a `postgres_changes` para que la campanita y el checklist de equipo se actualicen al instante en vez de esperar el polling de 90s o un refresh manual |
| `supabase/43_pos_returns.sql` | `pos_returns` + `pos_return_items` tables — devoluciones de ventas POS, con trigger que restaura el stock del producto (inverso del trigger de `13_pos_tables.sql`). RLS incluye el rol `it` desde el inicio (a diferencia de `pos_sales`/`pos_sale_items`, que necesitaron el parche aparte de la migración 28) |
| `supabase/44_backfill_pos_sale_items.sql` | Reconstruye `pos_sale_items` para ventas POS antiguas que se quedaron sin líneas de producto (ej. por un fallo transitorio entre el INSERT de `pos_sales` y el de `pos_sale_items`), parseando el texto ya guardado en `transactions.concept` ("POS: 2× Producto, …"). Idempotente — solo toca ventas sin líneas. Dispara el trigger de descuento de stock de la migración 13, corrigiendo stock que nunca se descontó en esas ventas |
| `supabase/45_device_unlock_code.sql` | Agrega `unlock_type` (`pin`\|`patron`), `unlock_pin` y `unlock_pattern` (jsonb, secuencia de índices 0-8) a `customer_devices` — código de desbloqueo del equipo capturado en el ticket/cotización, con un widget de cuadrícula 3×3 para patrones que se puede reproducir en el detalle del ticket |
| `supabase/46_ticket_cancelled_stage.sql` | Agrega `'Cancelado'` al check constraint de `service_tickets.stage` — habilita el botón "Cancelar ticket" (reparación no realizada), que mueve el ticket a una nueva columna terminal del kanban, resetea `paid_amount`/`payment_status`, y si había abono registra un Egreso/"Devolución" por el reembolso |
| `supabase/47_team_tasks_due_date.sql` | Agrega `due_date` (date, nullable) a `team_tasks` — fecha límite opcional en un pendiente del checklist de equipo, usada por la tarjeta "Pendientes con fecha límite" del dashboard de Home |
| `supabase/48_ticket_cancel_reason.sql` | Agrega `cancel_reason` (text, nullable) a `service_tickets` — motivo estructurado de la cancelación. `cancelTicket()` ahora pregunta si el equipo es "Irreparable" antes del motivo en texto libre; guarda `'Irreparable'` o el texto escrito. Habilita la tarjeta de Reportes "Equipos no reparables" (conteo + detalle equipo/falla por período), sin agregar una etapa nueva del kanban |
| `supabase/50_supply_ticket_link.sql` | Agrega `ticket_id` (uuid, FK a `service_tickets`) a `supply_purchases` — permite vincular una compra de insumo (Egresos → Insumos) al ticket para el que se compró, solo para trazabilidad interna (nunca aparece en comprobantes o impresiones de cara al cliente) |
| `supabase/51_ticket_stage_changed_at.sql` | Agrega `service_tickets.stage_changed_at` (timestamptz) — a diferencia de `recibido_sealed_at`/`quoted_at`/`delivered_at` (se sellan una sola vez, nunca se sobrescriben), este se sobrescribe cada vez que el `stage` cambia. Usado exclusivamente para ordenar el kanban por columna con hora exacta (ver pitfall abajo) |
| `supabase/52_login_pin.sql` | Agrega `employees.login_pin_hash` (text) — hash SHA-256 de un PIN numérico opcional (4-6 dígitos) que un empleado puede usar como credencial alterna a su contraseña. Solo lo escribe/lee la Edge Function `self-service-auth` |
| `supabase/functions/scan-receipt/` | Edge Function — recibe imagen base64, llama a Gemini vision API (free tier, `gemini-3.1-flash-lite`), devuelve campos extraídos del comprobante (para insumos, devuelve un array `items[]` con una línea por producto del ticket). PDFs caen a llenado manual. Requiere secret `GEMINI_API_KEY`. |
| `supabase/functions/self-service-auth/` | Edge Function pública (sin sesión) — recuperación de contraseña. Ver sección "Recuperación de contraseña (self-service)" más abajo. |

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

### Recuperación de contraseña (self-service)

Un empleado bloqueado (olvidó su contraseña) puede recuperar su cuenta él mismo, sin depender de que un admin entre a Usuarios — decisión deliberada para un equipo interno pequeño y de confianza, no la seguridad de una app multi-tenant pública.

**Trigger points** (ambos abren el mismo diálogo, `openRecoveryOffer(username)`):
1. Link "¿Olvidaste tu contraseña?" — siempre visible en la pantalla de login (`showLoginScreen()`), no depende de haber fallado un intento antes.
2. Un login fallido (contraseña incorrecta) — tanto en `handleLogin()` como en `tryUsernameAliasFlow()` (el flujo "¿Eres X?").

**Flujo:**
1. `openRecoveryOffer(username)` → diálogo "¿Reseteamos tu contraseña, pequeño ser olvidadizo?" con Sí/No. "Sí" llama a la Edge Function pública `self-service-auth` (acción `reset_by_username`), que resetea la contraseña de Auth al default del equipo (`miwaysillos05`) y marca `force_password_change: true` — **sin verificar ninguna identidad más allá del username escrito**. Cualquiera que sepa (o adivine) el usuario de otro empleado puede resetear su contraseña; el titular real no pierde el acceso de forma permanente porque solo se vuelve a la contraseña default ya conocida por todo el equipo, pero si alguien más la usa primero para entrar, sí puede ver/tocar lo que ese rol permite hasta que el dueño real vuelva a entrar y la cambie. Aceptado a propósito — no añadir aquí una pregunta de seguridad/verificación sin que alguien lo pida explícitamente, ya se descartó en el diseño de esta feature.
2. Tras el reset exitoso, `openPinOffer(username)` ofrece agregar un **PIN numérico (4-6 dígitos) como credencial alterna** ("¿Quieres agregar un PIN adicional a tu contraseña, para entrar con uno u otro?"), con un teclado tipo pantalla de bloqueo de celular. "Sí, guardar" sin dígitos capturados no cierra el diálogo — vuelve a mostrar el teclado con el aviso "Pues ponlo, preciosa". Guardar llama a la acción `set_pin` de la misma Edge Function, que hashea el PIN (SHA-256) y lo guarda en `employees.login_pin_hash`. "No" simplemente regresa al login.
3. En cualquier caso (guardó PIN o no), `backToLoginWith(username)` regresa a la pantalla de login con el usuario prellenado y un toast recordando que la contraseña quedó en la default del equipo.

**Login con PIN**: el link "Usar PIN en vez de contraseña" en la pantalla de login (`openPinLoginScreen()`) muestra el mismo teclado numérico; al completar 4+ dígitos llama a la acción `login_with_pin`, que verifica el hash server-side y, si coincide, genera un magic link (`adminClient.auth.admin.generateLink({type:"magiclink"})`) — el frontend consume ese token con `supabaseClient.auth.verifyOtp({email, token, type:"magiclink"})` para obtener una sesión real. El PIN nunca es la contraseña real de Supabase Auth ni la reemplaza; es una vía paralela que termina en el mismo mecanismo de sesión.

**Por qué una Edge Function nueva y no reusar `create-employee`**: `create-employee` exige que quien llama ya tenga una sesión con rol admin/it/owner (`callerClient.auth.getUser()`) — imposible para alguien que está justamente bloqueado sin poder iniciar sesión. `self-service-auth` es intencionalmente pública (CORS abierto, sin chequeo de `Authorization` contra `employees`), usa el service-role key solo server-side, y limita lo que expone a tres acciones acotadas (reset al default conocido, guardar PIN, verificar PIN) — nunca devuelve ni acepta la contraseña real de nadie.

**Requiere migración 52** (`52_login_pin.sql`, columna `employees.login_pin_hash`) y el deploy de la Edge Function `self-service-auth`. Sin la migración, `set_pin`/`login_with_pin` fallan con error de columna inexistente; sin el deploy, los tres botones (link de recuperación, "Usar PIN") fallan con error de red al invocar la función.

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

**Receipt printing (`printPosRecibo()`)**: reads from `lastPosSale` (set right after checkout, or rebuilt from `state.posSales` when reprinting from history via `[data-reprint-pos]`). `loadSupabaseState()`/`reloadState()` join `pos_sale_items(*)` and `customers(full_name)` onto the `pos_sales` query so `state.posSales[].items`/`.clientName` are always populated — without this join the receipt renders with no product lines (it only had `total`/`paymentMethod`). `doPrint(filenameBase)` takes an optional filename that becomes `document.title` for the duration of the print (restored on `afterprint`) so "Guardar como PDF" suggests `{BrandName}_POS_dd-mm-aa` instead of the page title.

**Historial de POS (`renderPosHistory()`)**: renders every sale in `state.posSales` (branch-filtered) grouped by day (`createdAt`, newest first), each row showing time, payment method, client, and a one-line product summary (`qty× name, …`) — no separate "detail" view needed since the summary is always inline. Each sale has a 🖨 reprint button and, if it still has returnable items, a ↩ button opening `#pos-return-modal` (`openPosReturnModal()`).

**Devoluciones (`pos_returns`/`pos_return_items`, migration 43)**: `openPosReturnModal(saleId)` lists the sale's items with remaining (non-returned) quantity, letting the user check which ones and how many to return. On submit: INSERT `pos_returns` (header: reason, `total_refunded`) → INSERT `pos_return_items` (one row per returned line, `sale_item_id` FK back to the original `pos_sale_items` row) → DB trigger `pos_return_items_restore_stock` adds the quantity back to `products.stock` → INSERT an `"Egreso"`/`"Devolución"` transaction linked back via `pos_returns.transaction_id`. `state.posSales[].items[].returnedQty` (summed from joined `pos_returns`) caps how much of each line can still be returned — once fully returned an item drops out of the return modal, and once every item is fully returned the ↩ button disappears from that sale's row.

### Cotizaciones

Cotizaciones are quotes stored as `service_tickets` with `stage = "Cotización"`. They have their own serial (`[COT] 0001`) separate from repair tickets (`[FZ] 0001`).

**Quote line items** — stored in `ticket.quoteItems` (JSONB array in `quote_items` column, migration 16). Each item: `{type, description, qty, unitPrice}`. The builder (`buildQuoteItemsSection()`) renders add/remove rows and updates running totals with discount. Hidden inputs `name="discountCode"` and `name="discountAmount"` in the form are picked up automatically by `FormData` on submit.

**Discount in cotización**: `applyDiscount(subtotal, code, "cotizacion")` validates scope. The `#qi-apply-code` button updates the hidden inputs and shows status text. On approval (converting to ticket), the discount values are preserved in the ticket.

**Reportes — secciones activas** (cada una tiene un `<div id="reports-*">` en `index.html`, renderizado por `renderReports()`):
- `#reports-grid` — tarjetas resumen (ingresos, egresos, balance, tickets cerrados, inventario, stock bajo). "Tickets cerrados" y "Valor inventario" son snapshot actual sin filtro de período; ingresos/egresos/balance sí se filtran por período.
- `#reports-cash` — movimientos por categoría del período
- `#reports-profit` — utilidad estimada: tarjetas ingresos/egresos/neta, barra de margen %, tabla por categoría
- `#reports-pos` — ventas POS del período: tarjetas resumen (total, ticket promedio, # ventas, descuentos), desglose por método de pago, tabla detalle últimas 30 ventas
- `#reports-cotizaciones` — métricas de cotizaciones del período: tasa de conversión, convertidas/pendientes/no convertidas, monto promedio (todas vs convertidas), tabla detalle últimas 20. El filtro `allCots` usa `tracking.startsWith("[COT]") || !!cotizacionRef` — necesario porque al aprobar una COT su `tracking` cambia a `[FZ] XXXX`; `cotizacionRef` conserva el folio original y permite seguir contándola en la tasa de conversión.
- `#reports-referral` — clientes nuevos del período agrupados por `how_found` ("¿Cómo nos conocieron?": Instagram, Facebook, Transeúntes, Conocidos de Moni, Otro, Sin especificar), con detalle de especificaciones libres para "Otro". `hasConcretedService` usa `branchTickets()` (solo sucursal activa — nunca `state.tickets`).
- `#reports-payment-methods` — ingresos por método de pago (Efectivo, Transferencia, Terminal TC/TD, Link de pago, etc.) del período
- `#reports-ticket-payment` — tickets pagados por método de pago del período (monto cobrado y # tickets por método). Excluye cotizaciones aunque tengan `paymentMethod` registrado.
- `#reports-monthly` — balance mensual histórico completo (ignora filtro de período). La columna "Tickets" cuenta solo tickets reales `[FZ]`, no cotizaciones.
- `#reports-tickets` — tickets por etapa con barra de distribución (historial completo, sin filtro de período)
- `#reports-traffic` — heatmap de afluencia día×hora (recepción/entrega de equipos) — ver la sección dedicada "Afluencia de clientes" más abajo
- `#reports-devices` — top 20 equipos más frecuentes por sucursal (historial completo): tickets (conteo incluye COTs), cerrados, ingresos. La columna "Ingresos" excluye cotizaciones — solo suma `repairAmount` de tickets reales `[FZ]`.
- `#reports-stock` — productos con stock bajo
- `#reports-productivity` — productividad por empleado. Excluye cotizaciones del conteo de tickets y del "Valor generado" — solo refleja trabajo real completado.

**Print**: `printCotizacion(ticket)` writes a formal quote layout (logo, line-item table, subtotal, discount, total, validity, signature) into `#print-receipt` and calls `window.print()`. Width follows the 58/80mm toggle in localStorage (same as receipt printing).

**WhatsApp**: `shareQuoteWhatsApp(ticketId)` builds a `wa.me?text=` URL. If the `"cotizacion"` WA template (Automatización tab) is non-empty it fills `{cliente}`, `{total}`, `{items}` variables; otherwise it auto-formats a message with all line items. Opens in a new tab.

**Quote line items** — each item now has an optional `insumoCost` field. When `insumoCost > 0` and type is "Servicio", `calcPrecio({ insumo, tipo })` auto-calculates the final price using the configured margins. Glass is detected by `/glass/i` in the service name. Price field turns green when auto-calculated; technician can still override manually.

**Conversion**: "Aprobar" button on a cotización assigns a **new `[FZ]` tracking number**, saves the original `[COT]` folio as `cotizacion_ref` on the ticket, and saves the new `[FZ]` folio as `converted_to_ticket` on the cotización. Bidirectional traceability is visible on both cards.

**Cotizador → Cotización**: The `renderCotizador()` widget in the Precios view has a "📋 Crear cotización con este precio" button that pre-fills `openForm("cotizacion", prefill)` with the calculated price as a Servicio line item.

### Afluencia de clientes

A day×hour heatmap of physical store visits (device drop-off = `"Recibido"`, pickup = `"Entregado"`) — like Google Maps' "popular times." Rendered in two places that share one data layer:

- **`#reports-traffic`** (`renderTrafficHeatmap()`, Reportes tab) — the full card. Has the Ambos/Recibido/Entregado stage toggle and two display modes: **Semana típica** (default — aggregates every week inside the Reportes Hoy/7 días/Mes/Todo filter into one Lunes–Domingo pattern) and **Explorar** (a Semana/Mes granularity toggle with ‹ › navigation, for isolating one specific week or month instead of a blended average — added because an aggregated cell can look "impossibly high" when it's really several ordinary weeks summed together). In Mes granularity it renders a month calendar (one cell per calendar day, 🏆 badge on the busiest day); clicking a day switches back to Semana granularity anchored on that date.
- **`#dashboard-traffic-chart`** (`renderDashboardTraffic()`, Home) — a compact widget showing one week at a time (default: current week), with small `‹ 21–27 jul ›`-style arrows (`.traffic-mini-nav`) to page through past weeks. No stage toggle, no legend — just the grid, the peak callout, and a "Ver detalle" button (`data-view-target="reports"`) to jump to the full card.

**Data source**: `ticket_events`, not `delivered_at` — `delivered_at` only stores a bare `date` (no time-of-day; written by `dateStamp()`), so it's useless for an hour axis. `ticket_events.created_at` is a full `timestamptz` set automatically on every insert, which is exactly what's needed. `fetchTrafficEvents(from, to)` queries `event_type in ('created','stage_change','quote_approved')` and `to_stage in ('Recibido','Entregado')`. **All three event types are required** — `logTicketEvent(id,"created",{toStage:r.status})` covers walk-in tickets created directly in Recibido, `"stage_change"` covers normal kanban transitions (this is the *only* path for Entregado, since nothing is ever created directly in that stage), and `"quote_approved"` covers `approveQuoteToTicket()`, which updates `stage` directly instead of going through `updateRemoteTicket()` and logs its own event type — in this business most tickets reach "Recibido" via an approved cotización, so omitting `"quote_approved"` silently starves the Recibido side while Entregado (always `"stage_change"`) looks fine, making the imbalance easy to misdiagnose as something else.

**Caching**: `loadTrafficBucket(from, to)` results are cached in `trafficCacheMap`, keyed `` `${activeBranchId}|${from}|${to}` `` — a `Map`, not a single slot, because the Reportes card (period-filtered range) and the dashboard widget (one-week range) and the Explorar month/week ranges all request *different* `[from,to]` pairs simultaneously; a single-slot cache would have them evict each other on every render. `trafficPending` (also keyed by branch+range) dedupes in-flight fetches for the same key.

**Stable hour axis**: which hours are shown (`minHour`/`maxHour`) is **not** computed per-bucket — it's computed once per branch, from the full history, via `ensureTrafficHourRange()` (cached in `trafficHourRangeByBranch`), and every bucket reuses that same range regardless of how narrow its own data is. **Pitfall (fixed):** the first version derived the hour range from each bucket's own events, so a quiet week with visits only between 10:00–16:00 rendered *only* those rows — next to a busier week showing 9:00–20:00, the grid visibly changed shape when navigating, which read as "hours going missing." Floor is fixed at 9 (branch opens 9:30) regardless of data — a stray earlier-hour event doesn't add an unwanted extra row.

**Grid orientation**: `trafficGridHtml()` renders **columns = days (Lun…Dom), rows = hours (descending down the page)** — like a class schedule / calendar-app week view. (It was rows=days/columns=hours originally; flipped because cross-referencing a specific day+hour was confusing that way round.) `.traffic-day-label` (fixed ~30px, right-aligned) is reused for the hour-label column and `.traffic-hour-label` (flexible width, centered) for the day-header row — same CSS classes as before the flip, just swapped which axis they label, so no CSS changes were needed for the transpose itself.

**Per-ticket dedup**: `buildTrafficGrid()` puts ticket IDs into a `Set` per cell (`cellTickets[day][hour]`), not a plain counter — if the same ticket fires two qualifying events landing in the same day+hour slot (a correction dragged back into a stage, a same-hour warranty re-delivery), it counts once for that cell, not twice. **Pitfall (fixed):** counting raw events initially, "más concurrido" could show a number the popover's ticket list didn't match, and the same ticket touching a cell twice inflated it. The period total (`totalVisits`) is the *sum of the already-deduped grid*, not `filtered.length` (raw event count), so the total and the peak callout never disagree with each other or with what clicking a cell shows.

**Click a cell → see the tickets**: every hour-cell carries `data-ticket-ids` (from `ticketGrid`, built alongside the count grid); clicking opens a small popover (`showTrafficCellTickets()`) listing the exact tickets behind that number — folio, client, equipo — each clickable through to `viewTicketDetail()`. This exists specifically so the numbers are auditable instead of trusted blindly.

**Tooltip/popover architecture — delegated, not per-cell**: hovering a cell shows a small floating label (day, hour, count). This is intentionally **one shared tooltip element and one shared popover element**, controlled by a handful of listeners registered *once* on `document` at script load (`mouseover`/`mouseout`/`focusin`/`focusout`/`click`, matching via `e.target.closest(".traffic-cell[data-traffic-tip]")` etc.) — not per-cell `addEventListener` calls. **Pitfall (fixed):** the original version attached a tooltip + listeners to every cell individually. `render()` runs very often (any ticket edit, the 90s poll, realtime updates) and rebuilds these cards' `innerHTML` on every call; if the mouse was still over a cell exactly when that happened, the browser doesn't reliably fire `mouseleave` on an element that was destroyed rather than actually left by the cursor — the tooltip (appended to `document.body`, outside the replaced container) was orphaned permanently, and since that part of the DOM is untouched by view switching, changing sections didn't clear it either. Delegating to `document` (which is never destroyed) removes the failure mode entirely — there's a single element to hide/show, not N accumulating ones. `clearTrafficOverlays()` (called at the top of `renderTrafficHeatmap()`/`renderDashboardTraffic()`) is a belt-and-suspenders sweep, not the primary fix.

**Migration 49 backfill**: see the pitfall entry below — historical tickets created before the `data.status = "Recibido"` fix have `ticket_events` rows with `to_stage: null` instead of `'Recibido'`; migration 49 repairs them so old data counts correctly too.

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

**Access**: exclusive to whichever employees have `employees.can_access_contaduria = true` — as of migration 53, only **Kevin Mijangos** and **Monica Torres**. No DB role grants it automatically anymore (this was true through migration 40, where `admin`/`it`/`owner` always had access; migration 53 removed that blanket grant so the section is opt-in per person). `currentPerms()` adds `"contaduria"` to the tabs array only via the `can_access_contaduria` flag. On the DB side, RLS uses `private.is_admin_it_or_kevin()` (migration 27, rewritten by 40 and 53), which checks the same flag — the function name is now a misnomer (kept to avoid an unnecessary rename/reference churn). Any admin/it can still grant/revoke access to someone else via the "+ Contaduría" toggle in Usuarios if explicitly asked to.

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

Templates stored in Supabase `app_settings` (migration 41, key `wa_templates`, jsonb value) — shared across all users/devices instead of per-browser `localStorage`. Default keys:
- `cotizacion` — empty by default (falls back to auto-formatted message with line items)
- `listo`, `abono`, `pagado`, `garantia` — status-based message templates

Available variables: `{cliente}`, `{equipo}`, `{sucursal}`, `{folio}`, `{monto}`, `{saldo}`, `{total}`, `{items}`. `fillWATemplate()` handles substitution and reads synchronously from `state.settings.wa_templates` (loaded at startup by `loadSupabaseState()`). Templates are editable in the Automatización tab — `renderWATemplates()` autosaves on input (debounced 500ms) via `saveWATemplates()` → `saveAppSetting("wa_templates", …)`, which upserts to `app_settings` and updates `state.settings` immediately so the in-memory read stays in sync. Each template has a 📋 **Copiar** button to copy the raw text (with variables) to clipboard.

**`app_settings` is a generic key/value store** (migration 41) meant to absorb the rest of the `localStorage`-only config over time. Migrated so far: `wa_templates`, `quick_messages`. Still pending: marketing links, `fixzone-pricing-config`, etc. — one section per sprint, same pattern: read from `state.settings[key]` with defaults merged in, write via `saveAppSetting(key, value)`.

### Mensajes rápidos

Repertorio de mensajes de atención al cliente, copiables con un clic. Stored in Supabase `app_settings` (migration 41, key `quick_messages`) instead of `localStorage` — shared across all users/devices. Default messages: saludo inicial, horarios, tiempo de reparación, garantía, equipo listo, despedida, no tenemos el modelo.

- `loadQuickMessages()` — reads synchronously from `state.settings.quick_messages`, falling back to `DEFAULT_QUICK_MESSAGES` if empty/missing
- `saveQuickMessages(msgs)` — async, persists via `saveAppSetting("quick_messages", msgs)`
- `renderQuickMessages()` — renders the section in `#quick-messages-manager` (Automatización tab). View mode shows cards with 📋 Copiar; edit mode allows add/delete/rename/reorder + Restaurar defaults (save/restore buttons are now async with error toasts on failure).

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
36. `36_ticket_due_date.sql` — adds `due_date` (date) to `service_tickets` — fecha límite for sorting/filtering the kanban
38. `38_anon_photo_edit_delete.sql` — anon UPDATE/DELETE policies on `attachments` (scoped to `ticket_id is not null`) and anon DELETE on `storage.objects` for `ticket-photos` — lets the technician fix or remove photos from `ticket-tech.html`
39. `39_team_tasks.sql` — `team_tasks` table for the general team checklist (icon next to the notification bell), RLS open to any active employee for select/insert/update
40. `40_contaduria_access_flag.sql` — adds `employees.can_access_contaduria` (boolean); `private.is_admin_it_or_kevin()` now checks this flag instead of comparing `full_name`
41. `41_app_settings.sql` — generic key/value `app_settings` table for config previously stored only in `localStorage`; first section migrated is `wa_templates`
42. `42_realtime_notifications.sql` — adds `notifications` and `team_tasks` to the `supabase_realtime` publication so the frontend can subscribe to `postgres_changes`
43. `43_pos_returns.sql` — `pos_returns` + `pos_return_items` tables for POS returns, with a trigger that restores product stock
44. `44_backfill_pos_sale_items.sql` — reconstructs `pos_sale_items` for old POS sales left without product lines, parsed from `transactions.concept`; re-triggers the stock-decrement trigger for those sales
45. `45_device_unlock_code.sql` — adds `unlock_type`/`unlock_pin`/`unlock_pattern` to `customer_devices` for the device unlock-code field (NIP or pattern) on ticket/cotización forms
46. `46_ticket_cancelled_stage.sql` — adds `'Cancelado'` to the `service_tickets.stage` check constraint for the "Cancelar ticket" button
47. `47_team_tasks_due_date.sql` — adds `due_date` to `team_tasks` for the dashboard "Pendientes con fecha límite" widget
48. `48_ticket_cancel_reason.sql` — adds `cancel_reason` to `service_tickets` for the "Irreparable" cancellation reason and the "Equipos no reparables" Reportes card
49. `49_backfill_recibido_events.sql` — backfills `ticket_events.to_stage` from `null` to `'Recibido'` for `event_type='created'` rows written before the frontend fix that made ticket creation set `status:"Recibido"` explicitly (see pitfall below); also re-runs migration 37's `recibido_sealed_at` backfill for any ticket the same bug left unsealed
50. `50_supply_ticket_link.sql` — adds `ticket_id` (FK to `service_tickets`) to `supply_purchases`, for linking an insumo purchase to the ticket it was bought for (internal traceability only)
51. `51_ticket_stage_changed_at.sql` — adds `service_tickets.stage_changed_at`, overwritten on every stage change (unlike the once-only sealed dates), used to sort the kanban by column with exact time
52. `52_login_pin.sql` — adds `employees.login_pin_hash` for the self-service password recovery / PIN login flow
53. `53_contaduria_kevin_monica_only.sql` — removes the blanket `admin`/`it`/`owner` grant from `private.is_admin_it_or_kevin()`, leaving `can_access_contaduria` as the sole gate; backfills the flag to `true` only for Kevin Mijangos and Monica Torres

Files 04–06 (intermediate fixes) are superseded by 07–11 and do not need to be re-applied.

### Edge Functions
Deno Edge Functions in `supabase/functions/`:
- `create_employee/` — create/update/delete/reset_password for employees. Uses service-role key. Maps frontend roles to DB roles at insert/update time. Sets `email = username@fixzone.internal` on insert so RLS email lookup works. Requires an authenticated admin/it/owner caller — see `self-service-auth/` below for the unauthenticated counterpart.
- `login-employee/` — legacy bcrypt login, not used in current auth flow.
- `scan-receipt/` — receives a base64 image of a purchase receipt and returns extracted fields (date, supplier, items[] — array of `{description, quantity, total}`, one per line item / or concept, category, amount for transactions / or invoice_date, type, party_name, party_rfc, folio, concept, amount for invoices) using Google Gemini's vision API (free tier, model `gemini-3.1-flash-lite`, `response_mime_type: application/json`). PDF input is not supported — falls back to manual entry. **Requires `GEMINI_API_KEY` set via `supabase secrets set GEMINI_API_KEY=...`** — get a free key at https://aistudio.google.com/apikey.
- `self-service-auth/` — public, no-session Edge Function for password recovery: `reset_by_username` (resets to the team default password, no identity check beyond the username itself — deliberate, see "Recuperación de contraseña" above), `set_pin`/`login_with_pin` (optional numeric PIN as an alternate login credential, verified server-side, session established via a generated magic link).

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
- **Editing/deleting a supply purchase now also keeps `products.stock` in sync** (fixed 2026-08-03, found by an audit for the general class of "linked record edited in one place, doesn't reflect elsewhere"). The stock-increment trigger in `15_supply_stock_link.sql` only fires on `INSERT` — it never re-fires on `UPDATE`/`DELETE`. Before this fix, correcting a typo'd quantity or deleting a mistaken purchase left `products.stock` reflecting the *original* purchase forever, silently drifting from what the purchase record now said. `updateRemoteSupply()` now reverses the old purchase's stock effect and applies the new one (`adjustProductStock(oldProductId, -oldQty)` then `adjustProductStock(newProductId, newQty)`); `deleteRemoteSupply()` now reverses the purchase's stock effect entirely before deleting the row. Both reuse the same `adjustProductStock(productId, delta)` helper (clamped at 0) that the ticket-parts fix below also uses.
- **Adding/removing a refacción on an already-`Entregado` ticket now also adjusts stock** (same 2026-08-03 audit). Bulk auto-deduction only fires once, on the `stage → Entregado` transition (`updateRemoteTicket()`). Before this fix, correcting a mistake in "Refacciones / Partes usadas" *after* that point (`loadTicketParts()`'s add/remove handlers) updated `ticket_items` but never touched `products.stock` — Inventario/`#reports-stock` would silently disagree with what the ticket's own parts list showed. The add/remove handlers now call `adjustProductStock()` themselves, but only when the ticket's current `status === "Entregado"` (tickets still in earlier stages are unaffected — they still get their one bulk deduction later, as before).
- **Deleting a ticket now preserves any linked Insumos expense instead of erasing it** (same 2026-08-03 audit). `handleDeleteTicket()` used to run `transactions.delete().eq("ticket_id", id)` unconditionally — this correctly cleans up abono/payment transactions, but since migration 50 (`supply_purchases.ticket_id`, "Vincular a ticket") an Insumos Egreso transaction can *also* carry that same `ticket_id`. Deleting the ticket wiped that expense out of Finanzas/Reportes with zero warning, while the `supply_purchases` row itself survived (FK `on delete set null`) — a purchase that suddenly looked unlinked and unexplained. `handleDeleteTicket()` now looks up any `supply_purchases` rows for that `ticket_id` first, unlinks them (`ticket_id = null`, the purchase and its expense both survive) before the bulk transaction delete, and excludes their `transaction_id`s from that delete via `.not("id","in",...)`. Unrelated ticket transactions (abonos, etc.) are still deleted exactly as before.
- **Deleting a product now warns how many purchase/sale records will lose their link** (same 2026-08-03 audit). `supply_purchases.product_id` and `pos_sale_items.product_id` are `ON DELETE SET NULL` — deleting a product never fails, it just silently severs the 🎫 traceability badge and historical link on those rows. `deleteRemoteProduct()` is now `async` and counts both tables before showing the confirm dialog, appending a line like "Este producto está vinculado a 2 compra(s) de insumo y 5 línea(s) de venta POS — esos registros perderán la referencia..." when either count is nonzero.
- **Vincular insumo a ticket requires migration 50**: `50_supply_ticket_link.sql` adds `supply_purchases.ticket_id`. The "Vincular a ticket (uso interno)" field (`ftype: "ticket-select"`) is optional and purely for internal traceability — it is never shown on any customer-facing print/receipt. `createRemoteSupply`/`updateRemoteSupply` write `ticket_id` on the supply row **and** pass it through as `ticketId` to the linked Egreso transaction (`transactions.ticket_id`, already part of the base schema per the payment-method traceability pattern — see `findTransactionOrigin()`), so both records point back to the same ticket. `updateRemoteTransaction()` only touches `transactions.ticket_id` when the caller explicitly passes `data.ticketId` (not `undefined`) — callers that don't manage the link (a plain Ingreso/Renta/etc. edit) never pass it, so they never clear an existing link by accident. The link is read-only/informational in two places: the Insumos list (`renderSupplies()`) shows a small 🎫 tracking badge that opens the ticket detail, and `viewTicketDetail()` shows a matching "Insumos comprados para este ticket (interno)" list — both derived by filtering `state.supplies`/`state.tickets` in memory, no separate join needed since both are already loaded into `state`.
- **Registering an Insumos Egreso from Finanzas ("+ Movimiento") is fused with the Insumos form, not a separate dead-end path**: originally, `formSchemas.transaction` only wrote to `transactions` — picking Tipo "Egreso" + Categoría "Insumos" there created a bare expense with no `supply_purchases` row and no inventory/stock effect, which silently broke the same traceability this section relies on. `formSchemas.transaction` now also carries `supplier`/`product_id`/`item`/`quantity`/`ticket_id` (all optional at the schema level, so they never block saving an unrelated Renta/Nomina/Ingreso transaction). `initTransactionSupplyFields()` groups those four visible fields into `#tx-supply-wrap` and shows the wrapper only when Tipo=Egreso and Categoría=Insumos (called from `openForm()` for every new "transaction" and from `openEditTransaction()`); `initSupplyItemAutocomplete()` wires the catalog-search input the same way it does in the Insumos form. The submit handler blocks saving (soft validation, not an HTML `required` — see the pitfall above on why) when Tipo=Egreso+Categoría=Insumos and "Artículo/insumo" is empty, so this category can no longer produce an untracked movement going forward. **Routing on save**: `saveRemoteRecord()` sends a new Egreso/Insumos/con-artículo transaction through `createRemoteSupply()` instead of `createRemoteTransaction()` (creates the supply row + its own linked transaction, same as Insumos → + Compra). On edit, the submit handler calls `supplyForTransaction(txId)` to check for an existing link first: if found, the save routes through `updateRemoteSupply()` (which also keeps the transaction's date/concept/category/amount/ticket_id in sync, same as editing from Insumos); if not found but the item field is now filled in, `backfillSupplyForTransaction(txId, data)` creates the missing `supply_purchases` row retroactively **pointing at the same existing transaction** (no duplicate expense) — this is how an Egreso that was mistakenly registered straight from Finanzas (before this fix, or by a user who skipped the Insumos form) gets its inventory link filled in just by re-opening and saving it. `openEditTransaction()` prefills those four fields from the linked supply (not from `tx`, since `item`/`quantity`/`ticket_id` never lived on `transactions`) — showing them blank on an already-linked transaction would look like the link was lost and risk creating a duplicate supply row on save.
- **Sidebar tooltip position**: `NAV_TOOLTIPS` renders tooltips at `left: 220px` (sidebar width). If the sidebar width changes, update that value in `initNavTooltips()`.
- **Adding a new view**: (1) add nav button in `index.html`, (2) add `<section class="view" id="{name}-view">`, (3) add `"{name}"` to the relevant role tabs in `PERMISSIONS`, (4) add to `PERM_SECTIONS`, (5) add entry to `NAV_TOOLTIPS`, (6) call `render{Name}()` from `render()`.
- **POS requires migration 13**: `supabase/13_pos_tables.sql` must be applied in the Supabase SQL Editor. Until then, `checkoutPos()` will throw a table-not-found error.
- **POS devoluciones require migration 43**: `supabase/43_pos_returns.sql` creates `pos_returns`/`pos_return_items`. Without it, the ↩ button never appears (`state.posSales[].items[].id` still resolves, but `openPosReturnModal()`'s INSERT will fail with a table-not-found error) — same failure mode as migration 13 for `checkoutPos()`.
- **POS receipts need the `pos_sale_items`/`customers` join in `loadSupabaseState()`**: `state.posSales` only carries `total`/`paymentMethod` unless the `pos_sales` query embeds `pos_sale_items(*)` and `customers(full_name)`. If that join is ever removed, `printPosRecibo()` reprints (from `[data-reprint-pos]`) will silently drop all product lines — the immediate post-checkout print still works because `lastPosSale` is built straight from `posCart`, so this bug only shows up on reprint/reload, not on the very first print.
- **Old POS sales missing product lines**: before this join existed, some sales may have also been left with zero rows in `pos_sale_items` (e.g. a transient error between the `pos_sales` insert and the `pos_sale_items` insert in `checkoutPos()`). Migration 44 backfills those from `transactions.concept` — run it once after 43 is applied. Because it inserts real `pos_sale_items` rows, it re-fires the stock-decrement trigger from migration 13, correcting `products.stock` for quantities that were never decremented originally; double-check no manual stock correction was already made for those same sales before running it.
- **`#pos-history` lives inside `.pos-side-panel`** (sibling of `#pos-cart-panel`, both wrapped together so the whole column is `position: sticky`) — not below `.pos-layout` anymore. This was moved so "Ventas recientes" stays visible next to the cart instead of requiring a scroll past the entire product catalog. `renderPosHistory()` still just targets `#pos-history` by selector; only the DOM location and CSS changed, not the render logic.
- **Cotizaciones require migration 16**: `supabase/16_quote_items.sql` adds the `quote_items` JSONB column. Without it, saving a cotización with line items will silently discard them.
- **Discount codes require migration 18**: `supabase/18_discount_codes.sql`. Without it, `state.discounts` stays `[]` and all discount code lookups fail silently (returns `{valid: false}`).
- **`applyDiscount` scope must match exactly**: valid scope values are `"pos"`, `"cotizacion"`, `"ticket"`. A mismatch (e.g. passing `"tickets"`) always returns `{valid: false}` — check the scope array in the `discount_codes` row and the call site.
- **`markDiscountUsed` must be called after a successful save** — not before. If the INSERT/UPDATE fails after calling it, the usage counter will be incremented with no matching transaction.
- **`ticket.repairAmount` en cotizaciones almacena el total ya con descuento aplicado** — `updateQuoteItemsHiddenInputs()` escribe `total` (post-descuento) en `#qi-repair-amount`, que se guarda como `repair_amount` en la DB. En tickets regulares (sin quoteItems) el técnico escribe el monto pre-descuento directamente. Por lo tanto: si `ticket.quoteItems?.length > 0` usa `repairAmount` directamente como total final; si no, aplica `repairAmount - discountAmount`. Este patrón debe seguirse en `ticketCard()`, `buildCotizacionCanvas()` y `shareQuoteWhatsApp()`. Usar siempre `repairAmount - discountAmount` produce descuento doble en cotizaciones.
- **`renderMarketingLinksGrid` anti-accumulation**: always call it with the same DOM node reference; it internally calls `container.cloneNode(false)` + `replaceWith()`. Do not attach external click listeners to the container after calling this function — they'll be lost on the next render.
- **Browser cache after deploy**: Cloudflare Pages may serve cached JS/CSS. Users should hard-refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`) after a new deploy if they see stale styles.
- **Tabla de Precios requires migrations 21 + 21b + 22**: Without 21, `state.serviceTypes` and `state.servicePrices` stay `[]` and the matrix renders empty. Without 22, the `variant` column is missing and multi-price upserts will fail with a constraint error.
- **`variant` column default is `''`** (empty string, not null): the UNIQUE constraint is `(device_model, service_type_id, branch_id, variant)`. Always pass `variant: ""` when upserting a single-price cell; omitting it causes a null vs "" mismatch that creates duplicate rows.
- **`22_service_type_default_price.sql` and `22_variant_prices.sql` are both numbered 22** — this is intentional (created independently). Apply both; order between them doesn't matter.
- **Traceability migrations require 23**: Without `23_cotizacion_ref.sql`, approving a cotización will throw a column-not-found error on `cotizacion_ref` update.
- **`calcPrecio()` formula**: `precio = (insumo × (1 + margen)) × 1.16 × 1.0406`. Glass applies an additional discount: `precioFinal = precioPantalla × (1 - glassDesc)`. Never hardcode margin values — always read from `loadPricingConfig()`.
- **Quote item `insumoCost`**: stored in `quoteItems` JSONB array per item. When > 0, `calcPrecio()` is called client-side to auto-fill `unitPrice`. The `insumoCost` is for internal reference only — not shown on client-facing receipts.
- **Contaduría requires migration 27**: `27_invoices.sql` creates the `invoices` table and `private.is_admin_it_or_kevin()`. Without it, `state.invoices` stays `[]` and the Contaduría view renders empty for everyone, including Kevin.
- **Contaduría access is controlled exclusively by `employees.can_access_contaduria`** (migration 40, tightened by migration 53), not by role or name comparison. No DB role grants it automatically — as of migration 53 only Kevin Mijangos and Monica Torres have the flag set. Any admin/it can grant/revoke access for someone else via the "+ Contaduría" toggle button in the Usuarios table (`toggleContaduriaAccess()`), which updates the column directly through the existing `"owners and admins can manage employees"` RLS policy (no Edge Function involved) — but don't add anyone else on your own initiative, since the whole point of migration 53 was to make this an explicit, deliberately short allowlist. `currentPerms()` (frontend, no role includes `"contaduria"` in its `tabs`) and `private.is_admin_it_or_kevin()` (RLS) both read this flag exclusively.
- **POS checkout for `it`-role employees requires migration 28**: `28_it_role_pos_tables.sql` adds the missing `"it can manage *"` policies for `pos_sales`/`pos_sale_items`. Without it, employees with `role = 'it'` (never normalized to `admin`) get a "violates row-level security policy" error on `checkoutPos()`.
- **Escaneo de comprobantes con múltiples artículos (Insumos)**: `scan-receipt` now returns `items[]` (one entry per line item) instead of a single `item`/`quantity`/`total`. When `formType === "supply"` and `fields.items.length > 1`, `openReceiptScanner()` shows a review screen (`showMultiItemReview()`) where each line can be edited/removed before saving — "Guardar todos" calls `createRemoteSupply()` once per row, all sharing the same uploaded receipt file. Single-item receipts still prefill the normal supply form.
- **Biblioteca de assets de marca requires migration 30**: `30_brand_assets.sql` creates the `brand_assets` table. Without it, `state.brandAssets` stays `[]` and `renderBrandAssetLibrary()` (tab Diseño) renders an empty gallery — uploads will fail with a table-not-found error. This is intentionally separate from `renderBrandEditor()` (the "Editor de marca" above it): uploading here only stores a file + lists it for download/copy, it never touches `--fz-logo-src` or any active branding.
- **Centro de notificaciones requires migration 31**: `31_notifications.sql` creates the `notifications` table. Without it, `state.notifications` stays `[]`, the badge never shows unread counts, and `addNotif()` (sending an "aviso al equipo") fails with a table-not-found error. `addNotif()` is `async` — callers must `await` it. Broadcasts (`recipientId: null`) are still restricted to `admin`/`it`/`owner`; migration 32 additionally lets any active employee send a *targeted* notification (`recipientId` set).
- **Comunicación IT ↔ Usuario en tareas de soporte requires migration 32**: `32_support_task_comments.sql` creates `support_task_comments`. A regular employee creates a support task via the help (❓) modal (`support_tasks.created_by`); IT replies from the comment thread inside `openEditSupportTask()` (Soporte kanban → Editar), which notifies `task.createdBy`. The employee reads/replies from the "Mis solicitudes" modal (inbox icon in the topbar, `#my-requests-modal` / `renderMyRequestsModal()`), which notifies `task.assignedToId` (if the task is unassigned, the reply is saved but no notification is sent — IT still sees it next time they open the task). Both views share `renderSupportCommentThread(containerEl, task, notifyRecipientId)`.
- **Adjuntar fotos a tareas de soporte requires migration 33**: `33_support_task_attachments.sql` adds `attachments.task_id` plus a policy letting any active employee manage attachments where `task_id is not null`. Upload UI (`loadTaskPhotos`/`initTaskPhotoUpload`) is appended to `renderSupportCommentThread()`, so it shows in both "Editar tarea" (IT) and "Mis solicitudes" (usuario). Files go to bucket `ticket-photos` under `support/${taskId}/...` — no storage policy changes needed (existing policies are bucket-wide, not path-scoped). Deletion reuses the global `[data-delete-photo]` handler.
- **Notificaciones automáticas de tickets (Fase 2)**: `updateRemoteTicket()`/`createRemoteTicket()` call `addNotif()` when `assigned_employee_id` changes (recipient = newly assigned técnico) or when `stage` changes (recipient = técnico asignado), skipping self-notifications. **Pitfall**: `handleKanbanDrop()` applies an optimistic `state.tickets` update *before* calling `updateRemoteTicket()`, so `oldTicket.status` inside it would already equal the new stage — `r._prevStatus` is passed explicitly from `handleKanbanDrop()` to recover the real previous stage (also fixes the pre-existing bug where stock auto-deduction on "Entregado" never fired via drag&drop).
- **"¿Cómo nos conocieron?" requires migration 34**: `34_customer_referral_source.sql` adds `customers.how_found`/`how_found_other`. The field is in the cliente form (`formSchemas.client`, options from `REFERRAL_SOURCES`) and saved by `createRemoteClient`/`updateRemoteClient`. It's also editable from the ticket and cotización forms (`formSchemas.ticket`/`formSchemas.cotizacion`) — `createRemoteTicket`/`updateRemoteTicket` write it back to `customers.how_found`/`how_found_other` for the linked customer, even on already-closed ("Entregado") tickets. `how_found_other` is only persisted when `how_found === "Otro"`. `#reports-referral` groups `branchClients()` by `howFound` for clients whose `createdAt` falls in the selected period — clients created before migration 34 show under "Sin especificar". **Activo vs pendiente**: a new client only counts toward the "activos" total/channel number if they have at least one ticket with `status !== "Cotizacion"` (`hasConcretedService`); clients whose only record is an unconverted cotización show as "+N en cotización" under their channel and are excluded from the "activos" count until the cotización is converted to a ticket. **`hasConcretedService` must use `branchTickets()`**, never `state.tickets` — using the latter cross-contaminates branches (a PV client with a Puebla ticket would count as active in both branch reports).
- **`how_found`/`how_found_other` are only stored on `customers`, never on `service_tickets`** — the ticket/cotización form's "¿Cómo nos conocieron?" field is just a convenience UI to set/correct the linked customer's referral source; `ticket.howFound` at runtime is always derived by joining `customer_id` → `customers.how_found` in `loadSupabaseState()` (never persisted as a ticket column). **Pitfall (fixed):** `createRemoteTicket`/`updateRemoteTicket` used to only auto-create a `customers` row when `clientPhone` was also filled in. Since `clientPhone` is optional on both the ticket and cotización forms, saving "¿Cómo nos conocieron?" for a brand-new client with no phone had nowhere to persist to and was silently discarded — it would appear gone the next time the record was reopened. Both functions now create the customer from `client` name alone (phone nullable), and `updateRemoteTicket` backfills `service_tickets.customer_id` if the customer is created during an edit.
- **`#reports-cotizaciones` filter must include `cotizacionRef`**: when a cotización is approved, its `tracking_number` changes from `[COT] XXXX` to `[FZ] XXXX` (same DB row, updated in-place). `allCots` must filter with `t.tracking?.startsWith("[COT]") || !!t.cotizacionRef` — filtering on `tracking` alone silently drops all converted cotizaciones from the metrics, making the conversion rate always 0%. The `cotizacionRef` field retains the original `[COT]` folio after conversion. The detail table renders `t.cotizacionRef || t.tracking` so the folio column always shows the original `[COT]` number.
- **Kanban expandable cards (read-only)**: clicking a card in Tickets/Cotizaciones/Soporte opens `viewTicketDetail()`/`viewQuoteDetail()`/`viewSupportTaskDetail()` respectively (all reuse the `#tdv-dialog` pattern and `.tdv-grid`/`.detail-row` CSS classes from `app.css`). Each card's `onclick` checks `event.target.closest('.ticket-actions')` (or `.support-actions` for tasks) so clicking action buttons doesn't also open the detail view. `viewSupportTaskDetail()` embeds the same `renderSupportCommentThread()` used elsewhere.
- **Marca "⏳ Esperando pieza" requires migration 35**: `35_ticket_waiting_part.sql` adds `service_tickets.waiting_part`/`waiting_part_note`. `toggleWaitingPart(ticketId)` toggles the flag (prompts for an optional note via `prompt()` when turning it on) — wired via `[data-toggle-waiting]` on the ticket card and persisted directly to Supabase (not through `updateRemoteTicket`). Shows as an orange badge on the kanban card and in `viewTicketDetail()`. It is independent of `stage`/`status` — a ticket can be "esperando pieza" in any column.
- **`color`/`accessories` are optional in the ticket form**: both fields in `formSchemas.ticket` have `optional=true` — not every walk-in ticket has a known color or received accessories.
- **"Fecha límite" (due date) requires migration 36**: `36_ticket_due_date.sql` adds `service_tickets.due_date` (nullable date). `formSchemas.ticket` has an optional `dueDate` field saved/loaded as `due_date` by `createRemoteTicket`/`updateRemoteTicket`/`loadSupabaseState`. `ticketCard()` shows a "📅 Fecha límite" badge that turns orange ("Vence hoy") or red ("Vencido") once the kanban column is open (`status !== "Entregado"/"Garantia"`) and `due_date` is today/past. The Tickets sort bar (`#kanban-sort-bar`) has a "Fecha límite" sort option (`kanbanSort === "fecha_limite"`, ascending — soonest first, tickets without a due date sort last) and an "Asignado a:" `<select>` that filters the kanban by `assignedTo` (`kanbanAssigneeFilter`).
- **Corregir/eliminar fotos de tickets requires migration 38**: `attachments.stage` is tagged with whatever the ticket's stage was *at upload time* (not the stage the photo was meant to represent), so a technician who uploads "Recibido" photos late — after already moving the ticket to "En reparacion" — gets them mistagged. `38_anon_photo_edit_delete.sql` adds anon UPDATE/DELETE on `attachments` (`ticket_id is not null`) and anon DELETE on `storage.objects` for `ticket-photos`, so `ticket-tech.html` can offer per-photo "⇄ mover a otra etapa" / "✕ eliminar" actions (`openPhotoActions()`, `movePhotoStage()`, `deletePhoto()`). The desktop CRM's `loadTicketPhotos()` (in `app.js`, used by `viewTicketDetail`/ticket edit form) got the matching `data-photo-stage-select` `<select>` next to the existing `data-delete-photo` button — employees already had UPDATE rights on `attachments` via the existing `"active employees can manage attachments"` policy, so no migration was needed for that side.
- **Checklist de tareas del equipo requires migration 39**: `39_team_tasks.sql` creates `team_tasks`. This is deliberately *not* a sidebar view — it's a slide-over panel opened from an icon next to the notification bell (`#team-tasks-btn` in `index.html`, `openTeamTasksPanel()` in `app.js`), reachable from any tab. Any active employee can create/view/complete a task regardless of role (no `PERMISSIONS`/`PERM_SECTIONS` gating). Tasks are branch-scoped via `branch_id`, set automatically from `activeBranchId` at creation (not user-editable) — same permissive `!t.branch || t.branch === activeBranchId` filter as other `branchXxx()` helpers. The badge (`renderTeamTasksBadge()`) is driven by `viewed_by` (jsonb array of employee ids), **not** `status` — completing a task again makes it "unseen" for everyone else until they open the panel, same pattern as `read_by` on `notifications`. The optional note on completion uses `prompt()`, same convention as `toggleWaitingPart`.
- **Notificaciones en tiempo real requires migration 42**: `42_realtime_notifications.sql` adds `notifications`/`team_tasks` to the `supabase_realtime` publication. Without it, `subscribeRealtimeUpdates()` (called from `afterLogin()`) subscribes successfully but never receives any `postgres_changes` events — the bell/checklist badges silently fall back to the 90s poll, which can look like "it's broken" if you're testing live updates right after applying the JS change but before running the SQL. Realtime respects RLS using the connected user's session, so no separate grant is needed beyond the existing table policies. The subscription is intentionally additive, not a replacement for `pollNotifications()`/`pollTeamTasks()` — iOS Safari suspends WebSocket connections (and timers) when the tab is backgrounded, so the `visibilitychange` listener forces a poll on refocus to catch anything missed while the socket was down.
- **Código de desbloqueo (NIP/patrón) requires migration 45**: `45_device_unlock_code.sql` adds `unlock_type`/`unlock_pin`/`unlock_pattern` to `customer_devices`. The "Código de desbloqueo" field (`ftype: "unlock-code"` in `fieldTemplate()`, used by both `formSchemas.ticket` and `formSchemas.cotizacion`) is stored like `imei`/`color` — on the linked `customer_devices` row, not on `service_tickets` directly, so `createRemoteTicket`/`updateRemoteTicket` persist it in the same device insert/update block. `unlock_pattern` is a jsonb array of dot indices (0-8, left-to-right/top-to-bottom on a 3×3 grid), recorded by clicking dots in order in the form widget (`initUnlockCodeField()`, `wirePatternGrid()` in `app.js`) — **not** drag/swipe, to keep it robust across mouse and touch. `viewTicketDetail()`/`viewQuoteDetail()` render a read-only replay of the pattern (`unlockPatternDetailHtml()`/`wireUnlockPatternDetail()`) that auto-plays once on open and can be replayed via "▶ Ver animación" — this is the "gif de seguimiento": an in-app animated trace, not an exported `.gif` file. The NIP/patrón is intentionally **not** included in any customer-facing print/receipt function (`printCotizacion`, receipt printing) — it's internal-only, shown solely in the ticket/cotización detail dialogs.
- **"No se pudo guardar" on ticket edit mentioning a column name / "schema cache" almost always means a pending `supabase/*.sql` migration was never applied in production** — not a JS bug. Editing a ticket rewrites the linked `customer_devices` row (product name, IMEI, color, unlock code, etc.) on every save, so *any* column added by a migration that touches `service_tickets` or `customer_devices` and hasn't been run yet will fail the very next save, even if the user didn't touch that field or changed nothing at all. This happened for real with migration 45 (`unlock_pattern`) — the frontend code shipped and worked locally, but the `alter table` was never run against the live Supabase project. **When debugging a save error like this: check whether the referenced column's migration (see the numbered list above) has actually been applied in the Supabase SQL Editor before looking for a code-level cause.**
- **"Cancelar ticket" requires migration 46**: `service_tickets.stage` has a `check` constraint listing the allowed stage values — `46_ticket_cancelled_stage.sql` adds `'Cancelado'` to it. Without this migration applied, `cancelTicket()` (`app.js`) fails with a check-constraint-violation error on the `.update({stage:"Cancelado", ...})` call. `"Cancelado"` was appended to `ticketStages` as a new terminal kanban column (alongside `Entregado`/`Garantia`) — it always renders, there's no toggle to hide it. Cancelling resets `paid_amount` to `0` and `payment_status` to `"Pendiente"`; if the ticket had a nonzero `paidAmount` at the time of cancellation, an `"Egreso"`/`"Devolución"` transaction is created for that amount via `createRemoteTransaction()` (linked back via `ticket_id`) so the refund is reflected in Movimientos/Finanzas/Balance automatically — no separate reporting code needed since those views already aggregate from `state.transactions`. The button (`data-cancel-ticket`, both on the ticket card and inside `viewTicketDetail()`) is hidden once a ticket is already `"Cancelado"` or `"Entregado"`. Reports that sum `repairAmount` per device/employee (`#reports-devices`, `#reports-productivity`) explicitly exclude `status==="Cancelado"` tickets from the revenue sum (same treatment as cotizaciones) so a cancelled-and-refunded ticket's planned amount never inflates "ingresos generados".
- **Motivo estructurado de cancelación requires migration 48**: `48_ticket_cancel_reason.sql` adds `service_tickets.cancel_reason`. Without it, `performCancelTicket()`'s `.update({..., cancel_reason: ...})` fails with a column-not-found/schema-cache error, same failure mode as the migration-45 pitfall above. This is deliberately **not** a new kanban stage — cancelling still sets `stage:"Cancelado"` exactly as before (migration 46). **Pitfall (fixed):** the first version of this feature chained `showConfirmModal()` → native `confirm()` → native `prompt()`; closing the custom `<dialog>` and immediately opening a blocking native dialog gave the browser no chance to repaint, so the old modal appeared visually stuck behind the native one. It was replaced with a single self-built `<dialog>` (`openCancelTicketDialog()`, no native `confirm()`/`prompt()` at all) with a `<select id="ct-reason">` populated from `CANCEL_REASONS` (`Irreparable`, `Cliente canceló`, `Precio muy alto`, `Encontró otro servicio`, `No recogió el equipo`, `Otro`) plus an optional free-text `<textarea id="ct-detail">` — a reason must be picked before "Cancelar ticket" proceeds to `performCancelTicket(id, cancelReason, detail)`. Using a fixed vocabulary instead of free text is what makes the reason countable in Reportes. Every place that already excludes `status!=="Cancelado"` (dashboard open-ticket count, `#reports-devices`/`#reports-productivity` revenue, due-date badge) needed **no changes**, since a cancelled ticket's `status` is still `"Cancelado"` regardless of `cancelReason`. `ticketCard()`/`viewTicketDetail()` show a red "🔧 Irreparable" badge specifically when `cancelReason==="Irreparable"` (same visual pattern as the `waitingPart` ⏳ badge); `viewTicketDetail()` also shows a generic "Motivo de cancelación" row for any `cancelReason`. `#reports-unrepairable` ("Cancelaciones") is a period-filtered card — like `#reports-cotizaciones`/`#reports-referral`, not a lifetime snapshot like `#reports-tickets` — showing a chip per motivo with its count (`byReason`, includes a "Sin especificar" bucket for tickets cancelled before migration 48) plus a detail table (fecha/folio/cliente/equipo/falla) scoped to `cancelReason==="Irreparable"`; clicking a detail row opens `viewTicketDetail()`.
- **Cancelar un ticket con insumo vinculado (migration 50) now offers to refund/return it** (added 2026-08-03). `openCancelTicketDialog()` queries `supply_purchases` for a row with `ticket_id === ticket.id` before rendering; if found, an extra checkbox appears: "Se devolvió al proveedor '{item}' ({qty} pza) y se reembolsó {total} — descontar del inventario y registrar el reembolso en Finanzas." If checked, `performCancelTicket(id, reason, detail, returnedSupply)` runs `adjustProductStock(product_id, -quantity)` (the insumo leaves the shop, back to the supplier — opposite direction from a normal purchase) and creates an `"Ingreso"`/`"Devolución"` transaction linked via `ticketId` for the refunded amount. This mirrors the existing client-refund handling in the same function (an `"Egreso"`/`"Devolución"` for `paidAmount`) — both sides of a cancellation (client refund and supplier refund) are corrected in the same action, never left for a separate manual Insumos edit. The `supply_purchases` row itself is left untouched (not unlinked, not deleted) — only the ticket's own `logTicketEvent` note records that the return happened.
- **"Cancelado" tickets no longer get their own kanban column**: a nearly-always-empty 6th column was pushing the board's horizontal scroll further than needed and made cancelled tickets look like visual clutter. `renderTickets()` builds `kanbanColumns = ticketStages.filter(s => s !== "Cancelado")` and folds cancelled tickets into the `"Entregado"` column's filter (`t.status===status || (status==="Entregado" && t.status==="Cancelado")`) — the card's own red "Cancelado" status pill (`stClass "cancelled"`) is what visually distinguishes them, no separate column needed. `ticketStages` itself is unchanged (still includes `"Cancelado"`) since it's also used by the Reportes "Tickets por etapa" stage breakdown and the photo `data-photo-stage-select` dropdown — only the kanban board rendering was scoped down. Side effect (desired): since `"Cancelado"` is no longer a drop target, a ticket can no longer be dragged directly into a "Cancelado" column to bypass `openCancelTicketDialog()`'s refund/motivo flow — cancelling now only happens through the "Cancelar" button.
- **"Pendientes con fecha límite" (dashboard de Home) requires migration 47**: `47_team_tasks_due_date.sql` adds `due_date` to `team_tasks`. `renderDashboardTasks()` (targets `#dashboard-pending-tasks`, called from `render()`) shows `branchTeamTasks()` pending tasks that have a `dueDate` set, sorted ascending, with a quick add form (text + fecha límite, category hardcoded to `"Otro"`) that calls `addTeamTask(text, category, dueDate)` — the full panel (`openTeamTasksPanel()`, icon next to the bell) got the same optional date input for parity, plus a shared `teamTaskDueDateBadge()` helper (same red/orange convention as `ticketCard()`'s due-date badge). Checking a task done from the dashboard calls `markTeamTaskDone(taskId, {reopenPanel:false})` so it doesn't pop open the full slide-over panel — the panel's own checkboxes still call it with the default `reopenPanel:true`. Next to it, `#dashboard-traffic-chart` ("Afluencia en el local") is now wired to `renderDashboardTraffic()` — see the dedicated pitfall below for how that chart's data source works.
- **Afluencia de clientes — see the dedicated "Afluencia de clientes" section above** for the full architecture (data source, caching, stable hour axis, dedup, delegated tooltips). Two things worth flagging on their own: (1) the `ticket_events.event_type` filter must include `"quote_approved"`, not just `"created"`/`"stage_change"` — omitting it silently starves the Recibido side, since most tickets here reach Recibido via an approved cotización rather than direct creation. (2) **Migration 49 fixed a real data-integrity bug, not just a display issue**: the ticket creation form has no "status" field, and the create-path code only ever set `data.status` explicitly in the cotización branch — a regular walk-in ticket had `r.status === undefined` all the way into `createRemoteTicket()`. The INSERT still worked (`service_tickets.stage` has a DB default of `'Recibido'`, and Supabase's client drops `undefined` keys before sending JSON), so the ticket *looked* fine everywhere the app reads `ticket.status` — but `logTicketEvent(id,"created",{toStage:r.status})` recorded `to_stage: null` instead of `"Recibido"`, and `recibido_sealed_at` never sealed (gated on `r.status === "Recibido"`, never true). Fixed by explicitly setting `data.status = "Recibido"` in the non-cotización create branch. **If Recibido counts look wrong again, check this exact class of bug first**: any code path that writes `service_tickets.stage` without going through `createRemoteTicket()`/`updateRemoteTicket()` with an explicit JS value (relying on a DB column default instead) will look correct in the UI while silently breaking `ticket_events`/`recibido_sealed_at`.
- **`payment_method` must use the same vocabulary everywhere it's written**: `Efectivo`, `Transferencia`, `Link de pago`, `Terminal TC`, `Terminal TD`, `Otro` — this is the picklist used by `formSchemas.ticket`/`formSchemas.transaction` (the "Movimiento" edit form) and by the `ORDER` arrays that group `#reports-payment-methods`/`#reports-ticket-payment`. **Pitfall (fixed):** the abono modal (`#abono-method` in `index.html`) and `POS_PAYMENT_METHODS` (POS checkout) both used a *different* list with a generic `"Tarjeta"` instead of `Terminal TC`/`Terminal TD`. Since `fieldTemplate()`'s `select` case only marks an `<option>` `selected` on an exact string match, a transaction saved with `payment_method:"Tarjeta"` had no matching option in the Movimiento edit form — it silently showed as blank, and the user had to re-enter it every time they opened an abono- or POS-originated transaction. It also fragmented `#reports-payment-methods` into an extra "Tarjeta" bucket instead of folding into Terminal TC/TD. Both pickers were changed to the standard 6-option vocabulary. **This does not retroactively fix historical rows** — any `transactions`/`pos_sales`/`service_tickets` row already saved with `payment_method = "Tarjeta"` (the abono flow writes it to both the transaction *and* the ticket) still has that value (can't tell TC from TD after the fact, so no auto-migration was attempted); those old records will still show blank in the Movimiento/ticket edit form until manually corrected. **When adding any new form/flow that captures a payment method, reuse this exact 6-value list — don't invent a shorter one**, or the same class of bug reappears.
- **Orden del kanban por columna requires migration 51**: `sortedKanbanTickets()` (`fecha_desc`/`fecha_asc`) sorts by `stageChangedAt`, not `updatedAt`. **Pitfall (fixed):** the original version sorted by `updatedAt`, which the DB's `set_updated_at()` trigger bumps on *any* field UPDATE — not just a stage change. So editing an unrelated ticket already sitting in "Entregado" (correcting a note, registering an abono, moving a photo) pushed it above another ticket that was delivered more recently but hasn't been touched since, making "Más reciente" look wrong specifically in already-settled columns (Listo/Entregado/Garantía). `51_ticket_stage_changed_at.sql` adds `service_tickets.stage_changed_at`, which is overwritten **only when `stage` itself changes** — set in `createRemoteTicket` (initial stage), `updateRemoteTicket` (compares `r.status !== oldTicket.status`), `handleKanbanDrop`'s optimistic update, `performCancelTicket`, and `approveQuoteToTicket`. Any write path that changes `service_tickets.stage` directly (bypassing `updateRemoteTicket`) must also set `stage_changed_at`, or that transition silently falls back to `updatedAt`/`createdAt` in the sort (same failure mode as before, just for that one path).
- **Currency arithmetic must go through `round2()`** (`app.js` top, near the `money` formatter): raw JS float math (`0.1 + 0.2`) produces junk like `0.30000000000000004`. `money.format()` rounds for *display*, so this was invisible in the UI — but any raw sum written to a DB column (`paid_amount`, `repair_amount`, discount math, item subtotals) and later shown in a plain `<input>` (which is not passed through `money.format()`) renders the garbage decimals directly. This bit `paid_amount` specifically: `newPaid = ticket.paidAmount + amount` in the abono flow had no rounding, so accumulated abonos drifted off whole cents and the raw value leaked into the "Monto pagado" field on the next ticket edit. Always wrap sums/subtractions of money values in `round2()` before assigning to state or sending to Supabase — see its usages in `openAbonoModal`, the abono submit handler, `ticketAmounts()`, `applyDiscount()`, and the quote/ticket item-builder subtotal functions for the pattern to follow when adding new money math.
- **Recuperación de contraseña self-service requires migration 52 + deploy de `self-service-auth`**: sin `52_login_pin.sql` (`employees.login_pin_hash`), guardar o usar un PIN falla con error de columna inexistente; sin desplegar la Edge Function, tanto el link "¿Olvidaste tu contraseña?" como "Usar PIN en vez de contraseña" fallan con error de red al invocar la función (mismo síntoma que "POS requires migration 13" arriba — revisar el deploy antes que el código). Ver la sección dedicada "Recuperación de contraseña (self-service)" para el flujo completo. **Es intencionalmente de baja fricción, no de máxima seguridad**: `reset_by_username` no pide ninguna prueba de identidad más allá de escribir el username — decisión explícita para un equipo interno pequeño, no un descuido. No agregar una pregunta de seguridad/verificación extra a este flujo sin que se pida explícitamente; ya se evaluó y se descartó en el diseño original.
