import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopAppliance } from "@/hooks/useDashboardData";

interface RecommendationsCardProps {
  topAppliances: TopAppliance[];
  totalConsumption: number;
  monthlyGoal: number;
}

const RecommendationsCard = ({
  topAppliances,
  totalConsumption,
  monthlyGoal,
}: RecommendationsCardProps) => {
  const progress = (totalConsumption / monthlyGoal) * 100;

  return (
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
                    Este electrodoméstico representa el {topAppliances[0].percentage}% de tu consumo
                    total
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
                      Ahorro potencial: ~$
                      {Math.round((totalConsumption - monthlyGoal) * 150).toLocaleString()}/mes
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
  );
};

export default RecommendationsCard;
