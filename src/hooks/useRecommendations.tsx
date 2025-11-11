import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Recommendation {
  id: number;
  titulo: string;
  descripcion: string;
  ahorro_potencial_pesos: number | null;
  prioridad: "low" | "medium" | "high" | "critical";
  estado: "pending" | "applied" | "dismissed" | "viewed";
  fecha_creacion: string;
  electrodomestico_id: number | null;
}

export const useRecommendations = (hogarId: number | null) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = async () => {
    if (!hogarId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("recomendaciones")
        .select("*")
        .eq("hogar_id", hogarId)
        .order("fecha_creacion", { ascending: false });

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [hogarId]);

  return { recommendations, loading, refetch: fetchRecommendations };
};
