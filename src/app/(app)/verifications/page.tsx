import { VerificationsTable } from "./verifications-table";

export const metadata = { title: "Vérifications" };

export default function VerificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vérifications</h1>
        <p className="text-sm text-muted-foreground">
          Certifiez les équipes en attente et validez le pseudo des joueurs à partir de leur ID Free Fire.
        </p>
      </div>
      <VerificationsTable />
    </div>
  );
}
