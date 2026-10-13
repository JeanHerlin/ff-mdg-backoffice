import { CHAMPION_RUSH, EXPORT_TEXT, PHOTO, PORTRAIT } from "./context";
import { trimTransparentPadding } from "./legacy/canvas-utils";
import { renderDailyScrimsDesign, renderDailyScrimsOneColumnDesign, renderDailyScrimsTwoColSixDesign } from "./legacy/dailyscrims";
import { renderGlassDarkDesign, renderGlassDarkOneColumnDesign, renderGlassDarkTwoColSixDesign } from "./legacy/glassdark";
import { renderGoldLuxuryDesign, renderGoldLuxuryOneColumnDesign, renderGoldLuxuryTwoColSixDesign } from "./legacy/goldluxury";
import { renderMilitaryDesign, renderMilitaryOneColumnDesign, renderMilitaryTwoColSixDesign } from "./legacy/military";
import { renderNeonCyberDesign, renderNeonCyberOneColumnDesign, renderNeonCyberTwoColSixDesign } from "./legacy/neoncyber";
import { renderOrangeStripeDesign, renderOrangeStripeOneColumnDesign, renderOrangeStripeTwoColSixDesign } from "./legacy/orangestripe";
import { renderCurrentPageDesign, renderPodiumCardDesign } from "./legacy/podium";
import { renderRankTableDesign, renderRankTableOneColumnDesign, renderRankTableTwoColSixDesign } from "./legacy/ranktable";
import { renderRedBlackDesign, renderRedBlackOneColumnDesign, renderRedBlackTwoColSixDesign } from "./legacy/redblack";
import { renderResultadoDesign, renderResultadoOneColumnDesign, renderResultadoTwoColSixDesign } from "./legacy/resultado";
import {
  renderGreenTableDesign,
  renderGreenTableOneColumnDesign,
  renderGreenTableTwoColSixDesign,
  renderResultTableDesign,
  renderResultTableOneColumnDesign,
  renderResultTableTwoColSixDesign,
} from "./legacy/resulttable-green";
import { renderSwissGridDesign, renderSwissGridOneColumnDesign, renderSwissGridTwoColSixDesign } from "./legacy/swissgrid";
import { renderTerminalDesign, renderTerminalOneColumnDesign, renderTerminalTwoColSixDesign } from "./legacy/terminal";
import { renderWhiteCardDesign, renderWhiteCardOneColumnDesign, renderWhiteCardTwoColSixDesign } from "./legacy/whitecard";

/* ---------------------------------------------------------------------------
   Données d'entrée
--------------------------------------------------------------------------- */

/** Une ligne du classement à exporter — même forme que les endpoints /standings. */
export interface ExportStanding {
  teamId: string;
  name: string;
  tag?: string | null;
  logoUrl: string | null;
  matchesPlayed: number;
  totalKills: number;
  totalPlacementPoints: number;
  totalKillPoints?: number;
  booyahCount: number;
  totalPoints: number;
  // Un point par match confirmé, dans l'ordre chronologique — sert uniquement
  // au calcul Champion Rush (absent pour un export d'un seul match).
  matches?: { matchNumber: number; points: number; booyah: boolean }[];
}

interface MatchTeamResultLike {
  placement: number;
  totalKills: number;
  placementPoints: number;
  killPoints: number;
  points: number;
  team: { id: string; name: string; tag?: string | null; logoUrl: string | null } | null;
}

/** Classement d'un seul match (export "par match") — équipes résolues uniquement. */
export function standingsFromMatch(teamResults: MatchTeamResultLike[]): ExportStanding[] {
  return teamResults
    .filter((tr): tr is MatchTeamResultLike & { team: NonNullable<MatchTeamResultLike["team"]> } => !!tr.team)
    .map((tr) => ({
      teamId: tr.team.id,
      name: tr.team.name,
      tag: tr.team.tag ?? null,
      logoUrl: tr.team.logoUrl,
      matchesPlayed: 1,
      totalKills: tr.totalKills,
      totalPlacementPoints: tr.placementPoints,
      totalKillPoints: tr.killPoints,
      booyahCount: tr.placement === 1 ? 1 : 0,
      totalPoints: tr.points,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

/* ---------------------------------------------------------------------------
   Thèmes et formats
--------------------------------------------------------------------------- */

export type TableThemeId =
  | "ranktable"
  | "resulttable"
  | "greentable"
  | "dailyscrims"
  | "resultado"
  | "neoncyber"
  | "military"
  | "glassdark"
  | "orangestripe"
  | "whitecard"
  | "redblack"
  | "terminal"
  | "goldluxury"
  | "swissgrid";
export type PodiumThemeId = "podiumcard" | "livepage";
export type ResultThemeId = TableThemeId | PodiumThemeId;

export type ResultFormat = "9+9" | "6+6" | "12" | "portrait" | "landscape";

export interface ResultTheme {
  id: ResultThemeId;
  label: string;
  kind: "table" | "podium";
  // Deux couleurs pour la vignette de choix (fond, accent).
  swatch: [string, string];
}

export const RESULT_THEMES: ResultTheme[] = [
  { id: "ranktable", label: "Rank Table", kind: "table", swatch: ["#0a0a14", "#73c879"] },
  { id: "resulttable", label: "Result Table", kind: "table", swatch: ["#0a0906", "#8fd331"] },
  { id: "greentable", label: "Green Table", kind: "table", swatch: ["#070a05", "#8fd331"] },
  { id: "dailyscrims", label: "Daily Scrims", kind: "table", swatch: ["#141B2D", "#FF8C00"] },
  { id: "resultado", label: "Resultado Brutalist", kind: "table", swatch: ["#ffffff", "#0a0a0a"] },
  { id: "neoncyber", label: "Neon Cyber Dark", kind: "table", swatch: ["#060B14", "#00FFFF"] },
  { id: "military", label: "Military Tactical", kind: "table", swatch: ["#1A1F0F", "#D4E09B"] },
  { id: "glassdark", label: "Glassmorphism Dark", kind: "table", swatch: ["#0d1020", "#A78BFA"] },
  { id: "orangestripe", label: "Orange Stripe", kind: "table", swatch: ["#111111", "#FF8C00"] },
  { id: "whitecard", label: "White Card Clean", kind: "table", swatch: ["#ffffff", "#111111"] },
  { id: "redblack", label: "Red/Black Aggressive", kind: "table", swatch: ["#0E0000", "#DC2626"] },
  { id: "terminal", label: "Terminal / CLI", kind: "table", swatch: ["#0C0C0C", "#28C840"] },
  { id: "goldluxury", label: "Gold Luxury", kind: "table", swatch: ["#1a1200", "#d4a72c"] },
  { id: "swissgrid", label: "Swiss Grid", kind: "table", swatch: ["#F4F1EC", "#111111"] },
  { id: "podiumcard", label: "Champion Card (Top 3)", kind: "podium", swatch: ["#0b1220", "#c7f08a"] },
  { id: "livepage", label: "Podium Page (Top 3)", kind: "podium", swatch: ["#0a0e16", "#2ecc71"] },
];

export interface ResultFormatOption {
  id: ResultFormat;
  label: string;
  hint: string;
  orientation: "landscape" | "portrait";
}

export function formatsFor(theme: ResultThemeId): ResultFormatOption[] {
  const portrait: ResultFormatOption = {
    id: "portrait",
    label: "Portrait",
    hint: "Une colonne, hauteur selon le nombre d'équipes",
    orientation: "portrait",
  };
  if (themeKind(theme) === "podium") {
    return [{ id: "landscape", label: "Paysage", hint: "Top 3", orientation: "landscape" }, portrait];
  }
  return [
    { id: "9+9", label: "Paysage 9+9", hint: "2 colonnes, 18 équipes par image", orientation: "landscape" },
    { id: "6+6", label: "Paysage 6+6", hint: "2 colonnes, 12 équipes par image", orientation: "landscape" },
    { id: "12", label: "Une colonne", hint: "12 équipes par image", orientation: "landscape" },
    portrait,
  ];
}

function themeKind(theme: ResultThemeId) {
  return RESULT_THEMES.find((t) => t.id === theme)?.kind ?? "table";
}

// Signature commune des renderers "tableau" d'origine (les variantes 9+9
// acceptent en plus des paramètres internes facultatifs, d'où le reste).
type TableArgs = [
  ranks: LegacyRank[],
  logos: (HTMLImageElement | null)[],
  champRush: boolean,
  tourneyLogo: HTMLImageElement | null,
  resultDateLabel: string,
  startIndex: number,
  pageLabel: string,
  sponsorLogos: HTMLImageElement[],
];
type TableRenderer = (...args: [...TableArgs, ...unknown[]]) => HTMLCanvasElement;

const TABLE_RENDERERS: Record<TableThemeId, Record<"9+9" | "6+6" | "12", TableRenderer>> = {
  ranktable: { "9+9": renderRankTableDesign, "6+6": renderRankTableTwoColSixDesign, "12": renderRankTableOneColumnDesign },
  resulttable: { "9+9": renderResultTableDesign, "6+6": renderResultTableTwoColSixDesign, "12": renderResultTableOneColumnDesign },
  greentable: { "9+9": renderGreenTableDesign, "6+6": renderGreenTableTwoColSixDesign, "12": renderGreenTableOneColumnDesign },
  dailyscrims: { "9+9": renderDailyScrimsDesign, "6+6": renderDailyScrimsTwoColSixDesign, "12": renderDailyScrimsOneColumnDesign },
  resultado: { "9+9": renderResultadoDesign, "6+6": renderResultadoTwoColSixDesign, "12": renderResultadoOneColumnDesign },
  neoncyber: { "9+9": renderNeonCyberDesign, "6+6": renderNeonCyberTwoColSixDesign, "12": renderNeonCyberOneColumnDesign },
  military: { "9+9": renderMilitaryDesign, "6+6": renderMilitaryTwoColSixDesign, "12": renderMilitaryOneColumnDesign },
  glassdark: { "9+9": renderGlassDarkDesign, "6+6": renderGlassDarkTwoColSixDesign, "12": renderGlassDarkOneColumnDesign },
  orangestripe: { "9+9": renderOrangeStripeDesign, "6+6": renderOrangeStripeTwoColSixDesign, "12": renderOrangeStripeOneColumnDesign },
  whitecard: { "9+9": renderWhiteCardDesign, "6+6": renderWhiteCardTwoColSixDesign, "12": renderWhiteCardOneColumnDesign },
  redblack: { "9+9": renderRedBlackDesign, "6+6": renderRedBlackTwoColSixDesign, "12": renderRedBlackOneColumnDesign },
  terminal: { "9+9": renderTerminalDesign, "6+6": renderTerminalTwoColSixDesign, "12": renderTerminalOneColumnDesign },
  goldluxury: { "9+9": renderGoldLuxuryDesign, "6+6": renderGoldLuxuryTwoColSixDesign, "12": renderGoldLuxuryOneColumnDesign },
  swissgrid: { "9+9": renderSwissGridDesign, "6+6": renderSwissGridTwoColSixDesign, "12": renderSwissGridOneColumnDesign },
};

// Nombre maximum d'équipes par image — au-delà, l'export produit plusieurs
// images (le classement continue : l'équipe 13 garde le rang #13).
const PAGE_SIZES: Record<ResultFormat, number> = {
  "9+9": 18,
  "6+6": 12,
  "12": 12,
  // Portrait : comme l'affiche FF MDG, toutes les équipes sur une seule image
  // (voir renderResultPages, la taille réelle est le nombre d'équipes).
  portrait: 0,
  landscape: 3,
};

/* ---------------------------------------------------------------------------
   Champion Rush
--------------------------------------------------------------------------- */

// Le Champion Rush doit déjà être ACTIF (seuil de points déjà franchi) au
// moment du Booyah — un Booyah gagné avant ou pendant le match qui fait
// franchir le seuil ne compte pas, seul un Booyah dans un match strictement
// postérieur. Retourne le numéro (global) de ce match qualifiant, ou null.
function championEligibleFromMatch(
  matches: { matchNumber: number; points: number; booyah: boolean }[],
  threshold: number
): number | null {
  let running = 0;
  let crossingMatchNumber: number | null = null;
  for (const m of matches) {
    running += m.points;
    if (crossingMatchNumber === null && running >= threshold) crossingMatchNumber = m.matchNumber;
  }
  if (crossingMatchNumber === null) return null;

  let eligibleAt: number | null = null;
  for (const m of matches) {
    if (!m.booyah || m.matchNumber <= crossingMatchNumber) continue;
    if (eligibleAt === null || m.matchNumber < eligibleAt) eligibleAt = m.matchNumber;
  }
  return eligibleAt;
}

/**
 * LA championne est celle qui est devenue éligible EN PREMIER
 * chronologiquement (plus petit numéro de match), jamais celle qui a le plus
 * de points au moment de l'export.
 */
export function findChampionId(standings: ExportStanding[], threshold: number): string | null {
  let champion: { id: string; at: number } | null = null;
  for (const s of standings) {
    if (s.totalPoints < threshold) continue;
    const at = championEligibleFromMatch(s.matches ?? [], threshold);
    if (at !== null && (!champion || at < champion.at)) champion = { id: s.teamId, at };
  }
  return champion?.id ?? null;
}

/* ---------------------------------------------------------------------------
   Rendu
--------------------------------------------------------------------------- */

export interface ResultExportOptions {
  theme: ResultThemeId;
  format: ResultFormat;
  title: string;
  subtitle: string;
  slogan: string;
  dateLabel: string;
  /** Seuil Champion Rush, ou null si désactivé. */
  championRushThreshold: number | null;
  photoSrc: string | null;
  sponsorLogoSrcs: string[];
  tourneyLogoSrc: string;
}

interface LegacyRank {
  team: { id: string; name: string };
  matches: number;
  totalKills: number;
  placementPts: number;
  killPts: number;
  wins: number;
  totalPoints: number;
}

function toLegacyRank(s: ExportStanding): LegacyRank {
  return {
    team: { id: s.teamId, name: s.name },
    matches: s.matchesPlayed,
    totalKills: s.totalKills,
    placementPts: s.totalPlacementPoints,
    killPts: s.totalKillPoints ?? s.totalPoints - s.totalPlacementPoints,
    wins: s.booyahCount,
    totalPoints: s.totalPoints,
  };
}

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

// Les logos viennent de Cloudinary (autre origine) : sans crossOrigin, le
// canvas serait "teinté" et toBlob() échouerait. Un logo qui ne charge pas
// retombe simplement sur l'initiale de l'équipe (voir les renderers).
export function loadImage(src: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  const cached = imageCache.get(src);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    if (!src.startsWith("data:") && !src.startsWith("blob:")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  // Un échec n'est pas mis en cache durablement (réseau passager).
  promise.then((img) => {
    if (!img) imageCache.delete(src);
  });
  imageCache.set(src, promise);
  return promise;
}

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Rajdhani:ital,wght@0,500;0,600;0,700;1,700&display=swap";
let fontsReady: Promise<void> | null = null;

// Les renderers d'origine dessinent en "Rajdhani" / "Inter" : sans ces
// polices chargées, le canvas retombe silencieusement sur une police système
// (et la mise en page des colonnes change d'une machine à l'autre).
function ensureFonts(): Promise<void> {
  if (fontsReady) return fontsReady;
  fontsReady = (async () => {
    if (!document.querySelector(`link[href="${FONTS_HREF}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = FONTS_HREF;
      document.head.appendChild(link);
      await new Promise<void>((resolve) => {
        link.onload = () => resolve();
        link.onerror = () => resolve();
      });
    }
    const faces = [
      "500 16px Rajdhani",
      "600 16px Rajdhani",
      "700 16px Rajdhani",
      "italic 700 16px Rajdhani",
      "400 16px Inter",
      "600 16px Inter",
      "700 16px Inter",
      "800 16px Inter",
      "900 16px Inter",
    ];
    await Promise.all(faces.map((f) => document.fonts.load(f).catch(() => [])));
  })();
  return fontsReady;
}

function prepareContext(opts: ResultExportOptions, standings: ExportStanding[]) {
  EXPORT_TEXT.title = opts.title;
  EXPORT_TEXT.subtitle = opts.subtitle;
  EXPORT_TEXT.slogan = opts.slogan;
  EXPORT_TEXT.date = opts.dateLabel;
  EXPORT_TEXT.matchCount = Math.max(0, ...standings.map((s) => s.matchesPlayed));

  CHAMPION_RUSH.on = opts.championRushThreshold != null;
  CHAMPION_RUSH.threshold = opts.championRushThreshold ?? 80;
  CHAMPION_RUSH.championIds = new Set();
  if (opts.championRushThreshold != null) {
    const championId = findChampionId(standings, opts.championRushThreshold);
    if (championId) CHAMPION_RUSH.championIds.add(championId);
  }
}

function resetContext() {
  PHOTO.img = null;
  PORTRAIT.on = false;
  CHAMPION_RUSH.on = false;
  CHAMPION_RUSH.championIds = new Set();
}

// Podiums (Top 3) : pas de lignes à empiler, le portrait pose l'image
// d'origine sur un canvas 1000×1250 — fond = la même image floutée en
// "cover", puis l'image en "contain", centrée.
const PODIUM_PORTRAIT_HEIGHT = 1250;

function composePortrait(source: HTMLCanvasElement): HTMLCanvasElement {
  const W = PORTRAIT.width;
  const H = PODIUM_PORTRAIT_HEIGHT;
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const ctx = out.getContext("2d")!;

  const cover = Math.max(W / source.width, H / source.height);
  ctx.save();
  ctx.filter = "blur(28px) brightness(0.55)";
  const cw = source.width * cover;
  const ch = source.height * cover;
  ctx.drawImage(source, (W - cw) / 2, (H - ch) / 2, cw, ch);
  ctx.restore();

  const contain = Math.min(W / source.width, H / source.height, 1);
  const w = source.width * contain;
  const h = source.height * contain;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, (W - w) / 2, (H - h) / 2, w, h);
  return out;
}

export interface RenderedPage {
  canvas: HTMLCanvasElement;
  label: string;
}

/** Rend toutes les images (une par "page" d'équipes) pour le thème/format choisis. */
export async function renderResultPages(
  standings: ExportStanding[],
  opts: ResultExportOptions
): Promise<RenderedPage[]> {
  if (standings.length === 0) return [];
  await ensureFonts();

  const ordered = [...standings].sort((a, b) => b.totalPoints - a.totalPoints);
  const [logos, tourneyLogo, photo, sponsorLogos] = await Promise.all([
    Promise.all(ordered.map((s) => loadImage(s.logoUrl))),
    loadImage(opts.tourneyLogoSrc),
    loadImage(opts.photoSrc),
    Promise.all(opts.sponsorLogoSrcs.map((src) => loadImage(src))),
  ]);
  const sponsors = sponsorLogos.filter((img): img is HTMLImageElement => !!img);
  const ranks = ordered.map(toLegacyRank);

  prepareContext(opts, ordered);
  PHOTO.img = trimTransparentPadding(photo);
  const champRush = CHAMPION_RUSH.on;

  try {
    if (themeKind(opts.theme) === "podium") {
      const top = ranks.slice(0, 3);
      const topLogos = logos.slice(0, 3);
      const canvas =
        opts.theme === "livepage"
          ? renderCurrentPageDesign(top, topLogos, champRush, tourneyLogo, opts.dateLabel, sponsors)
          : renderPodiumCardDesign(ranks, logos, champRush, tourneyLogo, opts.dateLabel, sponsors);
      return [{ canvas: opts.format === "portrait" ? composePortrait(canvas) : canvas, label: "" }];
    }

    const theme = opts.theme as TableThemeId;
    const renderers = TABLE_RENDERERS[theme] ?? TABLE_RENDERERS.ranktable;
    const layout = opts.format === "portrait" ? "12" : (opts.format as "9+9" | "6+6" | "12");
    const render = renderers[layout] ?? renderers["9+9"];
    const pageSize = opts.format === "portrait" ? Math.max(ranks.length, 1) : (PAGE_SIZES[opts.format] ?? 18);
    const totalPages = Math.max(1, Math.ceil(ranks.length / pageSize));

    const pages: RenderedPage[] = [];
    for (let p = 0; p < totalPages; p++) {
      const start = p * pageSize;
      const pageRanks = ranks.slice(start, start + pageSize);
      const pageLabel = totalPages > 1 ? `PART ${p + 1}/${totalPages}` : "";
      const args: TableArgs = [
        pageRanks,
        logos.slice(start, start + pageSize),
        champRush,
        tourneyLogo,
        opts.dateLabel,
        start,
        pageLabel,
        sponsors,
      ];
      PORTRAIT.on = opts.format === "portrait";
      const canvas = render(...args);
      pages.push({ canvas, label: pageLabel });
    }
    return pages;
  } finally {
    resetContext();
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export async function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const blob = await canvasToBlob(canvas);
  if (!blob) throw new Error("canvas export failed");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function slugify(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "resultats"
  );
}
