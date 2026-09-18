import { PointAdjustmentsPage } from "./point-adjustments-page";

export const metadata = { title: "Statistiques & points" };

export default function StatsAdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Statistiques & points</h1>
        <p className="text-sm text-muted-foreground">
          Classement de la saison active — ajoutez une sanction ou un bonus manuel à une équipe, avec un motif.
        </p>
      </div>
      <PointAdjustmentsPage />
    </div>
  );
}
