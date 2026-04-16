import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useHogares } from "@/hooks/useHogares";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Home, Plus, MapPin, Users, Square } from "lucide-react";
import HomeForm from "@/components/HomeForm";
import Navbar from "@/components/shared/Navbar";

const Homes = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { hogares, loading: hogaresLoading, fetchHogares } = useHogares(user?.id);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (loading || hogaresLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleSuccess = () => {
    setDialogOpen(false);
    fetchHogares();
  };

  const NewHomeDialog = () => (
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
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar activePage="homes" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mis Hogares</h1>
            <p className="text-muted-foreground mt-2">
              Gestiona tus hogares y su consumo eléctrico
            </p>
          </div>
          <NewHomeDialog />
        </div>

        {hogares.length === 0 ? (
          <Card className="p-12 text-center">
            <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tienes hogares registrados</h3>
            <p className="text-muted-foreground mb-6">
              Crea tu primer hogar para comenzar a monitorear tu consumo eléctrico
            </p>
            <NewHomeDialog />
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
