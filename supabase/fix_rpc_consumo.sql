-- Fix calcular_consumo_hogar
-- Bug: la fórmula anterior era consumo_kwh_ajustado × horas × 30
-- tratando el campo como kW, pero el campo almacena kWh/día.
-- Corrección:
--   - consumo_kwh_ajustado (kWh/día) × 30 = kWh/mes
--   - fallback a potencia_watt / 1000 × horas × 30 (fórmula física correcta)

CREATE OR REPLACE FUNCTION public.calcular_consumo_hogar(hogar_id_param INTEGER)
RETURNS DECIMAL AS $$
DECLARE
  consumo_total DECIMAL;
BEGIN
  SELECT COALESCE(SUM(
    CASE
      WHEN e.consumo_kwh_ajustado IS NOT NULL
        THEN e.consumo_kwh_ajustado * 30
      ELSE (t.potencia_watt / 1000.0) * e.horas_uso_diarias * 30
    END
  ), 0)
  INTO consumo_total
  FROM public.electrodomesticos e
  LEFT JOIN public.tipos_electrodomestico t ON e.tipo_id = t.id
  JOIN public.habitaciones h ON e.habitacion_id = h.id
  WHERE h.hogar_id = hogar_id_param
  AND e.activo = true;

  RETURN consumo_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
