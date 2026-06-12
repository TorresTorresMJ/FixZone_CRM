# Instrucciones de integración — Branding por sucursal

## Archivos nuevos generados

| Archivo              | Descripción                                              |
|----------------------|----------------------------------------------------------|
| `brand-config.js`    | Config central: nombres, logos, colores, taglines        |
| `brand-by-branch.js` | Funciones nuevas/reemplazadas de app.js                  |
| `branch-brand.css`   | Variables CSS dinámicas y transiciones de marca          |

---

## 1. Copiar archivos al proyecto

```
brand-config.js    →  src/brand-config.js   (o raíz, junto a app.js)
brand-by-branch.js →  src/brand-by-branch.js
branch-brand.css   →  src/styles/branch-brand.css
```

---

## 2. Modificar index.html

### En <head>, DESPUÉS de app.css, agregar:
```html
<link rel="stylesheet" href="./src/styles/branch-brand.css" />
```

### Antes del cierre </body>, en este orden:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="./src/supabase-config.js"></script>
<script src="./src/brand-config.js"></script>   ← NUEVO (antes de app.js)
<script src="./src/app.js"></script>
```

---

## 3. Modificar app.js

Reemplaza estas 5 funciones con las versiones de brand-by-branch.js:

### a) setActiveBranch
Busca en app.js:
```js
function setActiveBranch(name) {
```
Reemplaza todo el cuerpo con la versión del patch.

### b) showLoginScreen
Busca en app.js:
```js
function showLoginScreen(errorMsg = "") {
```
Reemplaza por la versión del patch (lee la marca desde getBranchBrand).

### c) showApp
Busca en app.js:
```js
function showApp() {
```
Agrega `applyBranchBrand(activeBranchId);` después de `shell.style.display = "grid";`

### d) printTicket
Busca en app.js:
```js
function printTicket(ticket) {
```
Reemplaza por la versión del patch (lee logo/nombre desde getBranchBrand).

### e) initializeApp
Busca en app.js:
```js
async function initializeApp() {
  setupSupabase();
```
Agrega antes de setupSupabase():
```js
applyBranchBrand(activeBranchId);
```

### f) Agrega applyBranchBrand al inicio de app.js
Pega la función `applyBranchBrand` completa del archivo brand-by-branch.js
justo antes de `function setupSupabase()`.

---

## 4. Agregar indicador de sucursal en sidebar footer (opcional)

En index.html, dentro de `.sidebar-footer`, agregar:
```html
<div class="branch-indicator" id="active-branch-label">Puerto Vallarta</div>
```

Y en applyBranchBrand (brand-by-branch.js) ya está incluido el update:
```js
const branchLabel = document.querySelector("#active-branch-label");
if (branchLabel) branchLabel.textContent = brand.locationLabel;
```

---

## 5. Assets necesarios para RefacZone (Puebla)

Crear o agregar en `assets/brand/`:
```
LOGO-REFACZONE.png          ← logo principal RefacZone
logos-mono/refaczone-mono.png  ← versión monocromática para recibo
favicon-refaczone.png       ← favicon
```

Si los archivos no existen, el sistema cae automáticamente al logo de FixZone
gracias al `onerror` fallback configurado en brand-config.js.

---

## Resumen de lo que cambia al presionar cada tab de sucursal

| Elemento              | Puerto Vallarta (FixZone) | Puebla (RefacZone)        |
|-----------------------|---------------------------|---------------------------|
| Nombre en sidebar     | FIXZONE                   | REFACZONE                 |
| Logo sidebar          | LOGO-FIXZONE.png          | LOGO-REFACZONE.png        |
| Tagline topbar        | WE FIX FAST. YOU RELAX.  | REFACCIONES AL INSTANTE.  |
| Color primario        | #2F6FFF (azul)            | #E85D04 (naranja)         |
| Color secundario      | #4A8DFF                   | #F48C06                   |
| Fondo sidebar         | Azul oscuro               | Naranja/ámbar oscuro      |
| Fondo workspace       | Glow azul                 | Glow naranja              |
| Botones primarios     | Gradiente azul            | Gradiente naranja         |
| Tabs activos          | Azul                      | Naranja                   |
| Título de pestaña     | FixZone CRM               | RefacZone CRM             |
| Logo en recibo        | fixzone-mono.png          | refaczone-mono.png        |
| Header del recibo     | FixZone — Puerto Vallarta | RefacZone — Puebla        |
| Cierre del recibo     | Gracias por confiar en FixZone | Gracias por confiar en RefacZone |
