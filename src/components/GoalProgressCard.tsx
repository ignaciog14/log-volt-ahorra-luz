import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { GoalDialog } from "./GoalDialog";

interface GoalProgressCardProps {
  hogarId: number;
  currentGoal: {
    id: number;
    consumo_kwh_meta: number | null;
    costo_pesos_meta: number | null;
  } | null;
  consumoActual: number;
  costoActual: number;
  onGoalUpdated: () => void;
}

export const GoalProgressCard = ({ 
  hogarId,
  currentGoal, 
  consumoActual, 
  costoActual,
  onGoalUpdated 
}: GoalProgressCardProps) => {
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const daysRemaining = daysInMonth - currentDay;

  const consumoProgress = currentGoal?.consumo_kwh_meta 
    ? (consumoActual / currentGoal.consumo_kwh_meta) * 100 
    : 0;
  
  const costoProgress = currentGoal?.costo_pesos_meta 
    ? (costoActual / currentGoal.costo_pesos_meta) * 100 
    : 0;

  const consumoPromedioDiario = consumoActual / currentDay;
  const consumoProyectado = consumoPromedioDiario * daysInMonth;

  const getStatusColor = (progress: number) => {
    if (progress >= 100) return "text-destructive";
    if (progress >= 80) return "text-orange-500";
    return "text-green-500";
  };

  const getStatusIcon = (progress: number) => {
    if (progress >= 100) return <AlertTriangle className="h-5 w-5 text-destructive" />;
    if (progress >= 80) return <TrendingUp className="h-5 w-5 text-orange-500" />;
    return <TrendingDown className="h-5 w-5 text-green-500" />;
  };

  const getStatusText = (progress: number) => {
    if (progress >= 100) return "¡Meta superada!";
    if (progress >= 80) return "Cerca de tu meta";
    return "En buen camino";
  };

  if (!currentGoal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Metas de Consumo</CardTitle>
          <CardDescription>
            Establece una meta mensual para controlar tu consumo energético
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <GoalDialog 
              hogarId={hogarId} 
              currentGoal={null} 
              onSaved={onGoalUpdated}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Progreso hacia tu Meta</CardTitle>
            <CardDescription>
              {daysRemaining} días restantes este mes
            </CardDescription>
          </div>
          <GoalDialog 
            hogarId={hogarId} 
            currentGoal={currentGoal} 
            onSaved={onGoalUpdated}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentGoal.consumo_kwh_meta && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(consumoProgress)}
                <span className="font-medium">Consumo (kWh)</span>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(consumoProgress)}`}>
                {getStatusText(consumoProgress)}
              </span>
            </div>
            <Progress value={Math.min(consumoProgress, 100)} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{consumoActual.toFixed(1)} kWh de {currentGoal.consumo_kwh_meta} kWh</span>
              <span>{Math.min(consumoProgress, 100).toFixed(0)}%</span>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Promedio diario: <span className="font-medium text-foreground">{consumoPromedioDiario.toFixed(1)} kWh</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Consumo proyectado: <span className={`font-medium ${consumoProyectado > currentGoal.consumo_kwh_meta ? 'text-destructive' : 'text-foreground'}`}>
                  {consumoProyectado.toFixed(1)} kWh
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Recomendado diario: <span className="font-medium text-foreground">
                  {((currentGoal.consumo_kwh_meta - consumoActual) / daysRemaining).toFixed(1)} kWh
                </span>
              </p>
            </div>
          </div>
        )}

        {currentGoal.costo_pesos_meta && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(costoProgress)}
                <span className="font-medium">Costo (CLP)</span>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(costoProgress)}`}>
                {getStatusText(costoProgress)}
              </span>
            </div>
            <Progress value={Math.min(costoProgress, 100)} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>${costoActual.toFixed(0)} de ${currentGoal.costo_pesos_meta}</span>
              <span>{Math.min(costoProgress, 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
