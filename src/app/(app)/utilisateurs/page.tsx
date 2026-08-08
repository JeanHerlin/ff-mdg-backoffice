import { UsersTable } from "./users-table";

export const metadata = { title: "Utilisateurs" };

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
        <p className="text-sm text-muted-foreground">Joueurs inscrits sur la plateforme.</p>
      </div>
      <UsersTable />
    </div>
  );
}
