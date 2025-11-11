-- Fix RLS policies for soft delete operations
-- The issue: policies with WITH CHECK that use functions checking activo=true
-- prevent setting activo=false (recursive condition)

-- Drop problematic policies on habitaciones
DROP POLICY IF EXISTS "upd_rooms_owner_soft_delete_20251104" ON public.habitaciones;

-- Drop problematic policies on electrodomesticos  
DROP POLICY IF EXISTS "upd_electros_owner_soft_delete_20251104" ON public.electrodomesticos;

-- The existing "Users can update rooms in their homes" policy is sufficient
-- It uses: USING (user_owns_hogar(hogar_id)) without WITH CHECK
-- This allows soft deletes because user_owns_hogar doesn't check activo status of the room

-- The existing "Users can update appliances in their homes" policy is sufficient
-- It uses: USING (user_owns_habitacion(habitacion_id)) without WITH CHECK

-- Verify the remaining policies are correct
COMMENT ON POLICY "Users can update rooms in their homes" ON public.habitaciones 
IS 'Allows updates including soft deletes (activo=false) for rooms owned by user';

COMMENT ON POLICY "Users can update appliances in their homes" ON public.electrodomesticos
IS 'Allows updates including soft deletes (activo=false) for appliances in user-owned rooms';