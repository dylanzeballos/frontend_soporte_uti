import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type UnitItem = {
  id: number;
  name: string;
};

const staticUnits: UnitItem[] = [
  { id: 1, name: 'Dirección de carrera de Ingeniería Financiera' },
  { id: 2, name: 'Dirección de carrera de Ingeniería Industrial' },
  { id: 3, name: 'Coordinación de Laboratorios de Informática' },
  { id: 4, name: 'Secretaría Académica de la Facultad' },
];

export function UnitsListPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lista de unidades</h1>
        <p className="text-sm text-muted-foreground">
          Vista temporal con datos estáticos mientras se integra el backend.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unidades registradas</CardTitle>
          <CardDescription>{staticUnits.length} unidades encontradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-3 py-2 font-semibold text-foreground">ID</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Nombre</th>
                </tr>
              </thead>
              <tbody>
                {staticUnits.map((unit) => (
                  <tr key={unit.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2 text-muted-foreground">{unit.id}</td>
                    <td className="px-3 py-2">{unit.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
