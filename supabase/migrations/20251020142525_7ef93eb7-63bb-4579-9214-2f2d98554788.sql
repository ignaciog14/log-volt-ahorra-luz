-- Add activo column to hogares table for soft delete
ALTER TABLE public.hogares 
ADD COLUMN activo boolean NOT NULL DEFAULT true;

-- Update RLS policies to only show active homes
DROP POLICY IF EXISTS "Users can view their own homes" ON public.hogares;
CREATE POLICY "Users can view their own homes" 
ON public.hogares 
FOR SELECT 
USING (auth.uid() = usuario_id AND activo = true);

-- Keep other policies unchanged (update, delete, insert already filter by usuario_id)