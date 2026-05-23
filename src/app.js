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
const ROLE_LABELS  = { it: "Admin", owner: "Admin", admin: "Admin", standard: "Estándar", technician: "Estándar", marketing: "Marketing", viewer: "Solo lectura", sales: "Ventas" };

// ── Role permission map ───────────────────────────────────────────────────────
const PERMISSIONS = {
  // Frontend roles
  it:        { tabs: ["dashboard","cotizaciones","clients","products","tickets","supplies","finance","reports","users","soporte","diseno","automatizacion"], canDeleteClients: true, canDeleteTickets: true, canDeleteTask: true, canManageUsers: true, canManageFinance: true, canExportXLS: true },
  admin:     { tabs: ["dashboard","cotizaciones","clients","products","tickets","supplies","finance","reports","users","automatizacion"],           canDeleteClients: true, canDeleteTickets: true, canDeleteTask: true, canManageUsers: true, canManageFinance: true, canExportXLS: true },
  standard:  { tabs: ["dashboard","cotizaciones","clients","products","tickets","supplies","finance","reports"],                  canDeleteClients: false, canDeleteTickets: true, canDeleteTask: false, canManageUsers: false, canManageFinance: false, canExportXLS: true },
  marketing: { tabs: ["dashboard","cotizaciones","clients","tickets","diseno","automatizacion"],                                  canDeleteClients: false, canDeleteTickets: false, canDeleteTask: false, canManageUsers: false, canManageFinance: false, canExportXLS: false },
  // DB roles (map to equivalent frontend permission sets)
  owner:      { tabs: ["dashboard","cotizaciones","clients","products","tickets","supplies","finance","reports","users","soporte","diseno","automatizacion"], canDeleteClients: true, canDeleteTickets: true, canDeleteTask: true, canManageUsers: true, canManageFinance: true, canExportXLS: true },
  sales:      { tabs: ["dashboard","cotizaciones","clients","products","tickets","supplies","finance","reports"],                  canDeleteClients: false, canDeleteTickets: true, canDeleteTask: false, canManageUsers: false, canManageFinance: true, canExportXLS: true },
  technician: { tabs: ["dashboard","cotizaciones","clients","products","tickets","supplies","finance","reports"],                  canDeleteClients: false, canDeleteTickets: true, canDeleteTask: false, canManageUsers: false, canManageFinance: false, canExportXLS: true },
  viewer:     { tabs: ["dashboard","reports"],                                                                      canDeleteClients: false, canDeleteTickets: false, canDeleteTask: false, canManageUsers: false, canManageFinance: false, canExportXLS: false },
};

let activeBranchId  = "Puerto Vallarta";
let activeForm      = null;
let editingTicketId = null;
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
      ["device","Equipo","text"],["address","Direccion","text"],
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
      ["client","Cliente","text"],["productName","Producto / equipo","text"],
      // Device detail fields
      ["imei","IMEI / No. Serie","text"],
      ["color","Color","text"],
      ["accessories","Accesorios recibidos","text",null,true],
      ["physicalCondition","Condición física","select",["Bueno","Regular","Con daños","Muy dañado"]],
      ["issue","Falla / trabajo","text",null,true],
      ["branch","Sucursal","select",BRANCHES],["assignedTo","Empleado","select",employees],
      ["status","Stage","select",ticketStages],["priority","Prioridad","select",["Normal","Media","Alta","Urgente"]],
      ["repairAmount","Monto reparacion","number"],
      ["discountCode","Código de descuento","text"],
      ["discountAmount","Descuento ($)","number"],
      ["paymentStatus","Pago","select",["Pendiente","Abonado","Pagado"]],
      ["paidAmount","Monto pagado","number"],["createdAt","Fecha","date"],
      ["notes","Notas internas","text",null,true],
    ],
  },
  supply: {
    title: "Compra de insumo", collection: "supplies",
    fields: [
      ["date","Fecha","date"],["supplier","Proveedor","text"],["item","Insumo","text"],
      ["quantity","Cantidad","number"],["total","Total","number"],
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
  const seqs = state.tickets.map(t => Number(String(t.tracking||"").replace(/\D/g,""))).filter(Boolean);
  return Math.max(0,...seqs)+1;
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
  await afterLogin();
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
    };
    return state;
  } finally {
    setLoading(false);
  }
}

async function afterLogin() {
  try {
    await resolveCurrentEmployee();
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
    await supabaseClient.auth.signOut();
    showLoginScreen(err.message || "Error al verificar acceso. Contacta a IT.");
  }
}

async function resolveCurrentEmployee() {
  const { data: { user } } = await supabaseClient.auth.getUser();
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
  try {
    const authEmail = `${username}@fixzone.internal`;
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email:    authEmail,
      password: password,
    });
    if (error) throw new Error("Usuario o contraseña incorrectos.");
    currentSession = data.session;
    await afterLogin();
  } catch(err) {
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
  const [bRes,eRes,cRes,dRes,pRes,tRes,puRes,txRes,stRes] = await Promise.all([
    supabaseClient.from("branches").select("*").order("name"),
    supabaseClient.from("employees").select("*").order("full_name"),
    supabaseClient.from("customers").select("*").order("created_at",{ascending:false}),
    supabaseClient.from("customer_devices").select("*").order("created_at",{ascending:false}),
    supabaseClient.from("products").select("*").order("name"),
    supabaseClient.from("service_tickets").select("*").order("created_at",{ascending:false}),
    supabaseClient.from("supply_purchases").select("*, suppliers(name)").order("purchase_date",{ascending:false}),
    supabaseClient.from("transactions").select("*").order("transaction_date",{ascending:false}),
    supabaseClient.from("support_tasks").select("*, employees!support_tasks_assigned_to_fkey(full_name)").order("created_at",{ascending:false}),
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
        deviceId:t.device_id||null,
        // Device fields — enable search by IMEI/serial and pre-populate edit form
        imei:dev?.imei||"",
        serialNumber:dev?.serial_number||"",
        color:dev?.color||"",
        accessories:dev?.accessories_received||"",
        physicalCondition:dev?.physical_condition||"",
        // Customer phone — enable search by phone number
        phone:cust?.phone||"",
      };
    }),
    supplies: (puRes.data||[]).map(p => ({
      id:p.id, date:p.purchase_date, supplier:p.suppliers?.name||"Sin proveedor",
      item:p.item_name, quantity:Number(p.quantity||0), total:Number(p.total_amount||0),
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
  renderFinance();
  renderReports();
  renderUsers();
  renderSupport();
  renderDiseno();
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
function branchProducts()      { return state.products.filter(p => p.branch === activeBranchId); }
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
const PTYPE_LABEL = { producto:"Vendible", refaccion:"Refacción", insumo:"Insumo" };

function renderProducts() {
  // Sync filter buttons
  document.querySelectorAll(".ptype-filter").forEach(b =>
    b.classList.toggle("is-active", b.dataset.ptype === productTypeFilter));

  const filtered = bySearch(branchProducts())
    .filter(p => productTypeFilter === "all" || p.productType === productTypeFilter);

  document.querySelector("#products-grid").innerHTML = filtered.map(p=>{
    const stock=Number(p.stock), min=Number(p.minStock);
    const pct=Math.min(100,Math.round((stock/Math.max(min*2,1))*100));
    const typeLabel = PTYPE_LABEL[p.productType] || p.productType || "Refacción";
    return `<article class="product-card">
      <div class="product-meta"><strong>${escapeHtml(p.name)}</strong><span class="${stock<=min&&min>0?"low-stock":"status ready"}">${stock<=min&&min>0?"Bajo":"OK"}</span></div>
      <div style="display:flex;gap:6px;align-items:center;font-size:11px;margin-bottom:2px">
        <span class="muted">${escapeHtml(p.sku||"")}${p.sku?" · ":""}${escapeHtml(p.category)}</span>
        <span style="background:rgba(255,255,255,.08);border-radius:4px;padding:1px 6px">${typeLabel}</span>
      </div>
      <div class="product-meta"><strong>${stock} piezas</strong><strong>${money.format(p.price)}</strong></div>
      <div class="stock-bar" aria-hidden="true"><span style="width:${pct}%"></span></div>
      <div class="action-row" style="margin-top:8px;justify-content:flex-end">
        <button class="mini-button" data-edit-product="${p.id}">Editar</button>
      </div>
    </article>`;
  }).join("")||emptyMessage("No hay productos en esta categoría.");
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
    try {
      await updateRemoteTicket(ticketId, { ...ticket, status: newStage });
      try { await reloadState(); } catch(e) { console.warn(e); }
      render();
    } catch(err) {
      if (idx !== -1) state.tickets[idx] = { ...state.tickets[idx], status: oldStatus };
      render();
      alert(`Error al mover ticket: ${err.message}`);
      return;
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
  return `<article class="ticket-card">
    <div class="ticket-topline"><span class="tracking-code">${escapeHtml(ticket.tracking)}</span><span class="branch-pill">${escapeHtml(ticket.branch)}</span></div>
    <div class="ticket-topline"><strong>${escapeHtml(ticket.client)}</strong><span class="muted">${escapeHtml(ticket.createdAt)}</span></div>
    <span class="muted">${escapeHtml(ticket.productName)}</span>
    <p>${escapeHtml(ticket.issue)}</p>
    ${repair > 0 ? `<div class="ticket-detail-grid"><span>Costo estimado</span><strong>${money.format(repair)}</strong></div>` : ""}
    <div class="ticket-actions">
      <button class="mini-button" data-print-ticket="${ticket.id}">Recibo</button>
      <button class="primary-action" style="font-size:12px;padding:5px 12px;min-height:0" data-approve-quote="${ticket.id}">✓ Aprobar</button>
      <button class="mini-button" data-edit-ticket="${ticket.id}">Editar</button>
      ${perms.canDeleteTickets?`<button class="mini-button danger-btn" data-delete-ticket="${ticket.id}">Eliminar</button>`:""}
    </div>
  </article>`;
}

async function approveQuoteToTicket(ticketId) {
  if (!confirm("¿Convertir esta cotización a ticket activo (Recibido)?")) return;
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
      alert(`Error: ${err.message}`); return;
    }
  }
  render();
  showToast("✓ Cotización aprobada — ticket movido a Recibido");
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
        <button class="mini-button" data-print-ticket="${ticket.id}" title="Recibo de servicio">Recibo ▾</button>
        <div class="print-menu" style="display:none;position:absolute;bottom:110%;left:0;background:var(--fz-surface,#1e1e2e);border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:4px;min-width:160px;z-index:50;box-shadow:0 8px 24px rgba(0,0,0,.4)">
          <button class="ghost-button" style="width:100%;text-align:left;padding:6px 10px;font-size:12px" data-print-recepcion="${ticket.id}">📋 Recepción</button>
          <button class="ghost-button" style="width:100%;text-align:left;padding:6px 10px;font-size:12px" data-print-pago="${ticket.id}">💳 Pago / Entrega</button>
          <button class="ghost-button" style="width:100%;text-align:left;padding:6px 10px;font-size:12px" data-print-garantia="${ticket.id}">🛡 Garantía</button>
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
      <td><button class="mini-button" data-edit-supply="${i.id}">Editar</button></td>
    </tr>
  `).join("")||tableEmpty(6);
}

let financePeriod = "month"; // "today" | "week" | "month" | "all"

function financeFilteredTxs() {
  const all   = branchTransactions();
  const today = dateStamp();
  if (financePeriod === "today") return all.filter(t => t.date === today);
  if (financePeriod === "week")  { const d=new Date(); d.setDate(d.getDate()-6); const s=d.toISOString().slice(0,10); return all.filter(t=>t.date>=s); }
  if (financePeriod === "month") { const s=today.slice(0,7)+"-01"; return all.filter(t=>t.date>=s); }
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

let reportsPeriod = "today"; // "today" | "week" | "month" | "all"

function reportDateRange() {
  const today = dateStamp();
  if (reportsPeriod === "today")  return [today, today];
  if (reportsPeriod === "week")   { const d=new Date(); d.setDate(d.getDate()-6); return [d.toISOString().slice(0,10), today]; }
  if (reportsPeriod === "month")  { return [today.slice(0,7)+"-01", today]; }
  return ["2000-01-01", today];
}

function renderReports() {
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
    try {
      await updateRemoteSupportTask(taskId, { ...task, status: newStatus });
      try { await reloadState(); } catch(e) { console.warn(e); }
      render();
    } catch(err) {
      if (idx !== -1) state.supportTasks[idx] = { ...task, status: oldStatus };
      render();
      alert(`Error al mover tarea: ${err.message}`);
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

  // Grid de herramientas por sucursal
  const grid = document.querySelector("#marketing-links-grid");
  if (grid && links.length) {
    grid.innerHTML = links.map(l => `
      <a class="marketing-card" href="${escapeHtml(l.url)}" target="_blank" rel="noopener">
        <div class="marketing-card-icon">${l.icon}</div>
        <strong>${escapeHtml(l.name)}</strong>
        <p>${escapeHtml(l.desc)}</p>
      </a>`).join("");
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

  renderDiscountManager();
  renderWATemplates();
}

// ── WhatsApp message templates ────────────────────────────────────────────────
function renderWATemplates() {
  const el = document.querySelector("#wa-templates-manager");
  if (!el) return;
  const tpls = getWATemplates();
  const LABELS = { listo:"✅ Equipo Listo", abono:"💳 Abono recibido", pagado:"✅ Pago completo", garantia:"🛡 Garantía" };
  const HINTS  = "{cliente} {equipo} {sucursal} {folio} {monto} {saldo}";
  el.innerHTML = `
    <div class="card" style="margin-top:16px">
      <div style="margin-bottom:16px">
        <h3 style="margin:0 0 4px;font-size:14px">Plantillas de WhatsApp</h3>
        <small class="muted">Variables disponibles: <code>${HINTS}</code></small>
      </div>
      ${Object.keys(LABELS).map(k=>`
        <div style="margin-bottom:14px">
          <label style="font-size:12px;font-weight:700;display:block;margin-bottom:4px">${LABELS[k]}</label>
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
}

// ── Discount codes (managed by Marketing, stored in localStorage) ─────────────
const DISCOUNTS_KEY  = "fixzone-discounts-v1";
const WA_TEMPLATES_KEY = "fixzone-wa-templates-v1";
const DEFAULT_WA_TEMPLATES = {
  listo:  "Hola {cliente} 👋, tu equipo *{equipo}* está listo para recoger en {sucursal}. Folio: {folio}. ¡Gracias por confiar en nosotros!",
  abono:  "Hola {cliente} 👋, recibimos tu abono de *{monto}*. Saldo pendiente: {saldo}. Folio: {folio}.",
  pagado: "Hola {cliente} 👋, tu pago de *{monto}* fue recibido. Tu equipo {equipo} está *PAGADO* ✅. Folio: {folio}. ¡Gracias!",
  garantia: "Hola {cliente} 👋, tu equipo {equipo} está en garantía. Folio: {folio}. Contáctanos para coordinar.",
};

function getWATemplates() {
  try { return { ...DEFAULT_WA_TEMPLATES, ...JSON.parse(localStorage.getItem(WA_TEMPLATES_KEY)||"{}") }; } catch { return DEFAULT_WA_TEMPLATES; }
}
function saveWATemplates(t) { localStorage.setItem(WA_TEMPLATES_KEY, JSON.stringify(t)); }
function fillWATemplate(key, vars) {
  const tpl = getWATemplates()[key] || DEFAULT_WA_TEMPLATES[key] || "";
  return tpl
    .replace(/{cliente}/g, vars.client||"")
    .replace(/{equipo}/g,  vars.productName||"")
    .replace(/{sucursal}/g,vars.branch||"")
    .replace(/{folio}/g,   vars.tracking||"")
    .replace(/{monto}/g,   vars.amount||"")
    .replace(/{saldo}/g,   vars.pending||"");
}

function getDiscounts() {
  try { return JSON.parse(localStorage.getItem(DISCOUNTS_KEY) || "[]"); } catch { return []; }
}
function saveDiscounts(list) { localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(list)); }

function applyDiscount(repairAmount, code) {
  const d = getDiscounts().find(x => x.code.toLowerCase() === (code||"").toLowerCase() && x.active);
  if (!d) return { amount: 0, pct: 0, label: "" };
  const pct = d.type === "pct" ? Number(d.value) : 0;
  const fixed = d.type === "fixed" ? Number(d.value) : 0;
  const amount = fixed + (repairAmount * pct / 100);
  return { amount: Math.min(amount, repairAmount), pct, label: d.description || d.code };
}

function renderDiscountManager() {
  const el = document.querySelector("#discount-manager");
  if (!el) return;
  const discounts = getDiscounts();
  el.innerHTML = `
    <div class="card" style="margin-top:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="margin:0;font-size:14px">Códigos de descuento</h3>
        <button class="primary-action" style="font-size:12px;padding:6px 14px" id="add-discount-btn">+ Nuevo código</button>
      </div>
      <div id="discounts-list">
        ${discounts.length ? discounts.map((d,i)=>`
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:13px">
            <span style="font-family:monospace;background:rgba(255,255,255,.08);padding:2px 8px;border-radius:4px;font-weight:700">${escapeHtml(d.code)}</span>
            <span style="flex:1">${escapeHtml(d.description||"")}</span>
            <span class="${d.type==="pct"?"type-income":"type-expense"}">${d.type==="pct"?d.value+"%":"$"+d.value}</span>
            <label style="display:flex;align-items:center;gap:4px;font-size:12px">
              <input type="checkbox" ${d.active?"checked":""} data-toggle-discount="${i}"> Activo
            </label>
            <button class="mini-button danger-btn" style="padding:2px 8px" data-delete-discount="${i}">✕</button>
          </div>`).join("") : `<p class="muted" style="font-size:13px">No hay códigos creados.</p>`}
      </div>
      <div id="new-discount-form" style="display:none;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.08)">
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
          <div class="field" style="margin:0;flex:1;min-width:120px"><label style="font-size:11px">Código</label>
            <input id="dc-code" type="text" placeholder="PROMO10" style="text-transform:uppercase;font-family:monospace" /></div>
          <div class="field" style="margin:0;width:110px"><label style="font-size:11px">Tipo</label>
            <select id="dc-type"><option value="pct">Porcentaje (%)</option><option value="fixed">Fijo ($)</option></select></div>
          <div class="field" style="margin:0;width:90px"><label style="font-size:11px">Valor</label>
            <input id="dc-value" type="number" min="1" placeholder="10" /></div>
          <div class="field" style="margin:0;flex:2;min-width:140px"><label style="font-size:11px">Descripción</label>
            <input id="dc-desc" type="text" placeholder="Descuento de temporada" /></div>
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
  el.querySelector("#save-discount-btn")?.addEventListener("click", () => {
    const code  = (el.querySelector("#dc-code").value||"").trim().toUpperCase();
    const type  = el.querySelector("#dc-type").value;
    const value = Number(el.querySelector("#dc-value").value||0);
    const desc  = el.querySelector("#dc-desc").value.trim();
    if (!code || value <= 0) { alert("Código y valor son requeridos."); return; }
    const list = getDiscounts();
    if (list.find(d=>d.code===code)) { alert("Ese código ya existe."); return; }
    list.push({ code, type, value, description: desc, active: true });
    saveDiscounts(list);
    renderDiscountManager();
  });
  el.querySelector("#discounts-list")?.addEventListener("change", e => {
    const idx = e.target.dataset.toggleDiscount;
    if (idx === undefined) return;
    const list = getDiscounts();
    list[idx].active = e.target.checked;
    saveDiscounts(list);
  });
  el.querySelector("#discounts-list")?.addEventListener("click", e => {
    const idx = e.target.dataset.deleteDiscount;
    if (idx === undefined) return;
    if (!confirm("¿Eliminar este código?")) return;
    const list = getDiscounts();
    list.splice(Number(idx), 1);
    saveDiscounts(list);
    renderDiscountManager();
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
  formFields.innerHTML = formSchemas["client"].fields.map(([name,label,ftype,opts,wide]) =>
    fieldTemplate(name, label, ftype, opts, wide, client[name] ?? "")
  ).join("");
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
  formFields.innerHTML = formSchemas["supportTasks"].fields.map(([name,label,ftype,opts,wide]) =>
    fieldTemplate(name, label, ftype, opts, wide, task[name] ?? "")
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
  formFields.innerHTML = formSchemas["product"].fields.map(([name,label,ftype,opts,wide]) =>
    fieldTemplate(name, label, ftype, opts, wide, product[name] ?? "")
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

// ── Edit: Supply ──────────────────────────────────────────────────────────────
function openEditSupply(supplyId) {
  const supply = branchSupplies().find(s => s.id === supplyId);
  if (!supply) return;
  activeForm      = "supply";
  editingTicketId = supplyId;
  modalTitle.textContent = "Editar compra";
  document.querySelector("#modal-eyebrow").textContent = "Editar registro";
  formFields.innerHTML = formSchemas["supply"].fields.map(([name,label,ftype,opts,wide]) =>
    fieldTemplate(name, label, ftype, opts, wide, supply[name] ?? "")
  ).join("");
  modal.showModal();
}

async function updateRemoteSupply(supplyId, data) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(supplyId);
  if (!isUUID) {
    const idx = state.supplies.findIndex(s => s.id === supplyId);
    if (idx !== -1) state.supplies[idx] = { ...state.supplies[idx], ...data };
    return;
  }
  const suppId = await findOrCreateSupplier(data.supplier);
  const { error } = await supabaseClient.from("supply_purchases").update({
    purchase_date: data.date,
    supplier_id:   suppId,
    item_name:     data.item,
    quantity:      Number(data.quantity || 0),
    total_amount:  Number(data.total || 0),
  }).eq("id", supplyId);
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
function openForm(type, prefill = {}) {
  activeForm      = type;
  editingTicketId = null;
  editingTaskId   = null;
  const schema = formSchemas[type];
  if (!schema) return;
  modalTitle.textContent = schema.title;
  document.querySelector("#modal-eyebrow").textContent = "Nuevo registro";
  formFields.innerHTML = schema.fields.map(([name,label,ftype,opts,wide]) => fieldTemplate(name,label,ftype,opts,wide,prefill[name])).join("");
  if (type==="ticket"||type==="product") {
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
  formFields.innerHTML = formSchemas["transaction"].fields.map(([name,label,ftype,opts,wide]) =>
    fieldTemplate(name, label, ftype, opts, wide, tx[name] ?? "")
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
  activeForm      = "ticket";
  editingTicketId = ticketId;
  modalTitle.textContent = `Editar ${ticket.tracking}`;
  document.querySelector("#modal-eyebrow").textContent = "Editar registro";
  formFields.innerHTML = formSchemas["ticket"].fields.map(([name,label,ftype,opts,wide]) =>
    fieldTemplate(name, label, ftype, opts, wide, ticket[name] ?? "")
  ).join("") + buildPhotoUploadSection(ticketId) + `<div id="ticket-parts-section"></div><div id="ticket-events-section"></div>`;
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
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">
        <div class="field" style="flex:2;margin:0"><label style="font-size:11px">Producto</label>
          <select id="part-product-sel" style="font-size:13px">${productOpts}</select>
        </div>
        <div class="field" style="width:80px;margin:0"><label style="font-size:11px">Cantidad</label>
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
    if (error) { alert(`Error: ${error.message}`); return; }
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

function fieldTemplate(name, label, ftype, opts, wide, defaultValue) {
  if (ftype==="select") {
    const options = (name==="branch_id") ? (state.branches||[]).map(b=>b.name) : (opts||[]);
    return `<div class="field ${wide?"is-wide":""}">
      <label for="${name}">${label}</label>
      <select id="${name}" name="${name}">
        ${options.map(o=>`<option value="${o}" ${o===defaultValue?"selected":""}>${name==="role"?(ROLE_LABELS[o]||o):o}</option>`).join("")}
      </select></div>`;
  }
  const val = defaultValue ?? (ftype==="date" ? new Date().toISOString().slice(0,10) : "");
  return `<div class="field ${wide?"is-wide":""}">
    <label for="${name}">${label}</label>
    <input id="${name}" name="${name}" type="${ftype}" value="${escapeHtml(String(val))}" required />
  </div>`;
}

recordForm.addEventListener("submit", async e => {
  e.preventDefault();
  setLoading(true, "Guardando…");
  const schema = formSchemas[activeForm];
  const data   = Object.fromEntries(new FormData(recordForm).entries());
  for (const [name,,ftype] of schema.fields) if (ftype==="number") data[name]=Number(data[name]||0);

  // ── EDIT: generic (client, supply, transaction) ────────────────
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
      }
      if (dataMode === "remote") await reloadState();
      else { /* local: already mutated in update functions */ saveState(); }
      render();
      modal.close();
    } catch(err) {
      console.error(err);
      alert(`No se pudo guardar: ${err.message}`);
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
      alert(`No se pudo guardar: ${err.message}`);
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
      alert(`No se pudo guardar: ${err.message}`);
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
      alert(`No se pudo guardar: ${err.message}`);
    }
    return;
  }

  // ── CREATE ─────────────────────────────────────────────────────────────────
  data.id = `${activeForm}-${Date.now()}`;

  if (activeForm==="ticket") {
    data.tracking      = nextTracking(nextTicketSequence());
    data.repairAmount  = Number(data.repairAmount||0);
    data.paidAmount    = Number(data.paidAmount||0);
    if (data.paymentStatus==="Pagado"&&data.paidAmount===0) data.paidAmount=data.repairAmount;
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
    alert(`No se pudo guardar: ${err.message}`);
  } finally {
    setLoading(false);
  }
});

// ── Edge function caller ──────────────────────────────────────────────────────
async function callEdgeFunction(action, payload) {
  const cfg = window.FIXZONE_SUPABASE;
  const url  = `${cfg.url}/functions/v1/create-employee`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${currentSession.access_token}`,
    },
    body: JSON.stringify({ action, payload }),
  });
  const result = await resp.json();
  if (!result.success) throw new Error(result.error||"Error en la función");
  return result;
}

async function deleteEmployee(employeeId) {
  if (!confirm("¿Dar de baja a este usuario? Se desactivará su acceso.")) return;
  try {
    if (dataMode==="remote") {
      await callEdgeFunction("delete", { employee_id: employeeId });
      await reloadState();
    } else {
      state.employees = state.employees.filter(e=>e.id!==employeeId);
      saveState();
    }
    render();
  } catch(err) { alert(`Error: ${err.message}`); }
}

async function resetEmployeePassword(employeeId) {
  if (!confirm("¿Resetear contraseña a 'miwaysillos05'? El usuario deberá cambiarla al iniciar sesión.")) return;
  try {
    if (dataMode==="remote") {
      await callEdgeFunction("reset_password", { employee_id: employeeId });
      alert("Contraseña reseteada correctamente.");
    } else {
      alert("Reset de contraseña solo disponible en modo Supabase.");
    }
  } catch(err) { alert(`Error: ${err.message}`); }
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
    assigned_employee_id:assignedE?.id||null, created_by:currentEmployeeId()
  }).select().single();
  if (error) throw error;

  // Create device record if any device fields were filled
  let deviceId = null;
  if (customer?.id && (r.imei||r.color||r.accessories||r.physicalCondition)) {
    const { data: dev } = await supabaseClient.from("customer_devices").insert({
      customer_id:          customer.id,
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
  };
  state.tickets = [mapped, ...state.tickets.filter(t=>t.id!==data.id)];
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
  }).eq("id", ticketId);
  if (error) throw error;

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
    if (customer?.id) {
      const { data: dev } = await supabaseClient.from("customer_devices").insert({
        customer_id:          customer.id,
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
}

async function updateRemoteTask(taskId, r) {
  const { error } = await supabaseClient.from("service_tasks").update({
    issue_description:    r.issue,
    stage:                r.status,
    priority:             r.priority,
  }).eq("id", taskId);
  if (error) throw error;
}

async function createRemoteSupply(r) {
  const suppId = await findOrCreateSupplier(r.supplier);
  const { error } = await supabaseClient.from("supply_purchases").insert({ supplier_id:suppId, branch_id:await branchIdByName(activeBranchId), purchase_date:r.date, item_name:r.item, quantity:r.quantity, total_amount:r.total, created_by:currentEmployeeId() });
  if (error) throw error;
  await createRemoteTransaction({ date:r.date, type:"Egreso", concept:`Compra: ${r.item}`, category:"Insumos", amount:r.total });
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
    alert(`No se pudo enviar, ni modillo: ${err.message}`);
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
    alert(`Error: ${err.message}`);
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
    alert(`No se pudo registrar el abono: ${err.message}`);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// EVENT LISTENERS
// ──────────────────────────────────────────────────────────────────────────────
document.querySelectorAll("[data-open-form]").forEach(btn => {
  btn.addEventListener("click", () => openForm(btn.dataset.openForm));
});

document.querySelector("#quick-ticket").addEventListener("click", () => openForm("ticket"));
document.querySelector("#new-quote-btn")?.addEventListener("click", () => {
  openForm("ticket", { status: "Cotizacion" });
  setTimeout(() => {
    const sel = document.querySelector("#status");
    if (sel) sel.value = "Cotizacion";
  }, 0);
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
  const printRec = e.target.closest("[data-print-recepcion]");
  if (printRec) { document.querySelectorAll(".print-menu").forEach(m=>m.style.display="none"); const t=state.tickets.find(i=>i.id===printRec.dataset.printRecepcion); if(t) printRecibo(t,"recepcion"); return; }
  const printPago = e.target.closest("[data-print-pago]");
  if (printPago) { document.querySelectorAll(".print-menu").forEach(m=>m.style.display="none"); const t=state.tickets.find(i=>i.id===printPago.dataset.printPago); if(t) printRecibo(t,"pago"); return; }
  const printGar = e.target.closest("[data-print-garantia]");
  if (printGar) { document.querySelectorAll(".print-menu").forEach(m=>m.style.display="none"); const t=state.tickets.find(i=>i.id===printGar.dataset.printGarantia); if(t) printRecibo(t,"garantia"); return; }

  // Abono
  const abonoBtn = e.target.closest("[data-abono-ticket]");
  if (abonoBtn) { openAbonoModal(abonoBtn.dataset.abonoTicket); return; }

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
    if (!confirm("¿Eliminar esta foto?")) return;
    const attachId = delPhoto.dataset.deletePhoto;
    const photoUrl = delPhoto.dataset.photoUrl;
    try {
      await supabaseClient.from("attachments").delete().eq("id", attachId);
      // Extract storage path from URL to delete from bucket
      const urlPath = new URL(photoUrl).pathname;
      const bucketIdx = urlPath.indexOf("/ticket-photos/");
      if (bucketIdx !== -1) {
        const storagePath = urlPath.slice(bucketIdx + "/ticket-photos/".length);
        await supabaseClient.storage.from("ticket-photos").remove([storagePath]);
      }
      delPhoto.closest("div").remove();
    } catch(err) { alert(`Error al eliminar foto: ${err.message}`); }
    return;
  }

  // Edit client
  const editClient = e.target.closest("[data-edit-client]");
  if (editClient) { openEditClient(editClient.dataset.editClient); return; }

  const editProduct = e.target.closest("[data-edit-product]");
  if (editProduct) { openEditProduct(editProduct.dataset.editProduct); return; }

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

async function handleDeleteTicket(id) {
  if (!confirm("¿Eliminar este ticket?")) return;
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
  } catch(err) { alert(`Error: ${err.message}`); }
}

async function handleDeleteClient(id) {
  if (!confirm("¿Eliminar este cliente y sus datos?")) return;
  try {
    if (dataMode==="remote") { const {error}=await supabaseClient.from("customers").delete().eq("id",id); if(error)throw error; await reloadState(); }
    else { state.clients=state.clients.filter(c=>c.id!==id); saveState(); }
    render();
  } catch(err) { alert(`Error: ${err.message}`); }
}

async function handleDeleteTransaction(id) {
  if (!confirm("¿Eliminar este movimiento financiero? Esta acción no se puede deshacer.")) return;
  try {
    if (dataMode==="remote") { const {error}=await supabaseClient.from("transactions").delete().eq("id",id); if(error)throw error; await reloadState(); }
    else { state.transactions=state.transactions.filter(t=>t.id!==id); saveState(); }
    render();
  } catch(err) { alert(`Error: ${err.message}`); }
}

async function handleDeleteTask(id) {
  if (!confirm("¿Eliminar esta tarea? Esta acción no se puede deshacer.")) return;
  try {
    if (dataMode==="remote") { const {error}=await supabaseClient.from("tasks").delete().eq("id",id); if(error)throw error; await reloadState(); }
    else { state.tasks=state.tasks.filter(t=>t.id!==id); saveState(); }
    render();
  } catch(err) { alert(`Error: ${err.message}`); }
}

document.querySelector("#seed-data")?.addEventListener("click", () => {
  if (dataMode==="remote") { alert("La demo solo se restaura en modo local."); return; }
  state=structuredClone(seed); saveState(); render();
});

searchInput.addEventListener("input", render);
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
  const receiptWidth = localStorage.getItem("fixzone-receipt-width") || "80mm";
  document.documentElement.style.setProperty("--receipt-width", receiptWidth);

  const header = `
    <div class="rct-logo"><img src="${brand.logoMonoSrc||brand.logoSrc}" alt="${brand.displayName}" onerror="this.src='${brand.logoSrc}'"/></div>
    <p class="rct-dash">${D}</p>
    <p class="rct-center rct-title">${{recepcion:"RECIBO DE RECEPCIÓN",pago:"COMPROBANTE DE PAGO",garantia:"CERTIFICADO DE GARANTÍA"}[type]}</p>
    <p class="rct-dash">${D}</p>
    <p class="rct-row"><strong>FOLIO:</strong> <span>${escapeHtml(ticket.tracking)}</span></p>
    <p class="rct-row"><strong>FECHA:</strong> <span>${escapeHtml(ticket.createdAt||dateStamp())} ${timeStr}</span></p>
    <p class="rct-row"><strong>SUCURSAL:</strong> <span>${escapeHtml(brand.displayName)}</span></p>
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
      <div class="rct-sign"><div class="rct-sign-line"></div><p>FIRMA — PAGO RECIBIDO CONFORME</p></div>`;
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
  window.print();
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
  const receiptWidth = localStorage.getItem("fixzone-receipt-width") || "80mm";
  document.documentElement.style.setProperty("--receipt-width", receiptWidth);
  window.print();
  // Show size toggle in a small floating bar before print dialog
}

// Expose receipt size toggle so it can be called from the header/receipt area
window.setReceiptWidth = function(w) {
  localStorage.setItem("fixzone-receipt-width", w);
  document.documentElement.style.setProperty("--receipt-width", w);
  showToast(`✓ Tamaño de recibo: ${w}`);
};

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
function dateStamp()        { return new Date().toISOString().slice(0,10); }
function escapeHtml(v)      { return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }

// ──────────────────────────────────────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────────────────────────────────────

// ── applyBranchBrand — aplica colores, logo, nombre y fondos al DOM ──────────
function applyBranchBrand(branchName) {
  const brand = window.getBranchBrand(branchName);
  if (!brand) return;

  // Variables CSS en :root
  const root = document.documentElement;
  for (const [key, val] of Object.entries(brand.colors)) {
    root.style.setProperty(key, val);
  }

  // Clase de marca en <body>
  document.body.classList.remove("brand-fixzone", "brand-refaxzone");
  document.body.classList.add(brand.brandClass);

  // Título de pestaña
  document.title = brand.pageTitle;

  // Top accent bar — 3px colored stripe at the top of the topbar
  let bar = document.querySelector("#brand-accent-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "brand-accent-bar";
    bar.style.cssText = "position:fixed;top:0;left:0;right:0;height:3px;z-index:9999;transition:background .3s";
    document.body.prepend(bar);
  }
  bar.style.background = `linear-gradient(90deg, var(--fz-primary), var(--fz-secondary,var(--fz-primary)))`;

  // Update sidebar-footer branch indicator dot color
  const dot = document.querySelector(".sidebar-footer .dot, #branch-dot");
  if (dot) dot.style.background = brand.colors["--fz-primary"] || "#2F6FFF";

  // Sidebar: logo, nombre, label
  const brandLogoImg = document.querySelector(".brand img");
  const brandNameEl  = document.querySelector(".brand strong");
  const brandLabelEl = document.querySelector(".brand span");
  if (brandLogoImg) {
    brandLogoImg.src = brand.logoSrc;
    brandLogoImg.alt = brand.displayName;
    if (brand.logoFallback) {
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
  favicon.href = brand.logoSrc;
}

// ── Section tooltips ─────────────────────────────────────────────────────────
const NAV_TOOLTIPS = {
  dashboard:      "Vista general: métricas del día, tickets activos y movimientos recientes.",
  cotizaciones:   "Presupuestos pendientes de aprobación. Aprueba para convertir en ticket.",
  clients:        "Registro de clientes y sus equipos. Busca por nombre, teléfono o IMEI.",
  products:       "Inventario de refacciones, accesorios y productos vendibles.",
  tickets:        "Kanban de reparaciones. Arrastra las cards para cambiar el stage.",
  supplies:       "Compras de insumos y materiales. Se registran como egreso automáticamente.",
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
      tooltip.style.cssText = "position:fixed;left:260px;background:#1a1a2e;color:#e0e0e0;border:1px solid rgba(255,255,255,.15);border-radius:6px;padding:8px 12px;font-size:11px;line-height:1.5;max-width:220px;z-index:9999;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.5)";
      const rect = btn.getBoundingClientRect();
      tooltip.style.top = `${rect.top}px`;
      document.body.appendChild(tooltip);
    });
    btn.addEventListener("mouseleave", () => { tooltip?.remove(); tooltip = null; });
  });
}

async function initializeApp() {
  loadSavedPermissions();
  applyBranchBrand(activeBranchId);
  setupSupabase();
  initNavTooltips();
  await refreshSession();
}

initializeApp();