import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { TopAppliance, RoomConsumption } from "@/hooks/useDashboardData";

type ConsumptionLevel = "high" | "medium" | "low";

function getConsumptionLevel(percentage: number): ConsumptionLevel {
  if (percentage > 30) return "high";
  if (percentage > 15) return "medium";
  return "low";
}

function getConsumptionColor(level: ConsumptionLevel) {
  const map: Record<ConsumptionLevel, string> = {
    high: "text-destructive",
    medium: "text-warning",
    low: "text-success",
  };
  return map[level];
}

function getBarColor(level: ConsumptionLevel) {
  const map: Record<ConsumptionLevel, string> = {
    high: "bg-destructive",
    medium: "bg-warning",
    low: "bg-success",
  };
  return map[level];
}

function getBarBgColor(level: ConsumptionLevel) {
  const map: Record<ConsumptionLevel, string> = {
    high: "bg-destructive/20",
    medium: "bg-warning/20",
    low: "bg-success/20",
  };
  return map[level];
}

function getLevelLabel(level: ConsumptionLevel) {
  const map: Record<ConsumptionLevel, string> = {
    high: "Alto",
    medium: "Medio",
    low: "Bajo",
  };
  return map[level];
}

interface ConsumptionTablesProps {
  topAppliances: TopAppliance[];
  roomConsumption: RoomConsumption[];
  selectedHogar: number | null;
}

const ConsumptionTables = ({
  topAppliances,
  roomConsumption,
  selectedHogar,
}: ConsumptionTablesProps) => {
  const navigate = useNavigate();
  const [sortRoomsBy, setSortRoomsBy] = useState<"name" | "consumption">("consumption");
  const [sortAppliancesBy, setSortAppliancesBy] = useState<"name" | "consumption">("consumption");

  const sortedRooms = [...roomConsumption].sort((a, b) =>
    sortRoomsBy === "name" ? a.name.localeCompare(b.name) : b.value - a.value
  );

  const sortedAppliances = [...topAppliances]
    .map((a) => ({ ...a, level: getConsumptionLevel(a.percentage) }))
    .sort((a, b) =>
      sortAppliancesBy === "name"
        ? a.name.localeCompare(b.name)
        : b.consumption - a.consumption
    );

  return (
    <div className="grid lg:grid-cols-2 gap-6 mb-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Consumo por Habitación</CardTitle>
              <CardDescription>Desglose detallado por espacio</CardDescription>
            </div>
            <select
              value={sortRoomsBy}
              onChange={(e) => setSortRoomsBy(e.target.value as "name" | "consumption")}
              className="text-sm border border-border rounded-md px-2 py-1 bg-background"
            >
              <option value="consumption">Por Consumo</option>
              <option value="name">Por Nombre</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {sortedRooms.length > 0 ? (
            <div className="space-y-3">
              {sortedRooms.map((room, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold">{room.name}</p>
                      <p className="text-sm text-muted-foreground">{room.percentage}% del total</p>
                    </div>
                    <div className="text-right mr-3">
                      <p className="text-lg font-bold">{room.value} kWh</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => selectedHogar && navigate(`/homes/${selectedHogar}`)}
                    >
                      Ver
                    </Button>
                  </div>
                  <Progress value={room.percentage} className="h-2" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No hay datos de consumo por habitación
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Consumo por Electrodoméstico</CardTitle>
              <CardDescription>Detalle de cada dispositivo</CardDescription>
            </div>
            <select
              value={sortAppliancesBy}
              onChange={(e) => setSortAppliancesBy(e.target.value as "name" | "consumption")}
              className="text-sm border border-border rounded-md px-2 py-1 bg-background"
            >
              <option value="consumption">Por Consumo</option>
              <option value="name">Por Nombre</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {sortedAppliances.length > 0 ? (
            <div className="space-y-3">
              {sortedAppliances.map((appliance, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex-1">
                      <p className="font-semibold">{appliance.name}</p>
                      <p className="text-xs text-muted-foreground">{appliance.room}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getConsumptionColor(appliance.level)}`}>
                        {appliance.consumption} kWh
                      </p>
                      <p className="text-xs text-muted-foreground">{appliance.percentage}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-2 rounded-full ${getBarBgColor(appliance.level)}`}>
                      <div
                        className={`h-full rounded-full ${getBarColor(appliance.level)}`}
                        style={{ width: `${Math.min(appliance.percentage * 2, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${getConsumptionColor(appliance.level)}`}>
                      {getLevelLabel(appliance.level)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No hay electrodomésticos registrados
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsumptionTables;
