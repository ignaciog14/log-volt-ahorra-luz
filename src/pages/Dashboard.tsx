import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Plus, TrendingUp, Zap, AlertCircle, LogOut, LayoutDashboard, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import ConsumptionBarChart from "@/components/ConsumptionBarChart";
import ConsumptionPieChart from "@/components/ConsumptionPieChart";
import ConsumptionLineChart from "@/components/ConsumptionLineChart";

interface Hogar {
  id: number;
  nombre: string;
}

interface TopAppliance {
  name: string;
  consumption: number;
  percentage: number;
  room: string;
}

interface RoomConsumption {
  name: string;
  value: number;
  percentage: number;
}

interface DailyConsumption {
  date: string;
  consumo: number;
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [selectedHogar, setSelectedHogar] = useState<number | null>(null);
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [topAppliances, setTopAppliances] = useState<TopAppliance[]>([]);
  const [roomConsumption, setRoomConsumption] = useState<RoomConsumption[]>([]);
  const [dailyConsumption, setDailyConsumption] = useState<DailyConsumption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

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

  useEffect(() => {
    if (selectedHogar) {
      fetchDashboardData();
    }
  }, [selectedHogar]);

  const fetchHogares = async () => {
    try {
      const { data, error } = await supabase
        .from("hogares")
        .select("id, nombre")
        .order("fecha_creacion", { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setHogares(data);
        setSelectedHogar(data[0].id);
      } else {
        setLoadingData(false);
      }
    } catch (error: any) {
      toast.error("Error al cargar los hogares");
      console.error(error);
      setLoadingData(false);
    }
  };

  const fetchDashboardData = async () => {
    if (!selectedHogar) return;

    try {
      setLoadingData(true);

      // Fetch consumption data
      const { data: consumoData, error: consumoError } = await supabase.rpc(
        'calcular_consumo_hogar',
        { hogar_id_param: selectedHogar }
      );

      if (consumoError) throw consumoError;
      setTotalConsumption(consumoData || 0);

      // Fetch top appliances
      const { data: appliancesData, error: appliancesError } = await supabase
        .from("electrodomesticos")
        .select(`
          id,
          nombre_personalizado,
          horas_uso_diarias,
          consumo_kwh_ajustado,
          tipos_electrodomestico (
            nombre,
            consumo_kwh_predeterminado
          ),
          habitaciones (
            nombre
          )
        `)
        .eq("habitaciones.hogar_id", selectedHogar)
        .eq("activo", true)
        .limit(4);

      if (appliancesError) throw appliancesError;

      if (appliancesData) {
        const total = consumoData || 1;
        const appliances: TopAppliance[] = appliancesData
          .map((e: any) => {
            const consumo = (e.consumo_kwh_ajustado || e.tipos_electrodomestico?.consumo_kwh_predeterminado || 0) * e.horas_uso_diarias * 30;
            return {
              name: e.nombre_personalizado || e.tipos_electrodomestico?.nombre || "Sin nombre",
              consumption: Math.round(consumo),
              percentage: Math.round((consumo / total) * 100),
              room: e.habitaciones?.nombre || "Sin habitación"
            };
          })
          .sort((a: TopAppliance, b: TopAppliance) => b.consumption - a.consumption)
          .slice(0, 4);

        setTopAppliances(appliances);
      }

      // Fetch consumption by room
      const { data: roomsData, error: roomsError } = await supabase
        .from("habitaciones")
        .select(`
          nombre,
          electrodomesticos (
            horas_uso_diarias,
            consumo_kwh_ajustado,
            tipos_electrodomestico (
              consumo_kwh_predeterminado
            )
          )
        `)
        .eq("hogar_id", selectedHogar);

      if (roomsError) throw roomsError;

      if (roomsData) {
        const roomConsumptionMap: { [key: string]: number } = {};
        
        roomsData.forEach((room: any) => {
          let roomTotal = 0;
          if (room.electrodomesticos && Array.isArray(room.electrodomesticos)) {
            room.electrodomesticos.forEach((e: any) => {
              const consumo = (e.consumo_kwh_ajustado || e.tipos_electrodomestico?.consumo_kwh_predeterminado || 0) * e.horas_uso_diarias * 30;
              roomTotal += consumo;
            });
          }
          if (roomTotal > 0) {
            roomConsumptionMap[room.nombre] = Math.round(roomTotal);
          }
        });

        const total = Object.values(roomConsumptionMap).reduce((sum, val) => sum + val, 0);
        const roomConsumptionData: RoomConsumption[] = Object.entries(roomConsumptionMap)
          .map(([name, value]) => ({
            name,
            value,
            percentage: Math.round((value / total) * 100)
          }))
          .sort((a, b) => b.value - a.value);

        setRoomConsumption(roomConsumptionData);
      }

      // Generate mock daily consumption data (últimos 7 días)
      const mockDailyData: DailyConsumption[] = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayConsumption = (consumoData || 0) / 30; // Promedio diario
        const variation = (Math.random() - 0.5) * 0.3; // ±15% variación
        mockDailyData.push({
          date: date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }),
          consumo: Math.round(dayConsumption * (1 + variation))
        });
      }
      setDailyConsumption(mockDailyData);
    } catch (error: any) {
      toast.error("Error al cargar los datos del dashboard");
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (hogares.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="LogVolt" className="h-8 w-auto" />
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-16">
          <Card className="p-12 text-center max-w-2xl mx-auto">
            <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-4">Bienvenido a LogVolt</h2>
            <p className="text-muted-foreground mb-6">
              Para comenzar a monitorear tu consumo eléctrico, primero debes crear un hogar
            </p>
            <Button onClick={() => navigate("/homes")}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Mi Primer Hogar
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const monthlyGoal = 400;
  const estimatedCost = Math.round(totalConsumption * 150);
  const progress = (totalConsumption / monthlyGoal) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="LogVolt" className="h-8 w-auto" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/homes")}>
              <Home className="w-4 h-4 mr-2" />
              Gestionar Hogares
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
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              {hogares.find(h => h.id === selectedHogar)?.nombre || ""} - Enero 2025
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/homes")}>
              <Home className="w-4 h-4 mr-2" />
              Gestionar Hogares
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Consumo Total</CardTitle>
              <Zap className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalConsumption} kWh</div>
              <p className="text-xs text-muted-foreground mt-1">
                Este mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Costo Estimado</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${estimatedCost.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                CLP este mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Meta Mensual</CardTitle>
              <Home className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{monthlyGoal} kWh</div>
              <Progress value={progress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {progress > 100 ? `${(progress - 100).toFixed(0)}% sobre la meta` : `${(100 - progress).toFixed(0)}% para cumplir`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <ConsumptionBarChart 
            data={topAppliances.map(a => ({
              name: a.name.substring(0, 15) + (a.name.length > 15 ? '...' : ''),
              consumo: a.consumption,
              room: a.room
            }))}
          />
          {roomConsumption.length > 0 && (
            <ConsumptionPieChart data={roomConsumption} />
          )}
        </div>

        {dailyConsumption.length > 0 && (
          <div className="mb-6">
            <ConsumptionLineChart data={dailyConsumption} />
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Consumers */}
          <Card>
            <CardHeader>
              <CardTitle>Electrodomésticos que Más Consumen</CardTitle>
              <CardDescription>Top consumidores de energía en tu hogar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topAppliances.map((appliance, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{appliance.name}</p>
                      <p className="text-sm text-muted-foreground">{appliance.room}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{appliance.consumption} kWh</p>
                      <p className="text-sm text-muted-foreground">{appliance.percentage}%</p>
                    </div>
                  </div>
                  <Progress value={appliance.percentage * 4} />
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate(`/homes/${selectedHogar}`)}
              >
                Ver Todos los Electrodomésticos
              </Button>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recomendaciones</CardTitle>
              <CardDescription>Sugerencias para reducir tu consumo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topAppliances.length > 0 ? (
                <>
                  <div className="p-4 rounded-lg border-2 border-warning/20 bg-warning/5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 mt-0.5 text-warning" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">
                          {topAppliances[0].name} es tu mayor consumidor
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Este electrodoméstico representa el {topAppliances[0].percentage}% de tu consumo total
                        </p>
                        <p className="text-sm font-medium text-success">
                          Considera optimizar su uso para ahorrar energía
                        </p>
                      </div>
                    </div>
                  </div>
                  {progress > 100 && (
                    <div className="p-4 rounded-lg border-2 border-destructive/20 bg-destructive/5">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 mt-0.5 text-destructive" />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">
                            Tu consumo está {(progress - 100).toFixed(0)}% sobre tu meta
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            Intenta reducir el uso de electrodomésticos de alta potencia
                          </p>
                          <p className="text-sm font-medium text-success">
                            Ahorro potencial: ~${Math.round((totalConsumption - monthlyGoal) * 150).toLocaleString()}/mes
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Agrega electrodomésticos para recibir recomendaciones personalizadas
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col gap-2"
                onClick={() => navigate("/homes")}
              >
                <Home className="w-6 h-6" />
                <span>Gestionar Hogares</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col gap-2"
                onClick={() => selectedHogar && navigate(`/homes/${selectedHogar}`)}
                disabled={!selectedHogar}
              >
                <Zap className="w-6 h-6" />
                <span>Gestionar Electrodomésticos</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex flex-col gap-2" disabled>
                <TrendingUp className="w-6 h-6" />
                <span>Establecer Meta</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex flex-col gap-2" disabled>
                <AlertCircle className="w-6 h-6" />
                <span>Ver Alertas</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
