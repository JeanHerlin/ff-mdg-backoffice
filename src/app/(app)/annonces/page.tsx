import { AnnouncementsTable } from "./announcements-table";

export const metadata = { title: "Annonces" };

export default function AnnouncementsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fil d&apos;actualité</h1>
        <p className="text-sm text-muted-foreground">
          Publiez les annonces officielles affichées chronologiquement sur le fil d&apos;actualité, aux côtés du mercato.
        </p>
      </div>
      <AnnouncementsTable />
    </div>
  );
}
