import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AlertConfigDialogProps {
  hogarId: number;
}

export const AlertConfigDialog = ({ hogarId }: AlertConfigDialogProps) => {
  const [open, setOpen] = useState(false);
  const [limiteKwh, setLimiteKwh] = useState("");
  const [limitePesos, setLimitePesos] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const updates: any = {};
      
      if (limiteKwh) {
        updates.limite_kwh_diario = parseFloat(limiteKwh);
      }
      
      if (limitePesos) {
        updates.limite_costo_mensual = parseFloat(limitePesos);
      }

      const { error } = await supabase
        .from("hogares")
        .update(updates)
        .eq("id", hogarId);

      if (error) throw error;

      toast.success("Configuración guardada correctamente");
      setOpen(false);
    } catch (error: any) {
      toast.error("Error al guardar configuración");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configurar límites
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar límites de alertas</DialogTitle>
          <DialogDescription>
            Establece límites personalizados para recibir alertas cuando tu consumo sea alto
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="limite-kwh">Límite diario de consumo (kWh)</Label>
            <Input
              id="limite-kwh"
              type="number"
              step="0.1"
              placeholder="Ej: 50"
              value={limiteKwh}
              onChange={(e) => setLimiteKwh(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Recibirás una alerta si tu consumo diario supera este valor
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="limite-pesos">Límite mensual de costo (CLP)</Label>
            <Input
              id="limite-pesos"
              type="number"
              step="100"
              placeholder="Ej: 50000"
              value={limitePesos}
              onChange={(e) => setLimitePesos(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Recibirás una alerta si tu costo mensual proyectado supera este valor
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar configuración"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
