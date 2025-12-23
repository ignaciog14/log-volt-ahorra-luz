import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, Edit, Power, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ApplianceForm from "@/components/ApplianceForm";
import ApplianceEditForm from "@/components/ApplianceEditForm";
import SmartScannerDialog from "@/components/SmartScannerDialog";

interface Appliance {
  id: number;
  tipo_id: number;
  nombre_personalizado: string | null;
  horas_uso_diarias: number;
  consumo_kwh_ajustado: number | null;
  activo: boolean;
  es_personalizado: boolean;
  tipos_electrodomestico?: {
    nombre: string;
    consumo_kwh_predeterminado: number;
    potencia_watt: number;
  };
}

interface Room {
  id: number;
  nombre: string;
  tipo: string;
  hogar_id: number;
  hogares?: {
    nombre: string;
  };
}

const RoomDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"nombre" | "consumo">("nombre");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState<Appliance | null>(null);

  useEffect(() => {
    if (user && id) {
      fetchRoomAndAppliances();
    }
  }, [user, id]);

  const fetchRoomAndAppliances = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Fetch room details
      const { data: roomData, error: roomError } = await supabase
        .from("habitaciones")
        .select("*, hogares(nombre)")
        .eq("id", parseInt(id))
        .eq("activo", true)
        .maybeSingle();

      if (roomError) throw roomError;
      setRoom(roomData);

      // Fetch appliances
      const { data: appliancesData, error: appliancesError } = await supabase
        .from("electrodomesticos")
        .select("*, tipos_electrodomestico(*)")
        .eq("habitacion_id", parseInt(id))
        .eq("activo", true)
        .order("nombre_personalizado");

      if (appliancesError) throw appliancesError;
      setAppliances(appliancesData || []);
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los datos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (applianceId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("electrodomesticos")
        .update({ activo: !currentStatus })
        .eq("id", applianceId);

      if (error) throw error;

      // Log the change
      await supabase.from("cambios_electrodomestico").insert({
        electrodomestico_id: applianceId,
        usuario_id: user?.id,
        campo_modificado: "activo",
        valor_anterior: currentStatus.toString(),
        valor_nuevo: (!currentStatus).toString(),
      });

      toast.success(currentStatus ? "Electrodoméstico desactivado" : "Electrodoméstico activado");
      fetchRoomAndAppliances();
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado");
      console.error(error);
    }
  };

  const handleDelete = async (applianceId: number) => {
    try {
      // Check if has consumption history
      const { data: historyData } = await supabase
        .from("consumo_diario")
        .select("id")
        .eq("electrodomestico_id", applianceId)
        .limit(1);

      if (historyData && historyData.length > 0) {
        toast.info("Este electrodoméstico tiene historial. Se marcará como inactivo.");
      }

      // Soft delete - mark as inactive
      const { error } = await supabase
        .from("electrodomesticos")
        .update({ activo: false })
        .eq("id", applianceId);

      if (error) throw error;

      toast.success("Electrodoméstico eliminado");
      fetchRoomAndAppliances();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar");
      console.error(error);
    }
  };

  const getApplianceName = (appliance: Appliance) => {
    return appliance.es_personalizado && appliance.nombre_personalizado
      ? appliance.nombre_personalizado
      : appliance.tipos_electrodomestico?.nombre || "Sin nombre";
  };

  const getConsumption = (appliance: Appliance) => {
    return appliance.consumo_kwh_ajustado ?? appliance.tipos_electrodomestico?.consumo_kwh_predeterminado ?? 0;
  };

  const getDailyEstimate = (appliance: Appliance) => {
    const consumption = getConsumption(appliance);
    return (consumption * appliance.horas_uso_diarias).toFixed(2);
  };

  const sortedAppliances = [...appliances].sort((a, b) => {
    if (sortBy === "nombre") {
      return getApplianceName(a).localeCompare(getApplianceName(b));
    } else {
      return getConsumption(b) - getConsumption(a);
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Habitación no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/homes/${room.hogar_id}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{room.nombre}</h1>
              <p className="text-muted-foreground">
                <Link to={`/homes/${room.hogar_id}`} className="hover:underline">
                  {room.hogares?.nombre}
                </Link> • {room.tipo}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <SmartScannerDialog
              habitacionId={room.id}
              habitacionNombre={room.nombre}
              onSuccess={fetchRoomAndAppliances}
            />
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Manual
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Agregar Electrodoméstico</DialogTitle>
                  <DialogDescription>
                    Agrega un nuevo electrodoméstico a {room.nombre}
                  </DialogDescription>
                </DialogHeader>
                <ApplianceForm
                  habitacionId={room.id}
                  onSuccess={() => {
                    setShowAddDialog(false);
                    fetchRoomAndAppliances();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Label htmlFor="sort">Ordenar por:</Label>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nombre">Nombre</SelectItem>
              <SelectItem value="consumo">Consumo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {sortedAppliances.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No hay electrodomésticos en esta habitación</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                <SmartScannerDialog
                  habitacionId={room.id}
                  habitacionNombre={room.nombre}
                  onSuccess={fetchRoomAndAppliances}
                />
                <Button variant="outline" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Manual
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedAppliances.map((appliance) => (
              <Card key={appliance.id} className={!appliance.activo ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{getApplianceName(appliance)}</CardTitle>
                      <CardDescription>
                        {appliance.tipos_electrodomestico?.potencia_watt}W
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={appliance.activo}
                          onCheckedChange={() => handleToggleActive(appliance.id, appliance.activo)}
                        />
                        <Power className={`h-4 w-4 ${appliance.activo ? "text-green-500" : "text-muted-foreground"}`} />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Consumo</p>
                    <p className="text-2xl font-bold">
                      {getConsumption(appliance).toFixed(2)} kWh
                      {appliance.consumo_kwh_ajustado && (
                        <span className="text-sm text-muted-foreground ml-2">(ajustado)</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horas de uso diarias</p>
                    <p className="text-lg font-semibold">{appliance.horas_uso_diarias}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Consumo estimado diario</p>
                    <p className="text-lg font-semibold">{getDailyEstimate(appliance)} kWh</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingAppliance(appliance)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Editar Electrodoméstico</DialogTitle>
                          <DialogDescription>
                            Modifica los datos de {getApplianceName(appliance)}
                          </DialogDescription>
                        </DialogHeader>
                        {editingAppliance && (
                          <ApplianceEditForm
                            appliance={editingAppliance}
                            onSuccess={() => {
                              setEditingAppliance(null);
                              fetchRoomAndAppliances();
                            }}
                            onCancel={() => setEditingAppliance(null)}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar electrodoméstico?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Se marcará como inactivo y no se incluirá en los cálculos de consumo.
                            Si tiene historial de consumo, este se conservará.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(appliance.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomDetails;
