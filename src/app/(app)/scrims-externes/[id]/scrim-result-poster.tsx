"use client";

import { forwardRef } from "react";
import { Crosshair, Crown, Flag, Target } from "lucide-react";

// Couleurs propres à ce visuel exporté (pas le thème de l'appli — vert/rouge
// ailleurs) : reprend la charte "Daily" fournie par le client (orange +
// bleu marine), indépendante du thème clair/sombre du backoffice.
const ORANGE = "#F5821F";
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
const CHAMPION_ROW_BG = "#F2C14E";
const CHAMPION_ROW_TEXT = "#3D2B05";
const CHAMPION_ROW_MUTED = "rgba(61,43,5,0.65)";
const GOLD = "#F5C842";
const AMBER = "#FDBA47";
const GREEN = "#3ADC7A";
const MUTED = "#9BA6BC";

const TABLE_TOP = 168;
const TABLE_HEADER_H = 38;
const ROW_H = 46;
// Hauteur totale du format PORTRAIT (façon A4) = zone titre/logo + tableau +
// marge basse (date) — celui-ci reste en hauteur variable, contrairement au
// paysage (voir POSTER_HEIGHT_LANDSCAPE plus bas, format fixe 1920×1080).
// Exportée pour que l'aperçu réduit du panneau d'export calcule la même
// hauteur sans dupliquer la formule.
export function posterHeight(rowCount: number) {
  return 240 + rowCount * ROW_H + 90;
}

// Le format paysage est un vrai 1920×1080 (16:9) fixe, pas une hauteur qui
// grandit avec le nombre d'équipes — voir ScrimResultPoster, qui calcule une
// hauteur de ligne adaptative (rowHeight, toujours ≤ LANDSCAPE_ROW_H) pour
// que toutes les équipes tiennent toujours dans ces 1080px, quel que soit
// leur nombre : avec peu d'équipes les lignes montent jusqu'à leur taille
// normale et de l'espace vide reste sous le tableau ; avec beaucoup d'équipes
// les lignes (et leur contenu : avatar, police...) rétrécissent
// proportionnellement plutôt que de déborder ou d'être coupées.
export const POSTER_HEIGHT_LANDSCAPE = 1080;
// Plus haut que ROW_H (46, utilisé par le portrait) — le format paysage a de
// la marge en bas une fois la hauteur fixée à 1080px, autant en profiter pour
// des lignes un peu plus confortables tant que le nombre d'équipes le permet.
const LANDSCAPE_ROW_H = 54;
// Même marge basse que posterHeight() (le "+90" de sa formule) — reproduite
// ici pour que le calcul de hauteur de ligne adaptative parte du même repère
// visuel (espace réservé sous le tableau avant le bord de l'affiche).
const LANDSCAPE_BOTTOM_MARGIN = 90;

export interface PosterStandingEntry {
  name: string;
  tag: string | null;
  logoUrl: string | null;
  matchesPlayed: number;
  totalKills: number;
  totalPlacementPoints: number;
  booyahCount: number;
  totalPoints: number;
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
        background: "rgba(245,130,31,0.18)",
        color: ORANGE,
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

  const scale = Math.min(1, rowHeight / ROW_H);
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
          background: ORANGE,
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
  // Même échelle que ResultTable (voir son commentaire sur rowHeight) — le
  // badge couronne rétrécit avec la ligne pour ne jamais déborder.
  const scale = Math.min(1, rowHeight / ROW_H);
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

// Même niveau vertical que la date (voir bottom:22 dans les deux variantes
// ci-dessous), mais à droite plutôt qu'à gauche — jamais en haut.
function MapLabel({ label }: { label: string }) {
  return (
    <div style={{ position: "absolute", bottom: 22, right: 40, color: "#8A93A6", fontSize: 15, fontWeight: 700 }}>
      MAP: {label}
    </div>
  );
}

function CornerTriangles() {
  return (
    <>
      <div
        style={{ position: "absolute", top: 0, left: 0, width: 260, height: 130, background: ORANGE, clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 260,
          height: 130,
          background: ORANGE,
          clipPath: "polygon(100% 0, 100% 100%, 0 0)",
        }}
      />
    </>
  );
}

function TitleBlock({ title, hostedBy }: { title: string; hostedBy: string }) {
  return (
    <div style={{ position: "absolute", top: 36, left: 0, right: 0, textAlign: "center" }}>
      <p style={{ margin: 0, fontSize: 42, fontWeight: 900, color: NAVY, textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</p>
      <span
        style={{
          display: "inline-block",
          marginTop: 6,
          padding: "5px 18px",
          borderRadius: 999,
          border: `2px solid ${ORANGE}`,
          color: ORANGE,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        Hosted by {hostedBy}
      </span>
    </div>
  );
}

// Toujours peinte AVANT le logo/titre dans le DOM (donc en-dessous) : la
// photo s'aligne sur le bas du petit triangle orange (sa pointe, à gauche,
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
  // Hauteur de ligne adaptative : à taille "confortable" (LANDSCAPE_ROW_H)
  // tant que ça tient dans le budget vertical fixe, rétrécie
  // proportionnellement sinon — jamais de coupure, quel que soit le nombre
  // d'équipes (voir POSTER_HEIGHT_LANDSCAPE et ResultTable/ChampionRushColumn,
  // qui suivent avec avatar/police à l'échelle, plafonnée à leur taille
  // d'origine calée sur ROW_H : une ligne plus haute que ROW_H ne fait donc
  // qu'ajouter de l'air autour du contenu, jamais l'agrandir).
  const availableRowsHeight = height - TABLE_TOP - LANDSCAPE_BOTTOM_MARGIN - TABLE_HEADER_H;
  const rowH = Math.min(LANDSCAPE_ROW_H, availableRowsHeight / rowCount);
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
  const tableBottomY = TABLE_TOP + TABLE_HEADER_H + rowCount * rowH;
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

      <div style={{ position: "absolute", top: TABLE_TOP, left: tableLeft, right: tableRight, display: "flex", gap: SIDE_GAP }}>
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
          top: TABLE_TOP + (TABLE_HEADER_H + rowCount * rowH) / 2 - 34,
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
  const height = posterHeight(rowCount);
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

      {photoDataUrl && <HostPhoto photoDataUrl={photoDataUrl} width={PHOTO_COLUMN_WIDTH_PORTRAIT + 80} height={TABLE_HEADER_H + rowCount * ROW_H} />}

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

      <div style={{ position: "absolute", top: TABLE_TOP, left: tableLeft, right: tableRight, display: "flex", gap: CHAMPION_COL_GAP }}>
        {showChampionRush && <ChampionRushColumn entries={standings} />}
        <ResultTable entries={standings} startRank={1} width={tableWidth} roundedLeft={!showChampionRush} />
      </div>

      <div style={{ position: "absolute", bottom: 22, left: tableLeft, color: "#8A93A6", fontSize: 15 }}>{dateLabel}</div>
    </div>
  );
});
