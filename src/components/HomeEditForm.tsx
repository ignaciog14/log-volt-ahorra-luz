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

const homeSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(100),
  direccion: z.string().max(255).optional(),
  numero_personas: z.number().int().positive().optional(),
  area_m2: z.number().positive().optional(),
  comuna_id: z.number().int().positive().optional(),
  empresa_electrica_id: z.number().int().positive().optional(),
});

type HomeFormValues = z.infer<typeof homeSchema>;

interface HomeEditFormProps {
  hogarId: number;
  currentData: {
    nombre: string;
    direccion: string | null;
    numero_personas: number | null;
    area_m2: number | null;
    comuna_id: number | null;
    empresa_electrica_id: number | null;
  };
  onSuccess: () => void;
}

interface Comuna {
  id: number;
  nombre: string;
  region: string;
}

interface EmpresaElectrica {
  id: number;
  nombre: string;
  region: string;
}

const HomeEditForm = ({ hogarId, currentData, onSuccess }: HomeEditFormProps) => {
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaElectrica[]>([]);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<HomeFormValues>({
    resolver: zodResolver(homeSchema),
    defaultValues: {
      nombre: currentData.nombre,
      direccion: currentData.direccion || "",
      numero_personas: currentData.numero_personas || undefined,
      area_m2: currentData.area_m2 || undefined,
      comuna_id: currentData.comuna_id || undefined,
      empresa_electrica_id: currentData.empresa_electrica_id || undefined,
    },
  });

  useEffect(() => {
    fetchComunas();
    fetchEmpresas();
  }, []);

  const fetchComunas = async () => {
    const { data, error } = await supabase
      .from("comunas")
      .select("*")
      .order("nombre");

    if (error) {
      console.error("Error fetching comunas:", error);
      return;
    }
    setComunas(data || []);
  };

  const fetchEmpresas = async () => {
    const { data, error } = await supabase
      .from("empresas_electricas")
      .select("*")
      .order("nombre");

    if (error) {
      console.error("Error fetching empresas:", error);
      return;
    }
    setEmpresas(data || []);
  };

  const onSubmit = async (data: HomeFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("hogares")
        .update({
          nombre: data.nombre,
          direccion: data.direccion || null,
          numero_personas: data.numero_personas || null,
          area_m2: data.area_m2 || null,
          comuna_id: data.comuna_id || null,
          empresa_electrica_id: data.empresa_electrica_id || null,
        })
        .eq("id", hogarId);

      if (error) throw error;

      toast.success("Hogar actualizado exitosamente");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar el hogar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="nombre">Nombre del Hogar *</Label>
        <Input
          id="nombre"
          {...register("nombre")}
          placeholder="Ej: Casa Principal"
        />
        {errors.nombre && (
          <p className="text-sm text-destructive mt-1">{errors.nombre.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          {...register("direccion")}
          placeholder="Ej: Av. Principal 123"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="numero_personas">Número de Personas</Label>
          <Input
            id="numero_personas"
            type="number"
            {...register("numero_personas", { valueAsNumber: true })}
            placeholder="Ej: 4"
          />
        </div>

        <div>
          <Label htmlFor="area_m2">Área (m²)</Label>
          <Input
            id="area_m2"
            type="number"
            step="0.01"
            {...register("area_m2", { valueAsNumber: true })}
            placeholder="Ej: 120"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="comuna_id">Comuna</Label>
        <Select
          defaultValue={currentData.comuna_id?.toString()}
          onValueChange={(value) => setValue("comuna_id", parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una comuna" />
          </SelectTrigger>
          <SelectContent>
            {comunas.map((comuna) => (
              <SelectItem key={comuna.id} value={comuna.id.toString()}>
                {comuna.nombre} ({comuna.region})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="empresa_electrica_id">Empresa Eléctrica</Label>
        <Select
          defaultValue={currentData.empresa_electrica_id?.toString()}
          onValueChange={(value) => setValue("empresa_electrica_id", parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una empresa" />
          </SelectTrigger>
          <SelectContent>
            {empresas.map((empresa) => (
              <SelectItem key={empresa.id} value={empresa.id.toString()}>
                {empresa.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  );
};

export default HomeEditForm;
