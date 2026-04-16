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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CATALOGO_REFERENCIA,
  calcularConsumoMensual,
  type CategoriaElectrodomestico,
  type ModeloReferencia,
} from "@/lib/applianceCatalog";

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

const EFICIENCIA_COLOR: Record<string, string> = {
  "A+++": "bg-green-100 text-green-800",
  "A++":  "bg-green-100 text-green-700",
  "A+":   "bg-emerald-100 text-emerald-700",
  "A":    "bg-yellow-100 text-yellow-700",
  "B":    "bg-orange-100 text-orange-700",
  "C":    "bg-red-100 text-red-700",
  "D":    "bg-red-200 text-red-900",
  "N/A":  "bg-gray-100 text-gray-600",
};

const CATEGORIA_LABEL: Record<CategoriaElectrodomestico, string> = {
  refrigeracion: "Refrigeración",
  lavado: "Lavado",
  climatizacion: "Climatización",
  cocina: "Cocina",
  entretenimiento: "Entretenimiento",
  iluminacion: "Iluminación",
  computacion: "Computación",
  otros: "Otros",
};

const ApplianceForm = ({ habitacionId, onSuccess }: ApplianceFormProps) => {
  const [tipos, setTipos] = useState<TipoElectrodomestico[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoElectrodomestico | null>(null);
  const [selectedModelo, setSelectedModelo] = useState<ModeloReferencia | null>(null);
  const [usarCatalogo, setUsarCatalogo] = useState(false);

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
  const horasUso = watch("horas_uso_diarias");

  useEffect(() => {
    fetchTipos();
  }, []);

  const fetchTipos = async () => {
    const { data, error } = await supabase
      .from("tipos_electrodomestico")
      .select("*")
      .eq("activo", true)
      .order("categoria")
      .order("nombre");

    if (error) {
      console.error("Error fetching tipos:", error);
      return;
    }
    setTipos(data || []);
  };

  const handleTipoChange = (tipoId: string) => {
    const tipo = tipos.find((t) => t.id === parseInt(tipoId));
    setSelectedTipo(tipo || null);
    setValue("tipo_id", parseInt(tipoId));
  };

  const handleModeloChange = (modeloId: string) => {
    const modelo = CATALOGO_REFERENCIA.find((m) => m.id === modeloId) ?? null;
    setSelectedModelo(modelo);
    if (modelo) {
      setValue("horas_uso_diarias", modelo.horas_uso_tipicas_dia);
    }
  };

  const consumoMensualEstimado = selectedModelo
    ? calcularConsumoMensual({ ...selectedModelo, horas_uso_tipicas_dia: horasUso ?? selectedModelo.horas_uso_tipicas_dia })
    : null;

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
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al agregar el electrodoméstico";
      toast.error(msg);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const categorias = [...new Set(tipos.map((t) => t.categoria))];
  const categoriasCatalogo = [...new Set(CATALOGO_REFERENCIA.map((m) => m.categoria))];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Toggle: usar catálogo de referencia */}
      <div className="flex items-center space-x-2 pb-2 border-b">
        <Switch
          id="usar_catalogo"
          checked={usarCatalogo}
          onCheckedChange={(checked) => {
            setUsarCatalogo(checked);
            setSelectedModelo(null);
          }}
        />
        <Label htmlFor="usar_catalogo" className="cursor-pointer">
          Usar modelo de referencia (catálogo)
        </Label>
      </div>

      {/* Selector catálogo de referencia */}
      {usarCatalogo && (
        <div>
          <Label>Modelo de referencia</Label>
          <Select onValueChange={handleModeloChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un modelo de referencia" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {categoriasCatalogo.map((cat) => (
                <div key={cat}>
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                    {CATEGORIA_LABEL[cat as CategoriaElectrodomestico] ?? cat}
                  </div>
                  {CATALOGO_REFERENCIA.filter((m) => m.categoria === cat).map((modelo) => (
                    <SelectItem key={modelo.id} value={modelo.id}>
                      <div className="flex items-center gap-2">
                        <span>{modelo.nombre}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1 py-0 ${EFICIENCIA_COLOR[modelo.eficiencia]}`}
                        >
                          {modelo.eficiencia}
                        </Badge>
                        <span className="text-muted-foreground text-xs">{modelo.potencia_watt}W</span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>

          {selectedModelo && (
            <div className="mt-2 p-3 rounded-md bg-muted text-sm space-y-1">
              <p className="text-muted-foreground">{selectedModelo.descripcion}</p>
              {selectedModelo.nota && (
                <p className="text-xs text-muted-foreground italic">{selectedModelo.nota}</p>
              )}
              {consumoMensualEstimado !== null && (
                <p className="font-medium">
                  Consumo estimado: <span className="text-primary">{consumoMensualEstimado.toFixed(1)} kWh/mes</span>
                  {selectedModelo.potencia_standby_watt > 0 && (
                    <span className="text-muted-foreground text-xs ml-1">
                      (incl. {(selectedModelo.potencia_standby_watt * (24 - selectedModelo.horas_uso_tipicas_dia) * 30 / 1000).toFixed(2)} kWh standby)
                    </span>
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tipo de electrodoméstico (DB) */}
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
                  .filter((t) => t.categoria === categoria)
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

      {/* Nombre personalizado */}
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

      {/* Horas de uso */}
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

      {/* Consumo ajustado */}
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

      {/* Activo */}
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
