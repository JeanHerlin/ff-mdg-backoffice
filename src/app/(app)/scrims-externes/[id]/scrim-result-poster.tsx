"use client";

import { forwardRef } from "react";
import { Crosshair, Crown, Flag, Target } from "lucide-react";

// Couleurs propres à ce visuel exporté (pas le thème de l'appli — vert/rouge
// ailleurs) : reprend la charte "Daily" fournie par le client (orange +
// bleu marine), indépendante du thème clair/sombre du backoffice.
const ORANGE = "#F5821F";
const NAVY = "#1B2438";
// Légèrement transparent — si la photo déborde sous le tableau (voir le
// composant principal), elle reste devinable derrière sans jamais nuire à
// la lisibilité du texte (blanc, fortement contrasté même à 90% d'opacité).
const ROW_BG = "rgba(20,28,46,0.92)";
const GOLD = "#F5C842";
const AMBER = "#FDBA47";
const GREEN = "#3ADC7A";
const MUTED = "#9BA6BC";

const WIDTH = 1600;
const PHOTO_COLUMN_WIDTH = 260;

export interface PosterStandingEntry {
  name: string;
  tag: string | null;
  logoUrl: string | null;
  matchesPlayed: number;
  totalKills: number;
  totalPlacementPoints: number;
  booyahCount: number;
  totalPoints: number;
}

export interface ScrimResultPosterProps {
  title: string;
  hostedBy: string;
  dateLabel: string;
  standings: PosterStandingEntry[];
  photoDataUrl: string | null;
  logoSrc: string;
}

function initialsOf(label: string) {
  return label.trim().slice(0, 2).toUpperCase();
}

function TeamAvatar({ logoUrl, label }: { logoUrl: string | null; label: string }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- capturé hors DOM Next.js normal (html-to-image)
    return <img src={logoUrl} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 34,
        borderRadius: 8,
        background: "rgba(245,130,31,0.18)",
        color: ORANGE,
        fontSize: 12,
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

function ResultTable({ entries, startRank }: { entries: PosterStandingEntry[]; startRank: number }) {
  // Chaque table dispose de 630px (moitié de l'espace restant une fois les
  // marges et la table voisine soustraites de WIDTH) — ces largeurs + le gap
  // (8 × 6) + le padding (10 × 2) tiennent pile dedans, sans quoi les
  // dernières colonnes (Booyah/Total) se retrouvaient rognées par l'overflow
  // hidden du conteneur.
  const RANK_W = 34;
  const TEAM_W = 168;
  const PLAYED_W = 62;
  const KILLS_W = 54;
  const PLACE_W = 86;
  const BOOYAH_W = 84;
  const TOTAL_W = 70;

  return (
    <div style={{ flex: 1, borderRadius: 6, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: ORANGE,
          height: 38,
          paddingLeft: 10,
          paddingRight: 10,
          gap: 8,
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
        return (
          <div
            key={`${rank}-${entry.name}`}
            style={{
              display: "flex",
              alignItems: "center",
              background: ROW_BG,
              height: 46,
              paddingLeft: 10,
              paddingRight: 10,
              gap: 8,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ width: RANK_W, display: "flex" }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 800,
                  color: rank === 1 ? NAVY : "#fff",
                  background: rank === 1 ? GOLD : "transparent",
                }}
              >
                {rank}
              </span>
            </div>
            <div style={{ width: TEAM_W, display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
              <TeamAvatar logoUrl={entry.logoUrl} label={entry.tag ?? entry.name} />
              <span
                style={{
                  color: "#fff",
                  fontSize: 14,
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
            <div style={{ width: PLAYED_W, textAlign: "center", color: MUTED, fontSize: 14, fontWeight: 600 }}>{entry.matchesPlayed}</div>
            <div style={{ width: KILLS_W, textAlign: "center", color: MUTED, fontSize: 14, fontWeight: 600 }}>{entry.totalKills}</div>
            <div style={{ width: PLACE_W, textAlign: "center", color: MUTED, fontSize: 14, fontWeight: 600 }}>
              {entry.totalPlacementPoints}
            </div>
            <div
              style={{ width: BOOYAH_W, textAlign: "center", fontSize: 14, fontWeight: 700, color: entry.booyahCount > 0 ? GREEN : MUTED }}
            >
              {entry.booyahCount > 0 ? entry.booyahCount : "—"}
            </div>
            <div style={{ width: TOTAL_W, textAlign: "center", color: AMBER, fontSize: 18, fontWeight: 900 }}>{entry.totalPoints}</div>
          </div>
        );
      })}
    </div>
  );
}

// Rendu à taille fixe (1600px de large) pour une capture PNG nette et
// prévisible, quel que soit l'écran de l'admin qui exporte — le composant
// n'est jamais affiché tel quel dans l'UI, seulement capturé (voir
// offline-scrim-export-dialog.tsx qui l'affiche réduit via un transform
// CSS purement visuel, sans jamais changer sa taille réelle).
export const ScrimResultPoster = forwardRef<HTMLDivElement, ScrimResultPosterProps>(function ScrimResultPoster(
  { title, hostedBy, dateLabel, standings, photoDataUrl, logoSrc },
  ref
) {
  const half = Math.ceil(standings.length / 2);
  const left = standings.slice(0, half);
  const right = standings.slice(half);
  const rowCount = Math.max(left.length, right.length, 1);
  const height = 240 + rowCount * 46 + 90;

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
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 260,
          height: 130,
          background: ORANGE,
          clipPath: "polygon(0 0, 100% 0, 0 100%)",
        }}
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

      {/* eslint-disable-next-line @next/next/no-img-element -- capturé hors DOM Next.js normal (html-to-image) */}
      <img
        src={logoSrc}
        alt=""
        width={84}
        height={84}
        style={{ position: "absolute", top: 32, left: 40, borderRadius: "50%", border: "3px solid #fff", boxShadow: "0 2px 10px rgba(0,0,0,0.15)" }}
      />

      <div style={{ position: "absolute", top: 36, left: 0, right: 0, textAlign: "center" }}>
        <p
          style={{
            margin: 0,
            fontSize: 46,
            fontWeight: 900,
            color: NAVY,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {title}
        </p>
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

      {photoDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- capturé hors DOM Next.js normal (html-to-image)
        <img
          src={photoDataUrl}
          alt=""
          style={{
            position: "absolute",
            left: -10,
            // Alignée sur le haut du tableau, pas plaquée tout en bas.
            top: 168,
            // Déborde volontairement un peu sous le tableau de gauche (voir
            // ROW_BG semi-transparent) plutôt que de laisser une bande vide.
            width: PHOTO_COLUMN_WIDTH + 30,
            height: height - 230,
            objectFit: "cover",
            objectPosition: "top",
            maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          top: 168,
          left: PHOTO_COLUMN_WIDTH,
          right: 40,
          display: "flex",
          gap: 40,
        }}
      >
        <ResultTable entries={left} startRank={1} />
        <ResultTable entries={right} startRank={half + 1} />
      </div>

      <div
        style={{
          position: "absolute",
          top: 168 + (38 + rowCount * 46) / 2 - 34,
          left: PHOTO_COLUMN_WIDTH + (WIDTH - 40 - PHOTO_COLUMN_WIDTH) / 2 - 34,
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

      <div style={{ position: "absolute", bottom: 22, left: PHOTO_COLUMN_WIDTH, color: "#8A93A6", fontSize: 15 }}>{dateLabel}</div>
    </div>
  );
});
