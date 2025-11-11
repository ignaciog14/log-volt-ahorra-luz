# Recomendaciones y Alertas - Guía de Configuración

## Descripción General

Este sistema genera automáticamente:
- **Recomendaciones**: Sugerencias para reducir consumo basadas en patrones de uso
- **Alertas**: Notificaciones sobre consumos anómalos o altos

## Funcionalidades Implementadas

### ✅ Épica 8: Recomendaciones Automáticas

#### HU-8.1: Generar recomendaciones basadas en consumo
- Algoritmo que compara consumo vs promedios de la tabla `comparativa_promedios`
- Si consumo > promedio + 20%, genera recomendación
- Tipos: "Reduce horas de uso", "Considera modelo eficiente"
- Calcula ahorro potencial en pesos (CLP)
- Asigna prioridad: critical, high, medium, low

#### HU-8.2: Ver recomendaciones en dashboard
- Card con recomendaciones ordenadas por prioridad
- Muestra: título, descripción, ahorro potencial
- Filtros: Activas / Aplicadas / Descartadas / Todas

#### HU-8.3: Marcar recomendación como aplicada
- Botón "Aplicada" cambia estado a "applied"
- Se remueve de vista de activas
- Registra fecha en fecha_creacion

#### HU-8.4: Descartar recomendación
- Botón "Descartar" cambia estado a "dismissed"
- Se remueve de activas

### ✅ Épica 9: Alertas de Anomalías

#### HU-9.1: Generar alerta por consumo alto
- Algoritmo: si consumo_hoy > promedio * 1.5, genera alerta
- Severidad: critical / warning / info
- Guarda en tabla `alertas`

#### HU-9.2: Ver alertas en dashboard
- Sección "Alertas" ordenada por severidad
- Muestra: tipo, descripción, electrodoméstico, fecha
- Botón "Marcar todas leídas"
- Badge con contador de no leídas

#### HU-9.3: Marcar alerta como leída
- Toggle "leída" cambia opacidad visual
- Filtro por leídas/no leídas

#### HU-9.4: Configurar límites de alerta (UI lista)
- Componente `AlertConfigDialog` creado
- Permite establecer límite_kwh_diario y límite_costo_mensual
- Nota: Requiere migración para agregar columnas a tabla `hogares`

## Componentes Creados

### Frontend
- `src/components/RecommendationsCard.tsx` - Tarjeta de recomendaciones
- `src/components/AlertsCard.tsx` - Tarjeta de alertas
- `src/components/AlertConfigDialog.tsx` - Diálogo de configuración de límites
- `src/components/GenerateInsightsButton.tsx` - Botón para generar manualmente
- `src/hooks/useRecommendations.tsx` - Hook para cargar recomendaciones
- `src/hooks/useAlerts.tsx` - Hook para cargar alertas

### Backend
- `supabase/functions/generate-recommendations/index.ts` - Genera recomendaciones
- `supabase/functions/generate-alerts/index.ts` - Genera alertas

## Uso Manual

### Generar Recomendaciones y Alertas Manualmente

En el Dashboard, haz clic en el botón "Generar Insights" en la sección de Acciones Rápidas.

Este botón ejecuta:
```typescript
supabase.functions.invoke('generate-recommendations')
supabase.functions.invoke('generate-alerts')
```

## Configuración de Generación Automática (Cron)

Para ejecutar la generación automáticamente cada 7 días, configura un cron job en Supabase:

### 1. Habilitar extensiones en Supabase

```sql
-- Habilitar pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Habilitar pg_net para hacer llamadas HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 2. Crear el cron job

```sql
-- Ejecutar cada 7 días a las 6:00 AM
SELECT cron.schedule(
  'generate-recommendations-weekly',
  '0 6 */7 * *', -- Cada 7 días a las 6:00 AM
  $$
  SELECT net.http_post(
    url:='https://sbwnrousokvilaokkeno.supabase.co/functions/v1/generate-recommendations',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid25yb3Vzb2t2aWxhb2trZW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjQ2MjEsImV4cCI6MjA3NjEwMDYyMX0.b4KBWgioTMKLo83O4pKzwmiLADMKZVSpmcp18VyJg9c"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Ejecutar cada día a las 7:00 AM para alertas (más frecuente)
SELECT cron.schedule(
  'generate-alerts-daily',
  '0 7 * * *', -- Cada día a las 7:00 AM
  $$
  SELECT net.http_post(
    url:='https://sbwnrousokvilaokkeno.supabase.co/functions/v1/generate-alerts',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid25yb3Vzb2t2aWxhb2trZW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjQ2MjEsImV4cCI6MjA3NjEwMDYyMX0.b4KBWgioTMKLo83O4pKzwmiLADMKZVSpmcp18VyJg9c"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

### 3. Ver cron jobs configurados

```sql
SELECT * FROM cron.job;
```

### 4. Eliminar un cron job

```sql
SELECT cron.unschedule('generate-recommendations-weekly');
SELECT cron.unschedule('generate-alerts-daily');
```

## Algoritmos Implementados

### Generación de Recomendaciones

```typescript
// Para cada electrodoméstico activo
consumoMensual = consumo * horas_uso_diarias * 30

// Comparar con promedio de la base de datos
if (consumoMensual > promedio * 1.2) {
  // Generar recomendación
  prioridad = consumoMensual > promedio * 1.5 ? 'critical' : 
              consumoMensual > promedio * 1.35 ? 'high' : 'medium'
  
  ahorro = (consumoMensual - promedio) * 120 CLP/kWh
}

// Detectar uso excesivo
if (horas_uso_diarias > 20) {
  // Generar recomendación de reducir uso
}
```

### Generación de Alertas

```typescript
// Para cada electrodoméstico activo
consumoDiario = consumo * horas_uso_diarias
promedioDiario = promedio_mensual / 30

// Detectar consumo alto
if (consumoDiario > promedioDiario * 1.5) {
  severidad = consumoDiario > promedioDiario * 2 ? 'critical' : 'warning'
  // Generar alerta
}

// Detectar posible falla
if (horas_uso_diarias >= 24) {
  severidad = 'critical'
  // Generar alerta de posible falla
}
```

## Mejoras Futuras

### Próximos pasos (HU-9.4 completo)
- [ ] Agregar columnas `limite_kwh_diario` y `limite_costo_mensual` a tabla `hogares`
- [ ] Implementar validación de límites en edge function de alertas
- [ ] Generar alertas cuando se superen los límites configurados

### Optimizaciones
- [ ] Implementar caché de promedios para mejorar performance
- [ ] Agregar análisis de tendencias (consumo aumentando/disminuyendo)
- [ ] Machine learning para recomendaciones más precisas
- [ ] Notificaciones push/email para alertas críticas
- [ ] Dashboard de métricas de ahorro tras aplicar recomendaciones

## Testing

### Test manual
1. Agrega electrodomésticos con alto consumo
2. Haz clic en "Generar Insights"
3. Verifica que aparezcan recomendaciones y alertas
4. Prueba marcar como aplicada/descartada/leída
5. Verifica los filtros

### Test de cron (si configurado)
1. Espera a la hora configurada
2. Revisa logs de Supabase Edge Functions
3. Verifica que se generaron nuevas recomendaciones/alertas

## Troubleshooting

### No se generan recomendaciones
- Verifica que existan electrodomésticos activos
- Verifica que existan datos en `comparativa_promedios`
- Revisa logs de edge function: `supabase functions logs generate-recommendations`

### No se generan alertas
- Verifica que el consumo sea suficientemente alto vs promedio
- Revisa logs de edge function: `supabase functions logs generate-alerts`

### Cron no ejecuta
- Verifica que pg_cron esté habilitado: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
- Verifica que pg_net esté habilitado: `SELECT * FROM pg_extension WHERE extname = 'pg_net';`
- Revisa logs del cron: `SELECT * FROM cron.job_run_details WHERE jobid = <job_id> ORDER BY start_time DESC LIMIT 10;`
