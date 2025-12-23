import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Camera, FileText, Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ScanResultConfirmation from "./ScanResultConfirmation";

interface SmartScannerDialogProps {
  habitacionId: number;
  habitacionNombre: string;
  onSuccess: () => void;
}

interface ScanResult {
  nombre: string;
  tipo_sugerido: string;
  categoria: string;
  consumo_watts_estimado: number;
  consumo_kwh_predeterminado: number;
  confianza: "alta" | "media" | "baja";
  descripcion_detectada: string;
}

const SmartScannerDialog = ({ habitacionId, habitacionNombre, onSuccess }: SmartScannerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"photo" | "text">("photo");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor selecciona una imagen");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede exceder 5MB");
      return;
    }

    // Create preview and base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (activeTab === "photo" && !imageBase64) {
      toast.error("Por favor sube una foto primero");
      return;
    }

    if (activeTab === "text" && !description.trim()) {
      toast.error("Por favor escribe una descripción");
      return;
    }

    if (activeTab === "text" && description.length > 500) {
      toast.error("La descripción no puede exceder 500 caracteres");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const response = await supabase.functions.invoke('analyze-appliance', {
        body: activeTab === "photo" 
          ? { type: 'photo', imageBase64 }
          : { type: 'text', description: description.trim() }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al analizar');
      }

      const result = response.data;

      if (result.error) {
        toast.error(result.error);
        if (result.sugerencia) {
          toast.info(result.sugerencia);
        }
        return;
      }

      setScanResult(result);
      setShowConfirmation(true);

    } catch (error: any) {
      console.error('Error analyzing appliance:', error);
      toast.error(error.message || "Error al analizar el electrodoméstico");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    setScanResult(null);
  };

  const handleSaveSuccess = () => {
    setShowConfirmation(false);
    setScanResult(null);
    setImagePreview(null);
    setImageBase64(null);
    setDescription("");
    setOpen(false);
    onSuccess();
  };

  const resetForm = () => {
    setImagePreview(null);
    setImageBase64(null);
    setDescription("");
    setScanResult(null);
    setShowConfirmation(false);
    setActiveTab("photo");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}>
        <DialogTrigger asChild>
          <Button variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600">
            <Sparkles className="h-4 w-4 mr-2" />
            Escaneo Inteligente
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Escáner Inteligente de Electrodomésticos
            </DialogTitle>
            <DialogDescription>
              Sube una foto o describe el electrodoméstico y la IA lo detectará automáticamente
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "photo" | "text")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="photo" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Subir Foto
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Describir
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photo" className="space-y-4">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Vista previa" 
                    className="w-full h-48 object-contain rounded-lg border bg-muted"
                  />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleClearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Haz clic para subir una foto
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG • Máx 5MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Describe tu electrodoméstico</Label>
                <Textarea
                  id="description"
                  placeholder="Ej: Samsung Smart TV 55 pulgadas 4K, Refrigerador LG No Frost 400 litros..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {description.length}/500 caracteres
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <Button 
            onClick={handleAnalyze} 
            disabled={loading || (activeTab === "photo" ? !imageBase64 : !description.trim())}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analizar con IA
              </>
            )}
          </Button>
        </DialogContent>
      </Dialog>

      {scanResult && showConfirmation && (
        <ScanResultConfirmation
          open={showConfirmation}
          onOpenChange={handleConfirmationClose}
          result={scanResult}
          imagePreview={activeTab === "photo" ? imagePreview : null}
          habitacionId={habitacionId}
          habitacionNombre={habitacionNombre}
          onSuccess={handleSaveSuccess}
        />
      )}
    </>
  );
};

export default SmartScannerDialog;
