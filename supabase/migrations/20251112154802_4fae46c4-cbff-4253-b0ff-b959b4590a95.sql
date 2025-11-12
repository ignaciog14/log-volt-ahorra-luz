-- Add alert limit columns to hogares table
ALTER TABLE public.hogares
ADD COLUMN IF NOT EXISTS limite_kwh_diario NUMERIC,
ADD COLUMN IF NOT EXISTS limite_costo_mensual NUMERIC;

COMMENT ON COLUMN public.hogares.limite_kwh_diario IS 'Daily kWh consumption limit for alerts';
COMMENT ON COLUMN public.hogares.limite_costo_mensual IS 'Monthly cost limit (in CLP) for alerts';