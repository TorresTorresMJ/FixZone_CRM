const storageKey = "fixzone-crm-v1";
const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const ticketStages = ["Cotizacion", "Recibido", "En reparacion", "Listo", "Entregado", "Garantia"];
const branches = ["Puerto Vallarta", "Puebla"];
let activeBranchId = "Puerto Vallarta"; //Default
const employees = [
  "Kevin Mijangos",
  "Carlos Mijangos",
  "Gigi Vargas",
  "Monica Torres",
  "Diego Mijangos",
  "Daniel Mijangos"
];
const localModeLabel = " ";
const remoteModeLabel = "Supabase";

const seed = {
  clients: [
    { id: "c-1", name: "Monica Torres", phone: "55 4180 2291", email: "monica@email.com", device: "iPhone 14 Pro", lastVisit: "2026-05-01", status: "Activo" },
    { id: "c-2", name: "Carlos Medina", phone: "55 8102 4488", email: "carlos@email.com", device: "Samsung S23", lastVisit: "2026-04-29", status: "Garantia" },
    { id: "c-3", name: "Ana Ruiz", phone: "55 7201 8890", email: "ana@email.com", device: "MacBook Air M2", lastVisit: "2026-04-27", status: "Nuevo" }
  ],
  branches: branches.map((name, index) => ({ id: `b-${index + 3}`, name })),
  products: [
    { id: "p-1", name: "Pantalla iPhone 13", sku: "P-IPH13-OLED", category: "Refaccion", stock: 8, minStock: 4, price: 1850, branch: "Puerto Vallarta" },
    { id: "p-2", name: "Bateria Samsung A54", sku: "B-SAMA54", category: "Bateria", stock: 3, minStock: 5, price: 620, branch: "Puerto Vallarta" },
    { id: "p-3", name: "Mica premium", sku: "ACC-MICA-01", category: "Accesorio", stock: 42, minStock: 15, price: 180, branch: "Puebla" },
    { id: "p-4", name: "Conector USB-C", sku: "R-USBC-10", category: "Microsoldadura", stock: 11, minStock: 8, price: 95, branch: "Puebla" }
  ],
  branches: branches.map((name, index) => ({ id: `b-${index + 1}`, name })),
  employees: employees.map((name, index) => ({ id: `e-${index + 1}`, name, role: index === 3 ? "owner" : "staff", status: "active" })),
  tickets: [
    { id: "t-1", tracking: "[FZ] 0001", client: "Monica Torres", productName: "iPhone 14 Pro", issue: "Cambio de pantalla y prueba Face ID", status: "En reparacion", priority: "Alta", repairAmount: 3200, paymentStatus: "Abonado", paidAmount: 1500, branch: "Puerto Vallarta", assignedTo: "Kevin Mijangos", createdAt: "2026-05-04" },
    { id: "t-2", tracking: "[FZ] 0002", client: "Carlos Medina", productName: "Samsung S23", issue: "Revision por garantia de bateria", status: "Garantia", priority: "Media", repairAmount: 0, paymentStatus: "Pagado", paidAmount: 0, branch: "Puebla", assignedTo: "Carlos Mijangos", createdAt: "2026-05-03" },
    { id: "t-3", tracking: "[FZ] 0003", client: "Ana Ruiz", productName: "MacBook Air M2", issue: "Limpieza interna y diagnostico de carga", status: "Listo", priority: "Normal", repairAmount: 850, paymentStatus: "Pagado", paidAmount: 850, branch: "Puerto Vallarta", assignedTo: "Gigi Vargas", createdAt: "2026-05-02" },
    { id: "t-4", tracking: "[FZ] 0004", client: "Luis Ortega", productName: "iPad 9", issue: "Cristal roto", status: "Recibido", priority: "Normal", repairAmount: 1600, paymentStatus: "Pendiente", paidAmount: 0, branch: "Puebla", assignedTo: "Daniel Mijangos", createdAt: "2026-05-01" }
  ],
  supplies: [
    { id: "s-1", date: "2026-05-01", supplier: "TecnoPartes MX", item: "Pantallas OLED", quantity: 5, total: 7200 },
    { id: "s-2", date: "2026-04-28", supplier: "MicroTools", item: "Puntas cautin", quantity: 12, total: 980 }
  ],
  transactions: [
    { id: "m-1", date: "2026-05-04", type: "Ingreso", concept: "Anticipo ticket t-1", category: "Servicio", amount: 1500 },
    { id: "m-2", date: "2026-05-03", type: "Egreso", concept: "Compra de insumos", category: "Inventario", amount: 7200 },
    { id: "m-3", date: "2026-05-02", type: "Ingreso", concept: "Limpieza MacBook", category: "Servicio", amount: 850 },
    { id: "m-4", date: "2026-05-01", type: "Egreso", concept: "Renta local", category: "Operacion", amount: 4800 }
  ]
};

let state = loadState();
let activeForm = null;
let dataMode = "local";
let supabaseClient = null;
let currentSession = null;
let lookups = {
  branchesByName: new Map(),
  employeesByName: new Map(),
  employeesByEmail: new Map(),
  customersByName: new Map()
};

const views = document.querySelectorAll(".view");
const navItems = document.querySelectorAll(".nav-item");
const modal = document.querySelector("#record-modal");
const recordForm = document.querySelector("#record-form");
const formFields = document.querySelector("#form-fields");
const modalTitle = document.querySelector("#modal-title");
const searchInput = document.querySelector("#global-search");
const authStatus = document.querySelector("#auth-status");
const logoutButton = document.querySelector("#logout-button");

const formSchemas = {
  client: {
    title: "Cliente",
    collection: "clients",
    fields: [
      ["name", "Nombre", "text"], ["phone", "Telefono", "tel"], ["email", "Email", "email"],
      ["device", "Equipo", "text"], ["lastVisit", "Ultima visita", "date"], ["status", "Estado", "select", ["Nuevo", "Activo", "Garantia", "Inactivo"]]
    ]
  },
  product: {
    title: "Producto",
    collection: "products",
    fields: [
      ["branch", "Sucursal", "select", branches], ["name", "Nombre", "text"], ["sku", "SKU", "text"], ["category", "Categoria", "text"],
      ["stock", "Stock", "number"], ["minStock", "Minimo", "number"], ["price", "Precio", "number"]
    ]
  },
  ticket: {
    title: "Ticket",
    collection: "tickets",
    fields: [
      ["client", "Cliente", "text"], ["productName", "Producto / equipo", "text"], ["issue", "Falla / trabajo", "text", null, true],
      ["branch", "Sucursal", "select", branches], ["assignedTo", "Empleado", "select", employees],
      ["status", "Stage", "select", ticketStages],
      ["priority", "Prioridad", "select", ["Normal", "Media", "Alta", "Urgente"]],
      ["repairAmount", "Monto reparacion", "number"], ["paymentStatus", "Pago", "select", ["Pendiente", "Abonado", "Pagado"]],
      ["paidAmount", "Monto pagado", "number"], ["createdAt", "Fecha", "date"]
    ]
  },
  supply: {
    title: "Compra de insumo",
    collection: "supplies",
    fields: [
      ["date", "Fecha", "date"], ["supplier", "Proveedor", "text"], ["item", "Insumo", "text"],
      ["quantity", "Cantidad", "number"], ["total", "Total", "number"]
    ]
  },
  transaction: {
    title: "Movimiento",
    collection: "transactions",
    fields: [
      ["date", "Fecha", "date"], ["type", "Tipo", "select", ["Ingreso", "Egreso"]],
      ["concept", "Concepto", "text", null, true], ["category", "Categoria", "text"], ["amount", "Monto", "number"]
    ]
  }
};

function loadState() {
  const saved = localStorage.getItem(storageKey);
  return normalizeState(saved ? JSON.parse(saved) : structuredClone(seed));
}

function saveState() {
  if (dataMode === "local") {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }
}

function normalizeState(data) {
  const next = { ...structuredClone(seed), ...data };
  const stageMap = {
    "En proceso": "En reparacion",
    "En espera": "Cotizacion"
  };

  next.branches = next.branches?.length ? next.branches : structuredClone(seed.branches);
  next.employees = next.employees?.length ? next.employees : structuredClone(seed.employees);
  next.tickets = next.tickets.map((ticket, index) => ({
    ...ticket,
    tracking: ticket.tracking || nextTracking(index + 1),
    productName: ticket.productName || ticket.device || "Equipo sin nombre",
    status: stageMap[ticket.status] || ticket.status || "Recibido",
    repairAmount: Number(ticket.repairAmount ?? ticket.total ?? 0),
    paymentStatus: ticket.paymentStatus || (Number(ticket.paidAmount || 0) > 0 ? "Abonado" : "Pendiente"),
    paidAmount: Number(ticket.paidAmount ?? 0),
    branch: ticket.branch || branches[0],
    assignedTo: ticket.assignedTo || employees[0]
  }));
  localStorage.setItem(storageKey, JSON.stringify(next));
  return next;
}

function nextTracking(sequence) {
  return `[FZ] ${String(sequence).padStart(4, "0")}`;
}

function nextTicketSequence() {
  const sequences = state.tickets
    .map((ticket) => Number(String(ticket.tracking || "").replace(/\D/g, "")))
    .filter(Boolean);
  return Math.max(0, ...sequences) + 1;
}

function bySearch(items) {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) return items;
  return items.filter((item) => Object.values(item).join(" ").toLowerCase().includes(term));
}

async function initializeApp() {
  setupSupabase();
  await refreshSession();
  render();
}

function setupSupabase() {
  const config = window.FIXZONE_SUPABASE;
  if (!window.supabase || !config?.url || !config?.anonKey) {
    setAuthUi(localModeLabel, false);
    return;
  }

  supabaseClient = window.supabase.createClient(config.url, config.anonKey);
  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentSession = session;
    await loadRemoteOrLocal();
    render();
  });
}

async function refreshSession() {
  if (!supabaseClient) {
    setAuthUi(localModeLabel, false);
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  currentSession = data.session;
  await loadRemoteOrLocal();
}

async function loadRemoteOrLocal() {
  if (!currentSession) {
    dataMode = "local";
    state = loadState();
    setAuthUi(localModeLabel, false);
    return;
  }

  try {
    state = await loadSupabaseState();
    dataMode = "remote";
    setAuthUi(`${remoteModeLabel}: ${currentSession.user.email}`, true);
  } catch (error) {
    console.error(error);
    dataMode = "local";
    state = loadState();
    setAuthUi("Sin acceso en Supabase", false);
  }
}

function setAuthUi(label, signedIn) {
  authStatus.textContent = signedIn ? label : " ";
  logoutButton.classList.toggle("is-hidden", !signedIn);
  document.querySelector(".sidebar-footer span").textContent = signedIn ? "Base Supabase activa" : "Base local activa";
}

async function loadSupabaseState() {
  const [
    branchesResult,
    employeesResult,
    customersResult,
    devicesResult,
    productsResult,
    ticketsResult,
    purchasesResult,
    transactionsResult
  ] = await Promise.all([
    supabaseClient.from("branches").select("*").order("name"),
    supabaseClient.from("employees").select("*").order("full_name"),
    supabaseClient.from("customers").select("*").order("created_at", { ascending: false }),
    supabaseClient.from("customer_devices").select("*").order("created_at", { ascending: false }),
    supabaseClient.from("products").select("*").order("name"),
    supabaseClient.from("service_tickets").select("*").order("created_at", { ascending: false }),
    supabaseClient.from("supply_purchases").select("*, suppliers(name)").order("purchase_date", { ascending: false }),
    supabaseClient.from("transactions").select("*").order("transaction_date", { ascending: false })
  ]);

  const firstError = [branchesResult, employeesResult, customersResult, devicesResult, productsResult, ticketsResult, purchasesResult, transactionsResult]
    .find((result) => result.error)?.error;
  if (firstError) throw firstError;

  const branchRows = branchesResult.data || [];
  const employeeRows = employeesResult.data || [];
  const customerRows = customersResult.data || [];
  const deviceRows = devicesResult.data || [];

  lookups = {
    branchesByName: new Map(branchRows.map((branch) => [branch.name, branch])),
    employeesByName: new Map(employeeRows.map((employee) => [employee.full_name, employee])),
    employeesByEmail: new Map(employeeRows.map((employee) => [employee.email, employee])),
    customersByName: new Map(customerRows.map((customer) => [customer.full_name, customer]))
  };

  const deviceByCustomer = new Map();
  for (const device of deviceRows) {
    if (!deviceByCustomer.has(device.customer_id)) deviceByCustomer.set(device.customer_id, device);
  }

  return {
    branches: branchRows.map((branch) => ({ id: branch.id, name: branch.name })),
    employees: employeeRows.map((employee) => ({ id: employee.id, name: employee.full_name, role: employee.role, status: employee.status })),
    clients: customerRows.map((customer) => {
      const device = deviceByCustomer.get(customer.id);
      return {
        id: customer.id,
        name: customer.full_name,
        phone: customer.phone || "",
        email: customer.email || "",
        device: device?.product_name || "",
        lastVisit: (customer.updated_at || customer.created_at || "").slice(0, 10),
        status: "Activo"
      };
    }),
    products: (productsResult.data || []).map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku || "",
      category: product.category,
      stock: Number(product.stock || 0),
      minStock: Number(product.min_stock || 0),
      price: Number(product.sale_price || product.unit_cost || 0),
      branch: branchRows.find((branch) => branch.id === product.branch_id)?.name || branches[0]
    })),
    tickets: (ticketsResult.data || []).map((ticket) => ({
      id: ticket.id,
      tracking: ticket.tracking_number,
      client: ticket.customer_name,
      productName: ticket.product_name,
      issue: ticket.issue_description,
      status: ticket.stage,
      priority: ticket.priority,
      repairAmount: Number(ticket.repair_amount || 0),
      paymentStatus: ticket.payment_status,
      paidAmount: Number(ticket.paid_amount || 0),
      branch: branchRows.find((branch) => branch.id === ticket.branch_id)?.name || branches[0],
      assignedTo: employeeRows.find((employee) => employee.id === ticket.assigned_employee_id)?.full_name || employees[0],
      createdAt: (ticket.created_at || ticket.received_at || "").slice(0, 10)
    })),
    supplies: (purchasesResult.data || []).map((purchase) => ({
      id: purchase.id,
      date: purchase.purchase_date,
      supplier: purchase.suppliers?.name || "Sin proveedor",
      item: purchase.item_name,
      quantity: Number(purchase.quantity || 0),
      total: Number(purchase.total_amount || 0)
    })),
    transactions: (transactionsResult.data || []).map((transaction) => ({
      id: transaction.id,
      date: transaction.transaction_date,
      type: transaction.type,
      concept: transaction.concept,
      category: transaction.category,
      amount: Number(transaction.amount || 0)
    }))
  };
}

function setView(name) {
  views.forEach((view) => view.classList.toggle("is-visible", view.id === `${name}-view`));
  navItems.forEach((item) => item.classList.toggle("is-active", item.dataset.view === name));
  const view = document.querySelector(`#${name}-view`);
  document.querySelector("#view-title").textContent = view?.dataset.title || "Home";
}

function render() {
  renderMetrics();
  renderClients();
  renderProducts();
  renderTickets();
  renderSupplies();
  renderFinance();
  renderReports();
  document.querySelector("#record-count").textContent = `${totalRecords()} registros`;
}

function totalRecords() {
  return Object.values(state).reduce((sum, records) => sum + (Array.isArray(records) ? records.length : 0), 0);
}

function branchTickets() {
  return state.tickets.filter((ticket) => ticket.branch === activeBranchId);
}

function branchProducts() {
  return state.products.filter((product) => product.branch === activeBranchId);
}

function branchTransactions() {
  return state.transactions.filter((t) => t.branch === activeBranchId);
}

function sumByType(txList, type) {
  return txList
    .filter((item) => item.type === type)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function renderMetrics() {
  const branchTxs = branchTransactions();
  const income = sumByType(branchTxs, "Ingreso");
  const expenses = sumByType(branchTxs, "Egreso");
  const openTickets = branchTickets().filter((ticket) => ticket.status !== "Entregado").length;
  const lowStock = state.products.filter((product) => Number(product.stock) <= Number(product.minStock)).length;

  document.querySelector("#metric-grid").innerHTML = [
    ["Clientes", state.clients.length],
    ["Tickets abiertos", openTickets],
    ["Balance", money.format(income - expenses)],
    ["Stock bajo", lowStock]
  ].map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`).join("");

  document.querySelector("#active-ticket-list").innerHTML = branchTickets()
    .filter((ticket) => ticket.status !== "Entregado")
    .slice(0, 5)
    .map(ticketCard)
    .join("") || emptyMessage("No hay tickets activos.");

const productList = document.querySelector("#active-product-list");
if (productList) {
  productList.innerHTML = branchProducts()
    .filter((product) => product.status !== "Disponible")
    .slice(0, 5)
    .map(productCard)
    .join("") || emptyMessage("No hay productos activos.");
}

  document.querySelector("#recent-activity").innerHTML = branchTransactions()
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)
    .map((item) => `
      <div class="activity-item">
        <div><strong>${item.concept}</strong><br><span class="muted">${item.date} - ${item.category}</span></div>
        <span class="type-pill ${item.type === "Ingreso" ? "type-income" : "type-expense"}">${item.type === "Ingreso" ? "+" : "-"}${money.format(item.amount)}</span>
      </div>
    `).join("");
}

function renderClients() {
  document.querySelector("#clients-table").innerHTML = bySearch(state.clients).map((client) => `
    <tr>
      <td><strong>${client.name}</strong><br><span class="muted">${client.email}</span></td>
      <td>${client.phone}</td>
      <td>${client.device}</td>
      <td>${client.lastVisit}</td>
      <td><span class="status">${client.status}</span></td>
    </tr>
  `).join("") || tableEmpty(5);
}

function renderProducts() {
  document.querySelector("#products-grid").innerHTML = bySearch(branchProducts()).map((product) => {
    const stock = Number(product.stock);
    const min = Number(product.minStock);
    const percent = Math.min(100, Math.round((stock / Math.max(min * 2, 1)) * 100));
    return `
      <article class="product-card">
        <div class="product-meta">
          <strong>${product.name}</strong>
          <span class="${stock <= min ? "low-stock" : "status ready"}">${stock <= min ? "Bajo" : "OK"}</span>
        </div>
        <span>${product.sku} - ${product.category}</span>
        <div class="product-meta"><strong>${stock} piezas</strong><strong>${money.format(product.price)}</strong></div>
        <div class="stock-bar" aria-hidden="true"><span style="width:${percent}%"></span></div>
      </article>
    `;
  }).join("") || emptyMessage("No hay productos registrados.");
}

function renderTickets() {
  document.querySelector("#ticket-board").innerHTML = ticketStages.map((status) => {
    const tickets = bySearch(branchTickets()).filter((ticket) => ticket.status === status);
    return `
      <section class="kanban-column">
        <h3>${status} <span>${tickets.length}</span></h3>
        <div class="ticket-stack">${tickets.map(ticketCard).join("") || emptyMessage("Sin tickets.")}</div>
      </section>
    `;
  }).join("");
}

function ticketCard(ticket) {
  const paid = ticket.paymentStatus === "Pagado";
  const repairAmount = Number(ticket.repairAmount ?? ticket.total ?? 0);
  const paidAmount = Number(ticket.paidAmount ?? (paid ? repairAmount : 0));
  return `
    <article class="ticket-card">
      <div class="ticket-topline">
        <span class="tracking-code">${escapeHtml(ticket.tracking)}</span>
        <span class="branch-pill">${escapeHtml(ticket.branch)}</span>
      </div>
      <div class="ticket-topline">
        <strong>${escapeHtml(ticket.client)}</strong>
        <span class="status ${ticket.priority === "Urgente" || ticket.priority === "Alta" ? "urgent" : ""}">${ticket.priority}</span>
      </div>
      <span class="muted">${escapeHtml(ticket.productName || ticket.device)}</span>
      <p>${escapeHtml(ticket.issue)}</p>
      <div class="ticket-detail-grid">
        <span>Reparacion</span>
        <strong>${money.format(repairAmount)}</strong>
        <span>Pago</span>
        <strong class="${paid ? "paid-amount" : ""}">${paid ? money.format(paidAmount) : escapeHtml(ticket.paymentStatus)}</strong>
      </div>
      <div class="ticket-topline">
        <span class="status ${ticket.status === "Listo" || ticket.status === "Entregado" ? "ready" : ticket.status === "Cotizacion" ? "waiting" : ticket.status === "Garantia" ? "warranty" : ""}">${ticket.status}</span>
        <small class="muted">${escapeHtml(ticket.assignedTo)}</small>
      </div>
      <div class="ticket-actions">
        <button class="mini-button" data-print-ticket="${ticket.id}">Imprimir recibo</button>
      </div>
    </article>
  `;
}

function renderSupplies() {
  document.querySelector("#supplies-table").innerHTML = bySearch(state.supplies).map((item) => `
    <tr>
      <td>${item.date}</td>
      <td>${item.supplier}</td>
      <td>${item.item}</td>
      <td>${item.quantity}</td>
      <td><strong>${money.format(item.total)}</strong></td>
    </tr>
  `).join("") || tableEmpty(5);
}

function renderFinance() {
  const branchTxs = branchTransactions();
  const income = sumByType(branchTxs, "Ingreso");
  const expenses = sumByType(branchTxs, "Egreso");
  const balance = income - expenses;
  document.querySelector("#finance-summary").innerHTML = [
    ["Ingresos", money.format(income)],
    ["Egresos", money.format(expenses)],
    ["Balance", money.format(balance)],
    ["Margen", income ? `${Math.round((balance / income) * 100)}%` : "0%"]
  ].map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`).join("");

  document.querySelector("#transactions-table").innerHTML = bySearch(branchTransactions()).map((item) => `
    <tr>
      <td>${item.date}</td>
      <td><span class="type-pill ${item.type === "Ingreso" ? "type-income" : "type-expense"}">${item.type}</span></td>
      <td>${item.concept}</td>
      <td>${item.category}</td>
      <td><strong>${money.format(item.amount)}</strong></td>
    </tr>
  `).join("") || tableEmpty(5);
}

function renderReports() {
  const bTickets = branchTickets();
  const bSupplies = state.supplies.filter((s) => !s.branch || s.branch === activeBranchId);
  const finished = bTickets.filter((ticket) => ["Listo", "Entregado"].includes(ticket.status)).length;
  const ticketRevenue = bTickets.reduce((sum, ticket) => sum + Number(ticket.repairAmount ?? ticket.total ?? 0), 0);
  const inventoryValue = state.products.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.stock || 0), 0);
  const lastSupply = bSupplies.slice().sort((a, b) => b.date.localeCompare(a.date))[0];

  document.querySelector("#reports-grid").innerHTML = [
    ["Servicios cerrados", finished, "Tickets listos o entregados"],
    ["Valor inventario", money.format(inventoryValue), "Refacciones y accesorios"],
    ["Venta potencial", money.format(ticketRevenue), "Total registrado en tickets"],
    ["Ultima compra", lastSupply ? lastSupply.supplier : "Sin compras", lastSupply ? money.format(lastSupply.total) : "0"]
  ].map(([label, value, note]) => `
    <article class="report-card">
      <span>${label}</span>
      <strong>${value}</strong>
      <p class="muted">${note}</p>
    </article>
  `).join("");
}

function sumTransactions(type) {
  return state.transactions
    .filter((item) => item.type === type)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function openForm(type) {
  activeForm = type;
  const schema = formSchemas[type];
  modalTitle.textContent = schema.title;
  formFields.innerHTML = schema.fields.map(([name, label, fieldType, options, wide]) => fieldTemplate(name, label, fieldType, options, wide)).join("");

  // Pre-select active branch in ticket form
  if (type === "ticket") {
    const branchSelect = formFields.querySelector("#branch");
    if (branchSelect) branchSelect.value = activeBranchId;
  }

    // Pre-select active branch in product form
  if (type === "product") {
    const branchSelect = formFields.querySelector("#branch");
    if (branchSelect) branchSelect.value = activeBranchId;
  }

  modal.showModal();
}

function fieldTemplate(name, label, fieldType, options, wide) {
  if (fieldType === "select") {
    return `
      <div class="field ${wide ? "is-wide" : ""}">
        <label for="${name}">${label}</label>
        <select id="${name}" name="${name}" required>
          ${options.map((option) => `<option value="${option}">${option}</option>`).join("")}
        </select>
      </div>
    `;
  }

  const value = fieldType === "date" ? new Date().toISOString().slice(0, 10) : "";
  return `
    <div class="field ${wide ? "is-wide" : ""}">
      <label for="${name}">${label}</label>
      <input id="${name}" name="${name}" type="${fieldType}" value="${value}" required />
    </div>
  `;
}

recordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const schema = formSchemas[activeForm];
  const formData = new FormData(recordForm);
  const record = Object.fromEntries(formData.entries());
  record.id = `${activeForm}-${Date.now()}`;

  for (const [name, , fieldType] of schema.fields) {
    if (fieldType === "number") record[name] = Number(record[name] || 0);
  }

  if (activeForm === "ticket") {
    record.tracking = nextTracking(nextTicketSequence());
    record.repairAmount = Number(record.repairAmount || 0);
    record.paidAmount = Number(record.paidAmount || 0);
    if (record.paymentStatus === "Pagado" && record.paidAmount === 0) {
      record.paidAmount = record.repairAmount;
    }
  }

  try {
    if (dataMode === "remote") {
      await saveRemoteRecord(activeForm, record);
      state = await loadSupabaseState();
    } else {
      state[schema.collection].unshift(record);
      if (activeForm === "supply") {
        state.transactions.unshift({
          id: `transaction-${Date.now()}`,
          date: record.date,
          type: "Egreso",
          concept: `Compra: ${record.item}`,
          category: "Insumos",
          amount: Number(record.total || 0)
        });
      }
      saveState();
    }

    render();
    modal.close();
  } catch (error) {
    console.error(error);
    alert(`No se pudo guardar: ${error.message}`);
  }
});

async function saveRemoteRecord(type, record) {
  if (type === "client") return createRemoteClient(record);
  if (type === "product") return createRemoteProduct(record);
  if (type === "ticket") return createRemoteTicket(record);
  if (type === "supply") return createRemoteSupply(record);
  if (type === "transaction") return createRemoteTransaction(record);
  throw new Error("Tipo de registro no soportado.");
}

function currentEmployeeId() {
  return lookups.employeesByEmail.get(currentSession?.user?.email)?.id || null;
}

function branchIdByName(name) {
  return lookups.branchesByName.get(name)?.id || null;
}

async function createRemoteClient(record) {
  const { data: customer, error } = await supabaseClient
    .from("customers")
    .insert({
      full_name: record.name,
      phone: record.phone,
      email: record.email,
      branch_id: branchIdByName(branches[0]),
      created_by: currentEmployeeId()
    })
    .select()
    .single();
  if (error) throw error;

  if (record.device) {
    const { error: deviceError } = await supabaseClient.from("customer_devices").insert({
      customer_id: customer.id,
      product_name: record.device
    });
    if (deviceError) throw deviceError;
  }
}

async function createRemoteProduct(record) {
  const { error } = await supabaseClient.from("products").insert({
    name: record.name,
    sku: record.sku,
    category: record.category,
    stock: record.stock,
    min_stock: record.minStock,
    sale_price: record.price,
    branch_id: branchIdByName(branches[0])
  });
  if (error) throw error;
}

async function createRemoteTicket(record) {
  const customer = lookups.customersByName.get(record.client);
  const assignedEmployee = lookups.employeesByName.get(record.assignedTo);
  const { error } = await supabaseClient.from("service_tickets").insert({
    customer_id: customer?.id || null,
    customer_name: record.client,
    product_name: record.productName,
    issue_description: record.issue,
    stage: record.status,
    priority: record.priority,
    repair_amount: record.repairAmount,
    payment_status: record.paymentStatus,
    paid_amount: record.paidAmount,
    branch_id: branchIdByName(record.branch),
    assigned_employee_id: assignedEmployee?.id || null,
    created_by: currentEmployeeId()
  });
  if (error) throw error;
}

async function createRemoteSupply(record) {
  const supplierId = await findOrCreateSupplier(record.supplier);
  const { data: purchase, error } = await supabaseClient
    .from("supply_purchases")
    .insert({
      supplier_id: supplierId,
      branch_id: branchIdByName(branches[0]),
      purchase_date: record.date,
      item_name: record.item,
      quantity: record.quantity,
      total_amount: record.total,
      created_by: currentEmployeeId()
    })
    .select()
    .single();
  if (error) throw error;

  await createRemoteTransaction({
    date: record.date,
    type: "Egreso",
    concept: `Compra: ${record.item}`,
    category: "Insumos",
    amount: record.total,
    purchaseId: purchase.id
  });
}

async function findOrCreateSupplier(name) {
  const supplierName = name || "Sin proveedor";
  const { data: existing, error: findError } = await supabaseClient
    .from("suppliers")
    .select("id")
    .eq("name", supplierName)
    .maybeSingle();
  if (findError) throw findError;
  if (existing?.id) return existing.id;

  const { data: supplier, error } = await supabaseClient
    .from("suppliers")
    .insert({ name: supplierName })
    .select("id")
    .single();
  if (error) throw error;
  return supplier.id;
}

async function createRemoteTransaction(record) {
  const { error } = await supabaseClient.from("transactions").insert({
    branch_id: branchIdByName(branches[0]),
    transaction_date: record.date,
    type: record.type,
    concept: record.concept,
    category: record.category,
    amount: record.amount,
    created_by: currentEmployeeId()
  });
  if (error) throw error;
}

document.querySelectorAll("[data-open-form]").forEach((button) => {
  button.addEventListener("click", () => openForm(button.dataset.openForm));
});

document.querySelector("#quick-ticket").addEventListener("click", () => openForm("ticket"));
document.querySelector("#close-modal").addEventListener("click", () => modal.close());
document.querySelector("#cancel-record").addEventListener("click", () => modal.close());

logoutButton.addEventListener("click", async () => {
  if (supabaseClient) await supabaseClient.auth.signOut();
  dataMode = "local";
  state = loadState();
  render();
});

document.querySelectorAll("[data-view], [data-view-target]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view || button.dataset.viewTarget));
});

document.querySelector("#export-data").addEventListener("click", () => exportWorkbook());

document.querySelectorAll("[data-export-sheet]").forEach((button) => {
  button.addEventListener("click", () => exportWorkbook(button.dataset.exportSheet));
});

document.addEventListener("click", (event) => {
  const printButton = event.target.closest("[data-print-ticket]");
  if (!printButton) return;
  const ticket = state.tickets.find((item) => item.id === printButton.dataset.printTicket);
  if (ticket) printTicket(ticket);
});

document.querySelector("#seed-data").addEventListener("click", () => {
  if (dataMode === "remote") {
    alert("La demo solo se restaura en modo local.");
    return;
  }
  state = structuredClone(seed);
  saveState();
  render();
});

searchInput.addEventListener("input", render);

function emptyMessage(text) {
  return `<p class="muted">${text}</p>`;
}

function tableEmpty(columns) {
  return `<tr><td colspan="${columns}" class="muted">Sin registros.</td></tr>`;
}

function exportWorkbook(singleSheet) {
  const sheets = {
    clients: {
      title: "Clientes",
      headers: ["Nombre", "Telefono", "Email", "Equipo", "Ultima visita", "Estado"],
      rows: state.clients.map((item) => [item.name, item.phone, item.email, item.device, item.lastVisit, item.status])
    },
    products: {
      title: "Productos",
      headers: ["Nombre", "SKU", "Categoria", "Stock", "Minimo", "Precio"],
      rows: state.products.map((item) => [item.name, item.sku, item.category, item.stock, item.minStock, item.price])
    },
    tickets: {
      title: "Tickets",
      headers: ["Folio", "Cliente", "Producto", "Trabajo", "Stage", "Prioridad", "Sucursal", "Empleado", "Monto reparacion", "Pago", "Monto pagado", "Fecha"],
      rows: state.tickets.map((item) => [item.tracking, item.client, item.productName || item.device, item.issue, item.status, item.priority, item.branch, item.assignedTo, item.repairAmount ?? item.total, item.paymentStatus, item.paidAmount, item.createdAt])
    },
    supplies: {
      title: "Insumos",
      headers: ["Fecha", "Proveedor", "Insumo", "Cantidad", "Total"],
      rows: state.supplies.map((item) => [item.date, item.supplier, item.item, item.quantity, item.total])
    },
    transactions: {
      title: "Finanzas",
      headers: ["Fecha", "Tipo", "Concepto", "Categoria", "Monto"],
      rows: state.transactions.map((item) => [item.date, item.type, item.concept, item.category, item.amount])
    }
  };
  const keys = singleSheet ? [singleSheet] : Object.keys(sheets);
  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; margin-bottom: 28px; }
          th, td { border: 1px solid #999; padding: 8px; }
          th { background: #2f6fff; color: #fff; }
          h2 { font-family: Arial, sans-serif; }
        </style>
      </head>
      <body>
        ${keys.map((key) => sheetToTable(sheets[key])).join("")}
      </body>
    </html>
  `;
  downloadFile(html, `fixzone-${singleSheet || "crm"}-${dateStamp()}.xls`, "application/vnd.ms-excel");
}

function sheetToTable(sheet) {
  return `
    <h2>${escapeHtml(sheet.title)}</h2>
    <table>
      <thead><tr>${sheet.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>
        ${sheet.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `;
}

function printTicket(ticket) {
  const client = state.clients.find((item) => item.name.toLowerCase() === ticket.client.toLowerCase());
  const repairAmount = Number(ticket.repairAmount ?? ticket.total ?? 0);
  const paidAmount = Number(ticket.paidAmount ?? 0);
  const paidLabel = ticket.paymentStatus === "Pagado" ? money.format(paidAmount || repairAmount) : escapeHtml(ticket.paymentStatus);
  const qrTarget = receiptQrTarget();
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=12&data=${encodeURIComponent(qrTarget)}`;
  document.querySelector("#print-receipt").innerHTML = `
    <article class="receipt-page">
      <header class="receipt-hero">
        <div class="receipt-brand-home">
          <img src="./assets/brand/fixzone-logo.png" alt="FixZone" />
        </div>
        <div class="receipt-title">
          <span>RECIBO DE SERVICIO</span>
          <h1>${escapeHtml(ticket.tracking || ticket.id.toUpperCase())}</h1>
          <p>${escapeHtml(ticket.createdAt || dateStamp())}</p>
        </div>
      </header>

      <section class="receipt-strip">
        <div>
          <span>Sucursal</span>
          <strong>${escapeHtml(ticket.branch || "FixZone")}</strong>
        </div>
        <div>
          <span>Atendio</span>
          <strong>${escapeHtml(ticket.assignedTo || "Equipo FixZone")}</strong>
        </div>
        <div>
          <span>Estado</span>
          <strong>${escapeHtml(ticket.status)}</strong>
        </div>
      </section>

      <div class="receipt-grid">
        <section class="receipt-box">
          <h2>Cliente</h2>
          <strong>${escapeHtml(ticket.client)}</strong>
          <span>${escapeHtml(client?.phone || "Telefono no registrado")}</span>
          <span>${escapeHtml(client?.email || "Email no registrado")}</span>
        </section>
        <section class="receipt-box">
          <h2>Producto / equipo</h2>
          <strong>${escapeHtml(ticket.productName || ticket.device)}</strong>
          <span>Prioridad: ${escapeHtml(ticket.priority || "Normal")}</span>
          <span>Pago: ${paidLabel}</span>
        </section>
      </div>

      <table class="receipt-table">
        <thead>
          <tr>
            <th>Descripcion del servicio</th>
            <th>Importe</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(ticket.issue)}</td>
            <td>${money.format(repairAmount)}</td>
          </tr>
        </tbody>
      </table>

      <section class="receipt-summary">
        <div>
          <span>Total</span>
          <strong>${money.format(repairAmount)}</strong>
        </div>
        <div>
          <span>Pagado</span>
          <strong>${paidLabel}</strong>
        </div>
      </section>

      <section class="receipt-footer-grid">
        <p class="receipt-note">
          Gracias por confiar en FixZone. Conserve este recibo para seguimiento, garantia o aclaraciones.
          El servicio queda sujeto a diagnostico, disponibilidad de refacciones y condiciones del equipo recibido.
        </p>
        <div class="receipt-qr">
          <img src="${qrImage}" alt="QR de seguimiento" />
          <strong>Escanea aqui</strong>
          <span>${escapeHtml(qrTarget)}</span>
        </div>
        <div class="receipt-signature">
          <span></span>
          <strong>Firma de recibido</strong>
        </div>
      </section>
    </article>
  `;
  window.print();
}

function receiptQrTarget() {
  const baseUrl = location.protocol === "file:" ? "https://fixzone-crm.pages.dev" : location.origin;
  return `${baseUrl}/detente-jochis.html`;
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setActiveBranch(branchName) {
  activeBranchId = branchName;

  // Update tab button styles
  document.querySelectorAll(".branch-tab").forEach((btn) => {
    const isActive = btn.textContent.trim() === branchName;
    btn.classList.toggle("is-active", isActive);
  });

  render();
}

window.setActiveBranch = setActiveBranch;

initializeApp();