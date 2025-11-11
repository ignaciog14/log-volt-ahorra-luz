import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, X, AlertTriangle, TrendingDown, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface RecommendationsCardProps {
  hogarId: number;
  recommendations: Recommendation[];
  onUpdate: () => void;
}

const priorityConfig = {
  critical: { label: "Crítica", color: "bg-destructive text-destructive-foreground" },
  high: { label: "Alta", color: "bg-warning text-warning-foreground" },
  medium: { label: "Media", color: "bg-primary text-primary-foreground" },
  low: { label: "Baja", color: "bg-muted text-muted-foreground" },
};

export const RecommendationsCard = ({ hogarId, recommendations, onUpdate }: RecommendationsCardProps) => {
  const [filter, setFilter] = useState<"pending" | "applied" | "dismissed" | "viewed" | "all">("pending");

  const filteredRecommendations = recommendations.filter(
    rec => filter === "all" || rec.estado === filter
  ).sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.prioridad] - priorityOrder[b.prioridad];
  });

  const handleComplete = async (id: number) => {
    try {
      const { error } = await supabase
        .from("recomendaciones")
        .update({ estado: "applied" })
        .eq("id", id);

      if (error) throw error;
      toast.success("Recomendación marcada como aplicada");
      onUpdate();
    } catch (error: any) {
      toast.error("Error al actualizar recomendación");
      console.error(error);
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      const { error } = await supabase
        .from("recomendaciones")
        .update({ estado: "dismissed" })
        .eq("id", id);

      if (error) throw error;
      toast.success("Recomendación descartada");
      onUpdate();
    } catch (error: any) {
      toast.error("Error al descartar recomendación");
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-success" />
              Recomendaciones
            </CardTitle>
            <CardDescription>
              Sugerencias para reducir tu consumo y ahorrar
            </CardDescription>
          </div>
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Activas</SelectItem>
              <SelectItem value="applied">Aplicadas</SelectItem>
              <SelectItem value="dismissed">Descartadas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredRecommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay recomendaciones {filter !== "all" ? filter === "pending" ? "activas" : filter === "applied" ? "aplicadas" : "descartadas" : ""}</p>
          </div>
        ) : (
          filteredRecommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-4 rounded-lg border bg-card space-y-3 ${
                rec.estado !== "pending" ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold">{rec.titulo}</h4>
                    <Badge className={priorityConfig[rec.prioridad].color}>
                      {priorityConfig[rec.prioridad].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.descripcion}</p>
                  {rec.ahorro_potencial_pesos && (
                    <div className="flex items-center gap-1 text-success font-semibold text-sm">
                      <DollarSign className="h-4 w-4" />
                      Ahorro potencial: ${rec.ahorro_potencial_pesos.toLocaleString()} CLP/mes
                    </div>
                  )}
                </div>
              </div>
              {rec.estado === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleComplete(rec.id)}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Aplicada
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDismiss(rec.id)}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Descartar
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
