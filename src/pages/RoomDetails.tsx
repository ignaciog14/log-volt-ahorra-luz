import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppliances } from "@/hooks/useAppliances";
import type { Appliance } from "@/hooks/useAppliances";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, Edit, Power } from "lucide-react";
import { toast } from "sonner";
import ApplianceForm from "@/components/ApplianceForm";
import ApplianceEditForm from "@/components/ApplianceEditForm";

const RoomDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { room, appliances, loading, fetchRoomAndAppliances } = useAppliances(id);
  const [sortBy, setSortBy] = useState<"nombre" | "consumo">("nombre");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState<Appliance | null>(null);

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  const getApplianceName = (appliance: Appliance) =>
    appliance.es_personalizado && appliance.nombre_personalizado
      ? appliance.nombre_personalizado
      : appliance.tipos_electrodomestico?.nombre || "Sin nombre";

  const getConsumption = (appliance: Appliance) =>
    appliance.consumo_kwh_ajustado ?? appliance.tipos_electrodomestico?.consumo_kwh_predeterminado ?? 0;

  const getDailyEstimate = (appliance: Appliance) =>
    (getConsumption(appliance) * appliance.horas_uso_diarias).toFixed(2);

  const handleToggleActive = async (applianceId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("electrodomesticos")
        .update({ activo: !currentStatus })
        .eq("id", applianceId);
      if (error) throw error;

      await supabase.from("cambios_electrodomestico").insert({
        electrodomestico_id: applianceId,
        usuario_id: user?.id,
        campo_modificado: "activo",
        valor_anterior: currentStatus.toString(),
        valor_nuevo: (!currentStatus).toString(),
      });

      toast.success(currentStatus ? "Electrodoméstico desactivado" : "Electrodoméstico activado");
      fetchRoomAndAppliances();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al cambiar el estado";
      toast.error(message);
      console.error(error);
    }
  };

  const handleDelete = async (applianceId: number) => {
    try {
      const { data: historyData } = await supabase
        .from("consumo_diario")
        .select("id")
        .eq("electrodomestico_id", applianceId)
        .limit(1);

      if (historyData && historyData.length > 0) {
        toast.info("Este electrodoméstico tiene historial. Se marcará como inactivo.");
      }

      const { error } = await supabase
        .from("electrodomesticos")
        .update({ activo: false })
        .eq("id", applianceId);
      if (error) throw error;

      toast.success("Electrodoméstico eliminado");
      fetchRoomAndAppliances();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al eliminar";
      toast.error(message);
      console.error(error);
    }
  };

  const sortedAppliances = [...appliances].sort((a, b) =>
    sortBy === "nombre"
      ? getApplianceName(a).localeCompare(getApplianceName(b))
      : getConsumption(b) - getConsumption(a)
  );

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
                </Link>{" "}
                • {room.tipo}
              </p>
            </div>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Electrodoméstico
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Electrodoméstico</DialogTitle>
                <DialogDescription>Agrega un nuevo electrodoméstico a {room.nombre}</DialogDescription>
              </DialogHeader>
              <ApplianceForm
                habitacionId={room.id}
                onSuccess={() => { setShowAddDialog(false); fetchRoomAndAppliances(); }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4">
          <Label htmlFor="sort">Ordenar por:</Label>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as "nombre" | "consumo")}>
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
              <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primer Electrodoméstico
              </Button>
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
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={appliance.activo}
                        onCheckedChange={() => handleToggleActive(appliance.id, appliance.activo)}
                      />
                      <Power className={`h-4 w-4 ${appliance.activo ? "text-green-500" : "text-muted-foreground"}`} />
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setEditingAppliance(appliance)}
                        >
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
                            onSuccess={() => { setEditingAppliance(null); fetchRoomAndAppliances(); }}
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
