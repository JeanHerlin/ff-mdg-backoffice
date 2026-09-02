"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Loader2, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiRequest } from "@/lib/api-client";

type Phase = "UPCOMING" | "ACTIVE" | "CLOSED";

interface SeasonData {
  id: string;
  name: string;
  startAt: string;
  closedAt: string | null;
  phase: Phase;
}

interface StandingEntry {
  teamId: string;
  name: string;
  tag: string;
  logoUrl: string | null;
  totalPoints: number;
  totalPlacementPoints: number;
  totalKillPoints: number;
  totalKills: number;
  matchesPlayed: number;
  booyahCount: number;
}

const PHASE_LABEL: Record<Phase, string> = {
  UPCOMING: "À venir",
  ACTIVE: "En cours",
  CLOSED: "Clôturée",
};

const PHASE_VARIANT: Record<Phase, "default" | "muted" | "accent" | "outline"> = {
  UPCOMING: "muted",
  ACTIVE: "accent",
  CLOSED: "outline",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Logo({ url, label }: { url: string | null; label: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- image dynamique servie par Cloudinary
    return <img src={url} alt={label} className="size-7 rounded-md object-cover" />;
  }
  return (
    <div className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-[10px] font-bold text-primary">
      {label.slice(0, 2)}
    </div>
  );
}

export function SeasonDetail() {
  const params = useParams<{ id: string }>();

  const [season, setSeason] = useState<SeasonData | null | undefined>(undefined);
  const [standings, setStandings] = useState<StandingEntry[] | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const loadSeason = useCallback(() => {
    apiRequest<{ season: SeasonData }>(`/seasons/${params.id}`)
      .then((d) => setSeason(d?.season ?? null))
      .catch(() => setSeason(null));
  }, [params.id]);

  const loadStandings = useCallback(() => {
    apiRequest<StandingEntry[]>(`/seasons/${params.id}/standings`).then((d) => setStandings(d ?? []));
  }, [params.id]);

  useEffect(loadSeason, [loadSeason]);
  useEffect(loadStandings, [loadStandings]);

  async function handleClose() {
    setClosing(true);
    try {
      await apiRequest(`/seasons/${params.id}/close`, { method: "POST" });
      setCloseOpen(false);
      loadSeason();
    } finally {
      setClosing(false);
    }
  }

  if (season === undefined) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (season === null) {
    return <p className="py-20 text-center text-muted-foreground">Saison introuvable.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{season.name}</h1>
            <Badge variant={PHASE_VARIANT[season.phase]}>{PHASE_LABEL[season.phase]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Début : {formatDate(season.startAt)}
            {season.closedAt && ` — Clôturée le ${formatDate(season.closedAt)}`}
          </p>
        </div>
        {season.phase === "ACTIVE" && (
          <Button variant="outline" onClick={() => setCloseOpen(true)}>
            <CheckCircle2 className="size-4" />
            Clôturer la saison
          </Button>
        )}
      </div>

      {season.phase === "ACTIVE" && (
        <p className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
          Mercato fermé — les transferts rouvriront automatiquement à la clôture de cette saison.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Trophy className="size-4" />
            Classement de la saison
          </CardTitle>
        </CardHeader>
        <CardContent>
          {standings === null ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : standings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun résultat confirmé pour le moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3 font-medium">#</th>
                    <th className="py-2 pr-3 font-medium">Équipe</th>
                    <th className="py-2 pr-3 font-medium">Matchs</th>
                    <th className="py-2 pr-3 font-medium">Kills</th>
                    <th className="py-2 pr-3 font-medium">Pts placement</th>
                    <th className="py-2 pr-3 font-medium">Pts kills</th>
                    <th className="py-2 pr-3 font-medium">Booyah</th>
                    <th className="py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((entry, idx) => (
                    <tr key={entry.teamId} className="border-b border-border last:border-0">
                      <td className="py-2 pr-3 text-muted-foreground">{idx + 1}</td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <Logo url={entry.logoUrl} label={entry.tag} />
                          <span className="font-medium text-foreground">
                            {entry.name} <span className="text-muted-foreground">[{entry.tag}]</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">{entry.matchesPlayed}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{entry.totalKills}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{entry.totalPlacementPoints}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{entry.totalKillPoints}</td>
                      <td className="py-2 pr-3 font-semibold text-foreground">{entry.booyahCount}</td>
                      <td className="py-2 font-semibold text-foreground">{entry.totalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title="Clôturer cette saison ?"
        description="Le classement sera figé, la saison ira au palmarès des équipes classées dans le top 3, et le mercato rouvrira aussitôt jusqu'au début de la saison suivante."
        confirmLabel="Clôturer"
        loading={closing}
        onConfirm={handleClose}
      />
    </div>
  );
}
