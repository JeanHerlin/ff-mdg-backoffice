import { DashboardOverview } from "./dashboard-overview";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Vue d&apos;ensemble de la plateforme.</p>
      </div>

      <DashboardOverview />
    </div>
  );
}
