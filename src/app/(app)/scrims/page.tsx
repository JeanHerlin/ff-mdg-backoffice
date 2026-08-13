import { ScrimsTable } from "./scrims-table";

export const metadata = { title: "Scrims" };

export default function ScrimsAdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Scrims</h1>
        <p className="text-sm text-muted-foreground">
          Créez des scrims et suivez les inscriptions et check-in en direct.
        </p>
      </div>
      <ScrimsTable />
    </div>
  );
}
