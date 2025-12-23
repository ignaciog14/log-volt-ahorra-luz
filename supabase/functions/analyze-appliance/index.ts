import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const systemPrompt = `Eres un experto en electrodomésticos y consumo energético en Chile.

Tu tarea: Analizar la información proporcionada (foto o descripción de texto) y extraer información del electrodoméstico.

DEBES responder EXACTAMENTE en formato JSON válido:
{
  "nombre": "Marca Modelo Completo",
  "tipo_sugerido": "Categoría específica del aparato",
  "categoria": "Línea Blanca/Entretenimiento/Climatización/Iluminación/Computación/Cocina/Otros",
  "consumo_watts_estimado": número entero sin comillas,
  "consumo_kwh_predeterminado": número decimal (Watts/1000 * 5 horas promedio),
  "confianza": "alta/media/baja",
  "descripcion_detectada": "Descripción breve de qué se identificó"
}

REGLAS:
1. Si NO PUEDES identificar claramente, usa "confianza": "baja"
2. Watts deben ser POSITIVOS y realistas (rango: 10-3000W)
3. kwh_predeterminado = (watts / 1000) * 5 (5 horas es uso promedio diario)
4. Nunca devuelvas campos adicionales
5. SIEMPRE responde SOLO con JSON válido, sin texto adicional
6. Si es descripción de texto, extrae características principales
7. Usa datos reales de consumo de electrodomésticos reales

Ejemplos de consumo real:
- Refrigerador: 150-400W
- TV LED 32": 30-50W
- TV LED 55": 80-120W
- Aire acondicionado 12000 BTU: 1000-1400W
- Microondas: 800-1200W
- Lavadora: 400-800W
- Secadora: 2000-3000W
- Ampolleta LED: 7-15W
- Computador desktop: 150-400W
- Laptop: 30-80W
- Ventilador: 40-80W
- Aspiradora: 800-1500W
- Plancha: 1000-2000W
- Hervidora eléctrica: 1500-2200W`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client to verify user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuario no autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { type, imageBase64, description } = body;

    // Validate input
    if (!type || (type !== 'photo' && type !== 'text')) {
      return new Response(
        JSON.stringify({ error: 'Tipo inválido. Usa "photo" o "text"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'photo' && !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Se requiere imagen en base64' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'text' && !description) {
      return new Response(
        JSON.stringify({ error: 'Se requiere descripción' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate text length
    if (type === 'text' && description.length > 500) {
      return new Response(
        JSON.stringify({ error: 'La descripción no puede exceder 500 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate image size (approximate check for base64)
    if (type === 'photo' && imageBase64.length > 7000000) { // ~5MB in base64
      return new Response(
        JSON.stringify({ error: 'La imagen no puede exceder 5MB' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check Lovable AI key
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Servicio de IA no configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let messages: any[];

    if (type === 'photo') {
      // For images, use gemini-2.5-pro for better vision capabilities
      messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analiza esta imagen de un electrodoméstico y proporciona la información en formato JSON.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ];
    } else {
      // For text, use gemini-2.5-flash
      messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Analiza esta descripción de un electrodoméstico y proporciona la información en formato JSON: "${description}"`
        }
      ];
    }

    console.log(`Processing ${type} request for user ${user.id}`);

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: type === 'photo' ? 'google/gemini-2.5-pro' : 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de solicitudes excedido. Intenta de nuevo en unos minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA agotados. Contacta al administrador.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Error al procesar con IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response:', aiData);
      return new Response(
        JSON.stringify({ 
          error: 'No se pudo identificar el electrodoméstico',
          confianza: 'nula',
          sugerencia: 'Por favor, sube una foto clara o describe el aparato con más detalle'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to parse JSON from the response
    let result;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ 
          error: 'No se pudo identificar el electrodoméstico',
          confianza: 'nula',
          sugerencia: 'Por favor, sube una foto clara o describe el aparato con más detalle'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate the result has required fields
    const requiredFields = ['nombre', 'tipo_sugerido', 'categoria', 'consumo_watts_estimado', 'consumo_kwh_predeterminado', 'confianza', 'descripcion_detectada'];
    for (const field of requiredFields) {
      if (!(field in result)) {
        console.error(`Missing field ${field} in result:`, result);
        result[field] = field === 'confianza' ? 'baja' : 
                        field === 'consumo_watts_estimado' ? 100 :
                        field === 'consumo_kwh_predeterminado' ? 0.5 :
                        'No identificado';
      }
    }

    // Ensure watts and kwh are numbers
    result.consumo_watts_estimado = Number(result.consumo_watts_estimado) || 100;
    result.consumo_kwh_predeterminado = Number(result.consumo_kwh_predeterminado) || 0.5;

    console.log('Successfully analyzed appliance:', result.nombre);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in analyze-appliance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        confianza: 'nula',
        sugerencia: 'Por favor intenta de nuevo'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
