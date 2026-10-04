"use client";

import { forwardRef } from "react";
import { Crosshair, Crown, Flag, Target } from "lucide-react";

// Couleur d'accent — alignée sur le vert principal du backoffice (--primary,
// voir globals.css), remplace l'orange de la première maquette "Daily" à la
// demande du client ("rester sur la couleur verte comme dans le backoffice
// de base"). NAVY reste la couleur de fond sombre, inchangée.
const BRAND_GREEN = "#4bb805";
const NAVY = "#1B2438";
// Légèrement transparent — si la photo déborde sous le tableau (voir les
// deux composants plus bas), elle reste devinable derrière sans jamais nuire
// à la lisibilité du texte (blanc, fortement contrasté même à 90% d'opacité).
const ROW_BG = "rgba(20,28,46,0.92)";
// Ligne d'une équipe championne (Booyah + seuil Champion Rush atteint) — fond
// plein (pas de superposition transparente sur ROW_BG, ça donnait un brun
// terne où le texte blanc/ambre devenait illisible) : voir ResultTable, tout
// le texte de cette ligne bascule sur CHAMPION_ROW_TEXT au lieu des couleurs
// habituelles (blanc/gris/ambre) pour rester lisible sur ce fond clair.
const CHAMPION_ROW_BG = "#E3C468";
const CHAMPION_ROW_TEXT = "#3D2B05";
const CHAMPION_ROW_MUTED = "rgba(61,43,5,0.65)";
// GOLD/AMBER volontairement approfondis (or antique / bronze) plutôt qu'un
// jaune vif — à côté de BRAND_GREEN (vert saturé), un jaune citron pur
// jurait visuellement ("couleurs qui ne se mélangent pas bien"). Un or plus
// chaud et moins saturé forme un duo vert + or classique, jamais criard.
const GOLD = "#D4A72C";
const AMBER = "#C97B2E";
// Même famille de teinte que BRAND_GREEN (au lieu d'un vert menthe sans
// rapport) — les deux verts du visuel restent cohérents entre eux.
const GREEN = "#8BDB3A";
const MUTED = "#9BA6BC";

const TABLE_TOP = 168;
const TABLE_HEADER_H = 38;
const ROW_H = 46;
// Hauteur totale du format PORTRAIT (façon A4) = zone titre/logo + tableau +
// marge basse (date) — celui-ci reste en hauteur variable, contrairement au
// paysage (voir POSTER_HEIGHT_LANDSCAPE plus bas, format fixe 1920×1080).
// Exportée pour que l'aperçu réduit du panneau d'export calcule la même
// hauteur sans dupliquer la formule. hasChampionBanner ajoute la place du
// bandeau "CHAMPION : ..." (voir ChampionBanner) quand une équipe est
// effectivement championne.
export function posterHeight(rowCount: number, hasChampionBanner = false) {
  return 240 + rowCount * ROW_H + 90 + (hasChampionBanner ? CHAMPION_BANNER_H + CHAMPION_BANNER_GAP : 0);
}

// Le format paysage est un vrai 1920×1080 (16:9) fixe, pas une hauteur qui
// grandit avec le nombre d'équipes — voir ScrimResultPoster, qui calcule une
// hauteur de ligne qui REMPLIT exactement l'espace vertical disponible
// (rowH = availableRowsHeight / rowCount, jamais plafonnée) : avec peu
// d'équipes les lignes s'étirent pour occuper tout l'écran (demande client
// explicite — un export qui laissait du vide en bas "ne remplissait pas
// l'écran" une fois affiché en plein cadre dans OBS Studio) ; avec beaucoup
// d'équipes elles rétrécissent pour continuer à toutes tenir. Avatar/police
// suivent (voir ResultTable/ChampionRushColumn, scale plafonné à
// LANDSCAPE_MAX_SCALE pour rester lisible sans déborder des colonnes même
// quand les lignes deviennent très hautes — l'espace en trop devient alors
// un espacement généreux autour du contenu plutôt qu'un agrandissement
// démesuré du texte).
export const POSTER_HEIGHT_LANDSCAPE = 1080;
// Même marge basse que posterHeight() (le "+90" de sa formule) — reproduite
// ici pour que le calcul de hauteur de ligne parte du même repère visuel
// (espace réservé sous le tableau avant le bord de l'affiche).
const LANDSCAPE_BOTTOM_MARGIN = 90;
// Plafond de grossissement du contenu d'une ligne (avatar, police) par
// rapport à sa taille de base (ROW_H) — la ligne elle-même peut s'étirer
// bien plus que ça pour remplir l'écran, mais le texte s'arrête de grossir
// à 1.7x pour ne jamais déborder la largeur des colonnes.
const LANDSCAPE_MAX_SCALE = 1.7;

export interface PosterStandingEntry {
  name: string;
  tag: string | null;
  logoUrl: string | null;
  matchesPlayed: number;
  totalKills: number;
  totalPlacementPoints: number;
  booyahCount: number;
  totalPoints: number;
  // Un point par match confirmé, dans l'ordre chronologique (voir
  // offline-scrim-matches.repository.getStandings) — sert uniquement au
  // calcul Champion Rush côté export (voir offline-scrim-export-dialog),
  // absent pour un export par map (buildMapStandings, un seul match).
  matches?: { matchNumber: number; points: number; booyah: boolean }[];
  // Calculés côté appelant (voir offline-scrim-export-dialog) à partir du
  // seuil du scrim — le composant n'a besoin de connaître que ces deux
  // booléens, jamais le seuil lui-même.
  championRushQualified?: boolean;
  isChampion?: boolean;
}

export interface ScrimResultPosterProps {
  title: string;
  hostedBy: string;
  dateLabel: string;
  standings: PosterStandingEntry[];
  photoDataUrl: string | null;
  logoSrc: string;
  // Colonne couronne sans en-tête, ajoutée devant le tableau (voir
  // ChampionRushColumn) — jamais affichée si le scrim n'est pas en mode
  // Champion Rush ou si l'admin a désactivé le bouton dans le panneau
  // d'export.
  showChampionRush?: boolean;
  // Étiquette "MAP: ..." en haut à droite — uniquement pour un export par
  // map (voir offline-scrim-results-section), absente de l'export global.
  mapLabel?: string;
}

function initialsOf(label: string) {
  return label.trim().slice(0, 2).toUpperCase();
}

function TeamAvatar({ logoUrl, label, size = 34 }: { logoUrl: string | null; label: string; size?: number }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- capturé hors DOM Next.js normal (html-to-image)
    return <img src={logoUrl} alt="" style={{ width: size, height: size, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: 8,
        background: "rgba(75,184,5,0.18)",
        color: BRAND_GREEN,
        fontSize: Math.max(9, Math.round(size * 0.35)),
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {initialsOf(label)}
    </div>
  );
}

function HeaderCell({
  icon,
  label,
  width,
  center,
}: {
  icon: React.ReactNode;
  label: string;
  width: number;
  center?: boolean;
}) {
  return (
    <div
      style={{
        width,
        display: "flex",
        alignItems: "center",
        justifyContent: center ? "center" : "flex-start",
        gap: 5,
        color: NAVY,
        fontSize: 11,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 0.2,
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {label}
    </div>
  );
}

// Colonnes réglées à l'origine pour un tableau de 630px (format paysage,
// deux tableaux côte à côte) — réutilisées proportionnellement pour tout
// autre largeur (ex. le tableau unique, plus large, du format portrait) afin
// de ne jamais avoir à retrouver ces réglages à la main.
const BASE_COLUMNS = { RANK: 34, TEAM: 168, PLAYED: 62, KILLS: 54, PLACE: 86, BOOYAH: 84, TOTAL: 70 };
const BASE_INNER = Object.values(BASE_COLUMNS).reduce((a, b) => a + b, 0);
const PADDING = 10;
const GAP = 8;

function ResultTable({
  entries,
  startRank,
  width,
  roundedLeft = true,
  rowHeight = ROW_H,
}: {
  entries: PosterStandingEntry[];
  startRank: number;
  width: number;
  // false quand la colonne couronne est accolée juste avant (voir
  // ChampionRushColumn) — les coins gauches sont alors carrés pour que les
  // deux blocs se lisent comme un seul tableau continu, sans coin arrondi
  // "en trop" au milieu.
  roundedLeft?: boolean;
  // Toujours ≤ ROW_H — réduite par ScrimResultPoster (format paysage fixe
  // 1920×1080, voir POSTER_HEIGHT_LANDSCAPE) quand il y a trop d'équipes
  // pour tenir à la taille normale des lignes. Avatar/police suivent
  // proportionnellement (scale) pour ne jamais déborder de la ligne
  // rétrécie.
  rowHeight?: number;
}) {
  const ratio = (width - PADDING * 2 - GAP * 6) / BASE_INNER;
  const RANK_W = Math.round(BASE_COLUMNS.RANK * ratio);
  const TEAM_W = Math.round(BASE_COLUMNS.TEAM * ratio);
  const PLAYED_W = Math.round(BASE_COLUMNS.PLAYED * ratio);
  const KILLS_W = Math.round(BASE_COLUMNS.KILLS * ratio);
  const PLACE_W = Math.round(BASE_COLUMNS.PLACE * ratio);
  const BOOYAH_W = Math.round(BASE_COLUMNS.BOOYAH * ratio);
  const TOTAL_W = Math.round(BASE_COLUMNS.TOTAL * ratio);

  // Grossit avec la ligne (jamais plafonné à 1x) jusqu'à LANDSCAPE_MAX_SCALE
  // — au-delà, l'espace supplémentaire de la ligne devient de l'air autour
  // du contenu plutôt que du texte toujours plus grand (déborderait des
  // colonnes). Le portrait n'est jamais concerné : il ne passe jamais de
  // rowHeight agrandie, scale y reste toujours exactement 1.
  const scale = Math.min(LANDSCAPE_MAX_SCALE, rowHeight / ROW_H);
  const avatarSize = Math.round(34 * scale);
  const statFontSize = Math.max(10, Math.round(14 * scale));
  const nameFontSize = Math.max(11, Math.round(14 * scale));
  const totalFontSize = Math.max(13, Math.round(18 * scale));
  const rankBadgeSize = Math.max(18, Math.round(26 * scale));
  const rankFontSize = Math.max(11, Math.round(14 * scale));

  return (
    <div
      style={{
        width,
        borderTopLeftRadius: roundedLeft ? 6 : 0,
        borderBottomLeftRadius: roundedLeft ? 6 : 0,
        borderTopRightRadius: 6,
        borderBottomRightRadius: 6,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: BRAND_GREEN,
          height: TABLE_HEADER_H,
          paddingLeft: PADDING,
          paddingRight: PADDING,
          gap: GAP,
        }}
      >
        <div style={{ width: RANK_W, color: NAVY, fontSize: 11, fontWeight: 800 }}>#</div>
        <HeaderCell icon={null} label="Team" width={TEAM_W} />
        <HeaderCell icon={<Flag size={12} strokeWidth={3} />} label="Played" width={PLAYED_W} center />
        <HeaderCell icon={<Crosshair size={12} strokeWidth={3} />} label="Kills" width={KILLS_W} center />
        <HeaderCell icon={<Target size={12} strokeWidth={3} />} label="Place pts" width={PLACE_W} center />
        <HeaderCell icon={<Crown size={12} strokeWidth={3} />} label="Booyah!" width={BOOYAH_W} center />
        <HeaderCell icon={null} label="Total pts" width={TOTAL_W} center />
      </div>

      {entries.map((entry, i) => {
        const rank = startRank + i;
        const champion = entry.isChampion;
        // Fond clair (CHAMPION_ROW_BG) sur la ligne championne : tout le
        // texte bascule sur des teintes sombres dédiées (CHAMPION_ROW_TEXT/
        // CHAMPION_ROW_MUTED) au lieu du blanc/gris/ambre habituel, illisible
        // sur un fond clair.
        const textColor = champion ? CHAMPION_ROW_TEXT : "#fff";
        const mutedColor = champion ? CHAMPION_ROW_MUTED : MUTED;
        return (
          <div
            key={`${rank}-${entry.name}`}
            style={{
              display: "flex",
              alignItems: "center",
              background: champion ? CHAMPION_ROW_BG : ROW_BG,
              height: rowHeight,
              paddingLeft: PADDING,
              paddingRight: PADDING,
              gap: GAP,
              borderBottom: champion ? "1px solid rgba(61,43,5,0.15)" : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ width: RANK_W, display: "flex" }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: rankBadgeSize,
                  height: rankBadgeSize,
                  borderRadius: 6,
                  fontSize: rankFontSize,
                  fontWeight: 800,
                  color: rank === 1 ? NAVY : textColor,
                  background: rank === 1 ? GOLD : "transparent",
                }}
              >
                {rank}
              </span>
            </div>
            <div style={{ width: TEAM_W, display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
              <TeamAvatar logoUrl={entry.logoUrl} label={entry.tag ?? entry.name} size={avatarSize} />
              <span
                style={{
                  color: textColor,
                  fontSize: nameFontSize,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {entry.name}
              </span>
            </div>
            <div style={{ width: PLAYED_W, textAlign: "center", color: mutedColor, fontSize: statFontSize, fontWeight: 600 }}>{entry.matchesPlayed}</div>
            <div style={{ width: KILLS_W, textAlign: "center", color: mutedColor, fontSize: statFontSize, fontWeight: 600 }}>{entry.totalKills}</div>
            <div style={{ width: PLACE_W, textAlign: "center", color: mutedColor, fontSize: statFontSize, fontWeight: 600 }}>
              {entry.totalPlacementPoints}
            </div>
            <div
              style={{
                width: BOOYAH_W,
                textAlign: "center",
                fontSize: statFontSize,
                fontWeight: 700,
                color: entry.booyahCount > 0 ? (champion ? CHAMPION_ROW_TEXT : GREEN) : mutedColor,
              }}
            >
              {entry.booyahCount > 0 ? entry.booyahCount : "—"}
            </div>
            <div style={{ width: TOTAL_W, textAlign: "center", color: champion ? CHAMPION_ROW_TEXT : AMBER, fontSize: totalFontSize, fontWeight: 900 }}>
              {entry.totalPoints}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Colonne dédiée sans en-tête, accolée juste devant le tableau (aucun espace
// entre les deux, voir CHAMPION_COL_GAP=0 et roundedLeft=false sur
// ResultTable) — jamais à l'intérieur de ResultTable, pour ne jamais toucher
// aux largeurs/colonnes actuelles : le tableau existant reste rigoureusement
// inchangé, cette colonne vient juste s'accoler à gauche (voir
// ScrimResultPoster, qui réduit d'autant la largeur donnée au tableau pour
// garder le même encombrement global). Entièrement transparente, y compris
// pour la ligne championne — son fond plein reste dans le tableau (voir
// ResultTable), ne déborde jamais ici : seule l'icône couronne d'une équipe
// qualifiée s'y affiche.
const CHAMPION_COL_W = 40;
const CHAMPION_COL_GAP = 0;

function ChampionRushColumn({ entries, rowHeight = ROW_H }: { entries: PosterStandingEntry[]; rowHeight?: number }) {
  // Même échelle que ResultTable (voir son commentaire sur rowHeight et
  // LANDSCAPE_MAX_SCALE) — le badge couronne suit la ligne dans les deux
  // sens, rétrécit pour ne jamais déborder, grossit jusqu'au même plafond.
  const scale = Math.min(LANDSCAPE_MAX_SCALE, rowHeight / ROW_H);
  const badgeSize = Math.max(18, Math.round(30 * scale));
  const iconSize = Math.max(11, Math.round(18 * scale));
  return (
    <div style={{ width: CHAMPION_COL_W, display: "flex", flexDirection: "column" }}>
      {/* Toujours transparente, y compris pour la ligne championne — son
          fond plein (CHAMPION_ROW_BG) reste dans le tableau, ne déborde
          jamais dans cette case, seule l'icône couronne s'y affiche. */}
      <div style={{ height: TABLE_HEADER_H }} />
      {entries.map((entry, i) => (
        <div
          key={i}
          style={{
            height: rowHeight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {entry.championRushQualified && (
            <div
              style={{
                width: badgeSize,
                height: badgeSize,
                borderRadius: 8,
                background: GOLD,
                border: `2px solid ${NAVY}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Crown size={iconSize} strokeWidth={2.5} color={NAVY} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Bandeau "CHAMPION : {équipe}" affiché au-dessus du tableau — jamais à
// l'intérieur, le tableau du bas reste rigoureusement inchangé (la
// championne y reste listée normalement, voir ResultTable/CHAMPION_ROW_BG) :
// voir ScrimResultPoster/ScrimResultPosterPortrait, qui poussent juste le
// tableau un peu plus bas (tableTop) pour lui faire de la place, uniquement
// quand une équipe est effectivement championne (jamais pour une équipe
// simplement qualifiée).
export const CHAMPION_BANNER_H = 92;
export const CHAMPION_BANNER_GAP = 18;

function BannerStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 78,
        padding: "6px 12px",
        borderRadius: 8,
        background: highlight ? NAVY : "rgba(27,36,56,0.14)",
      }}
    >
      <span style={{ fontSize: 20, fontWeight: 900, color: highlight ? GOLD : NAVY, lineHeight: 1.1 }}>{value}</span>
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: highlight ? "rgba(212,167,44,0.9)" : "rgba(27,36,56,0.65)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function ChampionBanner({ entry, width }: { entry: PosterStandingEntry; width: number }) {
  return (
    <div
      style={{
        width,
        height: CHAMPION_BANNER_H,
        borderRadius: 10,
        background: `linear-gradient(135deg, ${GOLD}, ${AMBER})`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 20px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
      }}
    >
      <TeamAvatar logoUrl={entry.logoUrl} label={entry.tag ?? entry.name} size={56} />
      {/* "Champion" + icône sur une ligne, le nom de l'équipe en dessous —
          jamais côte à côte : un nom un peu long pousserait sinon les cartes
          de stats hors du bandeau (voir width, calée sur l'en-tête seul). */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "rgba(27,36,56,0.7)" }}>
          <Crown size={14} strokeWidth={2.5} />
          Champion
        </span>
        <span
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: NAVY,
            textTransform: "uppercase",
            letterSpacing: 0.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {entry.name}
        </span>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", gap: 10 }}>
        <BannerStat label="Elimination" value={entry.totalKills} />
        <BannerStat label="Booyah" value={entry.booyahCount} />
        <BannerStat label="Total" value={entry.totalPoints} highlight />
      </div>
    </div>
  );
}

// Même niveau vertical que la date (voir bottom:22 dans les deux variantes
// ci-dessous), mais à droite plutôt qu'à gauche — jamais en haut.
function MapLabel({ label }: { label: string }) {
  return (
    <div style={{ position: "absolute", bottom: 22, right: 40, color: "#8A93A6", fontSize: 15, fontWeight: 700 }}>
      MAP: {label}
    </div>
  );
}

// Ligne de logos/icônes en bas de l'affiche (jeu + réseaux sociaux) — demande
// client explicite. Aucun asset officiel disponible dans le repo (pas
// d'accès pour en récupérer), donc badges ronds avec pictos dessinés en SVG
// simple plutôt que les logos exacts des marques.
function TikTokGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff">
      <path d="M16 3c.4 2.4 2 4 4.5 4.3V10c-1.6 0-3.1-.5-4.5-1.4v6.6a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v2.6a2.9 2.9 0 1 0 2 2.8V3h2.6Z" />
    </svg>
  );
}

function InstagramGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none" />
    </svg>
  );
}

function YoutubeGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function SocialBadge({ background, children }: { background: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

function SocialBar({ width }: { width: number }) {
  return (
    <div style={{ position: "absolute", bottom: 18, left: 0, width, display: "flex", justifyContent: "center", gap: 12 }}>
      <SocialBadge background="linear-gradient(135deg,#FF7A00,#E30613)">
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 11, letterSpacing: -0.3 }}>FF</span>
      </SocialBadge>
      <SocialBadge background="#0F7FE8">
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>G</span>
      </SocialBadge>
      <SocialBadge background="#000000">
        <TikTokGlyph />
      </SocialBadge>
      <SocialBadge background="linear-gradient(135deg,#f58529,#dd2a7b,#8134af,#515bd4)">
        <InstagramGlyph />
      </SocialBadge>
      <SocialBadge background="#FF0000">
        <YoutubeGlyph />
      </SocialBadge>
      <SocialBadge background="#1877F2">
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 16, fontStyle: "italic" }}>f</span>
      </SocialBadge>
    </div>
  );
}

function CornerTriangles() {
  return (
    <>
      <div
        style={{ position: "absolute", top: 0, left: 0, width: 260, height: 130, background: BRAND_GREEN, clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 260,
          height: 130,
          background: BRAND_GREEN,
          clipPath: "polygon(100% 0, 100% 100%, 0 0)",
        }}
      />
    </>
  );
}

// hostedBy n'est plus affiché (badge remplacé par "CLASSEMENT GÉNÉRAL" à la
// demande du client), gardé dans la signature pour ne pas casser l'appel des
// deux variantes ni la prop de ScrimResultPosterProps.
function TitleBlock({ title }: { title: string; hostedBy: string }) {
  return (
    <div style={{ position: "absolute", top: 36, left: 0, right: 0, textAlign: "center" }}>
      <p style={{ margin: 0, fontSize: 42, fontWeight: 900, color: NAVY, textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</p>
      <span
        style={{
          display: "inline-block",
          marginTop: 6,
          padding: "5px 18px",
          borderRadius: 999,
          border: `2px solid ${BRAND_GREEN}`,
          color: BRAND_GREEN,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        Classement général
      </span>
    </div>
  );
}

// Toujours peinte AVANT le logo/titre dans le DOM (donc en-dessous) : la
// photo s'aligne sur le bas du petit triangle de coin (sa pointe, à gauche,
// pas son bord haut) et ne doit jamais passer par-dessus le logo ou le titre.
// HOST_PHOTO_TOP est repris tel quel par ScrimResultPoster pour calculer sa
// hauteur (le haut ne bouge jamais, seule la hauteur dépend du tableau).
const HOST_PHOTO_TOP = 130;

function HostPhoto({ photoDataUrl, width, height }: { photoDataUrl: string; width: number; height: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- capturé hors DOM Next.js normal (html-to-image)
    <img
      src={photoDataUrl}
      alt=""
      style={{
        position: "absolute",
        left: -10,
        top: HOST_PHOTO_TOP,
        width,
        height,
        objectFit: "cover",
        objectPosition: "top",
        maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
      }}
    />
  );
}

// Rendu à taille fixe 1920×1080 (16:9) pour une capture PNG nette et
// prévisible, quel que soit l'écran de l'admin qui exporte — le composant
// n'est jamais affiché tel quel dans l'UI, seulement capturé (voir
// offline-scrim-export-dialog.tsx qui l'affiche réduit via un transform
// CSS purement visuel, sans jamais changer sa taille réelle). Contrairement
// au portrait, la hauteur ne grandit jamais avec le nombre d'équipes : voir
// rowH plus bas, qui rétrécit les lignes au besoin pour toujours tout faire
// tenir dans ces 1080px.
export const POSTER_WIDTH = 1920;
const WIDTH = POSTER_WIDTH;
const PHOTO_COLUMN_WIDTH = 260;

export const ScrimResultPoster = forwardRef<HTMLDivElement, ScrimResultPosterProps>(function ScrimResultPoster(
  { title, hostedBy, dateLabel, standings, photoDataUrl, logoSrc, showChampionRush, mapLabel },
  ref
) {
  const half = Math.ceil(standings.length / 2);
  const left = standings.slice(0, half);
  const right = standings.slice(half);
  const rowCount = Math.max(left.length, right.length, 1);
  const height = POSTER_HEIGHT_LANDSCAPE;
  // Bandeau "CHAMPION : ..." — uniquement quand une équipe est effectivement
  // championne (jamais pour une simple qualifiée), voir ChampionBanner. Pousse
  // le tableau un peu plus bas (tableTop) pour lui faire de la place ; le
  // tableau lui-même n'est jamais modifié, ni sa position dans la liste.
  const championEntry = showChampionRush ? standings.find((e) => e.isChampion) : undefined;
  const bannerExtra = championEntry ? CHAMPION_BANNER_H + CHAMPION_BANNER_GAP : 0;
  const tableTop = TABLE_TOP + bannerExtra;
  // Hauteur de ligne = exactement l'espace vertical disponible divisé par le
  // nombre de lignes — remplit toujours tout le cadre 1080px, jamais de vide
  // en bas avec peu d'équipes, jamais de coupure avec beaucoup (voir
  // POSTER_HEIGHT_LANDSCAPE et ResultTable/ChampionRushColumn, dont
  // l'avatar/police suit à l'échelle, plafonnée à LANDSCAPE_MAX_SCALE).
  const availableRowsHeight = height - tableTop - LANDSCAPE_BOTTOM_MARGIN - TABLE_HEADER_H;
  const rowH = availableRowsHeight / rowCount;
  const crownExtra = showChampionRush ? CHAMPION_COL_W + CHAMPION_COL_GAP : 0;
  // Largeur entre les deux tableaux (le "gap" du conteneur flex ci-dessous,
  // voir JSX) — TOUJOURS la même valeur, avec ou sans photo, pour que le
  // conteneur ait exactement la même largeur totale dans les deux cas (sinon
  // les deux ResultTable se retrouveraient comprimées par flexbox et leurs
  // colonnes, calculées en JS à partir de tableWidth, ne correspondraient
  // plus à leur boîte réellement rendue).
  const SIDE_GAP = 40;
  // Largeur totale du conteneur (les deux tableaux + colonnes couronne + le
  // SIDE_GAP entre eux) — celle du cas "avec photo", prise comme référence.
  const containerWidth = WIDTH - PHOTO_COLUMN_WIDTH - 40;
  const tableWidth = (containerWidth - SIDE_GAP) / 2 - crownExtra;
  // Avec photo : ancrée à gauche de la colonne réservée à la photo, comme
  // avant. Sans photo : recentrée dans toute la largeur de l'affiche (marges
  // gauche/droite égales, même containerWidth qu'avec photo) au lieu de
  // laisser un grand vide à gauche.
  const tableLeft = photoDataUrl ? PHOTO_COLUMN_WIDTH : (WIDTH - containerWidth) / 2;
  const tableRight = photoDataUrl ? 40 : (WIDTH - containerWidth) / 2;
  // Centre horizontal du logo central : le milieu entre le bord droit du
  // tableau gauche et le bord gauche du tableau droit — PAS le milieu du
  // conteneur flex, qui se décale dès qu'une colonne couronne (crownExtra)
  // s'ajoute juste avant le tableau droit (elle "pousse" ce tableau vers la
  // droite sans bouger le tableau gauche, voir le layout plus bas).
  const logoCenterX = tableLeft + (containerWidth + crownExtra) / 2;
  // Bas de la photo = bas du tableau + un léger dépassement (24px, le même
  // qu'avant le passage au format fixe 1920×1080 — voir posterHeight, où ce
  // dépassement ressortait de "+90" moins la marge basse réelle) ; le haut ne
  // bouge jamais (HOST_PHOTO_TOP), seule la hauteur suit la hauteur réelle du
  // tableau (rowH adaptatif compris), jamais une valeur fixe déconnectée du
  // nombre d'équipes.
  const PHOTO_OVERSHOOT = 24;
  const tableBottomY = tableTop + TABLE_HEADER_H + rowCount * rowH;
  const photoHeight = tableBottomY + PHOTO_OVERSHOOT - HOST_PHOTO_TOP;

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: WIDTH,
        height,
        background: "#EEF1F6",
        overflow: "hidden",
        fontFamily: "var(--font-geist-sans, Arial, Helvetica, sans-serif)",
      }}
    >
      <CornerTriangles />

      {photoDataUrl && <HostPhoto photoDataUrl={photoDataUrl} width={PHOTO_COLUMN_WIDTH + 30} height={photoHeight} />}

      {/* eslint-disable-next-line @next/next/no-img-element -- capturé hors DOM Next.js normal (html-to-image) */}
      <img
        src={logoSrc}
        alt=""
        width={84}
        height={84}
        style={{ position: "absolute", top: 32, left: 40, borderRadius: "50%", border: "3px solid #fff", boxShadow: "0 2px 10px rgba(0,0,0,0.15)" }}
      />

      <TitleBlock title={title} hostedBy={hostedBy} />
      {mapLabel && <MapLabel label={mapLabel} />}
      {championEntry && (
        // Au-dessus du PREMIER tableau (gauche) uniquement, jamais des deux —
        // et calé exactement sur la largeur de son en-tête (tableWidth seul,
        // sans la colonne couronne) : le bandeau ne doit jamais déborder vers
        // la case couronne, juste s'aligner avec le tableau lui-même.
        <div style={{ position: "absolute", top: TABLE_TOP, left: tableLeft + crownExtra }}>
          <ChampionBanner entry={championEntry} width={tableWidth} />
        </div>
      )}

      <div style={{ position: "absolute", top: tableTop, left: tableLeft, right: tableRight, display: "flex", gap: SIDE_GAP }}>
        <div style={{ display: "flex", gap: CHAMPION_COL_GAP, flex: 1 }}>
          {showChampionRush && <ChampionRushColumn entries={left} rowHeight={rowH} />}
          <ResultTable entries={left} startRank={1} width={tableWidth} roundedLeft={!showChampionRush} rowHeight={rowH} />
        </div>
        <div style={{ display: "flex", gap: CHAMPION_COL_GAP, flex: 1 }}>
          {showChampionRush && <ChampionRushColumn entries={right} rowHeight={rowH} />}
          <ResultTable entries={right} startRank={half + 1} width={tableWidth} roundedLeft={!showChampionRush} rowHeight={rowH} />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: tableTop + (TABLE_HEADER_H + rowCount * rowH) / 2 - 34,
          left: logoCenterX - 34,
          width: 68,
          height: 68,
          borderRadius: "50%",
          background: "#fff",
          border: "3px solid #fff",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- capturé hors DOM Next.js normal (html-to-image) */}
        <img src={logoSrc} alt="" width={60} height={60} style={{ borderRadius: "50%" }} />
      </div>

      <div style={{ position: "absolute", bottom: 22, left: tableLeft, color: "#8A93A6", fontSize: 15 }}>{dateLabel}</div>
      <SocialBar width={WIDTH} />
    </div>
  );
});

// Format portrait (façon A4) — un seul tableau reprenant tout le classement
// (pas de coupure en deux colonnes, la hauteur disponible n'a pas la même
// contrainte qu'en paysage), photo agrandie à gauche débordant davantage
// sous le tableau. Même charte, mêmes composants, juste une mise en page
// différente (voir offline-scrim-export-dialog, qui propose les deux
// formats en téléchargement séparé).
export const POSTER_WIDTH_PORTRAIT = 1000;
const WIDTH_PORTRAIT = POSTER_WIDTH_PORTRAIT;
const PHOTO_COLUMN_WIDTH_PORTRAIT = 220;

export const ScrimResultPosterPortrait = forwardRef<HTMLDivElement, ScrimResultPosterProps>(function ScrimResultPosterPortrait(
  { title, hostedBy, dateLabel, standings, photoDataUrl, logoSrc, showChampionRush, mapLabel },
  ref
) {
  const rowCount = Math.max(standings.length, 1);
  // Bandeau "CHAMPION : ..." — voir son équivalent dans ScrimResultPoster
  // (paysage) pour le détail du raisonnement.
  const championEntry = showChampionRush ? standings.find((e) => e.isChampion) : undefined;
  const bannerExtra = championEntry ? CHAMPION_BANNER_H + CHAMPION_BANNER_GAP : 0;
  const tableTop = TABLE_TOP + bannerExtra;
  const height = posterHeight(rowCount, !!championEntry);
  const crownExtra = showChampionRush ? CHAMPION_COL_W + CHAMPION_COL_GAP : 0;
  // Même principe que la variante paysage : la largeur du bloc ne change
  // jamais, seule sa position se recentre en l'absence de photo.
  const contentWidth = WIDTH_PORTRAIT - 40 - PHOTO_COLUMN_WIDTH_PORTRAIT;
  const tableWidth = contentWidth - crownExtra;
  const tableLeft = photoDataUrl ? PHOTO_COLUMN_WIDTH_PORTRAIT : (WIDTH_PORTRAIT - contentWidth) / 2;
  const tableRight = photoDataUrl ? 40 : (WIDTH_PORTRAIT - contentWidth) / 2;

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: WIDTH_PORTRAIT,
        height,
        background: "#EEF1F6",
        overflow: "hidden",
        fontFamily: "var(--font-geist-sans, Arial, Helvetica, sans-serif)",
      }}
    >
      <CornerTriangles />

      {photoDataUrl && (
        <HostPhoto photoDataUrl={photoDataUrl} width={PHOTO_COLUMN_WIDTH_PORTRAIT + 80} height={TABLE_HEADER_H + rowCount * ROW_H + bannerExtra} />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element -- capturé hors DOM Next.js normal (html-to-image) */}
      <img
        src={logoSrc}
        alt=""
        width={84}
        height={84}
        style={{ position: "absolute", top: 32, left: 40, borderRadius: "50%", border: "3px solid #fff", boxShadow: "0 2px 10px rgba(0,0,0,0.15)" }}
      />

      <TitleBlock title={title} hostedBy={hostedBy} />
      {mapLabel && <MapLabel label={mapLabel} />}
      {championEntry && (
        // Calé exactement sur la largeur de l'en-tête du tableau (tableWidth
        // seul, sans la colonne couronne) — voir le même raisonnement dans
        // ScrimResultPoster (paysage).
        <div style={{ position: "absolute", top: TABLE_TOP, left: tableLeft + crownExtra }}>
          <ChampionBanner entry={championEntry} width={tableWidth} />
        </div>
      )}

      <div style={{ position: "absolute", top: tableTop, left: tableLeft, right: tableRight, display: "flex", gap: CHAMPION_COL_GAP }}>
        {showChampionRush && <ChampionRushColumn entries={standings} />}
        <ResultTable entries={standings} startRank={1} width={tableWidth} roundedLeft={!showChampionRush} />
      </div>

      <div style={{ position: "absolute", bottom: 22, left: tableLeft, color: "#8A93A6", fontSize: 15 }}>{dateLabel}</div>
      <SocialBar width={WIDTH_PORTRAIT} />
    </div>
  );
});
