"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Sheet } from "@/components/ui/sheet";
import { apiRequest, apiRequestWithMeta, ApiError } from "@/lib/api-client";

type Phase = "UPCOMING" | "ACTIVE" | "CLOSED";

interface SeasonSummary {
  id: string;
  name: string;
  startAt: string;
  endAt: string;
  closedAt: string | null;
  phase: Phase;
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

// Durée PRÉVUE (startAt -> endAt), pas la durée réelle une fois clôturée —
// arrondie au mois inférieur, en jours si ça ne fait pas un mois complet.
function formatDuration(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  if (months >= 1) return `${months} mois`;
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  return `${days} jour${days > 1 ? "s" : ""}`;
}

export function SeasonsTable() {
  const router = useRouter();
  const [items, setItems] = useState<SeasonSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  function load() {
    setLoading(true);
    apiRequestWithMeta<SeasonSummary[]>(`/seasons?page=${page}&perPage=10`)
      .then(({ data, meta }) => {
        setItems(data ?? []);
        setTotalPages(meta?.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [page]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Créer une saison
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Saison</th>
                <th className="px-4 py-3 font-medium">Début</th>
                <th className="px-4 py-3 font-medium">Durée prévue</th>
                <th className="px-4 py-3 font-medium">Clôturée le</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Aucune saison pour le moment.
                  </td>
                </tr>
              ) : (
                items.map((season) => (
                  <tr
                    key={season.id}
                    onClick={() => router.push(`/saisons/${season.id}`)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{season.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(season.startAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDuration(season.startAt, season.endAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{season.closedAt ? formatDate(season.closedAt) : "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={PHASE_VARIANT[season.phase]}>{PHASE_LABEL[season.phase]}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <span>
            Page {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Créer une saison">
        <CreateSeasonForm
          onCreated={() => {
            setCreateOpen(false);
            setPage(1);
            load();
          }}
        />
      </Sheet>
    </div>
  );
}

function CreateSeasonForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duration = startAt && endAt ? formatDuration(startAt, endAt) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startAt || !endAt) {
      setError("Choisissez une date de début et une date de fin prévue.");
      return;
    }
    if (new Date(startAt) >= new Date(endAt)) {
      setError("La fin prévue doit être après le début.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await apiRequest("/seasons", {
        method: "POST",
        body: { name: name.trim(), startAt: new Date(startAt).toISOString(), endAt: new Date(endAt).toISOString() },
      });
      onCreated();
    } catch (err) {
      setError(
        err instanceof ApiError && err.message === "seasons.already_open"
          ? "Une saison est déjà en cours ou à venir — clôturez-la avant d'en créer une nouvelle."
          : err instanceof ApiError && err.message === "seasons.dates_invalid"
            ? "La fin prévue doit être après le début."
            : "Une erreur est survenue, réessayez."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="season-name">Nom de la saison</Label>
        <Input
          id="season-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={3}
          maxLength={80}
          placeholder="Saison 1 — 2026"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="season-start">Début de la saison</Label>
        <DateTimePicker id="season-start" value={startAt} onChange={setStartAt} />
        <p className="text-xs text-muted-foreground">
          Le mercato se ferme automatiquement à cette date et rouvrira à la clôture de la saison.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="season-end">Fin prévue de la saison</Label>
        <DateTimePicker id="season-end" value={endAt} onChange={setEndAt} />
        <p className="text-xs text-muted-foreground">
          Indicative — la saison ne se termine réellement qu'à sa clôture manuelle.
          {duration && ` Durée prévue : ${duration}.`}
        </p>
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Créer la saison
      </Button>
    </form>
  );
}
