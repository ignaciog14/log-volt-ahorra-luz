import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const editApplianceSchema = z.object({
  horas_uso_diarias: z.number().min(0).max(24),
  consumo_kwh_ajustado: z.number().positive().optional().nullable(),
});

type EditApplianceFormValues = z.infer<typeof editApplianceSchema>;

interface ApplianceEditFormProps {
  appliance: {
    id: number;
    horas_uso_diarias: number;
    consumo_kwh_ajustado: number | null;
    tipos_electrodomestico?: {
      nombre: string;
      consumo_kwh_predeterminado: number;
    };
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const ApplianceEditForm = ({ appliance, onSuccess, onCancel }: ApplianceEditFormProps) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditApplianceFormValues>({
    resolver: zodResolver(editApplianceSchema),
    defaultValues: {
      horas_uso_diarias: appliance.horas_uso_diarias,
      consumo_kwh_ajustado: appliance.consumo_kwh_ajustado,
    },
  });

  const onSubmit = async (data: EditApplianceFormValues) => {
    setLoading(true);
    try {
      // Prepare update data
      const updateData: any = {
        horas_uso_diarias: data.horas_uso_diarias,
      };

      // Only update consumo_kwh_ajustado if it's provided
      if (data.consumo_kwh_ajustado !== null && data.consumo_kwh_ajustado !== undefined) {
        updateData.consumo_kwh_ajustado = data.consumo_kwh_ajustado;
      }

      // Update appliance
      const { error } = await supabase
        .from("electrodomesticos")
        .update(updateData)
        .eq("id", appliance.id);

      if (error) throw error;

      // Log changes
      if (appliance.horas_uso_diarias !== data.horas_uso_diarias) {
        await supabase.from("cambios_electrodomestico").insert({
          electrodomestico_id: appliance.id,
          usuario_id: user?.id,
          campo_modificado: "horas_uso_diarias",
          valor_anterior: appliance.horas_uso_diarias.toString(),
          valor_nuevo: data.horas_uso_diarias.toString(),
        });
      }

      if (appliance.consumo_kwh_ajustado !== data.consumo_kwh_ajustado) {
        await supabase.from("cambios_electrodomestico").insert({
          electrodomestico_id: appliance.id,
          usuario_id: user?.id,
          campo_modificado: "consumo_kwh_ajustado",
          valor_anterior: appliance.consumo_kwh_ajustado?.toString() || "null",
          valor_nuevo: data.consumo_kwh_ajustado?.toString() || "null",
        });
      }

      toast.success("Electrodoméstico actualizado exitosamente");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar el electrodoméstico");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const currentConsumption = appliance.consumo_kwh_ajustado ?? appliance.tipos_electrodomestico?.consumo_kwh_predeterminado ?? 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Consumo Actual</Label>
        <div className="text-2xl font-bold text-foreground">
          {currentConsumption.toFixed(2)} kWh
        </div>
        {!appliance.consumo_kwh_ajustado && (
          <p className="text-sm text-muted-foreground mt-1">
            Usando valor predeterminado de {appliance.tipos_electrodomestico?.nombre}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="consumo_kwh_ajustado">Consumo Ajustado (opcional)</Label>
        <Input
          id="consumo_kwh_ajustado"
          type="number"
          step="0.01"
          {...register("consumo_kwh_ajustado", { 
            setValueAs: (v) => v === "" ? null : parseFloat(v) 
          })}
          placeholder="Dejar vacío para usar valor predeterminado"
        />
        {errors.consumo_kwh_ajustado && (
          <p className="text-sm text-destructive mt-1">{errors.consumo_kwh_ajustado.message}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          Si conoces el consumo real, ingrésalo aquí. Si lo dejas vacío, se usará el valor predeterminado.
        </p>
      </div>

      <div>
        <Label htmlFor="horas_uso_diarias">Horas de Uso Diarias *</Label>
        <Input
          id="horas_uso_diarias"
          type="number"
          step="0.5"
          min="0"
          max="24"
          {...register("horas_uso_diarias", { valueAsNumber: true })}
        />
        {errors.horas_uso_diarias && (
          <p className="text-sm text-destructive mt-1">{errors.horas_uso_diarias.message}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          Promedio de horas que el electrodoméstico está en uso por día (0-24)
        </p>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm font-medium">Consumo Estimado Diario</p>
        <p className="text-2xl font-bold text-foreground mt-1">
          {(currentConsumption * (parseFloat(String(document.getElementById('horas_uso_diarias') ? (document.getElementById('horas_uso_diarias') as HTMLInputElement).value : appliance.horas_uso_diarias)) || appliance.horas_uso_diarias)).toFixed(2)} kWh/día
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
};

export default ApplianceEditForm;
