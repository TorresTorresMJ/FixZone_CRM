// supabase/functions/scan-receipt/index.ts
// Receives a base64 image of a purchase receipt and returns extracted fields
// using Claude's vision API.
//
// Required Supabase secret: ANTHROPIC_API_KEY
// Set via: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY no configurado en secrets de Supabase");

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

    const prompt = formType === "transaction" ? transactionPrompt : supplyPrompt;
    const isPdf = mimeType === "application/pdf";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta":    "pdfs-2024-09-25",
        "content-type":      "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages: [{
          role: "user",
          content: [
            {
              type: isPdf ? "document" : "image",
              source: { type: "base64", media_type: mimeType, data: imageBase64 },
            },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error: ${response.status} — ${err}`);
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || "";

    // Extract JSON from response (Claude may wrap it in markdown fences)
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
