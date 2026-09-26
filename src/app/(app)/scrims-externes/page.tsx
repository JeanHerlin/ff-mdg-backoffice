import { OfflineScrimsTable } from "./offline-scrims-table";

export const metadata = { title: "Scrims externes" };

export default function OfflineScrimsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Scrims externes</h1>
        <p className="text-sm text-muted-foreground">
          Historique de scrims joués par des équipes hors plateforme (tournoi externe, rencontre ponctuelle...) — jamais
          visible côté site public, uniquement conservé ici pour archive.
        </p>
      </div>
      <OfflineScrimsTable />
    </div>
  );
}
