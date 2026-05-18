# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

FixZone CRM is a **vanilla HTML/CSS/JS single-page app** for managing a cell-phone repair shop. It has no build step and no framework — the browser loads scripts directly via `<script>` tags in `index.html`. The backend is **Supabase** (PostgreSQL + Auth + RLS).

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
| `index.html` | App shell — all view sections are defined here as `<section class="view">` |
| `src/app.js` | All client-side logic (~88 KB, single file) |
| `src/supabase-config.js` | Supabase project URL and anon key (`window.FIXZONE_SUPABASE`) |
| `src/brand-config.js` | Per-branch brand config — colors, logos, copy, marketing links (`window.BRANCH_BRANDS`) |
| `src/styles/brand-tokens.css` | CSS custom properties for brand colors |
| `src/styles/app.css` | All styles |
| `supabase/schema.sql` | Main DB schema |
| `supabase/02_security_rls.sql` | RLS helper functions (`private.current_user_email`, `private.is_active_employee`, `private.has_employee_role`) |

## Architecture

### Auth flow
Login uses **email + password** via Supabase Auth. After `signInWithPassword`, the app checks the `employees` table to confirm the user is active and retrieves their role. The app blocks access if the email is not in `employees` with `status = 'active'`.

### Role & permission system (frontend)
`app.js` defines a `PERMISSIONS` map keyed by role (`it`, `admin`, `standard`, `marketing`). Each role lists which nav tabs are visible and boolean flags (`canDeleteClients`, `canManageUsers`, etc.). The roles in the frontend differ slightly from the DB schema roles (`owner`, `admin`, `technician`, `sales`, `viewer`) — the frontend uses its own simplified set.

### Multi-branch data isolation
All tables that hold per-branch data include a `branch_id` foreign key to `public.branches`. Queries are expected to filter by the `activeBranchId` set when the user picks a branch tab. RLS policies on the Supabase side also enforce branch-level access.

### View routing
Navigation is purely DOM-based: `.nav-item[data-view]` buttons toggle the `is-visible` class on `<section class="view" id="{view}-view">` elements. `app.js` handles this in a `switchView()` function.

### Modal / form system
A single `<dialog id="record-modal">` is reused for all create/edit forms. `app.js` dynamically builds `<form-fields>` content and wires save logic by inspecting the current `data-open-form` type.

### Supabase SQL files
SQL files in `supabase/` are applied manually in Supabase dashboard order:
1. `schema.sql` — tables, triggers, indexes
2. `01_tables_and_seed.sql`, `01a_missing_purchase_tables.sql`, `01b_ticket_tables_repair.sql` — additive patches
3. `02_security_rls.sql` — RLS policies and helper functions

## Current migration status

The app is mid-migration from `localStorage` to Supabase. Some modules already read/write from Supabase; others still use localStorage. See `TODO.md` for the per-module status. When adding new features, use Supabase exclusively.

## Branch branding

To add or change brand config for a branch, edit `src/brand-config.js` under `window.BRANCH_BRANDS["Branch Name"]`. The object shape includes `colors` (CSS custom properties), `marketingLinks`, `autoFlows`, logo paths, and copy strings. `window.getBranchBrand(branchName)` is the accessor used throughout `app.js`.

## UI language

All UI text, form labels, status values, and copy are in **Spanish**.

## Supabase project

- Project ID: `zwmffnrkrrowmchluyyy`
- Branches seed data: `Puerto Vallarta`, `Puebla`
- Initial employees: Kevin Mijangos, Carlos Mijangos, Gigi Vargas, Monica Torres, Diego Mijangos, Daniel Mijangos
