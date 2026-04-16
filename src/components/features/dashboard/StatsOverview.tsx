import { TrendingUp, Zap, LayoutDashboard, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatsOverviewProps {
  totalConsumption: number;
  totalRooms: number;
  totalAppliances: number;
  monthlyGoal: number;
}

const StatsOverview = ({
  totalConsumption,
  totalRooms,
  totalAppliances,
  monthlyGoal,
}: StatsOverviewProps) => {
  const estimatedCost = Math.round(totalConsumption * 150);
  const progress = (totalConsumption / monthlyGoal) * 100;

  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Consumo Total</CardTitle>
          <Zap className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalConsumption} kWh</div>
          <p className="text-xs text-muted-foreground mt-1">Este mes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Costo Estimado</CardTitle>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${estimatedCost.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">CLP este mes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Habitaciones</CardTitle>
          <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalRooms}</div>
          <p className="text-xs text-muted-foreground mt-1">{totalAppliances} electrodomésticos</p>
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
            {progress > 100
              ? `${(progress - 100).toFixed(0)}% sobre la meta`
              : `${(100 - progress).toFixed(0)}% para cumplir`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsOverview;
