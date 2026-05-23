// supabase/functions/create-employee/index.ts
// Login: username + password → Supabase Auth con email = username@fixzone.internal

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Sin autorización");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !caller) throw new Error("No autenticado");

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: callerEmp } = await adminClient
      .from("employees")
      .select("role, status")
      .eq("auth_user_id", caller.id)
      .single();

    if (!callerEmp || callerEmp.status !== "active") throw new Error("Empleado no activo");
    if (!["it", "admin", "owner"].includes(callerEmp.role)) throw new Error("Sin permisos");

    const { action, payload } = await req.json();

    if (action === "create") {
      const { full_name, username, role, branch_id, default_branch_id, phone } = payload;
      if (!full_name || !username) throw new Error("Nombre y usuario son requeridos");

      const authEmail = toAuthEmail(username);

      const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
        email: authEmail,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name, username },
      });
      if (authErr) throw new Error(`Auth error: ${authErr.message}`);

      const { data: emp, error: insertErr } = await adminClient
        .from("employees")
        .insert({
          auth_user_id:         authData.user.id,
          full_name,
          email:                authEmail,
          username:             username.toLowerCase(),
          role:                 ({ it: "owner", standard: "technician", marketing: "technician" }[role] || role || "technician"),
          status:               "active",
          branch_id:            branch_id || null,
          default_branch_id:    default_branch_id || branch_id || null,
          phone:                phone || null,
          force_password_change: true,
        })
        .select()
        .single();

      if (insertErr) {
        await adminClient.auth.admin.deleteUser(authData.user.id);
        throw new Error(insertErr.message);
      }

      return ok({ employee: emp });
    }

    if (action === "update") {
      const { employee_id, full_name, username, role, status, branch_id, default_branch_id, phone } = payload;
      if (!employee_id) throw new Error("employee_id requerido");

      if (username) {
        const { data: emp } = await adminClient
          .from("employees").select("auth_user_id, username").eq("id", employee_id).single();
        if (emp?.auth_user_id && emp.username !== username.toLowerCase()) {
          await adminClient.auth.admin.updateUserById(emp.auth_user_id, { email: toAuthEmail(username) });
        }
      }

      const updates: Record<string, unknown> = {};
      if (full_name  !== undefined) updates.full_name  = full_name;
      if (username   !== undefined) {
        updates.username = username.toLowerCase();
        updates.email    = toAuthEmail(username);
      }
      if (role       !== undefined) updates.role = ({ it: "owner", standard: "technician", marketing: "technician" }[role] || role);
      if (status     !== undefined) updates.status     = status;
      if (branch_id  !== undefined) updates.branch_id  = branch_id;
      if (default_branch_id !== undefined) updates.default_branch_id = default_branch_id;
      if (phone      !== undefined) updates.phone      = phone;

      const { data: emp, error } = await adminClient
        .from("employees").update(updates).eq("id", employee_id).select().single();
      if (error) throw new Error(error.message);
      return ok({ employee: emp });
    }

    if (action === "delete") {
      const { employee_id } = payload;
      if (!employee_id) throw new Error("employee_id requerido");

      const { data: emp } = await adminClient
        .from("employees").select("auth_user_id").eq("id", employee_id).single();

      await adminClient.from("employees").update({ status: "terminated" }).eq("id", employee_id);

      if (emp?.auth_user_id) {
        await adminClient.auth.admin.updateUserById(emp.auth_user_id, { ban_duration: "876600h" });
      }
      return ok({ deleted: true });
    }

    if (action === "reset_password") {
      const { employee_id } = payload;
      if (!employee_id) throw new Error("employee_id requerido");

      const { data: emp } = await adminClient
        .from("employees").select("auth_user_id").eq("id", employee_id).single();
      if (!emp?.auth_user_id) throw new Error("Usuario sin cuenta Auth");

      await adminClient.auth.admin.updateUserById(emp.auth_user_id, { password: DEFAULT_PASSWORD });
      await adminClient.from("employees").update({ force_password_change: true }).eq("id", employee_id);
      return ok({ reset: true });
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