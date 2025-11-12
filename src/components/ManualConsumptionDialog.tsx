import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Electrodomestico {
  id: number;
  nombre_personalizado: string | null;
  tipos_electrodomestico: {
    nombre: string;
  } | null;
}

interface ManualConsumptionDialogProps {
  electrodomesticos: Electrodomestico[];
  onSuccess: () => void;
}

const ManualConsumptionDialog = ({ electrodomesticos, onSuccess }: ManualConsumptionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedAppliance, setSelectedAppliance] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [consumo, setConsumo] = useState<string>("");
  const [horasUso, setHorasUso] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedAppliance || !consumo) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("consumo_diario")
        .insert({
          electrodomestico_id: parseInt(selectedAppliance),
          fecha: format(date, "yyyy-MM-dd"),
          consumo_kwh_registrado: parseFloat(consumo),
          horas_uso_registradas: horasUso ? parseFloat(horasUso) : 0,
          activo: true,
        });

      if (error) throw error;

      toast.success("Consumo registrado exitosamente");
      setOpen(false);
      setSelectedAppliance("");
      setConsumo("");
      setHorasUso("");
      setDate(new Date());
      onSuccess();
    } catch (error: any) {
      console.error("Error saving consumption:", error);
      toast.error("Error al guardar el consumo: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Registrar Consumo Manual
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Consumo Manual</DialogTitle>
          <DialogDescription>
            Ingresa la lectura del medidor para un electrodoméstico específico
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Electrodoméstico</Label>
            <Select value={selectedAppliance} onValueChange={setSelectedAppliance}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un electrodoméstico" />
              </SelectTrigger>
              <SelectContent>
                {electrodomesticos.map((e) => (
                  <SelectItem key={e.id} value={e.id.toString()}>
                    {e.nombre_personalizado || e.tipos_electrodomestico?.nombre || "Sin nombre"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} locale={es} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Consumo (kWh) *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="5.5"
              value={consumo}
              onChange={(e) => setConsumo(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Horas de uso (opcional)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="8.0"
              value={horasUso}
              onChange={(e) => setHorasUso(e.target.value)}
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Guardando..." : "Guardar Consumo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualConsumptionDialog;
