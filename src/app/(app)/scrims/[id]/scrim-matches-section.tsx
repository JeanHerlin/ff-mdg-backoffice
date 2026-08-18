"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiRequest, ApiError } from "@/lib/api-client";

type FreeFireMap = "BERMUDA" | "PURGATORY" | "ALPINE" | "KALAHARI" | "NEXTERRA" | "SOLARA";
type MatchStatus = "PROCESSING" | "PENDING_REVIEW" | "CONFIRMED";

const MAP_LABEL: Record<FreeFireMap, string> = {
  BERMUDA: "Bermuda",
  PURGATORY: "Purgatory",
  ALPINE: "Alpine",
  KALAHARI: "Kalahari",
  NEXTERRA: "NeXTerra",
  SOLARA: "Solara",
};
const MAP_OPTIONS = (Object.entries(MAP_LABEL) as [FreeFireMap, string][]).map(([value, label]) => ({ value, label }));

const STATUS_LABEL: Record<MatchStatus, string> = {
  PROCESSING: "Analyse en cours",
  PENDING_REVIEW: "À valider",
  CONFIRMED: "Confirmé",
};

interface RosterPlayerOption {
  id: string;
  ffPseudo: string;
}

interface PlayerResult {
  id: string;
  detectedName: string;
  kills: number;
  points: number;
  validated: boolean;
  playerId: string | null;
  player: {
    id: string;
    displayName: string | null;
    playerProfile: { ffPseudo: string; ffPlayerId: string } | null;
  } | null;
}

interface TeamResult {
  id: string;
  placement: number;
  totalKills: number;
  points: number;
  isRegistered: boolean;
  validated: boolean;
  teamId: string | null;
  unmatchedLabel: string | null;
  team: { id: string; name: string; tag: string; logoUrl: string | null } | null;
  playerResults: PlayerResult[];
}

interface MatchImage {
  id: string;
  imageUrl: string;
  isValidFreeFireResult: boolean;
  ocrError: string | null;
}

interface Match {
  id: string;
  map: FreeFireMap;
  matchNumber: number;
  status: MatchStatus;
  images: MatchImage[];
  teamResults: TeamResult[];
}

export function ScrimMatchesSection({ scrimId }: { scrimId: string }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [rosterPlayers, setRosterPlayers] = useState<RosterPlayerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Match | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiRequest<Match[]>(`/scrim-matches/scrims/${scrimId}`),
      apiRequest<RosterPlayerOption[]>(`/scrim-matches/scrims/${scrimId}/roster`),
    ])
      .then(([matchData, rosterData]) => {
        setMatches(matchData ?? []);
        setRosterPlayers(rosterData ?? []);
      })
      .finally(() => setLoading(false));
  }, [scrimId]);

  useEffect(load, [load]);

  async function confirmDeleteMatch() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest(`/scrim-matches/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      load();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Résultats de matchs</CardTitle>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          Ajouter un résultat
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {loading ? (
          <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
        ) : matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun résultat de match enregistré.</p>
        ) : (
          matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              expanded={expandedId === match.id}
              onToggle={() => setExpandedId(expandedId === match.id ? null : match.id)}
              rosterPlayers={rosterPlayers}
              onChanged={load}
              onDelete={() => setDeleteTarget(match)}
            />
          ))
        )}
      </CardContent>

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Ajouter un résultat de match">
        <AddMatchForm
          scrimId={scrimId}
          onCreated={() => {
            setAddOpen(false);
            load();
          }}
        />
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Supprimer ce résultat de match ?"
        description={`Match #${deleteTarget?.matchNumber} (${deleteTarget ? MAP_LABEL[deleteTarget.map] : ""}) sera définitivement supprimé, y compris les images.`}
        confirmLabel="Supprimer"
        variant="accent"
        loading={deleting}
        onConfirm={confirmDeleteMatch}
      />
    </Card>
  );
}

function AddMatchForm({ scrimId, onCreated }: { scrimId: string; onCreated: () => void }) {
  const [map, setMap] = useState<FreeFireMap>("BERMUDA");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) {
      setError("Ajoutez au moins une capture d'écran.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("map", map);
      files.forEach((file) => formData.append("images", file));
      await apiRequest(`/scrim-matches/scrims/${scrimId}`, { method: "POST", body: formData });
      onCreated();
    } catch {
      setError("Une erreur est survenue, réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Carte</label>
        <Select value={map} onChange={(v) => setMap(v as FreeFireMap)} options={MAP_OPTIONS} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Captures d&apos;écran du résultat</label>
        <label
          htmlFor="matchImages"
          className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary"
        >
          <ImagePlus className="size-4 shrink-0" />
          {files.length > 0 ? `${files.length} image(s) sélectionnée(s)` : "Choisir une ou plusieurs images"}
        </label>
        <input
          id="matchImages"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
        <p className="text-xs text-muted-foreground">
          Ajoutez plusieurs images si le classement complet est réparti sur plusieurs écrans (utile si des joueurs
          se retrouvent capturés sur deux images à la fois — vous pourrez toujours corriger en relecture). Toute
          image sans le logo Free Fire détecté est automatiquement ignorée.
        </p>
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}

      <Button type="submit" disabled={submitting}>
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Analyser et créer le résultat
      </Button>
    </form>
  );
}

function MatchCard({
  match,
  expanded,
  onToggle,
  rosterPlayers,
  onChanged,
  onDelete,
}: {
  match: Match;
  expanded: boolean;
  onToggle: () => void;
  rosterPlayers: RosterPlayerOption[];
  onChanged: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  async function confirmMatch() {
    setConfirming(true);
    try {
      await apiRequest(`/scrim-matches/${match.id}/confirm`, { method: "POST" });
      onChanged();
    } finally {
      setConfirming(false);
    }
  }

  const registered = match.teamResults.filter((t) => t.isRegistered);
  const unregistered = match.teamResults.filter((t) => !t.isRegistered);
  const hasInvalidImage = match.images.some((img) => !img.isValidFreeFireResult);

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-muted/40"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Match #{match.matchNumber}</Badge>
          <span className="text-sm font-medium text-foreground">{MAP_LABEL[match.map]}</span>
          <Badge variant={match.status === "CONFIRMED" ? "default" : match.status === "PENDING_REVIEW" ? "muted" : "outline"}>
            {STATUS_LABEL[match.status]}
          </Badge>
        </div>
        {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="flex flex-col gap-4 border-t border-border p-4">
          {hasInvalidImage && (
            <p className="flex items-center gap-1.5 text-xs text-accent">
              <TriangleAlert className="size-3.5" />
              Une ou plusieurs images n&apos;ont pas été prises en compte (signature Free Fire non détectée).
            </p>
          )}

          {match.images.length > 0 && (
            <div className="flex flex-col gap-3">
              {match.images.map((img) => (
                <a key={img.id} href={img.imageUrl} target="_blank" rel="noopener noreferrer" title="Ouvrir en plein écran">
                  {/* eslint-disable-next-line @next/next/no-img-element -- image dynamique Cloudinary */}
                  <img
                    src={img.imageUrl}
                    alt="Capture résultat"
                    className={`max-h-[70vh] w-full rounded-md border object-contain ${img.isValidFreeFireResult ? "border-border" : "border-accent opacity-50"}`}
                  />
                </a>
              ))}
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Équipes inscrites ({registered.length})
            </p>
            <div className="flex flex-col gap-2">
              {registered.length === 0 && <p className="text-sm text-muted-foreground">Aucune.</p>}
              {registered.map((tr) => (
                <TeamResultRow key={tr.id} matchId={match.id} teamResult={tr} rosterPlayers={rosterPlayers} onChanged={onChanged} />
              ))}
            </div>
          </div>

          {unregistered.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Équipes non inscrites / non reconnues ({unregistered.length})
              </p>
              <div className="flex flex-col gap-2">
                {unregistered.map((tr) => (
                  <TeamResultRow key={tr.id} matchId={match.id} teamResult={tr} rosterPlayers={rosterPlayers} onChanged={onChanged} />
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="size-4" />
              Supprimer
            </Button>
            {match.status !== "CONFIRMED" && (
              <Button size="sm" onClick={confirmMatch} disabled={confirming}>
                {confirming ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Confirmer ce match
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const PLAYER_OPTIONS_PLACEHOLDER = { value: "", label: "Non reconnu" };

function TeamResultRow({
  matchId,
  teamResult,
  rosterPlayers,
  onChanged,
}: {
  matchId: string;
  teamResult: TeamResult;
  rosterPlayers: RosterPlayerOption[];
  onChanged: () => void;
}) {
  return (
    <div className={`rounded-lg border p-3 ${teamResult.validated ? "border-primary/40 bg-primary/5" : "border-border"}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">#{teamResult.placement}</Badge>
          {teamResult.team ? (
            <span className="text-sm font-medium text-foreground">
              {teamResult.team.name} <span className="text-muted-foreground">[{teamResult.team.tag}]</span>
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Non reconnu{teamResult.unmatchedLabel ? ` — "${teamResult.unmatchedLabel}"` : ""}</span>
          )}
          <Badge variant="outline">{teamResult.totalKills} kills</Badge>
          <Badge>{teamResult.points} pts</Badge>
        </div>
        <ValidateTeamButton matchId={matchId} teamResultId={teamResult.id} validated={teamResult.validated} onChanged={onChanged} />
      </div>

      <div className="flex flex-col gap-1.5">
        {teamResult.playerResults.map((pr) => (
          <PlayerResultRow key={pr.id} matchId={matchId} playerResult={pr} rosterPlayers={rosterPlayers} onChanged={onChanged} />
        ))}
      </div>
    </div>
  );
}

function ValidateTeamButton({
  matchId,
  teamResultId,
  validated,
  onChanged,
}: {
  matchId: string;
  teamResultId: string;
  validated: boolean;
  onChanged: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    try {
      await apiRequest(`/scrim-matches/${matchId}/team-results/${teamResultId}`, {
        method: "PATCH",
        body: { validated: !validated },
      });
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button size="sm" variant={validated ? "outline" : "default"} onClick={toggle} disabled={saving}>
      {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
      {validated ? "Validé" : "Valider l'équipe"}
    </Button>
  );
}

function PlayerResultRow({
  matchId,
  playerResult,
  rosterPlayers,
  onChanged,
}: {
  matchId: string;
  playerResult: PlayerResult;
  rosterPlayers: RosterPlayerOption[];
  onChanged: () => void;
}) {
  const [kills, setKills] = useState(String(playerResult.kills));
  const [savingKills, setSavingKills] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [savingValidation, setSavingValidation] = useState(false);

  const playerOptions = [
    PLAYER_OPTIONS_PLACEHOLDER,
    ...rosterPlayers.map((p) => ({ value: p.id, label: p.ffPseudo })),
  ];

  async function saveKills() {
    const value = Number(kills);
    if (!Number.isFinite(value) || value < 0) return;
    setSavingKills(true);
    try {
      await apiRequest(`/scrim-matches/${matchId}/player-results/${playerResult.id}`, {
        method: "PATCH",
        body: { kills: value },
      });
      onChanged();
    } finally {
      setSavingKills(false);
    }
  }

  async function reassignPlayer(playerId: string) {
    setReassigning(true);
    try {
      await apiRequest(`/scrim-matches/${matchId}/player-results/${playerResult.id}`, {
        method: "PATCH",
        body: { playerId: playerId || null },
      });
      onChanged();
    } finally {
      setReassigning(false);
    }
  }

  async function toggleValidated() {
    setSavingValidation(true);
    try {
      await apiRequest(`/scrim-matches/${matchId}/player-results/${playerResult.id}`, {
        method: "PATCH",
        body: { validated: !playerResult.validated },
      });
      onChanged();
    } finally {
      setSavingValidation(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 px-2.5 py-2 text-sm">
      <span className="min-w-32 truncate text-muted-foreground" title={playerResult.detectedName}>
        {playerResult.detectedName}
      </span>
      <Select
        value={playerResult.playerId ?? ""}
        onChange={reassignPlayer}
        options={playerOptions}
        className="w-44"
        disabled={reassigning}
      />
      {!playerResult.playerId && (
        <span className="text-xs text-accent">Non reconnu — sélectionnez le bon joueur</span>
      )}
      <Input
        type="number"
        min={0}
        value={kills}
        onChange={(e) => setKills(e.target.value)}
        onBlur={saveKills}
        className="w-16"
        disabled={savingKills}
      />
      <span className="text-xs text-muted-foreground">kills</span>
      <Button size="sm" variant={playerResult.validated ? "outline" : "default"} onClick={toggleValidated} disabled={savingValidation}>
        {savingValidation ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        {playerResult.validated ? "Validé" : "Valider"}
      </Button>
    </div>
  );
}
