import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DailyConsumption {
  date: string;
  consumo: number;
}

export const useDailyConsumption = (hogarId: number | null, days: number = 30) => {
  const [data, setData] = useState<DailyConsumption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDailyConsumption = async () => {
    if (!hogarId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: consumos, error } = await supabase
        .from("consumo_diario")
        .select(`
          fecha,
          consumo_kwh_registrado,
          electrodomesticos!inner(
            habitacion_id,
            habitaciones!inner(hogar_id)
          )
        `)
        .eq("electrodomesticos.habitaciones.hogar_id", hogarId)
        .eq("activo", true)
        .gte("fecha", startDate.toISOString().split('T')[0])
        .order("fecha", { ascending: true });

      if (error) throw error;

      // Aggregate by date
      const aggregated = new Map<string, number>();
      consumos?.forEach((c: any) => {
        const date = c.fecha;
        const current = aggregated.get(date) || 0;
        aggregated.set(date, current + c.consumo_kwh_registrado);
      });

      const result: DailyConsumption[] = Array.from(aggregated.entries()).map(([date, consumo]) => ({
        date: new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
        consumo: parseFloat(consumo.toFixed(2)),
      }));

      setData(result);
    } catch (error) {
      console.error("Error fetching daily consumption:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyConsumption();
  }, [hogarId, days]);

  return { data, loading, refetch: fetchDailyConsumption };
};
