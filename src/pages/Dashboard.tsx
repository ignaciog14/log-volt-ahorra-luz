import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Plus, TrendingUp, Zap, AlertCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  // Mock data - will be replaced with real data from backend
  const totalConsumption = 450; // kWh
  const estimatedCost = 75000; // CLP
  const monthlyGoal = 400; // kWh
  const progress = (totalConsumption / monthlyGoal) * 100;

  const topAppliances = [
    { name: "Refrigerador", consumption: 120, percentage: 27, room: "Cocina" },
    { name: "Lavadora", consumption: 85, percentage: 19, room: "Baño" },
    { name: "Aire Acondicionado", consumption: 95, percentage: 21, room: "Dormitorio" },
    { name: "Televisor", consumption: 45, percentage: 10, room: "Living" },
  ];

  const recommendations = [
    {
      title: "Refrigerador consume el 27% de tu energía",
      description: "Considera revisar la eficiencia del refrigerador o ajustar la temperatura",
      priority: "high",
      savings: "~$15.000/mes"
    },
    {
      title: "Tu consumo está 12% sobre tu meta",
      description: "Intenta reducir el uso de electrodomésticos de alta potencia",
      priority: "medium",
      savings: "~$8.000/mes"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
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

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Casa Principal - Enero 2025</p>
          </div>
          <div className="flex gap-3">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Hogar
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
              <Button variant="outline" className="w-full mt-4">
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
              {recommendations.map((rec, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border-2 ${
                    rec.priority === 'high' 
                      ? 'border-destructive/20 bg-destructive/5' 
                      : 'border-warning/20 bg-warning/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-5 h-5 mt-0.5 ${
                      rec.priority === 'high' ? 'text-destructive' : 'text-warning'
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                      <p className="text-sm font-medium text-success">
                        Ahorro potencial: {rec.savings}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4">
                Ver Todas las Recomendaciones
              </Button>
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
              <Button variant="outline" className="h-auto py-6 flex flex-col gap-2">
                <Home className="w-6 h-6" />
                <span>Agregar Habitación</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex flex-col gap-2">
                <Zap className="w-6 h-6" />
                <span>Registrar Electrodoméstico</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex flex-col gap-2">
                <TrendingUp className="w-6 h-6" />
                <span>Establecer Meta</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex flex-col gap-2">
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
