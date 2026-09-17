import { DivisionsTable } from "./divisions-table";

export const metadata = { title: "Divisions" };

export default function DivisionsAdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Divisions</h1>
        <p className="text-sm text-muted-foreground">
          Paliers de classement (nom, seuil de points, couleur) pour les joueurs et les équipes — recalculés
          automatiquement à la clôture de chaque saison, toujours corrigeables ensuite.
        </p>
      </div>
      <DivisionsTable />
    </div>
  );
}
