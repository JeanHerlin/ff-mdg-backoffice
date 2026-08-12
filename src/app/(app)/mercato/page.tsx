import { MercatoTable } from "./mercato-table";

export const metadata = { title: "Mercato" };

export default function MercatoAdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mercato</h1>
        <p className="text-sm text-muted-foreground">
          Validez les demandes de transfert et de départ entre équipes.
        </p>
      </div>
      <MercatoTable />
    </div>
  );
}
