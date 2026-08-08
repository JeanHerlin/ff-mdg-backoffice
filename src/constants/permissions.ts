import type { BackofficePermission } from "@/lib/auth-context";

export const BACKOFFICE_PERMISSIONS: BackofficePermission[] = [
  "verifications",
  "saisons",
  "scrims",
  "ligues",
  "mercato",
  "statistiques",
  "annonces",
];

export const PERMISSION_LABEL: Record<BackofficePermission, string> = {
  verifications: "Vérifications",
  saisons: "Saisons",
  scrims: "Scrims",
  ligues: "Ligues & tournois",
  mercato: "Mercato",
  statistiques: "Statistiques & points",
  annonces: "Annonces",
};
