# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

FixZone CRM is a **vanilla HTML/CSS/JS single-page app** for managing a cell-phone repair shop. It has no build step and no framework — the browser loads scripts directly via `<script>` tags in `index.html`. The backend is **Supabase** (PostgreSQL + Auth + RLS). Deployed on **Cloudflare Pages** (`fixzone-crm.pages.dev`) — push to `main` triggers auto-deploy.

There are two branches/brands operated from the same codebase:
- **Puerto Vallarta → FixZone** (blue palette, `#2F6FFF`)
- **Puebla → RefaxZone** (orange palette, `#E85D04`)

Brand theming is driven entirely by `src/brand-config.js` (`window.BRANCH_BRANDS`). Switching the active branch swaps CSS custom properties, logos, and copy at runtime.

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
| `src/app.js` | All client-side logic (~2 000 lines, single file) |
| `src/supabase-config.js` | Supabase project URL and anon key (`window.FIXZONE_SUPABASE`) |
| `src/brand-config.js` | Per-branch brand config — colors, logos, copy, marketing links (`window.BRANCH_BRANDS`) |
| `src/styles/brand-tokens.css` | CSS custom properties for brand colors |
| `src/styles/app.css` | All styles |
| `supabase/schema.sql` | Original DB schema |
| `supabase/02_security_rls.sql` | RLS helper functions and base policies |
| `supabase/03_fix_rls_functions.sql` | `is_active_employee()` and `has_employee_role()` use `auth_user_id OR email` |
| `supabase/08_fix_attachments_and_remaining.sql` | Additive `it` role policies for all tables |
| `supabase/09_normalize_all_roles.sql` | Normalizes frontend roles to DB roles in employees table |
| `supabase/10_storage_bucket_policies.sql` | RLS for `ticket-photos` Storage bucket |

## Architecture

### Auth flow
Login uses **username + password**. The username is converted to an internal email (`username@fixzone.internal`) and passed to `supabase.auth.signInWithPassword`. After login, `resolveCurrentEmployee()` looks up the employee record by `auth_user_id` (not email). The app blocks access if the user is not in `employees` with `status = 'active'`.

### Role & permission system

**Frontend PERMISSIONS map** (keyed by DB role value stored in `employees.role`):

| DB role | UI label | Access level |
|---|---|---|
| `admin` | Admin | Full access |
| `technician` | Estándar | Tickets, clients, products, supplies, view-only finance |
| `marketing` | Marketing | Tickets, clients, design, automation |
| `sales` | Ventas | Tickets, clients, products, supplies, manage finance |
| `viewer` | Solo lectura | Dashboard, reports only |

The `PERMISSIONS` map in `app.js` is the source of truth for which tabs are visible and which actions are enabled. It is **editable at runtime** via the "Permisos por Rol" editor in the Usuarios section — saved to `localStorage` key `fixzone-role-permissions-v1` and loaded at startup via `loadSavedPermissions()`.

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
- `state` is the in-memory object holding all data: `tickets`, `clients`, `products`, `supplies`, `transactions`, `employees`, `branches`, `supportTasks`
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

Files 04–06 (intermediate fixes) are superseded by 07–11 and do not need to be re-applied.

### Edge Functions
Two Deno Edge Functions in `supabase/functions/`:
- `create_employee/` — create/update/delete/reset_password for employees. Uses service-role key. Maps frontend roles to DB roles at insert/update time. Sets `email = username@fixzone.internal` on insert so RLS email lookup works.
- `login-employee/` — legacy bcrypt login, not used in current auth flow.

## Branch branding

To add or change brand config, edit `src/brand-config.js` under `window.BRANCH_BRANDS["Branch Name"]`. The object shape includes `colors` (CSS custom properties), `marketingLinks`, `autoFlows`, logo paths, and copy strings. `window.getBranchBrand(branchName)` is the accessor used throughout `app.js`.

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
