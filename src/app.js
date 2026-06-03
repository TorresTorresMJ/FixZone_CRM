// ──────────────────────────────────────────────────────────────────────────────
// FixZone CRM — app.js
// ──────────────────────────────────────────────────────────────────────────────

const storageKey   = "fixzone-crm-v1";
const money        = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const ticketStages = ["Cotizacion", "Recibido", "En reparacion", "Listo", "Entregado", "Garantia"];
const supportStages = ["Pendiente", "En progreso", "Resuelto"];
const BRANCHES     = ["Puerto Vallarta", "Puebla"];
const ROLES        = ["it", "admin", "standard", "marketing"];
const TX_CATEGORIES_INCOME  = ["Servicio","Venta","Anticipo","Garantia","Otro"];
const TX_CATEGORIES_EXPENSE = ["Inventario","Insumos","Renta","Nomina","Servicios","Herramientas","Operacion","Otro"];
const TX_CATEGORIES_ALL     = [...new Set([...TX_CATEGORIES_INCOME, ...TX_CATEGORIES_EXPENSE])];
const PRODUCT_CATEGORIES    = ["Refaccion","Bateria","Pantalla","Accesorio","Microsoldadura","Cable","Cargador","Otro"];
const POS_PAYMENT_METHODS   = ["Efectivo","Tarjeta","Transferencia","Otro"];
const DEVICE_MODELS_KEY = "fixzone-device-models-v1";
const DEFAULT_DEVICE_MODELS = [
  // iPhone
  "iPhone 6","iPhone 6 Plus","iPhone 6s","iPhone 6s Plus",
  "iPhone 7","iPhone 7 Plus",
  "iPhone 8","iPhone 8 Plus",
  "iPhone X","iPhone XR","iPhone XS","iPhone XS Max",
  "iPhone 11","iPhone 11 Pro","iPhone 11 Pro Max",
  "iPhone 12","iPhone 12 Mini","iPhone 12 Pro","iPhone 12 Pro Max",
  "iPhone 13","iPhone 13 Mini","iPhone 13 Pro","iPhone 13 Pro Max",
  "iPhone 14","iPhone 14 Plus","iPhone 14 Pro","iPhone 14 Pro Max",
  "iPhone 15","iPhone 15 Plus","iPhone 15 Pro","iPhone 15 Pro Max",
  "iPhone 16","iPhone 16 Plus","iPhone 16 Pro","iPhone 16 Pro Max",
  "iPhone 17","iPhone 17 Air","iPhone 17 Pro","iPhone 17 Pro Max",
  "iPhone SE (1ª gen)","iPhone SE (2ª gen)","iPhone SE (3ª gen)",
  // Samsung Galaxy S
  "Samsung Galaxy S10","Samsung Galaxy S10+","Samsung Galaxy S20","Samsung Galaxy S20+","Samsung Galaxy S20 Ultra",
  "Samsung Galaxy S21","Samsung Galaxy S21+","Samsung Galaxy S21 Ultra",
  "Samsung Galaxy S22","Samsung Galaxy S22+","Samsung Galaxy S22 Ultra",
  "Samsung Galaxy S23","Samsung Galaxy S23+","Samsung Galaxy S23 Ultra",
  "Samsung Galaxy S24","Samsung Galaxy S24+","Samsung Galaxy S24 Ultra",
  "Samsung Galaxy S25","Samsung Galaxy S25+","Samsung Galaxy S25 Edge","Samsung Galaxy S25 Ultra",
  // Samsung Galaxy A
  "Samsung Galaxy A12","Samsung Galaxy A13","Samsung Galaxy A14","Samsung Galaxy A15",
  "Samsung Galaxy A32","Samsung Galaxy A33","Samsung Galaxy A34",
  "Samsung Galaxy A50","Samsung Galaxy A51","Samsung Galaxy A52","Samsung Galaxy A52s",
  "Samsung Galaxy A53","Samsung Galaxy A54","Samsung Galaxy A55",
  "Samsung Galaxy A71","Samsung Galaxy A72","Samsung Galaxy A73",
  // Samsung Note / Fold
  "Samsung Galaxy Note 10","Samsung Galaxy Note 10+","Samsung Galaxy Note 20","Samsung Galaxy Note 20 Ultra",
  "Samsung Galaxy Z Fold 4","Samsung Galaxy Z Fold 5","Samsung Galaxy Z Flip 4","Samsung Galaxy Z Flip 5",
  // Motorola
  "Motorola Moto G","Motorola Moto G Play","Motorola Moto G Power","Motorola Moto G Stylus",
  "Motorola Moto G32","Motorola Moto G42","Motorola Moto G52","Motorola Moto G53","Motorola Moto G54",
  "Motorola Moto G62","Motorola Moto G73","Motorola Moto G84",
  "Motorola Edge 20","Motorola Edge 30","Motorola Edge 40","Motorola Edge 50",
  // Xiaomi / Redmi
  "Xiaomi Redmi 9","Xiaomi Redmi 9A","Xiaomi Redmi 10","Xiaomi Redmi 12","Xiaomi Redmi 13",
  "Xiaomi Redmi Note 10","Xiaomi Redmi Note 10 Pro","Xiaomi Redmi Note 11","Xiaomi Redmi Note 11 Pro",
  "Xiaomi Redmi Note 12","Xiaomi Redmi Note 12 Pro","Xiaomi Redmi Note 13","Xiaomi Redmi Note 13 Pro",
  "Xiaomi 12","Xiaomi 12 Pro","Xiaomi 13","Xiaomi 13 Pro","Xiaomi 14",
  // Huawei
  "Huawei Y7","Huawei Y9","Huawei P30","Huawei P30 Pro","Huawei P40","Huawei P40 Pro",
  "Huawei P50","Huawei P50 Pro","Huawei Mate 20","Huawei Mate 30","Huawei Mate 40",
  // LG
  "LG G8","LG V60","LG Velvet","LG K52",
  // iPad / Tablets
  "iPad","iPad Air","iPad Pro","iPad Mini","Samsung Galaxy Tab A","Samsung Galaxy Tab S",
];

const ROLE_LABELS  = { it: "Admin", owner: "Admin", admin: "Admin", standard: "Estándar", technician: "Estándar", marketing: "Marketing", viewer: "Solo lectura", sales: "Ventas" };

// ── Role permission map ───────────────────────────────────────────────────────
const PERMISSIONS = {
  // Frontend roles
  it:        { tabs: ["dashboard","cotizaciones","clients","products","tickets","supplies","precios","pos","finance","reports","users","soporte","diseno","automatizacion"], canDeleteClients: true, canDeleteTickets: true, canDeleteTask: true, canManageUsers: true, canManageFinance: true, canExportXLS: true },
  admin:     { tabs: ["dashboard","cotizaciones","clients","products","tickets","supplies","precios","pos","finance","reports","users","automatizacion"],           canDeleteClients: true, canDeleteTickets: true, canDeleteTask: true, canManageUsers: true, canManageFinance: true, canExportXLS: true },
  standard:  { tabs: ["dashboard","cotizaciones","clients","products","tickets","supplies","pos","finance","reports"],                  canDeleteClients: false, canDeleteTickets: true, canDeleteTask: false, canManageUsers: false, canManageFinance: false, canExportXLS: true },
  marketing: { tabs: ["dashboard","cotizaciones","clients","tickets","diseno","automatizacion"],                                  canDeleteClients: false, canDeleteTickets: false, canDeleteTask: false, canManageUsers: false, canManageFinance: false, canExportXLS: false },
  // DB roles (map to equivalent frontend permission sets)
  owner:      { tabs: ["dashboard","cotizaciones","clients","products","tickets","supplies","precios","pos","finance","reports","users","soporte","diseno","automatizacion"], canDeleteClients: true, canDeleteTickets: true, canDeleteTask: true, canManageUsers: true, canManageFinance: true, canExportXLS: true },
  sales:      { tabs: ["dashboard","cotizaciones","clients","products","tickets","supplies","precios","pos","finance","reports"],                  canDeleteClients: false, canDeleteTickets: true, canDeleteTask: false, canManageUsers: false, canManageFinance: true, canExportXLS: true },
  technician: { tabs: ["dashboard","cotizaciones","clients","products","tickets","supplies","pos","finance","reports"],                  canDeleteClients: false, canDeleteTickets: true, canDeleteTask: false, canManageUsers: false, canManageFinance: false, canExportXLS: true },
  viewer:     { tabs: ["dashboard","reports"],                                                                      canDeleteClients: false, canDeleteTickets: false, canDeleteTask: false, canManageUsers: false, canManageFinance: false, canExportXLS: false },
};

let activeBranchId  = "Puerto Vallarta";
let activeForm      = null;
let editingTicketId = null;
let posCart = []; // [{productId, name, qty, unitPrice, maxStock}]
let posCatalogFilter  = "all";
let posCatalogSearch  = "";
let posDiscount = 0;
let posDiscountCode = "";       // applied promo code in POS
let posPaymentMethod = "Efectivo";
let posCustomerId = null; // null = venta anónima
let lastPosSale = null; // sale snapshot shown after checkout for print button
let editingTaskId   = null;
let dataMode        = "local";
let supabaseClient = null;
let currentSession = null;
let currentEmployee = null; // { id, full_name, email, role, default_branch_id, force_password_change }
let lookups        = { branchesByName: new Map(), employeesByName: new Map(), employeesByEmail: new Map(), customersByName: new Map() };

// ── Seed data (local fallback) ────────────────────────────────────────────────
const employees = ["Kevin Mijangos","Carlos Mijangos","Gigi Vargas","Monica Torres","Diego Mijangos","Daniel Mijangos"];

const seed = {
  clients: [],
  branches:  BRANCHES.map((name, i) => ({ id:`b-${i+1}`, name })),
  employees: employees.map((name, i) => ({ id:`e-${i+1}`, name, role: i===3?"it":"admin", status:"active" })),
  products: [],
  tickets: [],
  supplies: [],
  transactions: [],
  supportTasks: [],
  posSales: [],
  discounts: [],
  serviceTypes: [],
  servicePrices: [],
};

let state = loadState();

// ── DOM refs ──────────────────────────────────────────────────────────────────
const views      = document.querySelectorAll(".view");
const navItems   = document.querySelectorAll(".nav-item");
const modal      = document.querySelector("#record-modal");
const recordForm = document.querySelector("#record-form");
const formFields = document.querySelector("#form-fields");
const modalTitle = document.querySelector("#modal-title");
const searchInput= document.querySelector("#global-search");

// ── Form schemas ──────────────────────────────────────────────────────────────
const formSchemas = {
  client: {
    title: "Cliente", collection: "clients",
    fields: [
      ["name","Nombre","text"],["phone","Telefono","tel"],["email","Email","email"],
      ["device","Equipo","device-autocomplete"],["address","Direccion","text"],
      ["lastVisit","Ultima visita","date"],
      ["status","Estado","select",["Nuevo","Activo","Garantia","Inactivo"]],
      ["notes","Notas","text",null,true],
    ],
  },
  product: {
    title: "Producto", collection: "products",
    fields: [
      ["branch","Sucursal","select",BRANCHES],["name","Nombre","text"],["sku","SKU","text"],
      ["productType","Tipo","select",["refaccion","producto","insumo"]],
      ["category","Categoria","select",PRODUCT_CATEGORIES],["stock","Stock","number"],["minStock","Minimo","number"],["price","Precio","number"],
    ],
  },
  ticket: {
    title: "Ticket", collection: "tickets",
    fields: [
      ["client","Cliente","text",null,false,true],["productName","Producto / equipo","device-autocomplete"],
      // Device detail fields
      ["imei","IMEI / No. Serie","text",null,false,true],
      ["color","Color","text"],
      ["accessories","Accesorios recibidos","text",null,true],
      ["physicalCondition","Condición física","select",["Bueno","Regular","Con daños","Muy dañado"]],
      ["serviceType","Tipo de servicio","service-type-select",null,false,true],
      ["issue","Falla / trabajo","text",null,true],
      ["branch","Sucursal","select",BRANCHES],["assignedTo","Empleado","select",employees],
      ["status","Stage","select",ticketStages],["priority","Prioridad","select",["Normal","Media","Alta","Urgente"]],
      ["repairAmount","Monto reparacion","number"],
      ["discountCode","Código de descuento","text",null,false,true],
      ["discountAmount","Descuento ($)","number",null,false,true],
      ["paymentStatus","Pago","select",["Pendiente","Abonado","Pagado"]],
      ["paidAmount","Monto pagado","number"],["createdAt","Fecha","date"],
      ["notes","Notas internas","text",null,true,true],
    ],
  },
  supply: {
    title: "Compra de insumo", collection: "supplies",
    fields: [
      ["date","Fecha","date"],
      ["supplier","Proveedor","text"],
      ["product_id","Producto del catálogo","product-select",null,true,true],
      ["item","Artículo (si no está en catálogo)","text",null,false,true],
      ["quantity","Cantidad","number"],
      ["total","Total MXN","number"],
    ],
  },
  transaction: {
    title: "Movimiento", collection: "transactions",
    fields: [
      ["date","Fecha","date"],["type","Tipo","select",["Ingreso","Egreso"]],
      ["concept","Concepto","text",null,true],["category","Categoria","select",TX_CATEGORIES_ALL],["amount","Monto","number"],
    ],
  },
  employee: {
    title: "Usuario", collection: "employees",
    fields: [
      ["full_name","Nombre completo","text"],["email","Email","email"],
      ["role","Rol","select",ROLES],
      ["branch_id","Sucursal","select",BRANCHES],
      ["phone","Telefono","tel"],
    ],
  },
  supportTasks: {
    title: "Tarea de soporte", collection: "supportTasks",
    fields: [
      ["title","Titulo","text",null,true],["description","Descripcion","text",null,true],
      ["priority","Prioridad","select",["Normal","Media","Alta","Urgente"]],
      ["status","Estado","select",supportStages],
    ],
  },
  cotizacion: {
    title: "Nueva cotización", collection: "tickets",
    fields: [
      ["client","Cliente","text"],
      ["productName","Dispositivo / equipo","device-autocomplete"],
      ["issue","Descripción del problema","text",null,true,true],
      ["branch","Sucursal","select",BRANCHES],
      ["notes","Notas","text",null,true,true],
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────────────────────────────────────
function loadState() {
  const saved = localStorage.getItem(storageKey);
  return normalizeState(saved ? JSON.parse(saved) : structuredClone(seed));
}

function saveState() {
  if (dataMode === "local") localStorage.setItem(storageKey, JSON.stringify(state));
}

function normalizeState(data) {
  const next = { ...structuredClone(seed), ...data };
  const stageMap = { "En proceso":"En reparacion","En espera":"Cotizacion" };
  next.branches   = next.branches?.length   ? next.branches   : structuredClone(seed.branches);
  next.employees  = next.employees?.length  ? next.employees  : structuredClone(seed.employees);
  next.supportTasks = next.supportTasks     || [];
  next.tickets = next.tickets.map((t, i) => ({
    ...t,
    tracking:      t.tracking      || nextTracking(i+1),
    productName:   t.productName   || t.device || "Equipo sin nombre",
    status:        stageMap[t.status] || t.status || "Recibido",
    repairAmount:  Number(t.repairAmount ?? t.total ?? 0),
    paymentStatus: t.paymentStatus || (Number(t.paidAmount||0)>0?"Abonado":"Pendiente"),
    paidAmount:    Number(t.paidAmount ?? 0),
    branch:        t.branch        || BRANCHES[0],
    assignedTo:    t.assignedTo    || employees[0],
  }));
  localStorage.setItem(storageKey, JSON.stringify(next));
  return next;
}

function nextTracking(seq) { return `[FZ] ${String(seq).padStart(4,"0")}`; }
function nextTicketSequence() {
  const seqs = state.tickets
    .filter(t => String(t.tracking||"").startsWith("[FZ]"))
    .map(t => Number(String(t.tracking||"").replace(/\D/g,""))).filter(Boolean);
  return Math.max(0,...seqs)+1;
}
function nextCotTracking() {
  const seqs = state.tickets
    .filter(t => String(t.tracking||"").startsWith("[COT]"))
    .map(t => Number(String(t.tracking||"").replace(/\D/g,""))).filter(Boolean);
  return `[COT] ${String(Math.max(0,...seqs)+1).padStart(4,"0")}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// SUPABASE + AUTH
// ──────────────────────────────────────────────────────────────────────────────
function setupSupabase() {
  const cfg = window.FIXZONE_SUPABASE;
  if (!window.supabase || !cfg?.url || !cfg?.anonKey) return;
  supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey);
  supabaseClient.auth.onAuthStateChange(async (event, _session) => {
    if (event === "SIGNED_OUT") {
      currentEmployee = null;
      currentSession  = null;
      dataMode        = "local";
      state           = loadState();
      showLoginScreen();
    }
  });
}

async function refreshSession() {
  if (!supabaseClient) { showLoginScreen(); return; }
  const { data } = await supabaseClient.auth.getSession();
  currentSession = data.session;
  if (!currentSession) { showLoginScreen(); return; }
  await afterLogin(currentSession.user);
}

function setLoading(on, label = "") {
  const bar    = document.querySelector("#loading-bar");
  const status = document.querySelector("#app-status");
  if (bar)    bar.style.display    = on ? "block" : "none";
  if (status) status.textContent   = on ? (label || "Cargando…") : (dataMode === "remote" ? "Supabase activo" : "Base local activa");
}

async function reloadState() {
  setLoading(true, "Sincronizando…");
  try {
    const remote = await loadSupabaseState();
    state = {
      ...remote,
      clients:      remote.clients.length      ? remote.clients      : structuredClone(seed.clients),
      products:     remote.products.length     ? remote.products     : structuredClone(seed.products),
      tickets:      remote.tickets.length      ? remote.tickets      : structuredClone(seed.tickets),
      supplies:     remote.supplies.length     ? remote.supplies     : structuredClone(seed.supplies),
      transactions: remote.transactions.length ? remote.transactions : structuredClone(seed.transactions),
      posSales:      remote.posSales            ? remote.posSales     : [],
      discounts:     remote.discounts           || [],
      serviceTypes:  remote.serviceTypes        || [],
      servicePrices: remote.servicePrices       || [],
    };
    return state;
  } finally {
    setLoading(false);
  }
}

async function afterLogin(authUser) {
  try {
    await resolveCurrentEmployee(authUser);
    if (currentEmployee?.force_password_change) {
      showChangePasswordScreen();
      return;
    }
    await reloadState();
    dataMode = "remote";
    if (currentEmployee?.default_branch_id) {
      const branch = [...lookups.branchesByName.values()]
        .find(b => b.id === currentEmployee.default_branch_id);
      if (branch) activeBranchId = branch.name;
    }
    showApp();
    render();
  } catch(err) {
    console.error(err);
    supabaseClient.auth.signOut().catch(() => {});
    showLoginScreen(err.message || "Error al verificar acceso. Contacta a IT.");
  }
}

async function resolveCurrentEmployee(authUser) {
  const user = authUser ?? (await supabaseClient.auth.getSession()).data.session?.user;
  if (!user) throw new Error("Sesión inválida.");
  const { data, error } = await supabaseClient
    .from("employees")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();
  if (error || !data) throw new Error("Usuario no encontrado. Contacta a IT.");
  if (data.status !== "active") throw new Error("Tu cuenta está inactiva. Contacta a IT.");
  currentEmployee = data;
}

// ── Login screen ──────────────────────────────────────────────────────────────
function showLoginScreen(errorMsg = "") {
  document.querySelector(".app-shell").style.display = "none";
  const brand = window.getBranchBrand(activeBranchId);
  applyBranchBrand(activeBranchId);
  let loginEl = document.querySelector("#login-screen");
  if (!loginEl) {
    loginEl = document.createElement("div");
    loginEl.id = "login-screen";
    document.body.appendChild(loginEl);
  }
  loginEl.style.display = "flex";
  loginEl.style.background = brand.loginBg;
  loginEl.innerHTML = `
    <div class="login-card">
      <div class="login-brand">
        <img src="${brand.logoSrc}" alt="${brand.displayName}"
          onerror="this.src='${brand.logoFallback || brand.logoSrc}';this.onerror=null" />
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

async function handleLogin(e) {
  e.preventDefault();
  const username = document.querySelector("#login-username").value.trim().toLowerCase();
  const password = document.querySelector("#login-password").value;
  const btn      = document.querySelector(".login-btn");
  btn.textContent = "Verificando...";
  btn.disabled    = true;
  const resetBtn = () => { btn.textContent = "Iniciar sesión"; btn.disabled = false; };
  const loginTimeout = setTimeout(() => {
    resetBtn();
    showLoginScreen("Tiempo de espera agotado. Verifica tu conexión e intenta de nuevo.");
  }, 20000);
  try {
    const authEmail = `${username}@fixzone.internal`;
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email:    authEmail,
      password: password,
    });
    if (error) throw new Error("Usuario o contraseña incorrectos.");
    currentSession = data.session;
    await afterLogin(data.user);
    clearTimeout(loginTimeout);
  } catch(err) {
    clearTimeout(loginTimeout);
    showLoginScreen(err.message || "Credenciales incorrectas.");
  }
}

// ── Change password screen ────────────────────────────────────────────────────
function showChangePasswordScreen() {
  document.querySelector(".app-shell").style.display = "none";
  let el = document.querySelector("#change-password-screen");
  if (!el) {
    el = document.createElement("div");
    el.id = "change-password-screen";
    document.body.appendChild(el);
  }
  const brand = window.getBranchBrand(activeBranchId);
  el.style.display = "flex";
  el.style.background = brand.loginBg;
  el.innerHTML = `
    <div class="login-card">
      <div class="login-brand">
        <img src="${brand.logoSrc}" alt="${brand.displayName}"
          onerror="this.src='${brand.logoFallback || brand.logoSrc}';this.onerror=null" />
        <h1>CAMBIO DE CONTRASEÑA</h1>
        <p>Debes establecer una contraseña nueva antes de continuar.</p>
      </div>
      <form id="change-pw-form" class="login-form">
        <div class="field">
          <label>Nueva contraseña</label>
          <input id="new-password" type="password" placeholder="Mínimo 8 caracteres" required minlength="8" />
        </div>
        <div class="field">
          <label>Confirmar contraseña</label>
          <input id="confirm-password" type="password" placeholder="Repite la contraseña" required minlength="8" />
        </div>
        <p id="pw-error" class="login-error" style="display:none"></p>
        <button class="primary-action login-btn" type="submit">Guardar contraseña</button>
      </form>
    </div>
  `;
  document.querySelector("#change-pw-form").addEventListener("submit", handleChangePassword);
}

async function handleChangePassword(e) {
  e.preventDefault();
  const newPw  = document.querySelector("#new-password").value;
  const confPw = document.querySelector("#confirm-password").value;
  const errEl  = document.querySelector("#pw-error");
  if (newPw !== confPw) { errEl.textContent = "Las contraseñas no coinciden."; errEl.style.display="block"; return; }
  if (newPw === "miwaysillos05") { errEl.textContent = "Debes usar una contraseña diferente a la default."; errEl.style.display="block"; return; }
  if (newPw.length < 8) { errEl.textContent = "Mínimo 8 caracteres."; errEl.style.display="block"; return; }
  const btn = document.querySelector("#change-pw-form .login-btn");
  btn.textContent = "Guardando..."; btn.disabled = true;
  try {
    const { error } = await supabaseClient.auth.updateUser({ password: newPw });
    if (error) throw error;
    await supabaseClient
      .from("employees")
      .update({ force_password_change: false })
      .eq("id", currentEmployee.id);
    currentEmployee.force_password_change = false;
    document.querySelector("#change-password-screen").style.display = "none";
    await reloadState();
    dataMode = "remote";
    showApp();
    render();
  } catch(err) {
    errEl.textContent = err.message; errEl.style.display="block";
    btn.textContent = "Guardar contraseña"; btn.disabled = false;
  }
}

function showApp() {
  const loginEl = document.querySelector("#login-screen");
  const changePwEl = document.querySelector("#change-password-screen");
  if (loginEl) loginEl.style.display = "none";
  if (changePwEl) changePwEl.style.display = "none";
  const shell = document.querySelector(".app-shell");
  shell.style.display = "grid";
  applyBranchBrand(activeBranchId);
  applyRolePermissions();
  updateAuthBar();
}

function updateAuthBar() {
  const role  = currentEmployee?.role || "—";
  const name  = currentEmployee?.full_name || currentSession?.user?.email || "—";
  const label = ROLE_LABELS[role] || role;
  document.querySelector("#auth-user-name").textContent = name;
  document.querySelector("#auth-user-role").textContent = label;
  document.querySelector("#logout-button").classList.remove("is-hidden");
  document.querySelector(".sidebar-footer span").textContent = "Supabase activo";
  document.querySelector("#record-count").textContent = `${totalRecords()} registros`;
}

function applyRolePermissions() {
  const role = currentEmployee?.role || "standard";
  const perms = PERMISSIONS[role] || PERMISSIONS.standard;

  // Show/hide nav tabs
  document.querySelectorAll(".nav-item").forEach(btn => {
    const view = btn.dataset.view;
    const allowed = perms.tabs.includes(view);
    btn.style.display = allowed ? "" : "none";
  });

  // Show/hide delete buttons based on role
  document.body.dataset.role = role;
  document.body.dataset.canDelete = perms.canDeleteClients ? "true" : "false";
  document.body.dataset.canManageFinance = perms.canManageFinance ? "true" : "false";
  document.body.dataset.canManageUsers = perms.canManageUsers ? "true" : "false";
  document.body.dataset.canExport = perms.canExportXLS ? "true" : "false";

  // Finance add button visibility
  const financeAddBtn = document.querySelector("[data-open-form='transaction']");
  if (financeAddBtn) financeAddBtn.style.display = perms.canManageFinance ? "" : "none";

  // Export buttons
  document.querySelectorAll("[data-export-sheet], #export-data").forEach(btn => {
    btn.style.display = perms.canExportXLS ? "" : "none";
  });
}

function currentPerms() {
  const role = currentEmployee?.role || "standard";
  return PERMISSIONS[role] || PERMISSIONS.standard;
}

// ──────────────────────────────────────────────────────────────────────────────
// REMOTE DATA
// ──────────────────────────────────────────────────────────────────────────────
async function loadSupabaseState() {
  const [bRes,eRes,cRes,dRes,pRes,tRes,puRes,txRes,stRes,psRes,dcRes,stypRes,spRes] = await Promise.all([
    supabaseClient.from("branches").select("*").order("name"),
    supabaseClient.from("employees").select("*").order("full_name"),
    supabaseClient.from("customers").select("*").order("created_at",{ascending:false}),
    supabaseClient.from("customer_devices").select("*").order("created_at",{ascending:false}),
    supabaseClient.from("products").select("*").order("name"),
    supabaseClient.from("service_tickets").select("*").order("created_at",{ascending:false}),
    supabaseClient.from("supply_purchases").select("*, suppliers(name)").order("purchase_date",{ascending:false}),
    supabaseClient.from("transactions").select("*").order("transaction_date",{ascending:false}),
    supabaseClient.from("support_tasks").select("*, employees!support_tasks_assigned_to_fkey(full_name)").order("created_at",{ascending:false}),
    supabaseClient.from("pos_sales").select("*").order("created_at",{ascending:false}).limit(50),
    supabaseClient.from("discount_codes").select("*").order("created_at",{ascending:false}),
    supabaseClient.from("service_types").select("*").order("sort_order"),
    supabaseClient.from("service_prices").select("*"),
  ]);

  const branchRows   = bRes.data  || [];
  const employeeRows = eRes.data  || [];
  const customerRows = cRes.data  || [];
  const deviceRows   = dRes.data  || [];

  lookups = {
    branchesByName:  new Map(branchRows.map(b   => [b.name,       b])),
    employeesByName: new Map(employeeRows.map(e  => [e.full_name,  e])),
    employeesByEmail:new Map(employeeRows.map(e  => [e.email,      e])),
    customersByName: new Map(customerRows.map(c  => [c.full_name,  c])),
  };

  const deviceByCustomer = new Map();
  const deviceById       = new Map();
  for (const d of deviceRows) {
    if (!deviceByCustomer.has(d.customer_id)) deviceByCustomer.set(d.customer_id, d);
    deviceById.set(d.id, d);
  }
  const customerById = new Map(customerRows.map(c => [c.id, c]));

  return {
    branches:  branchRows.map(b => ({ id:b.id, name:b.name })),
    employees: employeeRows.map(e => ({
      id:e.id, name:e.full_name, email:e.email, role:e.role, status:e.status,
      branch:branchRows.find(b=>b.id===e.branch_id)?.name||"",
      default_branch_id:e.default_branch_id, auth_user_id:e.auth_user_id,
      force_password_change:e.force_password_change,
    })),
    clients: customerRows.map(c => {
      const dev = deviceByCustomer.get(c.id);
      return {
        id:c.id, name:c.full_name, phone:c.phone||"", email:c.email||"",
        device:dev?.product_name||"",
        lastVisit:(c.updated_at||c.created_at||"").slice(0,10),
        status:"Activo",
        branch:branchRows.find(b=>b.id===c.branch_id)?.name||"",
      };
    }),
    products: (pRes.data||[]).map(p => ({
      id:p.id, name:p.name, sku:p.sku||"", category:p.category, stock:Number(p.stock||0),
      minStock:Number(p.min_stock||0), price:Number(p.sale_price||p.unit_cost||0),
      productType:p.product_type||"refaccion",
      branch:branchRows.find(b=>b.id===p.branch_id)?.name||BRANCHES[0],
    })),
    tickets: (tRes.data||[]).map(t => {
      const dev  = deviceById.get(t.device_id);
      const cust = customerById.get(t.customer_id);
      return {
        id:t.id, tracking:t.tracking_number, client:t.customer_name, productName:t.product_name,
        issue:t.issue_description, status:t.stage, priority:t.priority,
        repairAmount:Number(t.repair_amount||0), paymentStatus:t.payment_status, paidAmount:Number(t.paid_amount||0),
        branch:branchRows.find(b=>b.id===t.branch_id)?.name||BRANCHES[0],
        assignedTo:employeeRows.find(e=>e.id===t.assigned_employee_id)?.full_name||"",
        createdAt:(t.created_at||t.received_at||"").slice(0,10),
        notes:t.notes||"",
        discountCode:t.discount_code||"",
        discountAmount:Number(t.discount_amount||0),
        discountPct:Number(t.discount_pct||0),
        serviceType:t.service_type||"",
        deviceId:t.device_id||null,
        // Device fields — enable search by IMEI/serial and pre-populate edit form
        imei:dev?.imei||"",
        serialNumber:dev?.serial_number||"",
        color:dev?.color||"",
        accessories:dev?.accessories_received||"",
        physicalCondition:dev?.physical_condition||"",
        // Customer phone — enable search by phone number
        phone:cust?.phone||"",
        quoteItems: Array.isArray(t.quote_items) ? t.quote_items : (t.quote_items ? JSON.parse(t.quote_items) : []),
      };
    }),
    supplies: (puRes.data||[]).map(p => ({
      id:p.id, date:p.purchase_date, supplier:p.suppliers?.name||"Sin proveedor",
      item:p.item_name, quantity:Number(p.quantity||0), total:Number(p.total_amount||0),
      product_id:p.product_id||null, receipt_url:p.receipt_url||null,
      branch:branchRows.find(b=>b.id===p.branch_id)?.name||BRANCHES[0],
    })),
    transactions: (txRes.data||[]).map(t => ({
      id:t.id, date:t.transaction_date, type:t.type, concept:t.concept,
      category:t.category, amount:Number(t.amount||0),
      branch:branchRows.find(b=>b.id===t.branch_id)?.name||BRANCHES[0],
    })),
    supportTasks: (stRes.data||[]).map(t => ({
      id:t.id, title:t.title, description:t.description||"", priority:t.priority,
      status:t.status, assignedTo:t.employees?.full_name||"Sin asignar",
      createdAt:(t.created_at||"").slice(0,10),
    })),
    posSales: (psRes.data||[]).map(s => ({
      id:s.id, total:Number(s.total||0), paymentMethod:s.payment_method||"",
      discount:Number(s.discount_amount||0),
      createdAt:(s.created_at||"").slice(0,10),
      branch:branchRows.find(b=>b.id===s.branch_id)?.name||BRANCHES[0],
    })),
    discounts: (dcRes.data||[]).map(d => ({
      id:d.id, code:d.code, description:d.description||"",
      type:d.type, value:Number(d.value),
      maxUses:d.max_uses||null, usedCount:Number(d.used_count||0),
      validFrom:d.valid_from||null, validUntil:d.valid_until||null,
      scope:Array.isArray(d.scope)?d.scope:["pos","cotizacion","ticket"],
      active:d.active, branchId:d.branch_id||null,
    })),
    serviceTypes: (stypRes.data||[]).map(s => ({ id:s.id, name:s.name, sortOrder:Number(s.sort_order||0) })),
    servicePrices: (spRes.data||[]).map(p => ({
      id:p.id, deviceModel:p.device_model, serviceTypeId:p.service_type_id,
      price:Number(p.price||0), branchId:p.branch_id||null, notes:p.notes||"",
      variant:p.variant||"",
    })),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// ROUTING / VIEWS
// ──────────────────────────────────────────────────────────────────────────────
function setView(name) {
  const perms = currentPerms();
  if (!perms.tabs.includes(name)) return;
  views.forEach(v => v.classList.toggle("is-visible", v.id===`${name}-view`));
  navItems.forEach(b => b.classList.toggle("is-active", b.dataset.view===name));
  document.querySelector("#view-title").textContent = document.querySelector(`#${name}-view`)?.dataset.title||"Home";
}

// ──────────────────────────────────────────────────────────────────────────────
// RENDER
// ──────────────────────────────────────────────────────────────────────────────
function render() {
  renderMetrics();
  renderClients();
  renderProducts();
  renderTickets();
  renderCotizaciones();
  renderSupplies();
  renderPrecios();
  renderPos();
  renderFinance();
  renderReports();
  renderUsers();
  renderSupport();
  renderDiseno();
  renderAutoToolsSection();
  document.querySelector("#record-count").textContent = `${totalRecords()} registros`;
}

function totalRecords() {
  return Object.values(state).reduce((s,r) => s+(Array.isArray(r)?r.length:0), 0);
}

function bySearch(items) {
  const term = searchInput.value.trim().toLowerCase();
  return term ? items.filter(i => Object.values(i).join(" ").toLowerCase().includes(term)) : items;
}

function branchTickets()       { return state.tickets.filter(t => !t.branch || t.branch === activeBranchId); }
function branchProducts()      { return state.products.filter(p => !p.branch || p.branch === activeBranchId); }
function branchClients()       { return state.clients.filter(c => !c.branch || c.branch === activeBranchId); }
function branchSupplies()      { return state.supplies.filter(s => !s.branch || s.branch === activeBranchId); }
function branchTransactions()  { return state.transactions.filter(t => !t.branch || t.branch === activeBranchId); }
function sumByType(list, type) { return list.filter(i=>i.type===type).reduce((s,i)=>s+Number(i.amount||0),0); }

function renderMetrics() {
  const branchTxs   = branchTransactions();
  const today       = dateStamp();
  const todayTxs    = branchTxs.filter(t => t.date === today);
  const income      = sumByType(todayTxs,"Ingreso");
  const expenses    = sumByType(todayTxs,"Egreso");
  const openTickets = branchTickets().filter(t=>t.status!=="Entregado").length;
  const lowStockItems = branchProducts().filter(p=>Number(p.stock)<=Number(p.minStock)&&Number(p.minStock)>0);

  document.querySelector("#metric-grid").innerHTML = [
    ["Clientes",branchClients().length,""],
    ["Tickets abiertos",openTickets,""],
    ["Ingresos hoy",money.format(income),"type-income"],
    ["Egresos hoy",money.format(expenses),"type-expense"],
  ].map(([l,v,cls])=>`<article class="metric"><span>${l}</span><strong class="${cls}">${v}</strong></article>`).join("");

  // Stock-low alert banner
  const banner = document.querySelector("#stock-alert-banner");
  if (banner) {
    banner.innerHTML = lowStockItems.length
      ? `<div style="background:rgba(255,159,67,0.12);border:1px solid rgba(255,159,67,0.3);border-radius:8px;padding:10px 16px;margin-bottom:16px;font-size:13px;display:flex;align-items:center;gap:10px">
          <span style="font-size:18px">⚠️</span>
          <div><strong>${lowStockItems.length} producto${lowStockItems.length>1?"s":""} con stock bajo:</strong>
          ${lowStockItems.map(p=>`<span style="margin-left:8px;opacity:.8">${escapeHtml(p.name)} (${p.stock}/${p.minStock})</span>`).join("")}</div>
          <button class="ghost-button" data-view="products" style="margin-left:auto;font-size:12px">Ver productos →</button>
        </div>`
      : "";
  }

  document.querySelector("#active-ticket-list").innerHTML = branchTickets()
    .filter(t=>t.status!=="Entregado").slice(0,5).map(ticketCard).join("")||emptyMessage("No hay tickets activos.");

  document.querySelector("#recent-activity").innerHTML = branchTxs
    .slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6)
    .map(item=>`
      <div class="activity-item">
        <div><strong>${escapeHtml(item.concept)}</strong><br><span class="muted">${item.date} · ${escapeHtml(item.category)}</span></div>
        <span class="type-pill ${item.type==="Ingreso"?"type-income":"type-expense"}">${item.type==="Ingreso"?"+":"-"}${money.format(item.amount)}</span>
      </div>`).join("")||emptyMessage("Sin movimientos recientes.");
}

function renderClients() {
  const perms = currentPerms();
  document.querySelector("#clients-table").innerHTML = bySearch(branchClients()).map(c=>`
    <tr>
      <td><strong>${c.name}</strong><br><span class="muted">${c.email}</span></td>
      <td>${c.phone}</td><td>${c.device}</td><td>${c.lastVisit}</td>
      <td><span class="status">${c.status}</span></td>
      <td>
        <div class="action-row" style="justify-content:flex-end;gap:6px">
          <button class="mini-button" data-edit-client="${c.id}">Editar</button>
          ${perms.canDeleteClients ? `<button class="mini-button danger-btn" data-delete-client="${c.id}">Eliminar</button>` : ""}
        </div>
      </td>
    </tr>`).join("")||tableEmpty(6);
}

let productTypeFilter = "all";
let productSortKey    = "name";
let productSortDir    = "asc";
const PTYPE_LABEL = { producto:"Vendible", refaccion:"Refacción", insumo:"Insumo" };

function renderProducts() {
  document.querySelectorAll(".ptype-filter").forEach(b =>
    b.classList.toggle("is-active", b.dataset.ptype === productTypeFilter));

  let items = bySearch(branchProducts())
    .filter(p => productTypeFilter === "all" || p.productType === productTypeFilter);

  items = [...items].sort((a, b) => {
    let va = a[productSortKey], vb = b[productSortKey];
    if (productSortKey === "stock" || productSortKey === "price") {
      va = Number(va||0); vb = Number(vb||0);
      return productSortDir === "asc" ? va - vb : vb - va;
    }
    va = String(va||"").toLowerCase(); vb = String(vb||"").toLowerCase();
    return productSortDir === "asc" ? va.localeCompare(vb,"es") : vb.localeCompare(va,"es");
  });

  const sortIcon = k => productSortKey === k ? (productSortDir === "asc" ? " ▲" : " ▼") : " ⇅";
  const thCls    = k => productSortKey === k ? " col-active" : "";
  const thAlign  = right => right ? ' style="text-align:right"' : "";
  const th = (k, label, right) =>
    `<th data-sort-product="${k}" class="${thCls(k)}"${thAlign(right)}>${label}<span style="opacity:.55;font-size:9px">${sortIcon(k)}</span></th>`;

  const legend = `<div class="inv-legend">
    <span><span class="inv-legend-dot" style="background:rgba(245,158,11,0.55)"></span>Stock bajo</span>
    <span><span class="inv-legend-dot" style="background:rgba(239,68,68,0.55)"></span>Agotado</span>
  </div>`;

  document.querySelector("#products-grid").innerHTML = items.length === 0
    ? emptyMessage("No hay productos en esta categoría.")
    : legend + `<div class="inventory-table-wrap"><table class="inventory-table">
        <thead><tr>
          ${th("name","Nombre")}
          ${th("sku","SKU")}
          ${th("category","Categoría")}
          ${th("productType","Tipo")}
          ${th("stock","Stock",true)}
          ${th("minStock","Stk Mín",true)}
          ${th("price","Costo",true)}
          <th style="cursor:default;text-align:right">Acciones</th>
        </tr></thead>
        <tbody>
          ${items.map(p => {
            const stock = Number(p.stock), min = Number(p.minStock);
            const outOfStock = stock <= 0;
            const lowStock   = !outOfStock && min > 0 && stock <= min;
            const rowCls     = outOfStock ? " row-out-stock" : lowStock ? " row-low-stock" : "";
            const stockCls   = outOfStock ? "sv-out" : lowStock ? "sv-low" : "sv-ok";
            const pt         = p.productType || "refaccion";
            const typeLabel  = PTYPE_LABEL[pt] || pt;
            const badgeCls   = `tbadge tbadge-${pt}`;
            return `<tr class="${rowCls}">
              <td><strong style="font-size:12px">${escapeHtml(p.name)}</strong></td>
              <td style="color:rgba(255,255,255,.45);font-size:11px;font-family:monospace">${escapeHtml(p.sku||"—")}</td>
              <td style="font-size:12px">${escapeHtml(p.category)}</td>
              <td><span class="${badgeCls}">${typeLabel}</span></td>
              <td style="text-align:right"><span class="${stockCls}">${stock}</span></td>
              <td style="text-align:right;color:rgba(255,255,255,.4);font-size:12px">${min > 0 ? min : "—"}</td>
              <td style="text-align:right;font-weight:600">${money.format(p.price)}</td>
              <td style="text-align:right;white-space:nowrap">
                <button class="mini-button" data-edit-product="${p.id}" style="font-size:11px;padding:2px 8px">Editar</button>
                <button class="mini-button danger-btn" data-delete-product="${p.id}" style="font-size:11px;padding:2px 8px">✕</button>
              </td>
            </tr>`;
          }).join("")}
        </tbody>
      </table></div>`;
}

document.querySelector("#product-type-bar")?.addEventListener("click", e => {
  const btn = e.target.closest(".ptype-filter");
  if (!btn) return;
  productTypeFilter = btn.dataset.ptype;
  renderProducts();
});

function renderTickets() {
  const perms = currentPerms();
  document.querySelector("#ticket-board").innerHTML = ticketStages.map(status=>{
    const tickets = bySearch(branchTickets()).filter(t=>t.status===status);
    return `<section class="kanban-column"
      ondragover="event.preventDefault();this.classList.add('drag-over')"
      ondragleave="this.classList.remove('drag-over')"
      ondrop="handleKanbanDrop(event,'${status}');this.classList.remove('drag-over')"
      data-stage="${status}">
      <h3>${status} <span>${tickets.length}</span></h3>
      <div class="ticket-stack">${tickets.map(t=>ticketCard(t,perms)).join("")||emptyMessage("Sin tickets.")}</div>
    </section>`;
  }).join("");
}

async function handleKanbanDrop(event, newStage) {
  event.preventDefault();
  const ticketId = event.dataTransfer.getData("ticketId");
  if (!ticketId) return;
  const ticket = state.tickets.find(t => t.id === ticketId);
  if (!ticket || ticket.status === newStage) return;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketId);
  const idx = state.tickets.findIndex(t => t.id === ticketId);
  const oldStatus = ticket.status;
  // Optimistic update
  if (idx !== -1) state.tickets[idx] = { ...ticket, status: newStage };
  render();
  if (dataMode === "remote" && isUUID) {
    setLoading(true, "Guardando…");
    try {
      await updateRemoteTicket(ticketId, { ...ticket, status: newStage });
      try { await reloadState(); } catch(e) { console.warn(e); }
      render();
    } catch(err) {
      if (idx !== -1) state.tickets[idx] = { ...state.tickets[idx], status: oldStatus };
      render();
      showErrorToast(`Error al mover ticket: ${err.message}`);
      return;
    } finally {
      setLoading(false);
    }
  }
  // WhatsApp notification when ticket is ready for pickup
  if (newStage === "Listo") {
    const msg = fillWATemplate("listo", ticket);
    showWhatsAppToast(ticket, msg);
  }
}
window.handleKanbanDrop = handleKanbanDrop;

// ── Cotizaciones ──────────────────────────────────────────────────────────────
function renderCotizaciones() {
  const perms  = currentPerms();
  const quotes = bySearch(branchTickets().filter(t => t.status === "Cotizacion"));
  const el     = document.querySelector("#cotizaciones-board");
  if (!el) return;
  el.innerHTML = quotes.length
    ? quotes.map(t => quoteCard(t, perms)).join("")
    : emptyMessage("No hay cotizaciones pendientes. Crea una con el botón + Cotización.");
}

function quoteCard(ticket, perms) {
  perms = perms || currentPerms();
  const repair = Number(ticket.repairAmount || 0);
  const items  = ticket.quoteItems || [];

  const itemsHtml = items.length
    ? `<div style="margin:8px 0 4px">
        ${items.map(i => `
          <div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0;color:rgba(255,255,255,.72)">
            <span>${escapeHtml(i.type)} — ${escapeHtml(i.description||"")}</span>
            <span style="white-space:nowrap;margin-left:8px">${i.qty>1?i.qty+"× ":""}${money.format(i.qty*i.unitPrice)}</span>
          </div>`).join("")}
        <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-top:6px;padding-top:5px;border-top:1px solid rgba(255,255,255,.1)">
          <span>Total estimado</span><span style="color:var(--fz-secondary,#2678E8)">${money.format(repair)}</span>
        </div>
      </div>`
    : (repair > 0 ? `<div class="ticket-detail-grid"><span>Costo estimado</span><strong>${money.format(repair)}</strong></div>` : "");

  return `<article class="ticket-card">
    <div class="ticket-topline"><span class="tracking-code">${escapeHtml(ticket.tracking)}</span><span class="branch-pill">${escapeHtml(ticket.branch)}</span></div>
    <div class="ticket-topline"><strong>${escapeHtml(ticket.client)}</strong><span class="muted">${escapeHtml(ticket.createdAt)}</span></div>
    <span class="muted">${escapeHtml(ticket.productName)}</span>
    ${ticket.issue ? `<p style="margin:4px 0">${escapeHtml(ticket.issue)}</p>` : ""}
    ${itemsHtml}
    <div class="ticket-actions">
      <button class="mini-button" data-print-cotizacion="${ticket.id}">🖨 Imprimir</button>
      <button class="mini-button" style="background:rgba(37,211,102,0.15);border-color:rgba(37,211,102,0.4);color:#25d366" data-wa-quote="${ticket.id}">💬 WhatsApp</button>
      <button class="primary-action" style="font-size:12px;padding:5px 12px;min-height:0" data-approve-quote="${ticket.id}">✓ Aprobar</button>
      <button class="mini-button" data-edit-ticket="${ticket.id}">Editar</button>
      ${perms.canDeleteTickets?`<button class="mini-button danger-btn" data-delete-ticket="${ticket.id}">Eliminar</button>`:""}
    </div>
  </article>`;
}

function approveQuoteToTicket(ticketId) {
  showConfirmModal("¿Convertir esta cotización a ticket activo (Recibido)?", {
    label: "Aprobar",
    onConfirm: async () => {
      const ticket = state.tickets.find(t => t.id === ticketId);
      if (!ticket) return;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketId);
      const idx = state.tickets.findIndex(t => t.id === ticketId);
      if (idx !== -1) state.tickets[idx] = { ...ticket, status: "Recibido" };
      if (dataMode === "remote" && isUUID) {
        try {
          await updateRemoteTicket(ticketId, { ...ticket, status: "Recibido" });
          try { await reloadState(); } catch(e) { console.warn(e); }
        } catch(err) {
          if (idx !== -1) state.tickets[idx] = { ...ticket, status: "Cotizacion" };
          showErrorToast(`Error: ${err.message}`); return;
        }
      }
      render();
      showToast("✓ Cotización aprobada — ticket movido a Recibido");
    }
  });
}

function ticketCard(ticket, perms) {
  perms = perms || currentPerms();
  const paid   = ticket.paymentStatus==="Pagado";
  const repair = Number(ticket.repairAmount??ticket.total??0);
  const paidAmt= Number(ticket.paidAmount??(paid?repair:0));
  return `<article class="ticket-card" draggable="true"
    ondragstart="event.dataTransfer.setData('ticketId','${ticket.id}');this.style.opacity='.5'"
    ondragend="this.style.opacity=''">
    <div class="ticket-topline"><span class="tracking-code">${escapeHtml(ticket.tracking)}</span><span class="branch-pill">${escapeHtml(ticket.branch)}</span></div>
    <div class="ticket-topline"><strong>${escapeHtml(ticket.client)}</strong><span class="status ${ticket.priority==="Urgente"||ticket.priority==="Alta"?"urgent":""}">${ticket.priority}</span></div>
    <span class="muted">${escapeHtml(ticket.productName||ticket.device)}</span>
    <p>${escapeHtml(ticket.issue)}</p>
    <div class="ticket-detail-grid">
      <span>Reparacion</span><strong>${money.format(repair)}</strong>
      ${ticket.discountAmount>0?`<span style="color:#ff9f43">Descuento${ticket.discountCode?" ("+escapeHtml(ticket.discountCode)+")":""}</span><strong style="color:#ff9f43">-${money.format(ticket.discountAmount)}</strong>`:""}
      <span>Total</span><strong>${money.format(Math.max(0,repair-(ticket.discountAmount||0)))}</strong>
      <span>Pago</span><strong class="${paid?"paid-amount":""}">${paid?money.format(paidAmt):escapeHtml(ticket.paymentStatus)}</strong>
    </div>
    <div class="ticket-topline">
      <span class="status ${ticket.status==="Listo"||ticket.status==="Entregado"?"ready":ticket.status==="Cotizacion"?"waiting":ticket.status==="Garantia"?"warranty":""}">${ticket.status}</span>
      <small class="muted">${escapeHtml(ticket.assignedTo)}</small>
    </div>
    <div class="ticket-actions">
      <div style="position:relative;display:inline-block">
        <button class="mini-button" data-print-ticket="${ticket.id}" title="Imprimir ticket">🖨 Imprimir ▾</button>
        <div class="print-menu" style="display:none;position:absolute;bottom:110%;left:0;background:var(--fz-surface,#1e1e2e);border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:4px;min-width:190px;z-index:50;box-shadow:0 8px 24px rgba(0,0,0,.4)">
          <button class="ghost-button" style="width:100%;text-align:left;padding:6px 10px;font-size:12px;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:2px" data-print-auto="${ticket.id}">⚡ Auto (según estado)</button>
          <button class="ghost-button" style="width:100%;text-align:left;padding:6px 10px;font-size:12px" data-print-recepcion="${ticket.id}">📋 Recibo de recepción</button>
          <button class="ghost-button" style="width:100%;text-align:left;padding:6px 10px;font-size:12px" data-print-pago="${ticket.id}">💳 Comprobante de pago</button>
          <button class="ghost-button" style="width:100%;text-align:left;padding:6px 10px;font-size:12px" data-print-garantia="${ticket.id}">🛡 Certificado de garantía</button>
        </div>
      </div>
      ${ticket.paymentStatus!=="Pagado"&&repair>0?`<button class="mini-button" data-abono-ticket="${ticket.id}">Abonar</button>`:""}
      <button class="mini-button" data-edit-ticket="${ticket.id}">Editar</button>
      ${perms.canDeleteTickets?`<button class="mini-button danger-btn" data-delete-ticket="${ticket.id}">Eliminar</button>`:""}
    </div>
  </article>`;
}

function renderSupplies() {
  document.querySelector("#supplies-table").innerHTML = bySearch(branchSupplies()).map(i=>`
    <tr>
      <td>${i.date}</td><td>${escapeHtml(i.supplier)}</td><td>${escapeHtml(i.item)}</td>
      <td>${i.quantity}</td><td><strong>${money.format(i.total)}</strong></td>
      <td>${i.receipt_url ? `<a href="${escapeHtml(i.receipt_url)}" target="_blank" class="mini-button">📄 Ver</a>` : ''}</td>
      <td><button class="mini-button" data-edit-supply="${i.id}">Editar</button></td>
    </tr>
  `).join("")||tableEmpty(7);
}

// ──────────────────────────────────────────────────────────────────────────────
// TABLA DE PRECIOS
// ──────────────────────────────────────────────────────────────────────────────
function branchServicePrices() {
  const bid = (state.branches||[]).find(b=>b.name===activeBranchId)?.id || activeBranchId;
  return (state.servicePrices||[]).filter(p => !p.branchId || p.branchId === bid);
}

function renderPrecios() {
  const stEl = document.querySelector("#precios-service-types");
  const mxEl = document.querySelector("#precios-matrix");
  if (!stEl || !mxEl) return;

  const types   = state.serviceTypes || [];
  const prices  = branchServicePrices();
  const branchId = (state.branches||[]).find(b=>b.name===activeBranchId)?.id || null;

  // ── Service types manager ────────────────────────────────────────────────
  stEl.innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <h3 style="margin:0;font-size:14px">Servicios disponibles</h3>
        <button class="mini-button" id="precio-add-type-btn">+ Agregar servicio</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px" id="precio-types-list">
        ${types.map(t=>`
          <div style="display:flex;align-items:center;gap:4px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:4px 10px;font-size:12px">
            <span>${escapeHtml(t.name)}</span>
            ${supabaseClient?`<button class="danger-btn" data-del-stype="${t.id}" style="background:none;border:none;color:#ff6b6b;cursor:pointer;padding:0 2px;font-size:11px">✕</button>`:""}
          </div>`).join("")}
      </div>
      <div id="precio-add-type-form" style="display:none;margin-top:12px;display:none">
        <div style="display:flex;gap:8px;align-items:center">
          <input id="precio-new-type-input" type="text" placeholder="Nombre del servicio" style="flex:1;padding:7px 10px;font-size:13px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit"/>
          <button class="primary-action" id="precio-save-type-btn" style="font-size:12px">Guardar</button>
          <button class="ghost-button"   id="precio-cancel-type-btn" style="font-size:12px">Cancelar</button>
        </div>
      </div>
    </div>`;

  stEl.querySelector("#precio-add-type-btn")?.addEventListener("click", () => {
    stEl.querySelector("#precio-add-type-form").style.display = "flex";
    stEl.querySelector("#precio-new-type-input")?.focus();
  });
  stEl.querySelector("#precio-cancel-type-btn")?.addEventListener("click", () => {
    stEl.querySelector("#precio-add-type-form").style.display = "none";
  });
  stEl.querySelector("#precio-save-type-btn")?.addEventListener("click", async () => {
    const name = stEl.querySelector("#precio-new-type-input")?.value.trim();
    if (!name || !supabaseClient) return;
    const maxOrder = types.reduce((m,t)=>Math.max(m,t.sortOrder),0);
    const { data, error } = await supabaseClient.from("service_types").insert({ name, sort_order: maxOrder+1 }).select().single();
    if (error) { showErrorToast("Error al guardar servicio"); return; }
    state.serviceTypes.push({ id:data.id, name:data.name, sortOrder:Number(data.sort_order||0) });
    renderPrecios();
    showToast(`✓ Servicio "${name}" agregado`);
  });
  stEl.querySelectorAll("[data-del-stype]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.delStype;
      if (!await confirmModal(`¿Eliminar servicio? Se borrarán todos sus precios.`)) return;
      await supabaseClient.from("service_types").delete().eq("id", id);
      state.serviceTypes = state.serviceTypes.filter(t=>t.id!==id);
      state.servicePrices = state.servicePrices.filter(p=>p.serviceTypeId!==id);
      renderPrecios();
    });
  });

  // ── Price matrix ────────────────────────────────────────────────────────
  if (!types.length) { mxEl.innerHTML = `<p class="muted" style="margin-top:8px">Agrega al menos un servicio para construir la tabla.</p>`; return; }

  const deviceModels = [...new Set(prices.map(p=>p.deviceModel))].sort((a,b)=>a.localeCompare(b,"es"));

  // Group by cell: "dev|stypeId" → array of variants
  const pricesByCell = new Map();
  prices.forEach(p => {
    const k = `${p.deviceModel}|${p.serviceTypeId}`;
    if (!pricesByCell.has(k)) pricesByCell.set(k, []);
    pricesByCell.get(k).push(p);
  });

  const inpS = "width:76px;padding:5px 7px;font-size:12px;text-align:right;border-radius:5px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:inherit;appearance:textfield;-moz-appearance:textfield";

  const pvSummaryText = vs => {
    const nz = vs.filter(v=>v.price>0);
    if (!nz.length) return "—";
    if (nz.length===1) return `$${Number(nz[0].price).toLocaleString("es-MX")}${nz[0].variant?` <small style="opacity:.55;font-size:9px">${escapeHtml(nz[0].variant)}</small>`:""}`;
    return `${nz.length}&nbsp;precios ▾`;
  };

  const rows = deviceModels.map((dev, rowIdx) => {
    const cells = types.map((t, colIdx) => {
      const vs = pricesByCell.get(`${dev}|${t.id}`) || [];
      const hasVariants = vs.length>1 || (vs.length===1 && vs[0].variant!=="");
      const single = vs[0] || { id:"", variant:"", price:0 };
      const cell = hasVariants
        ? `<button class="pv-open" data-device="${escapeHtml(dev)}" data-stype="${t.id}"
            data-row-idx="${rowIdx}" data-col-idx="${colIdx}"
            style="padding:4px 8px;border-radius:5px;border:1px solid rgba(255,255,255,.14);
            background:rgba(255,255,255,.05);color:inherit;cursor:pointer;font-size:12px;
            white-space:nowrap;max-width:130px">${pvSummaryText(vs)}</button>`
        : `<div style="display:inline-flex;align-items:center;gap:2px">
            <input class="pv-price" type="number" min="0" step="1" value="${single.price||0}"
              data-device="${escapeHtml(dev)}" data-stype="${t.id}"
              data-pid="${single.id||""}" data-variant=""
              data-row-idx="${rowIdx}" data-col-idx="${colIdx}" style="${inpS}"/>
            <button class="pv-open" data-device="${escapeHtml(dev)}" data-stype="${t.id}"
              data-row-idx="${rowIdx}" data-col-idx="${colIdx}"
              title="Agregar niveles de precio"
              style="background:none;border:none;color:rgba(255,255,255,.2);cursor:pointer;font-size:11px;padding:0 2px;line-height:1;flex-shrink:0">▾</button>
           </div>`;
      return `<td data-col-idx="${colIdx}" style="padding:3px 6px;text-align:right;white-space:nowrap">${cell}</td>`;
    }).join("");
    return `<tr data-row-idx="${rowIdx}" data-device-name="${escapeHtml(dev.toLowerCase())}"
      style="border-bottom:1px solid rgba(255,255,255,.05)">
      <td style="padding:6px 10px;font-size:12px;white-space:nowrap;font-weight:500;
        position:sticky;left:0;background:#0f0f1a">${escapeHtml(dev)}</td>
      ${cells}
      <td style="padding:3px 6px"><button class="mini-button danger-btn" data-del-device="${escapeHtml(dev)}"
        style="font-size:10px;padding:2px 7px">✕</button></td>
    </tr>`;
  }).join("");

  mxEl.innerHTML = `
    <div class="card" style="overflow-x:auto">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <div>
          <h3 style="margin:0 0 2px;font-size:14px">Matriz de precios — ${escapeHtml(activeBranchId)}</h3>
          <small class="muted">Los precios se guardan automáticamente</small>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <span id="pv-save-status" style="font-size:11px"></span>
          <button class="ghost-button" id="precio-add-device-btn" style="font-size:12px">+ Agregar equipo</button>
        </div>
      </div>
      <div id="precio-add-device-form" style="display:none;margin-bottom:12px">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <div class="device-ac-wrapper" style="flex:1;min-width:180px">
            <input id="precio-new-device-input" type="text" data-device-ac placeholder="Modelo del equipo"
              style="width:100%;padding:7px 10px;font-size:13px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit"/>
          </div>
          <button class="primary-action" id="precio-save-device-btn" style="font-size:12px">Agregar</button>
          <button class="ghost-button" id="precio-cancel-device-btn" style="font-size:12px">Cancelar</button>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
        <input id="precio-filter-device" type="text" placeholder="🔍 Filtrar por equipo…"
          style="flex:1;min-width:160px;padding:6px 10px;font-size:12px;border-radius:6px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:inherit"/>
        <input id="precio-filter-service" type="text" placeholder="🔍 Filtrar por servicio…"
          style="flex:1;min-width:160px;padding:6px 10px;font-size:12px;border-radius:6px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:inherit"/>
      </div>
      <div style="overflow-x:auto">
        <table id="precio-matrix-table" style="width:100%;border-collapse:collapse;font-size:12px;min-width:600px">
          <thead><tr style="border-bottom:2px solid rgba(255,255,255,.15);background:rgba(255,255,255,.04)">
            <th style="text-align:left;padding:8px 12px;font-size:11px;white-space:nowrap;
              position:sticky;left:0;background:#0f0f1a;z-index:2;min-width:160px">Equipo / Servicio</th>
            ${types.map((t,i)=>`<th data-col-idx="${i}" data-svc-name="${escapeHtml(t.name.toLowerCase())}"
              style="text-align:right;padding:8px 8px;font-size:10px;white-space:nowrap;
              color:rgba(255,255,255,.6);font-weight:600">${escapeHtml(t.name)}</th>`).join("")}
            <th style="width:32px"></th>
          </tr></thead>
          <tbody>
            ${rows || `<tr><td colspan="${types.length+2}"
              style="padding:20px 12px;color:rgba(255,255,255,.35);font-size:12px;font-style:italic">
              Usa "+ Agregar equipo" para añadir la primera fila</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
    <!-- Singleton variant popover (fixed, not clipped by overflow) -->
    <div id="pv-global-pop" style="display:none;position:fixed;z-index:9100;
      background:#13131f;border:1px solid rgba(255,255,255,.18);border-radius:10px;
      padding:14px 16px;min-width:255px;box-shadow:0 10px 34px rgba(0,0,0,.75)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <span id="pv-pop-title" style="font-size:12px;font-weight:600;opacity:.7;max-width:190px;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>
        <button id="pv-pop-close" style="background:none;border:none;color:rgba(255,255,255,.45);
          cursor:pointer;font-size:15px;padding:0 2px;line-height:1;flex-shrink:0">✕</button>
      </div>
      <div id="pv-pop-rows"></div>
      <button id="pv-pop-add" style="width:100%;font-size:11px;padding:5px;margin-top:4px;
        background:rgba(255,255,255,.05);border:1px dashed rgba(255,255,255,.2);
        border-radius:5px;color:rgba(255,255,255,.65);cursor:pointer">+ Agregar nivel</button>
    </div>`;

  const matrixTable = mxEl.querySelector("#precio-matrix-table");
  const pvStatusEl  = mxEl.querySelector("#pv-save-status");
  const pvPop       = mxEl.querySelector("#pv-global-pop");
  const pvPopRows   = mxEl.querySelector("#pv-pop-rows");
  const pvPopTitle  = mxEl.querySelector("#pv-pop-title");
  let pvCurDev="", pvCurStype="", pvCurRIdx="", pvCurCIdx="";

  // ── Auto-save ──────────────────────────────────────────────────────────
  let pvTimer = null;
  const pvStatus = s => {
    if (!pvStatusEl) return;
    if (s==="saving") { pvStatusEl.textContent="Guardando…"; pvStatusEl.style.color="rgba(255,255,255,.45)"; }
    else if (s==="saved") { pvStatusEl.textContent="✓ Guardado"; pvStatusEl.style.color="rgba(100,220,130,.9)";
      setTimeout(()=>{ if(pvStatusEl) pvStatusEl.textContent=""; },3000); }
    else if (s==="error") { pvStatusEl.textContent="Error al guardar"; pvStatusEl.style.color="#ff6b6b"; }
  };

  const pvDoSave = async () => {
    if (!supabaseClient) return;
    const upserts = [];
    // Simple cells (price inputs in the table)
    matrixTable?.querySelectorAll(".pv-price").forEach(inp => {
      const price = Number(inp.value)||0, pid = inp.dataset.pid||"";
      if (!price && !pid) return;
      upserts.push({ id:pid||crypto.randomUUID(), device_model:inp.dataset.device,
        service_type_id:inp.dataset.stype, price, branch_id:branchId, variant:"" });
    });
    // Popover rows (variant cell currently open)
    if (pvPop?.style.display!=="none" && pvCurDev) {
      pvPopRows?.querySelectorAll(".pv-row").forEach(row => {
        const pi = row.querySelector(".pv-price");
        const price = Number(pi?.value)||0, pid = pi?.dataset.pid||"";
        if (!price && !pid) return;
        upserts.push({ id:pid||crypto.randomUUID(), device_model:pvCurDev,
          service_type_id:pvCurStype, price, branch_id:branchId,
          variant:row.querySelector(".pv-label")?.value.trim()||"" });
      });
    }
    if (!upserts.length) { pvStatus("saved"); return; }
    const { data, error } = await supabaseClient.from("service_prices")
      .upsert(upserts, { onConflict:"device_model,service_type_id,branch_id,variant" }).select();
    if (error) { console.error("precio save:", error); pvStatus("error"); return; }
    (data||[]).forEach(r => {
      const upd = { id:r.id, deviceModel:r.device_model, serviceTypeId:r.service_type_id,
        price:Number(r.price||0), branchId:r.branch_id, variant:r.variant||"" };
      const idx = state.servicePrices.findIndex(p=>p.id===r.id);
      if (idx>=0) state.servicePrices[idx]=upd; else state.servicePrices.push(upd);
      // Patch data-pid for new rows
      if (r.variant==="") {
        const inp = matrixTable?.querySelector(`.pv-price[data-device="${CSS.escape(r.device_model)}"][data-stype="${r.service_type_id}"]`);
        if (inp && !inp.dataset.pid) inp.dataset.pid = r.id;
      } else {
        pvPopRows?.querySelectorAll(".pv-price").forEach(inp => {
          if (!inp.dataset.pid) {
            const lbl = inp.closest(".pv-row")?.querySelector(".pv-label")?.value.trim()||"";
            if (lbl===r.variant) inp.dataset.pid = r.id;
          }
        });
      }
    });
    pvStatus("saved");
  };

  const pvTrigger = () => { clearTimeout(pvTimer); pvStatus("saving"); pvTimer=setTimeout(pvDoSave,1200); };

  matrixTable?.addEventListener("input", e => { if (e.target.closest(".pv-price")) pvTrigger(); });

  // ── Focus highlight ────────────────────────────────────────────────────
  const pvClearHL = () => {
    matrixTable?.querySelectorAll(".pv-hl").forEach(el => { el.classList.remove("pv-hl"); el.style.background=""; });
  };
  matrixTable?.addEventListener("focusin", e => {
    const inp = e.target.closest(".pv-price");
    if (!inp) return;
    if (inp.value==="0") inp.select();
    pvClearHL();
    const rIdx=inp.dataset.rowIdx, cIdx=inp.dataset.colIdx;
    // Only tint the active row cells (not all rows)
    matrixTable.querySelectorAll(`tr[data-row-idx="${rIdx}"] td, tr[data-row-idx="${rIdx}"] th`).forEach(el => {
      el.classList.add("pv-hl"); el.style.background="rgba(var(--fz-primary-rgb),.05)";
    });
    // Only tint the active column cells
    matrixTable.querySelectorAll(`[data-col-idx="${cIdx}"]`).forEach(el => {
      el.classList.add("pv-hl"); el.style.background="rgba(var(--fz-primary-rgb),.05)";
    });
    inp.style.outline="2px solid var(--fz-primary)";
    inp.style.background="rgba(var(--fz-primary-rgb),.18)";
  });
  matrixTable?.addEventListener("focusout", e => {
    if (!e.target.closest(".pv-price")) return;
    pvClearHL();
    e.target.style.outline=""; e.target.style.background="rgba(255,255,255,.05)";
  });

  // ── Variant popover ────────────────────────────────────────────────────
  const pvLblS = "width:84px;padding:4px 7px;font-size:11px;border-radius:4px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:inherit";
  const pvInpS = "width:76px;padding:4px 7px;font-size:12px;text-align:right;border-radius:4px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:inherit;appearance:textfield;-moz-appearance:textfield";
  const pvDelS = "background:none;border:none;color:rgba(255,100,100,.6);cursor:pointer;font-size:15px;padding:0 3px;line-height:1;flex-shrink:0";

  const pvMakeRow = (v, dev, stype, rIdx, cIdx) => {
    const d=document.createElement("div"); d.className="pv-row";
    d.style.cssText="display:flex;align-items:center;gap:5px;margin-bottom:7px";
    d.innerHTML=`<input class="pv-label" value="${escapeHtml(v.variant||"")}" placeholder="Ej: Original" style="${pvLblS}" title="Nombre del nivel de calidad"/>
      <input class="pv-price" type="number" min="0" step="1" value="${v.price||0}"
        data-device="${escapeHtml(dev)}" data-stype="${stype}" data-pid="${v.id||""}"
        data-variant="${escapeHtml(v.variant||"")}" data-row-idx="${rIdx}" data-col-idx="${cIdx}"
        style="${pvInpS}"/>
      <button class="pv-del" title="Quitar nivel" style="${pvDelS}">−</button>`;
    return d;
  };

  const pvOpen = (dev, stype, rIdx, cIdx, anchor) => {
    pvClearHL();
    pvCurDev=dev; pvCurStype=stype; pvCurRIdx=rIdx; pvCurCIdx=cIdx;
    pvPopRows.innerHTML="";
    const bid2=(state.branches||[]).find(b=>b.name===activeBranchId)?.id||null;
    let vs=state.servicePrices.filter(p=>p.deviceModel===dev&&p.serviceTypeId===stype&&(!p.branchId||p.branchId===bid2));
    if (!vs.length) vs=[{id:"",variant:"",price:0}];
    vs.forEach(v=>pvPopRows.appendChild(pvMakeRow(v,dev,stype,rIdx,cIdx)));
    const svcName=types.find(t=>t.id===stype)?.name||"";
    pvPopTitle.textContent=`${dev} — ${svcName}`;
    pvPop.style.display="block";
    const r=anchor.getBoundingClientRect(), pw=260, ww=window.innerWidth;
    let l=r.left; if(l+pw>ww-8) l=ww-pw-8;
    pvPop.style.left=`${Math.max(8,l)}px`; pvPop.style.top=`${r.bottom+6}px`;
    pvPopRows.querySelector(".pv-price")?.focus();
  };

  const pvClose = () => {
    if (pvPop?.style.display==="none") return;
    pvPop.style.display="none"; pvTrigger();
    // Refresh variant summary buttons
    setTimeout(()=>renderPrecios(), 1500);
  };

  // Open on ▾ / summary button click
  mxEl.addEventListener("click", e => {
    const ob=e.target.closest(".pv-open");
    if (ob) { e.stopPropagation(); pvOpen(ob.dataset.device,ob.dataset.stype,ob.dataset.rowIdx||"",ob.dataset.colIdx||"",ob); return; }
  });

  // Close on outside click (cleanup old listener first)
  if (mxEl._pvClose) document.removeEventListener("click", mxEl._pvClose);
  if (mxEl._pvKey)   document.removeEventListener("keydown", mxEl._pvKey);
  mxEl._pvClose = e => { if (!pvPop?.contains(e.target) && !e.target.closest(".pv-open")) pvClose(); };
  mxEl._pvKey   = e => { if (e.key==="Escape") pvClose(); };
  document.addEventListener("click", mxEl._pvClose);
  document.addEventListener("keydown", mxEl._pvKey);

  mxEl.querySelector("#pv-pop-close")?.addEventListener("click", pvClose);

  // Add row in popover
  mxEl.querySelector("#pv-pop-add")?.addEventListener("click", () => {
    pvPopRows.appendChild(pvMakeRow({id:"",variant:"",price:0},pvCurDev,pvCurStype,pvCurRIdx,pvCurCIdx));
    pvPopRows.lastElementChild?.querySelector(".pv-label")?.focus();
  });

  // Delete row in popover
  pvPopRows?.addEventListener("click", async e => {
    const db=e.target.closest(".pv-del"); if (!db) return;
    const row=db.closest(".pv-row"), pi=row?.querySelector(".pv-price"), pid=pi?.dataset.pid||"";
    if (pvPopRows.querySelectorAll(".pv-row").length<=1) {
      if (pi) pi.value="0"; row?.querySelector(".pv-label") && (row.querySelector(".pv-label").value="");
      pvTrigger(); return;
    }
    if (pid && !confirm("¿Eliminar este nivel de precio?")) return;
    if (pid) {
      supabaseClient?.from("service_prices").delete().eq("id",pid).then(({error})=>{
        if (!error) state.servicePrices=state.servicePrices.filter(p=>p.id!==pid);
      });
    }
    row.remove(); pvTrigger();
  });

  // Popover input → auto-save
  pvPopRows?.addEventListener("input", pvTrigger);

  // ── Filters ────────────────────────────────────────────────────────────
  const applyPrecioFilters = () => {
    const dq=(mxEl.querySelector("#precio-filter-device")?.value||"").toLowerCase().trim();
    const sq=(mxEl.querySelector("#precio-filter-service")?.value||"").toLowerCase().trim();
    matrixTable?.querySelectorAll("tbody tr[data-row-idx]").forEach(tr=>
      tr.style.display=(!dq||tr.dataset.deviceName?.includes(dq))?"":"none");
    matrixTable?.querySelectorAll("[data-col-idx]").forEach(el=>{
      if (!sq){el.style.display="";return;}
      const th=matrixTable.querySelector(`thead [data-col-idx="${el.dataset.colIdx}"]`);
      el.style.display=th?.dataset.svcName?.includes(sq)?"":"none";
    });
  };
  mxEl.querySelector("#precio-filter-device")?.addEventListener("input",applyPrecioFilters);
  mxEl.querySelector("#precio-filter-service")?.addEventListener("input",applyPrecioFilters);

  // ── Add / delete device ────────────────────────────────────────────────
  mxEl.querySelector("#precio-add-device-btn")?.addEventListener("click",()=>{
    mxEl.querySelector("#precio-add-device-form").style.display="flex";
    initDeviceAutocomplete(mxEl); mxEl.querySelector("#precio-new-device-input")?.focus();
  });
  mxEl.querySelector("#precio-cancel-device-btn")?.addEventListener("click",()=>{
    mxEl.querySelector("#precio-add-device-form").style.display="none";
  });
  mxEl.querySelector("#precio-save-device-btn")?.addEventListener("click",async()=>{
    const dev=mxEl.querySelector("#precio-new-device-input")?.value.trim();
    if (!dev||!supabaseClient) return;
    if (deviceModels.includes(dev)){showErrorToast("Ese equipo ya está en la tabla");return;}
    const ins=types.map(t=>({id:crypto.randomUUID(),device_model:dev,service_type_id:t.id,price:0,branch_id:branchId,variant:""}));
    const {data,error}=await supabaseClient.from("service_prices").upsert(ins,{onConflict:"device_model,service_type_id,branch_id,variant"}).select();
    if (error){showErrorToast("Error al agregar equipo");return;}
    (data||[]).forEach(r=>state.servicePrices.push({id:r.id,deviceModel:r.device_model,serviceTypeId:r.service_type_id,price:0,branchId:r.branch_id,variant:""}));
    renderPrecios(); showToast(`✓ ${dev} agregado a la tabla`);
  });
  mxEl.querySelectorAll("[data-del-device]").forEach(btn=>{
    btn.addEventListener("click",async()=>{
      const dev=btn.dataset.delDevice;
      if (!await confirmModal(`¿Eliminar todos los precios de "${dev}"?`)) return;
      await supabaseClient.from("service_prices").delete().eq("device_model",dev).eq("branch_id",branchId);
      state.servicePrices=state.servicePrices.filter(p=>p.deviceModel!==dev||p.branchId!==branchId);
      renderPrecios();
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// PUNTO DE VENTA (POS)
// ──────────────────────────────────────────────────────────────────────────────
function renderPos() {
  const catalogPanel = document.querySelector("#pos-catalog-panel");
  const cartPanel    = document.querySelector("#pos-cart-panel");
  if (!catalogPanel || !cartPanel) return;

  const allBranchProducts = branchProducts()
    .filter(p => p.productType !== "insumo" && Number(p.price) > 0);
  const catalogItems = allBranchProducts
    .filter(p => posCatalogFilter === "all" || p.productType === posCatalogFilter)
    .filter(p => !posCatalogSearch || p.name.toLowerCase().includes(posCatalogSearch) || (p.sku||"").toLowerCase().includes(posCatalogSearch));

  catalogPanel.innerHTML = `
    <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;align-items:center">
      <button class="mini-button pos-filter${posCatalogFilter==="all"?" is-active":""}" data-pos-filter="all">Todos</button>
      <button class="mini-button pos-filter${posCatalogFilter==="producto"?" is-active":""}" data-pos-filter="producto">Vendibles</button>
      <button class="mini-button pos-filter${posCatalogFilter==="refaccion"?" is-active":""}" data-pos-filter="refaccion">Refacciones</button>
      <input id="pos-search" type="text" placeholder="Buscar producto o SKU…" value="${escapeHtml(posCatalogSearch)}"
        style="flex:1;min-width:160px;padding:5px 10px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:6px;color:inherit;font-size:13px" />
    </div>
    <div class="pos-catalog-list">
      ${catalogItems.map(p => {
        const stock = Number(p.stock);
        const outOfStock = stock <= 0;
        const lowStock = !outOfStock && p.minStock > 0 && stock <= Number(p.minStock);
        return `<div class="pos-list-row${outOfStock?" out-of-stock":""}" data-pos-add="${p.id}"
          title="${outOfStock?"Sin stock":"Agregar al carrito"}">
          <div class="pos-list-info">
            <span class="pos-list-name">${escapeHtml(p.name)}</span>
            <span class="pos-list-cat muted">${escapeHtml(p.category)}${p.sku?` · ${escapeHtml(p.sku)}`:""}</span>
          </div>
          <span class="${outOfStock?"status urgent":lowStock?"low-stock":"muted"}" style="font-size:11px;white-space:nowrap">
            ${outOfStock?"Agotado":stock+" pzs"}
          </span>
          <strong style="color:var(--fz-primary);white-space:nowrap">${money.format(p.price)}</strong>
          <button class="pos-add-btn" data-pos-add="${p.id}" ${outOfStock?"disabled":""}>+</button>
        </div>`;
      }).join("") || `<p class="muted" style="padding:18px 0;text-align:center;font-size:13px">Sin resultados.</p>`}
    </div>`;

  const subtotal = posCart.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const total    = Math.max(0, subtotal - posDiscount);

  cartPanel.innerHTML = `
    <div style="font-size:14px;font-weight:600">Carrito</div>
    <div class="pos-cart-items">
      ${posCart.length === 0
        ? lastPosSale
          ? `<div style="text-align:center;padding:16px 0">
              <div style="color:var(--fz-primary);font-weight:600;font-size:14px;margin-bottom:4px">✓ Venta registrada</div>
              <div class="muted" style="font-size:12px;margin-bottom:12px">${money.format(lastPosSale.total)} · ${escapeHtml(lastPosSale.method)}</div>
              <button class="ghost-button" onclick="printPosRecibo()" style="width:100%;margin-bottom:6px">Imprimir recibo</button>
              <button class="mini-button" onclick="lastPosSale=null;renderPos()" style="width:100%;font-size:11px;padding:5px">Nueva venta</button>
            </div>`
          : '<p class="muted" style="font-size:12px;text-align:center;padding:18px 0">Toca un producto para agregarlo</p>'
        : posCart.map((item, idx) => `
          <div class="pos-cart-item">
            <div>
              <div style="font-size:12px;font-weight:500">${escapeHtml(item.name)}</div>
              <div class="muted" style="font-size:11px">${money.format(item.unitPrice)} c/u</div>
            </div>
            <div style="display:flex;align-items:center;gap:4px">
              <button class="mini-button" data-pos-qty-dec="${idx}" style="padding:2px 7px">−</button>
              <span style="font-size:13px;min-width:22px;text-align:center">${item.qty}</span>
              <button class="mini-button" data-pos-qty-inc="${idx}" style="padding:2px 7px">+</button>
            </div>
            <div style="text-align:right">
              <div style="font-size:13px;font-weight:600">${money.format(item.qty * item.unitPrice)}</div>
              <button class="mini-button danger-btn" data-pos-remove="${idx}" style="font-size:10px;padding:2px 5px;margin-top:2px">✕</button>
            </div>
          </div>`).join("")}
    </div>
    <div class="pos-cart-totals">
      <div class="pos-total-row"><span class="muted">Subtotal</span><span>${money.format(subtotal)}</span></div>
      <div class="pos-total-row" style="flex-wrap:wrap;gap:4px">
        <span class="muted" style="white-space:nowrap">Código descuento</span>
        <div style="display:flex;gap:4px;margin-left:auto">
          <input id="pos-code-input" type="text" value="${escapeHtml(posDiscountCode)}" placeholder="PROMO10"
            style="width:90px;text-align:center;font-size:11px;font-family:monospace;text-transform:uppercase;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:4px;padding:3px 6px;color:inherit"
            oninput="posDiscountCode=this.value.toUpperCase()">
          <button type="button" class="mini-button" id="pos-apply-code" style="font-size:11px;padding:3px 8px">Aplicar</button>
        </div>
      </div>
      <div class="pos-total-row">
        <span class="muted">Descuento${posDiscountCode?" ("+escapeHtml(posDiscountCode)+")":""}</span>
        <input type="number" id="pos-discount-input" value="${posDiscount}" min="0" step="0.01"
          oninput="posDiscount=Math.max(0,Number(this.value)||0);posDiscountCode='';document.querySelector('#pos-code-input')&&(document.querySelector('#pos-code-input').value='');renderPos()"
          style="width:70px;text-align:right;font-size:12px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:4px;padding:3px 6px;color:inherit">
      </div>
      <div class="pos-total-row grand"><span>Total</span><span>${money.format(total)}</span></div>
    </div>
    <select id="pos-payment-method" onchange="posPaymentMethod=this.value"
      style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:6px;padding:6px 10px;color:inherit;font-size:13px">
      ${POS_PAYMENT_METHODS.map(m => `<option value="${m}"${m===posPaymentMethod?" selected":""}>${m}</option>`).join("")}
    </select>
    <select id="pos-client-select" onchange="posCustomerId=this.value||null"
      style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:6px;padding:6px 10px;color:inherit;font-size:13px">
      <option value="">— Cliente (opcional) —</option>
      ${branchClients().sort((a,b)=>a.name.localeCompare(b.name)).map(c =>
        `<option value="${c.id}"${c.id===posCustomerId?" selected":""}>${escapeHtml(c.name)}${c.phone?" · "+escapeHtml(c.phone):""}</option>`
      ).join("")}
    </select>
    <button class="primary-action" id="pos-checkout-btn" style="width:100%${posCart.length===0?";opacity:0.4;pointer-events:none":""}">
      Cobrar ${money.format(total)}
    </button>
    ${posCart.length > 0 ? '<button class="ghost-button" id="pos-clear-cart" style="width:100%;font-size:12px;margin-top:-4px">Vaciar carrito</button>' : ""}
  `;

  renderPosHistory();
}

function renderPosHistory() {
  const container = document.querySelector("#pos-history");
  if (!container) return;
  const sales = (state.posSales || []).filter(s => !s.branch || s.branch === activeBranchId).slice(0, 15);
  if (!sales.length) { container.innerHTML = ""; return; }
  container.innerHTML = `
    <div class="section-heading" style="margin-bottom:10px"><h2>Ventas recientes</h2></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Fecha</th><th>Método</th><th style="text-align:right">Total</th></tr></thead>
        <tbody>
          ${sales.map(s => `<tr>
            <td>${s.createdAt}</td>
            <td>${escapeHtml(s.paymentMethod)}</td>
            <td style="text-align:right"><strong>${money.format(s.total)}</strong></td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
}

function checkoutPos() {
  if (!posCart.length) return;
  if (dataMode !== "remote") { showErrorToast("Conecta a Supabase para registrar ventas."); return; }

  const subtotal = posCart.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const total    = Math.max(0, subtotal - posDiscount);
  const method   = posPaymentMethod;

  showConfirmModal(`Confirmar venta por ${money.format(total)} (${method})`, {
    label: "Confirmar venta",
    onConfirm: async () => {
  setLoading(true, "Procesando venta…");
  try {
    const branchId = await branchIdByName(activeBranchId);

    const { data: sale, error: saleErr } = await supabaseClient
      .from("pos_sales")
      .insert({ branch_id:branchId, employee_id:currentEmployee?.id||null,
        customer_id:posCustomerId||null,
        payment_method:method, discount_amount:posDiscount, total })
      .select("id").single();
    if (saleErr) throw saleErr;

    const { error: itemsErr } = await supabaseClient.from("pos_sale_items").insert(
      posCart.map(item => ({
        sale_id: sale.id, product_id: item.productId,
        description: item.name, quantity: item.qty, unit_price: item.unitPrice,
      }))
    );
    if (itemsErr) throw itemsErr;

    const conceptStr = posCart.map(i => `${i.qty}× ${i.name}`).join(", ");
    const clientName = posCustomerId
      ? (state.clients.find(c => c.id === posCustomerId)?.name || "")
      : "";
    const { data: tx } = await supabaseClient.from("transactions").insert({
      branch_id: branchId, transaction_date: dateStamp(),
      type: "Ingreso", category: "Venta",
      concept: `POS: ${conceptStr}${clientName ? " — "+clientName : ""}`,
      amount: total, payment_method: method,
      created_by: currentEmployee?.id || null,
    }).select("id").single();

    if (tx?.id) {
      await supabaseClient.from("pos_sales").update({ transaction_id: tx.id }).eq("id", sale.id);
      state.transactions.unshift({
        id:tx.id, date:dateStamp(), type:"Ingreso", category:"Venta",
        concept:`POS: ${conceptStr}`, amount:total, branch:activeBranchId,
      });
    }

    // Decrement stock locally (DB trigger already handled it)
    for (const item of posCart) {
      const prod = state.products.find(p => p.id === item.productId);
      if (prod) prod.stock = Math.max(0, Number(prod.stock) - item.qty);
    }

    // Mark discount code as used
    if (posDiscountCode) {
      const dcResult = applyDiscount(subtotal, posDiscountCode, "pos");
      if (dcResult.valid && dcResult.id) markDiscountUsed(dcResult.id);
    }

    state.posSales = state.posSales || [];
    state.posSales.unshift({ id:sale.id, total, paymentMethod:method,
      discount:posDiscount, createdAt:dateStamp(), branch:activeBranchId });

    lastPosSale = {
      items: posCart.map(i => ({ ...i })),
      total, method, discount: posDiscount,
      discountCode: posDiscountCode,
      clientName: clientName,
      date: dateStamp(),
    };
    posCart = [];
    posDiscount = 0;
    posDiscountCode = "";
    posCustomerId = null;

    showToast(`✓ Venta registrada: ${money.format(total)}`);
    render();
    reloadState().catch(e => console.warn("POS reload:", e));
  } catch(err) {
    showErrorToast(`Error al procesar venta: ${err.message}`);
  } finally {
    setLoading(false);
  }
  } }); // end showConfirmModal onConfirm
}

let financePeriod = "month"; // "today" | "week" | "month" | "all"

function localDateMinus(days) {
  const d = new Date(); d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function financeFilteredTxs() {
  const all   = branchTransactions();
  const today = dateStamp();
  if (financePeriod === "today") return all.filter(t => t.date === today);
  if (financePeriod === "week")  return all.filter(t => t.date >= localDateMinus(6));
  if (financePeriod === "month") return all.filter(t => t.date >= today.slice(0,7)+"-01");
  return all;
}

function renderFinance() {
  const txs        = financeFilteredTxs();
  const income     = sumByType(txs,"Ingreso");
  const expenses   = sumByType(txs,"Egreso");
  const bal        = income - expenses;
  const margin     = income ? Math.round((bal/income)*100) : 0;
  const perms      = currentPerms();

  // Update active filter button in the static HTML bar
  document.querySelectorAll(".fin-filter").forEach(b =>
    b.classList.toggle("is-active", b.dataset.fin === financePeriod));

  // Show/hide action buttons based on permission
  const bi = document.querySelector("#btn-new-ingreso");
  const be = document.querySelector("#btn-new-egreso");
  if (bi) bi.style.display = perms.canManageFinance ? "" : "none";
  if (be) be.style.display = perms.canManageFinance ? "" : "none";

  // Metrics row
  document.querySelector("#finance-metrics").innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px">
      <article class="metric">
        <span>Ingresos</span>
        <strong class="type-income" style="font-size:22px">${money.format(income)}</strong>
      </article>
      <article class="metric">
        <span>Egresos</span>
        <strong class="type-expense" style="font-size:22px">${money.format(expenses)}</strong>
      </article>
      <article class="metric">
        <span>Balance</span>
        <strong class="${bal>=0?"type-income":"type-expense"}" style="font-size:22px">${money.format(bal)}</strong>
      </article>
      <article class="metric">
        <span>Margen</span>
        <strong class="${margin>=0?"type-income":"type-expense"}" style="font-size:22px">${margin}%</strong>
        <small class="muted" style="font-size:11px;margin-top:4px;display:block">${txs.length} movimientos</small>
      </article>
    </div>`;

  // Table
  document.querySelector("#transactions-table").innerHTML = bySearch(txs).map(i=>`
    <tr>
      <td style="white-space:nowrap">${i.date}</td>
      <td><span class="type-pill ${i.type==="Ingreso"?"type-income":"type-expense"}">${i.type}</span></td>
      <td>${escapeHtml(i.concept)}</td>
      <td><span class="muted">${escapeHtml(i.category)}</span></td>
      <td style="text-align:right"><strong class="${i.type==="Ingreso"?"type-income":"type-expense"}">${i.type==="Ingreso"?"+":"-"}${money.format(i.amount)}</strong></td>
      <td>
        <div class="action-row" style="justify-content:flex-end;gap:6px">
          <button class="mini-button" data-edit-tx="${i.id}">Editar</button>
          ${perms.canManageFinance?`<button class="mini-button danger-btn" data-delete-tx="${i.id}">Eliminar</button>`:""}
        </div>
      </td>
    </tr>`).join("")||tableEmpty(6);
}

let reportsPeriod = "month"; // "today" | "week" | "month" | "all"

function reportDateRange() {
  const today = dateStamp();
  if (reportsPeriod === "today")  return [today, today];
  if (reportsPeriod === "week")   return [localDateMinus(6), today];
  if (reportsPeriod === "month")  return [today.slice(0,7)+"-01", today];
  return ["2000-01-01", today];
}

function renderReports() {
  document.querySelectorAll(".rpt-filter").forEach(b =>
    b.classList.toggle("is-active", b.dataset.rpt === reportsPeriod));
  const [from, to] = reportDateRange();
  const bTxs       = branchTransactions().filter(t => t.date >= from && t.date <= to);
  const bTickets   = branchTickets();
  const bProducts  = branchProducts();

  const income     = sumByType(bTxs,"Ingreso");
  const expenses   = sumByType(bTxs,"Egreso");
  const balance    = income - expenses;
  const finished   = bTickets.filter(t=>["Listo","Entregado"].includes(t.status)).length;
  const invValue   = bProducts.reduce((s,p)=>s+Number(p.price||0)*Number(p.stock||0),0);
  const lowStock   = bProducts.filter(p=>Number(p.stock)<=Number(p.minStock)&&Number(p.minStock)>0);
  const periodLabel= {today:"Hoy",week:"Últimos 7 días",month:"Este mes",all:"Todo el tiempo"}[reportsPeriod];

  // Summary cards
  document.querySelector("#reports-grid").innerHTML = [
    ["Ingresos",money.format(income),periodLabel,"type-income"],
    ["Egresos",money.format(expenses),periodLabel,"type-expense"],
    ["Balance",money.format(balance),balance>=0?"Positivo":"Negativo",balance>=0?"type-income":"type-expense"],
    ["Tickets cerrados",finished,"Listos o entregados",""],
    ["Valor inventario",money.format(invValue),"Productos activos",""],
    ["Stock bajo",lowStock.length,lowStock.length?"Requieren reposición":"Todo OK",lowStock.length?"type-expense":""],
  ].map(([l,v,n,cls])=>`<article class="report-card"><span>${l}</span><strong class="${cls}">${v}</strong><p class="muted">${n}</p></article>`).join("");

  // Cash detail: breakdown by category
  const byCat = {};
  for (const t of bTxs) { byCat[t.category] = (byCat[t.category]||{income:0,expense:0}); if(t.type==="Ingreso") byCat[t.category].income+=Number(t.amount); else byCat[t.category].expense+=Number(t.amount); }
  const catRows = Object.entries(byCat).sort((a,b)=>(b[1].income+b[1].expense)-(a[1].income+a[1].expense))
    .map(([cat,vals])=>`<tr><td>${escapeHtml(cat)}</td><td class="type-income">${vals.income>0?money.format(vals.income):""}</td><td class="type-expense">${vals.expense>0?money.format(vals.expense):""}</td></tr>`).join("");

  document.querySelector("#reports-cash").innerHTML = bTxs.length ? `
    <div class="card" style="margin-top:24px">
      <h3 style="margin:0 0 16px;font-size:14px">Movimientos por categoría — ${periodLabel}</h3>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="border-bottom:1px solid rgba(255,255,255,.1)">
            <th style="text-align:left;padding:6px 8px">Categoría</th>
            <th style="text-align:right;padding:6px 8px;color:#2ecc71">Ingreso</th>
            <th style="text-align:right;padding:6px 8px;color:#ff6b6b">Egreso</th>
          </tr></thead>
          <tbody>${catRows}</tbody>
        </table>
      </div>
    </div>` : "";

  // ── Utilidad estimada ────────────────────────────────────────────────────────
  {
    const margin = income > 0 ? Math.round((balance / income) * 100) : 0;
    const barPct = income > 0 ? Math.min(100, Math.round((Math.abs(balance) / income) * 100)) : 0;
    const barColor = balance >= 0 ? "#2ecc71" : "#ff6b6b";

    // Profit contribution per category (income - expense within category)
    const profitByCat = Object.entries(byCat)
      .map(([cat, vals]) => ({ cat, net: vals.income - vals.expense, income: vals.income, expense: vals.expense }))
      .sort((a, b) => b.net - a.net);

    const profitCatRows = profitByCat.map(({ cat, net, income: ci, expense: ce }) => {
      const netColor = net >= 0 ? "#2ecc71" : "#ff6b6b";
      return `<tr style="border-bottom:1px solid rgba(255,255,255,.04)">
        <td style="padding:6px 10px">${escapeHtml(cat)}</td>
        <td style="padding:6px 10px;text-align:right;color:#2ecc71">${ci > 0 ? money.format(ci) : "—"}</td>
        <td style="padding:6px 10px;text-align:right;color:#ff6b6b">${ce > 0 ? money.format(ce) : "—"}</td>
        <td style="padding:6px 10px;text-align:right;font-weight:600;color:${netColor}">${money.format(net)}</td>
      </tr>`;
    }).join("");

    document.querySelector("#reports-profit").innerHTML = bTxs.length ? `
      <div class="card" style="margin-top:16px;border-left:3px solid ${barColor}">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px">
          <div>
            <h3 style="margin:0 0 4px;font-size:14px">Utilidad estimada — ${periodLabel}</h3>
            <p class="muted" style="margin:0;font-size:11px">Ingresos menos egresos del período seleccionado</p>
          </div>
          <div style="text-align:right">
            <div style="font-size:24px;font-weight:700;color:${barColor}">${money.format(balance)}</div>
            <div style="font-size:12px;color:rgba(255,255,255,.45)">Margen ${margin}%</div>
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
          <div style="flex:1;min-width:120px;background:rgba(46,204,113,.08);border:1px solid rgba(46,204,113,.2);border-radius:8px;padding:10px 14px">
            <div style="font-size:11px;color:rgba(255,255,255,.5);margin-bottom:4px">Ingresos</div>
            <div style="font-size:18px;font-weight:600;color:#2ecc71">${money.format(income)}</div>
          </div>
          <div style="flex:1;min-width:120px;background:rgba(255,107,107,.08);border:1px solid rgba(255,107,107,.2);border-radius:8px;padding:10px 14px">
            <div style="font-size:11px;color:rgba(255,255,255,.5);margin-bottom:4px">Egresos</div>
            <div style="font-size:18px;font-weight:600;color:#ff6b6b">${money.format(expenses)}</div>
          </div>
          <div style="flex:1;min-width:120px;background:rgba(${balance>=0?"46,204,113":"255,107,107"},.08);border:1px solid rgba(${balance>=0?"46,204,113":"255,107,107"},.2);border-radius:8px;padding:10px 14px">
            <div style="font-size:11px;color:rgba(255,255,255,.5);margin-bottom:4px">Utilidad neta</div>
            <div style="font-size:18px;font-weight:600;color:${barColor}">${money.format(balance)}</div>
          </div>
        </div>
        <div style="margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,.4);margin-bottom:5px">
            <span>${balance >= 0 ? "Rentabilidad" : "Déficit"}</span>
            <span>${Math.abs(margin)}% de los ingresos</span>
          </div>
          <div style="background:rgba(255,255,255,.08);border-radius:4px;height:8px;overflow:hidden">
            <div style="width:${barPct}%;background:${barColor};height:8px;border-radius:4px;transition:width .4s"></div>
          </div>
        </div>
        ${profitCatRows ? `
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="border-bottom:1px solid rgba(255,255,255,.1)">
            <th style="text-align:left;padding:6px 10px">Categoría</th>
            <th style="text-align:right;padding:6px 10px;color:#2ecc71">Ingreso</th>
            <th style="text-align:right;padding:6px 10px;color:#ff6b6b">Egreso</th>
            <th style="text-align:right;padding:6px 10px">Contribución</th>
          </tr></thead>
          <tbody>${profitCatRows}</tbody>
          <tfoot><tr style="border-top:2px solid rgba(255,255,255,.12);font-weight:700">
            <td style="padding:7px 10px">TOTAL</td>
            <td style="padding:7px 10px;text-align:right;color:#2ecc71">${money.format(income)}</td>
            <td style="padding:7px 10px;text-align:right;color:#ff6b6b">${money.format(expenses)}</td>
            <td style="padding:7px 10px;text-align:right;color:${barColor}">${money.format(balance)}</td>
          </tr></tfoot>
        </table>` : ""}
      </div>` : "";
  }

  // Tickets by stage
  const stageRows = ticketStages.map(s=>{
    const n = bTickets.filter(t=>t.status===s).length;
    const pct = bTickets.length ? Math.round((n/bTickets.length)*100) : 0;
    return `<tr><td style="padding:6px 8px">${s}</td><td style="padding:6px 8px;text-align:center"><strong>${n}</strong></td>
      <td style="padding:6px 8px;min-width:120px"><div style="background:rgba(255,255,255,.08);border-radius:4px;height:6px"><div style="width:${pct}%;background:var(--fz-primary,#2F6FFF);height:6px;border-radius:4px"></div></div></td></tr>`;
  }).join("");

  document.querySelector("#reports-tickets").innerHTML = `
    <div class="card" style="margin-top:16px">
      <h3 style="margin:0 0 16px;font-size:14px">Tickets por etapa</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="border-bottom:1px solid rgba(255,255,255,.1)">
          <th style="text-align:left;padding:6px 8px">Etapa</th>
          <th style="text-align:center;padding:6px 8px">Tickets</th>
          <th style="padding:6px 8px">Distribución</th>
        </tr></thead>
        <tbody>${stageRows}</tbody>
      </table>
    </div>`;

  // Device ranking — uses ALL branch tickets (ignores period filter, we want lifetime counts)
  {
    const allBranchTickets = branchTickets();
    const deviceMap = {};
    for (const t of allBranchTickets) {
      const name = (t.productName||"").trim();
      if (!name) continue;
      if (!deviceMap[name]) deviceMap[name] = { count:0, revenue:0, completed:0 };
      deviceMap[name].count++;
      deviceMap[name].revenue += Number(t.repairAmount||0);
      if (["Listo","Entregado"].includes(t.status)) deviceMap[name].completed++;
    }
    const deviceRanking = Object.entries(deviceMap)
      .sort((a,b) => b[1].count - a[1].count)
      .slice(0, 20);
    const maxCount = deviceRanking[0]?.[1]?.count || 1;

    const deviceRows = deviceRanking.map(([name, s], i) => {
      const barPct = Math.round((s.count / maxCount) * 100);
      return `<tr style="border-bottom:1px solid rgba(255,255,255,.04)">
        <td style="padding:6px 10px;color:rgba(255,255,255,.4);width:28px;text-align:right">${i+1}</td>
        <td style="padding:6px 10px;font-weight:500">${escapeHtml(name)}</td>
        <td style="padding:6px 10px;text-align:center;font-weight:700">${s.count}</td>
        <td style="padding:6px 10px;min-width:80px">
          <div style="background:rgba(255,255,255,.08);border-radius:3px;height:5px">
            <div style="width:${barPct}%;background:var(--fz-primary,#2F6FFF);height:5px;border-radius:3px"></div>
          </div>
        </td>
        <td style="padding:6px 10px;text-align:center;color:rgba(255,255,255,.5)">${s.completed}</td>
        <td style="padding:6px 10px;text-align:right;color:#2ecc71">${s.revenue>0?money.format(s.revenue):"—"}</td>
      </tr>`;
    }).join("");

    document.querySelector("#reports-devices").innerHTML = deviceRanking.length ? `
      <div class="card" style="margin-top:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <h3 style="margin:0;font-size:14px">Equipos más frecuentes</h3>
          <span style="font-size:11px;color:rgba(255,255,255,.4)">Historial completo de la sucursal · Top 20</span>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="border-bottom:1px solid rgba(255,255,255,.1)">
              <th style="padding:6px 10px;width:28px"></th>
              <th style="text-align:left;padding:6px 10px">Equipo</th>
              <th style="text-align:center;padding:6px 10px">Tickets</th>
              <th style="padding:6px 10px">Frecuencia</th>
              <th style="text-align:center;padding:6px 10px">Cerrados</th>
              <th style="text-align:right;padding:6px 10px">Ingresos</th>
            </tr></thead>
            <tbody>${deviceRows}</tbody>
          </table>
        </div>
      </div>` : "";
  }

  // Low stock list
  document.querySelector("#reports-stock").innerHTML = lowStock.length ? `
    <div class="card" style="margin-top:16px;border-left:3px solid #ff9f43">
      <h3 style="margin:0 0 12px;font-size:14px;color:#ff9f43">⚠️ Productos con stock bajo</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="border-bottom:1px solid rgba(255,255,255,.1)">
          <th style="text-align:left;padding:6px 8px">Producto</th>
          <th style="text-align:center;padding:6px 8px">Actual</th>
          <th style="text-align:center;padding:6px 8px">Mínimo</th>
          <th style="text-align:center;padding:6px 8px">Faltante</th>
        </tr></thead>
        <tbody>${lowStock.map(p=>{
          const falta=Math.max(0,Number(p.minStock)-Number(p.stock));
          return `<tr><td style="padding:6px 8px">${escapeHtml(p.name)}</td>
            <td style="text-align:center;padding:6px 8px;color:#ff6b6b"><strong>${p.stock}</strong></td>
            <td style="text-align:center;padding:6px 8px">${p.minStock}</td>
            <td style="text-align:center;padding:6px 8px;color:#ff9f43">+${falta}</td></tr>`;
        }).join("")}</tbody>
      </table>
    </div>` : "";

  // Productivity by employee
  const byEmp = {};
  for (const t of bTickets) {
    const emp = t.assignedTo || "Sin asignar";
    if (!byEmp[emp]) byEmp[emp] = { tickets:0, completed:0, revenue:0 };
    byEmp[emp].tickets++;
    byEmp[emp].revenue += Number(t.repairAmount || 0);
    if (["Listo","Entregado"].includes(t.status)) byEmp[emp].completed++;
  }
  const empRows = Object.entries(byEmp)
    .sort((a,b) => b[1].completed - a[1].completed)
    .map(([name, s]) => {
      const pct = s.tickets ? Math.round((s.completed/s.tickets)*100) : 0;
      return `<tr>
        <td style="padding:6px 8px">${escapeHtml(name)}</td>
        <td style="text-align:center;padding:6px 8px">${s.tickets}</td>
        <td style="text-align:center;padding:6px 8px">${s.completed}</td>
        <td style="text-align:center;padding:6px 8px">${pct}%</td>
        <td style="text-align:right;padding:6px 8px" class="type-income">${money.format(s.revenue)}</td>
      </tr>`;
    }).join("");

  document.querySelector("#reports-productivity").innerHTML = empRows ? `
    <div class="card" style="margin-top:16px">
      <h3 style="margin:0 0 16px;font-size:14px">Productividad por empleado</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="border-bottom:1px solid rgba(255,255,255,.1)">
          <th style="text-align:left;padding:6px 8px">Empleado</th>
          <th style="text-align:center;padding:6px 8px">Tickets</th>
          <th style="text-align:center;padding:6px 8px">Cerrados</th>
          <th style="text-align:center;padding:6px 8px">Efectividad</th>
          <th style="text-align:right;padding:6px 8px">Valor generado</th>
        </tr></thead>
        <tbody>${empRows}</tbody>
      </table>
    </div>` : "";

  // Monthly balance — always built from ALL branch transactions (ignores period filter)
  // Useful for SAT declarations and monthly accounting
  const allTxs  = branchTransactions();
  const byMonth = {};
  for (const t of allTxs) {
    const ym = (t.date||"").slice(0,7); if (!ym) continue;
    if (!byMonth[ym]) byMonth[ym] = { income:0, expense:0, tickets:0 };
    if (t.type==="Ingreso") byMonth[ym].income  += Number(t.amount||0);
    else                    byMonth[ym].expense += Number(t.amount||0);
  }
  for (const t of branchTickets()) {
    const ym = (t.createdAt||"").slice(0,7); if (!ym) continue;
    if (!byMonth[ym]) byMonth[ym] = { income:0, expense:0, tickets:0 };
    byMonth[ym].tickets++;
  }
  const monthNames = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const monthRows  = Object.keys(byMonth).sort().reverse().map(ym => {
    const { income, expense, tickets } = byMonth[ym];
    const bal  = income - expense;
    const [y,m] = ym.split("-");
    const label = `${monthNames[Number(m)-1]} ${y}`;
    return `<tr style="border-bottom:1px solid rgba(255,255,255,.05)">
      <td style="padding:7px 10px;font-weight:600">${label}</td>
      <td style="padding:7px 10px;text-align:right;color:#2ecc71">${income>0?money.format(income):"—"}</td>
      <td style="padding:7px 10px;text-align:right;color:#ff6b6b">${expense>0?money.format(expense):"—"}</td>
      <td style="padding:7px 10px;text-align:right;font-weight:700;color:${bal>=0?"#2ecc71":"#ff6b6b"}">${money.format(bal)}</td>
      <td style="padding:7px 10px;text-align:center;color:rgba(255,255,255,.5)">${tickets}</td>
    </tr>`;
  }).join("");

  const monthTotIncome  = Object.values(byMonth).reduce((s,v)=>s+v.income,0);
  const monthTotExpense = Object.values(byMonth).reduce((s,v)=>s+v.expense,0);
  const monthTotBal     = monthTotIncome - monthTotExpense;

  document.querySelector("#reports-monthly").innerHTML = Object.keys(byMonth).length ? `
    <div class="card" style="margin-top:16px;border-left:3px solid var(--fz-primary,#085ACB)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <h3 style="margin:0;font-size:14px">Balance mensual — todas las fechas</h3>
        <span style="font-size:11px;color:rgba(255,255,255,.4)">Para declaraciones SAT / contabilidad</span>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="border-bottom:2px solid rgba(255,255,255,.15)">
            <th style="text-align:left;padding:7px 10px">Mes</th>
            <th style="text-align:right;padding:7px 10px;color:#2ecc71">Ingresos</th>
            <th style="text-align:right;padding:7px 10px;color:#ff6b6b">Egresos</th>
            <th style="text-align:right;padding:7px 10px">Balance</th>
            <th style="text-align:center;padding:7px 10px;color:rgba(255,255,255,.5)">Tickets</th>
          </tr></thead>
          <tbody>${monthRows}</tbody>
          <tfoot><tr style="border-top:2px solid rgba(255,255,255,.15);font-weight:700">
            <td style="padding:8px 10px">TOTAL</td>
            <td style="padding:8px 10px;text-align:right;color:#2ecc71">${money.format(monthTotIncome)}</td>
            <td style="padding:8px 10px;text-align:right;color:#ff6b6b">${money.format(monthTotExpense)}</td>
            <td style="padding:8px 10px;text-align:right;color:${monthTotBal>=0?"#2ecc71":"#ff6b6b"}">${money.format(monthTotBal)}</td>
            <td></td>
          </tr></tfoot>
        </table>
      </div>
    </div>` : "";
}

// ── Users panel ───────────────────────────────────────────────────────────────
function renderUsers() {
  const container = document.querySelector("#users-table");
  if (!container) return;
  container.innerHTML = state.employees.map(e=>`
    <tr>
      <td><strong>${escapeHtml(e.name||e.full_name)}</strong></td>
      <td>${escapeHtml(e.email||"")}</td>
      <td><span class="role-badge role-${e.role}">${ROLE_LABELS[e.role]||e.role}</span></td>
      <td>${escapeHtml(e.branch||"")}</td>
      <td><span class="status ${e.status==="active"?"ready":e.status==="paused"?"waiting":"urgent"}">${e.status==="active"?"Activo":e.status==="paused"?"Pausado":"Inactivo"}</span></td>
      <td>
        <div class="action-row" style="justify-content:flex-start;gap:6px">
          <button class="mini-button" data-edit-employee="${e.id}">Editar</button>
          <button class="mini-button" data-reset-pw="${e.id}">Reset PW</button>
          <button class="mini-button danger-btn" data-delete-employee="${e.id}">Dar de baja</button>
        </div>
      </td>
    </tr>`).join("")||tableEmpty(6);
  renderPermissionsEditor();
}

// ── Permissions editor ────────────────────────────────────────────────────────
const PERM_STORAGE_KEY = "fixzone-role-permissions-v1";

const PERM_SECTIONS = [
  { key:"dashboard",      label:"Home / Dashboard" },
  { key:"clients",        label:"Clientes" },
  { key:"products",       label:"Productos" },
  { key:"tickets",        label:"Tickets" },
  { key:"supplies",       label:"Insumos" },
  { key:"precios",        label:"Tabla de Precios" },
  { key:"pos",            label:"Punto de Venta" },
  { key:"finance",        label:"Finanzas" },
  { key:"reports",        label:"Reportes" },
  { key:"users",          label:"Usuarios" },
  { key:"soporte",        label:"Soporte IT" },
  { key:"diseno",         label:"Diseño" },
  { key:"automatizacion", label:"Automatización" },
];

const PERM_FLAGS = [
  { key:"canManageFinance", label:"Agregar / editar movimientos" },
  { key:"canDeleteClients", label:"Eliminar clientes" },
  { key:"canDeleteTickets", label:"Eliminar tickets" },
  { key:"canManageUsers",   label:"Gestionar usuarios" },
  { key:"canExportXLS",     label:"Exportar Excel" },
];

// Editable role groups: each entry maps UI label → PERMISSIONS keys to update
const PERM_ROLES = [
  { label:"Admin",     keys:["admin","owner","it"],        locked:true  },
  { label:"Estándar",  keys:["technician","standard"],     locked:false },
  { label:"Marketing", keys:["marketing"],                 locked:false },
];

function loadSavedPermissions() {
  try {
    const saved = JSON.parse(localStorage.getItem(PERM_STORAGE_KEY)||"{}");
    for (const [roleKey, cfg] of Object.entries(saved)) {
      if (!PERMISSIONS[roleKey]) continue;
      if (Array.isArray(cfg.tabs)) PERMISSIONS[roleKey].tabs = cfg.tabs;
      for (const f of PERM_FLAGS) {
        if (f.key in cfg) PERMISSIONS[roleKey][f.key] = cfg[f.key];
      }
    }
  } catch(e) {}
}

function savePermissionsToStorage() {
  const out = {};
  for (const role of PERM_ROLES) {
    for (const key of role.keys) {
      if (!PERMISSIONS[key]) continue;
      out[key] = { tabs: [...PERMISSIONS[key].tabs] };
      for (const f of PERM_FLAGS) out[key][f.key] = PERMISSIONS[key][f.key];
    }
  }
  localStorage.setItem(PERM_STORAGE_KEY, JSON.stringify(out));
}

function applyPermissionsFromEditor() {
  const el = document.querySelector("#permissions-editor");
  if (!el) return;
  for (const role of PERM_ROLES) {
    if (role.locked) continue;
    for (const key of role.keys) {
      if (!PERMISSIONS[key]) continue;
      // Sections (tabs)
      PERMISSIONS[key].tabs = PERM_SECTIONS
        .filter(s => el.querySelector(`input[data-role="${key}"][data-section="${s.key}"]`)?.checked)
        .map(s => s.key);
      // Flags
      for (const f of PERM_FLAGS) {
        const cb = el.querySelector(`input[data-role="${key}"][data-flag="${f.key}"]`);
        if (cb) PERMISSIONS[key][f.key] = cb.checked;
      }
    }
  }
  savePermissionsToStorage();
  applyRolePermissions();
}

function renderPermissionsEditor() {
  const el = document.querySelector("#permissions-editor");
  if (!el) return;

  // Use first key of each role group as source of truth for display
  const colPerms = PERM_ROLES.map(r => PERMISSIONS[r.keys[0]] || PERMISSIONS.standard);

  const headerCols = PERM_ROLES.map(r =>
    `<th style="text-align:center;padding:8px 16px;font-size:13px">${r.label}${r.locked?` <span class="muted" style="font-size:10px;font-weight:400">(fijo)</span>`:""}</th>`
  ).join("");

  const sectionRows = PERM_SECTIONS.map(s => {
    const cells = PERM_ROLES.map((r, i) => {
      const checked = colPerms[i].tabs.includes(s.key);
      if (r.locked) return `<td style="text-align:center"><input type="checkbox" disabled ${checked?"checked":""}></td>`;
      // All keys in the group share the same checkbox (first key drives it)
      const attrs = r.keys.map(k => `data-role="${k}"`).join(" ") + ` data-section="${s.key}"`;
      return `<td style="text-align:center"><input type="checkbox" ${attrs} ${checked?"checked":""}></td>`;
    }).join("");
    return `<tr><td style="padding:6px 12px;font-size:13px">${s.label}</td>${cells}</tr>`;
  }).join("");

  const flagRows = PERM_FLAGS.map(f => {
    const cells = PERM_ROLES.map((r, i) => {
      const checked = !!colPerms[i][f.key];
      if (r.locked) return `<td style="text-align:center"><input type="checkbox" disabled ${checked?"checked":""}></td>`;
      const attrs = r.keys.map(k => `data-role="${k}"`).join(" ") + ` data-flag="${f.key}"`;
      return `<td style="text-align:center"><input type="checkbox" ${attrs} ${checked?"checked":""}></td>`;
    }).join("");
    return `<tr style="background:rgba(255,255,255,0.03)"><td style="padding:6px 12px;font-size:13px;font-style:italic;color:var(--fz-muted,#888)">${f.label}</td>${cells}</tr>`;
  }).join("");

  el.innerHTML = `
    <div class="card" style="margin-top:8px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <h3 style="margin:0;font-size:15px">Permisos por Rol</h3>
        <button class="primary-action" id="save-permissions-btn" style="font-size:13px;padding:6px 16px">Guardar cambios</button>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.1)">
              <th style="text-align:left;padding:8px 12px;font-size:12px;color:var(--fz-muted,#888)">Sección / Permiso</th>
              ${headerCols}
            </tr>
          </thead>
          <tbody>
            <tr><td colspan="4" style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--fz-muted,#888)">Secciones visibles</td></tr>
            ${sectionRows}
            <tr><td colspan="4" style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--fz-muted,#888)">Acciones</td></tr>
            ${flagRows}
          </tbody>
        </table>
      </div>
    </div>`;

  document.querySelector("#save-permissions-btn")?.addEventListener("click", () => {
    applyPermissionsFromEditor();
    const btn = document.querySelector("#save-permissions-btn");
    if (btn) { btn.textContent = "✓ Guardado"; setTimeout(()=>{ btn.textContent="Guardar cambios"; },2000); }
  });
}

// ── Support Kanban ────────────────────────────────────────────────────────────
function renderSupport() {
  const perms = currentPerms();
  const board = document.querySelector("#support-board");
  if (!board) return;
  board.innerHTML = supportStages.map(status=>{
    const tasks = bySearch(state.supportTasks||[]).filter(t=>t.status===status);
    return `<section class="kanban-column"
      ondragover="event.preventDefault();this.classList.add('drag-over')"
      ondragleave="this.classList.remove('drag-over')"
      ondrop="handleSupportDrop(event,'${status}');this.classList.remove('drag-over')"
      data-stage="${status}">
      <h3>${status} <span>${tasks.length}</span></h3>
      <div class="ticket-stack">${tasks.map(task=>supportTaskCard(task, perms)).join("")||emptyMessage("Sin tareas.")}</div>
    </section>`;
  }).join("");
}

async function handleSupportDrop(event, newStatus) {
  event.preventDefault();
  const taskId = event.dataTransfer.getData("taskId");
  if (!taskId) return;
  const tasks = state.supportTasks || [];
  const task  = tasks.find(t => t.id === taskId);
  if (!task || task.status === newStatus) return;
  const idx = tasks.findIndex(t => t.id === taskId);
  const oldStatus = task.status;
  if (idx !== -1) state.supportTasks[idx] = { ...task, status: newStatus };
  render();
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskId);
  if (dataMode === "remote" && isUUID) {
    setLoading(true, "Guardando…");
    try {
      await updateRemoteSupportTask(taskId, { ...task, status: newStatus });
      try { await reloadState(); } catch(e) { console.warn(e); }
      render();
    } catch(err) {
      if (idx !== -1) state.supportTasks[idx] = { ...task, status: oldStatus };
      render();
      showErrorToast(`Error al mover tarea: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }
}
window.handleSupportDrop = handleSupportDrop;

function supportTaskCard(task, perms) {
  perms = perms || currentPerms();
  return `<article class="ticket-card" draggable="true"
    ondragstart="event.dataTransfer.setData('taskId','${task.id}');this.style.opacity='.5'"
    ondragend="this.style.opacity=''">
    <div class="task-topline">
      <span class="status ${task.priority==="Urgente"||task.priority==="Alta"?"urgent":task.status==="Resuelto"?"ready":""}">${task.priority}</span>
      <small class="muted">${escapeHtml(task.createdAt||"")}</small>
    </div>
    <strong>${escapeHtml(task.title)}</strong>
    <p class="muted">${escapeHtml(task.description||"")}</p>
    <div class="task-topline">
      <span class="status ${task.status==="Resuelto"?"ready":task.status==="En progreso"?"":""}">${task.status}</span>
      <small class="muted">${escapeHtml(task.assignedTo||"")}</small>
    </div>
    <div class="support-actions">
      <button class="mini-button" data-edit-task="${task.id}">Editar</button>
      ${perms.canDeleteTask?`<button class="mini-button danger-btn" data-delete-task="${task.id}">Eliminar</button>`:""}
    </div>
  </article>`;
}




// ── Diseño — contenido dinámico por sucursal ──────────────────────────────────
function renderDiseno() {
  const brand = window.getBranchBrand(activeBranchId);
  const links = brand.marketingLinks || [];
  const flows = brand.autoFlows || [];

  // Badge de sucursal activa
  const badge = document.querySelector("#diseno-brand-badge");
  if (badge) {
    badge.textContent = `${brand.displayName} · ${brand.locationLabel}`;
    badge.style.cssText = `background:rgba(var(--fz-primary-rgb),0.18);color:var(--fz-secondary);border:1px solid rgba(var(--fz-primary-rgb),0.3);display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;font-size:12px;font-weight:800`;
  }

  // Grid de herramientas por sucursal (editable con overrides en localStorage)
  const grid = document.querySelector("#marketing-links-grid");
  if (grid) {
    const savedLinks = getMktLinks(activeBranchId);
    const activeLinks = savedLinks || links;
    renderMarketingLinksGrid(grid, activeLinks.map(l => ({ ...l })), saved => {
      if (saved === null) {
        const all = JSON.parse(localStorage.getItem(MKT_LINKS_KEY) || "{}");
        delete all[activeBranchId];
        localStorage.setItem(MKT_LINKS_KEY, JSON.stringify(all));
        renderDiseno();
      } else {
        saveMktLinks(activeBranchId, saved);
      }
    });
  }

  // Flujos sugeridos por sucursal
  const flowGrid = document.querySelector("#auto-flows-grid");
  if (flowGrid && flows.length) {
    flowGrid.innerHTML = flows.map(f => `
      <div class="auto-flow-card">
        <div class="auto-flow-steps">
          ${f.steps.map((s, i) => i < f.steps.length - 1
            ? `<span class="auto-step">${escapeHtml(s)}</span><span class="auto-arrow">→</span>`
            : `<span class="auto-step">${escapeHtml(s)}</span>`
          ).join("")}
        </div>
        <p>${escapeHtml(f.desc)}</p>
      </div>`).join("");
  }

  // Actualizar swatches de color con valores de la sucursal activa
  const primaryHex = brand.colors["--fz-primary"];
  const secondaryHex = brand.colors["--fz-secondary"];
  const deepHex = brand.colors["--fz-deep"];
  const tokenPrimary = document.querySelector("#token-primary-hex");
  const tokenSecondary = document.querySelector("#token-secondary-hex");
  const tokenDeep = document.querySelector("#token-deep-hex");
  if (tokenPrimary) { tokenPrimary.textContent = primaryHex?.toUpperCase(); tokenPrimary.closest(".token-swatch").style.background = primaryHex; }
  if (tokenSecondary) { tokenSecondary.textContent = secondaryHex?.toUpperCase(); tokenSecondary.closest(".token-swatch").style.background = secondaryHex; }
  if (tokenDeep) { tokenDeep.textContent = deepHex?.toUpperCase(); tokenDeep.closest(".token-swatch").style.background = deepHex; }

  // Actualizar tagline de muestra tipográfica
  const taglineSample = document.querySelector("#diseno-tagline-sample");
  if (taglineSample) taglineSample.textContent = brand.tagline;

  // Actualizar copys clave por sucursal
  const copysEl = document.querySelector("#diseno-copys");
  if (copysEl) {
    const copys = brand.displayName === "REFAXZONE"
      ? ['"REFACCIONES AL INSTANTE."', '"REPARACIÓN PROFESIONAL"', '"MICROSOLDADURA EXPERTA"', '"TU EQUIPO EN BUENAS MANOS"']
      : ['"WE FIX FAST. YOU RELAX."', '"REPARACIÓN PROFESIONAL"', '"MICROSOLDADURA EXPERTA"', '"TU EQUIPO EN BUENAS MANOS"'];
    copysEl.innerHTML = copys.join("<br>");
  }

  renderQuickMessages();
  renderDiscountManager();
  renderWATemplates();
  renderBrandEditor();
}

// ── Marketing links — editable per branch, stored in localStorage ─────────────
const MKT_LINKS_KEY = "fixzone-mkt-links-v1";
const AUTO_TOOLS_KEY = "fixzone-auto-tools-v1";

const DEFAULT_AUTO_TOOLS = [
  { icon:"⚡", name:"Make",              url:"https://make.com",                    desc:"Automatizaciones de flujo: notificaciones y sincronización entre apps" },
  { icon:"🔗", name:"Zapier",            url:"https://zapier.com",                  desc:"Conecta Google Sheets, Gmail, WhatsApp y más sin código" },
  { icon:"💬", name:"WhatsApp Business", url:"https://business.whatsapp.com",       desc:"Seguimiento a clientes y mensajes masivos" },
  { icon:"📧", name:"Mailchimp",         url:"https://mailchimp.com",               desc:"Email marketing, campañas y newsletters" },
  { icon:"🎯", name:"Google Ads",        url:"https://ads.google.com",              desc:"Campañas de búsqueda y display para captación" },
  { icon:"📍", name:"Google Business",   url:"https://www.google.com/business/",    desc:"Perfil de negocio, reseñas y visibilidad en Maps" },
];

function getMktLinks(branch) {
  try {
    const all = JSON.parse(localStorage.getItem(MKT_LINKS_KEY) || "{}");
    return all[branch] || null;
  } catch { return null; }
}
function saveMktLinks(branch, links) {
  try {
    const all = JSON.parse(localStorage.getItem(MKT_LINKS_KEY) || "{}");
    all[branch] = links;
    localStorage.setItem(MKT_LINKS_KEY, JSON.stringify(all));
  } catch {}
}
function getAutoTools() {
  try { return JSON.parse(localStorage.getItem(AUTO_TOOLS_KEY) || "null") || DEFAULT_AUTO_TOOLS; } catch { return DEFAULT_AUTO_TOOLS; }
}
function saveAutoTools(tools) { localStorage.setItem(AUTO_TOOLS_KEY, JSON.stringify(tools)); }

function renderMarketingLinksGrid(container, links, onSave) {
  if (!container) return;
  let editMode = false;
  let draft = links.map(l => ({ ...l }));

  const render = () => {
    container.innerHTML = `
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:10px">
        ${editMode
          ? `<button class="mini-button danger-btn" id="mkt-cancel-edit" style="font-size:11px;padding:3px 10px">Cancelar</button>
             <button class="primary-action" id="mkt-save-links" style="font-size:11px;padding:4px 12px">Guardar</button>
             <button class="mini-button" id="mkt-add-link" style="font-size:11px;padding:3px 10px">+ Agregar</button>`
          : `<button class="mini-button" id="mkt-toggle-edit" style="font-size:11px;padding:3px 10px">✎ Editar enlaces</button>
             <button class="mini-button danger-btn" id="mkt-reset-links" style="font-size:11px;padding:3px 10px">Restaurar</button>`
        }
      </div>
      ${editMode
        ? `<div style="display:flex;flex-direction:column;gap:8px" id="mkt-edit-rows">
            ${draft.map((l, i) => `
              <div style="display:flex;gap:8px;align-items:center;background:rgba(255,255,255,.04);border-radius:6px;padding:8px 10px">
                <input value="${escapeHtml(l.icon||"")}" data-mkt-icon="${i}" style="width:40px;text-align:center;font-size:16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:4px;padding:3px 5px;color:inherit" placeholder="🔗">
                <input value="${escapeHtml(l.name||"")}" data-mkt-name="${i}" style="flex:1;min-width:80px;font-size:12px;font-weight:600;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:4px;padding:3px 8px;color:inherit" placeholder="Nombre">
                <input value="${escapeHtml(l.url||"")}" data-mkt-url="${i}" style="flex:2;min-width:140px;font-size:11px;font-family:monospace;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:4px;padding:3px 8px;color:inherit" placeholder="https://...">
                <input value="${escapeHtml(l.desc||"")}" data-mkt-desc="${i}" style="flex:2;font-size:11px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:4px;padding:3px 8px;color:inherit" placeholder="Descripción">
                <button type="button" data-mkt-del="${i}" class="mini-button danger-btn" style="padding:2px 8px;font-size:11px">✕</button>
              </div>`).join("")}
          </div>`
        : `<div class="marketing-grid">
            ${draft.map(l => `
              <a class="marketing-card" href="${escapeHtml(l.url||"#")}" target="_blank" rel="noopener">
                <div class="marketing-card-icon">${l.icon||"🔗"}</div>
                <strong>${escapeHtml(l.name||"")}</strong>
                <p>${escapeHtml(l.desc||"")}</p>
              </a>`).join("")}
          </div>`
      }`;

    container.querySelector("#mkt-toggle-edit")?.addEventListener("click", () => {
      editMode = true; draft = links.map(l => ({ ...l })); render();
    });
    container.querySelector("#mkt-cancel-edit")?.addEventListener("click", () => {
      editMode = false; draft = links.map(l => ({ ...l })); render();
    });
    container.querySelector("#mkt-reset-links")?.addEventListener("click", () => {
      showConfirmModal("¿Restaurar los enlaces a los valores predeterminados?", {
        label: "Restaurar",
        onConfirm: () => { onSave(null); }
      });
    });
    container.querySelector("#mkt-add-link")?.addEventListener("click", () => {
      draft.push({ icon:"🔗", name:"", url:"", desc:"" }); render();
    });
    container.querySelector("#mkt-save-links")?.addEventListener("click", () => {
      const rows = container.querySelectorAll("[data-mkt-url]");
      rows.forEach((inp, i) => {
        draft[i] = {
          icon: container.querySelector(`[data-mkt-icon="${i}"]`)?.value.trim() || "🔗",
          name: container.querySelector(`[data-mkt-name="${i}"]`)?.value.trim() || "",
          url:  inp.value.trim(),
          desc: container.querySelector(`[data-mkt-desc="${i}"]`)?.value.trim() || "",
        };
      });
      const valid = draft.filter(l => l.name && l.url);
      if (!valid.length) { showErrorToast("Agrega al menos un enlace con nombre y URL."); return; }
      onSave(valid);
      editMode = false;
      links.splice(0, links.length, ...valid);
      render();
      showToast("✓ Enlaces guardados");
    });
  };

  // Re-initialize the container so repeated calls don't accumulate listeners
  const fresh = container.cloneNode(false);
  container.replaceWith(fresh);
  container = fresh;

  container.addEventListener("click", e => {
    const idx = e.target.closest("[data-mkt-del]")?.dataset.mktDel;
    if (idx !== undefined && editMode) { draft.splice(Number(idx), 1); render(); }
  });

  render();
}

function renderAutoToolsSection() {
  const container = document.querySelector("#auto-tools-grid");
  if (!container) return;
  const tools = getAutoTools();
  renderMarketingLinksGrid(container, tools, saved => {
    if (saved === null) {
      localStorage.removeItem(AUTO_TOOLS_KEY);
      renderAutoToolsSection();
    } else {
      saveAutoTools(saved);
    }
  });
}

// ── Brand palette editor ──────────────────────────────────────────────────────
const BRAND_OVERRIDES_KEY = "fixzone-brand-overrides-v1";

function getBrandOverrides() {
  try { return JSON.parse(localStorage.getItem(BRAND_OVERRIDES_KEY) || "{}"); } catch { return {}; }
}
function saveBrandOverrides(overrides) {
  localStorage.setItem(BRAND_OVERRIDES_KEY, JSON.stringify(overrides));
}
function applyBrandOverrides() {
  const all = getBrandOverrides();
  const over = all[activeBranchId];
  if (!over) return;
  const root = document.documentElement;
  Object.entries(over).forEach(([k, v]) => root.style.setProperty(k, v));
}

function renderBrandEditor() {
  const el = document.querySelector("#brand-palette-editor");
  if (!el) return;
  const brand    = window.getBranchBrand(activeBranchId);
  const all      = getBrandOverrides();
  const saved    = all[activeBranchId] || {};
  const current  = { ...brand.colors, ...saved };
  const savedLogo = saved["--fz-logo-src"] || "";

  const FIELDS = [
    { key:"--fz-primary",   label:"Color principal",   hint:"Botones, badges, links activos" },
    { key:"--fz-secondary", label:"Color secundario",  hint:"Hover, íconos, detalles" },
    { key:"--fz-deep",      label:"Color profundo",    hint:"Sombras, estados presionados" },
  ];

  const logoPreviewStyle = savedLogo
    ? `background:rgba(255,255,255,.05);border-radius:8px;padding:8px;text-align:center`
    : `display:none`;

  el.innerHTML = `
    <div class="section-heading" style="margin-top:24px"><h2>Editor de marca</h2></div>
    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <h3 style="margin:0;font-size:14px">Paleta de colores — ${brand.displayName}</h3>
          <small class="muted">Los cambios se aplican en tiempo real y se guardan por sucursal.</small>
        </div>
        <button class="ghost-button" id="brand-reset-btn" style="font-size:12px">Restaurar defaults</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-bottom:16px">
        ${FIELDS.map(f => {
          const hex = (current[f.key]||"#085ACB").replace(/[^#0-9a-fA-F]/g,"").slice(0,7);
          return `<div>
            <label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px">${f.label}</label>
            <div style="display:flex;align-items:center;gap:8px">
              <input type="color" id="bp-${f.key.replace(/--/g,'').replace(/-/g,'_')}"
                value="${hex}" data-var="${f.key}"
                style="width:48px;height:48px;border-radius:8px;border:2px solid rgba(255,255,255,.15);cursor:pointer;background:none;padding:2px" />
              <div>
                <span id="bp-hex-${f.key.replace(/--/g,'').replace(/-/g,'_')}" style="font-family:monospace;font-size:12px">${hex.toUpperCase()}</span>
                <br><small class="muted">${f.hint}</small>
              </div>
            </div>
          </div>`;
        }).join("")}
      </div>
      <div style="display:flex;align-items:center;gap:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08)">
        <div style="flex:1;height:32px;border-radius:6px;background:linear-gradient(90deg,var(--fz-deep),var(--fz-primary),var(--fz-secondary))" id="brand-preview-bar"></div>
        <button class="primary-action" id="brand-save-btn" style="font-size:13px">Guardar paleta</button>
      </div>
    </div>

    <div class="card">
      <div style="margin-bottom:12px">
        <h3 style="margin:0 0 4px;font-size:14px">Logo de la sucursal — ${brand.displayName}</h3>
        <small class="muted">Sube una imagen o pega una URL. Se guarda localmente en este navegador.</small>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start">
        <div>
          <label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px">Subir archivo (PNG/SVG/WEBP)</label>
          <input type="file" id="bp-logo-file" accept="image/png,image/svg+xml,image/webp,image/jpeg"
            style="width:100%;font-size:12px;color:var(--fz-gray-light);cursor:pointer" />
          <small class="muted" style="display:block;margin-top:4px">Recomendado: fondo transparente, min 200px</small>
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px">O pegar URL directa</label>
          <input type="url" id="bp-logo-url" placeholder="https://..." value="${escapeHtml(savedLogo.startsWith('data:') ? '' : savedLogo)}"
            style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:var(--fz-white);font-size:13px;box-sizing:border-box" />
        </div>
      </div>
      <div id="bp-logo-preview" style="${logoPreviewStyle}">
        <img id="bp-logo-img" src="${escapeHtml(savedLogo)}" alt="Logo preview"
          style="max-height:80px;max-width:200px;object-fit:contain" />
        <small class="muted" style="display:block;margin-top:4px">Logo guardado para ${brand.displayName}</small>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08)">
        <button class="primary-action" id="brand-logo-save-btn" style="font-size:13px">Guardar logo</button>
        ${savedLogo ? `<button class="ghost-button" id="brand-logo-reset-btn" style="font-size:12px">Eliminar logo guardado</button>` : ""}
      </div>
    </div>`;

  // Live preview on color change
  FIELDS.forEach(f => {
    const id = `bp-${f.key.replace(/--/g,'').replace(/-/g,'_')}`;
    const input = el.querySelector(`#${id}`);
    const hexSpan = el.querySelector(`#bp-hex-${f.key.replace(/--/g,'').replace(/-/g,'_')}`);
    input?.addEventListener("input", e => {
      document.documentElement.style.setProperty(f.key, e.target.value);
      if (hexSpan) hexSpan.textContent = e.target.value.toUpperCase();
      if (f.key === "--fz-primary") {
        const r = parseInt(e.target.value.slice(1,3),16);
        const g = parseInt(e.target.value.slice(3,5),16);
        const b = parseInt(e.target.value.slice(5,7),16);
        document.documentElement.style.setProperty("--fz-primary-rgb", `${r}, ${g}, ${b}`);
      }
    });
  });

  el.querySelector("#brand-save-btn")?.addEventListener("click", () => {
    const patch = {};
    FIELDS.forEach(f => {
      const id = `bp-${f.key.replace(/--/g,'').replace(/-/g,'_')}`;
      const v = el.querySelector(`#${id}`)?.value;
      if (v) {
        patch[f.key] = v;
        if (f.key === "--fz-primary") {
          const r=parseInt(v.slice(1,3),16), g=parseInt(v.slice(3,5),16), b=parseInt(v.slice(5,7),16);
          patch["--fz-primary-rgb"] = `${r}, ${g}, ${b}`;
          patch["--fz-glow"]         = `0 0 32px rgba(${r},${g},${b},0.45)`;
          patch["--fz-shadow"]       = `0 18px 48px rgba(${r},${g},${b},0.35)`;
          patch["--fz-nav-hover-bg"] = `rgba(${r},${g},${b},0.16)`;
          patch["--fz-btn-gradient"] = `linear-gradient(135deg,${v},${el.querySelector("#bp-fz_secondary")?.value||v})`;
          patch["--fz-tab-active-bg"]= `linear-gradient(135deg,${v},${el.querySelector("#bp-fz_secondary")?.value||v})`;
          patch["--fz-topbar-glow"]  = `rgba(${r},${g},${b},0.20)`;
        }
      }
    });
    const all = getBrandOverrides();
    all[activeBranchId] = { ...(all[activeBranchId]||{}), ...patch };
    saveBrandOverrides(all);
    showToast(`✓ Paleta de ${activeBranchId} guardada`);
  });

  el.querySelector("#brand-reset-btn")?.addEventListener("click", () => {
    showConfirmModal(`¿Restaurar la paleta default de ${activeBranchId}?`, {
      label: "Restaurar",
      onConfirm: () => {
        const all = getBrandOverrides();
        const logo = all[activeBranchId]?.["--fz-logo-src"];
        delete all[activeBranchId];
        if (logo) { all[activeBranchId] = { "--fz-logo-src": logo }; }
        saveBrandOverrides(all);
        applyBranchBrand(activeBranchId);
        renderDiseno();
        showToast("✓ Paleta restaurada");
      }
    });
  });

  // Logo: preview when file selected
  el.querySelector("#bp-logo-file")?.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target.result;
      const preview = el.querySelector("#bp-logo-preview");
      const img = el.querySelector("#bp-logo-img");
      if (preview) preview.style.cssText = `background:rgba(255,255,255,.05);border-radius:8px;padding:8px;text-align:center`;
      if (img) img.src = src;
    };
    reader.readAsDataURL(file);
  });

  // Logo URL: preview on blur
  el.querySelector("#bp-logo-url")?.addEventListener("blur", e => {
    const url = e.target.value.trim();
    if (!url) return;
    const preview = el.querySelector("#bp-logo-preview");
    const img = el.querySelector("#bp-logo-img");
    if (preview) preview.style.cssText = `background:rgba(255,255,255,.05);border-radius:8px;padding:8px;text-align:center`;
    if (img) img.src = url;
  });

  el.querySelector("#brand-logo-save-btn")?.addEventListener("click", () => {
    const fileInput = el.querySelector("#bp-logo-file");
    const urlInput = el.querySelector("#bp-logo-url");
    const previewImg = el.querySelector("#bp-logo-img");
    const file = fileInput?.files[0];

    const applyLogo = src => {
      const all = getBrandOverrides();
      all[activeBranchId] = { ...(all[activeBranchId]||{}), "--fz-logo-src": src };
      saveBrandOverrides(all);
      const logoImg = document.querySelector(".brand img");
      if (logoImg) logoImg.src = src;
      showToast(`✓ Logo de ${activeBranchId} guardado`);
      renderBrandEditor();
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = ev => applyLogo(ev.target.result);
      reader.readAsDataURL(file);
    } else if (urlInput?.value.trim()) {
      applyLogo(urlInput.value.trim());
    } else if (previewImg?.src) {
      showToast("Selecciona un archivo o pega una URL primero");
    }
  });

  el.querySelector("#brand-logo-reset-btn")?.addEventListener("click", () => {
    showConfirmModal(`¿Eliminar el logo guardado de ${activeBranchId}?`, {
      label: "Eliminar logo",
      danger: true,
      onConfirm: () => {
        const all = getBrandOverrides();
        if (all[activeBranchId]) delete all[activeBranchId]["--fz-logo-src"];
        saveBrandOverrides(all);
        applyBranchBrand(activeBranchId);
        renderBrandEditor();
        showToast("✓ Logo eliminado, usando logo default");
      }
    });
  });
}

// ── WhatsApp message templates ────────────────────────────────────────────────
function renderWATemplates() {
  const el = document.querySelector("#wa-templates-manager");
  if (!el) return;
  const tpls = getWATemplates();
  const LABELS = { cotizacion:"📋 Cotización", listo:"✅ Equipo Listo", abono:"💳 Abono recibido", pagado:"✅ Pago completo", garantia:"🛡 Garantía" };
  const HINTS  = "{cliente} {equipo} {sucursal} {folio} {monto} {saldo} {total} {items}";
  el.innerHTML = `
    <div class="card" style="margin-top:16px">
      <div style="margin-bottom:16px">
        <h3 style="margin:0 0 4px;font-size:14px">Plantillas de WhatsApp — tickets</h3>
        <small class="muted">Se envían automáticamente al cambiar estado del ticket. Variables: <code>${HINTS}</code></small>
      </div>
      ${Object.keys(LABELS).map(k=>`
        <div style="margin-bottom:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
            <label style="font-size:12px;font-weight:700">${LABELS[k]}</label>
            <button class="mini-button wt-copy-btn" data-key="${k}" style="font-size:11px;padding:2px 8px">📋 Copiar</button>
          </div>
          <textarea id="wt-${k}" rows="3" style="width:100%;resize:vertical;font-size:12px;padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:inherit;font-family:inherit">${escapeHtml(tpls[k]||"")}</textarea>
        </div>`).join("")}
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="ghost-button" id="wt-reset-btn">Restaurar predeterminados</button>
        <button class="primary-action" id="wt-save-btn">Guardar plantillas</button>
      </div>
    </div>`;

  el.querySelector("#wt-save-btn")?.addEventListener("click", () => {
    const saved = {};
    Object.keys(LABELS).forEach(k => { saved[k] = el.querySelector(`#wt-${k}`)?.value||""; });
    saveWATemplates(saved);
    showToast("✓ Plantillas de WhatsApp guardadas");
  });
  el.querySelector("#wt-reset-btn")?.addEventListener("click", () => {
    localStorage.removeItem(WA_TEMPLATES_KEY);
    renderWATemplates();
    showToast("✓ Plantillas restauradas");
  });
  el.querySelectorAll(".wt-copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const txt = el.querySelector(`#wt-${btn.dataset.key}`)?.value || "";
      navigator.clipboard.writeText(txt).then(() => {
        const orig = btn.textContent;
        btn.textContent = "✓ Copiado";
        setTimeout(() => { btn.textContent = orig; }, 1800);
      });
    });
  });
}

// ── Mensajes rápidos (repertorio copiable) ────────────────────────────────────
const QUICK_MESSAGES_KEY = "fixzone-quick-messages-v1";
const DEFAULT_QUICK_MESSAGES = [
  { name: "Saludo inicial",        text: "¡Hola! 👋 Bienvenido a FixZone. ¿En qué podemos ayudarte hoy?" },
  { name: "Horarios",              text: "Nuestro horario de atención es de lunes a sábado de 10:00 a 20:00 hrs. ¡Te esperamos!" },
  { name: "Tiempo de reparación",  text: "El tiempo estimado de reparación es de 1 a 3 días hábiles dependiendo del diagnóstico. Te avisamos en cuanto esté listo 🔧" },
  { name: "Solicitud de garantía", text: "Con gusto revisamos tu equipo en garantía. Por favor trae el ticket de reparación y el equipo al local. Recuerda que la garantía cubre únicamente la falla original reparada." },
  { name: "Equipo listo",          text: "¡Tu equipo está listo para recoger! 🎉 Puedes pasar en nuestro horario de atención. Recuerda traer tu ticket o comprobante." },
  { name: "Despedida",             text: "¡Fue un placer atenderte! 😊 Si tienes alguna duda no dudes en escribirnos. ¡Hasta pronto!" },
  { name: "No tenemos el modelo",  text: "Lo sentimos, por el momento no contamos con refacciones para ese modelo. Podemos conseguirla bajo pedido, ¿te interesa que te cotizemos?" },
];

function loadQuickMessages() {
  try { return JSON.parse(localStorage.getItem(QUICK_MESSAGES_KEY)) || [...DEFAULT_QUICK_MESSAGES]; }
  catch { return [...DEFAULT_QUICK_MESSAGES]; }
}
function saveQuickMessages(msgs) { localStorage.setItem(QUICK_MESSAGES_KEY, JSON.stringify(msgs)); }

function renderQuickMessages() {
  const el = document.querySelector("#quick-messages-manager");
  if (!el) return;
  const msgs = loadQuickMessages();
  let editMode = false;

  const render = () => {
    const fresh = el.cloneNode(false);
    el.replaceWith(fresh);
    const container = document.querySelector("#quick-messages-manager");

    if (!editMode) {
      container.innerHTML = `
        <div class="card" style="margin-top:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <div>
              <h3 style="margin:0 0 3px;font-size:14px">Mensajes rápidos</h3>
              <small class="muted">Copia y pega directamente en tus conversaciones de WhatsApp</small>
            </div>
            <button class="ghost-button" id="qm-edit-btn" style="font-size:12px">✎ Editar</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${msgs.map((m, i) => `
              <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:12px 14px">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
                  <div style="flex:1;min-width:0">
                    <div style="font-size:12px;font-weight:700;color:var(--fz-primary);margin-bottom:4px">${escapeHtml(m.name)}</div>
                    <div style="font-size:12px;color:rgba(255,255,255,.75);line-height:1.5;white-space:pre-wrap">${escapeHtml(m.text)}</div>
                  </div>
                  <button class="mini-button qm-copy" data-idx="${i}" style="flex-shrink:0;font-size:11px;padding:3px 10px">📋 Copiar</button>
                </div>
              </div>`).join("")}
          </div>
        </div>`;
      container.querySelector("#qm-edit-btn")?.addEventListener("click", () => { editMode = true; render(); });
      container.querySelectorAll(".qm-copy").forEach(btn => {
        btn.addEventListener("click", () => {
          const txt = msgs[Number(btn.dataset.idx)]?.text || "";
          navigator.clipboard.writeText(txt).then(() => {
            const orig = btn.textContent;
            btn.textContent = "✓ Copiado";
            setTimeout(() => { btn.textContent = orig; }, 1800);
          });
        });
      });
    } else {
      container.innerHTML = `
        <div class="card" style="margin-top:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <h3 style="margin:0;font-size:14px">Editar mensajes rápidos</h3>
            <div style="display:flex;gap:8px">
              <button class="ghost-button" id="qm-cancel-btn" style="font-size:12px">Cancelar</button>
              <button class="ghost-button" id="qm-restore-btn" style="font-size:12px">Restaurar</button>
              <button class="mini-button" id="qm-add-btn" style="font-size:12px">+ Agregar</button>
              <button class="primary-action" id="qm-save-btn" style="font-size:12px">Guardar</button>
            </div>
          </div>
          <div id="qm-rows" style="display:flex;flex-direction:column;gap:10px">
            ${msgs.map((m, i) => `
              <div class="qm-row" data-idx="${i}" style="display:grid;grid-template-columns:1fr 2fr auto;gap:8px;align-items:start">
                <input class="qm-name" type="text" value="${escapeHtml(m.name)}" placeholder="Nombre" style="padding:7px 10px;font-size:12px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:inherit" />
                <textarea class="qm-text" rows="2" placeholder="Texto del mensaje" style="padding:7px 10px;font-size:12px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:inherit;resize:vertical;font-family:inherit">${escapeHtml(m.text)}</textarea>
                <button class="mini-button danger-btn qm-delete" data-idx="${i}" style="font-size:11px;padding:3px 8px">✕</button>
              </div>`).join("")}
          </div>
        </div>`;

      container.querySelector("#qm-cancel-btn")?.addEventListener("click", () => { editMode = false; render(); });
      container.querySelector("#qm-restore-btn")?.addEventListener("click", () => {
        saveQuickMessages([...DEFAULT_QUICK_MESSAGES]);
        editMode = false;
        render();
        showToast("✓ Mensajes restaurados");
      });
      container.querySelector("#qm-add-btn")?.addEventListener("click", () => {
        const rows = container.querySelector("#qm-rows");
        const i = rows.querySelectorAll(".qm-row").length;
        const div = document.createElement("div");
        div.className = "qm-row";
        div.dataset.idx = i;
        div.style.cssText = "display:grid;grid-template-columns:1fr 2fr auto;gap:8px;align-items:start";
        div.innerHTML = `
          <input class="qm-name" type="text" placeholder="Nombre" style="padding:7px 10px;font-size:12px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:inherit" />
          <textarea class="qm-text" rows="2" placeholder="Texto del mensaje" style="padding:7px 10px;font-size:12px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:inherit;resize:vertical;font-family:inherit"></textarea>
          <button class="mini-button danger-btn qm-delete" style="font-size:11px;padding:3px 8px">✕</button>`;
        div.querySelector(".qm-delete")?.addEventListener("click", () => div.remove());
        rows.appendChild(div);
      });
      container.querySelector("#qm-save-btn")?.addEventListener("click", () => {
        const updated = [];
        container.querySelectorAll(".qm-row").forEach(row => {
          const name = row.querySelector(".qm-name")?.value.trim();
          const text = row.querySelector(".qm-text")?.value.trim();
          if (name || text) updated.push({ name: name||"Sin nombre", text: text||"" });
        });
        saveQuickMessages(updated);
        editMode = false;
        render();
        showToast("✓ Mensajes rápidos guardados");
      });
      container.querySelectorAll(".qm-delete").forEach(btn => {
        btn.addEventListener("click", () => btn.closest(".qm-row").remove());
      });
    }
  };
  render();
}

// ── Discount codes (managed via Supabase discount_codes table) ────────────────
const WA_TEMPLATES_KEY = "fixzone-wa-templates-v1";
const DEFAULT_WA_TEMPLATES = {
  listo:      "Hola {cliente} 👋, tu equipo *{equipo}* está listo para recoger en {sucursal}. Folio: {folio}. ¡Gracias por confiar en nosotros!",
  abono:      "Hola {cliente} 👋, recibimos tu abono de *{monto}*. Saldo pendiente: {saldo}. Folio: {folio}.",
  pagado:     "Hola {cliente} 👋, tu pago de *{monto}* fue recibido. Tu equipo {equipo} está *PAGADO* ✅. Folio: {folio}. ¡Gracias!",
  garantia:   "Hola {cliente} 👋, tu equipo {equipo} está en garantía. Folio: {folio}. Contáctanos para coordinar.",
  cotizacion: "",
};

function getWATemplates() {
  try { return { ...DEFAULT_WA_TEMPLATES, ...JSON.parse(localStorage.getItem(WA_TEMPLATES_KEY)||"{}") }; } catch { return DEFAULT_WA_TEMPLATES; }
}
function saveWATemplates(t) { localStorage.setItem(WA_TEMPLATES_KEY, JSON.stringify(t)); }
function fillWATemplate(key, vars) {
  const tpl = getWATemplates()[key] || DEFAULT_WA_TEMPLATES[key] || "";
  return tpl
    .replace(/{cliente}/g,  vars.client||"")
    .replace(/{equipo}/g,   vars.productName||"")
    .replace(/{sucursal}/g, vars.branch||"")
    .replace(/{folio}/g,    vars.tracking||"")
    .replace(/{monto}/g,    vars.amount||"")
    .replace(/{saldo}/g,    vars.pending||"")
    .replace(/{total}/g,    vars.amount||"")
    .replace(/{items}/g,    vars.items||"");
}

function applyDiscount(baseAmount, code, scope = "ticket") {
  const today = new Date().toISOString().slice(0, 10);
  const allCodes = [...(state.discounts || [])];
  const d = allCodes.find(x =>
    x.code.toLowerCase() === (code || "").toLowerCase() &&
    x.active &&
    (!x.validFrom  || today >= x.validFrom) &&
    (!x.validUntil || today <= x.validUntil) &&
    (!x.maxUses    || x.usedCount < x.maxUses) &&
    (Array.isArray(x.scope) ? x.scope.includes(scope) : true)
  );
  if (!d) return { amount: 0, pct: 0, label: "", valid: false };
  const pct    = d.type === "percent" ? Number(d.value) : 0;
  const fixed  = d.type === "fixed"   ? Number(d.value) : 0;
  const amount = fixed + (baseAmount * pct / 100);
  return { amount: Math.min(amount, baseAmount), pct, label: d.description || d.code, valid: true, id: d.id };
}

async function markDiscountUsed(discountId) {
  if (!supabaseClient || !discountId) return;
  const disc = (state.discounts || []).find(d => d.id === discountId);
  if (!disc) return;
  disc.usedCount = (disc.usedCount || 0) + 1;
  await supabaseClient.from("discount_codes")
    .update({ used_count: disc.usedCount })
    .eq("id", discountId);
}

function renderDiscountManager() {
  const el = document.querySelector("#discount-manager");
  if (!el) return;
  const discounts = state.discounts || [];
  const today = new Date().toISOString().slice(0, 10);

  el.innerHTML = `
    <div class="card" style="margin-top:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="margin:0;font-size:14px">Códigos de descuento</h3>
        <button class="primary-action" style="font-size:12px;padding:6px 14px" id="add-discount-btn">+ Nuevo código</button>
      </div>
      <div id="discounts-list">
        ${discounts.length ? discounts.map(d => {
          const expired = d.validUntil && today > d.validUntil;
          const future  = d.validFrom  && today < d.validFrom;
          const scopeLabel = (d.scope||[]).map(s=>({pos:"POS",cotizacion:"Cotización",ticket:"Ticket"}[s]||s)).join(", ");
          const dateRange = d.validFrom||d.validUntil ? `${d.validFrom||""}${d.validFrom&&d.validUntil?" → ":""}${d.validUntil||""}` : "Sin límite";
          return `
          <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:13px;flex-wrap:wrap">
            <span style="font-family:monospace;background:rgba(255,255,255,.08);padding:2px 8px;border-radius:4px;font-weight:700;min-width:80px">${escapeHtml(d.code)}</span>
            <span style="flex:1;min-width:100px">${escapeHtml(d.description||"")}</span>
            <span class="${d.type==="percent"?"type-income":"type-expense"}" style="white-space:nowrap">${d.type==="percent"?d.value+"%":"$"+d.value}</span>
            <span class="muted" style="font-size:11px;white-space:nowrap">${escapeHtml(dateRange)}</span>
            <span class="muted" style="font-size:11px;white-space:nowrap">${escapeHtml(scopeLabel)}</span>
            ${d.maxUses ? `<span class="muted" style="font-size:11px">${d.usedCount}/${d.maxUses} usos</span>` : ""}
            <span class="status ${expired?"urgent":future?"warning":d.active?"done":""}" style="font-size:10px">
              ${expired?"Expirado":future?"Pendiente":d.active?"Activo":"Inactivo"}
            </span>
            <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer">
              <input type="checkbox" ${d.active?"checked":""} data-toggle-discount="${d.id}">
            </label>
            <button class="mini-button danger-btn" style="padding:2px 8px" data-delete-discount="${d.id}">✕</button>
          </div>`;
        }).join("") : `<p class="muted" style="font-size:13px">No hay códigos creados.</p>`}
      </div>
      <div id="new-discount-form" style="display:none;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.08)">
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
          <div class="field" style="margin:0;flex:1;min-width:120px"><label style="font-size:11px">Código *</label>
            <input id="dc-code" type="text" placeholder="PROMO10" style="text-transform:uppercase;font-family:monospace" /></div>
          <div class="field" style="margin:0;width:120px"><label style="font-size:11px">Tipo</label>
            <select id="dc-type"><option value="percent">Porcentaje (%)</option><option value="fixed">Fijo ($)</option></select></div>
          <div class="field" style="margin:0;width:90px"><label style="font-size:11px">Valor *</label>
            <input id="dc-value" type="number" min="0.01" step="0.01" placeholder="10" /></div>
          <div class="field" style="margin:0;flex:2;min-width:140px"><label style="font-size:11px">Descripción</label>
            <input id="dc-desc" type="text" placeholder="Descuento de temporada" /></div>
          <div class="field" style="margin:0;width:120px"><label style="font-size:11px">Válido desde</label>
            <input id="dc-from" type="date" /></div>
          <div class="field" style="margin:0;width:120px"><label style="font-size:11px">Válido hasta</label>
            <input id="dc-until" type="date" /></div>
          <div class="field" style="margin:0;width:90px"><label style="font-size:11px">Máx. usos</label>
            <input id="dc-maxuses" type="number" min="1" placeholder="∞" /></div>
          <div class="field is-wide" style="margin:0">
            <label style="font-size:11px">Aplica en</label>
            <div style="display:flex;gap:14px;margin-top:4px">
              <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer"><input type="checkbox" id="dc-scope-pos" checked> POS</label>
              <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer"><input type="checkbox" id="dc-scope-cot" checked> Cotización</label>
              <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer"><input type="checkbox" id="dc-scope-tkt" checked> Ticket</label>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="primary-action" id="save-discount-btn" style="font-size:12px;padding:6px 14px">Guardar</button>
          <button class="ghost-button" id="cancel-discount-btn" style="font-size:12px;padding:6px 14px">Cancelar</button>
        </div>
      </div>
    </div>`;

  el.querySelector("#add-discount-btn")?.addEventListener("click", () => {
    el.querySelector("#new-discount-form").style.display = "block";
    el.querySelector("#add-discount-btn").style.display = "none";
  });
  el.querySelector("#cancel-discount-btn")?.addEventListener("click", () => {
    el.querySelector("#new-discount-form").style.display = "none";
    el.querySelector("#add-discount-btn").style.display = "";
  });
  el.querySelector("#save-discount-btn")?.addEventListener("click", async () => {
    const code  = (el.querySelector("#dc-code").value||"").trim().toUpperCase();
    const type  = el.querySelector("#dc-type").value;
    const value = Number(el.querySelector("#dc-value").value||0);
    const desc  = (el.querySelector("#dc-desc").value||"").trim();
    const from  = el.querySelector("#dc-from").value || null;
    const until = el.querySelector("#dc-until").value || null;
    const maxUses = Number(el.querySelector("#dc-maxuses").value||0) || null;
    const scope = [];
    if (el.querySelector("#dc-scope-pos").checked)  scope.push("pos");
    if (el.querySelector("#dc-scope-cot").checked)  scope.push("cotizacion");
    if (el.querySelector("#dc-scope-tkt").checked)  scope.push("ticket");
    if (!code || value <= 0) { showErrorToast("Código y valor son requeridos."); return; }
    if (scope.length === 0)  { showErrorToast("Selecciona al menos un alcance."); return; }
    if (from && until && from > until) { showErrorToast("La fecha de inicio no puede ser posterior a la fecha de fin."); return; }
    if ((state.discounts||[]).find(d=>d.code===code)) { showErrorToast("Ese código ya existe."); return; }
    if (!supabaseClient) { showErrorToast("Se requiere conexión a Supabase para guardar códigos."); return; }
    const { data, error } = await supabaseClient.from("discount_codes").insert({
      code, type, value, description: desc||null,
      valid_from: from, valid_until: until, max_uses: maxUses,
      scope, active: true,
      branch_id: activeBranchId || null,
    }).select().single();
    if (error) { showErrorToast("Error al guardar: " + error.message); return; }
    state.discounts = state.discounts || [];
    state.discounts.unshift({ id:data.id, code:data.code, description:data.description||"",
      type:data.type, value:Number(data.value), maxUses:data.max_uses||null, usedCount:0,
      validFrom:data.valid_from||null, validUntil:data.valid_until||null,
      scope:data.scope||["pos","cotizacion","ticket"], active:true, branchId:data.branch_id||null });
    showToast("✓ Código guardado");
    renderDiscountManager();
  });
  el.querySelector("#discounts-list")?.addEventListener("change", async e => {
    const id = e.target.dataset.toggleDiscount;
    if (!id) return;
    const disc = (state.discounts||[]).find(d=>d.id===id);
    if (!disc) return;
    disc.active = e.target.checked;
    if (supabaseClient) await supabaseClient.from("discount_codes").update({ active: disc.active }).eq("id", id);
  });
  el.querySelector("#discounts-list")?.addEventListener("click", e => {
    const id = e.target.dataset.deleteDiscount;
    if (!id) return;
    showConfirmModal("¿Eliminar este código de descuento?", {
      label: "Eliminar",
      danger: true,
      onConfirm: async () => {
        if (supabaseClient) {
          const { error } = await supabaseClient.from("discount_codes").delete().eq("id", id);
          if (error) { showErrorToast("Error al eliminar: " + error.message); return; }
        }
        state.discounts = (state.discounts||[]).filter(d=>d.id!==id);
        renderDiscountManager();
      }
    });
  });
}

// ── Edit: Client ──────────────────────────────────────────────────────────────
function openEditClient(clientId) {
  const client = state.clients.find(c => c.id === clientId);
  if (!client) return;
  activeForm      = "client";
  editingTicketId = clientId;
  modalTitle.textContent = "Editar cliente";
  document.querySelector("#modal-eyebrow").textContent = "Editar registro";
  formFields.innerHTML = formSchemas["client"].fields.map(([name,label,ftype,opts,wide,optional]) =>
    fieldTemplate(name, label, ftype, opts, wide, client[name] ?? "", optional)
  ).join("");
  initDeviceAutocomplete();
  modal.showModal();
}

async function updateRemoteClient(clientId, data) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId);
  if (!isUUID) {
    const idx = state.clients.findIndex(c => c.id === clientId);
    if (idx !== -1) state.clients[idx] = { ...state.clients[idx], ...data };
    return;
  }
  const { error } = await supabaseClient.from("customers").update({
    full_name: data.name,
    phone:     data.phone || null,
    email:     data.email || null,
    address:   data.address || null,
    notes:     data.notes || null,
  }).eq("id", clientId);
  if (error) throw error;
  // Update device if provided
  if (data.device) {
    const existing = await supabaseClient.from("customer_devices")
      .select("id").eq("customer_id", clientId).maybeSingle();
    if (existing.data?.id) {
      await supabaseClient.from("customer_devices")
        .update({ product_name: data.device }).eq("id", existing.data.id);
    }
  }
}

// ── Edit: Support Task ────────────────────────────────────────────────────────
function openEditSupportTask(taskId) {
  const task = (state.supportTasks||[]).find(t => t.id === taskId);
  if (!task) return;
  activeForm      = "supportTasks";
  editingTaskId = taskId;
  modalTitle.textContent = "Editar tarea";
  document.querySelector("#modal-eyebrow").textContent = "Editar registro";
  formFields.innerHTML = formSchemas["supportTasks"].fields.map(([name,label,ftype,opts,wide,optional]) =>
    fieldTemplate(name, label, ftype, opts, wide, task[name] ?? "", optional)
  ).join("");
  modal.showModal();
}

async function updateRemoteSupportTask(taskId, data) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskId);
  if (!isUUID) {
    const idx = (state.supportTasks||[]).findIndex(t => t.id === taskId);
    if (idx !== -1) state.supportTasks[idx] = { ...state.supportTasks[idx], ...data };
    return;
  }
  const { error } = await supabaseClient.from("support_tasks").update({
    title:       data.title,
    description: data.description || null,
    priority:    data.priority,
    status:      data.status,
  }).eq("id", taskId);
  if (error) throw error;
}

// ── Edit: Product ─────────────────────────────────────────────────────────────
function openEditProduct(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;
  activeForm      = "product";
  editingTicketId = productId;
  modalTitle.textContent = "Editar producto";
  document.querySelector("#modal-eyebrow").textContent = "Editar registro";
  formFields.innerHTML = formSchemas["product"].fields.map(([name,label,ftype,opts,wide,optional]) =>
    fieldTemplate(name, label, ftype, opts, wide, product[name] ?? "", optional)
  ).join("");
  modal.showModal();
}

async function updateRemoteProduct(productId, data) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
  if (!isUUID) {
    const idx = state.products.findIndex(p => p.id === productId);
    if (idx !== -1) state.products[idx] = { ...state.products[idx], ...data };
    return;
  }
  const { error } = await supabaseClient.from("products").update({
    name:         data.name,
    sku:          data.sku || null,
    category:     data.category,
    product_type: data.productType || "refaccion",
    stock:        Number(data.stock || 0),
    min_stock:    Number(data.minStock || 0),
    sale_price:   Number(data.price || 0),
    branch_id:    await branchIdByName(data.branch || activeBranchId),
  }).eq("id", productId);
  if (error) throw error;
}

function deleteRemoteProduct(productId) {
  const product = state.products.find(p => p.id === productId);
  const name = product?.name || "este producto";
  showConfirmModal(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`, {
    label: "Eliminar",
    danger: true,
    onConfirm: async () => {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
      if (isUUID) {
        const { error } = await supabaseClient.from("products").delete().eq("id", productId);
        if (error) { showErrorToast(`Error al eliminar: ${error.message}`); return; }
      }
      state.products = state.products.filter(p => p.id !== productId);
      render();
    }
  });
}

// ── Edit: Supply ──────────────────────────────────────────────────────────────
function openEditSupply(supplyId) {
  const supply = branchSupplies().find(s => s.id === supplyId);
  if (!supply) return;
  activeForm      = "supply";
  editingTicketId = supplyId;
  modalTitle.textContent = "Editar compra";
  document.querySelector("#modal-eyebrow").textContent = "Editar registro";
  formFields.innerHTML = formSchemas["supply"].fields.map(([name,label,ftype,opts,wide,optional]) =>
    fieldTemplate(name, label, ftype, opts, wide, supply[name] ?? "", optional)
  ).join("") + buildReceiptUploadSection(supply.receipt_url);
  modal.showModal();
  initProductAutoFill();
}

async function updateRemoteSupply(supplyId, data) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(supplyId);
  if (!isUUID) {
    const idx = state.supplies.findIndex(s => s.id === supplyId);
    if (idx !== -1) state.supplies[idx] = { ...state.supplies[idx], ...data };
    return;
  }
  let receiptUrl;
  const fileInput = document.querySelector("#receipt-file-input");
  if (fileInput?.files?.length) receiptUrl = await uploadReceiptFile(fileInput.files[0]);
  const suppId    = await findOrCreateSupplier(data.supplier);
  const productId = data.product_id || null;
  const itemName  = data.item || (productId && state.products.find(p=>p.id===productId)?.name) || "";
  const payload   = {
    purchase_date: data.date,
    supplier_id:   suppId,
    item_name:     itemName,
    quantity:      Number(data.quantity || 0),
    total_amount:  Number(data.total || 0),
    product_id:    productId,
  };
  if (receiptUrl) payload.receipt_url = receiptUrl;
  const { error } = await supabaseClient.from("supply_purchases").update(payload).eq("id", supplyId);
  if (error) throw error;
}

async function updateRemoteTransaction(txId, data) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(txId);
  if (!isUUID) {
    const idx = state.transactions.findIndex(t => t.id === txId);
    if (idx !== -1) state.transactions[idx] = { ...state.transactions[idx], ...data };
    return;
  }
  const { error } = await supabaseClient.from("transactions").update({
    transaction_date: data.date,
    type:             data.type,
    concept:          data.concept,
    category:         data.category,
    amount:           Number(data.amount || 0),
  }).eq("id", txId);
  if (error) throw error;
}

// ──────────────────────────────────────────────────────────────────────────────
// FORMS
// ──────────────────────────────────────────────────────────────────────────────
// ── Quote items builder ───────────────────────────────────────────────────────
let quoteItemsDraft = [];

function renderQuoteItemsDraft() {
  const rowsEl  = document.querySelector("#qi-rows");
  const emptyEl = document.querySelector("#qi-empty");
  if (!rowsEl) return;
  emptyEl && (emptyEl.style.display = quoteItemsDraft.length ? "none" : "");
  rowsEl.innerHTML = quoteItemsDraft.map((item, idx) => `
    <div class="qi-row" style="display:grid;grid-template-columns:100px 1fr 52px 88px 26px;gap:6px;align-items:center;margin-bottom:4px">
      <select class="qi-type" data-idx="${idx}" style="font-size:12px;padding:5px 6px">
        ${["Servicio","Refacción","Producto"].map(t=>`<option ${item.type===t?"selected":""}>${t}</option>`).join("")}
      </select>
      <input class="qi-desc" data-idx="${idx}" type="text" placeholder="Descripción…" value="${escapeHtml(item.description||"")}" style="font-size:13px">
      <input class="qi-qty" data-idx="${idx}" type="number" value="${item.qty}" min="1" style="font-size:13px;text-align:center">
      <input class="qi-price" data-idx="${idx}" type="number" value="${item.unitPrice||""}" placeholder="Precio" min="0" step="1" style="font-size:13px">
      <button type="button" class="qi-del" data-idx="${idx}" title="Eliminar fila" style="padding:2px 5px;font-size:13px;opacity:.5;cursor:pointer;background:none;border:none;color:inherit">✕</button>
    </div>`).join("");
  updateQuoteItemsHiddenInputs();
}

function updateQuoteItemsHiddenInputs() {
  const subtotal     = quoteItemsDraft.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const code         = (document.querySelector("#qi-discount-code")?.value || "").trim().toUpperCase();
  const discAmt      = Number(document.querySelector("#qi-discount-amount")?.value || 0);
  const total        = Math.max(0, subtotal - discAmt);
  const totalEl      = document.querySelector("#qi-total");
  const amountInput  = document.querySelector("#qi-repair-amount");
  const jsonInput    = document.querySelector("#qi-items-json");
  const discLabel    = document.querySelector("#qi-discount-label");
  if (totalEl)     totalEl.textContent = money.format(total);
  if (amountInput) amountInput.value   = total.toFixed(2);
  if (jsonInput)   jsonInput.value     = JSON.stringify(quoteItemsDraft);
  if (discLabel) {
    if (discAmt > 0) {
      discLabel.textContent = `Descuento${code?" ("+code+")":""}: -${money.format(discAmt)}`;
      discLabel.style.display = "";
    } else {
      discLabel.style.display = "none";
    }
  }
}

function initQuoteItemsBuilder(existingItems = []) {
  quoteItemsDraft = existingItems.map(i => ({ ...i }));
  renderQuoteItemsDraft();

  document.querySelector("#qi-add-service")?.addEventListener("click", () => {
    quoteItemsDraft.push({ type: "Servicio", description: "", qty: 1, unitPrice: 0 });
    renderQuoteItemsDraft();
    document.querySelectorAll(".qi-desc")[quoteItemsDraft.length - 1]?.focus();
  });
  document.querySelector("#qi-add-product")?.addEventListener("click", () => {
    quoteItemsDraft.push({ type: "Producto", description: "", qty: 1, unitPrice: 0 });
    renderQuoteItemsDraft();
    document.querySelectorAll(".qi-desc")[quoteItemsDraft.length - 1]?.focus();
  });

  // Delegate input/change/click on the rows container to avoid losing focus on each keystroke
  document.querySelector("#qi-rows")?.addEventListener("input", e => {
    const idx = Number(e.target.dataset.idx);
    if (isNaN(idx) || !quoteItemsDraft[idx]) return;
    if (e.target.classList.contains("qi-desc"))  quoteItemsDraft[idx].description = e.target.value;
    else if (e.target.classList.contains("qi-qty"))   quoteItemsDraft[idx].qty = Math.max(1, Number(e.target.value)||1);
    else if (e.target.classList.contains("qi-price")) quoteItemsDraft[idx].unitPrice = Number(e.target.value)||0;
    updateQuoteItemsHiddenInputs();
  });
  document.querySelector("#qi-rows")?.addEventListener("change", e => {
    const idx = Number(e.target.dataset.idx);
    if (isNaN(idx) || !quoteItemsDraft[idx]) return;
    if (e.target.classList.contains("qi-type")) { quoteItemsDraft[idx].type = e.target.value; updateQuoteItemsHiddenInputs(); }
  });
  document.querySelector("#qi-rows")?.addEventListener("click", e => {
    const del = e.target.closest(".qi-del");
    if (!del) return;
    quoteItemsDraft.splice(Number(del.dataset.idx), 1);
    renderQuoteItemsDraft();
  });

  document.querySelector("#qi-apply-code")?.addEventListener("click", () => {
    const code = (document.querySelector("#qi-code-input")?.value || "").trim().toUpperCase();
    const statusEl = document.querySelector("#qi-code-status");
    if (!code) { if (statusEl) statusEl.textContent = ""; return; }
    const subtotal = quoteItemsDraft.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const result = applyDiscount(subtotal, code, "cotizacion");
    if (!result.valid) {
      if (statusEl) { statusEl.textContent = "Código no válido"; statusEl.style.color = "#ff6b6b"; }
      const dcAmt = document.querySelector("#qi-discount-amount");
      const dcCode = document.querySelector("#qi-discount-code");
      if (dcAmt) dcAmt.value = "0";
      if (dcCode) dcCode.value = "";
      updateQuoteItemsHiddenInputs();
      return;
    }
    const dcAmt  = document.querySelector("#qi-discount-amount");
    const dcCode = document.querySelector("#qi-discount-code");
    if (dcAmt)  dcAmt.value  = result.amount.toFixed(2);
    if (dcCode) dcCode.value = code;
    if (statusEl) { statusEl.textContent = `✓ -${money.format(result.amount)}`; statusEl.style.color = "#2ed573"; }
    updateQuoteItemsHiddenInputs();
  });
}

function buildQuoteItemsSection() {
  return `
    <div class="field is-wide" id="quote-items-section" style="margin-top:4px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <label style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;opacity:.65">Partidas del servicio</label>
        <div style="display:flex;gap:6px">
          <button type="button" class="mini-button" id="qi-add-service" style="font-size:11px;padding:3px 10px">+ Servicio</button>
          <button type="button" class="mini-button" id="qi-add-product" style="font-size:11px;padding:3px 10px">+ Producto</button>
        </div>
      </div>
      <p id="qi-empty" class="muted" style="font-size:12px;text-align:center;padding:10px 0;margin:0">Agrega servicios o productos con los botones de arriba.</p>
      <div id="qi-rows"></div>
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span class="muted" style="font-size:12px;white-space:nowrap">Código descuento</span>
          <input id="qi-code-input" type="text" placeholder="PROMO10"
            style="width:110px;font-family:monospace;font-size:12px;text-transform:uppercase;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.14);border-radius:4px;padding:4px 8px;color:inherit">
          <button type="button" id="qi-apply-code" class="mini-button" style="font-size:11px;padding:3px 10px">Aplicar</button>
          <span id="qi-code-status" style="font-size:11px;color:#2ed573"></span>
        </div>
        <div style="display:flex;justify-content:flex-end;align-items:baseline;gap:10px">
          <span id="qi-discount-label" class="muted" style="font-size:12px;display:none"></span>
          <span class="muted" style="font-size:13px">Total estimado</span>
          <strong id="qi-total" style="font-size:18px;color:var(--fz-secondary,#2678E8)">$0.00</strong>
        </div>
      </div>
      <input type="hidden" name="repairAmount" id="qi-repair-amount" value="0">
      <input type="hidden" name="quoteItemsJson" id="qi-items-json" value="[]">
      <input type="hidden" name="discountCode" id="qi-discount-code" value="">
      <input type="hidden" name="discountAmount" id="qi-discount-amount" value="0">
    </div>`;
}

function openForm(type, prefill = {}) {
  activeForm      = type;
  editingTicketId = null;
  editingTaskId   = null;
  const schema = formSchemas[type];
  if (!schema) return;
  modalTitle.textContent = schema.title;
  document.querySelector("#modal-eyebrow").textContent = "Nuevo registro";
  formFields.innerHTML = schema.fields.map(([name,label,ftype,opts,wide,optional]) => fieldTemplate(name,label,ftype,opts,wide,prefill[name],optional)).join("");
  if (type==="ticket"||type==="product"||type==="cotizacion") {
    const sel = formFields.querySelector("#branch");
    if (sel) sel.value = activeBranchId;
  }
  // FIX: show photo info note when creating a ticket (photos available after first save)
  if (type === "ticket") {
    formFields.innerHTML += `
      <div class="field is-wide" style="margin-top:8px">
        <label>Fotos del equipo</label>
        <p class="muted" style="font-size:12px;margin:4px 0 0">
          💡 Guarda el ticket primero y luego edítalo para agregar fotos del equipo.
        </p>
      </div>`;
  }
  if (type === "supply") {
    formFields.innerHTML += buildReceiptUploadSection();
    initProductAutoFill();
  }
  if (type === "cotizacion") {
    formFields.innerHTML += buildQuoteItemsSection();
    initQuoteItemsBuilder(prefill.quoteItems || []);
  }
  initDeviceAutocomplete();
  if (type === "ticket") initPriceAutofill();
  modal.showModal();
}

function syncTransactionCategories(type) {
  const cats = type === "Ingreso" ? TX_CATEGORIES_INCOME : TX_CATEGORIES_EXPENSE;
  const catSel = formFields.querySelector("#category");
  if (!catSel) return;
  const current = catSel.value;
  catSel.innerHTML = cats.map(c => `<option value="${c}" ${c===current?"selected":""}>${c}</option>`).join("");
}

function openTransactionForm(type) {
  openForm("transaction", { type, date: dateStamp() });
  setTimeout(() => {
    const sel = formFields.querySelector("#type");
    if (sel) { sel.value = type; syncTransactionCategories(type); }
    const typeSel = formFields.querySelector("#type");
    typeSel?.addEventListener("change", e => syncTransactionCategories(e.target.value));
  }, 0);
}

function openEditTransaction(txId) {
  const tx = branchTransactions().find(t => t.id === txId);
  if (!tx) return;
  activeForm      = "transaction";
  editingTicketId = txId;
  modalTitle.textContent = "Editar movimiento";
  document.querySelector("#modal-eyebrow").textContent = "Editar registro";
  formFields.innerHTML = formSchemas["transaction"].fields.map(([name,label,ftype,opts,wide,optional]) =>
    fieldTemplate(name, label, ftype, opts, wide, tx[name] ?? "", optional)
  ).join("");
  // Sync categories to match the current type and attach change listener
  setTimeout(() => {
    syncTransactionCategories(tx.type);
    formFields.querySelector("#type")?.addEventListener("change", e => syncTransactionCategories(e.target.value));
  }, 0);
  modal.showModal();
}

function openEditTicket(ticketId) {
  const ticket = state.tickets.find(t => t.id === ticketId);
  if (!ticket) return;

  // Cotizaciones use the quote form (line-items builder) instead of the ticket form
  if (ticket.status === "Cotizacion") {
    activeForm      = "cotizacion";
    editingTicketId = ticketId;
    modalTitle.textContent = `Editar ${ticket.tracking}`;
    document.querySelector("#modal-eyebrow").textContent = "Editar cotización";
    const schema = formSchemas["cotizacion"];
    formFields.innerHTML = schema.fields.map(([name,label,ftype,opts,wide,optional]) =>
      fieldTemplate(name, label, ftype, opts, wide, ticket[name] ?? "", optional)
    ).join("") + buildQuoteItemsSection();
    // Pre-set branch
    const branchSel = formFields.querySelector("#branch");
    if (branchSel) branchSel.value = ticket.branch || activeBranchId;
    // Pre-set existing discount code in builder hidden inputs
    const dcCode = formFields.querySelector("#qi-discount-code");
    const dcAmt  = formFields.querySelector("#qi-discount-amount");
    const dcInp  = formFields.querySelector("#qi-code-input");
    if (dcCode && ticket.discountCode) dcCode.value = ticket.discountCode;
    if (dcAmt  && ticket.discountAmount) dcAmt.value = ticket.discountAmount;
    if (dcInp  && ticket.discountCode)  dcInp.value  = ticket.discountCode;
    initQuoteItemsBuilder(ticket.quoteItems || []);
    initDeviceAutocomplete();
    modal.showModal();
    return;
  }

  activeForm      = "ticket";
  editingTicketId = ticketId;
  modalTitle.textContent = `Editar ${ticket.tracking}`;
  document.querySelector("#modal-eyebrow").textContent = "Editar registro";
  formFields.innerHTML = formSchemas["ticket"].fields.map(([name,label,ftype,opts,wide,optional]) =>
    fieldTemplate(name, label, ftype, opts, wide, ticket[name] ?? "", optional)
  ).join("") + buildPhotoUploadSection(ticketId) + `<div id="ticket-parts-section"></div><div id="ticket-events-section"></div>`;
  initDeviceAutocomplete();
  initPriceAutofill();
  modal.showModal();
  initPhotoUpload(ticketId);
  loadTicketParts(ticketId);
  loadTicketEvents(ticketId);
}

async function loadTicketParts(ticketId) {
  const el = document.querySelector("#ticket-parts-section");
  if (!el || !supabaseClient) return;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketId);
  if (!isUUID) return;

  const { data: items } = await supabaseClient
    .from("ticket_items").select("*").eq("ticket_id", ticketId).order("created_at");
  const products = branchProducts();

  const renderPartsList = (list) => list?.length ? list.map(it => `
    <div style="display:flex;align-items:center;gap:8px;font-size:12px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.06)">
      <span style="flex:1">${escapeHtml(it.description)}</span>
      <span class="muted">${it.quantity} × ${money.format(it.unit_price)}</span>
      <strong>${money.format(Number(it.quantity)*Number(it.unit_price))}</strong>
      <button class="mini-button danger-btn" style="padding:2px 8px;font-size:11px" data-remove-part="${it.id}">✕</button>
    </div>`).join("") : `<p class="muted" style="font-size:12px">Sin refacciones añadidas.</p>`;

  const total = (items||[]).reduce((s,it)=>s+Number(it.quantity)*Number(it.unit_price),0);
  const productOpts = products.map(p=>`<option value="${p.id}" data-price="${p.price}">${escapeHtml(p.name)} — ${money.format(p.price)}</option>`).join("");

  el.innerHTML = `
    <div class="field is-wide" style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,.08)">
      <label style="font-size:12px;text-transform:uppercase;letter-spacing:.06em">Refacciones / Partes usadas</label>
      <div id="parts-list" style="margin:10px 0 12px">${renderPartsList(items)}</div>
      ${total>0?`<div style="text-align:right;font-size:13px;margin-bottom:12px">Total partes: <strong>${money.format(total)}</strong></div>`:""}
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;border-top:1px dashed rgba(255,255,255,.1);padding-top:10px;margin-top:4px">
        <div class="field" style="flex:2;margin:0"><label style="font-size:11px;color:rgba(255,255,255,.5)">Agregar refacción / parte</label>
          <select id="part-product-sel" style="font-size:13px">${productOpts}</select>
        </div>
        <div class="field" style="width:80px;margin:0"><label style="font-size:11px;color:rgba(255,255,255,.5)">Cant.</label>
          <input id="part-qty" type="number" min="1" step="1" value="1" style="font-size:13px" />
        </div>
        <button class="mini-button" id="add-part-btn" type="button">+ Agregar</button>
      </div>
    </div>`;

  // Add part
  el.querySelector("#add-part-btn")?.addEventListener("click", async () => {
    const sel   = el.querySelector("#part-product-sel");
    const qty   = Number(el.querySelector("#part-qty").value || 1);
    const prod  = products.find(p => p.id === sel.value);
    if (!prod || qty <= 0) return;
    const { error } = await supabaseClient.from("ticket_items").insert({
      ticket_id: ticketId, product_id: prod.id,
      description: prod.name, quantity: qty, unit_price: prod.price,
    });
    if (error) { showErrorToast(`Error: ${error.message}`); return; }
    loadTicketParts(ticketId);
  });

  // Remove part (delegated)
  el.querySelector("#parts-list")?.addEventListener("click", async ev => {
    const btn = ev.target.closest("[data-remove-part]");
    if (!btn) return;
    await supabaseClient.from("ticket_items").delete().eq("id", btn.dataset.removePart);
    loadTicketParts(ticketId);
  });
}

async function loadTicketEvents(ticketId) {
  const el = document.querySelector("#ticket-events-section");
  if (!el || !supabaseClient) return;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketId);
  if (!isUUID) return;

  const { data } = await supabaseClient
    .from("ticket_events")
    .select("event_type, from_stage, to_stage, note, created_at, employees(full_name)")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (!data?.length) { el.innerHTML = ""; return; }

  el.innerHTML = `
    <div class="field is-wide" style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08)">
      <label style="font-size:12px;text-transform:uppercase;letter-spacing:.06em">Historial de cambios</label>
      <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">
        ${data.map(ev => {
          const who  = ev.employees?.full_name || "Sistema";
          const when = (ev.created_at||"").slice(0,16).replace("T"," ");
          const desc = ev.from_stage && ev.to_stage
            ? `<strong>${ev.from_stage}</strong> → <strong>${ev.to_stage}</strong>`
            : ev.note || ev.event_type;
          return `<div style="display:flex;gap:10px;align-items:flex-start;font-size:12px">
            <div style="width:8px;height:8px;border-radius:50%;background:var(--fz-primary,#2F6FFF);margin-top:4px;flex-shrink:0"></div>
            <div>
              <span>${desc}</span>
              <br><span class="muted">${who} · ${when}</span>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>`;
}

function buildPhotoUploadSection(ticketId) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketId);
  if (!isUUID) return `
    <div class="field is-wide" style="margin-top:8px">
      <label>Fotos del equipo</label>
      <p class="muted" style="font-size:12px;margin:4px 0 0">Disponible solo en tickets guardados en Supabase.</p>
    </div>`;
  return `
    <div class="field is-wide photo-upload-section" style="margin-top:8px">
      <label>Fotos del equipo</label>
      <div id="photo-preview-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px;margin:10px 0"></div>
      <label class="ghost-button" style="display:inline-flex;align-items:center;gap:6px;padding:0 14px;min-height:38px;cursor:pointer;font-size:13px">
        📷 Agregar foto
        <input type="file" id="photo-file-input" accept="image/*" multiple style="display:none" />
      </label>
      <span id="photo-upload-status" class="muted" style="font-size:12px;margin-left:8px"></span>
    </div>`;
}

async function initPhotoUpload(ticketId) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketId);
  if (!isUUID || !supabaseClient) return;

  // Load existing photos
  await loadTicketPhotos(ticketId);

  const input = document.querySelector("#photo-file-input");
  if (!input) return;
  input.addEventListener("change", async () => {
    const files = Array.from(input.files);
    if (!files.length) return;
    const status = document.querySelector("#photo-upload-status");
    status.textContent = "Subiendo...";
    for (const file of files) {
      try {
        const ext  = file.name.split(".").pop();
        const path = `tickets/${ticketId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabaseClient.storage
          .from("ticket-photos").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: urlData } = supabaseClient.storage
          .from("ticket-photos").getPublicUrl(path);
        await supabaseClient.from("attachments").insert({
          ticket_id:  ticketId,
          file_url:   urlData.publicUrl,
          file_type:  file.type,
          label:      file.name,
          created_by: currentEmployeeId(),
        });
      } catch(err) {
        status.textContent = `Error: ${err.message}`;
        return;
      }
    }
    status.textContent = `✓ ${files.length} foto(s) subida(s)`;
    input.value = "";
    await loadTicketPhotos(ticketId);
  });
}

async function loadTicketPhotos(ticketId) {
  const grid = document.querySelector("#photo-preview-grid");
  if (!grid) return;
  const { data, error } = await supabaseClient
    .from("attachments").select("*")
    .eq("ticket_id", ticketId).order("created_at");
  if (error || !data?.length) { grid.innerHTML = `<p class="muted" style="font-size:12px">Sin fotos aún.</p>`; return; }
  grid.innerHTML = data.map(a => `
    <div style="position:relative">
      <a href="${escapeHtml(a.file_url)}" target="_blank" rel="noopener">
        <img src="${escapeHtml(a.file_url)}" alt="${escapeHtml(a.label||"")}"
          style="width:100%;height:80px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,0.1)" />
      </a>
      <button data-delete-photo="${a.id}" data-photo-url="${escapeHtml(a.file_url)}"
        style="position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:50%;border:0;background:rgba(255,60,60,0.8);color:#fff;font-size:11px;cursor:pointer;line-height:1">✕</button>
    </div>`).join("");
}

// ── Device models autocomplete ────────────────────────────────────────────────
function loadDeviceModels() {
  try { return JSON.parse(localStorage.getItem(DEVICE_MODELS_KEY)) || [...DEFAULT_DEVICE_MODELS]; }
  catch { return [...DEFAULT_DEVICE_MODELS]; }
}

function saveDeviceModel(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const models = loadDeviceModels();
  if (models.some(m => m.toLowerCase() === trimmed.toLowerCase())) return;
  models.push(trimmed);
  models.sort((a, b) => a.localeCompare(b, "es"));
  localStorage.setItem(DEVICE_MODELS_KEY, JSON.stringify(models));
}

function getAllDeviceNames() {
  const seen = new Set();
  const result = [];
  const add = (n) => { const k = n.trim().toLowerCase(); if (k && !seen.has(k)) { seen.add(k); result.push(n.trim()); } };
  loadDeviceModels().forEach(add);
  (state.tickets || []).forEach(t => { if (t.productName) add(t.productName); });
  return result.sort((a, b) => a.localeCompare(b, "es"));
}

function initDeviceAutocomplete(container = formFields) {
  container.querySelectorAll("input[data-device-ac]").forEach(input => {
    const wrapper = input.closest(".device-ac-wrapper");
    if (!wrapper) return;
    let ddEl = null;
    let hiIdx = -1;

    const close = () => { ddEl?.remove(); ddEl = null; hiIdx = -1; };

    const getOpts = (q) => {
      const all = getAllDeviceNames();
      const qLow = (q || "").toLowerCase();
      return qLow ? all.filter(n => n.toLowerCase().includes(qLow)) : all;
    };

    const open = (q) => {
      close();
      const opts = getOpts(q).slice(0, 60);
      const showAdd = q.trim() && !opts.some(o => o.toLowerCase() === q.trim().toLowerCase());
      if (!opts.length && !showAdd) return;
      ddEl = document.createElement("div");
      ddEl.className = "device-ac-dropdown";
      ddEl.innerHTML =
        opts.map((o, i) => `<div class="device-ac-opt" data-idx="${i}" data-val="${escapeHtml(o)}">${escapeHtml(o)}</div>`).join("") +
        (showAdd ? `<div class="device-ac-opt device-ac-add" data-add="${escapeHtml(q.trim())}">+ Agregar "<strong>${escapeHtml(q.trim())}</strong>"</div>` : "");
      wrapper.appendChild(ddEl);
      ddEl.addEventListener("mousedown", e => {
        e.preventDefault();
        const opt = e.target.closest(".device-ac-opt");
        if (!opt) return;
        const val = opt.dataset.add ? opt.dataset.add : opt.dataset.val;
        if (opt.dataset.add) saveDeviceModel(val);
        input.value = val;
        close();
      });
    };

    const highlight = (dir) => {
      if (!ddEl) { open(input.value); return; }
      const items = ddEl.querySelectorAll(".device-ac-opt");
      hiIdx = Math.max(0, Math.min(hiIdx + dir, items.length - 1));
      items.forEach((el, i) => el.classList.toggle("is-hi", i === hiIdx));
      items[hiIdx]?.scrollIntoView({ block: "nearest" });
    };

    input.addEventListener("focus", () => open(input.value));
    input.addEventListener("input", () => { hiIdx = -1; open(input.value); });
    input.addEventListener("blur",  () => setTimeout(close, 160));
    input.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { e.preventDefault(); highlight(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); highlight(-1); }
      else if (e.key === "Enter" && ddEl) {
        const hi = ddEl.querySelector(".is-hi");
        if (hi) {
          e.preventDefault();
          const val = hi.dataset.add ? hi.dataset.add : hi.dataset.val;
          if (hi.dataset.add) saveDeviceModel(val);
          input.value = val;
          close();
        }
      } else if (e.key === "Escape") close();
    });
  });
}

function initPriceAutofill() {
  const deviceInput  = formFields.querySelector("input[data-device-ac]");
  const serviceSelect = formFields.querySelector("select[data-price-trigger]");
  const amountInput  = formFields.querySelector("#repairAmount");
  if (!deviceInput || !serviceSelect || !amountInput) return;

  const lookupPrice = () => {
    const device  = deviceInput.value.trim();
    const svcName = serviceSelect.value;
    if (!device || !svcName) return;
    const branchId = (state.branches||[]).find(b=>b.name===activeBranchId)?.id;
    const stype = (state.serviceTypes||[]).find(t=>t.name===svcName);
    if (!stype) return;
    const rec = (state.servicePrices||[]).find(p =>
      p.deviceModel.toLowerCase() === device.toLowerCase() &&
      p.serviceTypeId === stype.id &&
      (!p.branchId || p.branchId === branchId)
    );
    if (rec && rec.price > 0) {
      amountInput.value = rec.price;
      showToast(`💡 Precio sugerido: ${money.format(rec.price)} — puedes modificarlo`);
    }
  };

  serviceSelect.addEventListener("change", lookupPrice);
  // Also trigger when device field loses focus
  deviceInput.addEventListener("blur", () => setTimeout(lookupPrice, 200));
}

function fieldTemplate(name, label, ftype, opts, wide, defaultValue, optional=false) {
  const labelHtml = optional
    ? `${label} <span style="font-size:11px;font-weight:400;opacity:0.45;text-transform:none;letter-spacing:0">(opcional)</span>`
    : label;
  if (ftype==="select") {
    const options = (name==="branch_id") ? (state.branches||[]).map(b=>b.name) : (opts||[]);
    return `<div class="field ${wide?"is-wide":""}">
      <label for="${name}">${labelHtml}</label>
      <select id="${name}" name="${name}">
        ${options.map(o=>`<option value="${o}" ${o===defaultValue?"selected":""}>${name==="role"?(ROLE_LABELS[o]||o):o}</option>`).join("")}
      </select></div>`;
  }
  if (ftype==="product-select") {
    const products = branchProducts();
    return `<div class="field ${wide?"is-wide":""}">
      <label for="${name}">${labelHtml}</label>
      <select id="${name}" name="${name}">
        <option value="">— Ninguno —</option>
        ${products.map(p=>`<option value="${p.id}" ${p.id===defaultValue?"selected":""}>${escapeHtml((p.sku?`[${p.sku}] `:'')+p.name)}</option>`).join("")}
      </select></div>`;
  }
  if (ftype==="device-autocomplete") {
    const val = defaultValue ?? "";
    return `<div class="field ${wide?"is-wide":""} device-ac-wrapper">
      <label for="${name}">${labelHtml}</label>
      <input id="${name}" name="${name}" type="text" value="${escapeHtml(String(val))}"
        data-device-ac autocomplete="off" placeholder="Escribe para buscar…" ${optional?"":"required"} />
    </div>`;
  }
  if (ftype==="service-type-select") {
    const serviceTypes = state.serviceTypes || [];
    const val = defaultValue ?? "";
    return `<div class="field ${wide?"is-wide":""}">
      <label for="${name}">${labelHtml}</label>
      <select id="${name}" name="${name}" data-price-trigger>
        <option value="">— Sin especificar —</option>
        ${serviceTypes.map(t=>`<option value="${escapeHtml(t.name)}" ${t.name===val?"selected":""}>${escapeHtml(t.name)}</option>`).join("")}
      </select>
    </div>`;
  }
  const val = defaultValue ?? (ftype==="date" ? new Date().toISOString().slice(0,10) : "");
  return `<div class="field ${wide?"is-wide":""}">
    <label for="${name}">${labelHtml}</label>
    <input id="${name}" name="${name}" type="${ftype}" value="${escapeHtml(String(val))}" ${optional?"":"required"} />
  </div>`;
}

recordForm.addEventListener("submit", async e => {
  e.preventDefault();
  setLoading(true, "Guardando…");
  const schema = formSchemas[activeForm];
  const data   = Object.fromEntries(new FormData(recordForm).entries());
  for (const [name,,ftype] of schema.fields) if (ftype==="number") data[name]=Number(data[name]||0);

  // ── EDIT: generic (client, supply, transaction, cotizacion) ──────
  if (editingTicketId && activeForm !== "ticket") {
    try {
      if (activeForm === "client") {
        await updateRemoteClient(editingTicketId, data);
      } else if (activeForm === "product") {
        await updateRemoteProduct(editingTicketId, data);
      } else if (activeForm === "supply") {
        await updateRemoteSupply(editingTicketId, data);
      } else if (activeForm === "transaction") {
        await updateRemoteTransaction(editingTicketId, data);
      } else if (activeForm === "cotizacion") {
        data.quoteItems = JSON.parse(data.quoteItemsJson || "[]");
        delete data.quoteItemsJson;
        if (!data.issue && data.quoteItems.length) {
          data.issue = data.quoteItems.map(i => i.description).filter(Boolean).join(" + ");
        }
        data.repairAmount = Number(data.repairAmount || 0);
        await updateRemoteTicket(editingTicketId, data);
      }
      if (dataMode === "remote") await reloadState();
      else { /* local: already mutated in update functions */ saveState(); }
      render();
      modal.close();
    } catch(err) {
      console.error(err);
      showErrorToast(`No se pudo guardar: ${err.message}`);
    }
    return;
  }

  // --- Edit SUPPORT TASK -------------------------------------------------------
  if (activeForm === "supportTasks" && editingTaskId) {
    try {
      await updateRemoteSupportTask(editingTaskId, data);
      if (dataMode === "remote") await reloadState();
      render();
      modal.close();
    } catch(err) {
      console.error(err);
      showErrorToast(`No se pudo guardar: ${err.message}`);
    }
    return;
  }

  // --- Edit TASK ------------------------------------------------------------
  if (activeForm === "task" && editingTaskId) {
    data.estimatedTime = Number(data.estimatedTime||0);
    data.priority     = data.priority||"";
          render();
      modal.close();
    try {
      const isRealUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingTaskId);
      if (dataMode==="remote" && isRealUUID) {
        await updateRemoteTask(editingTaskId, data);
        await reloadState();
      } else {
        const idx = state.tasks.findIndex(t => t.id === editingTaskId);
        if (idx !== -1) state.tasks[idx] = { ...state.tasks[idx], ...data };
        if (dataMode !== "remote") saveState();
      }
    } catch(err) {
      console.error(err);
      showErrorToast(`No se pudo guardar: ${err.message}`);
    }
    return;
  }

  // ── EDIT TICKET ────────────────────────────────────────────────────────────
  if (activeForm === "ticket" && editingTicketId) {
    data.repairAmount = Number(data.repairAmount||0);
    data.paidAmount   = Number(data.paidAmount||0);
    if (data.paymentStatus==="Pagado" && data.paidAmount===0) data.paidAmount = data.repairAmount;
    try {
      const isRealUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingTicketId);
      if (dataMode==="remote" && isRealUUID) {
        await updateRemoteTicket(editingTicketId, data);
        // Patch local state immediately so device fields aren't blanked before reloadState resolves
        const idx = state.tickets.findIndex(t => t.id === editingTicketId);
        if (idx !== -1) state.tickets[idx] = { ...state.tickets[idx], ...data };
        await reloadState();
      } else {
        const idx = state.tickets.findIndex(t => t.id === editingTicketId);
        if (idx !== -1) state.tickets[idx] = { ...state.tickets[idx], ...data };
        if (dataMode !== "remote") saveState();
      }
      render();
      modal.close();
    } catch(err) {
      console.error(err);
      showErrorToast(`No se pudo guardar: ${err.message}`);
    }
    return;
  }

  // ── CREATE ─────────────────────────────────────────────────────────────────
  data.id = `${activeForm}-${Date.now()}`;

  if (activeForm==="ticket" || activeForm==="cotizacion") {
    data.tracking      = activeForm==="cotizacion" ? nextCotTracking() : nextTracking(nextTicketSequence());
    data.repairAmount  = Number(data.repairAmount||0);
    if (activeForm==="cotizacion") {
      data.quoteItems = JSON.parse(data.quoteItemsJson || "[]");
      delete data.quoteItemsJson;
      // Derive issue from line-item descriptions if not filled manually
      if (!data.issue && data.quoteItems.length) {
        data.issue = data.quoteItems.map(i => i.description).filter(Boolean).join(" + ");
      }
      data.status        = "Cotizacion";
      data.paymentStatus = "Pendiente";
      data.paidAmount    = 0;
      data.priority      = "Normal";
      data.assignedTo    = data.assignedTo || "";
    } else {
      data.paidAmount    = Number(data.paidAmount||0);
      if (data.paymentStatus==="Pagado"&&data.paidAmount===0) data.paidAmount=data.repairAmount;
    }
  }

  try {
    if (dataMode==="remote") {
      if (activeForm==="employee") {
        await callEdgeFunction("create", {
          full_name:         data.full_name,
          username:          data.username,
          role:              data.role,
          branch_id:         lookups.branchesByName.get(data.branch_id)?.id||null,
          default_branch_id: lookups.branchesByName.get(data.branch_id)?.id||null,
          phone:             data.phone||null,
        });
      } else if (activeForm==="supportTasks") {
        await saveRemoteSupportTask(data);
      } else if (activeForm==="cotizacion") {
        await saveRemoteRecord("ticket", data);
      } else {
        await saveRemoteRecord(activeForm, data);
      }
      // Reload state after save; if reload fails, the save itself succeeded so
      // don't surface the reload error — local state was already updated by the
      // save function (e.g. createRemoteTicket adds the ticket immediately).
      try { await reloadState(); } catch(reloadErr) { console.warn("reloadState error:", reloadErr); }
    } else {
      state[schema.collection].unshift(data);
      if (activeForm==="supply") {
        state.transactions.unshift({ id:`tx-${Date.now()}`, date:data.date, type:"Egreso", concept:`Compra: ${data.item}`, category:"Insumos", amount:Number(data.total||0) });
      }
      saveState();
    }
    render();
    modal.close();
  } catch(err) {
    console.error(err);
    showErrorToast(`No se pudo guardar: ${err.message}`);
  } finally {
    setLoading(false);
  }
});

// ── Edge function caller ──────────────────────────────────────────────────────
async function callEdgeFunction(action, payload) {
  const { data, error } = await supabaseClient.functions.invoke("create-employee", {
    body: { action, payload },
  });
  if (error) throw new Error(error.message || "Error de red al llamar función");
  if (!data?.success) throw new Error(data?.error || "Error en la función");
  return data;
}

function deleteEmployee(employeeId) {
  showConfirmModal("¿Dar de baja a este usuario? Se desactivará su acceso.", {
    label: "Dar de baja",
    danger: true,
    onConfirm: async () => {
      try {
        if (dataMode==="remote") {
          await callEdgeFunction("delete", { employee_id: employeeId });
          await reloadState();
        } else {
          state.employees = state.employees.filter(e=>e.id!==employeeId);
          saveState();
        }
        render();
      } catch(err) { showErrorToast(`Error: ${err.message}`); }
    }
  });
}

function resetEmployeePassword(employeeId) {
  showConfirmModal("¿Resetear contraseña a 'miwaysillos05'? El usuario deberá cambiarla al iniciar sesión.", {
    label: "Resetear contraseña",
    danger: true,
    onConfirm: async () => {
      try {
        if (dataMode==="remote") {
          await callEdgeFunction("reset_password", { employee_id: employeeId });
          showToast("✓ Contraseña reseteada correctamente.");
        } else {
          showErrorToast("Reset de contraseña solo disponible en modo Supabase.");
        }
      } catch(err) { showErrorToast(`Error: ${err.message}`); }
    }
  });
}

async function saveRemoteSupportTask(data) {
  const assignedEmp = lookups.employeesByName.get(data.assignedTo);
  const { error } = await supabaseClient.from("support_tasks").insert({
    title: data.title, description: data.description||null,
    priority: data.priority, status: data.status,
    assigned_to: assignedEmp?.id||null,
    created_by: currentEmployee?.id||null,
  });
  if (error) throw error;
}

// ── Remote saves ──────────────────────────────────────────────────────────────
function currentEmployeeId() { return currentEmployee?.id||null; }
async function branchIdByName(name) {
  if (!name) name = activeBranchId;
  // Try in-memory lookup first (populated after reloadState)
  const fromMap = lookups.branchesByName.get(name)?.id || null;
  if (fromMap) return fromMap;
  // Fallback: hit the DB directly (covers first-save before lookups are warm)
  const { data } = await supabaseClient.from("branches").select("id").eq("name", name).maybeSingle();
  if (data?.id) {
    // Warm the cache so subsequent calls in the same session don't hit the DB again
    lookups.branchesByName.set(name, { id: data.id, name });
    return data.id;
  }
  // Last resort: return the first branch we can find
  const { data: first } = await supabaseClient.from("branches").select("id").limit(1).maybeSingle();
  return first?.id || null;
}

async function saveRemoteRecord(type, record) {
  if (type==="client")      return createRemoteClient(record);
  if (type==="product")     return createRemoteProduct(record);
  if (type==="ticket")      return createRemoteTicket(record);
  if (type==="supply")      return createRemoteSupply(record);
  if (type==="transaction") return createRemoteTransaction(record);
  throw new Error("Tipo no soportado.");
}

async function createRemoteClient(r) {
  const { data:c, error } = await supabaseClient.from("customers").insert({
    full_name:r.name, phone:r.phone, email:r.email,
    branch_id:await branchIdByName(activeBranchId), created_by:currentEmployeeId()
  }).select().single();
  if (error) throw error;
  if (r.device) { const { error:de } = await supabaseClient.from("customer_devices").insert({ customer_id:c.id, product_name:r.device }); if(de) throw de; }
}

async function createRemoteProduct(r) {
  const { error } = await supabaseClient.from("products").insert({ name:r.name, sku:r.sku||null, category:r.category, product_type:r.productType||"refaccion", stock:r.stock, min_stock:r.minStock, sale_price:r.price, branch_id:await branchIdByName(r.branch) });
  if (error) throw error;
}

async function createRemoteTicket(r) {
  const customer  = lookups.customersByName.get(r.client);
  const assignedE = lookups.employeesByName.get(r.assignedTo);
  const branchId  = await branchIdByName(r.branch||activeBranchId);
  // Auto-apply discount code if provided
  const disc = r.discountCode ? applyDiscount(Number(r.repairAmount||0), r.discountCode) : { amount: Number(r.discountAmount||0), pct: 0 };
  const { data, error } = await supabaseClient.from("service_tickets").insert({
    customer_id:customer?.id||null, customer_name:r.client,
    product_name:r.productName, issue_description:r.issue,
    stage:r.status, priority:r.priority,
    repair_amount:r.repairAmount, payment_status:r.paymentStatus, paid_amount:r.paidAmount,
    discount_code:r.discountCode||null, discount_amount:disc.amount, discount_pct:disc.pct,
    branch_id:branchId, notes:r.notes||null,
    assigned_employee_id:assignedE?.id||null, created_by:currentEmployeeId(),
    quote_items: r.quoteItems?.length ? r.quoteItems : null,
    service_type: r.serviceType||null,
  }).select().single();
  if (error) throw error;

  // Create device record if any device fields were filled (customer_id is nullable)
  let deviceId = null;
  if (r.imei||r.color||r.accessories||r.physicalCondition) {
    const { data: dev } = await supabaseClient.from("customer_devices").insert({
      customer_id:          customer?.id||null,
      product_name:         r.productName||"Sin nombre",
      imei:                 r.imei||null,
      color:                r.color||null,
      accessories_received: r.accessories||null,
      physical_condition:   r.physicalCondition||null,
    }).select("id").single();
    if (dev?.id) {
      deviceId = dev.id;
      await supabaseClient.from("service_tickets").update({ device_id: dev.id }).eq("id", data.id);
    }
  }

  const branchName = [...lookups.branchesByName.values()].find(b=>b.id===branchId)?.name || BRANCHES[0];
  const mapped = {
    id:data.id, tracking:data.tracking_number, client:data.customer_name,
    productName:data.product_name, issue:data.issue_description,
    status:data.stage, priority:data.priority,
    repairAmount:Number(data.repair_amount||0), paymentStatus:data.payment_status,
    paidAmount:Number(data.paid_amount||0), branch:branchName,
    assignedTo:assignedE?.full_name||r.assignedTo||"",
    createdAt:(data.created_at||"").slice(0,10),
    notes:r.notes||"", deviceId,
    discountCode:r.discountCode||"", discountAmount:disc.amount, discountPct:disc.pct,
    imei:r.imei||"", color:r.color||"",
    accessories:r.accessories||"", physicalCondition:r.physicalCondition||"",
    quoteItems: r.quoteItems||[],
  };
  state.tickets = [mapped, ...state.tickets.filter(t=>t.id!==data.id)];

  // Auto-create income transaction if an upfront payment was recorded at creation
  if (Number(r.paidAmount || 0) > 0) {
    await createRemoteTransaction({
      date:     dateStamp(),
      type:     "Ingreso",
      concept:  `Anticipo ${data.tracking_number}`,
      category: "Servicio",
      amount:   Number(r.paidAmount),
    });
  }
}

async function updateRemoteTicket(ticketId, r) {
  const oldTicket = state.tickets.find(t => t.id === ticketId);
  const assignedE = lookups.employeesByName.get(r.assignedTo);
  const { error } = await supabaseClient.from("service_tickets").update({
    customer_name:        r.client,
    product_name:         r.productName,
    issue_description:    r.issue,
    stage:                r.status,
    priority:             r.priority,
    repair_amount:        Number(r.repairAmount||0),
    payment_status:       r.paymentStatus,
    paid_amount:          Number(r.paidAmount||0),
    branch_id:            await branchIdByName(r.branch||activeBranchId),
    assigned_employee_id: assignedE?.id||null,
    notes:                r.notes||null,
    discount_code:        r.discountCode||null,
    discount_amount:      Number(r.discountAmount||0),
    discount_pct:         Number(r.discountPct||0),
    service_type:         r.serviceType||null,
    ...(r.quoteItems !== undefined ? { quote_items: r.quoteItems.length ? r.quoteItems : null } : {}),
  }).eq("id", ticketId);
  if (error) throw error;

  // Auto-create income transaction when paidAmount increases via edit form
  const oldPaid = Number(oldTicket?.paidAmount || 0);
  const newPaid = Number(r.paidAmount || 0);
  if (newPaid > oldPaid) {
    await createRemoteTransaction({
      date:     dateStamp(),
      type:     "Ingreso",
      concept:  `Pago ${oldTicket?.tracking || ticketId}`,
      category: "Servicio",
      amount:   newPaid - oldPaid,
    });
  }

  // Log stage change event
  const stageChanged = oldTicket?.status && r.status && oldTicket.status !== r.status;
  if (stageChanged) {
    await supabaseClient.from("ticket_events").insert({
      ticket_id:  ticketId,
      event_type: "stage_change",
      from_stage: oldTicket.status,
      to_stage:   r.status,
      created_by: currentEmployeeId(),
    });
  }

  // Auto-deduct inventory when ticket is delivered (stage → Entregado)
  if (stageChanged && r.status === "Entregado" && oldTicket.status !== "Entregado") {
    const { data: items } = await supabaseClient
      .from("ticket_items").select("product_id, quantity").eq("ticket_id", ticketId);
    if (items?.length) {
      for (const item of items) {
        if (!item.product_id) continue;
        const prod = state.products.find(p => p.id === item.product_id);
        if (!prod) continue;
        const newStock = Math.max(0, Number(prod.stock) - Number(item.quantity));
        await supabaseClient.from("products").update({ stock: newStock }).eq("id", item.product_id);
        // Update local state immediately
        const pidx = state.products.findIndex(p => p.id === item.product_id);
        if (pidx !== -1) state.products[pidx] = { ...state.products[pidx], stock: newStock };
      }
    }
  }

  // Update device record if exists, or create one if new device fields provided
  if (oldTicket?.deviceId) {
    await supabaseClient.from("customer_devices").update({
      imei:                 r.imei||null,
      color:                r.color||null,
      accessories_received: r.accessories||null,
      physical_condition:   r.physicalCondition||null,
    }).eq("id", oldTicket.deviceId);
  } else if (r.imei || r.color || r.accessories || r.physicalCondition) {
    const customer = lookups.customersByName.get(r.client);
    const { data: dev } = await supabaseClient.from("customer_devices").insert({
      customer_id:          customer?.id||null,
      product_name:         r.productName||"Sin nombre",
      imei:                 r.imei||null,
      color:                r.color||null,
      accessories_received: r.accessories||null,
      physical_condition:   r.physicalCondition||null,
    }).select("id").single();
    if (dev?.id) {
      await supabaseClient.from("service_tickets").update({ device_id: dev.id }).eq("id", ticketId);
    }
  }
}

async function updateRemoteTask(taskId, r) {
  const { error } = await supabaseClient.from("service_tasks").update({
    issue_description:    r.issue,
    stage:                r.status,
    priority:             r.priority,
  }).eq("id", taskId);
  if (error) throw error;
}

async function uploadReceiptFile(file) {
  const ext  = file.name.split(".").pop();
  const path = `receipts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const status = document.querySelector("#receipt-upload-status");
  if (status) status.textContent = "Subiendo…";
  const { error } = await supabaseClient.storage.from("ticket-photos").upload(path, file, { upsert:false });
  if (error) throw error;
  const { data } = supabaseClient.storage.from("ticket-photos").getPublicUrl(path);
  if (status) status.textContent = "✓ Comprobante listo";
  return data.publicUrl;
}

function buildReceiptUploadSection(existingUrl=null) {
  const hasExisting = !!existingUrl;
  return `
    <div class="field is-wide receipt-upload-section" style="margin-top:8px">
      <label>Comprobante / recibo (PDF o imagen)</label>
      ${hasExisting ? `<div style="margin:6px 0"><a href="${escapeHtml(existingUrl)}" target="_blank" class="mini-button">📄 Ver comprobante actual</a></div>` : ''}
      <label class="ghost-button" style="display:inline-flex;align-items:center;gap:6px;padding:0 14px;min-height:38px;cursor:pointer;font-size:13px">
        📎 ${hasExisting ? 'Reemplazar comprobante' : 'Adjuntar comprobante'}
        <input type="file" id="receipt-file-input" accept=".pdf,image/*" style="display:none" />
      </label>
      <span id="receipt-upload-status" class="muted" style="font-size:12px;margin-left:8px"></span>
    </div>`;
}

function initProductAutoFill() {
  const sel = formFields.querySelector("#product_id");
  const itemInput = formFields.querySelector("#item");
  if (!sel || !itemInput) return;
  sel.addEventListener("change", () => {
    if (!sel.value) return;
    const prod = state.products.find(p => p.id === sel.value);
    if (prod && !itemInput.value) itemInput.value = prod.name;
  });
}

async function createRemoteSupply(r) {
  const productId = r.product_id || null;
  let itemName = r.item;
  if (productId && !itemName) {
    const prod = state.products.find(p => p.id === productId);
    if (prod) itemName = prod.name;
  }
  if (!itemName) throw new Error("Ingresa el nombre del artículo o selecciona un producto del catálogo");

  let receiptUrl = null;
  const fileInput = document.querySelector("#receipt-file-input");
  if (fileInput?.files?.length) receiptUrl = await uploadReceiptFile(fileInput.files[0]);

  const suppId = await findOrCreateSupplier(r.supplier);
  const { error } = await supabaseClient.from("supply_purchases").insert({
    supplier_id:  suppId,
    branch_id:    await branchIdByName(activeBranchId),
    purchase_date:r.date,
    item_name:    itemName,
    quantity:     r.quantity,
    total_amount: r.total,
    product_id:   productId,
    receipt_url:  receiptUrl,
    created_by:   currentEmployeeId(),
  });
  if (error) throw error;
  await createRemoteTransaction({ date:r.date, type:"Egreso", concept:`Compra: ${itemName}`, category:"Insumos", amount:r.total });
}

async function findOrCreateSupplier(name) {
  const n = name||"Sin proveedor";
  const { data:ex } = await supabaseClient.from("suppliers").select("id").eq("name",n).maybeSingle();
  if (ex?.id) return ex.id;
  const { data:s, error } = await supabaseClient.from("suppliers").insert({ name:n }).select("id").single();
  if (error) throw error;
  return s.id;
}

async function createRemoteTransaction(r) {
  const branchId = await branchIdByName(activeBranchId);
  const { data, error } = await supabaseClient.from("transactions").insert({
    branch_id:branchId,
    transaction_date:r.date, type:r.type, concept:r.concept,
    category:r.category, amount:r.amount, created_by:currentEmployeeId()
  }).select().single();
  if (error) throw error;
  // Add the DB-created transaction to state immediately so it appears in the dashboard.
  const branchName = [...lookups.branchesByName.values()].find(b=>b.id===branchId)?.name || BRANCHES[0];
  const mapped = {
    id:data.id, date:data.transaction_date, type:data.type, concept:data.concept,
    category:data.category, amount:Number(data.amount||0), branch:branchName,
  };
  state.transactions = [mapped, ...state.transactions.filter(t=>t.id!==data.id)];
}

// ──────────────────────────────────────────────────────────────────────────────
// HELP / IT SUPPORT MODAL
// ──────────────────────────────────────────────────────────────────────────────
const helpModal   = document.querySelector("#help-modal");
const helpForm    = document.querySelector("#help-form");
 
document.querySelector("#help-button").addEventListener("click", () => {
  helpForm.reset();
  helpModal.showModal();
});
 
document.querySelector("#close-help-modal").addEventListener("click", () => helpModal.close());
document.querySelector("#cancel-help").addEventListener("click",       () => helpModal.close());
 
helpForm.addEventListener("submit", async e => {
  e.preventDefault();
  const type     = document.querySelector("#help-type").value;
  const title    = document.querySelector("#help-title").value.trim();
  const desc     = document.querySelector("#help-desc").value.trim();
  const priority = document.querySelector("input[name='help-priority']:checked").value;
  const sender   = currentEmployee?.full_name || "Usuario desconocido";
  const btn      = document.querySelector("#send-help");
 
  btn.textContent = "Enviando...";
  btn.disabled    = true;
 
  const fullTitle = `[${type}] ${title}`;
  const fullDesc  = `De: ${sender}\n\n${desc}`;
 
  try {
    if (dataMode === "remote") {
      const { error } = await supabaseClient.from("support_tasks").insert({
        title:       fullTitle,
        description: fullDesc,
        priority:    priority,
        status:      "Pendiente",
        created_by:  currentEmployee?.id || null,
      });
      if (error) throw error;
      // Recargar estado para que aparezca en el kanban de IT
      await reloadState();
      renderSupport();
    } else {
      // Modo local — agregar al estado local
      state.supportTasks.unshift({
        id:          `st-${Date.now()}`,
        title:       fullTitle,
        description: fullDesc,
        priority:    priority,
        status:      "Pendiente",
        assignedTo:  "IT",
        createdAt:   dateStamp(),
      });
      saveState();
      renderSupport();
    }
 
    helpModal.close();
    showToast(`✓ Solicitud enviada a IT, 5 peso y le agilizamos su proceso · ${type}`);
  } catch(err) {
    showErrorToast(`No se pudo enviar: ${err.message}`);
  } finally {
    btn.textContent = "Enviar a IT";
    btn.disabled    = false;
  }
});
 
function showToast(message, html = "") {
  const existing = document.querySelector(".help-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "help-toast";
  if (html) toast.innerHTML = `${message} ${html}`;
  else toast.textContent = message;
  document.body.appendChild(toast);
  if (!html) setTimeout(() => toast.remove(), 3500);
  else {
    // Toasts with links stay until closed
    toast.style.cursor = "default";
    const close = document.createElement("span");
    close.textContent = " ✕";
    close.style.cssText = "cursor:pointer;margin-left:10px;opacity:.7";
    close.onclick = () => toast.remove();
    toast.appendChild(close);
    setTimeout(() => toast.remove(), 12000);
  }
}

function showErrorToast(msg) {
  const existing = document.querySelector(".help-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "help-toast error-toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4500);
}

const _confirmModal = document.querySelector("#confirm-modal");
function showConfirmModal(message, { label = "Confirmar", danger = false, onConfirm } = {}) {
  _confirmModal.querySelector("#confirm-modal-message").textContent = message;
  const oldOk = _confirmModal.querySelector("#confirm-modal-ok");
  const newOk = oldOk.cloneNode(true);
  newOk.textContent = label;
  newOk.className = danger ? "primary-action danger-btn" : "primary-action";
  newOk.addEventListener("click", () => { _confirmModal.close(); onConfirm?.(); });
  oldOk.replaceWith(newOk);
  _confirmModal.showModal();
}

function waLink(phone, message) {
  const clean = (phone || "").replace(/\D/g, "");
  if (!clean || clean.length < 8) return "";
  const num = clean.startsWith("52") ? clean : `52${clean}`;
  const url = `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  return `<a href="${url}" target="_blank" rel="noopener"
    style="color:#25d366;font-weight:700;text-decoration:none;background:rgba(37,211,102,.15);padding:3px 10px;border-radius:4px">
    📲 WhatsApp
  </a>`;
}

function showWhatsAppToast(ticket, msgText) {
  const client = state.clients.find(c => c.name?.toLowerCase() === ticket.client?.toLowerCase());
  const phone  = ticket.phone || client?.phone || "";
  if (!phone) return; // no phone — no toast
  const link = waLink(phone, msgText);
  showToast(`✓ Avisa al cliente:`, link);
}

// ──────────────────────────────────────────────────────────────────────────────
// ABONOS
// ──────────────────────────────────────────────────────────────────────────────
// ── Inventory movements ───────────────────────────────────────────────────────
const movModal = document.querySelector("#movimiento-modal");

document.querySelector("#btn-movimiento")?.addEventListener("click", () => {
  const sel = document.querySelector("#mov-product");
  if (sel) {
    sel.innerHTML = branchProducts().map(p =>
      `<option value="${p.id}" data-stock="${p.stock}" data-type="${p.productType||"refaccion"}">${escapeHtml(p.name)} (stock: ${p.stock})</option>`
    ).join("");
  }
  updateMovPreview();
  movModal?.showModal();
});

function updateMovPreview() {
  const sel    = document.querySelector("#mov-product");
  const type   = document.querySelector("#mov-type")?.value;
  const qty    = Number(document.querySelector("#mov-qty")?.value || 0);
  const prev   = document.querySelector("#mov-stock-preview");
  if (!sel || !prev) return;
  const opt    = sel.options[sel.selectedIndex];
  const current = Number(opt?.dataset.stock || 0);
  const delta   = (type === "entrada") ? qty : -qty;
  const newStock = Math.max(0, current + delta);
  prev.innerHTML = `Stock actual: <strong>${current}</strong> → Nuevo stock: <strong style="color:${newStock<current?"#ff9f43":"#2ecc71"}">${newStock}</strong>`;
}

document.querySelector("#mov-product")?.addEventListener("change", updateMovPreview);
document.querySelector("#mov-type")?.addEventListener("change", updateMovPreview);
document.querySelector("#mov-qty")?.addEventListener("input", updateMovPreview);
document.querySelector("#close-movimiento-modal")?.addEventListener("click", () => movModal?.close());
document.querySelector("#cancel-movimiento")?.addEventListener("click",       () => movModal?.close());

document.querySelector("#movimiento-form")?.addEventListener("submit", async e => {
  e.preventDefault();
  const sel      = document.querySelector("#mov-product");
  const movType  = document.querySelector("#mov-type").value;
  const qty      = Number(document.querySelector("#mov-qty").value || 0);
  const note     = document.querySelector("#mov-note").value.trim();
  const prodId   = sel.value;
  const prod     = state.products.find(p => p.id === prodId);
  if (!prod || qty <= 0) return;

  const delta    = movType === "entrada" ? qty : -qty;
  const newStock = Math.max(0, Number(prod.stock) + delta);
  const isUUID   = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prodId);

  try {
    if (dataMode === "remote" && isUUID) {
      const branchId = await branchIdByName(activeBranchId);
      await supabaseClient.from("inventory_movements").insert({
        product_id:    prodId,
        branch_id:     branchId,
        movement_type: movType,
        quantity:      movType === "entrada" ? qty : -qty,
        note:          note || null,
        created_by:    currentEmployeeId(),
      });
      await supabaseClient.from("products").update({ stock: newStock }).eq("id", prodId);
    }
    const pidx = state.products.findIndex(p => p.id === prodId);
    if (pidx !== -1) state.products[pidx] = { ...state.products[pidx], stock: newStock };
    movModal?.close();
    render();
    showToast(`✓ ${movType.charAt(0).toUpperCase()+movType.slice(1)} de ${qty} unidades registrada — nuevo stock: ${newStock}`);
  } catch(err) {
    showErrorToast(`Error: ${err.message}`);
  }
});

let abonoTicketId = null;
const abonoModal  = document.querySelector("#abono-modal");

function openAbonoModal(ticketId) {
  const ticket = state.tickets.find(t => t.id === ticketId);
  if (!ticket || !abonoModal) return;
  abonoTicketId = ticketId;
  const total   = Number(ticket.repairAmount || 0);
  const paid    = Number(ticket.paidAmount   || 0);
  const pending = Math.max(0, total - paid);
  document.querySelector("#abono-modal-title").textContent   = `Abono — ${ticket.tracking}`;
  document.querySelector("#abono-modal-eyebrow").textContent = ticket.client;
  document.querySelector("#abono-summary").innerHTML = `
    <div class="ticket-detail-grid">
      <span>Total reparación</span><strong>${money.format(total)}</strong>
      <span>Ya pagado</span><strong class="paid-amount">${money.format(paid)}</strong>
      <span>Saldo pendiente</span><strong style="color:#ff9f43">${money.format(pending)}</strong>
    </div>`;
  const amountInput = document.querySelector("#abono-amount");
  amountInput.max   = pending;
  amountInput.value = "";
  abonoModal.showModal();
}

document.querySelector("#close-abono-modal")?.addEventListener("click", () => abonoModal?.close());
document.querySelector("#cancel-abono")?.addEventListener("click",       () => abonoModal?.close());

document.querySelector("#abono-form")?.addEventListener("submit", async e => {
  e.preventDefault();
  const ticket = state.tickets.find(t => t.id === abonoTicketId);
  if (!ticket) return;
  const amount    = Number(document.querySelector("#abono-amount").value || 0);
  const method    = document.querySelector("#abono-method").value;
  if (amount <= 0) return;

  const total     = Number(ticket.repairAmount || 0);
  const newPaid   = Number(ticket.paidAmount || 0) + amount;
  const newStatus = newPaid >= total ? "Pagado" : "Abonado";
  const isUUID    = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(abonoTicketId);

  try {
    if (dataMode === "remote" && isUUID) {
      const { error } = await supabaseClient.from("service_tickets").update({
        paid_amount:    newPaid,
        payment_status: newStatus,
      }).eq("id", abonoTicketId);
      if (error) throw error;

      await createRemoteTransaction({
        date:     dateStamp(),
        type:     "Ingreso",
        concept:  `Abono ${ticket.tracking} (${method})`,
        category: "Servicio",
        amount,
      });

      try { await reloadState(); } catch(re) { console.warn("reload:", re); }
    }
    // Update local state regardless so UI reflects immediately
    const idx = state.tickets.findIndex(t => t.id === abonoTicketId);
    if (idx !== -1) {
      state.tickets[idx] = { ...state.tickets[idx], paidAmount: newPaid, paymentStatus: newStatus };
    }
    abonoModal.close();
    render();
    const updatedTicket = state.tickets.find(t => t.id === abonoTicketId);
    showToast(`✓ Abono de ${money.format(amount)} registrado`);
    if (updatedTicket) {
      const vars = { ...updatedTicket, amount: money.format(amount), pending: money.format(Math.max(0,(updatedTicket.repairAmount||0)-newPaid)) };
      const waMsg = fillWATemplate(newStatus === "Pagado" ? "pagado" : "abono", vars);
      showWhatsAppToast(updatedTicket, waMsg);
    }
  } catch(err) {
    showErrorToast(`No se pudo registrar el abono: ${err.message}`);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// EVENT LISTENERS
// ──────────────────────────────────────────────────────────────────────────────
document.querySelectorAll("[data-open-form]").forEach(btn => {
  btn.addEventListener("click", () => openForm(btn.dataset.openForm));
});

document.querySelector("#quick-ticket").addEventListener("click", () => openForm("ticket"));
document.querySelector("#quick-pos").addEventListener("click", () => setView("pos"));
document.querySelector("#new-quote-btn")?.addEventListener("click", () => {
  openForm("cotizacion");
});
document.querySelector("#close-modal").addEventListener("click",  () => modal.close());
document.querySelector("#cancel-record").addEventListener("click",() => modal.close());

async function performLogout() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  currentEmployee = null;
  currentSession  = null;
  dataMode        = "local";
  state           = loadState();
  document.querySelector("#logout-button").classList.add("is-hidden");
  document.querySelector(".app-shell").style.display = "none";
  showLoginScreen();
}
document.querySelector("#logout-button").addEventListener("click", performLogout);

// ── User profile dropdown ─────────────────────────────────────────────────────
const profileTrigger = document.querySelector("#user-profile-trigger");
const profileMenu    = document.querySelector("#user-profile-menu");

if (profileTrigger && profileMenu) {
  profileTrigger.addEventListener("click", e => {
    e.stopPropagation();
    profileMenu.style.display = profileMenu.style.display === "none" ? "block" : "none";
  });
  document.addEventListener("click", () => { profileMenu.style.display = "none"; });
  document.querySelector("#change-pw-trigger")?.addEventListener("click", () => {
    profileMenu.style.display = "none";
    showChangePasswordScreen();
  });
  document.querySelector("#logout-from-menu")?.addEventListener("click", performLogout);
}

document.querySelectorAll("[data-view], [data-view-target]").forEach(btn => {
  btn.addEventListener("click", () => setView(btn.dataset.view||btn.dataset.viewTarget));
});

document.querySelector("#reports-date-filter")?.addEventListener("click", e => {
  const btn = e.target.closest(".rpt-filter");
  if (!btn) return;
  reportsPeriod = btn.dataset.rpt;
  document.querySelectorAll(".rpt-filter").forEach(b => b.classList.toggle("is-active", b===btn));
  renderReports();
});

// Finance period filter — rendered dynamically so use delegated event on #finance-view parent
document.querySelector("#finance-view")?.addEventListener("click", e => {
  const btn = e.target.closest(".fin-filter");
  if (!btn) return;
  financePeriod = btn.dataset.fin;
  renderFinance();
});

document.querySelector("#export-data").addEventListener("click",  () => exportWorkbook());
document.querySelectorAll("[data-export-sheet]").forEach(btn => {
  btn.addEventListener("click", () => exportWorkbook(btn.dataset.exportSheet));
});

// ── POS delegated events ──────────────────────────────────────────────────────
document.addEventListener("click", e => {
  // Catalog filter
  const posFilter = e.target.closest("[data-pos-filter]");
  if (posFilter) { posCatalogFilter = posFilter.dataset.posFilter; renderPos(); return; }


  // Add product to cart
  const posAdd = e.target.closest("[data-pos-add]");
  if (posAdd && !posAdd.classList.contains("out-of-stock")) {
    const prod = state.products.find(p => p.id === posAdd.dataset.posAdd);
    if (!prod) return;
    const existing = posCart.find(i => i.productId === prod.id);
    const currentQty = existing ? existing.qty : 0;
    if (currentQty >= Number(prod.stock)) {
      showToast(`Sin stock suficiente para ${prod.name}`); return;
    }
    if (existing) { existing.qty++; }
    else { posCart.push({ productId:prod.id, name:prod.name, qty:1, unitPrice:Number(prod.price), maxStock:Number(prod.stock) }); }
    lastPosSale = null;
    renderPos();
    return;
  }

  // Cart qty decrement
  const qtyDec = e.target.closest("[data-pos-qty-dec]");
  if (qtyDec) {
    const idx = Number(qtyDec.dataset.posQtyDec);
    if (posCart[idx]) {
      posCart[idx].qty--;
      if (posCart[idx].qty <= 0) posCart.splice(idx, 1);
    }
    renderPos(); return;
  }

  // Cart qty increment
  const qtyInc = e.target.closest("[data-pos-qty-inc]");
  if (qtyInc) {
    const idx = Number(qtyInc.dataset.posQtyInc);
    if (posCart[idx]) {
      const prod = state.products.find(p => p.id === posCart[idx].productId);
      if (prod && posCart[idx].qty >= Number(prod.stock)) {
        showToast("No hay suficiente stock"); return;
      }
      posCart[idx].qty++;
    }
    renderPos(); return;
  }

  // Remove from cart
  const posRemove = e.target.closest("[data-pos-remove]");
  if (posRemove) {
    posCart.splice(Number(posRemove.dataset.posRemove), 1);
    renderPos(); return;
  }

  // Apply discount code in POS
  if (e.target.closest("#pos-apply-code")) {
    const code = (document.querySelector("#pos-code-input")?.value||"").trim().toUpperCase();
    if (!code) { showErrorToast("Ingresa un código de descuento."); return; }
    const subtotal = posCart.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const result = applyDiscount(subtotal, code, "pos");
    if (!result.valid) { showErrorToast("Código no válido, expirado o no aplica en POS."); return; }
    posDiscount = result.amount;
    posDiscountCode = code;
    showToast(`✓ Descuento aplicado: -${money.format(result.amount)}`);
    renderPos(); return;
  }

  // Checkout
  if (e.target.closest("#pos-checkout-btn")) { checkoutPos(); return; }

  // Clear cart
  if (e.target.closest("#pos-clear-cart")) {
    posCart = []; posDiscount = 0; posDiscountCode = ""; posCustomerId = null;
    renderPos(); return;
  }
});

// Delegated clicks
document.addEventListener("click", async e => {
  // Edit ticket
  const editTicket = e.target.closest("[data-edit-ticket]");
  if (editTicket) { openEditTicket(editTicket.dataset.editTicket); return; }

  // Edit task
  const editTask = e.target.closest("[data-edit-task]");
  if (editTask) { openEditSupportTask(editTask.dataset.editTask); return; }

  // Print ticket
  const printBtn = e.target.closest("[data-print-ticket]");
  if (printBtn) {
    // Toggle dropdown
    const menu = printBtn.nextElementSibling;
    if (menu?.classList.contains("print-menu")) {
      const isOpen = menu.style.display === "block";
      document.querySelectorAll(".print-menu").forEach(m => m.style.display="none");
      menu.style.display = isOpen ? "none" : "block";
    }
    return;
  }
  const printAuto = e.target.closest("[data-print-auto]");
  if (printAuto) {
    document.querySelectorAll(".print-menu").forEach(m=>m.style.display="none");
    const t = state.tickets.find(i=>i.id===printAuto.dataset.printAuto);
    if (t) {
      let type = "recepcion";
      if (t.status === "Garantia") type = "garantia";
      else if (t.paymentStatus === "Pagado" || t.status === "Entregado" || t.paymentStatus === "Abonado") type = "pago";
      printRecibo(t, type);
    }
    return;
  }
  const printRec = e.target.closest("[data-print-recepcion]");
  if (printRec) { document.querySelectorAll(".print-menu").forEach(m=>m.style.display="none"); const t=state.tickets.find(i=>i.id===printRec.dataset.printRecepcion); if(t) printRecibo(t,"recepcion"); return; }
  const printPago = e.target.closest("[data-print-pago]");
  if (printPago) { document.querySelectorAll(".print-menu").forEach(m=>m.style.display="none"); const t=state.tickets.find(i=>i.id===printPago.dataset.printPago); if(t) printRecibo(t,"pago"); return; }
  const printGar = e.target.closest("[data-print-garantia]");
  if (printGar) { document.querySelectorAll(".print-menu").forEach(m=>m.style.display="none"); const t=state.tickets.find(i=>i.id===printGar.dataset.printGarantia); if(t) printRecibo(t,"garantia"); return; }

  // Abono
  const abonoBtn = e.target.closest("[data-abono-ticket]");
  if (abonoBtn) { openAbonoModal(abonoBtn.dataset.abonoTicket); return; }

  // Print cotización
  const printCot = e.target.closest("[data-print-cotizacion]");
  if (printCot) {
    const t = state.tickets.find(i => i.id === printCot.dataset.printCotizacion);
    if (t) printCotizacion(t);
    return;
  }

  // Share cotización via WhatsApp
  const waCot = e.target.closest("[data-wa-quote]");
  if (waCot) { shareQuoteWhatsApp(waCot.dataset.waQuote); return; }

  const approveBtn = e.target.closest("[data-approve-quote]");
  if (approveBtn) { approveQuoteToTicket(approveBtn.dataset.approveQuote); return; }

  // Delete ticket
  const delTicket = e.target.closest("[data-delete-ticket]");
  if (delTicket) { handleDeleteTicket(delTicket.dataset.deleteTicket); return; }

  // Delete task
  const delTask = e.target.closest("[data-delete-task]");
  if (delTask) { handleDeleteTask(delTask.dataset.deleteTask); return; }

  // Delete client
  const delClient = e.target.closest("[data-delete-client]");
  if (delClient) { handleDeleteClient(delClient.dataset.deleteClient); return; }

  // Delete transaction
  const delTx = e.target.closest("[data-delete-tx]");
  if (delTx) { handleDeleteTransaction(delTx.dataset.deleteTx); return; }

  // Employee actions
  const delEmp = e.target.closest("[data-delete-employee]");
  if (delEmp) { deleteEmployee(delEmp.dataset.deleteEmployee); return; }
  const resetPw = e.target.closest("[data-reset-pw]");
  if (resetPw) { resetEmployeePassword(resetPw.dataset.resetPw); return; }

  // Delete photo
  const delPhoto = e.target.closest("[data-delete-photo]");
  if (delPhoto) {
    const attachId = delPhoto.dataset.deletePhoto;
    const photoUrl = delPhoto.dataset.photoUrl;
    showConfirmModal("¿Eliminar esta foto?", {
      label: "Eliminar",
      danger: true,
      onConfirm: async () => {
        try {
          await supabaseClient.from("attachments").delete().eq("id", attachId);
          const urlPath = new URL(photoUrl).pathname;
          const bucketIdx = urlPath.indexOf("/ticket-photos/");
          if (bucketIdx !== -1) {
            const storagePath = urlPath.slice(bucketIdx + "/ticket-photos/".length);
            await supabaseClient.storage.from("ticket-photos").remove([storagePath]);
          }
          delPhoto.closest("div").remove();
        } catch(err) { showErrorToast(`Error al eliminar foto: ${err.message}`); }
      }
    });
    return;
  }

  // Edit client
  const editClient = e.target.closest("[data-edit-client]");
  if (editClient) { openEditClient(editClient.dataset.editClient); return; }

  const deleteProduct = e.target.closest("[data-delete-product]");
  if (deleteProduct) { deleteRemoteProduct(deleteProduct.dataset.deleteProduct); return; }

  const editProduct = e.target.closest("[data-edit-product]");
  if (editProduct) { openEditProduct(editProduct.dataset.editProduct); return; }

  const sortProduct = e.target.closest("[data-sort-product]");
  if (sortProduct) {
    const key = sortProduct.dataset.sortProduct;
    if (productSortKey === key) productSortDir = productSortDir === "asc" ? "desc" : "asc";
    else { productSortKey = key; productSortDir = "asc"; }
    renderProducts();
    return;
  }

  // Edit support task
  const editSupport = e.target.closest("[data-edit-support]");
  if (editSupport) { openEditSupportTask(editSupport.dataset.editSupport); return; }

  // Edit supply
  const editSupply = e.target.closest("[data-edit-supply]");
  if (editSupply) { openEditSupply(editSupply.dataset.editSupply); return; }

  // Edit transaction
  const editTxBtn = e.target.closest("[data-edit-tx]");
  if (editTxBtn) { openEditTransaction(editTxBtn.dataset.editTx); return; }

  // View navigation from dashboard
  const viewBtn = e.target.closest("[data-view-target]");
  if (viewBtn) { setView(viewBtn.dataset.viewTarget); return; }
});

function handleDeleteTicket(id) {
  showConfirmModal("¿Eliminar este ticket?", {
    label: "Eliminar",
    danger: true,
    onConfirm: async () => {
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (dataMode==="remote" && isUUID) {
          const {error} = await supabaseClient.from("service_tickets").delete().eq("id", id);
          if (error) throw error;
          await reloadState();
        } else {
          state.tickets = state.tickets.filter(t => t.id !== id);
          if (dataMode !== "remote") saveState();
        }
        render();
      } catch(err) { showErrorToast(`Error: ${err.message}`); }
    }
  });
}

function handleDeleteClient(id) {
  showConfirmModal("¿Eliminar este cliente y sus datos?", {
    label: "Eliminar",
    danger: true,
    onConfirm: async () => {
      try {
        if (dataMode==="remote") { const {error}=await supabaseClient.from("customers").delete().eq("id",id); if(error)throw error; await reloadState(); }
        else { state.clients=state.clients.filter(c=>c.id!==id); saveState(); }
        render();
      } catch(err) { showErrorToast(`Error: ${err.message}`); }
    }
  });
}

function handleDeleteTransaction(id) {
  showConfirmModal("¿Eliminar este movimiento financiero? Esta acción no se puede deshacer.", {
    label: "Eliminar",
    danger: true,
    onConfirm: async () => {
      try {
        if (dataMode==="remote") { const {error}=await supabaseClient.from("transactions").delete().eq("id",id); if(error)throw error; await reloadState(); }
        else { state.transactions=state.transactions.filter(t=>t.id!==id); saveState(); }
        render();
      } catch(err) { showErrorToast(`Error: ${err.message}`); }
    }
  });
}

function handleDeleteTask(id) {
  showConfirmModal("¿Eliminar esta tarea? Esta acción no se puede deshacer.", {
    label: "Eliminar",
    danger: true,
    onConfirm: async () => {
      try {
        if (dataMode==="remote") { const {error}=await supabaseClient.from("tasks").delete().eq("id",id); if(error)throw error; await reloadState(); }
        else { state.tasks=state.tasks.filter(t=>t.id!==id); saveState(); }
        render();
      } catch(err) { showErrorToast(`Error: ${err.message}`); }
    }
  });
}

searchInput.addEventListener("input", render);

document.addEventListener("input", e => {
  if (e.target.id === "pos-search") {
    posCatalogSearch = e.target.value.trim().toLowerCase();
    const list = document.querySelector(".pos-catalog-list");
    if (!list) return;
    const allBranchProducts = branchProducts().filter(p => p.productType !== "insumo" && Number(p.price) > 0);
    const catalogItems = allBranchProducts
      .filter(p => posCatalogFilter === "all" || p.productType === posCatalogFilter)
      .filter(p => !posCatalogSearch || p.name.toLowerCase().includes(posCatalogSearch) || (p.sku||"").toLowerCase().includes(posCatalogSearch));
    list.innerHTML = catalogItems.map(p => {
      const stock = Number(p.stock);
      const outOfStock = stock <= 0;
      const lowStock = !outOfStock && p.minStock > 0 && stock <= Number(p.minStock);
      return `<div class="pos-list-row${outOfStock?" out-of-stock":""}" data-pos-add="${p.id}" title="${outOfStock?"Sin stock":"Agregar al carrito"}">
        <div class="pos-list-info">
          <span class="pos-list-name">${escapeHtml(p.name)}</span>
          <span class="pos-list-cat muted">${escapeHtml(p.category)}${p.sku?` · ${escapeHtml(p.sku)}`:""}</span>
        </div>
        <span class="${outOfStock?"status urgent":lowStock?"low-stock":"muted"}" style="font-size:11px;white-space:nowrap">${outOfStock?"Agotado":stock+" pzs"}</span>
        <strong style="color:var(--fz-primary);white-space:nowrap">${money.format(p.price)}</strong>
        <button class="pos-add-btn" data-pos-add="${p.id}" ${outOfStock?"disabled":""}>+</button>
      </div>`;
    }).join("") || `<p class="muted" style="padding:18px 0;text-align:center;font-size:13px">Sin resultados.</p>`;
  }
});
document.addEventListener("click", e => {
  if (!e.target.closest("[data-print-ticket]")) {
    document.querySelectorAll(".print-menu").forEach(m => m.style.display = "none");
  }
}, true);

// ──────────────────────────────────────────────────────────────────────────────
// BRANCH TABS
// ──────────────────────────────────────────────────────────────────────────────
function setActiveBranch(name) {
  activeBranchId = name;
  document.querySelectorAll(".branch-tab").forEach(btn => {
    btn.classList.toggle("is-active", btn.textContent.trim()===name);
  });
  applyBranchBrand(name);
  render();
}
window.setActiveBranch = setActiveBranch;
window.openTransactionForm = openTransactionForm;

// ──────────────────────────────────────────────────────────────────────────────
// PRINT / EXPORT
// ──────────────────────────────────────────────────────────────────────────────

// Chrome/Chromium does not evaluate var() inside @page { size }, so we inject
// a <style> with the literal value before every print call.
function doPrint() {
  const w = localStorage.getItem("fixzone-receipt-width") || "58mm";
  let s = document.getElementById("fz-print-size");
  if (!s) { s = document.createElement("style"); s.id = "fz-print-size"; document.head.appendChild(s); }
  s.textContent = `@media print { @page { size: ${w} auto; margin: 0; } }`;
  const imgs = [...document.querySelectorAll("#print-receipt img")];
  const unloaded = imgs.filter(img => !img.complete);
  if (unloaded.length === 0) { window.print(); return; }
  let printed = false;
  const now = () => { if (!printed) { printed = true; window.print(); } };
  let done = 0;
  unloaded.forEach(img => { img.onload = img.onerror = () => { if (++done >= unloaded.length) now(); }; });
  setTimeout(now, 1200);
}

// ── Receipt variants ──────────────────────────────────────────────────────────
function printRecibo(ticket, type) {
  const client    = state.clients.find(c => c.name?.toLowerCase() === ticket.client?.toLowerCase());
  const repair    = Number(ticket.repairAmount || 0);
  const discount  = Number(ticket.discountAmount || 0);
  const total     = Math.max(0, repair - discount);
  const paid      = Number(ticket.paidAmount || 0);
  const pending   = Math.max(0, total - paid);
  const brand     = window.getBranchBrand(ticket.branch || activeBranchId);
  const D         = "────────────────────────────────────────";
  const now       = new Date();
  const timeStr   = now.toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit" });
  const receiptWidth = localStorage.getItem("fixzone-receipt-width") || "58mm";
  document.documentElement.style.setProperty("--receipt-width", receiptWidth);

  const header = `
    <div class="rct-logo"><img src="${brand.logoMonoSrc||brand.logoSrc}" alt="${brand.displayName}" onerror="this.src='${brand.logoSrc}'"/></div>
    <p class="rct-dash">${D}</p>
    <p class="rct-center rct-title">${{recepcion:"RECIBO DE RECEPCIÓN",pago:"COMPROBANTE DE PAGO",garantia:"CERTIFICADO DE GARANTÍA"}[type]}</p>
    <p class="rct-dash">${D}</p>
    <p class="rct-row"><strong>FOLIO:</strong> <span>${escapeHtml(ticket.tracking)}</span></p>
    <p class="rct-row"><strong>FECHA:</strong> <span>${escapeHtml(ticket.createdAt||dateStamp())} ${timeStr}</span></p>
    <p class="rct-dash">${D}</p>
    <p class="rct-label">CLIENTE:</p>
    <p class="rct-value">${escapeHtml(ticket.client)}</p>
    <p class="rct-value">Tel: ${escapeHtml(client?.phone||ticket.phone||"No registrado")}</p>
    <p class="rct-dash">${D}</p>
    <p class="rct-label">EQUIPO:</p>
    <p class="rct-value">${escapeHtml(ticket.productName)}</p>
    ${ticket.imei?`<p class="rct-value"><strong>IMEI/Serie:</strong> ${escapeHtml(ticket.imei)}</p>`:""}
    ${ticket.color?`<p class="rct-value"><strong>Color:</strong> ${escapeHtml(ticket.color)}</p>`:""}
    ${ticket.physicalCondition?`<p class="rct-value"><strong>Condición:</strong> ${escapeHtml(ticket.physicalCondition)}</p>`:""}
    ${ticket.accessories?`<p class="rct-value"><strong>Accesorios:</strong> ${escapeHtml(ticket.accessories)}</p>`:""}`;

  let body = "";
  if (type === "recepcion") {
    body = `
      <p class="rct-dash">${D}</p>
      <p class="rct-label">FALLA REPORTADA:</p>
      <p class="rct-value">${escapeHtml(ticket.issue)}</p>
      <p class="rct-dash">${D}</p>
      <p class="rct-row"><strong>COSTO ESTIMADO:</strong> <span>${money.format(repair)}</span></p>
      ${ticket.discountCode?`<p class="rct-row"><strong>DESCUENTO (${escapeHtml(ticket.discountCode)}):</strong> <span>-${money.format(discount)}</span></p>`:""}
      <p class="rct-row"><strong>ANTICIPO:</strong> <span>${money.format(paid)}</span></p>
      <p class="rct-row"><strong>SALDO PENDIENTE:</strong> <span>${money.format(pending)}</span></p>
      <p class="rct-dash">${D}</p>
      <p class="rct-value" style="font-size:7.5pt">El tiempo estimado de reparación será notificado. El equipo no reclamado después de 30 días podrá ser dado de baja.</p>
      <p class="rct-dash">${D}</p>
      <div class="rct-sign"><div class="rct-sign-line"></div><p>FIRMA DE CLIENTE — RECIBIDO CONFORME</p></div>`;
  } else if (type === "pago") {
    body = `
      <p class="rct-dash">${D}</p>
      <p class="rct-label">CONCEPTO:</p>
      <p class="rct-value">${escapeHtml(ticket.issue)}</p>
      <p class="rct-dash">${D}</p>
      <table class="rct-table"><thead><tr><th>Descripción</th><th>Importe</th></tr></thead>
      <tbody>
        <tr><td>${escapeHtml(ticket.issue||"Servicio de reparación")}</td><td>${money.format(repair)}</td></tr>
        ${discount>0?`<tr><td>Descuento${ticket.discountCode?" ("+escapeHtml(ticket.discountCode)+")":""}</td><td>-${money.format(discount)}</td></tr>`:""}
      </tbody></table>
      <p class="rct-dash">${D}</p>
      <div class="rct-totals">
        <div class="rct-total-row rct-total-main"><span>TOTAL</span><strong>${money.format(total)}</strong></div>
        <div class="rct-total-row"><span>PAGADO</span><span>${money.format(paid)}</span></div>
        <div class="rct-total-row"><span>SALDO</span><span>${money.format(pending)}</span></div>
        <div class="rct-total-row"><span>ESTADO</span><span>${escapeHtml(ticket.paymentStatus)}</span></div>
      </div>
      <p class="rct-dash">${D}</p>
      <p class="rct-label">GARANTÍA:</p>
      <p class="rct-policy">• 30 días en mano de obra desde la fecha de entrega.</p>
      <p class="rct-policy">• No aplica por daños físicos, humedad, mal uso o intervención de terceros.</p>
      <p class="rct-policy">• Solo cubre la falla reparada. Conserve este documento.</p>`;
  } else { // garantia
    const warrantyDate = ticket.warrantyUntil || (() => {
      const d = new Date(); d.setDate(d.getDate()+30); return d.toISOString().slice(0,10);
    })();
    body = `
      <p class="rct-dash">${D}</p>
      <p class="rct-label">TRABAJO REALIZADO:</p>
      <p class="rct-value">${escapeHtml(ticket.issue)}</p>
      <p class="rct-dash">${D}</p>
      <p class="rct-row"><strong>GARANTÍA VÁLIDA HASTA:</strong></p>
      <p class="rct-value rct-title">${warrantyDate}</p>
      <p class="rct-dash">${D}</p>
      <p class="rct-label">CONDICIONES DE GARANTÍA:</p>
      <p class="rct-policy">• 30 días en mano de obra desde la fecha de entrega.</p>
      <p class="rct-policy">• No aplica por daños físicos, humedad, mal uso o intervención de terceros.</p>
      <p class="rct-policy">• Solo cubre la falla por la cual fue reparado el equipo.</p>
      <p class="rct-policy">• Conserve este documento para hacer válida la garantía.</p>
      <p class="rct-dash">${D}</p>
      <div class="rct-sign"><div class="rct-sign-line"></div><p>FIRMA DE ENTREGA CONFORME</p></div>`;
  }

  document.querySelector("#print-receipt").innerHTML = `<div class="rct">${header}${body}<p class="rct-thanks">★ Gracias por confiar en ${escapeHtml(brand.displayName)} ★</p><p class="rct-dash">${D}</p></div>`;
  doPrint();
}

function printPosRecibo() {
  if (!lastPosSale) return;
  const brand    = window.getBranchBrand(activeBranchId);
  const D        = "─".repeat(32);
  const { items, total, method, discount, discountCode, clientName, date } = lastPosSale;
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const rows     = items.map(i =>
    `<div style="display:flex;justify-content:space-between;font-size:11px;margin:2px 0">
      <span>${escapeHtml(i.name)} ×${i.qty}</span>
      <span>${money.format(i.qty * i.unitPrice)}</span>
    </div>`
  ).join("");
  const hasRefaccion = items.some(i => {
    const prod = state.products.find(p => p.id === i.productId);
    return prod?.productType === "refaccion";
  });
  document.querySelector("#print-receipt").innerHTML = `
    <div class="rct">
      <h2 style="font-size:14px;font-weight:700;text-align:center;margin:0 0 2px">${escapeHtml(brand.displayName || activeBranchId)}</h2>
      <p style="font-size:11px;text-align:center;margin:0 0 6px">${date}</p>
      <p class="rct-dash">${D}</p>
      ${rows}
      <p class="rct-dash">${D}</p>
      ${discount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px"><span>Subtotal</span><span>${money.format(subtotal)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:11px"><span>Descuento${discountCode?" ("+escapeHtml(discountCode)+")":""}</span><span>-${money.format(discount)}</span></div>` : ""}
      <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-top:4px">
        <span>TOTAL</span><span>${money.format(total)}</span>
      </div>
      <div style="font-size:11px;text-align:center;margin-top:6px">Método: ${escapeHtml(method)}</div>
      ${clientName ? `<div style="font-size:11px;text-align:center">Cliente: ${escapeHtml(clientName)}</div>` : ""}
      ${hasRefaccion ? `<p class="rct-dash">${D}</p>
        <p style="font-size:10px;text-align:center;margin:4px 0">Garantía en refacciones: 3 días naturales para cambio.</p>
        <p style="font-size:10px;text-align:center;margin:0">No aplica en daños por mal uso o instalación inadecuada.</p>` : ""}
      <p class="rct-thanks">★ Gracias por su compra ★</p>
      <p class="rct-dash">${D}</p>
    </div>`;
  doPrint();
}

function printTicket(ticket) {
  const client    = state.clients.find(c => c.name.toLowerCase() === ticket.client.toLowerCase());
  const repairAmt = Number(ticket.repairAmount ?? ticket.total ?? 0);
  const paidAmt   = Number(ticket.paidAmount ?? 0);
  const received  = Number(ticket.amountReceived ?? paidAmt ?? 0);
  const change    = Number(ticket.changeAmount ?? 0);
  const now       = new Date();
  const timeStr   = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const qrTarget  = receiptQrTarget();
  const qrImage   = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(qrTarget)}`;
  const D         = "----------------------------------------";

  // Leer marca desde la sucursal del ticket (no necesariamente la activa en UI)
  const ticketBranch     = ticket.branch || activeBranchId;
  const brand            = window.getBranchBrand(ticketBranch);
  const logoMonoSrc      = brand.logoMonoSrc || brand.logoSrc;
  const logoMonoFallback = brand.logoMonoFallback || brand.logoFallback || brand.logoSrc;
  const receiptHeader    = brand.receiptHeader || brand.displayName;

  document.querySelector("#print-receipt").innerHTML = `
<div class="rct">

  <div class="rct-logo">
    <img src="${logoMonoSrc}" alt="${brand.displayName}"
      onerror="this.src='${logoMonoFallback}';this.onerror=null" />
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
  ${ticket.imei        ? `<p class="rct-value"><strong>IMEI / SERIE:</strong> ${escapeHtml(ticket.imei)}</p>` : ""}
  ${ticket.color       ? `<p class="rct-value"><strong>COLOR:</strong> ${escapeHtml(ticket.color)}</p>` : ""}
  ${ticket.accessories ? `<p class="rct-value"><strong>ACCESORIOS:</strong> ${escapeHtml(ticket.accessories)}</p>` : ""}
  ${ticket.physicalCondition ? `<p class="rct-value"><strong>CONDICIÓN:</strong> ${escapeHtml(ticket.physicalCondition)}</p>` : ""}
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
      ${ticket.discountAmount>0?`<tr><td>Descuento${ticket.discountCode?" — "+escapeHtml(ticket.discountCode):""}</td><td>-${money.format(ticket.discountAmount)}</td></tr>`:""}
    </tbody>
  </table>

  <p class="rct-dash">${D}</p>

  <div class="rct-totals">
    <div class="rct-total-row rct-total-main"><span>TOTAL</span><strong>${money.format(Math.max(0,repairAmt-(ticket.discountAmount||0)))}</strong></div>
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

  // Set paper width via CSS variable before printing
  const receiptWidth = localStorage.getItem("fixzone-receipt-width") || "58mm";
  document.documentElement.style.setProperty("--receipt-width", receiptWidth);
  doPrint();
  // Show size toggle in a small floating bar before print dialog
}

// Expose receipt size toggle so it can be called from the header/receipt area
window.setReceiptWidth = function(w) {
  localStorage.setItem("fixzone-receipt-width", w);
  document.documentElement.style.setProperty("--receipt-width", w);
  showToast(`✓ Tamaño de recibo: ${w}`);
};

function printCotizacion(ticket) {
  const brand   = window.getBranchBrand(ticket.branch || activeBranchId);
  const items   = ticket.quoteItems || [];
  const subtotal= Number(ticket.repairAmount || 0);
  const discAmt = Number(ticket.discountAmount || 0);
  const total   = Math.max(0, subtotal - discAmt);
  const D       = "─".repeat(40);
  const now     = new Date();
  const timeStr = now.toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit" });
  const client  = state.clients.find(c => c.name?.toLowerCase() === ticket.client?.toLowerCase());
  const receiptWidth = localStorage.getItem("fixzone-receipt-width") || "58mm";
  document.documentElement.style.setProperty("--receipt-width", receiptWidth);

  document.querySelector("#print-receipt").innerHTML = `
<div class="rct">
  <div class="rct-logo"><img src="${brand.logoMonoSrc||brand.logoSrc}" alt="${brand.displayName}" onerror="this.src='${brand.logoSrc}';this.onerror=null"/></div>
  <p class="rct-dash">${D}</p>
  <p class="rct-center rct-title">COTIZACIÓN</p>
  <p class="rct-dash">${D}</p>
  <p class="rct-row"><strong>NO. COTIZACIÓN:</strong> <span>${escapeHtml(ticket.tracking)}</span></p>
  <p class="rct-row"><strong>FECHA:</strong> <span>${escapeHtml(ticket.createdAt||dateStamp())} ${timeStr}</span></p>
  <p class="rct-row"><strong>SUCURSAL:</strong> <span>${escapeHtml(brand.displayName)}</span></p>
  <p class="rct-dash">${D}</p>
  <p class="rct-label">CLIENTE:</p>
  <p class="rct-value">${escapeHtml(ticket.client)}</p>
  ${client?.phone ? `<p class="rct-value">Tel: ${escapeHtml(client.phone)}</p>` : ""}
  <p class="rct-dash">${D}</p>
  <p class="rct-label">EQUIPO / PRODUCTO:</p>
  <p class="rct-value">${escapeHtml(ticket.productName)}</p>
  ${ticket.issue ? `<p class="rct-value" style="margin-top:4px"><strong>Descripción:</strong> ${escapeHtml(ticket.issue)}</p>` : ""}
  <p class="rct-dash">${D}</p>
  <table class="rct-table">
    <thead><tr><th>Descripción</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead>
    <tbody>
      ${items.length
        ? items.map(i => `<tr>
            <td>${escapeHtml(i.description||"")} <span style="font-size:9px;opacity:.55">(${escapeHtml(i.type||"")})</span></td>
            <td style="text-align:center">${i.qty}</td>
            <td style="text-align:right">${money.format(i.unitPrice)}</td>
            <td style="text-align:right">${money.format(i.qty*i.unitPrice)}</td>
          </tr>`).join("")
        : `<tr><td colspan="4">${escapeHtml(ticket.issue||"Servicio de reparación")}</td></tr>`
      }
    </tbody>
  </table>
  <p class="rct-dash">${D}</p>
  <div class="rct-totals">
    ${items.length ? `<div class="rct-total-row"><span>Subtotal</span><span>${money.format(subtotal)}</span></div>` : ""}
    ${discAmt > 0 ? `<div class="rct-total-row"><span>Descuento${ticket.discountCode?" ("+escapeHtml(ticket.discountCode)+")":""}</span><span>-${money.format(discAmt)}</span></div>` : ""}
    <div class="rct-total-row rct-total-main"><span>TOTAL ESTIMADO</span><strong>${money.format(total)}</strong></div>
  </div>
  <p class="rct-dash">${D}</p>
  <p class="rct-value" style="font-size:9pt;opacity:.65;text-align:center">Esta cotización tiene una vigencia de 15 días naturales a partir de la fecha de emisión. Los precios pueden variar según el diagnóstico definitivo.</p>
  <p class="rct-dash">${D}</p>
  <p class="rct-thanks">★ ${escapeHtml(brand.displayName)} · ${escapeHtml(brand.locationLabel||"")} ★</p>
  <p class="rct-dash">${D}</p>
  <div class="rct-sign"><div class="rct-sign-line"></div><p>FIRMA DE AUTORIZACIÓN DEL CLIENTE</p></div>
</div>`;
  doPrint();
}

function shareQuoteWhatsApp(ticketId) {
  const ticket = state.tickets.find(t => t.id === ticketId);
  if (!ticket) return;
  const brand   = window.getBranchBrand(ticket.branch || activeBranchId);
  const items   = ticket.quoteItems || [];
  const subtotal= Number(ticket.repairAmount || 0);
  const discAmt = Number(ticket.discountAmount || 0);
  const total   = Math.max(0, subtotal - discAmt);

  const linesText = items.length
    ? items.map(i => `  • ${i.description||i.type} — ${i.qty>1?i.qty+"×":""}${money.format(i.qty*i.unitPrice)}`).join("\n")
    : `  • ${ticket.issue||"Servicio"} — ${money.format(subtotal)}`;

  const waTemplate = getWATemplates()["cotizacion"] || null;
  let msg;

  if (waTemplate) {
    msg = fillWATemplate("cotizacion", {
      client:      ticket.client,
      productName: ticket.productName,
      branch:      brand.displayName,
      folio:       ticket.tracking,
      amount:      money.format(total),
      pending:     "",
      total:       money.format(total),
      items:       linesText,
    });
  } else {
    msg = `Hola ${ticket.client} 👋, aquí tu cotización de *${brand.displayName}*:\n\n` +
          `📋 No. ${ticket.tracking}\n` +
          `📱 Equipo: ${ticket.productName}\n\n` +
          `*Detalle:*\n${linesText}\n\n` +
          (discAmt > 0 ? `💸 Descuento: -${money.format(discAmt)}\n` : "") +
          `*Total estimado: ${money.format(total)}*\n\n` +
          `⏳ Vigencia: 15 días. Contáctanos para agendar tu reparación. ¡Gracias!`;
  }

  const clientPhone = state.clients.find(c => c.name?.toLowerCase() === ticket.client?.toLowerCase())?.phone || "";
  const phone = clientPhone.replace(/\D/g, "").replace(/^52/, "");
  const url = `https://wa.me/${phone ? "52"+phone : ""}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank", "noopener");
}
window.shareQuoteWhatsApp = shareQuoteWhatsApp;

function receiptQrTarget() {
  try {
    const base =
      location.protocol === "file:"
        ? "https://fixzone-crm.pages.dev"
        : window.location.origin;

    return `${base}/detente-jochis.html`;
  } catch (err) {
    return "https://fixzone-crm.pages.dev/detente-jochis.html";
  }
}

function exportWorkbook(singleSheet) {
  const sheets = {
    clients:      { title:"Clientes",     headers:["Nombre","Telefono","Email","Equipo","Ultima visita","Estado"],               rows:branchClients().map(i=>[i.name,i.phone,i.email,i.device,i.lastVisit,i.status]) },
    products:     { title:"Productos",    headers:["Nombre","SKU","Categoria","Stock","Minimo","Precio"],                        rows:branchProducts().map(i=>[i.name,i.sku,i.category,i.stock,i.minStock,i.price]) },
    tickets:      { title:"Tickets",      headers:["Folio","Cliente","Producto","Trabajo","Stage","Prioridad","Sucursal","Empleado","Monto","Pago","Pagado","Fecha"], rows:branchTickets().map(i=>[i.tracking,i.client,i.productName,i.issue,i.status,i.priority,i.branch,i.assignedTo,i.repairAmount??i.total,i.paymentStatus,i.paidAmount,i.createdAt]) },
    supplies:     { title:"Insumos",      headers:["Fecha","Proveedor","Insumo","Cantidad","Total"],                             rows:branchSupplies().map(i=>[i.date,i.supplier,i.item,i.quantity,i.total]) },
    transactions: { title:"Finanzas",     headers:["Fecha","Tipo","Concepto","Categoria","Monto"],                              rows:branchTransactions().map(i=>[i.date,i.type,i.concept,i.category,i.amount]) },
  };
  const keys = singleSheet ? [singleSheet] : Object.keys(sheets);
  const html = `<html><head><meta charset="utf-8"/><style>table{border-collapse:collapse;margin-bottom:28px}th,td{border:1px solid #999;padding:8px}th{background:#2f6fff;color:#fff}h2{font-family:Arial}</style></head><body>${keys.map(k=>sheetToTable(sheets[k])).join("")}</body></html>`;
  downloadFile(html, `fixzone-${singleSheet||"crm"}-${dateStamp()}.xls`, "application/vnd.ms-excel");
}

function sheetToTable(sheet) {
  return `<h2>${escapeHtml(sheet.title)}</h2><table><thead><tr>${sheet.headers.map(h=>`<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${sheet.rows.map(r=>`<tr>${r.map(c=>`<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content],{type});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function emptyMessage(text) { return `<p class="muted">${text}</p>`; }
function tableEmpty(cols)   { return `<tr><td colspan="${cols}" class="muted">Sin registros.</td></tr>`; }
function dateStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function escapeHtml(v)      { return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }

// ──────────────────────────────────────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────────────────────────────────────

// ── applyBranchBrand — aplica colores, logo, nombre y fondos al DOM ──────────
function applyBranchBrand(branchName) {
  const brand = window.getBranchBrand(branchName);
  if (!brand) return;

  // Variables CSS en :root — brand defaults first, then user overrides
  const root = document.documentElement;
  for (const [key, val] of Object.entries(brand.colors)) {
    root.style.setProperty(key, val);
  }
  if (brand.dashboardColors) {
    for (const [key, val] of Object.entries(brand.dashboardColors)) {
      root.style.setProperty(key, val);
    }
  }
  const overrides = getBrandOverrides()[branchName] || {};
  for (const [key, val] of Object.entries(overrides)) {
    root.style.setProperty(key, val);
  }

  // Clase de marca en <body>
  document.body.classList.remove("brand-fixzone", "brand-refaxzone");
  document.body.classList.add(brand.brandClass);

  // Título de pestaña
  document.title = brand.pageTitle;

  // Top accent bar — 4px gradient stripe at top
  let bar = document.querySelector("#brand-accent-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "brand-accent-bar";
    bar.style.cssText = "position:fixed;top:0;left:0;right:0;height:4px;z-index:9999;transition:background .4s";
    document.body.prepend(bar);
  }
  bar.style.background = `linear-gradient(90deg, var(--fz-deep), var(--fz-primary), var(--fz-secondary))`;

  // Update sidebar-footer branch indicator dot color
  const dot = document.querySelector(".sidebar-footer .dot, #branch-dot");
  if (dot) dot.style.background = brand.colors["--fz-primary"] || "#2F6FFF";

  // Sidebar: logo, nombre, label
  const brandLogoImg = document.querySelector(".brand img");
  const brandNameEl  = document.querySelector(".brand strong");
  const brandLabelEl = document.querySelector(".brand span");
  if (brandLogoImg) {
    const logoOverride = overrides["--fz-logo-src"];
    brandLogoImg.src = logoOverride || brand.logoSrc;
    brandLogoImg.alt = brand.displayName;
    if (!logoOverride && brand.logoFallback) {
      brandLogoImg.onerror = function() { this.src = brand.logoFallback; this.onerror = null; };
    }
  }
  if (brandNameEl)  brandNameEl.textContent  = brand.displayName;
  if (brandLabelEl) brandLabelEl.textContent = brand.crmLabel;

  // Topbar: eyebrow / tagline
  const eyebrowEl = document.querySelector(".topbar .eyebrow");
  if (eyebrowEl) eyebrowEl.textContent = brand.tagline;

  // Fondos de sidebar y workspace
  const sidebar   = document.querySelector(".sidebar");
  const workspace = document.querySelector(".workspace");
  if (sidebar)   sidebar.style.background   = brand.sidebarBg;
  if (workspace) workspace.style.background = brand.workspaceBg;

  // Indicador en sidebar footer
  const branchLabel = document.querySelector("#active-branch-label");
  if (branchLabel) branchLabel.textContent = brand.locationLabel;

  // Favicon dinámico
  let favicon = document.querySelector("link[rel='icon']");
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }
  favicon.href = overrides["--fz-logo-src"] || brand.logoSrc;
}

// ── Section tooltips ─────────────────────────────────────────────────────────
const NAV_TOOLTIPS = {
  dashboard:      "Vista general: métricas del día, tickets activos y movimientos recientes.",
  tickets:        "Kanban de reparaciones. Arrastra las cards para cambiar el stage.",
  cotizaciones:   "Presupuestos pendientes de aprobación. Aprueba para convertir en ticket.",
  pos:            "Punto de Venta: vende productos directamente sin abrir un ticket. Descuenta stock y registra el ingreso automáticamente.",
  clients:        "Registro de clientes y sus equipos. Busca por nombre, teléfono o IMEI.",
  products:       "Inventario de refacciones, accesorios y productos vendibles.",
  supplies:       "Compras de insumos y materiales. Se registran como egreso automáticamente.",
  precios:        "Tabla de precios por dispositivo y servicio. Al crear un ticket se sugiere el precio automáticamente.",
  finance:        "Ingresos y egresos del negocio con filtro por período.",
  reports:        "Reportes de caja, tickets por etapa y productividad del equipo.",
  users:          "Gestión de empleados, roles y permisos de acceso.",
  soporte:        "Kanban de tareas internas del equipo de IT/Soporte.",
  diseno:         "Herramientas de marketing, plantillas de WhatsApp y códigos de descuento.",
  automatizacion: "Flujos y automatizaciones para la sucursal activa.",
};

function initNavTooltips() {
  document.querySelectorAll(".nav-item[data-view]").forEach(btn => {
    const tip = NAV_TOOLTIPS[btn.dataset.view];
    if (!tip) return;
    btn.setAttribute("title", tip); // fallback
    let tooltip = null;
    btn.addEventListener("mouseenter", () => {
      tooltip = document.createElement("div");
      tooltip.textContent = tip;
      tooltip.style.cssText = "position:fixed;left:220px;background:#1a1a2e;color:#e0e0e0;border:1px solid rgba(255,255,255,.15);border-radius:6px;padding:8px 12px;font-size:11px;line-height:1.5;max-width:220px;z-index:9999;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.5)";
      const rect = btn.getBoundingClientRect();
      tooltip.style.top = `${rect.top}px`;
      document.body.appendChild(tooltip);
    });
    btn.addEventListener("mouseleave", () => { tooltip?.remove(); tooltip = null; });
  });
}

function setupDogCursor() {
  const dogNormal = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='44' viewBox='0 0 40 44'>
    <path d='M33 18 Q38 10 36 5' stroke='#b8742a' stroke-width='3.5' fill='none' stroke-linecap='round'/>
    <ellipse cx='26' cy='27' rx='10' ry='9' fill='#c8853a'/>
    <ellipse cx='18' cy='22' rx='5' ry='7' fill='#c8853a'/>
    <circle cx='14' cy='14' r='10' fill='#c8853a'/>
    <ellipse cx='10' cy='5' rx='4.5' ry='7' fill='#8b4a1a' transform='rotate(-15 10 5)'/>
    <ellipse cx='5' cy='17' rx='6.5' ry='4.5' fill='#e0a868'/>
    <ellipse cx='1' cy='16' rx='3.5' ry='2.5' fill='#111'/>
    <circle cx='0.8' cy='14.8' r='1' fill='rgba(255,255,255,0.75)'/>
    <circle cx='12' cy='12' r='3' fill='#111'/>
    <circle cx='13.2' cy='11' r='1' fill='rgba(255,255,255,0.85)'/>
    <path d='M3 21 Q7 24 11 21' stroke='#8b4a1a' stroke-width='1.5' fill='none' stroke-linecap='round'/>
    <rect x='12' y='28' width='5' height='11' rx='2.5' fill='#c8853a'/>
    <rect x='22' y='34' width='5' height='9' rx='2.5' fill='#c8853a'/>
    <rect x='29' y='34' width='5' height='9' rx='2.5' fill='#c8853a'/>
  </svg>`;

  const dogPooping = `<svg xmlns='http://www.w3.org/2000/svg' width='52' height='66' viewBox='0 0 52 66'>
    <!-- Tail from low rear going right -->
    <path d='M44 36 Q52 30 50 24' stroke='#b8742a' stroke-width='3.5' fill='none' stroke-linecap='round'/>
    <!-- Body: front high, rear very low -->
    <path d='M20 20 Q31 13 43 28 Q48 36 44 42 Q40 46 32 44 Q22 42 20 32 Q19 26 20 20 Z' fill='#c8853a'/>
    <!-- Neck -->
    <ellipse cx='18' cy='23' rx='5' ry='7' fill='#c8853a'/>
    <!-- Head — same position as normal -->
    <circle cx='12' cy='16' r='11' fill='#c8853a'/>
    <!-- Ear — same floppy style as normal dog, shifted slightly back -->
    <ellipse cx='13' cy='7' rx='4.5' ry='7' fill='#8b4a1a' transform='rotate(-15 13 7)'/>
    <!-- Snout -->
    <ellipse cx='3' cy='19' rx='7' ry='4.5' fill='#e0a868'/>
    <!-- Nose (hotspot 1,18) -->
    <ellipse cx='0.5' cy='17.5' rx='3' ry='2.5' fill='#111'/>
    <circle cx='0.4' cy='16.3' r='0.9' fill='rgba(255,255,255,0.7)'/>
    <!-- Eye squinting with effort -->
    <path d='M8 14 Q12 11 16 14' stroke='#111' stroke-width='2' fill='none' stroke-linecap='round'/>
    <!-- Front legs — same proportions as normal dog, NOT extra long -->
    <rect x='14' y='30' width='5' height='14' rx='2.5' fill='#c8853a'/>
    <rect x='21' y='30' width='5' height='14' rx='2.5' fill='#c8853a'/>
    <!-- Back legs — squatting short below the lowered rear -->
    <path d='M34 44 Q31 52 33 58' stroke='#c8853a' stroke-width='6' fill='none' stroke-linecap='round'/>
    <path d='M41 44 Q39 52 41 58' stroke='#c8853a' stroke-width='6' fill='none' stroke-linecap='round'/>
    <!-- Poop pile — shifted right so it's away from the back legs -->
    <ellipse cx='47' cy='65' rx='8' ry='2.5' fill='#2d1506'/>
    <ellipse cx='47' cy='61' rx='6' ry='3' fill='#3d2008'/>
    <ellipse cx='47' cy='57' rx='4.5' ry='3' fill='#4d2c0a'/>
    <ellipse cx='48' cy='53.5' rx='3' ry='2.5' fill='#5d360c'/>
    <circle cx='48' cy='51' r='2' fill='#6b3e0e'/>
    <circle cx='45' cy='62' r='1' fill='white'/>
    <circle cx='49' cy='62' r='1' fill='white'/>
    <circle cx='45.3' cy='62' r='0.5' fill='#111'/>
    <circle cx='49.3' cy='62' r='0.5' fill='#111'/>
  </svg>`;

  const toUri = svg => 'data:image/svg+xml,' + encodeURIComponent(svg);
  const uriNormal  = toUri(dogNormal);
  const uriPooping = toUri(dogPooping);

  const styleEl = document.createElement('style');
  styleEl.id = 'dog-cursor-style';
  document.head.appendChild(styleEl);

  const applyNormal  = () => { styleEl.textContent = `* { cursor: url("${uriNormal}") 1 16, auto !important; }`; };
  const applyPooping = () => { styleEl.textContent = `* { cursor: url("${uriPooping}") 1 18, auto !important; }`; };

  applyNormal();
  document.addEventListener('mousedown', applyPooping);
  document.addEventListener('mouseup',   applyNormal);
}

async function initializeApp() {
  loadSavedPermissions();
  applyBranchBrand(activeBranchId);
  setupSupabase();
  initNavTooltips();
  setupDogCursor();
  await refreshSession();
}

initializeApp();