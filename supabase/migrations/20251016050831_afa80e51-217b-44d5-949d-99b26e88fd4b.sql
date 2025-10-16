-- Arreglar la función calcular_consumo_hogar sin search_path
DROP FUNCTION IF EXISTS public.calcular_consumo_hogar(INTEGER);

CREATE OR REPLACE FUNCTION public.calcular_consumo_hogar(hogar_id_param INTEGER)
RETURNS DECIMAL AS $$
DECLARE
  consumo_total DECIMAL;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN e.consumo_kwh_ajustado IS NOT NULL THEN e.consumo_kwh_ajustado
      ELSE t.consumo_kwh_predeterminado
    END * e.horas_uso_diarias * 30
  ), 0)
  INTO consumo_total
  FROM public.electrodomesticos e
  LEFT JOIN public.tipos_electrodomestico t ON e.tipo_id = t.id
  JOIN public.habitaciones h ON e.habitacion_id = h.id
  WHERE h.hogar_id = hogar_id_param
  AND e.activo = true;
  
  RETURN consumo_total;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;