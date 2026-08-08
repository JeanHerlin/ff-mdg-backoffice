import { TeamsTable } from "./teams-table";

export const metadata = { title: "Équipes" };

export default function TeamsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Équipes</h1>
        <p className="text-sm text-muted-foreground">
          Équipes de la communauté. La certification arrive avec le module Vérifications.
        </p>
      </div>
      <TeamsTable />
    </div>
  );
}
