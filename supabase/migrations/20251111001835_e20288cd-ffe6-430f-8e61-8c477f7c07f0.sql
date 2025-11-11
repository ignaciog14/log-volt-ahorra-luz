-- Add INSERT, UPDATE, and DELETE policies to cambios_electrodomestico audit table
-- to ensure audit trail integrity

-- Allow authenticated users to insert audit records only for their own appliances
CREATE POLICY "Users can log changes to their appliances"
ON public.cambios_electrodomestico
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = usuario_id AND
  EXISTS (
    SELECT 1 FROM public.electrodomesticos e
    JOIN public.habitaciones h ON e.habitacion_id = h.id
    JOIN public.hogares hg ON h.hogar_id = hg.id
    WHERE e.id = cambios_electrodomestico.electrodomestico_id
    AND hg.usuario_id = auth.uid()
  )
);

-- Prevent any updates to audit logs to maintain immutability
CREATE POLICY "Audit logs cannot be updated"
ON public.cambios_electrodomestico
FOR UPDATE
TO authenticated
USING (false);

-- Prevent deletion of audit logs to maintain integrity
CREATE POLICY "Audit logs cannot be deleted"
ON public.cambios_electrodomestico
FOR DELETE
TO authenticated
USING (false);