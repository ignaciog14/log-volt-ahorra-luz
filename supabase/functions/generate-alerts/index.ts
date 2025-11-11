import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Electrodomestico {
  id: number
  habitacion_id: number
  tipo_id: number
  consumo_kwh_ajustado: number | null
  horas_uso_diarias: number
  nombre_personalizado: string | null
  tipos_electrodomestico: {
    nombre: string
    consumo_kwh_predeterminado: number
  } | null
  habitaciones: {
    nombre: string
    hogar_id: number
  } | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all active appliances
    const { data: appliances, error: appliancesError } = await supabaseClient
      .from('electrodomesticos')
      .select(`
        id,
        habitacion_id,
        tipo_id,
        consumo_kwh_ajustado,
        horas_uso_diarias,
        nombre_personalizado,
        tipos_electrodomestico (
          nombre,
          consumo_kwh_predeterminado
        ),
        habitaciones (
          nombre,
          hogar_id
        )
      `)
      .eq('activo', true) as { data: Electrodomestico[] | null, error: any }

    if (appliancesError) throw appliancesError

    // Get comparison averages
    const { data: averages, error: averagesError } = await supabaseClient
      .from('comparativa_promedios')
      .select('*')

    if (averagesError) throw averagesError

    const alerts = []

    for (const appliance of appliances || []) {
      if (!appliance.habitaciones) continue

      const consumo = appliance.consumo_kwh_ajustado || 
                     appliance.tipos_electrodomestico?.consumo_kwh_predeterminado || 0
      const consumoDiario = consumo * appliance.horas_uso_diarias

      // Find average for this appliance type
      const tipoNombre = appliance.tipos_electrodomestico?.nombre || ''
      const average = averages?.find(
        avg => avg.tipo_electrodomestico.toLowerCase() === tipoNombre.toLowerCase()
      )

      if (average) {
        const promedioMensual = average.consumo_kwh_promedio
        const promedioDiario = promedioMensual / 30

        // Check if consumption is significantly higher than average
        if (consumoDiario > promedioDiario * 1.5) {
          // Check if alert already exists in last 24 hours
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)

          const { data: existing } = await supabaseClient
            .from('alertas')
            .select('id')
            .eq('hogar_id', appliance.habitaciones.hogar_id)
            .eq('electrodomestico_id', appliance.id)
            .gte('fecha_creacion', yesterday.toISOString())
            .maybeSingle()

          if (!existing) {
            const exceso = ((consumoDiario / promedioDiario - 1) * 100).toFixed(0)
            
            alerts.push({
              hogar_id: appliance.habitaciones.hogar_id,
              electrodomestico_id: appliance.id,
              titulo: `Consumo elevado detectado`,
              descripcion: `${appliance.nombre_personalizado || tipoNombre} en ${appliance.habitaciones.nombre} está consumiendo ${exceso}% más que el promedio (${consumoDiario.toFixed(1)} kWh/día vs ${promedioDiario.toFixed(1)} kWh/día promedio). Verifica su funcionamiento.`,
              severidad: consumoDiario > promedioDiario * 2 ? 'critical' : 'warning',
              leida: false
            })
          }
        }
      }

      // Check for extremely high daily usage (potential malfunction)
      if (appliance.horas_uso_diarias >= 24) {
        const { data: existing } = await supabaseClient
          .from('alertas')
          .select('id')
          .eq('hogar_id', appliance.habitaciones.hogar_id)
          .eq('electrodomestico_id', appliance.id)
          .eq('severidad', 'critical')
          .eq('leida', false)
          .maybeSingle()

        if (!existing) {
          alerts.push({
            hogar_id: appliance.habitaciones.hogar_id,
            electrodomestico_id: appliance.id,
            titulo: `Posible falla detectada`,
            descripcion: `${appliance.nombre_personalizado || tipoNombre} registra 24 horas de uso continuo. Esto podría indicar una falla o que el electrodoméstico quedó encendido por error.`,
            severidad: 'critical',
            leida: false
          })
        }
      }
    }

    // Get all homes to check consumption limits
    const { data: homes, error: homesError } = await supabaseClient
      .from('hogares')
      .select('id')
      .eq('activo', true)

    if (homesError) throw homesError

    // Insert all alerts
    if (alerts.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('alertas')
        .insert(alerts)

      if (insertError) throw insertError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        generated: alerts.length,
        message: `Generated ${alerts.length} new alerts`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating alerts:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
