/**
 * LOGVOLT - Motor de Cálculo Tarifa BT1 (Chile)
 *
 * Fuente: Resolución CNE / SEC - Tarifa BT1 Distribución (2024)
 * Aplicable a: clientes residenciales con medidor monofásico o bifásico
 * Empresas: Enel Distribución, CGE, Chilquinta, Saesa, Frontel
 *
 * Estructura BT1:
 * - Cargo fijo mensual (por punto de suministro)
 * - Cargo por energía en kWh (tramo normal y tramo invierno)
 * - IVA 19% sobre el total
 */

export interface TarifaBT1 {
  empresa: string;
  region: string;
  cargoFijo_sinIVA: number;       // CLP/mes sin IVA
  preciokWh_normal: number;       // CLP/kWh sin IVA (hasta límite invierno)
  preciokWh_invierno: number;     // CLP/kWh sin IVA (sobre límite invierno, jun-sep)
  limiteInvierno_kWh: number;     // kWh a partir del cual aplica recargo
}

export interface BolctaEstimada {
  consumo_kWh: number;
  cargoFijo: number;
  cargoEnergia: number;
  subtotal: number;
  iva: number;
  total: number;
  superaLimiteInvierno: boolean;
  kWhEnRecargo: number;
  ahorroPotencial: number;        // Si baja al límite de invierno
}

// Tarifas BT1 referenciales por empresa (CLP/kWh, sin IVA, 2024)
// Fuente: Fijaciones tarifarias CNE / sitios web distribuidoras
export const TARIFAS_BT1: Record<string, TarifaBT1> = {
  enel: {
    empresa: "Enel Distribución",
    region: "Región Metropolitana",
    cargoFijo_sinIVA: 1_456,
    preciokWh_normal: 121.8,
    preciokWh_invierno: 156.3,
    limiteInvierno_kWh: 430,
  },
  cge: {
    empresa: "CGE Distribución",
    region: "Regiones V, VI, VII, VIII, IX, X, XIV, XV, XVI",
    cargoFijo_sinIVA: 1_380,
    preciokWh_normal: 118.5,
    preciokWh_invierno: 152.0,
    limiteInvierno_kWh: 430,
  },
  chilquinta: {
    empresa: "Chilquinta",
    region: "Regiones V (Valparaíso)",
    cargoFijo_sinIVA: 1_410,
    preciokWh_normal: 119.2,
    preciokWh_invierno: 153.8,
    limiteInvierno_kWh: 430,
  },
  saesa: {
    empresa: "Saesa",
    region: "Regiones IX, X, XIV",
    cargoFijo_sinIVA: 1_320,
    preciokWh_normal: 116.0,
    preciokWh_invierno: 150.0,
    limiteInvierno_kWh: 430,
  },
  default: {
    empresa: "Tarifa referencial",
    region: "Chile",
    cargoFijo_sinIVA: 1_420,
    preciokWh_normal: 120.0,
    preciokWh_invierno: 154.0,
    limiteInvierno_kWh: 430,
  },
};

const IVA = 0.19;

/** Determina si el mes actual es temporada de invierno (junio–septiembre) */
export function esTemporadaInvierno(fecha = new Date()): boolean {
  const mes = fecha.getMonth() + 1; // 1-12
  return mes >= 6 && mes <= 9;
}

/**
 * Calcula la boleta mensual estimada según Tarifa BT1
 * @param consumo_kWh - Consumo mensual del hogar en kWh
 * @param tarifaKey   - Clave de empresa en TARIFAS_BT1
 * @param invierno    - Si aplicar recargo de invierno (default: mes actual)
 */
export function calcularBoleta(
  consumo_kWh: number,
  tarifaKey = "default",
  invierno = esTemporadaInvierno()
): BolctaEstimada {
  const tarifa = TARIFAS_BT1[tarifaKey] ?? TARIFAS_BT1.default;

  const superaLimite = consumo_kWh > tarifa.limiteInvierno_kWh;
  const kWhNormal = Math.min(consumo_kWh, tarifa.limiteInvierno_kWh);
  const kWhEnRecargo = superaLimite ? consumo_kWh - tarifa.limiteInvierno_kWh : 0;

  let cargoEnergia: number;
  if (invierno && superaLimite) {
    cargoEnergia =
      kWhNormal * tarifa.preciokWh_normal +
      kWhEnRecargo * tarifa.preciokWh_invierno;
  } else {
    cargoEnergia = consumo_kWh * tarifa.preciokWh_normal;
  }

  const subtotal = tarifa.cargoFijo_sinIVA + cargoEnergia;
  const iva = Math.round(subtotal * IVA);
  const total = Math.round(subtotal + iva);

  // Potencial ahorro si baja exactamente al límite de invierno
  const cargoEnergiaOptimo = tarifa.limiteInvierno_kWh * tarifa.preciokWh_normal;
  const totalOptimo = Math.round(
    (tarifa.cargoFijo_sinIVA + cargoEnergiaOptimo) * (1 + IVA)
  );
  const ahorroPotencial = total - totalOptimo;

  return {
    consumo_kWh: Math.round(consumo_kWh),
    cargoFijo: Math.round(tarifa.cargoFijo_sinIVA * (1 + IVA)),
    cargoEnergia: Math.round(cargoEnergia * (1 + IVA)),
    subtotal: Math.round(subtotal),
    iva,
    total,
    superaLimiteInvierno: invierno && superaLimite,
    kWhEnRecargo: Math.round(kWhEnRecargo),
    ahorroPotencial: Math.max(0, ahorroPotencial),
  };
}

/** Precio efectivo promedio por kWh (con IVA), útil para cálculos rápidos */
export function getPreciokWhConIVA(tarifaKey = "default"): number {
  const t = TARIFAS_BT1[tarifaKey] ?? TARIFAS_BT1.default;
  return Math.round(t.preciokWh_normal * (1 + IVA));
}
