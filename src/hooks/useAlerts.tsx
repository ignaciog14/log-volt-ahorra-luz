import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Alert {
  id: number;
  titulo: string;
  descripcion: string;
  severidad: "info" | "warning" | "critical";
  leida: boolean;
  fecha_creacion: string;
  electrodomestico_id: number | null;
}

export const useAlerts = (hogarId: number | null) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    if (!hogarId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("alertas")
        .select("*")
        .eq("hogar_id", hogarId)
        .order("fecha_creacion", { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [hogarId]);

  return { alerts, loading, refetch: fetchAlerts };
};
