// supabase/functions/self-service-auth/index.ts
//
// Recuperación de contraseña 100% self-service — a diferencia de
// create-employee/index.ts, esta función NO requiere una sesión activa
// (el empleado está bloqueado, no tiene con qué autenticarse). Por diseño
// explícito no verifica ninguna identidad más allá del username: cualquiera
// que sepa su propio usuario puede resetear su contraseña al default
// conocido por el equipo, sin depender de que un admin entre a Usuarios.
// Aceptado a propósito para un equipo interno pequeño y de confianza — ver
// CLAUDE.md, sección "Recuperación de contraseña (self-service)".
//
// Usa el service-role key server-side; nunca se expone al navegador.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEFAULT_PASSWORD = "miwaysillos05";
const EMAIL_DOMAIN     = "fixzone.internal";

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function toAuthEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
}

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`fz-pin:${pin.trim()}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { action, payload } = await req.json();
    const username = (payload?.username || "").trim().toLowerCase();
    if (!username) throw new Error("Usuario requerido");

    const { data: emp } = await adminClient
      .from("employees")
      .select("id, auth_user_id, status")
      .eq("username", username)
      .maybeSingle();

    if (!emp || emp.status !== "active" || !emp.auth_user_id) {
      // Mensaje genérico: no delatamos si el usuario existe o no.
      throw new Error("No se encontró ese usuario o no está activo.");
    }

    if (action === "reset_by_username") {
      await adminClient.auth.admin.updateUserById(emp.auth_user_id, { password: DEFAULT_PASSWORD });
      await adminClient.from("employees").update({ force_password_change: true }).eq("id", emp.id);
      return ok({ reset: true });
    }

    if (action === "set_pin") {
      const pin = String(payload?.pin || "").trim();
      if (!/^\d{4,6}$/.test(pin)) throw new Error("El PIN debe ser numérico, de 4 a 6 dígitos.");
      const hash = await hashPin(pin);
      await adminClient.from("employees").update({ login_pin_hash: hash }).eq("id", emp.id);
      return ok({ saved: true });
    }

    if (action === "login_with_pin") {
      const pin = String(payload?.pin || "").trim();
      const { data: full } = await adminClient
        .from("employees").select("login_pin_hash").eq("id", emp.id).single();
      if (!full?.login_pin_hash) throw new Error("Este usuario no tiene un PIN configurado.");
      const hash = await hashPin(pin);
      if (hash !== full.login_pin_hash) throw new Error("PIN incorrecto.");

      const authEmail = toAuthEmail(username);
      const { data: link, error: linkErr } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: authEmail,
      });
      if (linkErr) throw new Error(linkErr.message);

      return ok({ email: authEmail, token: link.properties.hashed_token });
    }

    throw new Error(`Acción desconocida: ${action}`);

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});

function ok(data: Record<string, unknown>) {
  return new Response(
    JSON.stringify({ success: true, ...data }),
    { headers: { ...cors, "Content-Type": "application/json" } }
  );
}
