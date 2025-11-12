import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RoomComparison {
  habitacion_id: number;
  habitacion_nombre: string;
  tipo_habitacion: string;
  mi_consumo: number;
  promedio_nacional: number;
  diferencia_porcentaje: number;
}

interface ApplianceComparison {
  electrodomestico_id: number;
  electrodomestico_nombre: string;
  tipo: string;
  mi_consumo: number;
  promedio_nacional: number;
  diferencia_porcentaje: number;
  estado: "mejor" | "igual" | "peor";
}

export const useComparison = (hogarId: number | null) => {
  const [roomComparisons, setRoomComparisons] = useState<RoomComparison[]>([]);
  const [applianceComparisons, setApplianceComparisons] = useState<ApplianceComparison[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComparisons = async () => {
    if (!hogarId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get home region
      const { data: hogar } = await supabase
        .from("hogares")
        .select("comuna_id, comunas(region)")
        .eq("id", hogarId)
        .single();

      const region = hogar?.comunas?.region || "";

      // Get rooms with their consumption
      const { data: habitaciones } = await supabase
        .from("habitaciones")
        .select(`
          id,
          nombre,
          tipo,
          electrodomesticos(
            consumo_kwh_ajustado,
            horas_uso_diarias,
            tipos_electrodomestico(consumo_kwh_predeterminado)
          )
        `)
        .eq("hogar_id", hogarId)
        .eq("activo", true);

      // Calculate room comparisons
      const roomComps: RoomComparison[] = [];
      for (const hab of habitaciones || []) {
        const consumo = hab.electrodomesticos?.reduce((sum: number, e: any) => {
          const kwh = e.consumo_kwh_ajustado || e.tipos_electrodomestico?.consumo_kwh_predeterminado || 0;
          const horas = e.horas_uso_diarias || 0;
          return sum + (kwh * horas);
        }, 0) || 0;

        // Get average for this room type
        const { data: promedio } = await supabase
          .from("comparativa_promedios")
          .select("consumo_kwh_promedio")
          .eq("tipo_habitacion", hab.tipo)
          .eq("region", region)
          .maybeSingle();

        const promedioNacional = promedio?.consumo_kwh_promedio || 0;
        const diferencia = promedioNacional > 0 
          ? ((consumo - promedioNacional) / promedioNacional) * 100 
          : 0;

        roomComps.push({
          habitacion_id: hab.id,
          habitacion_nombre: hab.nombre,
          tipo_habitacion: hab.tipo,
          mi_consumo: consumo,
          promedio_nacional: promedioNacional,
          diferencia_porcentaje: diferencia,
        });
      }

      // Get appliances with their consumption
      const { data: electrodomesticos } = await supabase
        .from("electrodomesticos")
        .select(`
          id,
          nombre_personalizado,
          consumo_kwh_ajustado,
          horas_uso_diarias,
          habitacion_id,
          tipos_electrodomestico(nombre, consumo_kwh_predeterminado),
          habitaciones!inner(hogar_id, tipo)
        `)
        .eq("habitaciones.hogar_id", hogarId)
        .eq("activo", true);

      // Calculate appliance comparisons
      const appComps: ApplianceComparison[] = [];
      for (const elec of electrodomesticos || []) {
        const tipoNombre = elec.tipos_electrodomestico?.nombre || "otro";
        const consumo = (elec.consumo_kwh_ajustado || elec.tipos_electrodomestico?.consumo_kwh_predeterminado || 0) 
          * (elec.horas_uso_diarias || 0);

        // Get average for this appliance type
        const { data: promedio } = await supabase
          .from("comparativa_promedios")
          .select("consumo_kwh_promedio")
          .eq("tipo_electrodomestico", tipoNombre)
          .eq("region", region)
          .maybeSingle();

        const promedioNacional = promedio?.consumo_kwh_promedio || 0;
        const diferencia = promedioNacional > 0 
          ? ((consumo - promedioNacional) / promedioNacional) * 100 
          : 0;

        let estado: "mejor" | "igual" | "peor" = "igual";
        if (diferencia < -10) estado = "mejor";
        else if (diferencia > 10) estado = "peor";

        appComps.push({
          electrodomestico_id: elec.id,
          electrodomestico_nombre: elec.nombre_personalizado || tipoNombre,
          tipo: tipoNombre,
          mi_consumo: consumo,
          promedio_nacional: promedioNacional,
          diferencia_porcentaje: diferencia,
          estado,
        });
      }

      setRoomComparisons(roomComps);
      setApplianceComparisons(appComps);
    } catch (error) {
      console.error("Error fetching comparisons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisons();
  }, [hogarId]);

  return { roomComparisons, applianceComparisons, loading, refetch: fetchComparisons };
};
