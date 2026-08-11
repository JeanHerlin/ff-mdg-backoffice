import { SignalementsTable } from "./signalements-table";

export const metadata = { title: "Signalements" };

export default function SignalementsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Signalements d'ID Free Fire</h1>
        <p className="text-sm text-muted-foreground">
          Comptes signalés comme créés avec un ID Free Fire usurpé.
        </p>
      </div>
      <SignalementsTable />
    </div>
  );
}
