# FixZone — Fórmula de Precios y Cotizaciones
**Sesión de trabajo:** Miércoles 4 de junio, 2025  
**Participantes:** Dueño del negocio + Técnico/gestor de ventas + Claude  
**Contexto:** FixZone abrió el lunes 2 de junio en Puerto Vallarta. Negocio de reparación de celulares con sucursal también en Puebla (RefaxZone).

---

## 1. Fórmula final acordada

```
Precio al cliente = Insumo × (1 + margen) × 1.16 × 1.0406
```

| Componente | Valor | Notas |
|---|---|---|
| Insumo | Variable | Depende de proveedor y modelo |
| Margen normal | 110% | Insumo menor a $1,500 |
| Margen alto | 100% | Insumo de $1,500 o más |
| IVA | 16% | Siempre incluido |
| Mercado Pago | 4.06% | Siempre incluido (ver regla abajo) |

### Desglose paso a paso

1. `Base = Insumo × (1 + margenPct)`
2. `Con IVA = Base × 1.16`
3. `Precio final = Con IVA × 1.0406`

---

## 2. Reglas de negocio

### Margen escalonado
- Insumo **menor a $1,500** → margen **110%**
- Insumo **$1,500 o más** → margen **100%**
- Razón: a precios altos el cliente es más sensible y el precio puede volverse no competitivo
- El umbral ($1,500) y ambos márgenes son configurables por el owner/admin en el CRM

### Mercado Pago — siempre incluido
- El 4.06% se incluye **siempre** en el precio, sin importar cómo pague el cliente
- Si paga en efectivo → ese 4.06% queda como utilidad extra del negocio
- Si paga con terminal → el negocio queda cubierto exacto
- Razón: no siempre se sabe de antemano el método de pago; es mejor no arriesgarse

### Garantía según tipo de servicio
| Tipo | Garantía | Si sale mal |
|---|---|---|
| Cambio de pantalla | 30 días en mano de obra | Se cubre con la garantía |
| Cambio de glass | Sin garantía | No se cobra el servicio. El insumo no se daña, solo se pierde tiempo del técnico |

### Conveniencia para el negocio
- Conviene que el cliente elija **cambio de pantalla** sobre **cambio de glass** ya que en pantalla se gana más

---

## 3. Comisión del técnico

- **Pendiente de definir** el porcentaje exacto
- Se acordó que será **comisión por ticket cerrado** (no sueldo fijo)
- El slider en el cotizador está en **15%** como punto de partida
- Se calcula sobre el **precio base** (antes de IVA y MP)
- `Comisión técnico = Base × comTecPct`
- Referencia de mercado: talleres en México manejan entre 15% y 25%

---

## 4. Manejo de insumos sin lista de precios

- Los proveedores (Macrocell y Staff, ambos en Puerto Vallarta) **no manejan lista de precios fija** — los precios varían
- Flujo de cotización en recepción:
  1. Cliente llega y pregunta precio
  2. Recepción manda WhatsApp a Macrocell y/o Staff
  3. En ~5 minutos llega el precio del insumo
  4. Se ingresa al cotizador → precio al cliente aparece automáticamente
- La tabla de precios del CRM guarda el **último precio conocido** de cada insumo como referencia

---

## 5. Cotizador — especificación para el CRM

### Función de cálculo (utilidad pura)

```javascript
function calcPrecio({ insumo, tipo, config }) {
  // config = { margenNormal, margenAlto, umbral, comTecPct }
  const margenPct = insumo >= config.umbral ? config.margenAlto : config.margenNormal;
  const ganancia  = insumo * margenPct;
  const base      = insumo + ganancia;
  const iva       = base * 0.16;
  const conIva    = base + iva;
  const mpCosto   = conIva * 0.0406;
  const precioFinal = conIva + mpCosto;
  const comTec    = base * config.comTecPct;
  const costoReal = insumo + comTec + mpCosto;
  const utilidad  = precioFinal - costoReal;
  const margenNeto = precioFinal > 0 ? (utilidad / precioFinal) * 100 : 0;
  return { precioFinal, ganancia, base, iva, mpCosto, comTec, utilidad, margenNeto, margenAplicado: margenPct };
}
```

### Config por defecto

```javascript
const PRICING_CONFIG_DEFAULT = {
  margenNormal: 1.10,   // 110% — insumo < umbral
  margenAlto:   1.00,   // 100% — insumo >= umbral
  umbral:       1500,   // $1,500 MXN
  comTecPct:    0.15,   // 15% — pendiente confirmar
};
```

### Vista del cotizador según rol

| Elemento | it / admin | standard / marketing |
|---|---|---|
| Input insumo | ✅ | ✅ |
| Botones proveedor | ✅ | ✅ |
| Precio al cliente (grande) | ✅ | ✅ |
| Badge margen aplicado | ✅ | ✅ |
| Sliders de configuración | ✅ | ❌ |
| Desglose interno | ✅ | ❌ |

---

## 6. Prompt para agente en VS Code

```
Eres un agente de desarrollo trabajando sobre el repo de FixZone CRM.
Los archivos principales son: index.html, app.js, branch-brand.css, brand-tokens.css, supabase-config.js

CONTEXTO DEL NEGOCIO:
FixZone es un taller de reparación de celulares con sucursales en Puerto Vallarta y Puebla.
Acaba de abrir (lunes 2 junio 2025). Proveedores de refacciones: Macrocell y Staff (PV).

FÓRMULA DE PRECIOS ACORDADA:
  Precio al cliente = (Insumo × (1 + margenPct)) × 1.16 × 1.0406

  Regla de margen:
  - Insumo < $1,500  → margenPct = 1.10  (110%)
  - Insumo >= $1,500 → margenPct = 1.00  (100%)
  - El umbral ($1,500) y ambos márgenes deben ser configurables por el owner

  Comisión técnico: % configurable sobre el precio base (antes de IVA), por definir (15% por ahora)
  
  Mercado Pago: 4.06% SIEMPRE incluido en el precio, sin importar el método de pago.
  Si el cliente paga en efectivo, ese % queda como utilidad extra del negocio.
  NO hay checkbox de Mercado Pago — siempre se aplica.
  
  IVA: 16% siempre incluido en el precio al cliente

REGLAS DE GARANTÍA:
  - Cambio de pantalla: garantía 30 días en mano de obra
  - Cambio de glass: SIN garantía. Si sale mal → no se cobra, solo se pierde tiempo del técnico

TAREA A IMPLEMENTAR — Módulo de Precios / Cotizador en app.js + index.html:

1. En el módulo "Precios" (vista #precios-view que ya existe en index.html):
   - Agregar sección "Cotizador rápido" ENCIMA de la tabla de precios existente
   - Elementos: selector tipo servicio (pantalla/glass), input $ insumo,
     botones proveedor (Macrocell / Staff / Otro), precio al cliente en grande,
     badge que muestra qué margen se aplicó y por qué
   - Desglose interno colapsable (solo visible para roles: it, admin)
   - 4 sliders configurables (solo it, admin):
     margen normal, margen alto, umbral, comisión técnico
   - Los sliders persisten en localStorage bajo la key "fixzone-pricing-config"

2. Función de cálculo como utilidad pura:
   function calcPrecio({ insumo, tipo, config }) → { precioFinal, ganancia, iva, mpCosto, comTec, utilidad, margenNeto, margenAplicado }
   donde config = { margenNormal, margenAlto, umbral, comTecPct }

3. En el módulo de Tickets, al crear/editar un ticket de tipo "Cambio de pantalla"
   o "Cambio de glass", agregar botón "Cotizar" que abra el cotizador en modal
   y pre-llene el campo repairAmount.

4. Respetar el sistema de permisos existente (PERMISSIONS en app.js):
   - it y admin: ven sliders, desglose, badge de margen
   - standard y marketing: solo ven el precio final

5. No romper nada existente. El resto de la app no se toca.

ARCHIVOS A MODIFICAR:
- app.js: agregar calcPrecio(), renderCotizador(), lógica de persistencia de config
- index.html: agregar HTML del cotizador dentro de #precios-view

Empieza leyendo app.js completo para entender el patrón de renderizado existente
(funciones render*, delegación de eventos, state global) antes de escribir código.
```

---

## 7. Pendientes

- [ ] Confirmar % de comisión del técnico (actualmente en 15% provisional)
- [ ] Revisar precios de la competencia en Puerto Vallarta para validar si el 110%/100% deja precios competitivos
- [ ] Actualizar la calculadora en esta sesión quitando el checkbox de Mercado Pago (ya es siempre incluido)
- [ ] Implementar el cotizador en el CRM usando el prompt del agente de VS Code
- [ ] Definir si la tabla de precios guarda "último precio conocido" por insumo o solo sirve como referencia manual
- [ ] Comparar precios de Macrocell vs Staff para el mismo insumo y ver si conviene tener precio preferente por proveedor

---

*Documento generado al cierre de sesión — FixZone CRM, Puerto Vallarta*
