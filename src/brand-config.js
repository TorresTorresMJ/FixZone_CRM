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
    logoSrc:          "./assets/brand/LOGO-FIXZONE.png",
    logoMonoSrc:      "./assets/brand/logos-mono/fixzone-mono.png",
    pageTitle:        "FixZone CRM",
    receiptHeader:    "FixZone — Puerto Vallarta",
    brandClass:       "brand-fixzone",
    colors: {
      "--fz-primary":         "#2f6fff",
      "--fz-primary-rgb":     "47, 111, 255",
      "--fz-secondary":       "#4a8dff",
      "--fz-deep":            "#1f4fcc",
      "--fz-glow":            "0 0 32px rgba(47,111,255,0.42)",
      "--fz-shadow":          "0 18px 48px rgba(31,79,204,0.28)",
      "--fz-nav-hover-bg":    "rgba(47,111,255,0.16)",
      "--fz-nav-icon-color":  "#4a8dff",
      "--fz-nav-icon-border": "rgba(74,141,255,0.28)",
      "--fz-btn-gradient":    "linear-gradient(135deg,#2f6fff,#4a8dff)",
      "--fz-tab-active-bg":   "linear-gradient(135deg,#2f6fff,#4a8dff)",
      "--fz-topbar-glow":     "rgba(47,111,255,0.18)",
    },
    sidebarBg:   "linear-gradient(180deg,#070707 0%,#101217 58%,#08090c 100%)",
    workspaceBg: "radial-gradient(circle at top right,rgba(47,111,255,0.18),transparent 34%),linear-gradient(180deg,#0d0e12 0%,#090909 100%)",
    loginBg:     "radial-gradient(ellipse at 60% 0%,rgba(47,111,255,0.22) 0%,transparent 55%),radial-gradient(ellipse at 10% 100%,rgba(31,79,204,0.18) 0%,transparent 50%),#08090c",
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
      "--fz-primary":         "#e85d04",
      "--fz-primary-rgb":     "232, 93, 4",
      "--fz-secondary":       "#f48c06",
      "--fz-deep":            "#9d2d00",
      "--fz-glow":            "0 0 32px rgba(232,93,4,0.42)",
      "--fz-shadow":          "0 18px 48px rgba(157,45,0,0.32)",
      "--fz-nav-hover-bg":    "rgba(232,93,4,0.16)",
      "--fz-nav-icon-color":  "#f48c06",
      "--fz-nav-icon-border": "rgba(244,140,6,0.28)",
      "--fz-btn-gradient":    "linear-gradient(135deg,#e85d04,#f48c06)",
      "--fz-tab-active-bg":   "linear-gradient(135deg,#e85d04,#f48c06)",
      "--fz-topbar-glow":     "rgba(232,93,4,0.16)",
    },
    sidebarBg:   "linear-gradient(180deg,#0a0602 0%,#14100a 58%,#0a0802 100%)",
    workspaceBg: "radial-gradient(circle at top right,rgba(232,93,4,0.14),transparent 34%),linear-gradient(180deg,#0e0c09 0%,#090909 100%)",
    loginBg:     "radial-gradient(ellipse at 60% 0%,rgba(232,93,4,0.2) 0%,transparent 55%),radial-gradient(ellipse at 10% 100%,rgba(157,45,0,0.18) 0%,transparent 50%),#0a0802",
  },
};

window.getBranchBrand = function(branchName) {
  return window.BRANCH_BRANDS[branchName] || window.BRANCH_BRANDS["Puerto Vallarta"];
};