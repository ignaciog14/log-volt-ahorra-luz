-- ============================================================================
-- LOGVOLT - POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- Aplicar en: Supabase Dashboard > SQL Editor
-- Propósito: Garantizar que cada usuario solo acceda a SU propia data
-- ============================================================================

-- IMPORTANTE: Ejecutar este script en el SQL Editor de Supabase.
-- Requiere que RLS esté habilitado en cada tabla (ALTER TABLE ... ENABLE ROW LEVEL SECURITY).

-- ============================================================================
-- 1. TABLA: profiles
-- Regla: cada usuario solo puede ver y editar su propio perfil
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- INSERT es manejado por el trigger de auth, no necesita política de usuario

-- ============================================================================
-- 2. TABLA: hogares
-- Regla: el usuario solo accede a los hogares que él creó (usuario_id)
-- ============================================================================

ALTER TABLE hogares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hogares_select_own"
  ON hogares FOR SELECT
  USING (usuario_id = auth.uid());

CREATE POLICY "hogares_insert_own"
  ON hogares FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "hogares_update_own"
  ON hogares FOR UPDATE
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "hogares_delete_own"
  ON hogares FOR DELETE
  USING (usuario_id = auth.uid());

-- ============================================================================
-- 3. TABLA: habitaciones
-- Regla: acceso solo si la habitación pertenece a un hogar del usuario
-- ============================================================================

ALTER TABLE habitaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habitaciones_select_own"
  ON habitaciones FOR SELECT
  USING (
    hogar_id IN (
      SELECT id FROM hogares WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "habitaciones_insert_own"
  ON habitaciones FOR INSERT
  WITH CHECK (
    hogar_id IN (
      SELECT id FROM hogares WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "habitaciones_update_own"
  ON habitaciones FOR UPDATE
  USING (
    hogar_id IN (
      SELECT id FROM hogares WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "habitaciones_delete_own"
  ON habitaciones FOR DELETE
  USING (
    hogar_id IN (
      SELECT id FROM hogares WHERE usuario_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. TABLA: electrodomesticos
-- Regla: acceso solo si el electrodoméstico pertenece a una habitación del usuario
-- ============================================================================

ALTER TABLE electrodomesticos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "electrodomesticos_select_own"
  ON electrodomesticos FOR SELECT
  USING (
    habitacion_id IN (
      SELECT h.id FROM habitaciones h
      INNER JOIN hogares ho ON h.hogar_id = ho.id
      WHERE ho.usuario_id = auth.uid()
    )
  );

CREATE POLICY "electrodomesticos_insert_own"
  ON electrodomesticos FOR INSERT
  WITH CHECK (
    habitacion_id IN (
      SELECT h.id FROM habitaciones h
      INNER JOIN hogares ho ON h.hogar_id = ho.id
      WHERE ho.usuario_id = auth.uid()
    )
  );

CREATE POLICY "electrodomesticos_update_own"
  ON electrodomesticos FOR UPDATE
  USING (
    habitacion_id IN (
      SELECT h.id FROM habitaciones h
      INNER JOIN hogares ho ON h.hogar_id = ho.id
      WHERE ho.usuario_id = auth.uid()
    )
  );

CREATE POLICY "electrodomesticos_delete_own"
  ON electrodomesticos FOR DELETE
  USING (
    habitacion_id IN (
      SELECT h.id FROM habitaciones h
      INNER JOIN hogares ho ON h.hogar_id = ho.id
      WHERE ho.usuario_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. TABLA: metas_consumo
-- Regla: acceso solo si la meta pertenece a un hogar del usuario
-- ============================================================================

ALTER TABLE metas_consumo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "metas_consumo_select_own"
  ON metas_consumo FOR SELECT
  USING (
    hogar_id IN (
      SELECT id FROM hogares WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "metas_consumo_insert_own"
  ON metas_consumo FOR INSERT
  WITH CHECK (
    hogar_id IN (
      SELECT id FROM hogares WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "metas_consumo_update_own"
  ON metas_consumo FOR UPDATE
  USING (
    hogar_id IN (
      SELECT id FROM hogares WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "metas_consumo_delete_own"
  ON metas_consumo FOR DELETE
  USING (
    hogar_id IN (
      SELECT id FROM hogares WHERE usuario_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. TABLA: alertas
-- Regla: acceso solo si la alerta pertenece a un hogar del usuario
-- ============================================================================

ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alertas_select_own"
  ON alertas FOR SELECT
  USING (
    hogar_id IN (
      SELECT id FROM hogares WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "alertas_insert_own"
  ON alertas FOR INSERT
  WITH CHECK (
    hogar_id IN (
      SELECT id FROM hogares WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "alertas_update_own"
  ON alertas FOR UPDATE
  USING (
    hogar_id IN (
      SELECT id FROM hogares WHERE usuario_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. TABLA: recomendaciones
-- Regla: acceso solo si la recomendación pertenece a un hogar del usuario
-- ============================================================================

ALTER TABLE recomendaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recomendaciones_select_own"
  ON recomendaciones FOR SELECT
  USING (
    hogar_id IN (
      SELECT id FROM hogares WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "recomendaciones_update_own"
  ON recomendaciones FOR UPDATE
  USING (
    hogar_id IN (
      SELECT id FROM hogares WHERE usuario_id = auth.uid()
    )
  );

-- INSERT/DELETE de recomendaciones debería ser solo desde service role (backend)

-- ============================================================================
-- 8. TABLA: cambios_electrodomestico
-- Regla: cada usuario solo puede ver sus propios cambios
-- ============================================================================

ALTER TABLE cambios_electrodomestico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cambios_select_own"
  ON cambios_electrodomestico FOR SELECT
  USING (usuario_id = auth.uid());

CREATE POLICY "cambios_insert_own"
  ON cambios_electrodomestico FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

-- ============================================================================
-- 9. TABLA: consumo_diario
-- Regla: acceso solo si el consumo pertenece a un electrodoméstico del usuario
-- Nota: esta es la cadena más larga (consumo → electrodomestico → habitacion → hogar → usuario)
-- ============================================================================

ALTER TABLE consumo_diario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consumo_diario_select_own"
  ON consumo_diario FOR SELECT
  USING (
    electrodomestico_id IN (
      SELECT e.id FROM electrodomesticos e
      INNER JOIN habitaciones h ON e.habitacion_id = h.id
      INNER JOIN hogares ho ON h.hogar_id = ho.id
      WHERE ho.usuario_id = auth.uid()
    )
  );

CREATE POLICY "consumo_diario_insert_own"
  ON consumo_diario FOR INSERT
  WITH CHECK (
    electrodomestico_id IN (
      SELECT e.id FROM electrodomesticos e
      INNER JOIN habitaciones h ON e.habitacion_id = h.id
      INNER JOIN hogares ho ON h.hogar_id = ho.id
      WHERE ho.usuario_id = auth.uid()
    )
  );

CREATE POLICY "consumo_diario_update_own"
  ON consumo_diario FOR UPDATE
  USING (
    electrodomestico_id IN (
      SELECT e.id FROM electrodomesticos e
      INNER JOIN habitaciones h ON e.habitacion_id = h.id
      INNER JOIN hogares ho ON h.hogar_id = ho.id
      WHERE ho.usuario_id = auth.uid()
    )
  );

-- ============================================================================
-- 10. TABLAS DE REFERENCIA (solo lectura para usuarios autenticados)
-- tipos_electrodomestico, comunas, empresas_electricas, tarifas_electricas,
-- comparativa_promedios — datos de referencia compartidos, no son de usuario
-- ============================================================================

ALTER TABLE tipos_electrodomestico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tipos_electrodomestico_read_all"
  ON tipos_electrodomestico FOR SELECT
  USING (auth.role() = 'authenticated');

ALTER TABLE comunas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comunas_read_all"
  ON comunas FOR SELECT
  USING (auth.role() = 'authenticated');

ALTER TABLE empresas_electricas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empresas_electricas_read_all"
  ON empresas_electricas FOR SELECT
  USING (auth.role() = 'authenticated');

ALTER TABLE tarifas_electricas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tarifas_electricas_read_all"
  ON tarifas_electricas FOR SELECT
  USING (auth.role() = 'authenticated');

ALTER TABLE comparativa_promedios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comparativa_promedios_read_all"
  ON comparativa_promedios FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- VERIFICACIÓN
-- Ejecutar para confirmar que las políticas están activas:
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
-- ============================================================================
