import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Electrodomestico {
  id: number;
  nombre_personalizado: string | null;
  horas_uso_diarias: number;
  activo: boolean;
  tipos_electrodomestico?: {
    nombre: string;
    categoria: string;
  };
}

export interface Habitacion {
  id: number;
  nombre: string;
  tipo: string;
  orden?: number;
  electrodomesticos: Electrodomestico[];
}

export interface HogarDetalle {
  id: number;
  nombre: string;
  direccion: string | null;
  numero_personas: number | null;
  area_m2: number | null;
  comuna_id: number | null;
  empresa_electrica_id: number | null;
}

interface UseHomeDetailsResult {
  hogar: HogarDetalle | null;
  habitaciones: Habitacion[];
  loading: boolean;
  fetchData: () => Promise<void>;
}

export function useHomeDetails(id: string | undefined): UseHomeDetailsResult {
  const [hogar, setHogar] = useState<HogarDetalle | null>(null);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    const hogarId = parseInt(id);

    setLoading(true);
    try {
      const { data: hogarData, error: hogarError } = await supabase
        .from("hogares")
        .select("*")
        .eq("id", hogarId)
        .single();

      if (hogarError) throw hogarError;
      setHogar(hogarData);

      const { data: habitacionesData, error: habitacionesError } = await supabase
        .from("habitaciones")
        .select(`
          *,
          electrodomesticos (
            *,
            tipos_electrodomestico (
              nombre,
              categoria
            )
          )
        `)
        .eq("hogar_id", hogarId)
        .order("nombre");

      if (habitacionesError) throw habitacionesError;
      setHabitaciones(habitacionesData || []);
    } catch (error: unknown) {
      toast.error("Error al cargar los datos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { hogar, habitaciones, loading, fetchData };
}
