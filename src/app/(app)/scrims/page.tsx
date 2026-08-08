import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Scrims" };

export default function ScrimsAdminPage() {
  return (
    <ComingSoon
      module="Module 7 — Scrims"
      title="Gestion des scrims"
      description="Création de scrims, inscriptions illimitées et sanctions en cas de non-respect du règlement."
    />
  );
}
