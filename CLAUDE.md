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
| `src/app.js` | All client-side logic (~4 800 lines, single file) |
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

## Architecture

### Navigation structure

The sidebar (220px wide) groups views by workflow with `<hr class="nav-divider">` separators:

| Group | Views |
|---|---|
| Operaciones | dashboard, tickets, cotizaciones, pos, clients |
| Inventario | products, supplies |
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
- `state` is the in-memory object holding all data: `tickets`, `clients`, `products`, `supplies`, `transactions`, `employees`, `branches`, `supportTasks`, `posSales`, `discounts`
- `reloadState()` fetches all tables from Supabase in a `Promise.all` and overwrites state. If any individual query returns empty, the corresponding key falls back to `seed` data
- `reloadState()` failure after a successful INSERT is **non-fatal** — caught with `console.warn`, UI still renders with the locally-added record
- `createRemoteTicket` and `createRemoteTransaction` use `.select().single()` to get the created row back and add it to state immediately, so the kanban/dashboard updates even if `reloadState()` subsequently fails

### View routing
Navigation is purely DOM-based: `.nav-item[data-view]` buttons toggle the `is-visible` class on `<section class="view" id="{view}-view">` elements via `setView()`.

### Modal / form system
A single `<dialog id="record-modal">` is reused for all create/edit forms. `app.js` dynamically builds form fields and wires save logic by inspecting `activeForm` (the form type string) and `editingTicketId` (the record ID being edited, used for all entity types not just tickets).

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

**Print**: `printCotizacion(ticket)` writes a formal quote layout (logo, line-item table, subtotal, discount, total, validity, signature) into `#print-receipt` and calls `window.print()`. Width follows the 58/80mm toggle in localStorage (same as receipt printing).

**WhatsApp**: `shareQuoteWhatsApp(ticketId)` builds a `wa.me?text=` URL. If the `"cotizacion"` WA template (Automatización tab) is non-empty it fills `{cliente}`, `{total}`, `{items}` variables; otherwise it auto-formats a message with all line items. Opens in a new tab.

**Conversion**: "Aprobar" button on a cotización changes stage to `"Recibido"`, converting it to a repair ticket.

### Discount Codes

Discount codes live in the `discount_codes` Supabase table (migration 18). They are loaded into `state.discounts` at startup by `loadSupabaseState()`.

**Key functions:**
- `applyDiscount(baseAmount, code, scope)` — finds a matching active code from `state.discounts`, checks date range, scope array, and usage limit; returns `{amount, pct, label, valid, id}`.
- `markDiscountUsed(discountId)` — increments `used_count` in-memory and in Supabase. Called by `checkoutPos()` and cotización/ticket save paths when a code was applied.
- `renderDiscountManager()` — full CRUD UI in the Marketing tab; reads/writes `discount_codes` via Supabase.

**Schema**: `code` (unique), `type` (`fixed`|`percent`), `value`, `scope` (text array, e.g. `['pos','cotizacion','ticket']`), `valid_from`, `valid_until`, `max_uses`, `used_count`, `active`, `branch_id`.

**Scope values**: `"pos"`, `"cotizacion"`, `"ticket"` — a code with scope `['pos']` will be rejected when applied in a cotización.

### Marketing & Automation links

Marketing quick-links and automation tools are stored in `localStorage` (not Supabase):
- `fixzone-mkt-links-v1` — array of `{icon, name, url, desc}` objects
- `fixzone-auto-tools-v1` — same shape, default populated from `DEFAULT_AUTO_TOOLS`

**`renderMarketingLinksGrid(container, links, onSave)`** — reusable inline editor used by both marketing links and automation tools sections. Renders a grid of clickable cards in view mode; switches to row-based input form in edit mode. Anti-accumulation pattern: `container.cloneNode(false)` + `replaceWith()` on each call to avoid stacking click listeners.

### WhatsApp templates

Templates stored in `localStorage` key `fixzone-wa-templates-v1`. Default keys:
- `cotizacion` — empty by default (falls back to auto-formatted message with line items)
- `listo`, `abono`, `pagado`, `garantia` — status-based message templates

Available variables: `{cliente}`, `{equipo}`, `{sucursal}`, `{folio}`, `{monto}`, `{saldo}`, `{total}`, `{items}`. `fillWATemplate()` handles substitution. Templates are editable in the Automatización tab.

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

Files 04–06 (intermediate fixes) are superseded by 07–11 and do not need to be re-applied.

### Edge Functions
Two Deno Edge Functions in `supabase/functions/`:
- `create_employee/` — create/update/delete/reset_password for employees. Uses service-role key. Maps frontend roles to DB roles at insert/update time. Sets `email = username@fixzone.internal` on insert so RLS email lookup works.
- `login-employee/` — legacy bcrypt login, not used in current auth flow.

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
- **Sidebar tooltip position**: `NAV_TOOLTIPS` renders tooltips at `left: 220px` (sidebar width). If the sidebar width changes, update that value in `initNavTooltips()`.
- **Adding a new view**: (1) add nav button in `index.html`, (2) add `<section class="view" id="{name}-view">`, (3) add `"{name}"` to the relevant role tabs in `PERMISSIONS`, (4) add to `PERM_SECTIONS`, (5) add entry to `NAV_TOOLTIPS`, (6) call `render{Name}()` from `render()`.
- **POS requires migration 13**: `supabase/13_pos_tables.sql` must be applied in the Supabase SQL Editor. Until then, `checkoutPos()` will throw a table-not-found error.
- **Cotizaciones require migration 16**: `supabase/16_quote_items.sql` adds the `quote_items` JSONB column. Without it, saving a cotización with line items will silently discard them.
- **Discount codes require migration 18**: `supabase/18_discount_codes.sql`. Without it, `state.discounts` stays `[]` and all discount code lookups fail silently (returns `{valid: false}`).
- **`applyDiscount` scope must match exactly**: valid scope values are `"pos"`, `"cotizacion"`, `"ticket"`. A mismatch (e.g. passing `"tickets"`) always returns `{valid: false}` — check the scope array in the `discount_codes` row and the call site.
- **`markDiscountUsed` must be called after a successful save** — not before. If the INSERT/UPDATE fails after calling it, the usage counter will be incremented with no matching transaction.
- **`renderMarketingLinksGrid` anti-accumulation**: always call it with the same DOM node reference; it internally calls `container.cloneNode(false)` + `replaceWith()`. Do not attach external click listeners to the container after calling this function — they'll be lost on the next render.
- **Browser cache after deploy**: Cloudflare Pages may serve cached JS/CSS. Users should hard-refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`) after a new deploy if they see stale styles.
