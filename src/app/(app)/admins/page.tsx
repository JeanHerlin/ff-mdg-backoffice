import { AdminsTable } from "./admins-table";

export const metadata = { title: "Comptes admin" };

export default function AdminsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comptes admin</h1>
        <p className="text-sm text-muted-foreground">
          Invitez des administrateurs et gérez leurs accès au back-office.
        </p>
      </div>
      <AdminsTable />
    </div>
  );
}
