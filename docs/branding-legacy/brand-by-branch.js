// ──────────────────────────────────────────────────────────────────────────────
// PATCH — brand-by-branch.js
// Pega este bloque completo al INICIO de app.js, justo después de las constantes
// de configuración (después de la línea: const ROLE_LABELS = ...).
//
// También reemplaza las funciones indicadas en app.js por las versiones de abajo.
// ──────────────────────────────────────────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════════════════
// 1. FUNCIÓN CENTRAL: applyBranchBrand(branchName)
//    Aplica colores, nombre, logo, título y clases al DOM completo.
// ══════════════════════════════════════════════════════════════════════════════
function applyBranchBrand(branchName) {
  const brand = window.getBranchBrand(branchName);
  if (!brand) return;

  // ── 1a. CSS variables en :root ────────────────────────────────────────────
  const root = document.documentElement;
  for (const [key, val] of Object.entries(brand.colors)) {
    root.style.setProperty(key, val);
  }

  // ── 1b. Clase de marca en <body> ──────────────────────────────────────────
  document.body.classList.remove("brand-fixzone", "brand-refaxzone");
  document.body.classList.add(brand.brandClass);

  // ── 1c. Título de pestaña ─────────────────────────────────────────────────
  document.title = brand.pageTitle;

  // ── 1d. Sidebar: logo + nombre + tagline ──────────────────────────────────
  const brandLogoImg  = document.querySelector(".brand img");
  const brandNameEl   = document.querySelector(".brand strong");
  const brandLabelEl  = document.querySelector(".brand span");

  if (brandLogoImg) {
    brandLogoImg.src = brand.logoSrc;
    brandLogoImg.alt = brand.displayName;
    // Fallback si el logo nuevo no existe aún
    if (brand.logoFallback) {
      brandLogoImg.onerror = function() {
        this.src = brand.logoFallback;
        this.onerror = null;
      };
    }
  }
  if (brandNameEl)  brandNameEl.textContent  = brand.displayName;
  if (brandLabelEl) brandLabelEl.textContent = brand.crmLabel;

  // ── 1e. Topbar: eyebrow / tagline ─────────────────────────────────────────
  const eyebrowEl = document.querySelector(".topbar .eyebrow");
  if (eyebrowEl) eyebrowEl.textContent = brand.tagline;

  // ── 1f. Backgrounds inline (sidebar, workspace) ───────────────────────────
  const sidebar   = document.querySelector(".sidebar");
  const workspace = document.querySelector(".workspace");
  if (sidebar)   sidebar.style.background   = brand.colors["--fz-bg-sidebar"];
  if (workspace) workspace.style.background = brand.colors["--fz-bg-workspace"];

  // ── 1g. Favicon dinámico ──────────────────────────────────────────────────
  let favicon = document.querySelector("link[rel='icon']");
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }
  favicon.href = brand.faviconSrc || brand.logoSrc;

  // ── 1h. Animación de transición en el workspace ───────────────────────────
  if (workspace) {
    workspace.style.transition = "background 0.4s ease";
  }
  if (sidebar) {
    sidebar.style.transition = "background 0.4s ease";
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// 2. REEMPLAZA setActiveBranch en app.js con esta versión
// ══════════════════════════════════════════════════════════════════════════════
function setActiveBranch(name) {
  activeBranchId = name;

  // Tabs de sucursal
  document.querySelectorAll(".branch-tab").forEach(btn => {
    btn.classList.toggle("is-active", btn.textContent.trim() === name);
  });

  // Aplicar branding completo
  applyBranchBrand(name);

  render();
}
window.setActiveBranch = setActiveBranch;


// ══════════════════════════════════════════════════════════════════════════════
// 3. REEMPLAZA showLoginScreen en app.js con esta versión
//    (Lee la sucursal activa para poner el branding correcto en el login)
// ══════════════════════════════════════════════════════════════════════════════
function showLoginScreen(errorMsg = "") {
  document.querySelector(".app-shell").style.display = "none";

  // Aplicar variables de color de la sucursal activa al login
  applyBranchBrand(activeBranchId);
  const brand = window.getBranchBrand(activeBranchId);

  let loginEl = document.querySelector("#login-screen");
  if (!loginEl) {
    loginEl = document.createElement("div");
    loginEl.id = "login-screen";
    document.body.appendChild(loginEl);
  }
  loginEl.style.display = "flex";
  loginEl.style.background = brand.colors["--fz-bg-login"];

  loginEl.innerHTML = `
    <div class="login-card">
      <div class="login-brand">
        <img
          src="${brand.logoSrc}"
          alt="${brand.displayName}"
          onerror="this.src='${brand.logoFallback || brand.logoSrc}';this.onerror=null"
        />
        <h1>${brand.displayName}</h1>
        <p>${brand.crmLabel}</p>
      </div>
      <form id="login-form" class="login-form">
        <div class="field">
          <label>Usuario</label>
          <input id="login-username" type="text" placeholder="Miway01" required autocomplete="username" />
        </div>
        <div class="field">
          <label>Contraseña</label>
          <input id="login-password" type="password" placeholder="••••••••" required autocomplete="current-password" />
        </div>
        ${errorMsg ? `<p class="login-error">${escapeHtml(errorMsg)}</p>` : ""}
        <button class="primary-action login-btn" type="submit">Iniciar sesión</button>
      </form>
      <p class="login-footer">${brand.tagline} · Solo empleados</p>
    </div>
  `;
  document.querySelector("#login-form").addEventListener("submit", handleLogin);
}


// ══════════════════════════════════════════════════════════════════════════════
// 4. REEMPLAZA showApp en app.js con esta versión
// ══════════════════════════════════════════════════════════════════════════════
function showApp() {
  const loginEl    = document.querySelector("#login-screen");
  const changePwEl = document.querySelector("#change-password-screen");
  if (loginEl)    loginEl.style.display    = "none";
  if (changePwEl) changePwEl.style.display = "none";

  const shell = document.querySelector(".app-shell");
  shell.style.display = "grid";

  // Aplicar branding de la sucursal activa al abrir la app
  applyBranchBrand(activeBranchId);

  applyRolePermissions();
  updateAuthBar();
}


// ══════════════════════════════════════════════════════════════════════════════
// 5. REEMPLAZA printTicket en app.js — lee la marca desde getBranchBrand
// ══════════════════════════════════════════════════════════════════════════════
function printTicket(ticket) {
  const client     = state.clients.find(c => c.name.toLowerCase() === ticket.client.toLowerCase());
  const repairAmt  = Number(ticket.repairAmount ?? ticket.total ?? 0);
  const paidAmt    = Number(ticket.paidAmount ?? 0);
  const received   = Number(ticket.amountReceived ?? paidAmt ?? 0);
  const change     = Number(ticket.changeAmount ?? 0);
  const now        = new Date();
  const timeStr    = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const qrTarget   = receiptQrTarget();
  const qrImage    = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(qrTarget)}`;
  const D          = "----------------------------------------";

  // Leer marca de la sucursal del ticket (no la activa en UI)
  const ticketBranch = ticket.branch || activeBranchId;
  const brand        = window.getBranchBrand(ticketBranch);
  const logoMonoSrc  = brand.logoMonoSrc || brand.logoSrc;
  const logoMonoFallback = brand.logoMonoFallback || brand.logoFallback || brand.logoSrc;
  const receiptHeader = brand.receiptHeader || brand.displayName;

  document.querySelector("#print-receipt").innerHTML = `
<div class="rct">

  <div class="rct-logo">
    <img
      src="${logoMonoSrc}"
      alt="${brand.displayName}"
      onerror="this.src='${logoMonoFallback}';this.onerror=null"
    />
  </div>

  <p class="rct-dash">${D}</p>
  <p class="rct-center rct-title">RECIBO DE SERVICIO</p>
  <p class="rct-dash">${D}</p>

  <p class="rct-row"><strong>FOLIO:</strong> <span>${escapeHtml(ticket.tracking || ticket.id.toUpperCase())}</span> &nbsp;&nbsp; <strong>FECHA:</strong> <span>${escapeHtml(ticket.createdAt || dateStamp())}</span></p>
  <p class="rct-row"><strong>HORA:</strong> <span>${timeStr}</span></p>

  <p class="rct-dash">${D}</p>

  <p class="rct-row"><strong>SUCURSAL:</strong> <span>${escapeHtml(receiptHeader)}</span></p>

  <p class="rct-dash">${D}</p>

  <p class="rct-label">CLIENTE:</p>
  <p class="rct-value">${escapeHtml(ticket.client)}</p>
  <p class="rct-value">Tel: ${escapeHtml(client?.phone || "No registrado")}</p>
  <p class="rct-value">Email: ${escapeHtml(client?.email || "No registrado")}</p>

  <p class="rct-dash">${D}</p>

  <p class="rct-label">EQUIPO:</p>
  <p class="rct-value">${escapeHtml(ticket.productName || ticket.device || "Sin especificar")}</p>
  <p class="rct-value"><strong>PRIORIDAD:</strong> ${escapeHtml(ticket.priority || "Normal")} &nbsp;|&nbsp; <strong>ESTADO:</strong> ${escapeHtml(ticket.status)}</p>

  <p class="rct-dash">${D}</p>

  <p class="rct-label">FALLA REPORTADA:</p>
  <p class="rct-value">${escapeHtml(ticket.issue || "Sin especificar")}</p>

  <p class="rct-dash">${D}</p>

  <table class="rct-table">
    <thead>
      <tr><th>DESCRIPCIÓN DEL SERVICIO</th><th>IMPORTE</th></tr>
    </thead>
    <tbody>
      <tr><td>${escapeHtml(ticket.issue || "Servicio de reparación")}</td><td>${money.format(repairAmt)}</td></tr>
    </tbody>
  </table>

  <p class="rct-dash">${D}</p>

  <div class="rct-totals">
    <div class="rct-total-row rct-total-main"><span>TOTAL</span><strong>${money.format(repairAmt)}</strong></div>
    <div class="rct-total-row"><span>MÉTODO DE PAGO</span><span>${escapeHtml(ticket.paymentMethod || "Efectivo")}</span></div>
    <div class="rct-total-row"><span>PAGO RECIBIDO</span><span>${money.format(received)}</span></div>
    <div class="rct-total-row"><span>CAMBIO</span><span>${money.format(change)}</span></div>
  </div>

  <p class="rct-dash">${D}</p>

  <div class="rct-qr">
    <p class="rct-center">ESCANEA PARA SEGUIMIENTO</p>
    <img src="${qrImage}" alt="QR" />
  </div>

  <p class="rct-dash">${D}</p>

  <p class="rct-center"><strong>POLÍTICAS DE GARANTÍA</strong></p>
  <p class="rct-policy">• 30 días de garantía en mano de obra.</p>
  <p class="rct-policy">• La garantía no aplica por golpes, humedad, mal uso o intervención de terceros.</p>
  <p class="rct-policy">• Conserve este recibo para cualquier aclaración.</p>

  <p class="rct-dash">${D}</p>

  <p class="rct-thanks">★ Gracias por confiar en ${escapeHtml(brand.displayName)} ★</p>

  <p class="rct-dash">${D}</p>

  <div class="rct-sign">
    <div class="rct-sign-line"></div>
    <p>FIRMA DE RECIBIDO</p>
  </div>

</div>`;
  window.print();
}


// ══════════════════════════════════════════════════════════════════════════════
// 6. REEMPLAZA la llamada a initializeApp para aplicar branding desde el inicio
// ══════════════════════════════════════════════════════════════════════════════
async function initializeApp() {
  // Aplicar branding inicial (Puerto Vallarta por defecto)
  applyBranchBrand(activeBranchId);
  setupSupabase();
  await refreshSession();
}
