import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10_000;
  return x - Math.floor(x);
}

function variarConsumo(baseKwh: number, diaIndex: number, categoria: string, seed: number): number {
  const rand = seededRand(seed * 31 + diaIndex);
  const noise = (rand - 0.5) * 0.3;
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - (29 - diaIndex));
  const esFinDeSemana = fecha.getDay() === 0 || fecha.getDay() === 6;
  const weekendFactor =
    esFinDeSemana && categoria === "entretenimiento" ? 0.2 :
    esFinDeSemana && ["lavado", "cocina"].includes(categoria) ? -0.1 : 0;
  const trend = diaIndex * 0.003;
  return Math.max(0.001, baseKwh * (1 + noise + weekendFactor + trend));
}

function fechaHaceNDias(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

// ── Escenarios ────────────────────────────────────────────────────────────────

const ESCENARIOS = [
  {
    nombre: "Casa Familia García",
    direccion: "Av. Providencia 1234, Santiago",
    area_m2: 90,
    numero_personas: 4,
    empresa_nombre: "Enel",
    meta_kwh: 430,
    habitaciones: [
      {
        nombre: "Cocina", tipo: "cocina",
        electrodomesticos: [
          { nombre: "Refrigerador Samsung No-Frost", tipo_buscar: "refrigerador", horas: 24, kwh: 4.5, categoria: "refrigeracion" },
          { nombre: "Microondas", tipo_buscar: "microondas", horas: 0.25, kwh: 0.25, categoria: "cocina" },
          { nombre: "Hervidor Oster 1.7L", tipo_buscar: "hervidor", horas: 0.25, kwh: 0.55, categoria: "cocina" },
          { nombre: "Lavavajillas Bosch", tipo_buscar: "lavavajillas", horas: 1, kwh: 1.8, categoria: "lavado" },
        ],
      },
      {
        nombre: "Living", tipo: "living",
        electrodomesticos: [
          { nombre: 'Smart TV Samsung 55"', tipo_buscar: "televisor", horas: 5, kwh: 0.5, categoria: "entretenimiento" },
          { nombre: "Router WiFi (24/7)", tipo_buscar: "router", horas: 24, kwh: 0.19, categoria: "entretenimiento" },
          { nombre: "Calefactor aceite 2000W", tipo_buscar: "calefactor", horas: 6, kwh: 12.0, categoria: "climatizacion" },
        ],
      },
      {
        nombre: "Dormitorio Principal", tipo: "dormitorio",
        electrodomesticos: [
          { nombre: 'Smart TV LG 32"', tipo_buscar: "televisor", horas: 2, kwh: 0.08, categoria: "entretenimiento" },
          { nombre: "Split Midea 12.000 BTU", tipo_buscar: "aire acondicionado", horas: 4, kwh: 4.8, categoria: "climatizacion" },
        ],
      },
      {
        nombre: "Dormitorio Niños", tipo: "dormitorio",
        electrodomesticos: [
          { nombre: "Notebook HP estudiante", tipo_buscar: "computador", horas: 3, kwh: 0.15, categoria: "computacion" },
          { nombre: "PlayStation 5", tipo_buscar: "consola", horas: 2, kwh: 0.4, categoria: "entretenimiento" },
        ],
      },
      {
        nombre: "Lavandería", tipo: "lavanderia",
        electrodomesticos: [
          { nombre: "Lavadora LG 10kg", tipo_buscar: "lavadora", horas: 1, kwh: 2.0, categoria: "lavado" },
          { nombre: "Secadora Bosch condensación", tipo_buscar: "secadora", horas: 0.75, kwh: 1.875, categoria: "lavado" },
        ],
      },
    ],
    alertas: [
      { titulo: "Consumo supera límite de invierno", descripcion: "Tu consumo proyectado supera los 430 kWh. Los kWh adicionales tienen un recargo del 28%. Considera reducir el uso del calefactor eléctrico.", severidad: "critical" },
      { titulo: "Calefactor encendido más de 8 horas", descripcion: "El calefactor del living registró más de 8 horas de uso ayer.", severidad: "warning" },
    ],
    recomendaciones: [
      { titulo: "Reemplaza el calefactor por bomba de calor", descripcion: "Un split inverter en modo calor consume hasta 4× menos. Ahorro estimado: $25.000/mes.", prioridad: "high", ahorro: 25000 },
      { titulo: "Cambia a lavado en frío", descripcion: "El 90% del consumo de la lavadora es para calentar agua. Lavado a 30°C ahorra ~60% por ciclo.", prioridad: "medium", ahorro: 3500 },
    ],
  },
  {
    nombre: "Depto Estudiante PUCV",
    direccion: "Av. Brasil 2830, Valparaíso",
    area_m2: 32,
    numero_personas: 1,
    empresa_nombre: "Chilquinta",
    meta_kwh: 130,
    habitaciones: [
      {
        nombre: "Living-Comedor", tipo: "living",
        electrodomesticos: [
          { nombre: 'Smart TV 32" básico', tipo_buscar: "televisor", horas: 3, kwh: 0.12, categoria: "entretenimiento" },
          { nombre: "Router Movistar (24/7)", tipo_buscar: "router", horas: 24, kwh: 0.19, categoria: "entretenimiento" },
          { nombre: "Microondas", tipo_buscar: "microondas", horas: 0.5, kwh: 0.5, categoria: "cocina" },
          { nombre: "Hervidor eléctrico", tipo_buscar: "hervidor", horas: 0.33, kwh: 0.73, categoria: "cocina" },
          { nombre: "Refrigerador pequeño 180L", tipo_buscar: "refrigerador", horas: 24, kwh: 1.5, categoria: "refrigeracion" },
        ],
      },
      {
        nombre: "Dormitorio", tipo: "dormitorio",
        electrodomesticos: [
          { nombre: 'MacBook Pro 14"', tipo_buscar: "computador", horas: 8, kwh: 0.4, categoria: "computacion" },
          { nombre: 'Monitor LG 24" IPS', tipo_buscar: "monitor", horas: 6, kwh: 0.15, categoria: "computacion" },
          { nombre: "Cargador celular + tablet", tipo_buscar: "cargador", horas: 2, kwh: 0.04, categoria: "otros" },
        ],
      },
      {
        nombre: "Baño", tipo: "bano",
        electrodomesticos: [
          { nombre: "Ducha Solahart 5500W", tipo_buscar: "ducha", horas: 0.17, kwh: 0.935, categoria: "cocina" },
        ],
      },
    ],
    alertas: [
      { titulo: "Consumo de standby alto", descripcion: "Tus dispositivos en standby consumen ~8 kWh/mes. Desenchúfalos cuando no estén en uso.", severidad: "info" },
    ],
    recomendaciones: [
      { titulo: "Reduce el tiempo de ducha a 5 minutos", descripcion: "La ducha eléctrica (5.500W) es tu mayor consumidor. Reducir de 10 a 5 min ahorra ~14 kWh/mes ($1.700).", prioridad: "high", ahorro: 1700 },
    ],
  },
  {
    nombre: "Home Office Startup",
    direccion: "Las Condes 4500, Santiago",
    area_m2: 55,
    numero_personas: 2,
    empresa_nombre: "Enel",
    meta_kwh: 280,
    habitaciones: [
      {
        nombre: "Oficina", tipo: "estudio",
        electrodomesticos: [
          { nombre: "MacBook Pro M3 (trabajo)", tipo_buscar: "computador", horas: 9, kwh: 0.45, categoria: "computacion" },
          { nombre: 'Monitor Dell 27" Ultrawide', tipo_buscar: "monitor", horas: 9, kwh: 0.27, categoria: "computacion" },
          { nombre: "PC escritorio diseño", tipo_buscar: "computador", horas: 7, kwh: 1.26, categoria: "computacion" },
          { nombre: 'Monitor ASUS 24" x2', tipo_buscar: "monitor", horas: 7, kwh: 0.35, categoria: "computacion" },
          { nombre: "Router WiFi 6 + Switch (24/7)", tipo_buscar: "router", horas: 24, kwh: 0.3, categoria: "entretenimiento" },
          { nombre: "Split Carrier 9.000 BTU oficina", tipo_buscar: "aire acondicionado", horas: 5, kwh: 4.5, categoria: "climatizacion" },
        ],
      },
      {
        nombre: "Cocina", tipo: "cocina",
        electrodomesticos: [
          { nombre: "Refrigerador Mabe No-Frost 350L", tipo_buscar: "refrigerador", horas: 24, kwh: 3.6, categoria: "refrigeracion" },
          { nombre: "Placa de inducción Whirlpool", tipo_buscar: "induccion", horas: 1, kwh: 2.0, categoria: "cocina" },
          { nombre: "Hervidor eléctrico", tipo_buscar: "hervidor", horas: 0.5, kwh: 1.1, categoria: "cocina" },
        ],
      },
      {
        nombre: "Living", tipo: "living",
        electrodomesticos: [
          { nombre: 'Smart TV OLED 65"', tipo_buscar: "televisor", horas: 3, kwh: 0.39, categoria: "entretenimiento" },
          { nombre: "Xbox Series X", tipo_buscar: "consola", horas: 1, kwh: 0.2, categoria: "entretenimiento" },
        ],
      },
      {
        nombre: "Dormitorio", tipo: "dormitorio",
        electrodomesticos: [
          { nombre: "Split dormitorio 9.000 BTU", tipo_buscar: "aire acondicionado", horas: 7, kwh: 6.3, categoria: "climatizacion" },
        ],
      },
    ],
    alertas: [
      { titulo: "Computadores en standby nocturno", descripcion: "Se detectaron 2 computadores con consumo en standby entre 01:00–07:00. Configura suspensión automática.", severidad: "warning" },
    ],
    recomendaciones: [
      { titulo: "Configura suspensión automática en el PC", descripcion: "El PC de escritorio en standby 8h/noche acumula ~4.8 kWh/mes (~$700). Suspensión tras 15 min de inactividad.", prioridad: "medium", ahorro: 700 },
      { titulo: "Reemplaza split dormitorio por modelo inverter", descripcion: "Un split inverter ahorra hasta 50% vs convencional. Con 7h/día: ~$8.500/mes en temporada.", prioridad: "high", ahorro: 8500 },
    ],
  },
];

// ── Tipos para escenario custom (formato Gemini) ─────────────────────────────

interface CustomAppliance {
  nombre: string;
  tipo_buscar: string;
  horas: number;
  kwh_dia: number;
  categoria: string;
  nota?: string;
}

interface CustomRoom {
  nombre: string;
  tipo: string;
  electrodomesticos: CustomAppliance[];
}

interface CustomScenario {
  hogar: {
    nombre: string;
    direccion: string;
    area_m2: number;
    numero_personas: number;
    empresa_nombre: string;
    meta_kwh: number;
    ultima_boleta_clp?: number;
  };
  habitaciones: CustomRoom[];
}

const TIPO_HAB_MAP: Record<string, string> = {
  living_dormitorio: "living",
  salon: "living",
  "living-comedor": "living",
  bano: "bano",
  baño: "bano",
  lavanderia: "lavanderia",
  lavandería: "lavanderia",
  estudio: "estudio",
  garage: "garage",
  patio: "patio",
};

function mapTipoHab(tipo: string): string {
  const lower = tipo.toLowerCase();
  if (TIPO_HAB_MAP[lower]) return TIPO_HAB_MAP[lower];
  const validos = ["cocina","dormitorio","bano","living","comedor","lavanderia","estudio","garage","patio","otro"];
  return validos.includes(lower) ? lower : "otro";
}

/** Genera alertas y recomendaciones automáticas según el contenido del hogar */
function generarInsights(scenario: CustomScenario) {
  const alertas: { titulo: string; descripcion: string; severidad: string }[] = [];
  const recomendaciones: { titulo: string; descripcion: string; prioridad: string; ahorro: number }[] = [];

  const totalKwh = scenario.hogar.meta_kwh;
  const allAppliances = scenario.habitaciones.flatMap(h => h.electrodomesticos);

  // Alerta límite invierno
  if (totalKwh > 430) {
    const exceso = totalKwh - 430;
    alertas.push({
      titulo: "Consumo supera el límite de invierno BT1",
      descripcion: `Consumes ${totalKwh} kWh/mes estimados. En junio–septiembre, los ${Math.round(exceso)} kWh extras tienen recargo de $156/kWh (vs $122 normal). Eso es ~$${Math.round(exceso * (156.3 - 121.8) * 1.19).toLocaleString()} extra en boleta.`,
      severidad: "critical",
    });
  }

  // Detectar refrigerador antiguo
  const frigosAntiguos = allAppliances.filter(a => a.tipo_buscar.includes("antiguo") || a.kwh_dia > 5.5);
  if (frigosAntiguos.length > 0) {
    const consumoExtra = frigosAntiguos.reduce((s, a) => s + (a.kwh_dia - 2.16) * 30, 0);
    const ahorroCLP = Math.round(consumoExtra * 121.8 * 1.19);
    recomendaciones.push({
      titulo: `Reemplaza el${frigosAntiguos.length > 1 ? " los" : ""} refrigerador${frigosAntiguos.length > 1 ? "es" : ""} antiguo${frigosAntiguos.length > 1 ? "s" : ""}`,
      descripcion: `Un refrigerador de más de 10 años consume hasta 3× más que uno A+++ actual. Reemplazarlo puede ahorrarte ~${Math.round(consumoExtra)} kWh/mes (~$${ahorroCLP.toLocaleString()}/mes en boleta).`,
      prioridad: "high",
      ahorro: ahorroCLP,
    });
    alertas.push({
      titulo: "Refrigerador antiguo detectado — alto consumo base",
      descripcion: `${frigosAntiguos.map(a => a.nombre).join(", ")} consume estimado ${frigosAntiguos.reduce((s, a) => s + a.kwh_dia, 0).toFixed(1)} kWh/día = ${frigosAntiguos.reduce((s, a) => s + a.kwh_dia * 30, 0).toFixed(0)} kWh/mes solo en refrigeración.`,
      severidad: "warning",
    });
  }

  // Múltiples TVs
  const tvs = allAppliances.filter(a => a.tipo_buscar.includes("tv") || a.tipo_buscar.includes("tele"));
  if (tvs.length > 0 && tvs.reduce((s, a) => s + a.kwh_dia, 0) > 0.8) {
    recomendaciones.push({
      titulo: "Activa el apagado automático en televisores",
      descripcion: "Configura el sleep timer en todos los TVs. Un televisor en standby consume hasta 0.5W — con 3 unidades son ~1 kWh/mes innecesario.",
      prioridad: "low",
      ahorro: Math.round(0.5 * 3 * 24 * 30 / 1000 * 121.8 * 1.19),
    });
  }

  // Si hay dos o más refrigeradores
  const fridges = allAppliances.filter(a => a.tipo_buscar.includes("refriger") || a.tipo_buscar.includes("fridge"));
  if (fridges.length >= 2) {
    alertas.push({
      titulo: "Dos refrigeradores activos",
      descripcion: `Tienes ${fridges.length} refrigeradores funcionando simultáneamente (${fridges.reduce((s,a) => s + a.kwh_dia * 30, 0).toFixed(0)} kWh/mes en total). Si uno es de respaldo, apagarlo puede ahorrar significativamente.`,
      severidad: "info",
    });
  }

  return { alertas, recomendaciones };
}

// ── Función compartida para seed de un escenario ──────────────────────────────

async function seedEscenarioCustom(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  scenario: CustomScenario,
  seedOffset: number
): Promise<string> {
  const { data: empresaData } = await supabase
    .from("empresas_electricas")
    .select("id")
    .ilike("nombre", `%${scenario.hogar.empresa_nombre.split(" ")[0]}%`)
    .limit(1)
    .maybeSingle();

  const { data: hogar, error: hogarError } = await supabase
    .from("hogares")
    .insert({
      usuario_id: userId,
      nombre: scenario.hogar.nombre,
      direccion: scenario.hogar.direccion,
      area_m2: scenario.hogar.area_m2,
      numero_personas: scenario.hogar.numero_personas,
      empresa_electrica_id: empresaData?.id ?? null,
      limite_kwh_diario: Math.round(scenario.hogar.meta_kwh / 30),
      activo: true,
    })
    .select()
    .single();

  if (hogarError) throw new Error(`hogar: ${hogarError.message}`);

  const mesActual = new Date().toISOString().slice(0, 7);
  await supabase.from("metas_consumo").insert({
    hogar_id: hogar.id,
    mes_ano: mesActual,
    consumo_kwh_meta: scenario.hogar.meta_kwh,
    costo_pesos_meta: Math.round(scenario.hogar.meta_kwh * 143),
    estado: "active",
  });

  const { alertas, recomendaciones } = generarInsights(scenario);

  for (const alerta of alertas) {
    await supabase.from("alertas").insert({ hogar_id: hogar.id, ...alerta, leida: false });
  }

  let orden = 1;
  let offset = seedOffset;
  for (const habDef of scenario.habitaciones) {
    const tipoHab = mapTipoHab(habDef.tipo);
    const { data: hab, error: habError } = await supabase
      .from("habitaciones")
      .insert({ hogar_id: hogar.id, nombre: habDef.nombre, tipo: tipoHab, orden: orden++, activo: true })
      .select()
      .single();

    if (habError) throw new Error(`habitacion: ${habError.message}`);

    for (const app of habDef.electrodomesticos) {
      const { data: tipoData } = await supabase
        .from("tipos_electrodomestico")
        .select("id")
        .ilike("nombre", `%${app.tipo_buscar.replace(/_/g, " ").split("_")[0]}%`)
        .eq("activo", true)
        .limit(1)
        .maybeSingle();

      const { data: electro, error: electroError } = await supabase
        .from("electrodomesticos")
        .insert({
          habitacion_id: hab.id,
          tipo_id: tipoData?.id ?? null,
          nombre_personalizado: app.nombre,
          es_personalizado: true,
          horas_uso_diarias: app.horas,
          consumo_kwh_ajustado: app.kwh_dia,
          activo: true,
        })
        .select()
        .single();

      if (electroError) throw new Error(`electrodomestico: ${electroError.message}`);

      const consumoRows = Array.from({ length: 30 }, (_, dia) => ({
        electrodomestico_id: electro.id,
        fecha: fechaHaceNDias(29 - dia),
        horas_uso_registradas: app.horas,
        consumo_kwh_registrado: parseFloat(
          variarConsumo(app.kwh_dia, dia, app.categoria.toLowerCase(), offset++).toFixed(3)
        ),
        activo: true,
      }));

      await supabase.from("consumo_diario").insert(consumoRows);
    }
  }

  for (const rec of recomendaciones) {
    await supabase.from("recomendaciones").insert({
      hogar_id: hogar.id,
      titulo: rec.titulo,
      descripcion: rec.descripcion,
      prioridad: rec.prioridad,
      ahorro_potencial_pesos: rec.ahorro,
      estado: "pending",
    });
  }

  return `✓ ${scenario.hogar.nombre} (id=${hogar.id})`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json() as { user_id: string; scenario?: CustomScenario };
    const { user_id, scenario } = body;
    if (!user_id) return new Response(JSON.stringify({ error: "user_id requerido" }), { status: 400, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Modo custom: seed de un escenario personalizado (formato Gemini)
    if (scenario) {
      const result = await seedEscenarioCustom(supabase, user_id, scenario, 9999);
      return new Response(
        JSON.stringify({ ok: true, hogares_creados: [result] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: string[] = [];
    let seedOffset = 0;

    for (const escenario of ESCENARIOS) {
      // Resolver empresa
      const { data: empresaData } = await supabase
        .from("empresas_electricas")
        .select("id")
        .ilike("nombre", `%${escenario.empresa_nombre}%`)
        .limit(1)
        .maybeSingle();

      // Crear hogar
      const { data: hogar, error: hogarError } = await supabase
        .from("hogares")
        .insert({
          usuario_id: user_id,
          nombre: escenario.nombre,
          direccion: escenario.direccion,
          area_m2: escenario.area_m2,
          numero_personas: escenario.numero_personas,
          empresa_electrica_id: empresaData?.id ?? null,
          limite_kwh_diario: Math.round(escenario.meta_kwh / 30),
          activo: true,
        })
        .select()
        .single();

      if (hogarError) throw new Error(`hogar: ${hogarError.message}`);

      // Meta mensual
      const mesActual = new Date().toISOString().slice(0, 7);
      await supabase.from("metas_consumo").insert({
        hogar_id: hogar.id,
        mes_ano: mesActual,
        consumo_kwh_meta: escenario.meta_kwh,
        costo_pesos_meta: Math.round(escenario.meta_kwh * 143),
        estado: "active",
      });

      // Alertas
      for (const alerta of escenario.alertas) {
        await supabase.from("alertas").insert({ hogar_id: hogar.id, ...alerta, leida: false });
      }

      // Habitaciones → electrodomésticos → consumo_diario
      let orden = 1;
      for (const habDef of escenario.habitaciones) {
        const { data: hab, error: habError } = await supabase
          .from("habitaciones")
          .insert({ hogar_id: hogar.id, nombre: habDef.nombre, tipo: habDef.tipo, orden: orden++, activo: true })
          .select()
          .single();

        if (habError) throw new Error(`habitacion: ${habError.message}`);

        for (const app of habDef.electrodomesticos) {
          const { data: tipoData } = await supabase
            .from("tipos_electrodomestico")
            .select("id")
            .ilike("nombre", `%${app.tipo_buscar}%`)
            .eq("activo", true)
            .limit(1)
            .maybeSingle();

          const { data: electro, error: electroError } = await supabase
            .from("electrodomesticos")
            .insert({
              habitacion_id: hab.id,
              tipo_id: tipoData?.id ?? null,
              nombre_personalizado: app.nombre,
              es_personalizado: true,
              horas_uso_diarias: app.horas,
              consumo_kwh_ajustado: app.kwh,
              activo: true,
            })
            .select()
            .single();

          if (electroError) throw new Error(`electrodomestico: ${electroError.message}`);

          const consumoRows = Array.from({ length: 30 }, (_, dia) => ({
            electrodomestico_id: electro.id,
            fecha: fechaHaceNDias(29 - dia),
            horas_uso_registradas: app.horas,
            consumo_kwh_registrado: parseFloat(
              variarConsumo(app.kwh, dia, app.categoria, seedOffset++).toFixed(3)
            ),
            activo: true,
          }));

          await supabase.from("consumo_diario").insert(consumoRows);
        }
      }

      // Recomendaciones
      for (const rec of escenario.recomendaciones) {
        await supabase.from("recomendaciones").insert({
          hogar_id: hogar.id,
          titulo: rec.titulo,
          descripcion: rec.descripcion,
          prioridad: rec.prioridad,
          ahorro_potencial_pesos: rec.ahorro,
          estado: "pending",
        });
      }

      results.push(`✓ ${escenario.nombre} (id=${hogar.id})`);
    }

    return new Response(
      JSON.stringify({ ok: true, hogares_creados: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
