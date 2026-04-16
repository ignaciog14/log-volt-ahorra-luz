import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Appliance {
  id: number;
  tipo_id: number;
  nombre_personalizado: string | null;
  horas_uso_diarias: number;
  consumo_kwh_ajustado: number | null;
  activo: boolean;
  es_personalizado: boolean;
  tipos_electrodomestico?: {
    nombre: string;
    consumo_kwh_predeterminado: number;
    potencia_watt: number;
  };
}

export interface Room {
  id: number;
  nombre: string;
  tipo: string;
  hogar_id: number;
  hogares?: { nombre: string };
}

interface UseAppliancesResult {
  room: Room | null;
  appliances: Appliance[];
  loading: boolean;
  fetchRoomAndAppliances: () => Promise<void>;
}

export function useAppliances(roomId: string | undefined): UseAppliancesResult {
  const [room, setRoom] = useState<Room | null>(null);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoomAndAppliances = useCallback(async () => {
    if (!roomId) return;

    setLoading(true);
    try {
      const { data: roomData, error: roomError } = await supabase
        .from("habitaciones")
        .select("*, hogares(nombre)")
        .eq("id", parseInt(roomId))
        .single();

      if (roomError) throw roomError;
      setRoom(roomData);

      const { data: appliancesData, error: appliancesError } = await supabase
        .from("electrodomesticos")
        .select("*, tipos_electrodomestico(*)")
        .eq("habitacion_id", parseInt(roomId))
        .order("nombre_personalizado");

      if (appliancesError) throw appliancesError;
      setAppliances(appliancesData || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al cargar los datos";
      toast.error(message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoomAndAppliances();
  }, [fetchRoomAndAppliances]);

  return { room, appliances, loading, fetchRoomAndAppliances };
}
