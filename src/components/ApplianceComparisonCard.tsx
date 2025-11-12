import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApplianceComparison {
  electrodomestico_id: number;
  electrodomestico_nombre: string;
  tipo: string;
  mi_consumo: number;
  promedio_nacional: number;
  diferencia_porcentaje: number;
  estado: "mejor" | "igual" | "peor";
}

interface ApplianceComparisonCardProps {
  comparisons: ApplianceComparison[];
  loading: boolean;
}

const ApplianceComparisonCard = ({ comparisons, loading }: ApplianceComparisonCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparativa por Electrodoméstico</CardTitle>
          <CardDescription>Cargando datos...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativa por Electrodoméstico</CardTitle>
        <CardDescription>Identifica aparatos ineficientes comparándolos con promedios</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Electrodoméstico</TableHead>
              <TableHead className="text-right">Mi Consumo</TableHead>
              <TableHead className="text-right">Promedio</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparisons.map((comp) => {
              return (
                <TableRow key={comp.electrodomestico_id}>
                  <TableCell className="font-medium">{comp.electrodomestico_nombre}</TableCell>
                  <TableCell className="text-right">{comp.mi_consumo.toFixed(2)} kWh</TableCell>
                  <TableCell className="text-right">{comp.promedio_nacional.toFixed(2)} kWh</TableCell>
                  <TableCell className="text-center">
                    {comp.estado === "mejor" && (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Eficiente
                      </Badge>
                    )}
                    {comp.estado === "igual" && (
                      <Badge variant="secondary" className="gap-1">
                        <MinusCircle className="w-3 h-3" />
                        Normal
                      </Badge>
                    )}
                    {comp.estado === "peor" && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Ineficiente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {comp.estado === "peor" && (
                      <Button size="sm" variant="outline">
                        Ver recomendación
                      </Button>
                    )}
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

export default ApplianceComparisonCard;
