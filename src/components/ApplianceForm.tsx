import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const applianceSchema = z.object({
  tipo_id: z.number().int().positive("Debes seleccionar un tipo"),
  nombre_personalizado: z.string().max(100).optional(),
  horas_uso_diarias: z.number().min(0).max(24),
  consumo_kwh_ajustado: z.number().positive().optional(),
  activo: z.boolean(),
  es_personalizado: z.boolean(),
});

type ApplianceFormValues = z.infer<typeof applianceSchema>;

interface ApplianceFormProps {
  habitacionId: number;
  onSuccess: () => void;
}

interface TipoElectrodomestico {
  id: number;
  nombre: string;
  categoria: string;
  consumo_kwh_predeterminado: number;
  potencia_watt: number;
}

const ApplianceForm = ({ habitacionId, onSuccess }: ApplianceFormProps) => {
  const [tipos, setTipos] = useState<TipoElectrodomestico[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoElectrodomestico | null>(null);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ApplianceFormValues>({
    resolver: zodResolver(applianceSchema),
    defaultValues: {
      horas_uso_diarias: 4,
      activo: true,
      es_personalizado: false,
    },
  });

  const esPersonalizado = watch("es_personalizado");

  useEffect(() => {
    fetchTipos();
  }, []);

  const fetchTipos = async () => {
    const { data, error } = await supabase
      .from("tipos_electrodomestico")
      .select("*")
      .order("categoria")
      .order("nombre");

    if (error) {
      console.error("Error fetching tipos:", error);
      return;
    }
    setTipos(data || []);
  };

  const handleTipoChange = (tipoId: string) => {
    const tipo = tipos.find(t => t.id === parseInt(tipoId));
    setSelectedTipo(tipo || null);
    setValue("tipo_id", parseInt(tipoId));
  };

  const onSubmit = async (data: ApplianceFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("electrodomesticos").insert({
        ...data,
        habitacion_id: habitacionId,
      });

      if (error) throw error;

      toast.success("Electrodoméstico agregado exitosamente");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error al agregar el electrodoméstico");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const categorias = [...new Set(tipos.map(t => t.categoria))];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="tipo_id">Tipo de Electrodoméstico *</Label>
        <Select onValueChange={handleTipoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un tipo" />
          </SelectTrigger>
          <SelectContent>
            {categorias.map((categoria) => (
              <div key={categoria}>
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground capitalize">
                  {categoria}
                </div>
                {tipos
                  .filter(t => t.categoria === categoria)
                  .map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id.toString()}>
                      {tipo.nombre} ({tipo.potencia_watt}W)
                    </SelectItem>
                  ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        {errors.tipo_id && (
          <p className="text-sm text-destructive mt-1">{errors.tipo_id.message}</p>
        )}
        {selectedTipo && (
          <p className="text-sm text-muted-foreground mt-2">
            Consumo estimado: {selectedTipo.consumo_kwh_predeterminado} kWh
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="es_personalizado"
          onCheckedChange={(checked) => setValue("es_personalizado", checked)}
        />
        <Label htmlFor="es_personalizado">Personalizar nombre</Label>
      </div>

      {esPersonalizado && (
        <div>
          <Label htmlFor="nombre_personalizado">Nombre Personalizado</Label>
          <Input
            id="nombre_personalizado"
            {...register("nombre_personalizado")}
            placeholder="Ej: Refrigerador de la cocina"
          />
        </div>
      )}

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
      </div>

      <div>
        <Label htmlFor="consumo_kwh_ajustado">Consumo kWh Ajustado (opcional)</Label>
        <Input
          id="consumo_kwh_ajustado"
          type="number"
          step="0.01"
          {...register("consumo_kwh_ajustado", { valueAsNumber: true })}
          placeholder="Dejar vacío para usar el valor predeterminado"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Solo completa si conoces el consumo real del electrodoméstico
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="activo"
          defaultChecked
          onCheckedChange={(checked) => setValue("activo", checked)}
        />
        <Label htmlFor="activo">Electrodoméstico activo</Label>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Agregando..." : "Agregar Electrodoméstico"}
      </Button>
    </form>
  );
};

export default ApplianceForm;
