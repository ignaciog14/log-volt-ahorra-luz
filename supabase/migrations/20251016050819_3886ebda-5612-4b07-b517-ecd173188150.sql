-- Arreglar funciones sin search_path usando CASCADE
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Recrear los triggers que se eliminaron con CASCADE
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hogares_updated_at
  BEFORE UPDATE ON public.hogares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS en tablas públicas de referencia
ALTER TABLE public.comunas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas_electricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarifas_electricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_electrodomestico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparativa_promedios ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura pública de datos de referencia
CREATE POLICY "Anyone can view comunas"
  ON public.comunas FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view electric companies"
  ON public.empresas_electricas FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view electric rates"
  ON public.tarifas_electricas FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view appliance types"
  ON public.tipos_electrodomestico FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view comparison data"
  ON public.comparativa_promedios FOR SELECT
  USING (true);