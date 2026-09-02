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
                <th className="px-4 py-3 font-medium">Clôturée le</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startAt) {
      setError("Choisissez une date et une heure de début.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await apiRequest("/seasons", {
        method: "POST",
        body: { name: name.trim(), startAt: new Date(startAt).toISOString() },
      });
      onCreated();
    } catch (err) {
      setError(
        err instanceof ApiError && err.message === "seasons.already_open"
          ? "Une saison est déjà en cours ou à venir — clôturez-la avant d'en créer une nouvelle."
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

      {error && <p className="text-sm text-accent">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Créer la saison
      </Button>
    </form>
  );
}
