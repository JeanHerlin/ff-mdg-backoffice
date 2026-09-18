"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Settings2, Trash2, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { apiRequest, ApiError } from "@/lib/api-client";

interface SeasonData {
  id: string;
  name: string;
  phase: "UPCOMING" | "ACTIVE" | "CLOSED";
}

interface StandingEntry {
  teamId: string;
  name: string;
  tag: string;
  logoUrl: string | null;
  totalPoints: number;
}

interface Adjustment {
  id: string;
  points: number;
  reason: string;
  createdAt: string;
  season: { id: string; name: string };
  createdBy: { id: string; displayName: string; email: string };
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function PointAdjustmentsPage() {
  const [season, setSeason] = useState<SeasonData | null | undefined>(undefined);
  const [standings, setStandings] = useState<StandingEntry[] | null>(null);
  const [target, setTarget] = useState<StandingEntry | null>(null);

  const loadSeason = useCallback(() => {
    apiRequest<{ season: SeasonData | null }>("/seasons/current")
      .then((d) => setSeason(d?.season ?? null))
      .catch(() => setSeason(null));
  }, []);

  const loadStandings = useCallback((seasonId: string) => {
    apiRequest<StandingEntry[]>(`/seasons/${seasonId}/standings`).then((d) => setStandings(d ?? []));
  }, []);

  useEffect(loadSeason, [loadSeason]);
  useEffect(() => {
    if (season) loadStandings(season.id);
  }, [season, loadStandings]);

  if (season === undefined) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (season === null) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Aucune saison active pour le moment — créez ou démarrez une saison pour pouvoir ajuster les points d&apos;une équipe.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Trophy className="size-4" />
            Classement de la saison — {season.name}
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
                    <th className="py-2 pr-3 font-medium">Total</th>
                    <th className="py-2 font-medium" />
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
                      <td className="py-2 pr-3 font-semibold text-foreground">{entry.totalPoints}</td>
                      <td className="py-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => setTarget(entry)}>
                          <Settings2 className="size-4" />
                          Ajuster les points
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!target} onClose={() => setTarget(null)} title={target ? `Ajuster — ${target.name}` : undefined}>
        {target && (
          <AdjustmentPanel
            team={target}
            onChanged={() => loadStandings(season.id)}
          />
        )}
      </Sheet>
    </div>
  );
}

function AdjustmentPanel({ team, onChanged }: { team: StandingEntry; onChanged: () => void }) {
  const [history, setHistory] = useState<Adjustment[] | null>(null);
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHistory = useCallback(() => {
    apiRequest<Adjustment[]>(`/point-adjustments?teamId=${team.teamId}`).then((d) => setHistory(d ?? []));
  }, [team.teamId]);

  useEffect(loadHistory, [loadHistory]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(points);
    if (!Number.isInteger(value) || value === 0) {
      setError("Entrez un nombre de points entier, différent de 0 (négatif pour une sanction).");
      return;
    }
    setSaving(true);
    try {
      await apiRequest("/point-adjustments", {
        method: "POST",
        body: { teamId: team.teamId, points: value, reason: reason.trim() },
      });
      setPoints("");
      setReason("");
      loadHistory();
      onChanged();
    } catch (err) {
      setError(
        err instanceof ApiError && err.message === "point_adjustments.no_active_season"
          ? "Aucune saison active — impossible d'ajuster des points."
          : "Une erreur est survenue, réessayez."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await apiRequest(`/point-adjustments/${id}`, { method: "DELETE" });
      loadHistory();
      onChanged();
    } catch {
      setError("Impossible de supprimer cet ajustement (saison déjà clôturée ?).");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="adj-points">Points (signés)</Label>
          <Input
            id="adj-points"
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="-5 pour une sanction, +5 pour un bonus"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="adj-reason">Motif</Label>
          <textarea
            id="adj-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            minLength={3}
            maxLength={500}
            required
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {error && <p className="text-sm text-accent">{error}</p>}
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Enregistrer l&apos;ajustement
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Historique</p>
        {history === null ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun ajustement pour cette équipe.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((adj) => (
              <li key={adj.id} className="flex items-start justify-between gap-2 rounded-lg border border-border p-3">
                <div className="flex flex-col gap-0.5">
                  <span className={`text-sm font-semibold ${adj.points > 0 ? "text-primary" : "text-accent"}`}>
                    {adj.points > 0 ? `+${adj.points}` : adj.points} pts — {adj.season.name}
                  </span>
                  <span className="text-sm text-muted-foreground">{adj.reason}</span>
                  <span className="text-xs text-muted-foreground">
                    {adj.createdBy.displayName} · {formatDate(adj.createdAt)}
                  </span>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  disabled={deletingId === adj.id}
                  onClick={() => handleDelete(adj.id)}
                >
                  {deletingId === adj.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
