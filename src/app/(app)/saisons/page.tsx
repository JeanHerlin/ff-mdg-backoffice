import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Saisons" };

export default function SeasonsPage() {
  return (
    <ComingSoon
      module="Module 6 — Saisons"
      title="Gestion des saisons"
      description="Création et clôture des saisons, verrouillage des compositions d'équipe, renouvellement des points de placement."
    />
  );
}
