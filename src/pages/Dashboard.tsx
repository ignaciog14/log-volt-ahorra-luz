import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Plus, TrendingUp, Zap, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useHogares } from "@/hooks/useHogares";
import { useDashboardData } from "@/hooks/useDashboardData";
import Navbar from "@/components/shared/Navbar";
import StatsOverview from "@/components/features/dashboard/StatsOverview";
import ConsumptionTables from "@/components/features/dashboard/ConsumptionTables";
import RecommendationsCard from "@/components/features/dashboard/RecommendationsCard";
import ConsumptionBarChart from "@/components/ConsumptionBarChart";
import ConsumptionPieChart from "@/components/ConsumptionPieChart";
import ConsumptionLineChart from "@/components/ConsumptionLineChart";

const MONTHLY_GOAL_KWH = 400;

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { hogares, loading: hogaresLoading } = useHogares(user?.id);
  const [selectedHogar, setSelectedHogar] = useState<number | null>(null);

  const {
    totalConsumption,
    topAppliances,
    roomConsumption,
    dailyConsumption,
    totalRooms,
    totalAppliances,
    loading: dataLoading,
  } = useDashboardData(selectedHogar);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (hogares.length > 0 && !selectedHogar) {
      setSelectedHogar(hogares[0].id);
    }
  }, [hogares]);

  const sevenDayAverage =
    dailyConsumption.length > 0
      ? Math.round(
          dailyConsumption.reduce((sum, day) => sum + day.consumo, 0) / dailyConsumption.length
        )
      : 0;

  if (loading || hogaresLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (hogares.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar activePage="dashboard" />
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar activePage="dashboard" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              {hogares.find((h) => h.id === selectedHogar)?.nombre || ""} - Enero 2025
            </p>
          </div>
          {hogares.length > 1 && (
            <Select
              value={String(selectedHogar)}
              onValueChange={(v) => setSelectedHogar(parseInt(v))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Seleccionar hogar" />
              </SelectTrigger>
              <SelectContent>
                {hogares.map((h) => (
                  <SelectItem key={h.id} value={String(h.id)}>
                    {h.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {dataLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <StatsOverview
              totalConsumption={totalConsumption}
              totalRooms={totalRooms}
              totalAppliances={totalAppliances}
              monthlyGoal={MONTHLY_GOAL_KWH}
            />

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <ConsumptionBarChart
                data={topAppliances.map((a) => ({
                  name: a.name.substring(0, 15) + (a.name.length > 15 ? "..." : ""),
                  consumo: a.consumption,
                  room: a.room,
                }))}
              />
              {roomConsumption.length > 0 && (
                <ConsumptionPieChart data={roomConsumption} />
              )}
            </div>

            {dailyConsumption.length > 0 && (
              <div className="mb-6">
                <ConsumptionLineChart
                  data={dailyConsumption}
                  description={`Promedio 7 días: ${sevenDayAverage} kWh/día`}
                />
              </div>
            )}

            <ConsumptionTables
              topAppliances={topAppliances}
              roomConsumption={roomConsumption}
              selectedHogar={selectedHogar}
            />

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Electrodomésticos que Más Consumen</CardTitle>
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

              <RecommendationsCard
                topAppliances={topAppliances}
                totalConsumption={totalConsumption}
                monthlyGoal={MONTHLY_GOAL_KWH}
              />
            </div>

            <Card>
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
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
