import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurada");

    // Build user energy context
    const authHeader = req.headers.get("Authorization");
    let contextSummary = "";
    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: hogares } = await supabase
          .from("hogares")
          .select("id, nombre, numero_personas, area_m2, habitaciones(nombre, tipo, electrodomesticos(nombre_personalizado, horas_uso_diarias, tipos_electrodomestico(nombre, potencia_watt, consumo_kwh_predeterminado)))")
          .eq("activo", true);
        if (hogares && hogares.length) {
          contextSummary = "\n\nDATOS DEL USUARIO:\n" + hogares.map((h: any) => {
            const rooms = (h.habitaciones || []).map((r: any) => {
              const apps = (r.electrodomesticos || []).map((e: any) =>
                `${e.nombre_personalizado || e.tipos_electrodomestico?.nombre} (${e.tipos_electrodomestico?.potencia_watt}W, ${e.horas_uso_diarias}h/día)`
              ).join(", ");
              return `  - ${r.nombre} [${r.tipo}]: ${apps || "sin aparatos"}`;
            }).join("\n");
            return `Hogar "${h.nombre}" (${h.numero_personas || "?"} personas, ${h.area_m2 || "?"}m²):\n${rooms}`;
          }).join("\n\n");
        }
      }
    }

    const systemPrompt = `Eres Volti, un rayito amigable y experto en eficiencia energética para hogares chilenos. Tu misión es dar consejos prácticos y cercanos para ahorrar luz y cuidar el bolsillo de las familias.

Tono: cálido, motivador, conciso. Usa emojis con moderación (⚡💡💰). Habla en español chileno informal pero claro.

Reglas:
- Da consejos accionables y específicos al hogar y aparatos del usuario cuando los conozcas.
- Menciona ahorros estimados en pesos cuando sea relevante (tarifa BT1 referencial ~$150/kWh).
- Si el usuario pregunta algo fuera de energía/ahorro, redirígelo amablemente.
- Respuestas cortas (2-4 párrafos máximo) salvo que pidan detalle.
${contextSummary}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas consultas, intenta en un momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Sin créditos de IA. Agrega créditos en Lovable Cloud." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error en AI gateway" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("volti-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
