import { SeasonsTable } from "./seasons-table";

export const metadata = { title: "Saisons" };

export default function SeasonsAdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Saisons</h1>
        <p className="text-sm text-muted-foreground">
          Une seule saison active à la fois — le mercato se ferme à son démarrage et rouvre à sa clôture.
        </p>
      </div>
      <SeasonsTable />
    </div>
  );
}
