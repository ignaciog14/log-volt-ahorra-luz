import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Hogar {
  id: number;
  nombre: string;
  direccion: string | null;
  numero_personas: number | null;
  area_m2: number | null;
  comuna_id: number | null;
  empresa_electrica_id: number | null;
  comunas?: { nombre: string };
}

interface UseHogaresResult {
  hogares: Hogar[];
  loading: boolean;
  fetchHogares: () => Promise<void>;
}

export function useHogares(userId: string | undefined): UseHogaresResult {
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHogares = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hogares")
        .select("*, comunas(nombre)")
        .order("fecha_creacion", { ascending: false });

      if (error) throw error;
      setHogares(data || []);
    } catch (error: unknown) {
      toast.error("Error al cargar los hogares");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHogares();
  }, [userId]);

  return { hogares, loading, fetchHogares };
}
