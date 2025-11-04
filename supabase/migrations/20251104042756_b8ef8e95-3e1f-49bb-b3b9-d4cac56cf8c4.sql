-- ============================================================================
-- BUG-1: Corregir RLS con funciones security definer
-- ============================================================================

-- Función para verificar si un hogar pertenece al usuario
CREATE OR REPLACE FUNCTION public.user_owns_hogar(_hogar_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.hogares
    WHERE id = _hogar_id
      AND usuario_id = auth.uid()
      AND activo = true
  )
$$;

-- Función para verificar si una habitación pertenece al usuario
CREATE OR REPLACE FUNCTION public.user_owns_habitacion(_habitacion_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.habitaciones h
    JOIN public.hogares hg ON h.hogar_id = hg.id
    WHERE h.id = _habitacion_id
      AND hg.usuario_id = auth.uid()
      AND h.activo = true
      AND hg.activo = true
  )
$$;

-- Función para verificar si un electrodoméstico pertenece al usuario
CREATE OR REPLACE FUNCTION public.user_owns_electrodomestico(_electrodomestico_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.electrodomesticos e
    JOIN public.habitaciones h ON e.habitacion_id = h.id
    JOIN public.hogares hg ON h.hogar_id = hg.id
    WHERE e.id = _electrodomestico_id
      AND hg.usuario_id = auth.uid()
      AND e.activo = true
      AND h.activo = true
      AND hg.activo = true
  )
$$;

-- ============================================================================
-- Actualizar políticas RLS de habitaciones
-- ============================================================================

-- Drop políticas existentes
DROP POLICY IF EXISTS "Users can view rooms in their homes" ON public.habitaciones;
DROP POLICY IF EXISTS "Users can create rooms in their homes" ON public.habitaciones;
DROP POLICY IF EXISTS "Users can update rooms in their homes" ON public.habitaciones;
DROP POLICY IF EXISTS "Users can delete rooms in their homes" ON public.habitaciones;

-- Crear nuevas políticas usando funciones security definer
CREATE POLICY "Users can view rooms in their homes"
ON public.habitaciones
FOR SELECT
USING (
  public.user_owns_hogar(hogar_id) AND activo = true
);

CREATE POLICY "Users can create rooms in their homes"
ON public.habitaciones
FOR INSERT
WITH CHECK (
  public.user_owns_hogar(hogar_id)
);

CREATE POLICY "Users can update rooms in their homes"
ON public.habitaciones
FOR UPDATE
USING (
  public.user_owns_hogar(hogar_id)
);

CREATE POLICY "Users can delete rooms in their homes"
ON public.habitaciones
FOR DELETE
USING (
  public.user_owns_hogar(hogar_id)
);

-- ============================================================================
-- Actualizar políticas RLS de electrodomésticos
-- ============================================================================

-- Drop políticas existentes
DROP POLICY IF EXISTS "Users can view appliances in their homes" ON public.electrodomesticos;
DROP POLICY IF EXISTS "Users can create appliances in their homes" ON public.electrodomesticos;
DROP POLICY IF EXISTS "Users can update appliances in their homes" ON public.electrodomesticos;
DROP POLICY IF EXISTS "Users can delete appliances in their homes" ON public.electrodomesticos;

-- Crear nuevas políticas usando funciones security definer
CREATE POLICY "Users can view appliances in their homes"
ON public.electrodomesticos
FOR SELECT
USING (
  public.user_owns_habitacion(habitacion_id) AND activo = true
);

CREATE POLICY "Users can create appliances in their homes"
ON public.electrodomesticos
FOR INSERT
WITH CHECK (
  public.user_owns_habitacion(habitacion_id)
);

CREATE POLICY "Users can update appliances in their homes"
ON public.electrodomesticos
FOR UPDATE
USING (
  public.user_owns_habitacion(habitacion_id)
);

CREATE POLICY "Users can delete appliances in their homes"
ON public.electrodomesticos
FOR DELETE
USING (
  public.user_owns_habitacion(habitacion_id)
);

-- ============================================================================
-- INFRA-1: Agregar soft delete a tablas faltantes
-- ============================================================================

-- Agregar columna activo a tipos_electrodomestico si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tipos_electrodomestico' 
    AND column_name = 'activo'
  ) THEN
    ALTER TABLE public.tipos_electrodomestico 
    ADD COLUMN activo boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- Agregar columna activo a consumo_diario si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'consumo_diario' 
    AND column_name = 'activo'
  ) THEN
    ALTER TABLE public.consumo_diario 
    ADD COLUMN activo boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- ============================================================================
-- Actualizar políticas RLS para filtrar por activo
-- ============================================================================

-- Actualizar política de consumo_diario para filtrar por activo
DROP POLICY IF EXISTS "Users can view consumption in their homes" ON public.consumo_diario;

CREATE POLICY "Users can view consumption in their homes"
ON public.consumo_diario
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.electrodomesticos e
    JOIN public.habitaciones h ON e.habitacion_id = h.id
    JOIN public.hogares hg ON h.hogar_id = hg.id
    WHERE e.id = consumo_diario.electrodomestico_id
      AND hg.usuario_id = auth.uid()
      AND e.activo = true
      AND h.activo = true
      AND hg.activo = true
  ) AND consumo_diario.activo = true
);

-- Actualizar política de tipos_electrodomestico
DROP POLICY IF EXISTS "Anyone can view appliance types" ON public.tipos_electrodomestico;

CREATE POLICY "Anyone can view appliance types"
ON public.tipos_electrodomestico
FOR SELECT
USING (activo = true);