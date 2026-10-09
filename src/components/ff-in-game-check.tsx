"use client";

import { Check, Loader2, TriangleAlert } from "lucide-react";
import { useFfLookup, type FfPlayer } from "@/hooks/use-ff-lookup";

function samePseudo(a: string, b: string) {
  const normalize = (s: string) => s.replace(/ㅤ/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  return normalize(a) === normalize(b);
}

/**
 * Pseudo réel en jeu pour un ID Free Fire (API externe via GET /ff-lookup),
 * comparé au pseudo déclaré sur la plateforme. Purement indicatif : l'admin
 * garde la décision finale.
 */
export function FfInGameCheck({
  uid,
  declaredPseudo,
  onUsePseudo,
}: {
  uid: string;
  declaredPseudo?: string;
  onUsePseudo?: (player: FfPlayer) => void;
}) {
  const { checking, player, notFound } = useFfLookup(uid);

  if (checking) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Vérification dans le jeu…
      </span>
    );
  }

  if (notFound) {
    return <span className="text-xs text-muted-foreground">ID non trouvé dans le jeu</span>;
  }

  if (!player) return null;

  const matches = declaredPseudo === undefined || samePseudo(player.pseudo, declaredPseudo);

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-xs">
      {matches ? (
        <Check className="size-3.5 text-primary" />
      ) : (
        <TriangleAlert className="size-3.5 text-accent" />
      )}
      <span className={matches ? "text-primary" : "text-accent"}>
        En jeu : <strong>{player.pseudo}</strong>
        {player.region ? ` · ${player.region}` : ""}
      </span>
      {!matches && onUsePseudo && (
        <button
          type="button"
          className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
          onClick={() => onUsePseudo(player)}
        >
          Utiliser ce pseudo
        </button>
      )}
    </span>
  );
}
