import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, Edit, Home, Utensils, Bath, Sofa, UtensilsCrossed, Briefcase, Trees, Car, MoreHorizontal, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import RoomForm from "@/components/RoomForm";
import RoomEditForm from "@/components/RoomEditForm";
import ApplianceForm from "@/components/ApplianceForm";
import HomeEditForm from "@/components/HomeEditForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Habitacion {
  id: number;
  nombre: string;
  tipo: string;
  orden?: number;
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
  const [editRoomDialogOpen, setEditRoomDialogOpen] = useState(false);
  const [deleteRoomDialogOpen, setDeleteRoomDialogOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Habitacion | null>(null);
  const [sortBy, setSortBy] = useState<"orden" | "nombre" | "tipo">("orden");

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

  const getRoomIcon = (tipo: string) => {
    const icons: { [key: string]: any } = {
      dormitorio: Home,
      cocina: Utensils,
      bano: Bath,
      living: Sofa,
      comedor: UtensilsCrossed,
      estudio: Briefcase,
      patio: Trees,
      garage: Car,
      lavanderia: MoreHorizontal,
      otro: MoreHorizontal,
    };
    return icons[tipo] || MoreHorizontal;
  };

  const getSortedRooms = () => {
    const sorted = [...habitaciones];
    switch (sortBy) {
      case "nombre":
        return sorted.sort((a, b) => a.nombre.localeCompare(b.nombre));
      case "tipo":
        return sorted.sort((a, b) => a.tipo.localeCompare(b.tipo));
      case "orden":
      default:
        return sorted.sort((a, b) => (a.orden || 0) - (b.orden || 0));
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    try {
      // First delete all appliances in the room
      const { error: appliancesError } = await supabase
        .from("electrodomesticos")
        .delete()
        .eq("habitacion_id", roomId);

      if (appliancesError) throw appliancesError;

      // Then soft delete the room
      const { error: roomError } = await supabase
        .from("habitaciones")
        .update({ activo: false })
        .eq("id", roomId);

      if (roomError) throw roomError;
      
      toast.success("Habitación eliminada");
      setDeleteRoomDialogOpen(false);
      setSelectedRoom(null);
      fetchData();
    } catch (error: any) {
      toast.error("Error al eliminar la habitación");
      console.error(error);
    }
  };

  const openDeleteRoomDialog = (room: Habitacion) => {
    setSelectedRoom(room);
    setDeleteRoomDialogOpen(true);
  };

  const openEditRoomDialog = (room: Habitacion) => {
    setSelectedRoom(room);
    setEditRoomDialogOpen(true);
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

  const handleRoomEditSuccess = () => {
    setEditRoomDialogOpen(false);
    setSelectedRoom(null);
    fetchData();
  };

  const handleDeleteHome = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from("hogares")
        .delete()
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
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="sortBy">Ordenar por:</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger id="sortBy" className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orden">Orden</SelectItem>
                    <SelectItem value="nombre">Nombre</SelectItem>
                    <SelectItem value="tipo">Tipo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getSortedRooms().map((habitacion) => {
                const IconComponent = getRoomIcon(habitacion.tipo);
                const applianceCount = habitacion.electrodomesticos?.length || 0;
                
                return (
                  <Card key={habitacion.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <IconComponent className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{habitacion.nombre}</CardTitle>
                            <CardDescription className="capitalize">{habitacion.tipo}</CardDescription>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                        <span className="px-2 py-1 rounded-md bg-muted">
                          {applianceCount} {applianceCount === 1 ? 'electrodoméstico' : 'electrodomésticos'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => navigate(`/rooms/${habitacion.id}`)}
                          className="flex-1"
                        >
                          Ver Electrodomésticos
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openApplianceDialog(habitacion.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditRoomDialog(habitacion)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDeleteRoomDialog(habitacion)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      {habitacion.electrodomesticos && habitacion.electrodomesticos.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium">Electrodomésticos:</p>
                          {habitacion.electrodomesticos.map((electro) => (
                            <div
                              key={electro.id}
                              className="flex justify-between items-center p-2 rounded-lg bg-muted text-sm"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {electro.nombre_personalizado || electro.tipos_electrodomestico?.nombre}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {electro.horas_uso_diarias}h/día
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteAppliance(electro.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
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

        <Dialog open={editRoomDialogOpen} onOpenChange={setEditRoomDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Habitación</DialogTitle>
            </DialogHeader>
            {selectedRoom && (
              <RoomEditForm
                habitacionId={selectedRoom.id}
                currentData={{
                  nombre: selectedRoom.nombre,
                  tipo: selectedRoom.tipo,
                  orden: selectedRoom.orden,
                }}
                onSuccess={handleRoomEditSuccess}
              />
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteRoomDialogOpen} onOpenChange={setDeleteRoomDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar habitación?</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedRoom && (
                  <>
                    Se eliminará la habitación "{selectedRoom.nombre}".
                    {selectedRoom.electrodomesticos && selectedRoom.electrodomesticos.length > 0 && (
                      <span className="block mt-2 font-semibold text-destructive">
                        ⚠️ Esta habitación contiene {selectedRoom.electrodomesticos.length} electrodoméstico(s) que también serán eliminados.
                      </span>
                    )}
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedRoom && handleDeleteRoom(selectedRoom.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
