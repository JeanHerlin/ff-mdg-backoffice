import { TournamentsTable } from "./tournaments-table";

export const metadata = { title: "Ligues & tournois" };

export default function TournamentsAdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ligues & tournois</h1>
        <p className="text-sm text-muted-foreground">
          Créez un tournoi, puis ouvrez-le pour créer ses étapes et tirer les groupes au sort une fois les inscriptions
          closes.
        </p>
      </div>
      <TournamentsTable />
    </div>
  );
}
