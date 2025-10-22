-- Crear tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT,
  is_active BOOLEAN DEFAULT true,
  ultimo_login TIMESTAMP WITH TIME ZONE,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies para profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre, apellido)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(new.raw_user_meta_data->>'apellido', 'Nuevo')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tabla de comunas
CREATE TABLE public.comunas (
  id SERIAL PRIMARY KEY,
  nombre TEXT UNIQUE NOT NULL,
  region TEXT NOT NULL
);

-- Tabla de empresas eléctricas
CREATE TABLE public.empresas_electricas (
  id SERIAL PRIMARY KEY,
  nombre TEXT UNIQUE NOT NULL,
  region TEXT NOT NULL
);

-- Tabla de tarifas eléctricas
CREATE TABLE public.tarifas_electricas (
  id SERIAL PRIMARY KEY,
  comuna_id INTEGER REFERENCES public.comunas(id) NOT NULL,
  empresa_electrica_id INTEGER REFERENCES public.empresas_electricas(id) NOT NULL,
  tarifa_punta_pesos_kwh DECIMAL(10,2) NOT NULL,
  tarifa_valle_pesos_kwh DECIMAL(10,2) NOT NULL,
  UNIQUE(comuna_id, empresa_electrica_id)
);

-- Tabla de hogares
CREATE TABLE public.hogares (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  direccion TEXT,
  comuna_id INTEGER REFERENCES public.comunas(id),
  empresa_electrica_id INTEGER REFERENCES public.empresas_electricas(id),
  numero_personas INTEGER,
  area_m2 DECIMAL(10,2),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.hogares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own homes"
  ON public.hogares FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can create their own homes"
  ON public.hogares FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own homes"
  ON public.hogares FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own homes"
  ON public.hogares FOR DELETE
  USING (auth.uid() = usuario_id);

-- Tipos de habitación
CREATE TYPE public.tipo_habitacion AS ENUM (
  'cocina',
  'dormitorio',
  'bano',
  'living',
  'comedor',
  'lavanderia',
  'estudio',
  'garage',
  'patio',
  'otro'
);

-- Tabla de habitaciones
CREATE TABLE public.habitaciones (
  id SERIAL PRIMARY KEY,
  hogar_id INTEGER REFERENCES public.hogares(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  tipo tipo_habitacion NOT NULL
);

ALTER TABLE public.habitaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rooms in their homes"
  ON public.habitaciones FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.hogares
    WHERE hogares.id = habitaciones.hogar_id
    AND hogares.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can create rooms in their homes"
  ON public.habitaciones FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.hogares
    WHERE hogares.id = habitaciones.hogar_id
    AND hogares.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can update rooms in their homes"
  ON public.habitaciones FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.hogares
    WHERE hogares.id = habitaciones.hogar_id
    AND hogares.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can delete rooms in their homes"
  ON public.habitaciones FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.hogares
    WHERE hogares.id = habitaciones.hogar_id
    AND hogares.usuario_id = auth.uid()
  ));

-- Categorías de electrodomésticos
CREATE TYPE public.categoria_electrodomestico AS ENUM (
  'refrigeracion',
  'lavado',
  'climatizacion',
  'cocina',
  'entretenimiento',
  'iluminacion',
  'computacion',
  'otros'
);

-- Tabla de tipos de electrodomésticos
CREATE TABLE public.tipos_electrodomestico (
  id SERIAL PRIMARY KEY,
  nombre TEXT UNIQUE NOT NULL,
  categoria categoria_electrodomestico NOT NULL,
  consumo_kwh_predeterminado DECIMAL(10,2) NOT NULL,
  potencia_watt INTEGER NOT NULL
);

-- Tabla de electrodomésticos
CREATE TABLE public.electrodomesticos (
  id SERIAL PRIMARY KEY,
  habitacion_id INTEGER REFERENCES public.habitaciones(id) ON DELETE CASCADE NOT NULL,
  tipo_id INTEGER REFERENCES public.tipos_electrodomestico(id),
  nombre_personalizado TEXT,
  consumo_kwh_ajustado DECIMAL(10,2),
  horas_uso_diarias DECIMAL(5,2) DEFAULT 0,
  es_personalizado BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true
);

ALTER TABLE public.electrodomesticos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view appliances in their homes"
  ON public.electrodomesticos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.habitaciones h
    JOIN public.hogares hg ON h.hogar_id = hg.id
    WHERE h.id = electrodomesticos.habitacion_id
    AND hg.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can create appliances in their homes"
  ON public.electrodomesticos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.habitaciones h
    JOIN public.hogares hg ON h.hogar_id = hg.id
    WHERE h.id = electrodomesticos.habitacion_id
    AND hg.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can update appliances in their homes"
  ON public.electrodomesticos FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.habitaciones h
    JOIN public.hogares hg ON h.hogar_id = hg.id
    WHERE h.id = electrodomesticos.habitacion_id
    AND hg.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can delete appliances in their homes"
  ON public.electrodomesticos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.habitaciones h
    JOIN public.hogares hg ON h.hogar_id = hg.id
    WHERE h.id = electrodomesticos.habitacion_id
    AND hg.usuario_id = auth.uid()
  ));

-- Tabla de consumo diario
CREATE TABLE public.consumo_diario (
  id SERIAL PRIMARY KEY,
  electrodomestico_id INTEGER REFERENCES public.electrodomesticos(id) ON DELETE CASCADE NOT NULL,
  fecha DATE NOT NULL,
  horas_uso_registradas DECIMAL(5,2) NOT NULL,
  consumo_kwh_registrado DECIMAL(10,2) NOT NULL,
  UNIQUE(electrodomestico_id, fecha)
);

ALTER TABLE public.consumo_diario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view consumption in their homes"
  ON public.consumo_diario FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.electrodomesticos e
    JOIN public.habitaciones h ON e.habitacion_id = h.id
    JOIN public.hogares hg ON h.hogar_id = hg.id
    WHERE e.id = consumo_diario.electrodomestico_id
    AND hg.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can create consumption records"
  ON public.consumo_diario FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.electrodomesticos e
    JOIN public.habitaciones h ON e.habitacion_id = h.id
    JOIN public.hogares hg ON h.hogar_id = hg.id
    WHERE e.id = consumo_diario.electrodomestico_id
    AND hg.usuario_id = auth.uid()
  ));

-- Tabla de cambios en electrodomésticos (auditoría)
CREATE TABLE public.cambios_electrodomestico (
  id SERIAL PRIMARY KEY,
  electrodomestico_id INTEGER REFERENCES public.electrodomesticos(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES public.profiles(id) NOT NULL,
  campo_modificado TEXT NOT NULL,
  valor_anterior TEXT,
  valor_nuevo TEXT,
  timestamp_cambio TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.cambios_electrodomestico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view changes to their appliances"
  ON public.cambios_electrodomestico FOR SELECT
  USING (auth.uid() = usuario_id);

-- Prioridades y estados
CREATE TYPE public.prioridad AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.estado_recomendacion AS ENUM ('pending', 'viewed', 'applied', 'dismissed');
CREATE TYPE public.severidad AS ENUM ('info', 'warning', 'critical');

-- Tabla de recomendaciones
CREATE TABLE public.recomendaciones (
  id SERIAL PRIMARY KEY,
  hogar_id INTEGER REFERENCES public.hogares(id) ON DELETE CASCADE NOT NULL,
  electrodomestico_id INTEGER REFERENCES public.electrodomesticos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  ahorro_potencial_pesos DECIMAL(10,2),
  prioridad prioridad DEFAULT 'medium',
  estado estado_recomendacion DEFAULT 'pending',
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.recomendaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recommendations for their homes"
  ON public.recomendaciones FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.hogares
    WHERE hogares.id = recomendaciones.hogar_id
    AND hogares.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can update recommendations status"
  ON public.recomendaciones FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.hogares
    WHERE hogares.id = recomendaciones.hogar_id
    AND hogares.usuario_id = auth.uid()
  ));

-- Tabla de alertas
CREATE TABLE public.alertas (
  id SERIAL PRIMARY KEY,
  hogar_id INTEGER REFERENCES public.hogares(id) ON DELETE CASCADE NOT NULL,
  electrodomestico_id INTEGER REFERENCES public.electrodomesticos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  severidad severidad DEFAULT 'info',
  leida BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alerts for their homes"
  ON public.alertas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.hogares
    WHERE hogares.id = alertas.hogar_id
    AND hogares.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can update alerts"
  ON public.alertas FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.hogares
    WHERE hogares.id = alertas.hogar_id
    AND hogares.usuario_id = auth.uid()
  ));

-- Estados de metas
CREATE TYPE public.estado_meta AS ENUM ('active', 'completed', 'failed');

-- Tabla de metas de consumo
CREATE TABLE public.metas_consumo (
  id SERIAL PRIMARY KEY,
  hogar_id INTEGER REFERENCES public.hogares(id) ON DELETE CASCADE NOT NULL,
  consumo_kwh_meta DECIMAL(10,2),
  costo_pesos_meta DECIMAL(10,2),
  mes_ano DATE NOT NULL,
  estado estado_meta DEFAULT 'active',
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.metas_consumo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage goals for their homes"
  ON public.metas_consumo FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.hogares
    WHERE hogares.id = metas_consumo.hogar_id
    AND hogares.usuario_id = auth.uid()
  ));

-- Tabla de comparativas (datos públicos)
CREATE TABLE public.comparativa_promedios (
  id SERIAL PRIMARY KEY,
  tipo_habitacion TEXT NOT NULL,
  tipo_electrodomestico TEXT NOT NULL,
  consumo_kwh_promedio DECIMAL(10,2) NOT NULL,
  region TEXT NOT NULL
);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hogares_updated_at
  BEFORE UPDATE ON public.hogares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar comunas de Chile (principales de la Región Metropolitana)
INSERT INTO public.comunas (nombre, region) VALUES
  ('Santiago', 'Metropolitana'),
  ('Las Condes', 'Metropolitana'),
  ('Providencia', 'Metropolitana'),
  ('Ñuñoa', 'Metropolitana'),
  ('La Florida', 'Metropolitana'),
  ('Maipú', 'Metropolitana'),
  ('Puente Alto', 'Metropolitana'),
  ('Peñalolén', 'Metropolitana'),
  ('La Reina', 'Metropolitana'),
  ('Macul', 'Metropolitana');

-- Insertar empresas eléctricas de Chile
INSERT INTO public.empresas_electricas (nombre, region) VALUES
  ('Enel Distribución Chile', 'Metropolitana'),
  ('CGE Distribución', 'Metropolitana'),
  ('Chilquinta Energía', 'Valparaíso');

-- Insertar tarifas eléctricas (valores aproximados en CLP/kWh)
INSERT INTO public.tarifas_electricas (comuna_id, empresa_electrica_id, tarifa_punta_pesos_kwh, tarifa_valle_pesos_kwh) VALUES
  (1, 1, 180.5, 120.3),
  (2, 1, 185.2, 122.8),
  (3, 1, 183.7, 121.5),
  (4, 1, 181.9, 120.8),
  (5, 1, 179.4, 119.6);

-- Insertar tipos de electrodomésticos predefinidos
INSERT INTO public.tipos_electrodomestico (nombre, categoria, consumo_kwh_predeterminado, potencia_watt) VALUES
  ('Refrigerador No-Frost 300L', 'refrigeracion', 120.0, 150),
  ('Refrigerador Convencional 250L', 'refrigeracion', 80.0, 100),
  ('Congelador', 'refrigeracion', 60.0, 80),
  ('Lavadora 8kg', 'lavado', 85.0, 500),
  ('Lavadora-Secadora', 'lavado', 150.0, 2000),
  ('Secadora', 'lavado', 120.0, 2500),
  ('Lavavajillas', 'lavado', 70.0, 1800),
  ('Aire Acondicionado Split 12000 BTU', 'climatizacion', 95.0, 1200),
  ('Aire Acondicionado Portátil', 'climatizacion', 75.0, 900),
  ('Calefactor Eléctrico', 'climatizacion', 100.0, 1500),
  ('Estufa Eléctrica', 'cocina', 90.0, 2000),
  ('Horno Eléctrico', 'cocina', 80.0, 2500),
  ('Microondas', 'cocina', 35.0, 1000),
  ('Hervidor Eléctrico', 'cocina', 25.0, 1500),
  ('Cafetera', 'cocina', 15.0, 800),
  ('Televisor LED 40"', 'entretenimiento', 45.0, 80),
  ('Televisor LED 55"', 'entretenimiento', 65.0, 120),
  ('Consola de Videojuegos', 'entretenimiento', 40.0, 150),
  ('Equipo de Música', 'entretenimiento', 20.0, 100),
  ('Computador de Escritorio', 'computacion', 50.0, 300),
  ('Laptop', 'computacion', 15.0, 65),
  ('Monitor 24"', 'computacion', 18.0, 30),
  ('Router Wi-Fi', 'computacion', 10.0, 12),
  ('Ampolleta LED 10W', 'iluminacion', 3.0, 10),
  ('Ampolleta LED 15W', 'iluminacion', 4.5, 15),
  ('Plancha', 'otros', 45.0, 1000),
  ('Aspiradora', 'otros', 35.0, 1400),
  ('Ventilador de Pie', 'climatizacion', 20.0, 75),
  ('Cargador de Celular', 'computacion', 2.0, 5);

-- Función para calcular consumo total de un hogar
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
$$ LANGUAGE plpgsql SECURITY DEFINER;