import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Goal {
  id: number;
  hogar_id: number;
  consumo_kwh_meta: number | null;
  costo_pesos_meta: number | null;
  mes_ano: string;
  estado: "active" | "completed" | "failed";
  fecha_creacion: string;
}

export const useGoals = (hogarId: number | null) => {
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentGoal = async () => {
    if (!hogarId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
      
      const { data, error } = await supabase
        .from("metas_consumo")
        .select("*")
        .eq("hogar_id", hogarId)
        .eq("mes_ano", currentMonth)
        .eq("estado", "active")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setCurrentGoal(data || null);
    } catch (error) {
      console.error("Error fetching goal:", error);
      setCurrentGoal(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentGoal();
  }, [hogarId]);

  return { currentGoal, loading, refetch: fetchCurrentGoal };
};
