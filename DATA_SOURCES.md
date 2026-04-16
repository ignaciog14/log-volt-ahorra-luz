# DATA_SOURCES.md — Fuentes de datos LogVolt

Documenta el origen de todos los valores de referencia utilizados en los cálculos de consumo y tarificación.

---

## Tarifas eléctricas BT1 (`src/lib/tarifaBT1.ts`)

### Estructura tarifaria
La tarifa BT1 es la tarifa residencial estándar en Chile para clientes con medidor monofásico o bifásico ≤ 10 kW. Aplica a las principales distribuidoras reguladas.

| Componente | Descripción |
|---|---|
| Cargo fijo | Cargo mensual por punto de suministro, independiente del consumo |
| Cargo energía normal | CLP/kWh para consumo ≤ 430 kWh (o fuera de temporada invierno) |
| Cargo energía invierno | CLP/kWh para consumo > 430 kWh durante junio–septiembre |
| Límite invierno | 430 kWh/mes — umbral para aplicación de recargo |
| IVA | 19% sobre subtotal (cargo fijo + cargo energía) |

### Empresas y valores de referencia

Los valores corresponden a fijaciones tarifarias publicadas por la CNE y las propias distribuidoras (2024). Se expresan **sin IVA** en el motor de cálculo para aplicar IVA de forma consistente.

| Empresa | Región | Cargo fijo sin IVA | kWh normal | kWh invierno |
|---|---|---|---|---|
| Enel Distribución | Metropolitana | $1.456/mes | $121,8 | $156,3 |
| CGE Distribución | V, VI, VII, VIII, IX, X, XIV, XV, XVI | $1.380/mes | $118,5 | $152,0 |
| Chilquinta | V (Valparaíso) | $1.410/mes | $119,2 | $153,8 |
| Saesa / Frontel | IX, X, XIV | $1.320/mes | $116,0 | $150,0 |
| Referencial | Chile | $1.420/mes | $120,0 | $154,0 |

**Fuentes:**
- [Comisión Nacional de Energía (CNE)](https://www.cne.cl) — Fijaciones tarifarias de distribución
- [Enel Distribución Chile](https://www.eneldistribucion.cl) — Tarifas vigentes residenciales
- [CGE Distribución](https://www.cge.cl) — Cuadro tarifario BT1
- [Chilquinta Energía](https://www.chilquinta.cl) — Tarifas clientes residenciales
- [Saesa](https://www.saesa.cl) — Tarifas vigentes

---

## Catálogo de electrodomésticos (`src/lib/applianceCatalog.ts`)

### Potencia activa (W)

Los valores de potencia nominal se obtienen de:

1. **Fichas técnicas de fabricantes** — Samsung, LG, Mabe, Bosch, Whirlpool (modelos 2020–2024)
2. **Guías de eficiencia energética SEC Chile 2023** — Superintendencia de Electricidad y Combustibles
3. **Etiquetado energético CE / Proconsumer** — Clases A+++ a G según Reglamento CE 2017/1369
4. **Mediciones publicadas por ACESOL / CNE Chile** — Consumos reales medidos en condiciones de laboratorio

### Potencia standby (W)

Los valores de consumo en modo espera siguen las normas:
- **IEEE 1680** — Estándar de eficiencia energética para equipos electrónicos
- **IEC 62301:2011** — Medición del consumo en modo standby (metodología de 1 hora estabilizada)

### Horas de uso típicas

Las horas de uso diarias son promedios estadísticos de:
- **Encuesta de consumo energético residencial CNE 2021** — muestra nacional hogares chilenos
- **ACESOL — Asociación Chilena de Energía Solar** — reportes de consumo residencial
- **Base de datos ODYSSEE-MURE (IEA)** — benchmarks europeos para categorías sin datos locales

### Eficiencia energética (etiqueta)

Las clases de eficiencia (A+++ → D) corresponden al sistema europeo CE adoptado como referencia internacional. Chile no tiene etiquetado obligatorio equivalente para todas las categorías, pero el programa **Sello de Eficiencia Energética SEC** usa criterios similares para refrigeración, lavado y climatización.

---

## Notas metodológicas

- Los valores son **referenciales** para comparación y estimación de ahorros, no valores medidos del hogar específico del usuario.
- El consumo mensual se calcula como: `(potencia_W × horas_dia × 30) / 1000 + consumo_standby_mensual`
- El standby se calcula sobre las horas no activas del día: `potencia_standby_W × (24 - horas_uso) × 30 / 1000`
- Para refrigeradores y routers (uso 24/7), el standby es 0 o igual a la potencia activa, respectivamente.

---

*Última actualización: abril 2026 — LogVolt MVP v1.0*
