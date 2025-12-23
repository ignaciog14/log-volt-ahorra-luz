import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle, AlertTriangle, XCircle, Plus, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ScanResult {
  nombre: string;
  tipo_sugerido: string;
  categoria: string;
  consumo_watts_estimado: number;
  consumo_kwh_predeterminado: number;
  confianza: "alta" | "media" | "baja";
  descripcion_detectada: string;
}

interface ScanResultConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ScanResult;
  imagePreview: string | null;
  habitacionId: number;
  habitacionNombre: string;
  onSuccess: () => void;
}

const ScanResultConfirmation = ({
  open,
  onOpenChange,
  result,
  imagePreview,
  habitacionId,
  habitacionNombre,
  onSuccess
}: ScanResultConfirmationProps) => {
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedName, setSavedName] = useState("");
  
  // Editable fields
  const [nombre, setNombre] = useState(result.nombre);
  const [tipoSugerido, setTipoSugerido] = useState(result.tipo_sugerido);
  const [categoria, setCategoria] = useState(result.categoria);
  const [consumoWatts, setConsumoWatts] = useState(result.consumo_watts_estimado.toString());
  const [horasUso, setHorasUso] = useState("5");

  const getConfianzaConfig = (confianza: string) => {
    switch (confianza) {
      case "alta":
        return { 
          icon: CheckCircle, 
          color: "bg-green-500/10 text-green-500 border-green-500/20",
          label: "Alta ⭐⭐⭐",
          message: "La IA está muy segura de la detección"
        };
      case "media":
        return { 
          icon: AlertTriangle, 
          color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
          label: "Media ⭐⭐",
          message: "La IA tiene confianza moderada. Revisa los datos"
        };
      default:
        return { 
          icon: XCircle, 
          color: "bg-red-500/10 text-red-500 border-red-500/20",
          label: "Baja ⭐",
          message: "La IA no está segura. Por favor verifica los datos"
        };
    }
  };

  const confianzaConfig = getConfianzaConfig(result.confianza);
  const ConfianzaIcon = confianzaConfig.icon;

  const calculateKwh = () => {
    const watts = parseFloat(consumoWatts) || 0;
    const hours = parseFloat(horasUso) || 5;
    return ((watts / 1000) * hours).toFixed(2);
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    const watts = parseFloat(consumoWatts);
    if (isNaN(watts) || watts <= 0) {
      toast.error("Ingresa un consumo válido en watts");
      return;
    }

    const hours = parseFloat(horasUso);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      toast.error("Las horas de uso deben estar entre 0 y 24");
      return;
    }

    setSaving(true);

    try {
      const consumoKwh = (watts / 1000) * hours;

      const { error } = await supabase
        .from("electrodomesticos")
        .insert({
          habitacion_id: habitacionId,
          tipo_id: null, // Custom appliance, not linked to predefined type
          nombre_personalizado: nombre.trim(),
          consumo_kwh_ajustado: consumoKwh,
          horas_uso_diarias: hours,
          es_personalizado: true,
          activo: true
        });

      if (error) throw error;

      setSavedName(nombre);
      setShowSuccess(true);
      toast.success("¡Electrodoméstico agregado exitosamente!");

    } catch (error: any) {
      console.error('Error saving appliance:', error);
      toast.error(error.message || "Error al guardar el electrodoméstico");
    } finally {
      setSaving(false);
    }
  };

  const handleAddAnother = () => {
    setShowSuccess(false);
    onOpenChange(false);
    // Trigger the scanner again via parent
    setTimeout(() => {
      onSuccess();
    }, 100);
  };

  const handleViewDashboard = () => {
    setShowSuccess(false);
    onSuccess();
  };

  const handleClose = () => {
    setShowSuccess(false);
    onSuccess();
  };

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold">¡Electrodoméstico agregado!</h2>
            <p className="text-muted-foreground">
              <strong>{savedName}</strong> ha sido añadido a la habitación <strong>{habitacionNombre}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Consumo estimado: <strong>{calculateKwh()} kWh/día</strong>
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button variant="outline" onClick={handleAddAnother} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Agregar otro
              </Button>
              <Button onClick={handleViewDashboard} className="flex-1">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Ver habitación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Detectamos tu electrodoméstico
          </DialogTitle>
          <DialogDescription>
            Revisa y ajusta la información antes de guardar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image preview */}
          {imagePreview && (
            <div className="w-full h-32 overflow-hidden rounded-lg border">
              <img 
                src={imagePreview} 
                alt="Electrodoméstico" 
                className="w-full h-full object-contain bg-muted"
              />
            </div>
          )}

          {/* Confidence badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={confianzaConfig.color}>
              <ConfianzaIcon className="h-3 w-3 mr-1" />
              Confianza: {confianzaConfig.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{confianzaConfig.message}</p>

          {/* Detected description */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Detectado:</strong> {result.descripcion_detectada}
            </p>
          </div>

          {/* Editable fields */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del electrodoméstico"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo Sugerido</Label>
              <Input
                id="tipo"
                value={tipoSugerido}
                onChange={(e) => setTipoSugerido(e.target.value)}
                placeholder="Tipo de electrodoméstico"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="categoria">Categoría</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Línea Blanca">Línea Blanca</SelectItem>
                  <SelectItem value="Entretenimiento">Entretenimiento</SelectItem>
                  <SelectItem value="Climatización">Climatización</SelectItem>
                  <SelectItem value="Iluminación">Iluminación</SelectItem>
                  <SelectItem value="Computación">Computación</SelectItem>
                  <SelectItem value="Cocina">Cocina</SelectItem>
                  <SelectItem value="Otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="watts">Consumo (Watts)</Label>
                <Input
                  id="watts"
                  type="number"
                  min="1"
                  max="5000"
                  value={consumoWatts}
                  onChange={(e) => setConsumoWatts(e.target.value)}
                  placeholder="Watts"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="horas">Horas uso/día</Label>
                <Input
                  id="horas"
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={horasUso}
                  onChange={(e) => setHorasUso(e.target.value)}
                  placeholder="Horas"
                />
              </div>
            </div>

            <div className="p-3 bg-primary/5 rounded-lg">
              <p className="text-sm">
                <strong>Consumo estimado diario:</strong> {calculateKwh()} kWh/día
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Habitación</Label>
              <Input
                value={habitacionNombre}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Agregar Electrodoméstico
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScanResultConfirmation;
