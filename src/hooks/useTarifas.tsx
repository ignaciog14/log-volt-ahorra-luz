import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TARIFAS_BT1 } from "@/lib/tarifaBT1";

export interface TarifaData {
  tarifa_punta_pesos_kwh: number;
  tarifa_valle_pesos_kwh: number;
  tarifa_media_pesos_kwh: number;
  empresa_nombre: string;
  /** Clave para buscar en TARIFAS_BT1 (enel | cge | chilquinta | saesa | default) */
  tarifaKey: string;
}

/** Mapea el nombre de empresa a la clave BT1 */
function resolverTarifaKey(empresaNombre: string): string {
  const nombre = empresaNombre.toLowerCase();
  if (nombre.includes("enel")) return "enel";
  if (nombre.includes("cge")) return "cge";
  if (nombre.includes("chilquinta")) return "chilquinta";
  if (nombre.includes("saesa") || nombre.includes("frontel")) return "saesa";
  return "default";
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
          .eq("activo", true)
          .maybeSingle();

        if (hogarError) throw hogarError;

        const empresaNombre = (hogarData.empresas_electricas as any)?.nombre ?? "Sin empresa";
        const tarifaKey = resolverTarifaKey(empresaNombre);
        const bt1 = TARIFAS_BT1[tarifaKey] ?? TARIFAS_BT1.default;

        if (!hogarData?.comuna_id || !hogarData?.empresa_electrica_id) {
          // Sin tarifa configurada → usar BT1 por defecto
          setTarifa({
            tarifa_punta_pesos_kwh: Math.round(bt1.preciokWh_invierno * 1.19),
            tarifa_valle_pesos_kwh: Math.round(bt1.preciokWh_normal * 1.19),
            tarifa_media_pesos_kwh: Math.round(bt1.preciokWh_normal * 1.19),
            empresa_nombre: "Tarifa referencial",
            tarifaKey: "default",
          });
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
          // Fallback a precios BT1 con IVA
          setTarifa({
            tarifa_punta_pesos_kwh: Math.round(bt1.preciokWh_invierno * 1.19),
            tarifa_valle_pesos_kwh: Math.round(bt1.preciokWh_normal * 1.19),
            tarifa_media_pesos_kwh: Math.round(bt1.preciokWh_normal * 1.19),
            empresa_nombre: empresaNombre,
            tarifaKey,
          });
          return;
        }

        if (tarifaData) {
          const tarifa_media = Math.round(
            (tarifaData.tarifa_punta_pesos_kwh + tarifaData.tarifa_valle_pesos_kwh) / 2
          );
          setTarifa({
            ...tarifaData,
            tarifa_media_pesos_kwh: tarifa_media,
            empresa_nombre: empresaNombre,
            tarifaKey,
          });
        }
      } catch (error) {
        console.error("Error in useTarifas:", error);
        const bt1Default = TARIFAS_BT1.default;
        setTarifa({
          tarifa_punta_pesos_kwh: Math.round(bt1Default.preciokWh_invierno * 1.19),
          tarifa_valle_pesos_kwh: Math.round(bt1Default.preciokWh_normal * 1.19),
          tarifa_media_pesos_kwh: Math.round(bt1Default.preciokWh_normal * 1.19),
          empresa_nombre: "Tarifa estimada",
          tarifaKey: "default",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTarifa();
  }, [hogarId]);

  return { tarifa, loading };
};
