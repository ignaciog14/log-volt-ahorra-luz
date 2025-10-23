import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TarifaData {
  tarifa_punta_pesos_kwh: number;
  tarifa_valle_pesos_kwh: number;
  tarifa_media_pesos_kwh: number;
  empresa_nombre: string;
}

export const useTarifas = (hogarId: number | null) => {
  const [tarifa, setTarifa] = useState<TarifaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hogarId) {
      setLoading(false);
      return;
    }

    const fetchTarifa = async () => {
      try {
        setLoading(true);
        
        // Obtener información del hogar
        const { data: hogarData, error: hogarError } = await supabase
          .from("hogares")
          .select("comuna_id, empresa_electrica_id, empresas_electricas(nombre)")
          .eq("id", hogarId)
          .single();

        if (hogarError) throw hogarError;

        if (!hogarData?.comuna_id || !hogarData?.empresa_electrica_id) {
          // No hay tarifa configurada
          setTarifa(null);
          return;
        }

        // Obtener tarifas
        const { data: tarifaData, error: tarifaError } = await supabase
          .from("tarifas_electricas")
          .select("tarifa_punta_pesos_kwh, tarifa_valle_pesos_kwh")
          .eq("comuna_id", hogarData.comuna_id)
          .eq("empresa_electrica_id", hogarData.empresa_electrica_id)
          .single();

        if (tarifaError) {
          console.error("Error fetching tarifa:", tarifaError);
          // Si no hay tarifa en BD, usar valores por defecto
          setTarifa({
            tarifa_punta_pesos_kwh: 150,
            tarifa_valle_pesos_kwh: 100,
            tarifa_media_pesos_kwh: 125,
            empresa_nombre: (hogarData.empresas_electricas as any)?.nombre || "Sin empresa"
          });
          return;
        }

        if (tarifaData) {
          const tarifa_media = (tarifaData.tarifa_punta_pesos_kwh + tarifaData.tarifa_valle_pesos_kwh) / 2;
          setTarifa({
            ...tarifaData,
            tarifa_media_pesos_kwh: tarifa_media,
            empresa_nombre: (hogarData.empresas_electricas as any)?.nombre || "Sin empresa"
          });
        }
      } catch (error) {
        console.error("Error in useTarifas:", error);
        // Usar tarifa por defecto en caso de error
        setTarifa({
          tarifa_punta_pesos_kwh: 150,
          tarifa_valle_pesos_kwh: 100,
          tarifa_media_pesos_kwh: 125,
          empresa_nombre: "Tarifa estimada"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTarifa();
  }, [hogarId]);

  return { tarifa, loading };
};
