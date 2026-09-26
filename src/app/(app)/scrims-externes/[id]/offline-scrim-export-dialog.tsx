"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { apiRequest } from "@/lib/api-client";
import { PosterStandingEntry, ScrimResultPoster } from "./scrim-result-poster";

const HOSTED_BY = "FF Madagascar E-Sport";
const PREVIEW_WIDTH = 380;

function formatDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function slugify(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "scrim"
  );
}

export function OfflineScrimExportDialog({
  open,
  onClose,
  scrimId,
  scrimName,
  scrimStartAt,
}: {
  open: boolean;
  onClose: () => void;
  scrimId: string;
  scrimName: string;
  scrimStartAt: string;
}) {
  const [standings, setStandings] = useState<PosterStandingEntry[] | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setStandings(null);
    apiRequest<PosterStandingEntry[]>(`/offline-scrim-matches/scrims/${scrimId}/standings`).then((data) => setStandings(data ?? []));
  }, [open, scrimId]);

  useEffect(() => {
    if (!photo) {
      setPhotoDataUrl(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(photo);
  }, [photo]);

  const dateLabel = useMemo(() => formatDateLabel(scrimStartAt), [scrimStartAt]);

  async function download() {
    if (!posterRef.current) return;
    setGenerating(true);
    try {
      // pixelRatio 2 : export net même zoomé/imprimé, la capture ignore de
      // toute façon la réduction visuelle appliquée à l'aperçu ci-dessous.
      const dataUrl = await toPng(posterRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `${slugify(scrimName)}-resultats.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setGenerating(false);
    }
  }

  const previewScale = standings ? PREVIEW_WIDTH / 1600 : 1;

  return (
    <Sheet open={open} onClose={onClose} title="Exporter le résultat en image">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="poster-photo">Photo (facultative)</Label>
          {photoDataUrl ? (
            <div className="relative w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local, jamais envoyé au serveur */}
              <img src={photoDataUrl} alt="" className="h-32 w-24 rounded-md border border-border object-cover" />
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground shadow"
                aria-label="Retirer la photo"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary">
              <ImagePlus className="size-4 shrink-0" />
              Choisir une photo
              <input
                id="poster-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
          <p className="text-xs text-muted-foreground">Jamais envoyée ni sauvegardée — utilisée uniquement pour cette image.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Aperçu</Label>
          {!standings ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : standings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune équipe assignée à un résultat pour le moment — rien à exporter.
            </p>
          ) : (
            <div
              className="overflow-hidden rounded-md border border-border"
              style={{ width: PREVIEW_WIDTH, height: (240 + Math.ceil(standings.length / 2) * 46 + 90) * previewScale }}
            >
              <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left" }}>
                <ScrimResultPoster
                  ref={posterRef}
                  title={scrimName}
                  hostedBy={HOSTED_BY}
                  dateLabel={dateLabel}
                  standings={standings}
                  photoDataUrl={photoDataUrl}
                  logoSrc="/brand/logo-light-bg.png"
                />
              </div>
            </div>
          )}
        </div>

        <Button onClick={download} disabled={!standings || standings.length === 0 || generating}>
          {generating ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          Télécharger le PNG
        </Button>
      </div>
    </Sheet>
  );
}
