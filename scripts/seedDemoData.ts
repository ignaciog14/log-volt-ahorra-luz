/**
 * LOGVOLT — Script de datos de demostración
 *
 * Crea 3 escenarios de hogar realistas con 30 días de consumo histórico:
 *   1. Familia García     — Santiago, Enel, 4 personas, ~520 kWh/mes (supera límite invierno)
 *   2. Depto Estudiante  — Valparaíso, Chilquinta, 1 persona, ~120 kWh/mes
 *   3. Home Office Pro   — Santiago, Enel, 2 personas + trabajo remoto, ~280 kWh/mes
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... SEED_USER_ID=<uuid> npx tsx scripts/seedDemoData.ts
 *
 * El SERVICE_KEY (service_role) es necesario para saltar RLS.
 * SEED_USER_ID debe ser el UUID de un usuario ya registrado en auth.users.
 */

import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? "";
const SEED_USER_ID = process.env.SEED_USER_ID ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SEED_USER_ID) {
  console.error(
    "Faltan variables de entorno:\n" +
      "  SUPABASE_URL, SUPABASE_SERVICE_KEY, SEED_USER_ID\n\n" +
      "Ejemplo:\n" +
      '  SUPABASE_URL="https://xxxx.supabase.co" \\\n' +
      '  SUPABASE_SERVICE_KEY="eyJ..." \\\n' +
      '  SEED_USER_ID="00000000-0000-0000-0000-000000000000" \\\n' +
      "  npx tsx scripts/seedDemoData.ts"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Pseudo-random seeded number en [0, 1) */
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10_000;
  return x - Math.floor(x);
}

/**
 * Genera variación diaria de consumo.
 * - ±15% ruido base
 * - fines de semana +20% para entretenimiento, -10% para cocina/lavado
 * - tendencia +0.3% acumulativo por día (mala costumbre de no apagar)
 */
function variarConsumo(
  baseKwh: number,
  diaIndex: number,         // 0 = 30 días atrás
  categoria: string,
  seed: number
): number {
  const rand = seededRand(seed * 31 + diaIndex);
  const noise = (rand - 0.5) * 0.3;          // ±15%
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - (29 - diaIndex));
  const esFinDeSemana = fecha.getDay() === 0 || fecha.getDay() === 6;
  const weekendFactor =
    esFinDeSemana && categoria === "entretenimiento" ? 0.2 :
    esFinDeSemana && ["lavado", "cocina"].includes(categoria) ? -0.1 : 0;
  const trend = diaIndex * 0.003;             // +0.3%/día

  return Math.max(0.001, baseKwh * (1 + noise + weekendFactor + trend));
}

/** Fecha ISO YYYY-MM-DD desplazada N días atrás desde hoy */
function fechaHaceNDias(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Inserta y retorna el primer row, lanzando si hay error */
async function insertOne<T extends object>(
  tabla: string,
  row: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase
    .from(tabla)
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(`[${tabla}] ${error.message}`);
  return data as T;
}

/** Busca un tipo_electrodomestico por nombre parcial (case-insensitive) */
async function buscarTipoId(nombre: string): Promise<number | null> {
  const { data } = await supabase
    .from("tipos_electrodomestico")
    .select("id")
    .ilike("nombre", `%${nombre}%`)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

// ── Definición de escenarios ──────────────────────────────────────────────────

interface ApplianceDef {
  nombre: string;                 // para buscar tipo_id en DB
  nombre_personalizado?: string;
  horas_uso_diarias: number;
  consumo_kwh_ajustado: number;   // kWh/día como fallback
  categoria: string;
}

interface HabitacionDef {
  nombre: string;
  tipo: string;
  electrodomesticos: ApplianceDef[];
}

interface EscenarioDef {
  nombre: string;
  direccion: string;
  area_m2: number;
  numero_personas: number;
  empresa_nombre: string;         // para lookup empresa_electrica_id
  habitaciones: HabitacionDef[];
  meta_kwh: number;
  alertas: { titulo: string; descripcion: string; severidad: "info" | "warning" | "critical" }[];
  recomendaciones: { titulo: string; descripcion: string; prioridad: "low" | "medium" | "high"; ahorro: number }[];
}

const ESCENARIOS: EscenarioDef[] = [
  // ── 1. FAMILIA GARCÍA ────────────────────────────────────────────────────────
  {
    nombre: "Casa Familia García",
    direccion: "Av. Providencia 1234, Santiago",
    area_m2: 90,
    numero_personas: 4,
    empresa_nombre: "Enel Distribución",
    meta_kwh: 430, // justo en el límite de invierno
    habitaciones: [
      {
        nombre: "Cocina",
        tipo: "cocina",
        electrodomesticos: [
          { nombre: "refrigerador", nombre_personalizado: "Refrigerador Samsung No-Frost", horas_uso_diarias: 24, consumo_kwh_ajustado: 4.5, categoria: "refrigeracion" },
          { nombre: "microondas", horas_uso_diarias: 0.25, consumo_kwh_ajustado: 0.25, categoria: "cocina" },
          { nombre: "hervidor", nombre_personalizado: "Hervidor Oster 1.7L", horas_uso_diarias: 0.25, consumo_kwh_ajustado: 0.55, categoria: "cocina" },
          { nombre: "lavavajillas", horas_uso_diarias: 1, consumo_kwh_ajustado: 1.8, categoria: "lavado" },
        ],
      },
      {
        nombre: "Living",
        tipo: "living",
        electrodomesticos: [
          { nombre: "televisor", nombre_personalizado: "Smart TV Samsung 55\"", horas_uso_diarias: 5, consumo_kwh_ajustado: 0.5, categoria: "entretenimiento" },
          { nombre: "router", nombre_personalizado: "Router WiFi TP-Link (24/7)", horas_uso_diarias: 24, consumo_kwh_ajustado: 0.19, categoria: "entretenimiento" },
          { nombre: "calefactor", nombre_personalizado: "Calefactor de aceite 2000W", horas_uso_diarias: 6, consumo_kwh_ajustado: 12, categoria: "climatizacion" },
        ],
      },
      {
        nombre: "Dormitorio Principal",
        tipo: "dormitorio",
        electrodomesticos: [
          { nombre: "televisor", nombre_personalizado: "Smart TV LG 32\"", horas_uso_diarias: 2, consumo_kwh_ajustado: 0.08, categoria: "entretenimiento" },
          { nombre: "aire acondicionado", nombre_personalizado: "Split Midea 12.000 BTU", horas_uso_diarias: 4, consumo_kwh_ajustado: 4.8, categoria: "climatizacion" },
        ],
      },
      {
        nombre: "Dormitorio Niños",
        tipo: "dormitorio",
        electrodomesticos: [
          { nombre: "computador", nombre_personalizado: "Notebook HP estudiante", horas_uso_diarias: 3, consumo_kwh_ajustado: 0.15, categoria: "computacion" },
          { nombre: "consola", nombre_personalizado: "PlayStation 5", horas_uso_diarias: 2, consumo_kwh_ajustado: 0.4, categoria: "entretenimiento" },
        ],
      },
      {
        nombre: "Lavandería",
        tipo: "lavanderia",
        electrodomesticos: [
          { nombre: "lavadora", nombre_personalizado: "Lavadora LG 10kg", horas_uso_diarias: 1, consumo_kwh_ajustado: 2.0, categoria: "lavado" },
          { nombre: "secadora", nombre_personalizado: "Secadora condensación Bosch", horas_uso_diarias: 0.75, consumo_kwh_ajustado: 1.875, categoria: "lavado" },
        ],
      },
    ],
    alertas: [
      {
        titulo: "Consumo supera límite de invierno",
        descripcion: "Tu consumo proyectado para este mes supera los 430 kWh. Los kWh adicionales tienen un recargo del 28%. Considera reducir el uso del calefactor eléctrico.",
        severidad: "critical",
      },
      {
        titulo: "Calefactor encendido más de 8 horas",
        descripcion: "El calefactor del living registró más de 8 horas de uso ayer. Usa temporizador o baja la potencia.",
        severidad: "warning",
      },
    ],
    recomendaciones: [
      {
        titulo: "Reemplaza el calefactor eléctrico por bomba de calor",
        descripcion: "Una bomba de calor (split inverter en modo calor) consume hasta 4× menos que una resistencia eléctrica directa para la misma cantidad de calor. Con 6h/día de uso en invierno, el ahorro puede superar $25.000/mes.",
        prioridad: "high",
        ahorro: 25000,
      },
      {
        titulo: "Cambia a lavado en frío",
        descripcion: "El 90% del consumo de la lavadora es para calentar agua. Un ciclo a 30°C en lugar de 60°C reduce el consumo por ciclo en ~60%. Ahorro estimado: $3.500/mes.",
        prioridad: "medium",
        ahorro: 3500,
      },
      {
        titulo: "Activa el modo eco en el lavavajillas",
        descripcion: "El modo eco reduce la temperatura del agua de lavado. Puede ahorrar hasta 1 kWh por ciclo. Con uso diario: $4.300/mes.",
        prioridad: "low",
        ahorro: 4300,
      },
    ],
  },

  // ── 2. DEPTO ESTUDIANTE ───────────────────────────────────────────────────────
  {
    nombre: "Depto Estudiante PUCV",
    direccion: "Av. Brasil 2830, Valparaíso",
    area_m2: 32,
    numero_personas: 1,
    empresa_nombre: "Chilquinta",
    meta_kwh: 130,
    habitaciones: [
      {
        nombre: "Living-Comedor",
        tipo: "living",
        electrodomesticos: [
          { nombre: "televisor", nombre_personalizado: "Smart TV 32\" básico", horas_uso_diarias: 3, consumo_kwh_ajustado: 0.12, categoria: "entretenimiento" },
          { nombre: "router", nombre_personalizado: "Router Movistar (24/7)", horas_uso_diarias: 24, consumo_kwh_ajustado: 0.19, categoria: "entretenimiento" },
          { nombre: "microondas", horas_uso_diarias: 0.5, consumo_kwh_ajustado: 0.5, categoria: "cocina" },
          { nombre: "hervidor", horas_uso_diarias: 0.33, consumo_kwh_ajustado: 0.73, categoria: "cocina" },
          { nombre: "refrigerador", nombre_personalizado: "Refrigerador pequeño 180L", horas_uso_diarias: 24, consumo_kwh_ajustado: 1.5, categoria: "refrigeracion" },
        ],
      },
      {
        nombre: "Dormitorio",
        tipo: "dormitorio",
        electrodomesticos: [
          { nombre: "computador", nombre_personalizado: "MacBook Pro 14\"", horas_uso_diarias: 8, consumo_kwh_ajustado: 0.4, categoria: "computacion" },
          { nombre: "monitor", nombre_personalizado: "Monitor LG 24\" IPS", horas_uso_diarias: 6, consumo_kwh_ajustado: 0.15, categoria: "computacion" },
          { nombre: "cargador", nombre_personalizado: "Cargador celular + tablet", horas_uso_diarias: 2, consumo_kwh_ajustado: 0.04, categoria: "otros" },
        ],
      },
      {
        nombre: "Baño",
        tipo: "bano",
        electrodomesticos: [
          { nombre: "ducha eléctrica", nombre_personalizado: "Ducha Solahart 5500W", horas_uso_diarias: 0.17, consumo_kwh_ajustado: 0.935, categoria: "cocina" },
        ],
      },
    ],
    alertas: [
      {
        titulo: "Consumo de standby alto",
        descripcion: "Tus dispositivos en standby (cargadores, TV, router) consumen ~8 kWh/mes aunque no los uses activamente. Desenchúfalos cuando no estén en uso.",
        severidad: "info",
      },
    ],
    recomendaciones: [
      {
        titulo: "Reduce el tiempo de ducha a 5 minutos",
        descripcion: "La ducha eléctrica (5.500W) es el mayor consumidor de tu departamento. Reducir de 10 a 5 minutos te ahorra ~14 kWh/mes y aproximadamente $1.700.",
        prioridad: "high",
        ahorro: 1700,
      },
      {
        titulo: "Desenchúfa los cargadores al terminar",
        descripcion: "Los cargadores de celular y tablet conectados sin usar consumen hasta 0.5W cada uno. En un mes: 0.36 kWh. Pequeño, pero es un hábito que suma.",
        prioridad: "low",
        ahorro: 150,
      },
    ],
  },

  // ── 3. HOME OFFICE PRO ────────────────────────────────────────────────────────
  {
    nombre: "Home Office Startup",
    direccion: "Las Condes 4500, Santiago",
    area_m2: 55,
    numero_personas: 2,
    empresa_nombre: "Enel Distribución",
    meta_kwh: 280,
    habitaciones: [
      {
        nombre: "Oficina",
        tipo: "estudio",
        electrodomesticos: [
          { nombre: "computador", nombre_personalizado: "MacBook Pro M3 (trabajo)", horas_uso_diarias: 9, consumo_kwh_ajustado: 0.45, categoria: "computacion" },
          { nombre: "monitor", nombre_personalizado: "Monitor Dell 27\" Ultrawide", horas_uso_diarias: 9, consumo_kwh_ajustado: 0.27, categoria: "computacion" },
          { nombre: "computador", nombre_personalizado: "PC escritorio diseño gráfico", horas_uso_diarias: 7, consumo_kwh_ajustado: 1.26, categoria: "computacion" },
          { nombre: "monitor", nombre_personalizado: "Monitor ASUS 24\" x2", horas_uso_diarias: 7, consumo_kwh_ajustado: 0.35, categoria: "computacion" },
          { nombre: "router", nombre_personalizado: "Router WiFi 6 + Switch (24/7)", horas_uso_diarias: 24, consumo_kwh_ajustado: 0.3, categoria: "entretenimiento" },
          { nombre: "aire acondicionado", nombre_personalizado: "Split Inverter Carrier 9.000 BTU", horas_uso_diarias: 5, consumo_kwh_ajustado: 4.5, categoria: "climatizacion" },
        ],
      },
      {
        nombre: "Cocina",
        tipo: "cocina",
        electrodomesticos: [
          { nombre: "refrigerador", nombre_personalizado: "Refrigerador Mabe No-Frost 350L", horas_uso_diarias: 24, consumo_kwh_ajustado: 3.6, categoria: "refrigeracion" },
          { nombre: "cocina inducción", nombre_personalizado: "Placa de inducción Whirlpool 4 zonas", horas_uso_diarias: 1, consumo_kwh_ajustado: 2.0, categoria: "cocina" },
          { nombre: "hervidor", horas_uso_diarias: 0.5, consumo_kwh_ajustado: 1.1, categoria: "cocina" },
          { nombre: "microondas", horas_uso_diarias: 0.25, consumo_kwh_ajustado: 0.25, categoria: "cocina" },
        ],
      },
      {
        nombre: "Living",
        tipo: "living",
        electrodomesticos: [
          { nombre: "televisor", nombre_personalizado: "Smart TV OLED 65\"", horas_uso_diarias: 3, consumo_kwh_ajustado: 0.39, categoria: "entretenimiento" },
          { nombre: "consola", nombre_personalizado: "Xbox Series X", horas_uso_diarias: 1, consumo_kwh_ajustado: 0.2, categoria: "entretenimiento" },
        ],
      },
      {
        nombre: "Dormitorio",
        tipo: "dormitorio",
        electrodomesticos: [
          { nombre: "aire acondicionado", nombre_personalizado: "Split dormitorio 9.000 BTU", horas_uso_diarias: 7, consumo_kwh_ajustado: 6.3, categoria: "climatizacion" },
        ],
      },
    ],
    alertas: [
      {
        titulo: "Computadores en standby durante la noche",
        descripcion: "Se detectaron 2 computadores con consumo en standby entre 01:00 y 07:00. Configura el modo suspensión automático para ahorrar ~4 kWh/mes.",
        severidad: "warning",
      },
    ],
    recomendaciones: [
      {
        titulo: "Configura suspensión automática en PC escritorio",
        descripcion: "El PC de escritorio consume ~2W en standby. Si queda encendido 8h/noche sin uso, acumula ~4.8 kWh/mes (~$700). Configura suspensión automática después de 15 min de inactividad.",
        prioridad: "medium",
        ahorro: 700,
      },
      {
        titulo: "Reemplaza el split del dormitorio por modelo inverter",
        descripcion: "Un split convencional consume hasta 50% más que uno inverter de la misma capacidad. Con 7h/día de uso, cambiar a inverter ahorraría ~$8.500/mes en temporada de uso.",
        prioridad: "high",
        ahorro: 8500,
      },
    ],
  },
];

// ── Runner ────────────────────────────────────────────────────────────────────

async function resolverEmpresaId(nombre: string): Promise<number | null> {
  const { data } = await supabase
    .from("empresas_electricas")
    .select("id")
    .ilike("nombre", `%${nombre.split(" ")[0]}%`)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function seedEscenario(escenario: EscenarioDef, idx: number): Promise<void> {
  const log = (msg: string) => console.log(`  [${idx + 1}/${ESCENARIOS.length}] ${msg}`);

  // 1. Hogar
  const empresaId = await resolverEmpresaId(escenario.empresa_nombre);
  const hogar = await insertOne<{ id: number }>("hogares", {
    usuario_id: SEED_USER_ID,
    nombre: escenario.nombre,
    direccion: escenario.direccion,
    area_m2: escenario.area_m2,
    numero_personas: escenario.numero_personas,
    empresa_electrica_id: empresaId,
    limite_kwh_diario: Math.round(escenario.meta_kwh / 30),
    activo: true,
  });
  log(`Hogar creado: ${escenario.nombre} (id=${hogar.id})`);

  // 2. Meta mensual
  const mesActual = new Date().toISOString().slice(0, 7); // YYYY-MM
  await supabase.from("metas_consumo").insert({
    hogar_id: hogar.id,
    mes_ano: mesActual,
    consumo_kwh_meta: escenario.meta_kwh,
    costo_pesos_meta: Math.round(escenario.meta_kwh * 143), // ~143 CLP/kWh c/IVA
    estado: "active",
  });

  // 3. Alertas
  for (const alerta of escenario.alertas) {
    await supabase.from("alertas").insert({
      hogar_id: hogar.id,
      titulo: alerta.titulo,
      descripcion: alerta.descripcion,
      severidad: alerta.severidad,
      leida: false,
    });
  }

  // 4. Habitaciones → electrodomésticos → consumo_diario
  let habOrden = 1;
  let applianceSeedOffset = idx * 1000;

  for (const habDef of escenario.habitaciones) {
    const habitacion = await insertOne<{ id: number }>("habitaciones", {
      hogar_id: hogar.id,
      nombre: habDef.nombre,
      tipo: habDef.tipo,
      orden: habOrden++,
      activo: true,
    });

    for (const appDef of habDef.electrodomesticos) {
      const tipoId = await buscarTipoId(appDef.nombre);

      const electro = await insertOne<{ id: number }>("electrodomesticos", {
        habitacion_id: habitacion.id,
        tipo_id: tipoId,
        nombre_personalizado: appDef.nombre_personalizado ?? null,
        es_personalizado: !!appDef.nombre_personalizado,
        horas_uso_diarias: appDef.horas_uso_diarias,
        consumo_kwh_ajustado: appDef.consumo_kwh_ajustado,
        activo: true,
      });

      // 30 días de consumo histórico
      const consumoRows = Array.from({ length: 30 }, (_, dia) => ({
        electrodomestico_id: electro.id,
        fecha: fechaHaceNDias(29 - dia),
        horas_uso_registradas: appDef.horas_uso_diarias,
        consumo_kwh_registrado: parseFloat(
          variarConsumo(
            appDef.consumo_kwh_ajustado,
            dia,
            appDef.categoria,
            applianceSeedOffset++
          ).toFixed(3)
        ),
        activo: true,
      }));

      const { error: consumoError } = await supabase
        .from("consumo_diario")
        .insert(consumoRows);

      if (consumoError) {
        console.warn(`    ⚠ consumo_diario insert: ${consumoError.message}`);
      } else {
        log(`  + ${appDef.nombre_personalizado ?? appDef.nombre} → 30 días consumo OK`);
      }
    }
  }

  // 5. Recomendaciones
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

  log(`✓ Escenario completo\n`);
}

async function main() {
  console.log("=== LogVolt Demo Seed ===\n");
  console.log(`Usuario: ${SEED_USER_ID}`);
  console.log(`Supabase: ${SUPABASE_URL}\n`);

  for (let i = 0; i < ESCENARIOS.length; i++) {
    await seedEscenario(ESCENARIOS[i], i);
  }

  console.log("=== Seed completado ===");
  console.log(`Se crearon ${ESCENARIOS.length} hogares con datos de los últimos 30 días.`);
}

main().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
