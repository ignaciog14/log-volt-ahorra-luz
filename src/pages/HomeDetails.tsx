import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import RoomForm from "@/components/RoomForm";
import ApplianceForm from "@/components/ApplianceForm";
import HomeEditForm from "@/components/HomeEditForm";

interface Habitacion {
  id: number;
  nombre: string;
  tipo: string;
  electrodomesticos: Electrodomestico[];
}

interface Electrodomestico {
  id: number;
  nombre_personalizado: string | null;
  horas_uso_diarias: number;
  activo: boolean;
  tipos_electrodomestico?: {
    nombre: string;
    categoria: string;
  };
}

interface Hogar {
  id: number;
  nombre: string;
  direccion: string | null;
  numero_personas: number | null;
  area_m2: number | null;
  comuna_id: number | null;
  empresa_electrica_id: number | null;
}

const HomeDetails = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [hogar, setHogar] = useState<Hogar | null>(null);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [applianceDialogOpen, setApplianceDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchData();
    }
  }, [user, id]);

  const fetchData = async () => {
    if (!id) return;
    const hogarIdNum = parseInt(id);
    
    try {
      const { data: hogarData, error: hogarError } = await supabase
        .from("hogares")
        .select("*")
        .eq("id", hogarIdNum)
        .single();

      if (hogarError) throw hogarError;
      setHogar(hogarData);

      const { data: habitacionesData, error: habitacionesError } = await supabase
        .from("habitaciones")
        .select(`
          *,
          electrodomesticos (
            *,
            tipos_electrodomestico (
              nombre,
              categoria
            )
          )
        `)
        .eq("hogar_id", hogarIdNum)
        .order("nombre");

      if (habitacionesError) throw habitacionesError;
      setHabitaciones(habitacionesData || []);
    } catch (error: any) {
      toast.error("Error al cargar los datos");
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm("¿Estás seguro de eliminar esta habitación? Se eliminarán todos sus electrodomésticos.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("habitaciones")
        .delete()
        .eq("id", roomId);

      if (error) throw error;
      toast.success("Habitación eliminada");
      fetchData();
    } catch (error: any) {
      toast.error("Error al eliminar la habitación");
      console.error(error);
    }
  };

  const handleDeleteAppliance = async (applianceId: number) => {
    if (!confirm("¿Estás seguro de eliminar este electrodoméstico?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("electrodomesticos")
        .delete()
        .eq("id", applianceId);

      if (error) throw error;
      toast.success("Electrodoméstico eliminado");
      fetchData();
    } catch (error: any) {
      toast.error("Error al eliminar el electrodoméstico");
      console.error(error);
    }
  };

  const handleRoomSuccess = () => {
    setRoomDialogOpen(false);
    fetchData();
  };

  const handleApplianceSuccess = () => {
    setApplianceDialogOpen(false);
    setSelectedRoomId(null);
    fetchData();
  };

  const openApplianceDialog = (roomId: number) => {
    setSelectedRoomId(roomId);
    setApplianceDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    fetchData();
  };

  const handleDeleteHome = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from("hogares")
        .update({ activo: false })
        .eq("id", parseInt(id));

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      toast.success("Hogar eliminado exitosamente");
      navigate("/homes");
    } catch (error: any) {
      console.error("Delete home error:", error);
      toast.error("Error al eliminar el hogar: " + (error.message || "Error desconocido"));
    }
  };

  const hasHistoricalData = habitaciones.length > 0;

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!hogar || !id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Hogar no encontrado</p>
      </div>
    );
  }

  const hogarIdNum = parseInt(id);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/homes")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Hogares
          </Button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{hogar.nombre}</h1>
              {hogar.direccion && (
                <p className="text-muted-foreground mt-2">{hogar.direccion}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Hogar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Editar Hogar</DialogTitle>
                  </DialogHeader>
                  <HomeEditForm 
                    hogarId={hogarIdNum} 
                    currentData={hogar}
                    onSuccess={handleEditSuccess} 
                  />
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="destructive" 
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Hogar
              </Button>

              <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Habitación
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nueva Habitación</DialogTitle>
                  </DialogHeader>
                  <RoomForm hogarId={hogarIdNum} onSuccess={handleRoomSuccess} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {habitaciones.length === 0 ? (
          <Card className="p-12 text-center">
            <h3 className="text-xl font-semibold mb-2">No hay habitaciones registradas</h3>
            <p className="text-muted-foreground mb-6">Crea tu primera habitación para comenzar a agregar electrodomésticos</p>
            <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Habitación
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Habitación</DialogTitle>
                </DialogHeader>
                <RoomForm hogarId={hogarIdNum} onSuccess={handleRoomSuccess} />
              </DialogContent>
            </Dialog>
          </Card>
        ) : (
          <div className="space-y-6">
            {habitaciones.map((habitacion) => (
              <Card key={habitacion.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{habitacion.nombre}</CardTitle>
                      <CardDescription className="capitalize">{habitacion.tipo}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => openApplianceDialog(habitacion.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Electrodoméstico
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteRoom(habitacion.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {habitacion.electrodomesticos && habitacion.electrodomesticos.length > 0 ? (
                    <div className="space-y-2">
                      {habitacion.electrodomesticos.map((electro) => (
                        <div
                          key={electro.id}
                          className="flex justify-between items-center p-3 rounded-lg bg-muted"
                        >
                          <div>
                            <p className="font-medium">
                              {electro.nombre_personalizado || electro.tipos_electrodomestico?.nombre}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {electro.horas_uso_diarias}h/día • {electro.tipos_electrodomestico?.categoria}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${electro.activo ? 'bg-success text-success-foreground' : 'bg-muted-foreground text-background'}`}>
                              {electro.activo ? 'Activo' : 'Inactivo'}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteAppliance(electro.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No hay electrodomésticos en esta habitación
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={applianceDialogOpen} onOpenChange={setApplianceDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Electrodoméstico</DialogTitle>
            </DialogHeader>
            {selectedRoomId && (
              <ApplianceForm habitacionId={selectedRoomId} onSuccess={handleApplianceSuccess} />
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará el hogar "{hogar.nombre}".
                {hasHistoricalData && (
                  <span className="block mt-2 font-semibold text-destructive">
                    ⚠️ Este hogar contiene {habitaciones.length} habitación(es) con electrodomésticos y datos históricos que también se perderán.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteHome} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default HomeDetails;
