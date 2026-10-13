"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { ChevronLeft, ChevronRight, Crown, Download, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import {
  downloadCanvas,
  ExportStanding,
  findChampionId,
  formatsFor,
  RESULT_THEMES,
  renderResultPages,
  ResultFormat,
  ResultFormatOption,
  ResultThemeId,
  slugify,
} from "@/lib/result-export";
import {
  POSTER_HEIGHT_LANDSCAPE,
  POSTER_WIDTH,
  POSTER_WIDTH_PORTRAIT,
  PosterStandingEntry,
  posterHeight,
  ScrimResultPoster,
  ScrimResultPosterPortrait,
} from "./ff-mdg-poster";

// Thème maison (affiche FF Madagascar 1920×1080 pour OBS + portrait), rendu
// en HTML puis capturé — tous les autres thèmes sont dessinés sur canvas
// (portage du moteur PHP, voir lib/result-export).
const FF_MDG_THEME = "ffmdg" as const;
type ThemeChoice = ResultThemeId | typeof FF_MDG_THEME;

const FF_MDG_FORMATS: ResultFormatOption[] = [
  { id: "landscape", label: "Paysage", hint: "1920×1080 — écran OBS", orientation: "landscape" },
  { id: "portrait", label: "Portrait", hint: "Hauteur selon le nombre d'équipes", orientation: "portrait" },
];

const HOSTED_BY = "FF Madagascar E-Sport";
const TOURNEY_LOGO = "/brand/logo-dark-bg.png";
const STORAGE_KEY = "ff-mdg:result-export";

export interface ResultExportModalProps {
  open: boolean;
  onClose: () => void;
  /** null pendant le chargement. */
  standings: ExportStanding[] | null;
  /** Valeurs par défaut des champs texte, modifiables dans le modal. */
  title: string;
  subtitle?: string;
  /** Étiquette "MAP: ..." de l'affiche FF MDG — export d'un seul match. */
  matchLabel?: string;
  dateIso: string;
  fileBaseName: string;
  /**
   * Le Champion Rush porte sur un cumul de points : proposé seulement pour un
   * classement sur plusieurs matchs, jamais pour l'export d'un match seul.
   */
  championRush?: { defaultOn?: boolean; defaultThreshold?: number | null } | null;
}

function formatDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function readFileAsDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function loadPreferences(): { theme?: ThemeChoice; format?: ResultFormat } {
  try {
    const prefs = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as { theme?: ThemeChoice; format?: ResultFormat };
    // Un thème retiré depuis (ex. SGS) ne doit pas rester sélectionné.
    const known = prefs.theme === FF_MDG_THEME || RESULT_THEMES.some((t) => t.id === prefs.theme);
    return known ? prefs : {};
  } catch {
    return {};
  }
}

function savePreferences(theme: ThemeChoice, format: ResultFormat) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, format }));
  } catch {
    // préférence de confort uniquement
  }
}

function formatsForChoice(theme: ThemeChoice): ResultFormatOption[] {
  return theme === FF_MDG_THEME ? FF_MDG_FORMATS : formatsFor(theme);
}

export function ResultExportModal(props: ResultExportModalProps) {
  // Monté uniquement quand il est ouvert : chaque ouverture repart des
  // valeurs par défaut fournies par la page (titre, date, classement...).
  if (!props.open) return null;
  return <ResultExportModalBody {...props} />;
}

interface PreviewPage {
  url: string;
  width: number;
  height: number;
  label: string;
}

function ResultExportModalBody({
  onClose,
  standings,
  title: defaultTitle,
  subtitle: defaultSubtitle = "",
  matchLabel,
  dateIso,
  fileBaseName,
  championRush,
}: ResultExportModalProps) {
  const [theme, setTheme] = useState<ThemeChoice>(() => loadPreferences().theme ?? FF_MDG_THEME);
  const [format, setFormat] = useState<ResultFormat>(() => {
    const prefs = loadPreferences();
    const allowed = formatsForChoice(prefs.theme ?? FF_MDG_THEME).map((f) => f.id);
    return prefs.format && allowed.includes(prefs.format) ? prefs.format : allowed[0];
  });
  const [title, setTitle] = useState(defaultTitle);
  const [subtitle, setSubtitle] = useState(defaultSubtitle);
  const [slogan, setSlogan] = useState("");
  const [dateLabel, setDateLabel] = useState(() => formatDateLabel(dateIso));
  const [championOn, setChampionOn] = useState(!!championRush?.defaultOn);
  const [threshold, setThreshold] = useState(String(championRush?.defaultThreshold ?? 80));
  const [photo, setPhoto] = useState<string | null>(null);
  const [sponsors, setSponsors] = useState<string[]>([]);

  const formats = formatsForChoice(theme);
  const thresholdValue = Number(threshold);
  const championThreshold =
    championRush && championOn && Number.isFinite(thresholdValue) && thresholdValue > 0 ? thresholdValue : null;

  function chooseTheme(next: ThemeChoice) {
    setTheme(next);
    const allowed = formatsForChoice(next);
    // Garde l'orientation choisie si le nouveau thème la propose.
    const sameId = allowed.find((f) => f.id === format);
    const current = formats.find((f) => f.id === format);
    const sameOrientation = allowed.find((f) => f.orientation === current?.orientation);
    const nextFormat = (sameId ?? sameOrientation ?? allowed[0]).id;
    setFormat(nextFormat);
    savePreferences(next, nextFormat);
  }

  function chooseFormat(next: ResultFormat) {
    setFormat(next);
    savePreferences(theme, next);
  }

  async function addSponsors(files: FileList | null) {
    if (!files) return;
    const urls = await Promise.all([...files].map(readFileAsDataUrl));
    setSponsors((prev) => [...prev, ...urls.filter((u): u is string => !!u)]);
  }

  /* ---------------- aperçu des thèmes canvas ---------------- */
  const canvasesRef = useRef<HTMLCanvasElement[]>([]);
  const [pages, setPages] = useState<PreviewPage[]>([]);
  const [renderedKey, setRenderedKey] = useState<string | null>(null);
  const [renderError, setRenderError] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);

  const renderKey = JSON.stringify({
    theme,
    format,
    title,
    subtitle,
    slogan,
    dateLabel,
    championThreshold,
    photo: photo?.length ?? 0,
    sponsors: sponsors.map((s) => s.length),
    standings: standings?.length ?? -1,
  });

  useEffect(() => {
    if (theme === FF_MDG_THEME || !standings || standings.length === 0) return;
    let cancelled = false;
    const handle = setTimeout(() => {
      renderResultPages(standings, {
        theme,
        format,
        title,
        subtitle,
        slogan,
        dateLabel,
        championRushThreshold: championThreshold,
        photoSrc: photo,
        sponsorLogoSrcs: sponsors,
        tourneyLogoSrc: TOURNEY_LOGO,
      })
        .then((rendered) => {
          if (cancelled) return;
          canvasesRef.current = rendered.map((p) => p.canvas);
          setPages(
            rendered.map((p) => ({
              url: p.canvas.toDataURL("image/png"),
              width: p.canvas.width,
              height: p.canvas.height,
              label: p.label,
            }))
          );
          setPageIndex(0);
          setRenderError(false);
          setRenderedKey(renderKey);
        })
        .catch((err) => {
          console.error("result export render failed", err);
          if (cancelled) return;
          setRenderError(true);
          setRenderedKey(renderKey);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // renderKey résume toutes les entrées du rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderKey]);

  const rendering = theme !== FF_MDG_THEME && !!standings?.length && renderedKey !== renderKey;

  /* ---------------- thème FF MDG (HTML capturé) ---------------- */
  const posterRef = useRef<HTMLDivElement>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(600);

  useEffect(() => {
    const node = previewBoxRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setPreviewWidth(Math.max(240, entry.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const posterStandings = useMemo<PosterStandingEntry[] | null>(() => {
    if (!standings) return null;
    const championId = championThreshold != null ? findChampionId(standings, championThreshold) : null;
    return [...standings]
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((s) => ({
        name: s.name,
        tag: s.tag ?? null,
        logoUrl: s.logoUrl,
        matchesPlayed: s.matchesPlayed,
        totalKills: s.totalKills,
        totalPlacementPoints: s.totalPlacementPoints,
        booyahCount: s.booyahCount,
        totalPoints: s.totalPoints,
        championRushQualified: championThreshold != null && s.totalPoints >= championThreshold,
        isChampion: s.teamId === championId,
      }));
  }, [standings, championThreshold]);

  const posterWidth = format === "portrait" ? POSTER_WIDTH_PORTRAIT : POSTER_WIDTH;
  const hasChampion = posterStandings?.some((e) => e.isChampion) ?? false;
  const posterH =
    format === "portrait"
      ? posterHeight(Math.max(posterStandings?.length ?? 1, 1), hasChampion)
      : POSTER_HEIGHT_LANDSCAPE;
  const posterScale = previewWidth / posterWidth;

  /* ---------------- téléchargement ---------------- */
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const baseName = `${slugify(fileBaseName)}-${theme}-${format.replace("+", "x")}`;

  async function download() {
    setDownloading(true);
    setDownloadError(null);
    try {
      if (theme === FF_MDG_THEME) {
        if (!posterRef.current) return;
        const dataUrl = await toPng(posterRef.current, { pixelRatio: 2, cacheBust: true });
        const link = document.createElement("a");
        link.download = `${baseName}.png`;
        link.href = dataUrl;
        link.click();
        return;
      }
      const canvases = canvasesRef.current;
      for (let i = 0; i < canvases.length; i++) {
        const suffix = canvases.length > 1 ? `-part${i + 1}of${canvases.length}` : "";
        await downloadCanvas(canvases[i], `${baseName}${suffix}.png`);
        // Petit délai : certains navigateurs bloquent une rafale de téléchargements.
        if (i < canvases.length - 1) await new Promise((r) => setTimeout(r, 400));
      }
    } catch (err) {
      console.error("result export download failed", err);
      setDownloadError("L'image n'a pas pu être générée. Réessayez, ou retirez la photo / un logo qui pose problème.");
    } finally {
      setDownloading(false);
    }
  }

  const empty = standings !== null && standings.length === 0;
  const canDownload =
    !empty && standings !== null && !downloading && (theme === FF_MDG_THEME || (!rendering && !renderError && pages.length > 0));
  const imageCount = theme === FF_MDG_THEME ? 1 : pages.length;
  const page = pages[Math.min(pageIndex, pages.length - 1)];

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title="Exporter les résultats"
      description="Choisissez un thème et un format, ajustez les textes, puis téléchargez l'image."
      footer={
        <>
          {downloadError && <p className="mr-auto text-xs text-accent">{downloadError}</p>}
          {!downloadError && imageCount > 1 && (
            <p className="mr-auto text-xs text-muted-foreground">{imageCount} images seront téléchargées.</p>
          )}
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={download} disabled={!canDownload}>
            {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {imageCount > 1 ? `Télécharger les ${imageCount} images` : "Télécharger (PNG)"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col lg:h-full lg:flex-row">
        {/* ---------- aperçu ---------- */}
        <section className="flex flex-col gap-3 bg-muted/40 p-4 lg:order-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aperçu</p>
            {theme !== FF_MDG_THEME && pages.length > 1 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Button
                  size="icon"
                  variant="outline"
                  className="size-7"
                  disabled={pageIndex === 0}
                  onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="px-1">
                  Image {pageIndex + 1} / {pages.length}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-7"
                  disabled={pageIndex >= pages.length - 1}
                  onClick={() => setPageIndex((i) => Math.min(pages.length - 1, i + 1))}
                  aria-label="Image suivante"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>

          <div ref={previewBoxRef} className="relative w-full">
            {standings === null ? (
              <PreviewPlaceholder>
                <Loader2 className="size-5 animate-spin" />
              </PreviewPlaceholder>
            ) : empty ? (
              <PreviewPlaceholder>Aucun résultat confirmé pour le moment — rien à exporter.</PreviewPlaceholder>
            ) : theme === FF_MDG_THEME ? (
              <div
                className="mx-auto overflow-hidden rounded-md border border-border shadow-sm"
                style={{ width: previewWidth, height: posterH * posterScale }}
              >
                <div style={{ transform: `scale(${posterScale})`, transformOrigin: "top left", width: posterWidth }}>
                  {format === "portrait" ? (
                    <ScrimResultPosterPortrait
                      ref={posterRef}
                      title={title}
                      hostedBy={HOSTED_BY}
                      dateLabel={dateLabel}
                      standings={posterStandings ?? []}
                      photoDataUrl={photo}
                      logoSrc={TOURNEY_LOGO}
                      showChampionRush={championThreshold != null}
                      mapLabel={matchLabel}
                    />
                  ) : (
                    <ScrimResultPoster
                      ref={posterRef}
                      title={title}
                      hostedBy={HOSTED_BY}
                      dateLabel={dateLabel}
                      standings={posterStandings ?? []}
                      photoDataUrl={photo}
                      logoSrc={TOURNEY_LOGO}
                      showChampionRush={championThreshold != null}
                      mapLabel={matchLabel}
                    />
                  )}
                </div>
              </div>
            ) : renderError ? (
              <PreviewPlaceholder>L&apos;aperçu n&apos;a pas pu être généré.</PreviewPlaceholder>
            ) : page ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- image générée localement (canvas) */}
                <img
                  src={page.url}
                  alt="Aperçu du résultat exporté"
                  width={page.width}
                  height={page.height}
                  className={cn(
                    "mx-auto h-auto max-h-[45vh] w-auto max-w-full rounded-md border border-border shadow-sm transition-opacity lg:max-h-[calc(90vh-12rem)]",
                    rendering && "opacity-50"
                  )}
                />
                {rendering && (
                  <Loader2 className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 animate-spin text-primary" />
                )}
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {page.width}×{page.height} px{page.label ? ` · ${page.label}` : ""}
                </p>
              </div>
            ) : (
              <PreviewPlaceholder>
                <Loader2 className="size-5 animate-spin" />
              </PreviewPlaceholder>
            )}
          </div>
        </section>

        {/* ---------- réglages ---------- */}
        <aside className="flex flex-col gap-6 border-t border-border p-4 lg:order-1 lg:w-[400px] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-t-0">
          <Field label="Thème">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
              <ThemeTile
                label="FF MDG Officiel"
                swatch={["#1B2438", "#4bb805"]}
                selected={theme === FF_MDG_THEME}
                onClick={() => chooseTheme(FF_MDG_THEME)}
              />
              {RESULT_THEMES.map((t) => (
                <ThemeTile
                  key={t.id}
                  label={t.label}
                  swatch={t.swatch}
                  podium={t.kind === "podium"}
                  selected={theme === t.id}
                  onClick={() => chooseTheme(t.id)}
                />
              ))}
            </div>
          </Field>

          <Field label="Format">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {formats.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => chooseFormat(f.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                    format === f.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 rounded-sm border-2",
                      format === f.id ? "border-primary" : "border-muted-foreground/50",
                      f.orientation === "portrait" ? "h-6 w-5" : "h-5 w-7"
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{f.label}</span>
                    <span className="block text-xs text-muted-foreground">{f.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </Field>

          {championRush && (
            <Field label="Champion Rush">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={championOn}
                  onChange={(e) => setChampionOn(e.target.checked)}
                  className="size-4 rounded border-border accent-primary"
                />
                <Crown className="size-4 text-primary" />
                Afficher le Champion Rush (couronnes)
              </label>
              {championOn && (
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-24"
                    aria-label="Seuil de points"
                  />
                  <span className="text-xs text-muted-foreground">
                    points — la championne est la 1re équipe à faire Booyah après avoir atteint ce seuil.
                  </span>
                </div>
              )}
            </Field>
          )}

          <Field label="Textes">
            <div className="flex flex-col gap-3">
              <TextField id="export-title" label="Titre" value={title} onChange={setTitle} />
              <TextField id="export-subtitle" label="Sous-titre" value={subtitle} onChange={setSubtitle} placeholder="ex. Phase de groupes · Groupe A" />
              <TextField id="export-slogan" label="Slogan (pied de page)" value={slogan} onChange={setSlogan} placeholder="facultatif" />
              <TextField id="export-date" label="Date affichée" value={dateLabel} onChange={setDateLabel} />
            </div>
            {theme === FF_MDG_THEME && (
              <p className="mt-2 text-xs text-muted-foreground">
                L&apos;affiche FF MDG n&apos;utilise que le titre et la date.
              </p>
            )}
          </Field>

          <Field label="Photo du joueur (facultative)">
            {photo ? (
              <div className="relative w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local, jamais envoyé au serveur */}
                <img src={photo} alt="" className="h-28 w-20 rounded-md border border-border object-cover" />
                <RemoveButton onClick={() => setPhoto(null)} label="Retirer la photo" />
              </div>
            ) : (
              <UploadButton
                label="Choisir une photo (PNG détouré conseillé)"
                onFiles={async (files) => setPhoto(files?.[0] ? await readFileAsDataUrl(files[0]) : null)}
              />
            )}
          </Field>

          {theme !== FF_MDG_THEME && (
            <Field label="Logos partenaires (facultatifs)">
              <div className="flex flex-wrap items-center gap-2">
                {sponsors.map((src, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local */}
                    <img src={src} alt="" className="size-12 rounded-full border border-border object-cover" />
                    <RemoveButton
                      onClick={() => setSponsors((prev) => prev.filter((_, j) => j !== i))}
                      label="Retirer ce logo"
                    />
                  </div>
                ))}
                <UploadButton label="Ajouter" multiple onFiles={addSponsors} />
              </div>
            </Field>
          )}

          <p className="text-xs text-muted-foreground">
            Photo et logos ne sont jamais envoyés ni sauvegardés — utilisés uniquement pour générer l&apos;image.
          </p>
        </aside>
      </div>
    </Modal>
  );
}

function PreviewPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-border px-4 text-center text-sm text-muted-foreground lg:h-80">
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={80} />
    </div>
  );
}

function ThemeTile({
  label,
  swatch,
  selected,
  podium,
  onClick,
}: {
  label: string;
  swatch: [string, string];
  selected: boolean;
  podium?: boolean;
  onClick: () => void;
}) {
  const [bg, accent] = swatch;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border p-1.5 text-left transition-colors",
        selected ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"
      )}
    >
      {/* Vignette schématique : fond + bandeau titre + lignes du tableau */}
      <span className="flex h-14 w-full flex-col gap-1 overflow-hidden rounded-md p-1.5" style={{ background: bg }}>
        <span className="mx-auto h-1.5 w-1/2 rounded-full" style={{ background: accent }} />
        {podium ? (
          <span className="mt-auto flex items-end justify-center gap-1">
            <span className="h-3 w-3 rounded-sm opacity-70" style={{ background: accent }} />
            <span className="h-5 w-3 rounded-sm" style={{ background: accent }} />
            <span className="h-2 w-3 rounded-sm opacity-50" style={{ background: accent }} />
          </span>
        ) : (
          [0.9, 0.55, 0.4, 0.3].map((opacity, i) => (
            <span key={i} className="h-1.5 w-full rounded-sm" style={{ background: accent, opacity: opacity * 0.6 }} />
          ))
        )}
      </span>
      <span className="truncate px-0.5 text-xs font-medium text-foreground">{label}</span>
    </button>
  );
}

function UploadButton({
  label,
  multiple,
  onFiles,
}: {
  label: string;
  multiple?: boolean;
  onFiles: (files: FileList | null) => void;
}) {
  return (
    <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary">
      <ImagePlus className="size-4 shrink-0" />
      {label}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground shadow"
      aria-label={label}
    >
      <X className="size-3.5" />
    </button>
  );
}
