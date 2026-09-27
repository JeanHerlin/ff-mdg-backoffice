"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { apiRequest } from "@/lib/api-client";
import { PosterStandingEntry, POSTER_WIDTH, POSTER_WIDTH_PORTRAIT, posterHeight, ScrimResultPoster, ScrimResultPosterPortrait } from "./scrim-result-poster";

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

async function downloadNode(node: HTMLDivElement, filename: string) {
  // pixelRatio 2 : export net même zoomé/imprimé, la capture ignore de toute
  // façon la réduction visuelle appliquée à l'aperçu.
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export function OfflineScrimExportDialog({
  open,
  onClose,
  scrimId,
  scrimName,
  scrimStartAt,
  isChampionRush,
  championRushThreshold,
  standingsOverride,
  mapLabel,
}: {
  open: boolean;
  onClose: () => void;
  scrimId: string;
  scrimName: string;
  scrimStartAt: string;
  // Mode Champion Rush — uniquement pertinent pour l'export global (une map
  // seule n'a pas de sens vis-à-vis d'un seuil cumulé sur tout le scrim), ce
  // pourquoi le toggle ci-dessous ne s'affiche jamais si standingsOverride
  // est fourni.
  isChampionRush?: boolean;
  championRushThreshold?: number | null;
  // Fourni par l'export "par map" (voir offline-scrim-results-section) : le
  // classement de CE match uniquement, déjà trié par points — dans ce cas on
  // saute l'appel réseau et on affiche juste ces données avec l'étiquette
  // "MAP: ...".
  standingsOverride?: PosterStandingEntry[];
  mapLabel?: string;
}) {
  const [standings, setStandings] = useState<PosterStandingEntry[] | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState<"landscape" | "portrait" | null>(null);
  const [championRushOn, setChampionRushOn] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);
  const posterPortraitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setChampionRushOn(false);
    if (standingsOverride) {
      setStandings(standingsOverride);
      return;
    }
    setStandings(null);
    apiRequest<PosterStandingEntry[]>(`/offline-scrim-matches/scrims/${scrimId}/standings`).then((data) => setStandings(data ?? []));
  }, [open, scrimId, standingsOverride]);

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
  const slug = slugify(scrimName) + (mapLabel ? `-${slugify(mapLabel)}` : "");

  // Le toggle Champion Rush n'a de sens que sur l'export global (seuil
  // cumulé sur tout le scrim) — jamais proposé pour un export par map.
  const showToggle = !standingsOverride && !!isChampionRush;

  const displayStandings = useMemo(() => {
    if (!standings) return null;
    if (!showToggle || !championRushOn || championRushThreshold == null) return standings;
    // Plusieurs équipes peuvent être "qualifiées" (seuil atteint), mais UNE
    // SEULE est "la championne" — celle qui a en plus décroché un Booyah.
    // standings est déjà trié par points décroissants, donc la première
    // équipe qui remplit les deux conditions est forcément la mieux classée
    // parmi elles : on s'arrête à elle pour ne jamais surligner deux lignes
    // à la fois, même si une autre équipe qualifiée a aussi un Booyah.
    let championFound = false;
    return standings.map((entry) => {
      const qualified = entry.totalPoints >= championRushThreshold;
      const isChampion = !championFound && qualified && entry.booyahCount > 0;
      if (isChampion) championFound = true;
      return { ...entry, championRushQualified: qualified, isChampion };
    });
  }, [standings, showToggle, championRushOn, championRushThreshold]);

  async function download(kind: "landscape" | "portrait") {
    const node = kind === "landscape" ? posterRef.current : posterPortraitRef.current;
    if (!node) return;
    setGenerating(kind);
    try {
      await downloadNode(node, `${slug}-resultats-${kind === "landscape" ? "paysage" : "portrait"}.png`);
    } finally {
      setGenerating(null);
    }
  }

  const landscapeScale = PREVIEW_WIDTH / POSTER_WIDTH;
  const portraitScale = PREVIEW_WIDTH / POSTER_WIDTH_PORTRAIT;
  const landscapeRowCount = displayStandings ? Math.max(Math.ceil(displayStandings.length / 2), 1) : 1;
  const portraitRowCount = displayStandings ? Math.max(displayStandings.length, 1) : 1;

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

        {showToggle && (
          <label className="flex w-fit items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={championRushOn}
              onChange={(e) => setChampionRushOn(e.target.checked)}
              className="size-4 rounded border-border accent-primary"
            />
            Afficher Champion Rush (équipes ayant atteint {championRushThreshold} pts)
          </label>
        )}

        {!displayStandings ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : displayStandings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune équipe assignée à un résultat pour le moment — rien à exporter.</p>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label>Aperçu — paysage</Label>
              <div
                className="overflow-hidden rounded-md border border-border"
                style={{ width: PREVIEW_WIDTH, height: posterHeight(landscapeRowCount) * landscapeScale }}
              >
                <div style={{ transform: `scale(${landscapeScale})`, transformOrigin: "top left" }}>
                  <ScrimResultPoster
                    ref={posterRef}
                    title={scrimName}
                    hostedBy={HOSTED_BY}
                    dateLabel={dateLabel}
                    standings={displayStandings}
                    photoDataUrl={photoDataUrl}
                    logoSrc="/brand/logo-light-bg.png"
                    showChampionRush={championRushOn}
                    mapLabel={mapLabel}
                  />
                </div>
              </div>
              <Button onClick={() => download("landscape")} disabled={generating !== null}>
                {generating === "landscape" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                Télécharger (paysage)
              </Button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Aperçu — portrait (A4)</Label>
              <div
                className="overflow-hidden rounded-md border border-border"
                style={{ width: PREVIEW_WIDTH, height: posterHeight(portraitRowCount) * portraitScale }}
              >
                <div style={{ transform: `scale(${portraitScale})`, transformOrigin: "top left" }}>
                  <ScrimResultPosterPortrait
                    ref={posterPortraitRef}
                    title={scrimName}
                    hostedBy={HOSTED_BY}
                    dateLabel={dateLabel}
                    standings={displayStandings}
                    photoDataUrl={photoDataUrl}
                    logoSrc="/brand/logo-light-bg.png"
                    showChampionRush={championRushOn}
                    mapLabel={mapLabel}
                  />
                </div>
              </div>
              <Button onClick={() => download("portrait")} disabled={generating !== null}>
                {generating === "portrait" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                Télécharger (portrait)
              </Button>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}
