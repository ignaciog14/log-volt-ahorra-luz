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

    // Get all active appliances with their consumption
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

    const recommendations = []

    for (const appliance of appliances || []) {
      if (!appliance.habitaciones) continue

      const consumo = appliance.consumo_kwh_ajustado || 
                     appliance.tipos_electrodomestico?.consumo_kwh_predeterminado || 0
      const consumoMensual = consumo * appliance.horas_uso_diarias * 30

      // Find average for this appliance type
      const tipoNombre = appliance.tipos_electrodomestico?.nombre || ''
      const average = averages?.find(
        avg => avg.tipo_electrodomestico.toLowerCase() === tipoNombre.toLowerCase()
      )

      if (average && consumoMensual > average.consumo_kwh_promedio * 1.2) {
        // High consumption detected
        const excesoKwh = consumoMensual - average.consumo_kwh_promedio
        const ahorroEstimado = excesoKwh * 120 // $120 CLP promedio por kWh

        // Check if recommendation already exists
        const { data: existing } = await supabaseClient
          .from('recomendaciones')
          .select('id')
          .eq('hogar_id', appliance.habitaciones.hogar_id)
          .eq('electrodomestico_id', appliance.id)
          .eq('estado', 'pending')
          .maybeSingle()

        if (!existing) {
          recommendations.push({
            hogar_id: appliance.habitaciones.hogar_id,
            electrodomestico_id: appliance.id,
            titulo: `Reduce consumo de ${appliance.nombre_personalizado || tipoNombre}`,
            descripcion: `Este electrodoméstico consume ${excesoKwh.toFixed(1)} kWh/mes más que el promedio. Considera reducir las horas de uso o reemplazar por un modelo más eficiente.`,
            ahorro_potencial_pesos: Math.round(ahorroEstimado),
            prioridad: consumoMensual > average.consumo_kwh_promedio * 1.5 ? 'critical' : 
                      consumoMensual > average.consumo_kwh_promedio * 1.35 ? 'high' : 'medium',
            estado: 'pending'
          })
        }
      }

      // Check for excessive daily usage
      if (appliance.horas_uso_diarias > 20) {
        const { data: existing } = await supabaseClient
          .from('recomendaciones')
          .select('id')
          .eq('hogar_id', appliance.habitaciones.hogar_id)
          .eq('electrodomestico_id', appliance.id)
          .eq('estado', 'pending')
          .maybeSingle()

        if (!existing) {
          recommendations.push({
            hogar_id: appliance.habitaciones.hogar_id,
            electrodomestico_id: appliance.id,
            titulo: `Uso excesivo de ${appliance.nombre_personalizado || tipoNombre}`,
            descripcion: `Este electrodoméstico está en uso ${appliance.horas_uso_diarias} horas al día. Considera apagarlo cuando no se use.`,
            ahorro_potencial_pesos: Math.round(consumo * (appliance.horas_uso_diarias - 16) * 30 * 120),
            prioridad: 'high',
            estado: 'pending'
          })
        }
      }
    }

    // Insert all recommendations
    if (recommendations.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('recomendaciones')
        .insert(recommendations)

      if (insertError) throw insertError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        generated: recommendations.length,
        message: `Generated ${recommendations.length} new recommendations`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating recommendations:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
