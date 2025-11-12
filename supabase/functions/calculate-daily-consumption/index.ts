import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Electrodomestico {
  id: number;
  consumo_kwh_ajustado: number | null;
  horas_uso_diarias: number | null;
  tipos_electrodomestico: {
    consumo_kwh_predeterminado: number;
  } | null;
}

interface ElectrodomesticoResponse {
  id: number;
  consumo_kwh_ajustado: number | null;
  horas_uso_diarias: number | null;
  tipos_electrodomestico: {
    consumo_kwh_predeterminado: number;
  } | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting daily consumption calculation...');

    // Get all active appliances
    const { data: electrodomesticos, error: fetchError } = await supabase
      .from('electrodomesticos')
      .select(`
        id,
        consumo_kwh_ajustado,
        horas_uso_diarias,
        tipos_electrodomestico!inner(consumo_kwh_predeterminado)
      `)
      .eq('activo', true);

    if (fetchError) {
      console.error('Error fetching appliances:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${electrodomesticos?.length || 0} active appliances`);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const fechaStr = yesterday.toISOString().split('T')[0];

    const consumosToInsert = [];

    for (const elec of electrodomesticos || []) {
      const tipoData = Array.isArray(elec.tipos_electrodomestico) 
        ? elec.tipos_electrodomestico[0] 
        : elec.tipos_electrodomestico;
      const consumoKwh = elec.consumo_kwh_ajustado || tipoData?.consumo_kwh_predeterminado || 0;
      const horasUso = elec.horas_uso_diarias || 8; // Default 8 hours if not specified

      const consumoDiario = consumoKwh * horasUso;

      consumosToInsert.push({
        electrodomestico_id: elec.id,
        fecha: fechaStr,
        horas_uso_registradas: horasUso,
        consumo_kwh_registrado: consumoDiario,
        activo: true,
      });
    }

    if (consumosToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('consumo_diario')
        .insert(consumosToInsert);

      if (insertError) {
        console.error('Error inserting consumption records:', insertError);
        throw insertError;
      }

      console.log(`Successfully inserted ${consumosToInsert.length} consumption records for ${fechaStr}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        recordsInserted: consumosToInsert.length,
        date: fechaStr,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in calculate-daily-consumption:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
