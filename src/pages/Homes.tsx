import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Home, Plus, MapPin, Users, Square, LayoutDashboard, LogOut } from "lucide-react";
import { toast } from "sonner";
import HomeForm from "@/components/HomeForm";
import logo from "@/assets/logo.png";

interface Hogar {
  id: number;
  nombre: string;
  direccion: string | null;
  numero_personas: number | null;
  area_m2: number | null;
  comuna_id: number | null;
  comunas?: { nombre: string };
}

const Homes = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [loadingHogares, setLoadingHogares] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchHogares();
    }
  }, [user]);

  const fetchHogares = async () => {
    try {
      const { data, error } = await supabase
        .from("hogares")
        .select(`
          *,
          comunas (
            nombre
          )
        `)
        .order("fecha_creacion", { ascending: false });

      if (error) throw error;
      setHogares(data || []);
    } catch (error: any) {
      toast.error("Error al cargar los hogares");
      console.error(error);
    } finally {
      setLoadingHogares(false);
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    fetchHogares();
  };

  if (loading || loadingHogares) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="LogVolt" className="h-8 w-auto" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate("/profile")}>
              <Users className="w-4 h-4 mr-2" />
              Mi Perfil
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mis Hogares</h1>
            <p className="text-muted-foreground mt-2">Gestiona tus hogares y su consumo eléctrico</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Hogar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Hogar</DialogTitle>
              </DialogHeader>
              <HomeForm onSuccess={handleSuccess} />
            </DialogContent>
          </Dialog>
        </div>

        {hogares.length === 0 ? (
          <Card className="p-12 text-center">
            <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tienes hogares registrados</h3>
            <p className="text-muted-foreground mb-6">Crea tu primer hogar para comenzar a monitorear tu consumo eléctrico</p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primer Hogar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Hogar</DialogTitle>
                </DialogHeader>
                <HomeForm onSuccess={handleSuccess} />
              </DialogContent>
            </Dialog>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hogares.map((hogar) => (
              <Card
                key={hogar.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/homes/${hogar.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    {hogar.nombre}
                  </CardTitle>
                  {hogar.direccion && (
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {hogar.direccion}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {hogar.comunas && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{hogar.comunas.nombre}</span>
                      </div>
                    )}
                    {hogar.numero_personas && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{hogar.numero_personas} personas</span>
                      </div>
                    )}
                    {hogar.area_m2 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Square className="h-4 w-4" />
                        <span>{hogar.area_m2} m²</span>
                      </div>
                    )}
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

export default Homes;
