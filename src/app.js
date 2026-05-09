// ──────────────────────────────────────────────────────────────────────────────
// FixZone CRM — app.js
// ──────────────────────────────────────────────────────────────────────────────

const storageKey   = "fixzone-crm-v1";
const money        = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const ticketStages = ["Cotizacion", "Recibido", "En reparacion", "Listo", "Entregado", "Garantia"];
const supportStages = ["Pendiente", "En progreso", "Resuelto"];
const BRANCHES     = ["Puerto Vallarta", "Puebla"];
const ROLES        = ["it", "admin", "standard", "marketing"];
const ROLE_LABELS  = { it: "IT", admin: "Admin", standard: "Estándar", marketing: "Marketing" };

// ── Role permission map ───────────────────────────────────────────────────────
const PERMISSIONS = {
  it:        { tabs: ["dashboard","clients","products","tickets","supplies","finance","reports","users","soporte"], canDeleteClients: true, canDeleteTickets: true, canManageUsers: true, canManageFinance: true, canExportXLS: true },
  admin:     { tabs: ["dashboard","clients","products","tickets","supplies","finance","reports","users"],           canDeleteClients: true, canDeleteTickets: true, canManageUsers: true, canManageFinance: true, canExportXLS: true },
  standard:  { tabs: ["dashboard","clients","products","tickets","supplies","finance","reports"],                  canDeleteClients: false, canDeleteTickets: true, canManageUsers: false, canManageFinance: false, canExportXLS: true },
  marketing: { tabs: ["dashboard","clients","tickets","diseno","automatizacion"],                                  canDeleteClients: false, canDeleteTickets: false, canManageUsers: false, canManageFinance: false, canExportXLS: false },
};

let activeBranchId  = "Puerto Vallarta";
let activeForm      = null;
let editingTicketId = null;
let dataMode        = "local";
let supabaseClient = null;
let currentSession = null;
let currentEmployee = null; // { id, full_name, email, role, default_branch_id, force_password_change }
let lookups        = { branchesByName: new Map(), employeesByName: new Map(), employeesByEmail: new Map(), customersByName: new Map() };

// ── Seed data (local fallback) ────────────────────────────────────────────────
const employees = ["Kevin Mijangos","Carlos Mijangos","Gigi Vargas","Monica Torres","Diego Mijangos","Daniel Mijangos"];

const seed = {
  clients: [
    { id:"c-1", name:"Monica Torres",  phone:"55 4180 2291", email:"monica@email.com",  device:"iPhone 14 Pro",    lastVisit:"2026-05-01", status:"Activo"   },
    { id:"c-2", name:"Carlos Medina",  phone:"55 8102 4488", email:"carlos@email.com",  device:"Samsung S23",      lastVisit:"2026-04-29", status:"Garantia" },
    { id:"c-3", name:"Ana Ruiz",       phone:"55 7201 8890", email:"ana@email.com",     device:"MacBook Air M2",   lastVisit:"2026-04-27", status:"Nuevo"    },
  ],
  branches:  BRANCHES.map((name, i) => ({ id:`b-${i+1}`, name })),
  employees: employees.map((name, i) => ({ id:`e-${i+1}`, name, role: i===3?"it":"admin", status:"active" })),
  products: [
    { id:"p-1", name:"Pantalla iPhone 13",  sku:"P-IPH13-OLED", category:"Refaccion",     stock:8,  minStock:4,  price:1850, branch:"Puerto Vallarta" },
    { id:"p-2", name:"Bateria Samsung A54", sku:"B-SAMA54",      category:"Bateria",       stock:3,  minStock:5,  price:620,  branch:"Puerto Vallarta" },
    { id:"p-3", name:"Mica premium",        sku:"ACC-MICA-01",   category:"Accesorio",     stock:42, minStock:15, price:180,  branch:"Puebla"          },
    { id:"p-4", name:"Conector USB-C",      sku:"R-USBC-10",     category:"Microsoldadura",stock:11, minStock:8,  price:95,   branch:"Puebla"          },
  ],
  tickets: [
    { id:"t-1", tracking:"[FZ] 0001", client:"Monica Torres", productName:"iPhone 14 Pro",    issue:"Cambio de pantalla y prueba Face ID",       status:"En reparacion", priority:"Alta",   repairAmount:3200, paymentStatus:"Abonado",  paidAmount:1500, branch:"Puerto Vallarta", assignedTo:"Kevin Mijangos",   createdAt:"2026-05-04" },
    { id:"t-2", tracking:"[FZ] 0002", client:"Carlos Medina", productName:"Samsung S23",      issue:"Revision por garantia de bateria",           status:"Garantia",      priority:"Media",  repairAmount:0,    paymentStatus:"Pagado",   paidAmount:0,    branch:"Puebla",          assignedTo:"Carlos Mijangos",  createdAt:"2026-05-03" },
    { id:"t-3", tracking:"[FZ] 0003", client:"Ana Ruiz",      productName:"MacBook Air M2",   issue:"Limpieza interna y diagnostico de carga",   status:"Listo",         priority:"Normal", repairAmount:850,  paymentStatus:"Pagado",   paidAmount:850,  branch:"Puerto Vallarta", assignedTo:"Gigi Vargas",      createdAt:"2026-05-02" },
    { id:"t-4", tracking:"[FZ] 0004", client:"Luis Ortega",   productName:"iPad 9",           issue:"Cristal roto",                              status:"Recibido",      priority:"Normal", repairAmount:1600, paymentStatus:"Pendiente", paidAmount:0,    branch:"Puebla",          assignedTo:"Daniel Mijangos",  createdAt:"2026-05-01" },
  ],
  supplies: [
    { id:"s-1", date:"2026-05-01", supplier:"TecnoPartes MX", item:"Pantallas OLED",  quantity:5,  total:7200 },
    { id:"s-2", date:"2026-04-28", supplier:"MicroTools",     item:"Puntas cautin",   quantity:12, total:980  },
  ],
  transactions: [
    { id:"m-1", date:"2026-05-04", type:"Ingreso", concept:"Anticipo ticket t-1",   category:"Servicio",   amount:1500 },
    { id:"m-2", date:"2026-05-03", type:"Egreso",  concept:"Compra de insumos",      category:"Inventario", amount:7200 },
    { id:"m-3", date:"2026-05-02", type:"Ingreso", concept:"Limpieza MacBook",       category:"Servicio",   amount:850  },
    { id:"m-4", date:"2026-05-01", type:"Egreso",  concept:"Renta local",            category:"Operacion",  amount:4800 },
  ],
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
      ["device","Equipo","text"],["lastVisit","Ultima visita","date"],
      ["status","Estado","select",["Nuevo","Activo","Garantia","Inactivo"]],
    ],
  },
  product: {
    title: "Producto", collection: "products",
    fields: [
      ["branch","Sucursal","select",BRANCHES],["name","Nombre","text"],["sku","SKU","text"],
      ["category","Categoria","text"],["stock","Stock","number"],["minStock","Minimo","number"],["price","Precio","number"],
    ],
  },
  ticket: {
    title: "Ticket", collection: "tickets",
    fields: [
      ["client","Cliente","text"],["productName","Producto / equipo","text"],["issue","Falla / trabajo","text",null,true],
      ["branch","Sucursal","select",BRANCHES],["assignedTo","Empleado","select",employees],
      ["status","Stage","select",ticketStages],["priority","Prioridad","select",["Normal","Media","Alta","Urgente"]],
      ["repairAmount","Monto reparacion","number"],["paymentStatus","Pago","select",["Pendiente","Abonado","Pagado"]],
      ["paidAmount","Monto pagado","number"],["createdAt","Fecha","date"],
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
      ["concept","Concepto","text",null,true],["category","Categoria","text"],["amount","Monto","number"],
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
  supportTask: {
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
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
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

async function afterLogin() {
  try {
    await resolveCurrentEmployee();
    if (currentEmployee?.force_password_change) {
      showChangePasswordScreen();
      return;
    }
    state = await loadSupabaseState();
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
  let loginEl = document.querySelector("#login-screen");
  if (!loginEl) {
    loginEl = document.createElement("div");
    loginEl.id = "login-screen";
    document.body.appendChild(loginEl);
  }
  loginEl.style.display = "flex";
  loginEl.innerHTML = `
    <div class="login-card">
      <div class="login-brand">
        <img src="./assets/brand/fixzone-logo.png" alt="FixZone" onerror="this.style.display='none'" />
        <h1>FIXZONE</h1>
        <p>CRM OPERATIVO</p>
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
      <p class="login-footer">Acceso restringido · Solo empleados FixZone</p>
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
  el.style.display = "flex";
  el.innerHTML = `
    <div class="login-card">
      <div class="login-brand">
        <img src="./assets/brand/fixzone-logo.png" alt="FixZone" onerror="this.style.display='none'" />
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
    state = await loadSupabaseState();
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
  for (const d of deviceRows) if (!deviceByCustomer.has(d.customer_id)) deviceByCustomer.set(d.customer_id,d);

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
      branch:branchRows.find(b=>b.id===p.branch_id)?.name||BRANCHES[0],
    })),
    tickets: (tRes.data||[]).map(t => ({
      id:t.id, tracking:t.tracking_number, client:t.customer_name, productName:t.product_name,
      issue:t.issue_description, status:t.stage, priority:t.priority,
      repairAmount:Number(t.repair_amount||0), paymentStatus:t.payment_status, paidAmount:Number(t.paid_amount||0),
      branch:branchRows.find(b=>b.id===t.branch_id)?.name||BRANCHES[0],
      assignedTo:employeeRows.find(e=>e.id===t.assigned_employee_id)?.full_name||"",
      createdAt:(t.created_at||t.received_at||"").slice(0,10),
    })),
    supplies: (puRes.data||[]).map(p => ({
      id:p.id, date:p.purchase_date, supplier:p.suppliers?.name||"Sin proveedor",
      item:p.item_name, quantity:Number(p.quantity||0), total:Number(p.total_amount||0),
      branch:branchRows.find(b=>b.id===p.branch_id)?.name||"",
    })),
    transactions: (txRes.data||[]).map(t => ({
      id:t.id, date:t.transaction_date, type:t.type, concept:t.concept,
      category:t.category, amount:Number(t.amount||0),
      branch:branchRows.find(b=>b.id===t.branch_id)?.name||"",
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
  renderSupplies();
  renderFinance();
  renderReports();
  renderUsers();
  renderSupport();
  document.querySelector("#record-count").textContent = `${totalRecords()} registros`;
}

function totalRecords() {
  return Object.values(state).reduce((s,r) => s+(Array.isArray(r)?r.length:0), 0);
}

function bySearch(items) {
  const term = searchInput.value.trim().toLowerCase();
  return term ? items.filter(i => Object.values(i).join(" ").toLowerCase().includes(term)) : items;
}

function branchTickets()       { return state.tickets.filter(t => t.branch === activeBranchId); }
function branchProducts()      { return state.products.filter(p => p.branch === activeBranchId); }
function branchClients()       { return state.clients.filter(c => !c.branch || c.branch === activeBranchId); }
function branchSupplies()      { return state.supplies.filter(s => !s.branch || s.branch === activeBranchId); }
function branchTransactions()  { return state.transactions.filter(t => !t.branch || t.branch === activeBranchId); }
function sumByType(list, type) { return list.filter(i=>i.type===type).reduce((s,i)=>s+Number(i.amount||0),0); }

function renderMetrics() {
  const branchTxs   = branchTransactions();
  const income      = sumByType(branchTxs,"Ingreso");
  const expenses    = sumByType(branchTxs,"Egreso");
  const openTickets = branchTickets().filter(t=>t.status!=="Entregado").length;
  const lowStock    = branchProducts().filter(p=>Number(p.stock)<=Number(p.minStock)).length;

  document.querySelector("#metric-grid").innerHTML = [
    ["Clientes",branchClients().length],["Tickets abiertos",openTickets],
    ["Balance",money.format(income-expenses)],["Stock bajo",lowStock],
  ].map(([l,v])=>`<article class="metric"><span>${l}</span><strong>${v}</strong></article>`).join("");

  document.querySelector("#active-ticket-list").innerHTML = branchTickets()
    .filter(t=>t.status!=="Entregado").slice(0,5).map(ticketCard).join("")||emptyMessage("No hay tickets activos.");

  document.querySelector("#recent-activity").innerHTML = branchTransactions()
    .slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6)
    .map(item=>`
      <div class="activity-item">
        <div><strong>${item.concept}</strong><br><span class="muted">${item.date} · ${item.category}</span></div>
        <span class="type-pill ${item.type==="Ingreso"?"type-income":"type-expense"}">${item.type==="Ingreso"?"+":"-"}${money.format(item.amount)}</span>
      </div>`).join("");
}

function renderClients() {
  const perms = currentPerms();
  document.querySelector("#clients-table").innerHTML = bySearch(branchClients()).map(c=>`
    <tr>
      <td><strong>${c.name}</strong><br><span class="muted">${c.email}</span></td>
      <td>${c.phone}</td><td>${c.device}</td><td>${c.lastVisit}</td>
      <td><span class="status">${c.status}</span></td>
      <td>
        ${perms.canDeleteClients ? `<button class="mini-button danger-btn" data-delete-client="${c.id}">Eliminar</button>` : ""}
      </td>
    </tr>`).join("")||tableEmpty(6);
}

function renderProducts() {
  document.querySelector("#products-grid").innerHTML = bySearch(branchProducts()).map(p=>{
    const stock=Number(p.stock), min=Number(p.minStock);
    const pct=Math.min(100,Math.round((stock/Math.max(min*2,1))*100));
    return `<article class="product-card">
      <div class="product-meta"><strong>${p.name}</strong><span class="${stock<=min?"low-stock":"status ready"}">${stock<=min?"Bajo":"OK"}</span></div>
      <span>${p.sku} · ${p.category}</span>
      <div class="product-meta"><strong>${stock} piezas</strong><strong>${money.format(p.price)}</strong></div>
      <div class="stock-bar" aria-hidden="true"><span style="width:${pct}%"></span></div>
    </article>`;
  }).join("")||emptyMessage("No hay productos registrados.");
}

function renderTickets() {
  const perms = currentPerms();
  document.querySelector("#ticket-board").innerHTML = ticketStages.map(status=>{
    const tickets = bySearch(branchTickets()).filter(t=>t.status===status);
    return `<section class="kanban-column">
      <h3>${status} <span>${tickets.length}</span></h3>
      <div class="ticket-stack">${tickets.map(t=>ticketCard(t,perms)).join("")||emptyMessage("Sin tickets.")}</div>
    </section>`;
  }).join("");
}

function ticketCard(ticket, perms) {
  perms = perms || currentPerms();
  const paid   = ticket.paymentStatus==="Pagado";
  const repair = Number(ticket.repairAmount??ticket.total??0);
  const paidAmt= Number(ticket.paidAmount??(paid?repair:0));
  return `<article class="ticket-card">
    <div class="ticket-topline"><span class="tracking-code">${escapeHtml(ticket.tracking)}</span><span class="branch-pill">${escapeHtml(ticket.branch)}</span></div>
    <div class="ticket-topline"><strong>${escapeHtml(ticket.client)}</strong><span class="status ${ticket.priority==="Urgente"||ticket.priority==="Alta"?"urgent":""}">${ticket.priority}</span></div>
    <span class="muted">${escapeHtml(ticket.productName||ticket.device)}</span>
    <p>${escapeHtml(ticket.issue)}</p>
    <div class="ticket-detail-grid">
      <span>Reparacion</span><strong>${money.format(repair)}</strong>
      <span>Pago</span><strong class="${paid?"paid-amount":""}">${paid?money.format(paidAmt):escapeHtml(ticket.paymentStatus)}</strong>
    </div>
    <div class="ticket-topline">
      <span class="status ${ticket.status==="Listo"||ticket.status==="Entregado"?"ready":ticket.status==="Cotizacion"?"waiting":ticket.status==="Garantia"?"warranty":""}">${ticket.status}</span>
      <small class="muted">${escapeHtml(ticket.assignedTo)}</small>
    </div>
    <div class="ticket-actions">
      <button class="mini-button" data-print-ticket="${ticket.id}">Recibo</button>
      <button class="mini-button" data-edit-ticket="${ticket.id}">Editar</button>
      ${perms.canDeleteTickets?`<button class="mini-button danger-btn" data-delete-ticket="${ticket.id}">Eliminar</button>`:""}
    </div>
  </article>`;
}

function renderSupplies() {
  document.querySelector("#supplies-table").innerHTML = bySearch(branchSupplies()).map(i=>`
    <tr><td>${i.date}</td><td>${i.supplier}</td><td>${i.item}</td><td>${i.quantity}</td><td><strong>${money.format(i.total)}</strong></td></tr>
  `).join("")||tableEmpty(5);
}

function renderFinance() {
  const txs     = branchTransactions();
  const income  = sumByType(txs,"Ingreso");
  const expenses= sumByType(txs,"Egreso");
  const bal     = income-expenses;
  const perms   = currentPerms();

  document.querySelector("#finance-summary").innerHTML = [
    ["Ingresos",money.format(income)],["Egresos",money.format(expenses)],
    ["Balance",money.format(bal)],["Margen",income?`${Math.round((bal/income)*100)}%`:"0%"],
  ].map(([l,v])=>`<article class="metric"><span>${l}</span><strong>${v}</strong></article>`).join("");

  document.querySelector("#transactions-table").innerHTML = bySearch(txs).map(i=>`
    <tr>
      <td>${i.date}</td>
      <td><span class="type-pill ${i.type==="Ingreso"?"type-income":"type-expense"}">${i.type}</span></td>
      <td>${i.concept}</td><td>${i.category}</td>
      <td><strong>${money.format(i.amount)}</strong></td>
      <td>${perms.canManageFinance?`<button class="mini-button danger-btn" data-delete-tx="${i.id}">Eliminar</button>`:""}
    </tr>`).join("")||tableEmpty(6);
}

function renderReports() {
  const bTickets   = branchTickets();
  const bSupplies  = branchSupplies();
  const finished   = bTickets.filter(t=>["Listo","Entregado"].includes(t.status)).length;
  const revenue    = bTickets.reduce((s,t)=>s+Number(t.repairAmount??t.total??0),0);
  const invValue   = branchProducts().reduce((s,p)=>s+Number(p.price||0)*Number(p.stock||0),0);
  const lastSupply = bSupplies.slice().sort((a,b)=>b.date.localeCompare(a.date))[0];

  document.querySelector("#reports-grid").innerHTML = [
    ["Servicios cerrados",finished,"Tickets listos o entregados"],
    ["Valor inventario",money.format(invValue),"Refacciones y accesorios"],
    ["Venta potencial",money.format(revenue),"Total registrado en tickets"],
    ["Ultima compra",lastSupply?lastSupply.supplier:"Sin compras",lastSupply?money.format(lastSupply.total):"0"],
  ].map(([l,v,n])=>`<article class="report-card"><span>${l}</span><strong>${v}</strong><p class="muted">${n}</p></article>`).join("");
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
}

// ── Support Kanban ────────────────────────────────────────────────────────────
function renderSupport() {
  const board = document.querySelector("#support-board");
  if (!board) return;
  board.innerHTML = supportStages.map(status=>{
    const tasks = bySearch(state.supportTasks||[]).filter(t=>t.status===status);
    return `<section class="kanban-column">
      <h3>${status} <span>${tasks.length}</span></h3>
      <div class="ticket-stack">${tasks.map(supportTaskCard).join("")||emptyMessage("Sin tareas.")}</div>
    </section>`;
  }).join("");
}

function supportTaskCard(task) {
  return `<article class="ticket-card">
    <div class="ticket-topline">
      <span class="status ${task.priority==="Urgente"||task.priority==="Alta"?"urgent":task.status==="Resuelto"?"ready":""}">${task.priority}</span>
      <small class="muted">${escapeHtml(task.createdAt||"")}</small>
    </div>
    <strong>${escapeHtml(task.title)}</strong>
    <p class="muted">${escapeHtml(task.description||"")}</p>
    <div class="ticket-topline">
      <span class="status ${task.status==="Resuelto"?"ready":task.status==="En progreso"?"":""}">${task.status}</span>
      <small class="muted">${escapeHtml(task.assignedTo||"")}</small>
    </div>
  </article>`;
}

// ──────────────────────────────────────────────────────────────────────────────
// FORMS
// ──────────────────────────────────────────────────────────────────────────────
function openForm(type, prefill = {}) {
  activeForm      = type;
  editingTicketId = null;
  const schema = formSchemas[type];
  if (!schema) return;
  modalTitle.textContent = schema.title;
  document.querySelector("#modal-eyebrow").textContent = "Nuevo registro";
  formFields.innerHTML = schema.fields.map(([name,label,ftype,opts,wide]) => fieldTemplate(name,label,ftype,opts,wide,prefill[name])).join("");
  if (type==="ticket"||type==="product") {
    const sel = formFields.querySelector("#branch");
    if (sel) sel.value = activeBranchId;
  }
  modal.showModal();
}

function openEditTicket(ticketId) {
  const ticket = state.tickets.find(t => t.id === ticketId);
  if (!ticket) return;
  activeForm      = "ticket";
  editingTicketId = ticketId;
  modalTitle.textContent = `Editar ${ticket.tracking}`;
  document.querySelector("#modal-eyebrow").textContent = "Editar registro";
  formFields.innerHTML = formSchemas["ticket"].fields.map(([name,label,ftype,opts,wide]) => {
    return fieldTemplate(name, label, ftype, opts, wide, ticket[name] ?? "");
  }).join("");
  modal.showModal();
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
  const schema = formSchemas[activeForm];
  const data   = Object.fromEntries(new FormData(recordForm).entries());
  for (const [name,,ftype] of schema.fields) if (ftype==="number") data[name]=Number(data[name]||0);

  // ── EDIT TICKET ────────────────────────────────────────────────────────────
  if (activeForm === "ticket" && editingTicketId) {
    data.repairAmount = Number(data.repairAmount||0);
    data.paidAmount   = Number(data.paidAmount||0);
    if (data.paymentStatus==="Pagado" && data.paidAmount===0) data.paidAmount = data.repairAmount;
    try {
      if (dataMode==="remote") {
        await updateRemoteTicket(editingTicketId, data);
        state = await loadSupabaseState();
      } else {
        const idx = state.tickets.findIndex(t => t.id === editingTicketId);
        if (idx !== -1) state.tickets[idx] = { ...state.tickets[idx], ...data };
        saveState();
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
      } else if (activeForm==="supportTask") {
        await saveRemoteSupportTask(data);
      } else {
        await saveRemoteRecord(activeForm, data);
      }
      state = await loadSupabaseState();
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
      state = await loadSupabaseState();
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
function branchIdByName(name) { return lookups.branchesByName.get(name)?.id||null; }

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
    branch_id:branchIdByName(activeBranchId), created_by:currentEmployeeId()
  }).select().single();
  if (error) throw error;
  if (r.device) { const { error:de } = await supabaseClient.from("customer_devices").insert({ customer_id:c.id, product_name:r.device }); if(de) throw de; }
}

async function createRemoteProduct(r) {
  const { error } = await supabaseClient.from("products").insert({ name:r.name, sku:r.sku, category:r.category, stock:r.stock, min_stock:r.minStock, sale_price:r.price, branch_id:branchIdByName(r.branch) });
  if (error) throw error;
}

async function createRemoteTicket(r) {
  const customer  = lookups.customersByName.get(r.client);
  const assignedE = lookups.employeesByName.get(r.assignedTo);
  const { error } = await supabaseClient.from("service_tickets").insert({ customer_id:customer?.id||null, customer_name:r.client, product_name:r.productName, issue_description:r.issue, stage:r.status, priority:r.priority, repair_amount:r.repairAmount, payment_status:r.paymentStatus, paid_amount:r.paidAmount, branch_id:branchIdByName(r.branch), assigned_employee_id:assignedE?.id||null, created_by:currentEmployeeId() });
  if (error) throw error;
}

async function createRemoteSupply(r) {
  const suppId = await findOrCreateSupplier(r.supplier);
  const { data:p, error } = await supabaseClient.from("supply_purchases").insert({ supplier_id:suppId, branch_id:branchIdByName(activeBranchId), purchase_date:r.date, item_name:r.item, quantity:r.quantity, total_amount:r.total, created_by:currentEmployeeId() }).select().single();
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
  const { error } = await supabaseClient.from("transactions").insert({
    branch_id:branchIdByName(activeBranchId),
    transaction_date:r.date, type:r.type, concept:r.concept,
    category:r.category, amount:r.amount, created_by:currentEmployeeId()
  });
  if (error) throw error;
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
      state = await loadSupabaseState();
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
    showToast(`✓ Solicitud enviada a IT · ${type}`);
  } catch(err) {
    alert(`No se pudo enviar: ${err.message}`);
  } finally {
    btn.textContent = "Enviar a IT";
    btn.disabled    = false;
  }
});
 
function showToast(message) {
  const existing = document.querySelector(".help-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className   = "help-toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ──────────────────────────────────────────────────────────────────────────────
// EVENT LISTENERS
// ──────────────────────────────────────────────────────────────────────────────
document.querySelectorAll("[data-open-form]").forEach(btn => {
  btn.addEventListener("click", () => openForm(btn.dataset.openForm));
});

document.querySelector("#quick-ticket").addEventListener("click", () => openForm("ticket"));
document.querySelector("#close-modal").addEventListener("click",  () => modal.close());
document.querySelector("#cancel-record").addEventListener("click",() => modal.close());

document.querySelector("#logout-button").addEventListener("click", async () => {
  if (supabaseClient) await supabaseClient.auth.signOut();
  currentEmployee = null;
  currentSession  = null;
  dataMode        = "local";
  state           = loadState();
  document.querySelector("#logout-button").classList.add("is-hidden");
  document.querySelector(".app-shell").style.display = "none";
  showLoginScreen();
});

document.querySelectorAll("[data-view], [data-view-target]").forEach(btn => {
  btn.addEventListener("click", () => setView(btn.dataset.view||btn.dataset.viewTarget));
});

document.querySelector("#export-data").addEventListener("click",  () => exportWorkbook());
document.querySelectorAll("[data-export-sheet]").forEach(btn => {
  btn.addEventListener("click", () => exportWorkbook(btn.dataset.exportSheet));
});

// Delegated clicks
document.addEventListener("click", e => {
  // Print ticket
  const printBtn = e.target.closest("[data-print-ticket]");
  if (printBtn) { const t = state.tickets.find(i=>i.id===printBtn.dataset.printTicket); if(t) printTicket(t); return; }

  // Delete ticket
  const delTicket = e.target.closest("[data-delete-ticket]");
  if (delTicket) { handleDeleteTicket(delTicket.dataset.deleteTicket); return; }

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

  // View navigation from dashboard
  const viewBtn = e.target.closest("[data-view-target]");
  if (viewBtn) { setView(viewBtn.dataset.viewTarget); return; }
});

async function handleDeleteTicket(id) {
  if (!confirm("¿Eliminar este ticket?")) return;
  try {
    if (dataMode==="remote") { const {error}=await supabaseClient.from("service_tickets").delete().eq("id",id); if(error)throw error; state=await loadSupabaseState(); }
    else { state.tickets=state.tickets.filter(t=>t.id!==id); saveState(); }
    render();
  } catch(err) { alert(`Error: ${err.message}`); }
}

async function handleDeleteClient(id) {
  if (!confirm("¿Eliminar este cliente y sus datos?")) return;
  try {
    if (dataMode==="remote") { const {error}=await supabaseClient.from("customers").delete().eq("id",id); if(error)throw error; state=await loadSupabaseState(); }
    else { state.clients=state.clients.filter(c=>c.id!==id); saveState(); }
    render();
  } catch(err) { alert(`Error: ${err.message}`); }
}

async function handleDeleteTransaction(id) {
  if (!confirm("¿Eliminar este movimiento financiero? Esta acción no se puede deshacer.")) return;
  try {
    if (dataMode==="remote") { const {error}=await supabaseClient.from("transactions").delete().eq("id",id); if(error)throw error; state=await loadSupabaseState(); }
    else { state.transactions=state.transactions.filter(t=>t.id!==id); saveState(); }
    render();
  } catch(err) { alert(`Error: ${err.message}`); }
}

document.querySelector("#seed-data")?.addEventListener("click", () => {
  if (dataMode==="remote") { alert("La demo solo se restaura en modo local."); return; }
  state=structuredClone(seed); saveState(); render();
});

searchInput.addEventListener("input", render);

// ──────────────────────────────────────────────────────────────────────────────
// BRANCH TABS
// ──────────────────────────────────────────────────────────────────────────────
function setActiveBranch(name) {
  activeBranchId = name;
  document.querySelectorAll(".branch-tab").forEach(btn => {
    btn.classList.toggle("is-active", btn.textContent.trim()===name);
  });
  render();
}
window.setActiveBranch = setActiveBranch;

// ──────────────────────────────────────────────────────────────────────────────
// PRINT / EXPORT
// ──────────────────────────────────────────────────────────────────────────────
function printTicket(ticket) {
  const client      = state.clients.find(c=>c.name.toLowerCase()===ticket.client.toLowerCase());
  const repairAmt   = Number(ticket.repairAmount??ticket.total??0);
  const paidAmt     = Number(ticket.paidAmount??0);
  const paid        = ticket.paymentStatus==="Pagado";
  const paidLabel   = paid ? money.format(paidAmt||repairAmt) : escapeHtml(ticket.paymentStatus);
  const qrTarget    = receiptQrTarget();
  const qrImage     = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=12&data=${encodeURIComponent(qrTarget)}`;

  document.querySelector("#print-receipt").innerHTML = `
    <article class="receipt-page">
      <header class="receipt-hero">
        <div class="receipt-brand-home"><img src="./assets/brand/fixzone-logo.png" alt="FixZone" /></div>
        <div class="receipt-title">
          <span>RECIBO DE SERVICIO</span>
          <h1>${escapeHtml(ticket.tracking||ticket.id.toUpperCase())}</h1>
          <p>${escapeHtml(ticket.createdAt||dateStamp())}</p>
        </div>
      </header>
      <section class="receipt-strip">
        <div><span>Sucursal</span><strong>${escapeHtml(ticket.branch||"FixZone")}</strong></div>
        <div><span>Atendio</span><strong>${escapeHtml(ticket.assignedTo||"Equipo FixZone")}</strong></div>
        <div><span>Estado</span><strong>${escapeHtml(ticket.status)}</strong></div>
      </section>
      <div class="receipt-grid">
        <section class="receipt-box">
          <h2>Cliente</h2>
          <strong>${escapeHtml(ticket.client)}</strong>
          <span>${escapeHtml(client?.phone||"Telefono no registrado")}</span>
          <span>${escapeHtml(client?.email||"Email no registrado")}</span>
        </section>
        <section class="receipt-box">
          <h2>Producto / equipo</h2>
          <strong>${escapeHtml(ticket.productName||ticket.device)}</strong>
          <span>Prioridad: ${escapeHtml(ticket.priority||"Normal")}</span>
          <span>Pago: ${paidLabel}</span>
        </section>
      </div>
      <table class="receipt-table">
        <thead><tr><th>Descripcion del servicio</th><th>Importe</th></tr></thead>
        <tbody><tr><td>${escapeHtml(ticket.issue)}</td><td>${money.format(repairAmt)}</td></tr></tbody>
      </table>
      <section class="receipt-summary">
        <div><span>Total</span><strong>${money.format(repairAmt)}</strong></div>
        <div><span>Pagado</span><strong>${paidLabel}</strong></div>
      </section>
      <section class="receipt-footer-grid">
        <p class="receipt-note">Gracias por confiar en FixZone. Conserve este recibo para seguimiento, garantia o aclaraciones.</p>
        <div class="receipt-qr"><img src="${qrImage}" alt="QR" /><strong>Escanea aqui</strong><span>${escapeHtml(qrTarget)}</span></div>
        <div class="receipt-signature"><span></span><strong>Firma de recibido</strong></div>
      </section>
    </article>`;
  window.print();
}

function receiptQrTarget() {
  const base = location.protocol==="file:" ? "https://fixzone-crm.pages.dev" : location.origin;
  return `${base}/detente-jochis.html`;
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
async function initializeApp() {
  setupSupabase();
  await refreshSession();
}

initializeApp();