"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { apiRequest, ApiError } from "@/lib/api-client";
import { OfflineScrimResultsSection } from "./offline-scrim-results-section";

interface OfflineScrimTeam {
  id: string;
  name: string;
  tag: string | null;
}

interface OfflineScrimData {
  id: string;
  name: string;
  startAt: string;
  teams: OfflineScrimTeam[];
  _count: { matches: number };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function OfflineScrimDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [scrim, setScrim] = useState<OfflineScrimData | null | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);
  const [teamFormOpen, setTeamFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<OfflineScrimTeam | null>(null);
  const [deleteTeamTarget, setDeleteTeamTarget] = useState<OfflineScrimTeam | null>(null);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [deleteScrimOpen, setDeleteScrimOpen] = useState(false);
  const [deletingScrim, setDeletingScrim] = useState(false);

  const load = useCallback(() => {
    apiRequest<{ scrim: OfflineScrimData }>(`/offline-scrims/${params.id}`)
      .then((d) => setScrim(d?.scrim ?? null))
      .catch(() => setScrim(null));
  }, [params.id]);

  useEffect(load, [load]);

  async function confirmDeleteTeam() {
    if (!deleteTeamTarget || !scrim) return;
    setDeletingTeam(true);
    try {
      await apiRequest(`/offline-scrims/${scrim.id}/teams/${deleteTeamTarget.id}`, { method: "DELETE" });
      setDeleteTeamTarget(null);
      load();
    } finally {
      setDeletingTeam(false);
    }
  }

  async function confirmDeleteScrim() {
    if (!scrim) return;
    setDeletingScrim(true);
    try {
      await apiRequest(`/offline-scrims/${scrim.id}`, { method: "DELETE" });
      router.push("/scrims-externes");
    } finally {
      setDeletingScrim(false);
    }
  }

  if (scrim === undefined) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (scrim === null) {
    return <p className="py-20 text-center text-muted-foreground">Scrim introuvable.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{scrim.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Début : {formatDate(scrim.startAt)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Modifier
          </Button>
          <Button variant="outline" onClick={() => setDeleteScrimOpen(true)}>
            <Trash2 className="size-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Équipes ({scrim.teams.length})</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingTeam(null);
              setTeamFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Ajouter une équipe
          </Button>
        </CardHeader>
        <CardContent>
          {scrim.teams.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune équipe saisie — ajoutez les équipes participantes avant de saisir un résultat.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {scrim.teams.map((team) => (
                <span
                  key={team.id}
                  className="flex items-center gap-2 rounded-full border border-border bg-muted/40 py-1 pl-3 pr-1.5 text-sm"
                >
                  <span className="font-medium text-foreground">{team.name}</span>
                  {team.tag && <span className="text-muted-foreground">[{team.tag}]</span>}
                  <button
                    onClick={() => {
                      setEditingTeam(team);
                      setTeamFormOpen(true);
                    }}
                    className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Modifier"
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    onClick={() => setDeleteTeamTarget(team)}
                    className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-accent"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <OfflineScrimResultsSection scrimId={scrim.id} teams={scrim.teams} scrimName={scrim.name} scrimStartAt={scrim.startAt} />

      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="Modifier le scrim">
        <EditScrimForm
          scrim={scrim}
          onSaved={() => {
            setEditOpen(false);
            load();
          }}
        />
      </Sheet>

      <Sheet
        open={teamFormOpen}
        onClose={() => setTeamFormOpen(false)}
        title={editingTeam ? "Modifier l'équipe" : "Ajouter une équipe"}
      >
        <TeamForm
          scrimId={scrim.id}
          team={editingTeam}
          onSaved={() => {
            setTeamFormOpen(false);
            load();
          }}
        />
      </Sheet>

      <ConfirmDialog
        open={!!deleteTeamTarget}
        onOpenChange={(open) => !open && setDeleteTeamTarget(null)}
        title={`Supprimer "${deleteTeamTarget?.name}" ?`}
        description="Les résultats déjà saisis pour cette équipe redeviendront non assignés — ils ne sont pas supprimés."
        confirmLabel="Supprimer"
        variant="accent"
        loading={deletingTeam}
        onConfirm={confirmDeleteTeam}
      />

      <ConfirmDialog
        open={deleteScrimOpen}
        onOpenChange={setDeleteScrimOpen}
        title={`Supprimer "${scrim.name}" ?`}
        description="Le scrim, ses équipes et tous ses résultats seront définitivement supprimés. Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="accent"
        loading={deletingScrim}
        onConfirm={confirmDeleteScrim}
      />
    </div>
  );
}

function EditScrimForm({ scrim, onSaved }: { scrim: OfflineScrimData; onSaved: () => void }) {
  const [name, setName] = useState(scrim.name);
  const [startAt, setStartAt] = useState(scrim.startAt.slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiRequest(`/offline-scrims/${scrim.id}`, {
        method: "PATCH",
        body: { name: name.trim(), startAt: new Date(startAt).toISOString() },
      });
      onSaved();
    } catch {
      setError("Une erreur est survenue, réessayez.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-offline-scrim-name">Nom du scrim</Label>
        <Input id="edit-offline-scrim-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={3} maxLength={80} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-offline-scrim-start">Date de début</Label>
        <DateTimePicker id="edit-offline-scrim-start" value={startAt} onChange={setStartAt} />
      </div>
      {error && <p className="text-sm text-accent">{error}</p>}
      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Enregistrer
      </Button>
    </form>
  );
}

function TeamForm({ scrimId, team, onSaved }: { scrimId: string; team: OfflineScrimTeam | null; onSaved: () => void }) {
  const [name, setName] = useState(team?.name ?? "");
  const [tag, setTag] = useState(team?.tag ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const body = { name: name.trim(), tag: tag.trim() || undefined };
      if (team) {
        await apiRequest(`/offline-scrims/${scrimId}/teams/${team.id}`, { method: "PATCH", body });
      } else {
        await apiRequest(`/offline-scrims/${scrimId}/teams`, { method: "POST", body });
      }
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError && err.message === "offline_scrims.team_name_taken"
          ? "Une équipe de ce nom existe déjà dans ce scrim."
          : "Une erreur est survenue, réessayez."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="offline-team-name">Nom de l&apos;équipe</Label>
        <Input id="offline-team-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={1} maxLength={60} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="offline-team-tag">Tag (facultatif)</Label>
        <Input id="offline-team-tag" value={tag} onChange={(e) => setTag(e.target.value)} maxLength={10} />
      </div>
      {error && <p className="text-sm text-accent">{error}</p>}
      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        {team ? "Enregistrer" : "Ajouter l'équipe"}
      </Button>
    </form>
  );
}
