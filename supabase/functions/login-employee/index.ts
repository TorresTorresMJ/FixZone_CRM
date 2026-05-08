import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://esm.sh/bcryptjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 👇 manejar preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: user, error } = await supabase
      .from("employees")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Usuario no encontrado" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const isValid = await bcrypt.compare(password, user.password_hash || "");

    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, error: "Contraseña incorrecta" }),
        { status: 401, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          full_name: user.full_name,
          role: user.role,
        },
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});