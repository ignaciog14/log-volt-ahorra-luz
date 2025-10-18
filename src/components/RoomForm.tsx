import { useState } from "react";
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
  tipo: z.enum(["dormitorio", "cocina", "bano", "living", "comedor", "oficina", "patio", "garage", "otro"]),
});

type RoomFormValues = z.infer<typeof roomSchema>;

interface RoomFormProps {
  hogarId: number;
  onSuccess: () => void;
}

const tiposHabitacion = [
  { value: "dormitorio", label: "Dormitorio" },
  { value: "cocina", label: "Cocina" },
  { value: "bano", label: "Baño" },
  { value: "living", label: "Living" },
  { value: "comedor", label: "Comedor" },
  { value: "oficina", label: "Oficina" },
  { value: "patio", label: "Patio" },
  { value: "garage", label: "Garage" },
  { value: "otro", label: "Otro" },
];

const RoomForm = ({ hogarId, onSuccess }: RoomFormProps) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
  });

  const onSubmit = async (data: RoomFormValues) => {
    setLoading(true);
    try {
      const insertData: any = {
        nombre: data.nombre,
        tipo: data.tipo,
        hogar_id: hogarId,
      };
      
      const { error } = await supabase
        .from("habitaciones")
        .insert(insertData);

      if (error) throw error;

      toast.success("Habitación creada exitosamente");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error al crear la habitación");
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
        <Select onValueChange={(value) => setValue("tipo", value as any)}>
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

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creando..." : "Crear Habitación"}
      </Button>
    </form>
  );
};

export default RoomForm;
