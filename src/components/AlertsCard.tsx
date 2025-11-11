import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Alert {
  id: number;
  titulo: string;
  descripcion: string;
  severidad: "info" | "warning" | "critical";
  leida: boolean;
  fecha_creacion: string;
  electrodomestico_id: number | null;
}

interface AlertsCardProps {
  hogarId: number;
  alerts: Alert[];
  onUpdate: () => void;
}

const severityConfig = {
  critical: { 
    label: "Crítica", 
    color: "bg-destructive text-destructive-foreground",
    icon: AlertCircle
  },
  warning: { 
    label: "Advertencia", 
    color: "bg-warning text-warning-foreground",
    icon: AlertTriangle
  },
  info: { 
    label: "Info", 
    color: "bg-primary text-primary-foreground",
    icon: Info
  },
};

export const AlertsCard = ({ hogarId, alerts, onUpdate }: AlertsCardProps) => {
  const [filter, setFilter] = useState<"unread" | "read" | "all">("unread");

  const filteredAlerts = alerts
    .filter(alert => {
      if (filter === "unread") return !alert.leida;
      if (filter === "read") return alert.leida;
      return true;
    })
    .sort((a, b) => {
      // Sort by severity first (critical > warning > info)
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      if (severityOrder[a.severidad] !== severityOrder[b.severidad]) {
        return severityOrder[a.severidad] - severityOrder[b.severidad];
      }
      // Then by date (newest first)
      return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
    });

  const unreadCount = alerts.filter(a => !a.leida).length;

  const handleMarkAsRead = async (id: number) => {
    try {
      const { error } = await supabase
        .from("alertas")
        .update({ leida: true })
        .eq("id", id);

      if (error) throw error;
      toast.success("Alerta marcada como leída");
      onUpdate();
    } catch (error: any) {
      toast.error("Error al marcar alerta");
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("alertas")
        .update({ leida: true })
        .eq("hogar_id", hogarId)
        .eq("leida", false);

      if (error) throw error;
      toast.success("Todas las alertas marcadas como leídas");
      onUpdate();
    } catch (error: any) {
      toast.error("Error al marcar alertas");
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Alertas
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Notificaciones sobre consumos anómalos
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkAllAsRead}
              >
                Marcar todas leídas
              </Button>
            )}
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unread">No leídas</SelectItem>
                <SelectItem value="read">Leídas</SelectItem>
                <SelectItem value="all">Todas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay alertas {filter === "unread" ? "sin leer" : filter === "read" ? "leídas" : ""}</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const SeverityIcon = severityConfig[alert.severidad].icon;
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border bg-card space-y-2 ${
                  alert.leida ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 flex-1">
                    <SeverityIcon className={`h-5 w-5 mt-0.5 ${
                      alert.severidad === "critical" ? "text-destructive" :
                      alert.severidad === "warning" ? "text-warning" :
                      "text-primary"
                    }`} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{alert.titulo}</h4>
                        <Badge className={severityConfig[alert.severidad].color}>
                          {severityConfig[alert.severidad].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.descripcion}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.fecha_creacion).toLocaleDateString("es-CL", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                {!alert.leida && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkAsRead(alert.id)}
                    className="w-full"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Marcar como leída
                  </Button>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
