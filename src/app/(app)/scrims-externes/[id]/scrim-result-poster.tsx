"use client";

import { forwardRef } from "react";
import { Crosshair, Crown, Flag, Target } from "lucide-react";

// Couleurs propres à ce visuel exporté (pas le thème de l'appli — vert/rouge
// ailleurs) : reprend la charte "Daily" fournie par le client (orange +
// bleu marine), indépendante du thème clair/sombre du backoffice.
const ORANGE = "#F5821F";
const NAVY = "#1B2438";
const ROW_BG = "#141C2E";
const GOLD = "#F5C842";
const AMBER = "#FDBA47";
const GREEN = "#3ADC7A";
const MUTED = "#9BA6BC";

const WIDTH = 1600;
const PHOTO_COLUMN_WIDTH = 300;

export interface PosterStandingEntry {
  name: string;
  tag: string | null;
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

function TeamAvatar({ label }: { label: string }) {
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

function HeaderCell({ icon, label, width }: { icon: React.ReactNode; label: string; width: number }) {
  return (
    <div
      style={{
        width,
        display: "flex",
        alignItems: "center",
        gap: 5,
        color: NAVY,
        fontSize: 12,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 0.3,
      }}
    >
      {icon}
      {label}
    </div>
  );
}

function ResultTable({ entries, startRank }: { entries: PosterStandingEntry[]; startRank: number }) {
  const RANK_W = 46;
  const TEAM_W = 250;
  const PLAYED_W = 76;
  const KILLS_W = 70;
  const PLACE_W = 90;
  const BOOYAH_W = 90;
  const TOTAL_W = 100;

  return (
    <div style={{ flex: 1, borderRadius: 6, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: ORANGE,
          height: 38,
          paddingLeft: 12,
          paddingRight: 12,
          gap: 4,
        }}
      >
        <div style={{ width: RANK_W, color: NAVY, fontSize: 12, fontWeight: 800 }}>#</div>
        <HeaderCell icon={null} label="Team" width={TEAM_W} />
        <HeaderCell icon={<Flag size={12} strokeWidth={3} />} label="Played" width={PLAYED_W} />
        <HeaderCell icon={<Crosshair size={12} strokeWidth={3} />} label="Kills" width={KILLS_W} />
        <HeaderCell icon={<Target size={12} strokeWidth={3} />} label="Place pts" width={PLACE_W} />
        <HeaderCell icon={<Crown size={12} strokeWidth={3} />} label="Booyah!" width={BOOYAH_W} />
        <HeaderCell icon={null} label="Total pts" width={TOTAL_W} />
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
              paddingLeft: 12,
              paddingRight: 12,
              gap: 4,
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
              <TeamAvatar label={entry.tag ?? entry.name} />
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
            <div style={{ width: PLAYED_W, color: MUTED, fontSize: 14, fontWeight: 600 }}>{entry.matchesPlayed}</div>
            <div style={{ width: KILLS_W, color: MUTED, fontSize: 14, fontWeight: 600 }}>{entry.totalKills}</div>
            <div style={{ width: PLACE_W, color: MUTED, fontSize: 14, fontWeight: 600 }}>{entry.totalPlacementPoints}</div>
            <div style={{ width: BOOYAH_W, fontSize: 14, fontWeight: 700, color: entry.booyahCount > 0 ? GREEN : MUTED }}>
              {entry.booyahCount > 0 ? entry.booyahCount : "—"}
            </div>
            <div style={{ width: TOTAL_W, color: AMBER, fontSize: 18, fontWeight: 900 }}>{entry.totalPoints}</div>
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
            marginTop: 14,
            padding: "7px 22px",
            borderRadius: 999,
            border: `2px solid ${ORANGE}`,
            color: ORANGE,
            fontSize: 13,
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
            bottom: 0,
            width: PHOTO_COLUMN_WIDTH - 20,
            height: height - 160,
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
          gap: 56,
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
