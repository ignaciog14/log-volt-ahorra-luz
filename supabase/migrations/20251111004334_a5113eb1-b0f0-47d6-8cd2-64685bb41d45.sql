-- Ensure UPDATE policies include WITH CHECK that allows soft delete
-- 1) habitaciones: drop and recreate UPDATE policy with WITH CHECK
DROP POLICY IF EXISTS "Users can update rooms in their homes" ON public.habitaciones;
CREATE POLICY "Users can update rooms in their homes"
ON public.habitaciones
FOR UPDATE
TO authenticated
USING (public.user_owns_hogar(hogar_id))
WITH CHECK (public.user_owns_hogar(hogar_id));

-- 2) electrodomesticos: drop and recreate UPDATE policy with WITH CHECK
DROP POLICY IF EXISTS "Users can update appliances in their homes" ON public.electrodomesticos;
CREATE POLICY "Users can update appliances in their homes"
ON public.electrodomesticos
FOR UPDATE
TO authenticated
USING (public.user_owns_habitacion(habitacion_id))
WITH CHECK (public.user_owns_habitacion(habitacion_id));

-- Keep existing SELECT/INSERT/DELETE policies unchanged
COMMENT ON POLICY "Users can update rooms in their homes" ON public.habitaciones 
IS 'Update allowed if the user owns the home (works for soft delete: activo=false).';
COMMENT ON POLICY "Users can update appliances in their homes" ON public.electrodomesticos
IS 'Update allowed if the user owns the room (works for soft delete: activo=false).';
