import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TopAppliance {
  name: string;
  consumption: number;
  percentage: number;
  room: string;
}

export interface RoomConsumption {
  name: string;
  value: number;
  percentage: number;
}

export interface DailyConsumption {
  date: string;
  consumo: number;
}

interface DashboardData {
  totalConsumption: number;
  topAppliances: TopAppliance[];
  roomConsumption: RoomConsumption[];
  dailyConsumption: DailyConsumption[];
  totalRooms: number;
  totalAppliances: number;
  loading: boolean;
}

export function useDashboardData(selectedHogar: number | null): DashboardData {
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [topAppliances, setTopAppliances] = useState<TopAppliance[]>([]);
  const [roomConsumption, setRoomConsumption] = useState<RoomConsumption[]>([]);
  const [dailyConsumption, setDailyConsumption] = useState<DailyConsumption[]>([]);
  const [totalRooms, setTotalRooms] = useState(0);
  const [totalAppliances, setTotalAppliances] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedHogar) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: consumoData, error: consumoError } = await supabase.rpc(
          "calcular_consumo_hogar",
          { hogar_id_param: selectedHogar }
        );
        if (consumoError) throw consumoError;

        const total = consumoData || 0;
        setTotalConsumption(total);

        const { data: roomsData, error: roomsError } = await supabase
          .from("habitaciones")
          .select(`
            nombre,
            electrodomesticos (
              nombre_personalizado,
              horas_uso_diarias,
              consumo_kwh_ajustado,
              activo,
              tipos_electrodomestico (
                nombre,
                consumo_kwh_predeterminado
              )
            )
          `)
          .eq("hogar_id", selectedHogar);

        if (roomsError) throw roomsError;

        if (roomsData) {
          setTotalRooms(roomsData.length);

          let appliancesCount = 0;
          const roomMap: Record<string, number> = {};
          const allAppliances: TopAppliance[] = [];

          roomsData.forEach((room) => {
            let roomTotal = 0;
            const electros = room.electrodomesticos as Array<{
              nombre_personalizado: string | null;
              horas_uso_diarias: number;
              consumo_kwh_ajustado: number | null;
              activo: boolean | null;
              tipos_electrodomestico?: {
                nombre: string;
                consumo_kwh_predeterminado: number;
              } | null;
            }>;

            if (electros && Array.isArray(electros)) {
              appliancesCount += electros.length;
              electros.forEach((e) => {
                const kwh =
                  (e.consumo_kwh_ajustado ??
                    e.tipos_electrodomestico?.consumo_kwh_predeterminado ??
                    0) * e.horas_uso_diarias * 30;
                roomTotal += kwh;
                allAppliances.push({
                  name:
                    e.nombre_personalizado ||
                    e.tipos_electrodomestico?.nombre ||
                    "Sin nombre",
                  consumption: Math.round(kwh),
                  percentage: 0, // calculado después
                  room: room.nombre,
                });
              });
            }

            if (roomTotal > 0) {
              roomMap[room.nombre] = Math.round(roomTotal);
            }
          });

          setTotalAppliances(appliancesCount);

          const roomTotal = Object.values(roomMap).reduce((s, v) => s + v, 0);
          setRoomConsumption(
            Object.entries(roomMap)
              .map(([name, value]) => ({
                name,
                value,
                percentage: Math.round((value / roomTotal) * 100),
              }))
              .sort((a, b) => b.value - a.value)
          );

          const grandTotal = total || 1;
          const topFour = allAppliances
            .sort((a, b) => b.consumption - a.consumption)
            .slice(0, 4)
            .map((a) => ({
              ...a,
              percentage: Math.round((a.consumption / grandTotal) * 100),
            }));
          setTopAppliances(topFour);
        }

        // Consumo diario: intentar desde consumo_diario, usar estimación como fallback
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const { data: dailyData } = await supabase
          .from("consumo_diario")
          .select(`
            fecha,
            consumo_kwh_registrado,
            electrodomestico_id,
            electrodomesticos!inner (
              habitacion_id,
              habitaciones!inner (
                hogar_id
              )
            )
          `)
          .gte("fecha", sevenDaysAgo.toISOString().split("T")[0]);

        if (dailyData && dailyData.length > 0) {
          const byDate: Record<string, number> = {};
          dailyData.forEach((row) => {
            byDate[row.fecha] = (byDate[row.fecha] || 0) + row.consumo_kwh_registrado;
          });
          const result: DailyConsumption[] = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split("T")[0];
            result.push({
              date: d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" }),
              consumo: Math.round(byDate[key] || 0),
            });
          }
          setDailyConsumption(result);
        } else {
          // Fallback: estimación basada en consumo mensual promedio (sin datos reales)
          const dailyAvg = (consumoData || 0) / 30;
          const estimated: DailyConsumption[] = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            estimated.push({
              date: d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" }),
              consumo: Math.round(dailyAvg),
            });
          }
          setDailyConsumption(estimated);
        }
      } catch (error: unknown) {
        toast.error("Error al cargar los datos del dashboard");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedHogar]);

  return {
    totalConsumption,
    topAppliances,
    roomConsumption,
    dailyConsumption,
    totalRooms,
    totalAppliances,
    loading,
  };
}
