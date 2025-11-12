import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface RoomComparison {
  habitacion_id: number;
  habitacion_nombre: string;
  tipo_habitacion: string;
  mi_consumo: number;
  promedio_nacional: number;
  diferencia_porcentaje: number;
}

interface RoomComparisonCardProps {
  comparisons: RoomComparison[];
  loading: boolean;
}

const RoomComparisonCard = ({ comparisons, loading }: RoomComparisonCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparativa por Habitación</CardTitle>
          <CardDescription>Cargando datos...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativa por Habitación</CardTitle>
        <CardDescription>Compara el consumo de tus habitaciones con promedios nacionales</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Habitación</TableHead>
              <TableHead className="text-right">Mi Consumo</TableHead>
              <TableHead className="text-right">Promedio Nacional</TableHead>
              <TableHead className="text-right">Diferencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparisons.map((comp) => {
              const isBetter = comp.diferencia_porcentaje < 0;
              const isWorse = comp.diferencia_porcentaje > 10;
              
              return (
                <TableRow key={comp.habitacion_id}>
                  <TableCell className="font-medium">{comp.habitacion_nombre}</TableCell>
                  <TableCell className="text-right">{comp.mi_consumo.toFixed(2)} kWh</TableCell>
                  <TableCell className="text-right">{comp.promedio_nacional.toFixed(2)} kWh</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={isBetter ? "default" : isWorse ? "destructive" : "secondary"}>
                      {isBetter ? (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      ) : isWorse ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <Minus className="w-3 h-3 mr-1" />
                      )}
                      {comp.diferencia_porcentaje > 0 ? "+" : ""}
                      {comp.diferencia_porcentaje.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RoomComparisonCard;
