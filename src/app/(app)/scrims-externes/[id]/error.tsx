"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

// Plantage d'affichage sur la page d'un scrim externe : on montre le message
// et la pile d'appels (diagnostic) au lieu d'un écran blanc, avec un bouton
// pour réessayer sans recharger toute l'application.
export default function OfflineScrimError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error("[scrims externes] erreur d'affichage", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 py-10">
      <div className="flex items-center gap-2 text-accent">
        <TriangleAlert className="size-5" />
        <p className="font-semibold">Une erreur est survenue sur cette page</p>
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-muted p-3 font-mono text-xs text-foreground">
        {`${error.name}: ${error.message}${error.digest ? `\ndigest: ${error.digest}` : ""}${error.stack ? `\n\n${error.stack}` : ""}`}
      </pre>
      <div>
        <Button onClick={() => retry()}>Réessayer</Button>
      </div>
    </div>
  );
}
