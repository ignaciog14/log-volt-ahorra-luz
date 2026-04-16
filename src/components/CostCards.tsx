import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, TrendingUp, TrendingDown, Minus, AlertTriangle, Info } from "lucide-react";
import { calcularBoleta, esTemporadaInvierno } from "@/lib/tarifaBT1";
import type { TarifaData } from "@/hooks/useTarifas";

interface CostCardsProps {
  consumoMensual: number;
  consumoDiario: number;
  consumoAyer?: number;
  tarifa: TarifaData;
}

export const CostCards = ({ consumoMensual, consumoDiario, consumoAyer, tarifa }: CostCardsProps) => {
  const boleta = calcularBoleta(consumoMensual, tarifa.tarifaKey);
  const esInvierno = esTemporadaInvierno();

  const costoDiario = Math.round(consumoDiario * tarifa.tarifa_media_pesos_kwh);
  const costoAyer = consumoAyer ? Math.round(consumoAyer * tarifa.tarifa_media_pesos_kwh) : null;

  const diferenciaCosto = costoAyer ? costoDiario - costoAyer : 0;

  const getTrendIcon = () => {
    if (!costoAyer) return <Minus className="w-4 h-4" />;
    if (diferenciaCosto > 0) return <TrendingUp className="w-4 h-4 text-destructive" />;
    if (diferenciaCosto < 0) return <TrendingDown className="w-4 h-4 text-green-500" />;
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
      {/* Alerta límite invierno */}
      {esInvierno && boleta.superaLimiteInvierno && (
        <div className="col-span-full">
          <Alert variant="destructive" className="border-orange-500 bg-orange-50 text-orange-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Superaste los <strong>{boleta.kWhEnRecargo + 430} kWh</strong> del límite de invierno.
              Los {boleta.kWhEnRecargo} kWh extra tienen recargo.{" "}
              {boleta.ahorroPotencial > 0 && (
                <span>Reducir el consumo podría ahorrarte <strong>${boleta.ahorroPotencial.toLocaleString()}</strong> este mes.</span>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Costo hoy */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Costo Estimado Hoy</CardTitle>
          <DollarSign className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${costoDiario.toLocaleString()}</div>
          <div className="flex items-center gap-1 mt-1">
            {getTrendIcon()}
            <p className="text-xs text-muted-foreground">{getTrendText()}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {consumoDiario.toFixed(1)} kWh × ${tarifa.tarifa_media_pesos_kwh}/kWh (c/IVA)
          </p>
        </CardContent>
      </Card>

      {/* Boleta mensual estimada con desglose BT1 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Boleta Estimada Mensual</CardTitle>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${boleta.total.toLocaleString()}</div>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Cargo fijo</span>
              <span>${boleta.cargoFijo.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Cargo energía ({boleta.consumo_kWh} kWh)</span>
              <span>${boleta.cargoEnergia.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span>IVA (19%)</span>
              <span>${boleta.iva.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Tarifa {tarifa.empresa_nombre}</p>
        </CardContent>
      </Card>

      {/* Tarifas vigentes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tarifas Vigentes</CardTitle>
          <CardDescription className="flex items-center gap-1">
            {tarifa.empresa_nombre}
            {esInvierno && (
              <span className="ml-1 text-orange-600 font-medium">(temporada invierno)</span>
            )}
          </CardDescription>
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
            <div className="flex items-start gap-1 mt-2 text-xs text-muted-foreground">
              <Info className="w-3 h-3 mt-0.5 shrink-0" />
              <span>Límite invierno: 430 kWh/mes (jun–sep). Sobre este límite aplica recargo.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
