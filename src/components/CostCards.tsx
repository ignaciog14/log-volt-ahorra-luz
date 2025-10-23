import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TarifaData {
  tarifa_punta_pesos_kwh: number;
  tarifa_valle_pesos_kwh: number;
  tarifa_media_pesos_kwh: number;
  empresa_nombre: string;
}

interface CostCardsProps {
  consumoMensual: number;
  consumoDiario: number;
  consumoAyer?: number;
  tarifa: TarifaData;
}

export const CostCards = ({ consumoMensual, consumoDiario, consumoAyer, tarifa }: CostCardsProps) => {
  const costoMensual = Math.round(consumoMensual * tarifa.tarifa_media_pesos_kwh);
  const costoDiario = Math.round(consumoDiario * tarifa.tarifa_media_pesos_kwh);
  const costoAyer = consumoAyer ? Math.round(consumoAyer * tarifa.tarifa_media_pesos_kwh) : null;
  
  const diferenciaCosto = costoAyer ? costoDiario - costoAyer : 0;
  const porcentajeDiferencia = costoAyer ? ((diferenciaCosto / costoAyer) * 100) : 0;

  const getTrendIcon = () => {
    if (!costoAyer) return <Minus className="w-4 h-4" />;
    if (diferenciaCosto > 0) return <TrendingUp className="w-4 h-4 text-destructive" />;
    if (diferenciaCosto < 0) return <TrendingDown className="w-4 h-4 text-success" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendText = () => {
    if (!costoAyer) return "Sin datos previos";
    if (diferenciaCosto > 0) return `+$${diferenciaCosto.toLocaleString()} vs. ayer`;
    if (diferenciaCosto < 0) return `$${Math.abs(diferenciaCosto).toLocaleString()} menos vs. ayer`;
    return "Igual que ayer";
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Costo Estimado Hoy</CardTitle>
          <DollarSign className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${costoDiario.toLocaleString()}</div>
          <div className="flex items-center gap-1 mt-1">
            {getTrendIcon()}
            <p className="text-xs text-muted-foreground">
              {getTrendText()}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {consumoDiario.toFixed(1)} kWh × ${tarifa.tarifa_media_pesos_kwh}/kWh
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Costo Estimado Mensual</CardTitle>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${costoMensual.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {consumoMensual.toFixed(0)} kWh proyectados
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tarifa {tarifa.empresa_nombre}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tarifas Vigentes</CardTitle>
          <CardDescription>{tarifa.empresa_nombre}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Horario Punta:</span>
              <span className="font-semibold">${tarifa.tarifa_punta_pesos_kwh}/kWh</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Horario Valle:</span>
              <span className="font-semibold">${tarifa.tarifa_valle_pesos_kwh}/kWh</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Promedio:</span>
              <span className="font-bold">${tarifa.tarifa_media_pesos_kwh}/kWh</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
