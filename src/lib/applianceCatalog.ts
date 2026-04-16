/**
 * LOGVOLT - Catálogo de Referencia de Electrodomésticos
 *
 * Fuentes:
 * - Guías de eficiencia energética SEC Chile (2023)
 * - Ficha técnica fabricantes: Samsung, LG, Mabe, Bosch, Whirlpool
 * - Etiquetado energético CE/Proconsumer (clases A+++ a G)
 * - Mediciones reales publicadas por ACESOL / CNE Chile
 *
 * Potencia standby: IEEE 1680 / IEC 62301 (modo espera)
 */

export type CategoriaElectrodomestico =
  | "refrigeracion"
  | "lavado"
  | "climatizacion"
  | "cocina"
  | "entretenimiento"
  | "iluminacion"
  | "computacion"
  | "otros";

export interface ModeloReferencia {
  id: string;
  nombre: string;
  descripcion: string;
  potencia_watt: number;
  potencia_standby_watt: number; // consumo vampiro
  horas_uso_tipicas_dia: number;
  categoria: CategoriaElectrodomestico;
  eficiencia: "A+++" | "A++" | "A+" | "A" | "B" | "C" | "D" | "N/A";
  nota?: string;
}

export const CATALOGO_REFERENCIA: ModeloReferencia[] = [
  // ── REFRIGERACIÓN ───────────────────────────────────────────────────────────
  {
    id: "fridge_aaa",
    nombre: "Refrigerador A+++ (eficiente)",
    descripcion: "No-frost 300–400L, menos de 5 años",
    potencia_watt: 90,
    potencia_standby_watt: 0,
    horas_uso_tipicas_dia: 24,
    categoria: "refrigeracion",
    eficiencia: "A+++",
    nota: "Funciona 24/7 con ciclos de encendido/apagado automáticos",
  },
  {
    id: "fridge_standard",
    nombre: "Refrigerador estándar (clase A–B)",
    descripcion: "No-frost 300–400L, 5–10 años",
    potencia_watt: 150,
    potencia_standby_watt: 0,
    horas_uso_tipicas_dia: 24,
    categoria: "refrigeracion",
    eficiencia: "A",
  },
  {
    id: "fridge_old",
    nombre: "Refrigerador antiguo (>10 años)",
    descripcion: "No-frost u escarcha, más de 10 años de uso",
    potencia_watt: 280,
    potencia_standby_watt: 0,
    horas_uso_tipicas_dia: 24,
    categoria: "refrigeracion",
    eficiencia: "C",
    nota: "Candidato prioritario a reemplazo — puede consumir 3× más que uno eficiente",
  },
  {
    id: "freezer",
    nombre: "Freezer independiente",
    descripcion: "Congelador vertical o horizontal 200–300L",
    potencia_watt: 120,
    potencia_standby_watt: 0,
    horas_uso_tipicas_dia: 24,
    categoria: "refrigeracion",
    eficiencia: "A+",
  },

  // ── LAVADO ───────────────────────────────────────────────────────────────────
  {
    id: "washing_machine",
    nombre: "Lavadora (ciclo completo)",
    descripcion: "Lavadora 7–10 kg, ciclo a 40°C",
    potencia_watt: 2_000,
    potencia_standby_watt: 1.5,
    horas_uso_tipicas_dia: 1,
    categoria: "lavado",
    eficiencia: "A+",
    nota: "Consumo real varía según temperatura: lavado frío usa ~30% menos",
  },
  {
    id: "dryer",
    nombre: "Secadora eléctrica",
    descripcion: "Secadora por condensación o bomba de calor",
    potencia_watt: 2_500,
    potencia_standby_watt: 1.0,
    horas_uso_tipicas_dia: 1,
    categoria: "lavado",
    eficiencia: "A",
  },
  {
    id: "dishwasher",
    nombre: "Lavavajillas",
    descripcion: "Lavavajillas 12–14 cubiertos, ciclo normal",
    potencia_watt: 1_800,
    potencia_standby_watt: 1.5,
    horas_uso_tipicas_dia: 1,
    categoria: "lavado",
    eficiencia: "A+++",
  },
  {
    id: "iron",
    nombre: "Plancha de ropa",
    descripcion: "Plancha a vapor 2200W",
    potencia_watt: 2_200,
    potencia_standby_watt: 0,
    horas_uso_tipicas_dia: 0.5,
    categoria: "lavado",
    eficiencia: "N/A",
  },

  // ── CLIMATIZACIÓN ────────────────────────────────────────────────────────────
  {
    id: "ac_split",
    nombre: "Aire acondicionado split (frío/calor)",
    descripcion: "Split 12.000 BTU, inverter clase A",
    potencia_watt: 1_200,
    potencia_standby_watt: 8,
    horas_uso_tipicas_dia: 6,
    categoria: "climatizacion",
    eficiencia: "A++",
    nota: "En modo calor consume ~10% más. Inverter consume hasta 50% menos que convencional.",
  },
  {
    id: "ac_portable",
    nombre: "Aire acondicionado portátil",
    descripcion: "Portátil 12.000 BTU sin inverter",
    potencia_watt: 1_800,
    potencia_standby_watt: 5,
    horas_uso_tipicas_dia: 5,
    categoria: "climatizacion",
    eficiencia: "C",
  },
  {
    id: "electric_heater",
    nombre: "Estufa eléctrica / calefactor",
    descripcion: "Calefactor de cuarzo o aceite 2000W",
    potencia_watt: 2_000,
    potencia_standby_watt: 0,
    horas_uso_tipicas_dia: 5,
    categoria: "climatizacion",
    eficiencia: "N/A",
    nota: "Mayor consumidor de invierno — el uso intensivo es causa principal del recargo BT1",
  },
  {
    id: "fan",
    nombre: "Ventilador de pie",
    descripcion: "Ventilador 40–60W",
    potencia_watt: 50,
    potencia_standby_watt: 0,
    horas_uso_tipicas_dia: 5,
    categoria: "climatizacion",
    eficiencia: "N/A",
  },
  {
    id: "heat_pump_water",
    nombre: "Bomba de calor agua caliente",
    descripcion: "Termotanque con bomba de calor 500L equiv",
    potencia_watt: 500,
    potencia_standby_watt: 5,
    horas_uso_tipicas_dia: 3,
    categoria: "climatizacion",
    eficiencia: "A+++",
    nota: "Hasta 4× más eficiente que resistencia eléctrica directa",
  },

  // ── COCINA ───────────────────────────────────────────────────────────────────
  {
    id: "electric_kettle",
    nombre: "Hervidor eléctrico",
    descripcion: "Hervidor 1.7L, 2200W",
    potencia_watt: 2_200,
    potencia_standby_watt: 0,
    horas_uso_tipicas_dia: 0.25,
    categoria: "cocina",
    eficiencia: "N/A",
    nota: "Alta potencia pero uso muy breve (~3 min por hervor). Consumo diario real: ~0.1 kWh",
  },
  {
    id: "microwave",
    nombre: "Microondas",
    descripcion: "Microondas 800W–1200W, 20L",
    potencia_watt: 1_000,
    potencia_standby_watt: 2.5,
    horas_uso_tipicas_dia: 0.25,
    categoria: "cocina",
    eficiencia: "N/A",
  },
  {
    id: "electric_oven",
    nombre: "Horno eléctrico empotrado",
    descripcion: "Horno eléctrico 60L, con convección",
    potencia_watt: 2_200,
    potencia_standby_watt: 1,
    horas_uso_tipicas_dia: 0.5,
    categoria: "cocina",
    eficiencia: "A",
  },
  {
    id: "induction_cooktop",
    nombre: "Cocina de inducción",
    descripcion: "Placa de inducción 4 zonas, 7200W máx",
    potencia_watt: 3_600,
    potencia_standby_watt: 0.5,
    horas_uso_tipicas_dia: 1,
    categoria: "cocina",
    eficiencia: "A+",
    nota: "Consumo promedio durante cocción es 40–60% de la potencia máxima",
  },
  {
    id: "electric_shower",
    nombre: "Ducha eléctrica",
    descripcion: "Ducha eléctrica 5500W",
    potencia_watt: 5_500,
    potencia_standby_watt: 0,
    horas_uso_tipicas_dia: 0.17,
    categoria: "cocina",
    eficiencia: "N/A",
    nota: "10 min/día por persona. Mayor fuente de consumo en duchas sin gas.",
  },

  // ── ENTRETENIMIENTO ──────────────────────────────────────────────────────────
  {
    id: "tv_32",
    nombre: "Televisor LED 32\"",
    descripcion: "Smart TV LED 32 pulgadas",
    potencia_watt: 40,
    potencia_standby_watt: 0.5,
    horas_uso_tipicas_dia: 5,
    categoria: "entretenimiento",
    eficiencia: "A+",
  },
  {
    id: "tv_55",
    nombre: "Televisor LED/OLED 55\"",
    descripcion: "Smart TV 55 pulgadas 4K",
    potencia_watt: 100,
    potencia_standby_watt: 0.5,
    horas_uso_tipicas_dia: 5,
    categoria: "entretenimiento",
    eficiencia: "A+",
  },
  {
    id: "tv_65",
    nombre: "Televisor OLED/QLED 65\"",
    descripcion: "TV 65 pulgadas, alta gama",
    potencia_watt: 130,
    potencia_standby_watt: 0.8,
    horas_uso_tipicas_dia: 5,
    categoria: "entretenimiento",
    eficiencia: "A",
  },
  {
    id: "game_console",
    nombre: "Consola de videojuegos",
    descripcion: "PS5 / Xbox Series X",
    potencia_watt: 200,
    potencia_standby_watt: 1.5,
    horas_uso_tipicas_dia: 2,
    categoria: "entretenimiento",
    eficiencia: "N/A",
  },
  {
    id: "wifi_router",
    nombre: "Router WiFi (24/7)",
    descripcion: "Router doméstico siempre encendido",
    potencia_watt: 8,
    potencia_standby_watt: 8,
    horas_uso_tipicas_dia: 24,
    categoria: "entretenimiento",
    eficiencia: "N/A",
  },

  // ── COMPUTACIÓN ──────────────────────────────────────────────────────────────
  {
    id: "laptop",
    nombre: "Notebook / Laptop",
    descripcion: "Portátil 13–15\", uso mixto ofimática/video",
    potencia_watt: 50,
    potencia_standby_watt: 0.3,
    horas_uso_tipicas_dia: 6,
    categoria: "computacion",
    eficiencia: "A+",
  },
  {
    id: "desktop_pc",
    nombre: "Computador de escritorio",
    descripcion: "PC torre con monitor 24\"",
    potencia_watt: 180,
    potencia_standby_watt: 2,
    horas_uso_tipicas_dia: 6,
    categoria: "computacion",
    eficiencia: "B",
  },
  {
    id: "monitor",
    nombre: "Monitor externo 24\"",
    descripcion: "Monitor IPS LED 24 pulgadas",
    potencia_watt: 25,
    potencia_standby_watt: 0.3,
    horas_uso_tipicas_dia: 6,
    categoria: "computacion",
    eficiencia: "A+",
  },

  // ── ILUMINACIÓN ──────────────────────────────────────────────────────────────
  {
    id: "led_bulb",
    nombre: "Ampolleta LED (por unidad)",
    descripcion: "LED 9W equivalente a 60W incandescente",
    potencia_watt: 9,
    potencia_standby_watt: 0,
    horas_uso_tipicas_dia: 5,
    categoria: "iluminacion",
    eficiencia: "A++",
  },
  {
    id: "led_strip",
    nombre: "Tira LED ambiente",
    descripcion: "Tira LED 5m, RGB 30W",
    potencia_watt: 30,
    potencia_standby_watt: 0.5,
    horas_uso_tipicas_dia: 4,
    categoria: "iluminacion",
    eficiencia: "A+",
  },
  {
    id: "halogen_bulb",
    nombre: "Ampolleta halógena (por unidad)",
    descripcion: "Halógena 42W equivalente a 60W (en proceso de reemplazo)",
    potencia_watt: 42,
    potencia_standby_watt: 0,
    horas_uso_tipicas_dia: 5,
    categoria: "iluminacion",
    eficiencia: "C",
    nota: "Reemplazar por LED puede reducir consumo de iluminación hasta 80%",
  },

  // ── OTROS ────────────────────────────────────────────────────────────────────
  {
    id: "vacuum_cleaner",
    nombre: "Aspiradora",
    descripcion: "Aspiradora 1400W",
    potencia_watt: 1_400,
    potencia_standby_watt: 0,
    horas_uso_tipicas_dia: 0.25,
    categoria: "otros",
    eficiencia: "A",
  },
  {
    id: "hair_dryer",
    nombre: "Secador de pelo",
    descripcion: "Secador 1800W",
    potencia_watt: 1_800,
    potencia_standby_watt: 0,
    horas_uso_tipicas_dia: 0.17,
    categoria: "otros",
    eficiencia: "N/A",
  },
  {
    id: "phone_charger",
    nombre: "Cargador de celular",
    descripcion: "Cargador 20W–65W (vampiro cuando queda enchufado)",
    potencia_watt: 20,
    potencia_standby_watt: 0.5,
    horas_uso_tipicas_dia: 2,
    categoria: "otros",
    eficiencia: "N/A",
    nota: "El vampiro de carga representa hasta el 40% del consumo del cargador si se deja enchufado",
  },
];

/** Consumo mensual de standby en kWh para un electrodoméstico */
export function calcularConsumoVampiro(modelo: ModeloReferencia): number {
  // Standby funciona las 24h menos las horas de uso activo
  const horasStandby = Math.max(0, 24 - modelo.horas_uso_tipicas_dia);
  return (modelo.potencia_standby_watt * horasStandby * 30) / 1_000;
}

/** Total consumo mensual en kWh (activo + standby) */
export function calcularConsumoMensual(modelo: ModeloReferencia): number {
  const activo = (modelo.potencia_watt * modelo.horas_uso_tipicas_dia * 30) / 1_000;
  return activo + calcularConsumoVampiro(modelo);
}

/** Busca modelos por categoría */
export function getCatalogoPorCategoria(
  categoria: CategoriaElectrodomestico
): ModeloReferencia[] {
  return CATALOGO_REFERENCIA.filter((m) => m.categoria === categoria);
}

/** Estima el consumo anual vampiro total de un hogar */
export function calcularVampiroTotal(modelos: ModeloReferencia[]): number {
  return modelos.reduce((sum, m) => sum + calcularConsumoVampiro(m), 0);
}
