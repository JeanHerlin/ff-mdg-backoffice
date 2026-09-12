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

type Phase = "UPCOMING" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED" | "IN_PROGRESS" | "COMPLETED";

interface TournamentSummary {
  id: string;
  name: string;
  startAt: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  phase: Phase;
  registrationCount: number;
}

const PHASE_LABEL: Record<Phase, string> = {
  UPCOMING: "À venir",
  REGISTRATION_OPEN: "Inscriptions ouvertes",
  REGISTRATION_CLOSED: "Inscriptions closes",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
};

const PHASE_VARIANT: Record<Phase, "default" | "muted" | "accent" | "outline"> = {
  UPCOMING: "muted",
  REGISTRATION_OPEN: "default",
  REGISTRATION_CLOSED: "outline",
  IN_PROGRESS: "accent",
  COMPLETED: "outline",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function TournamentsTable() {
  const router = useRouter();
  const [items, setItems] = useState<TournamentSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  function load() {
    setLoading(true);
    apiRequestWithMeta<TournamentSummary[]>(`/tournaments?page=${page}&perPage=10`)
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
          Créer un tournoi
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Tournoi</th>
                <th className="px-4 py-3 font-medium">Coup d&apos;envoi</th>
                <th className="px-4 py-3 font-medium">Inscriptions</th>
                <th className="px-4 py-3 font-medium">Équipes</th>
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
                    Aucun tournoi pour le moment.
                  </td>
                </tr>
              ) : (
                items.map((tournament) => (
                  <tr
                    key={tournament.id}
                    onClick={() => router.push(`/ligues/${tournament.id}`)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{tournament.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(tournament.startAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(tournament.registrationOpensAt)} → {formatDate(tournament.registrationClosesAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{tournament.registrationCount}</td>
                    <td className="px-4 py-3">
                      <Badge variant={PHASE_VARIANT[tournament.phase]}>{PHASE_LABEL[tournament.phase]}</Badge>
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

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Créer un tournoi">
        <CreateTournamentForm
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

function CreateTournamentForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [registrationOpensAt, setRegistrationOpensAt] = useState("");
  const [registrationClosesAt, setRegistrationClosesAt] = useState("");
  const [startAt, setStartAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!registrationOpensAt || !registrationClosesAt || !startAt) {
      setError("Renseignez les trois dates.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await apiRequest("/tournaments", {
        method: "POST",
        body: {
          name: name.trim(),
          description: description.trim() || undefined,
          registrationOpensAt: new Date(registrationOpensAt).toISOString(),
          registrationClosesAt: new Date(registrationClosesAt).toISOString(),
          startAt: new Date(startAt).toISOString(),
        },
      });
      onCreated();
    } catch (err) {
      setError(
        err instanceof ApiError && err.message === "tournaments.dates_invalid"
          ? "La clôture des inscriptions doit être après l'ouverture, et au plus tard au coup d'envoi."
          : err instanceof ApiError && err.message === "auth.forbidden"
            ? "Votre compte n'a pas la permission \"Ligues & tournois\" — demandez à un super-admin de vous l'accorder dans Administrateurs."
            : `Une erreur est survenue, réessayez.${err instanceof ApiError ? ` (${err.message})` : ""}`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tournament-name">Nom du tournoi</Label>
        <Input
          id="tournament-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={3}
          maxLength={80}
          placeholder="Booyah Cup — Saison 1"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tournament-description">Description (optionnelle)</Label>
        <textarea
          id="tournament-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={3}
          className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Format, dotation, règlement..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tournament-reg-open">Ouverture des inscriptions</Label>
        <DateTimePicker id="tournament-reg-open" value={registrationOpensAt} onChange={setRegistrationOpensAt} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tournament-reg-close">Clôture des inscriptions</Label>
        <DateTimePicker id="tournament-reg-close" value={registrationClosesAt} onChange={setRegistrationClosesAt} />
        <p className="text-xs text-muted-foreground">
          C&apos;est seulement après cette date que la première étape (groupes) pourra être créée et tirée au sort.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tournament-start">Coup d&apos;envoi prévu</Label>
        <DateTimePicker id="tournament-start" value={startAt} onChange={setStartAt} />
        <p className="text-xs text-muted-foreground">
          Indicatif — les dates réelles de chaque étape dépendent de quand vous créez et tirez au sort chaque groupe.
        </p>
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Créer le tournoi
      </Button>
    </form>
  );
}
