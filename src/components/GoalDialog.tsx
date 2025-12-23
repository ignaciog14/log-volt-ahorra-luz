import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GoalDialogProps {
  hogarId: number;
  currentGoal?: {
    id: number;
    consumo_kwh_meta: number | null;
    costo_pesos_meta: number | null;
  } | null;
  onSaved: () => void;
  children?: React.ReactNode;
}

export const GoalDialog = ({ hogarId, currentGoal, onSaved, children }: GoalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [metaKwh, setMetaKwh] = useState(currentGoal?.consumo_kwh_meta?.toString() || "");
  const [metaPesos, setMetaPesos] = useState(currentGoal?.costo_pesos_meta?.toString() || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!metaKwh && !metaPesos) {
      toast.error("Debes establecer al menos una meta (kWh o pesos)");
      return;
    }

    try {
      setLoading(true);
      const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
      
      const goalData: any = {
        hogar_id: hogarId,
        mes_ano: currentMonth,
        estado: "active",
      };
      
      if (metaKwh) goalData.consumo_kwh_meta = parseFloat(metaKwh);
      if (metaPesos) goalData.costo_pesos_meta = parseFloat(metaPesos);

      if (currentGoal) {
        const { error } = await supabase
          .from("metas_consumo")
          .update(goalData)
          .eq("id", currentGoal.id);
        
        if (error) throw error;
        toast.success("Meta actualizada correctamente");
      } else {
        const { error } = await supabase
          .from("metas_consumo")
          .insert([goalData]);
        
        if (error) throw error;
        toast.success("Meta establecida correctamente");
      }

      setOpen(false);
      onSaved();
    } catch (error: any) {
      toast.error("Error al guardar meta");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Target className="h-4 w-4 mr-2" />
            {currentGoal ? "Editar meta" : "Establecer meta"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Meta de consumo mensual</DialogTitle>
          <DialogDescription>
            Establece tu meta de consumo para el mes actual y mantén el control de tu gasto energético
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="meta-kwh">Meta de consumo (kWh)</Label>
            <Input
              id="meta-kwh"
              type="number"
              step="0.1"
              placeholder="Ej: 300"
              value={metaKwh}
              onChange={(e) => setMetaKwh(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Cantidad máxima de kWh que deseas consumir este mes
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta-pesos">Meta de costo (CLP)</Label>
            <Input
              id="meta-pesos"
              type="number"
              step="100"
              placeholder="Ej: 50000"
              value={metaPesos}
              onChange={(e) => setMetaPesos(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Costo máximo en pesos que deseas pagar este mes
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar meta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
