import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const roomSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(100),
  tipo: z.enum(["dormitorio", "cocina", "bano", "living", "comedor", "estudio", "patio", "garage", "lavanderia", "otro"]),
  orden: z.number().int().min(0).default(0),
});

type RoomFormValues = z.infer<typeof roomSchema>;

interface RoomEditFormProps {
  habitacionId: number;
  currentData: {
    nombre: string;
    tipo: string;
    orden?: number;
  };
  onSuccess: () => void;
}

const tiposHabitacion = [
  { value: "dormitorio", label: "Dormitorio" },
  { value: "cocina", label: "Cocina" },
  { value: "bano", label: "Baño" },
  { value: "living", label: "Living" },
  { value: "comedor", label: "Comedor" },
  { value: "estudio", label: "Estudio" },
  { value: "patio", label: "Patio" },
  { value: "garage", label: "Garage" },
  { value: "lavanderia", label: "Lavandería" },
  { value: "otro", label: "Otro" },
];

const RoomEditForm = ({ habitacionId, currentData, onSuccess }: RoomEditFormProps) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      nombre: currentData.nombre,
      tipo: currentData.tipo as any,
      orden: currentData.orden || 0,
    },
  });

  useEffect(() => {
    setValue("tipo", currentData.tipo as any);
  }, [currentData, setValue]);

  const onSubmit = async (data: RoomFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("habitaciones")
        .update({
          nombre: data.nombre,
          tipo: data.tipo,
          orden: data.orden,
        })
        .eq("id", habitacionId);

      if (error) {
        if (error.code === '23505') {
          toast.error("Ya existe una habitación con ese nombre en este hogar");
        } else {
          toast.error(error.message || "Error al actualizar la habitación");
        }
        throw error;
      }

      toast.success("Habitación actualizada exitosamente");
      onSuccess();
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="nombre">Nombre de la Habitación *</Label>
        <Input
          id="nombre"
          {...register("nombre")}
          placeholder="Ej: Dormitorio Principal"
        />
        {errors.nombre && (
          <p className="text-sm text-destructive mt-1">{errors.nombre.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="tipo">Tipo de Habitación *</Label>
        <Select 
          onValueChange={(value) => setValue("tipo", value as any)}
          defaultValue={currentData.tipo}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un tipo" />
          </SelectTrigger>
          <SelectContent>
            {tiposHabitacion.map((tipo) => (
              <SelectItem key={tipo.value} value={tipo.value}>
                {tipo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.tipo && (
          <p className="text-sm text-destructive mt-1">{errors.tipo.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="orden">Orden de visualización</Label>
        <Input
          id="orden"
          type="number"
          {...register("orden", { valueAsNumber: true })}
          placeholder="0"
        />
        {errors.orden && (
          <p className="text-sm text-destructive mt-1">{errors.orden.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  );
};

export default RoomEditForm;
