// supabase/functions/scan-receipt/index.ts
// Receives a base64 image (or PDF) of a purchase receipt and returns extracted
// fields using Google Gemini's vision API (free tier).
//
// Required Supabase secret: GEMINI_API_KEY
// Get a free key at: https://aistudio.google.com/apikey
// Set via: supabase secrets set GEMINI_API_KEY=...

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = "gemini-3.1-flash-lite";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY no configurado en secrets de Supabase");

    const { imageBase64, mimeType = "image/jpeg", formType = "supply" } = await req.json();
    if (!imageBase64) throw new Error("Se requiere imageBase64");

    const supplyPrompt = `Analiza esta foto de un ticket o comprobante de compra de una tienda.
Extrae los siguientes campos y devuelve SOLO un JSON válido sin explicaciones:
{
  "date": "YYYY-MM-DD",        // fecha de la compra (si no se ve claramente, usa la fecha de hoy)
  "supplier": "nombre",        // nombre de la tienda o proveedor
  "item": "descripción",       // artículo o producto principal comprado
  "quantity": 1,               // cantidad (número entero, default 1)
  "total": 0.00                // total pagado en MXN (número decimal)
}
Si un campo no es visible, usa null para strings y 0 para números. La fecha de hoy es ${new Date().toISOString().slice(0,10)}.`;

    const expenseCategories = ["Inventario","Insumos","Renta","Nomina","Servicios","Herramientas","Operacion","Otro"];
    const transactionPrompt = `Analiza esta foto de un comprobante, ticket de compra o recibo de pago.
Extrae los siguientes campos y devuelve SOLO un JSON válido sin explicaciones:
{
  "date": "YYYY-MM-DD",        // fecha del comprobante
  "concept": "descripción",    // concepto breve del gasto
  "category": "Insumos",       // una de: ${expenseCategories.join(", ")}
  "amount": 0.00,              // monto total en MXN
  "supplier": "nombre"         // nombre del negocio o proveedor (para referencia)
}
Si un campo no es visible, usa null para strings y 0 para números. La fecha de hoy es ${new Date().toISOString().slice(0,10)}.`;

    const invoicePrompt = `Analiza esta foto de una factura, ticket de compra o comprobante de pago.
Extrae los siguientes campos y devuelve SOLO un JSON válido sin explicaciones:
{
  "invoice_date": "YYYY-MM-DD", // fecha de la factura o comprobante
  "type": "Recibida",           // "Emitida" si la empresa que emite es FixZone/RefaxZone, si no "Recibida"
  "party_name": "nombre",       // nombre del cliente o proveedor (la otra parte, no FixZone/RefaxZone)
  "party_rfc": "RFC",           // RFC de esa parte si es visible, si no null
  "folio": "folio",             // folio fiscal o número de factura si es visible, si no null
  "concept": "descripción",     // concepto breve de la factura
  "amount": 0.00                // monto total en MXN
}
Si un campo no es visible, usa null para strings y 0 para números. La fecha de hoy es ${new Date().toISOString().slice(0,10)}.`;

    const prompt = formType === "transaction" ? transactionPrompt
      : formType === "invoice" ? invoicePrompt
      : supplyPrompt;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          }],
          generationConfig: { response_mime_type: "application/json" },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error: ${response.status} — ${err}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response (model may wrap it in markdown fences)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No se pudo extraer JSON de la respuesta");
    const fields = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ ok: true, fields }), {
      headers: { ...cors, "content-type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 400,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
});
