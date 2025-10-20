-- Add orden and activo columns to habitaciones table
ALTER TABLE public.habitaciones 
ADD COLUMN IF NOT EXISTS orden integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;

-- Add unique constraint for nombre within same hogar
ALTER TABLE public.habitaciones 
ADD CONSTRAINT habitaciones_nombre_hogar_unique UNIQUE (hogar_id, nombre);

-- Update existing rooms to have sequential order
WITH numbered_rooms AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY hogar_id ORDER BY id) as row_num
  FROM public.habitaciones
)
UPDATE public.habitaciones
SET orden = numbered_rooms.row_num
FROM numbered_rooms
WHERE habitaciones.id = numbered_rooms.id;

-- Update RLS policy to only show active rooms
DROP POLICY IF EXISTS "Users can view rooms in their homes" ON public.habitaciones;

CREATE POLICY "Users can view rooms in their homes" 
ON public.habitaciones 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM hogares 
    WHERE hogares.id = habitaciones.hogar_id 
    AND hogares.usuario_id = auth.uid()
  )
  AND activo = true
);