// ──────────────────────────────────────────────────────────────────────────────
// FixZone / RefaxZone — brand-config.js
// Ubicación: misma carpeta raíz que app.js y supabase-config.js
// Cargado en index.html ANTES de app.js
// ──────────────────────────────────────────────────────────────────────────────

window.BRANCH_BRANDS = {

  "Puerto Vallarta": {
    displayName:      "FIXZONE",
    locationLabel:    "Puerto Vallarta",
    tagline:          "WE FIX FAST. YOU RELAX.",
    crmLabel:         "CRM OPERATIVO",
    // Reglas de uso de logo:
    //   logoLightSrc → fondo oscuro o de color (azul, negro, etc.) — letras blancas, PNG transparente, SIN filtro CSS
    //   logoDarkSrc  → fondo blanco o claro                        — letras oscuras, PNG transparente, SIN filtro CSS
    //   logoSrc      → fallback genérico (se usa solo si no aplica ninguno de los anteriores)
    //   logoMonoSrc  → recibo térmico / impresión en blanco y negro
    //   NUNCA usar filter:brightness(0) invert(1) si el PNG tiene fondo blanco — convierte todo (logo+fondo) a blanco
    logoSrc:          "./assets/brand/fixzone/LOGO-FIXZONE.png",
    logoDarkSrc:      "./assets/brand/fixzone/logo-dark.png",
    logoMonoSrc:      "./assets/brand/logos-mono/fixzone-monocromatico.png",
    logoLightSrc:     "./assets/brand/fixzone/LOGO-FIXZONE.png",
    logoFallback:     "./assets/brand/fixzone/LOGO-FIXZONE.png",
    pageTitle:        "FixZone CRM",
    receiptHeader:    "FixZone — Puerto Vallarta",
    brandClass:       "brand-fixzone",
    colors: {
      "--fz-primary":         "#085ACB",
      "--fz-primary-rgb":     "8, 90, 203",
      "--fz-secondary":       "#2678E8",
      "--fz-deep":            "#053E8F",
      "--fz-glow":            "0 0 32px rgba(8,90,203,0.45)",
      "--fz-shadow":          "0 18px 48px rgba(5,62,143,0.35)",
      "--fz-nav-hover-bg":    "rgba(8,90,203,0.18)",
      "--fz-nav-icon-color":  "#2678E8",
      "--fz-nav-icon-border": "rgba(38,120,232,0.30)",
      "--fz-btn-gradient":    "linear-gradient(135deg,#085ACB,#2678E8)",
      "--fz-tab-active-bg":   "linear-gradient(135deg,#085ACB,#2678E8)",
      "--fz-topbar-glow":     "rgba(8,90,203,0.20)",
    },
    dashboardColors: {
      "--fz-dash-accent":     "#085ACB",
      "--fz-dash-accent-rgb": "8, 90, 203",
      "--fz-dash-tint":       "rgba(8,90,203,0.06)",
    },
    sidebarBg:   "linear-gradient(180deg,#04080f 0%,#080d18 58%,#04080e 100%)",
    workspaceBg: "radial-gradient(circle at top right,rgba(8,90,203,0.20),transparent 34%),linear-gradient(180deg,#08090f 0%,#090909 100%)",
    loginBg:     "radial-gradient(ellipse at 60% 0%,rgba(8,90,203,0.25) 0%,transparent 55%),radial-gradient(ellipse at 10% 100%,rgba(5,62,143,0.20) 0%,transparent 50%),#04080e",
    // ── Links de marketing y diseño (tab Diseño) ──────────────────────────────
    marketingLinks: [
      { icon: "🎨", name: "Canva",            url: "https://canva.com",                    desc: "Diseño de materiales, publicaciones y plantillas de marca FixZone" },
      { icon: "📁", name: "Google Drive",      url: "https://drive.google.com",             desc: "Assets, logos, imágenes de productos y archivos de marca PV" },
      { icon: "✏️", name: "Figma",             url: "https://www.figma.com",               desc: "Prototipos, diseño UI y mockups de campañas" },
      { icon: "📸", name: "Instagram FixZone", url: "https://www.instagram.com/fixzonemx", desc: "Publicaciones, stories y reels de FixZone Puerto Vallarta" },
      { icon: "📘", name: "Meta Business",     url: "https://business.facebook.com",        desc: "Gestión de anuncios y páginas de Facebook e Instagram PV" },
      { icon: "📊", name: "Google Analytics",  url: "https://analytics.google.com",         desc: "Tráfico web y métricas de conversión de FixZone" },
    ],
    // ── Flujos de automatización sugeridos ────────────────────────────────────
    autoFlows: [
      { steps: ["Ticket → Listo", "Make / Zapier", "WhatsApp al cliente"], desc: "Notifica automáticamente cuando el equipo está listo para recoger en PV" },
      { steps: ["Nuevo cliente", "Mailchimp", "Email bienvenida"],         desc: "Correo automático de bienvenida con promoción para primera visita en FixZone" },
      { steps: ["Reseña Google", "Make", "Slack / WhatsApp"],              desc: "Alerta interna cuando hay una nueva reseña en Google Business PV" },
    ],
  },

  "Puebla": {
    displayName:      "REFAXZONE",
    locationLabel:    "Puebla",
    tagline:          "REFACCIONES AL INSTANTE.",
    crmLabel:         "CRM OPERATIVO",
    logoSrc:          "./assets/brand/LOGO-REFAXZONE.png",
    logoFallback:     "./assets/brand/LOGO-FIXZONE.png",
    logoMonoSrc:      "./assets/brand/logos-mono/refax-mono.png",
    logoMonoFallback: "./assets/brand/logos-mono/fixzone-mono.png",
    pageTitle:        "RefaxZone CRM",
    receiptHeader:    "RefaxZone — Puebla",
    brandClass:       "brand-refaxzone",
    colors: {
      "--fz-primary":         "#085ACB",
      "--fz-primary-rgb":     "8, 90, 203",
      "--fz-secondary":       "#2678E8",
      "--fz-deep":            "#053E8F",
      "--fz-glow":            "0 0 32px rgba(8,90,203,0.45)",
      "--fz-shadow":          "0 18px 48px rgba(5,62,143,0.35)",
      "--fz-nav-hover-bg":    "rgba(8,90,203,0.18)",
      "--fz-nav-icon-color":  "#2678E8",
      "--fz-nav-icon-border": "rgba(38,120,232,0.30)",
      "--fz-btn-gradient":    "linear-gradient(135deg,#085ACB,#2678E8)",
      "--fz-tab-active-bg":   "linear-gradient(135deg,#085ACB,#2678E8)",
      "--fz-topbar-glow":     "rgba(8,90,203,0.20)",
    },
    dashboardColors: {
      "--fz-dash-accent":     "#2678E8",
      "--fz-dash-accent-rgb": "38, 120, 232",
      "--fz-dash-tint":       "rgba(38,120,232,0.09)",
    },
    sidebarBg:   "linear-gradient(180deg,#04080f 0%,#080d18 58%,#04080e 100%)",
    workspaceBg: "radial-gradient(circle at top right,rgba(8,90,203,0.20),transparent 34%),linear-gradient(180deg,#08090f 0%,#090909 100%)",
    loginBg:     "radial-gradient(ellipse at 60% 0%,rgba(8,90,203,0.25) 0%,transparent 55%),radial-gradient(ellipse at 10% 100%,rgba(5,62,143,0.20) 0%,transparent 50%),#04080e",
    // ── Links de marketing y diseño (tab Diseño) ──────────────────────────────
    marketingLinks: [
      { icon: "🎨", name: "Canva",              url: "https://canva.com",                       desc: "Diseño de materiales, publicaciones y plantillas de marca RefaxZone" },
      { icon: "📁", name: "Google Drive",        url: "https://drive.google.com",                desc: "Assets, logos, imágenes de productos y archivos de marca Puebla" },
      { icon: "✏️", name: "Figma",               url: "https://www.figma.com",                  desc: "Prototipos, diseño UI y mockups de campañas Puebla" },
      { icon: "📸", name: "Instagram RefaxZone", url: "https://www.instagram.com/refaxzonemx",  desc: "Publicaciones, stories y reels de RefaxZone Puebla" },
      { icon: "📘", name: "Meta Business",       url: "https://business.facebook.com",           desc: "Gestión de anuncios y páginas de Facebook e Instagram Puebla" },
      { icon: "📊", name: "Google Analytics",    url: "https://analytics.google.com",            desc: "Tráfico web y métricas de conversión de RefaxZone" },
    ],
    // ── Flujos de automatización sugeridos ────────────────────────────────────
    autoFlows: [
      { steps: ["Ticket → Listo", "Make / Zapier", "WhatsApp al cliente"], desc: "Notifica automáticamente cuando el equipo está listo en Puebla" },
      { steps: ["Nuevo cliente", "Mailchimp", "Email bienvenida"],         desc: "Correo automático de bienvenida con promoción para primera visita en RefaxZone" },
      { steps: ["Reseña Google", "Make", "Slack / WhatsApp"],              desc: "Alerta interna cuando hay una nueva reseña en Google Business Puebla" },
    ],
  },
};

window.getBranchBrand = function(branchName) {
  return window.BRANCH_BRANDS[branchName] || window.BRANCH_BRANDS["Puerto Vallarta"];
};