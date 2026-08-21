"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  TriangleAlert,
  Trophy,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TabList, TabButton } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/api-client";

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
  placementPoints: number;
  killPoints: number;
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
  lobbyNumber: number;
  status: MatchStatus;
  images: MatchImage[];
  teamResults: TeamResult[];
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

function GlobalStandingsTable({ standings }: { standings: StandingEntry[] }) {
  if (standings.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun résultat confirmé pour le moment.</p>;
  }
  return (
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
  );
}

export function ScrimMatchesSection({ scrimId, lobbyMax }: { scrimId: string; lobbyMax: number }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [lobbies, setLobbies] = useState<number[]>([]);
  const [activeLobby, setActiveLobby] = useState<number | undefined>(undefined);
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>("global");
  const [rosterPlayers, setRosterPlayers] = useState<RosterPlayerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Match | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadLobbies = useCallback(() => {
    apiRequest<number[]>(`/scrim-matches/scrims/${scrimId}/lobbies`).then((data) => setLobbies(data ?? []));
  }, [scrimId]);

  const loadMatchesAndStandings = useCallback(
    (lobbyNumber: number | undefined) => {
      setLoading(true);
      const query = lobbyNumber !== undefined ? `?lobbyNumber=${lobbyNumber}` : "";
      Promise.all([
        apiRequest<Match[]>(`/scrim-matches/scrims/${scrimId}${query}`),
        apiRequest<StandingEntry[]>(`/scrim-matches/scrims/${scrimId}/standings${query}`),
      ])
        .then(([matchData, standingsData]) => {
          setMatches(matchData ?? []);
          setStandings(standingsData ?? []);
        })
        .finally(() => setLoading(false));
    },
    [scrimId]
  );

  const loadStandingsOnly = useCallback(() => {
    const query = activeLobby !== undefined ? `?lobbyNumber=${activeLobby}` : "";
    apiRequest<StandingEntry[]>(`/scrim-matches/scrims/${scrimId}/standings${query}`).then((data) => setStandings(data ?? []));
  }, [scrimId, activeLobby]);

  useEffect(() => {
    loadLobbies();
    apiRequest<RosterPlayerOption[]>(`/scrim-matches/scrims/${scrimId}/roster`).then((data) => setRosterPlayers(data ?? []));
  }, [scrimId, loadLobbies]);

  useEffect(() => {
    loadMatchesAndStandings(activeLobby);
  }, [activeLobby, loadMatchesAndStandings]);

  function selectLobby(lobbyNumber: number | undefined) {
    setActiveLobby(lobbyNumber);
    setActiveTab("global");
  }

  // --- Mises à jour locales — jamais de rechargement complet après une
  // simple validation/édition/suppression, seulement après création ou
  // suppression d'un match entier. Le classement global, lui, est
  // recalculé côté serveur donc simplement re-fetché après toute mutation
  // susceptible de le changer (confirmation, edition, suppression).
  function withTeamResults(matchId: string, updater: (teamResults: TeamResult[]) => TeamResult[]) {
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, teamResults: updater(m.teamResults) } : m)));
  }

  function patchTeamResult(matchId: string, teamResultId: string, patch: Partial<TeamResult>) {
    withTeamResults(matchId, (trs) => trs.map((tr) => (tr.id === teamResultId ? { ...tr, ...patch } : tr)));
  }

  function removeTeamResult(matchId: string, teamResultId: string) {
    withTeamResults(matchId, (trs) => trs.filter((tr) => tr.id !== teamResultId));
  }

  function patchPlayerResult(matchId: string, teamResultId: string, playerResultId: string, patch: Partial<PlayerResult>) {
    withTeamResults(matchId, (trs) =>
      trs.map((tr) =>
        tr.id === teamResultId
          ? { ...tr, playerResults: tr.playerResults.map((pr) => (pr.id === playerResultId ? { ...pr, ...patch } : pr)) }
          : tr
      )
    );
  }

  function removePlayerResult(matchId: string, teamResultId: string, playerResultId: string) {
    withTeamResults(matchId, (trs) =>
      trs.map((tr) => (tr.id === teamResultId ? { ...tr, playerResults: tr.playerResults.filter((pr) => pr.id !== playerResultId) } : tr))
    );
  }

  function patchMatch(matchId: string, patch: Partial<Match>) {
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, ...patch } : m)));
  }

  async function confirmDeleteMatch() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest(`/scrim-matches/${deleteTarget.id}`, { method: "DELETE" });
      setMatches((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      if (activeTab === deleteTarget.id) setActiveTab("global");
      setDeleteTarget(null);
      loadStandingsOnly();
    } finally {
      setDeleting(false);
    }
  }

  const activeMatch = matches.find((m) => m.id === activeTab);

  return (
    <Card className="mt-6">
      <CardHeader className="gap-3">
        <div className="flex flex-row items-center justify-between">
          <CardTitle>Résultats de matchs</CardTitle>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Ajouter un résultat
          </Button>
        </div>

        {lobbies.length > 1 && (
          <TabList className="border-b-0">
            <TabButton active={activeLobby === undefined} onClick={() => selectLobby(undefined)}>
              Tous les lobbies
            </TabButton>
            {lobbies.map((n) => (
              <TabButton key={n} active={activeLobby === n} onClick={() => selectLobby(n)}>
                Lobby {n}
              </TabButton>
            ))}
          </TabList>
        )}

        {!loading && (
          <TabList>
            <TabButton active={activeTab === "global"} onClick={() => setActiveTab("global")}>
              <Trophy className="mr-1 inline size-3.5" />
              Résultat global
            </TabButton>
            {matches.map((match) => (
              <TabButton key={match.id} active={activeTab === match.id} onClick={() => setActiveTab(match.id)}>
                Match #{match.matchNumber} — {MAP_LABEL[match.map]}
              </TabButton>
            ))}
          </TabList>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {loading ? (
          <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
        ) : activeTab === "global" ? (
          <GlobalStandingsTable standings={standings} />
        ) : activeMatch ? (
          <MatchCard
            match={activeMatch}
            rosterPlayers={rosterPlayers}
            onPatchTeamResult={(teamResultId, patch) => patchTeamResult(activeMatch.id, teamResultId, patch)}
            onRemoveTeamResult={(teamResultId) => {
              removeTeamResult(activeMatch.id, teamResultId);
              loadStandingsOnly();
            }}
            onPatchPlayerResult={(teamResultId, playerResultId, patch) =>
              patchPlayerResult(activeMatch.id, teamResultId, playerResultId, patch)
            }
            onRemovePlayerResult={(teamResultId, playerResultId) => {
              removePlayerResult(activeMatch.id, teamResultId, playerResultId);
              loadStandingsOnly();
            }}
            onPatchMatch={(patch) => {
              patchMatch(activeMatch.id, patch);
              loadStandingsOnly();
            }}
            onResultsChanged={loadStandingsOnly}
            onDelete={() => setDeleteTarget(activeMatch)}
          />
        ) : matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun résultat de match enregistré.</p>
        ) : null}
      </CardContent>

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Ajouter un résultat de match">
        <AddMatchForm
          scrimId={scrimId}
          lobbyMax={lobbyMax}
          defaultLobbyNumber={activeLobby ?? 1}
          onCreated={(match) => {
            setAddOpen(false);
            setLobbies((prev) => [...new Set([...prev, match.lobbyNumber])].sort((a, b) => a - b));
            if (activeLobby === undefined || match.lobbyNumber === activeLobby) {
              setMatches((prev) => [...prev, match]);
            }
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

function CaptureInput({
  label,
  hint,
  file,
  onChange,
}: {
  label: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {previewUrl ? (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local avant envoi, jamais une URL Cloudinary */}
          <img src={previewUrl} alt={label} className="max-h-48 w-auto rounded-md border border-border object-contain" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground shadow"
            aria-label="Retirer cette image"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary">
          <ImagePlus className="size-4 shrink-0" />
          Choisir une image
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function AddMatchForm({
  scrimId,
  lobbyMax,
  defaultLobbyNumber,
  onCreated,
}: {
  scrimId: string;
  lobbyMax: number;
  defaultLobbyNumber: number;
  onCreated: (match: Match) => void;
}) {
  const [map, setMap] = useState<FreeFireMap>("BERMUDA");
  const [lobbyNumber, setLobbyNumber] = useState(String(Math.min(Math.max(defaultLobbyNumber, 1), Math.max(lobbyMax, 1))));
  const [capture1, setCapture1] = useState<File | null>(null);
  const [capture2, setCapture2] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lobbyOptions = Array.from({ length: Math.max(lobbyMax, 1) }, (_, i) => ({
    value: String(i + 1),
    label: `Lobby ${i + 1}`,
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!capture1 && !capture2) {
      setError("Ajoutez au moins une capture.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("map", map);
      formData.set("lobbyNumber", lobbyNumber);
      if (capture1) formData.set("capture1", capture1);
      if (capture2) formData.set("capture2", capture2);
      const data = await apiRequest<{ match: Match }>(`/scrim-matches/scrims/${scrimId}`, { method: "POST", body: formData });
      if (data?.match) onCreated(data.match);
    } catch {
      setError("Une erreur est survenue, réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Carte</label>
          <Select value={map} onChange={(v) => setMap(v as FreeFireMap)} options={MAP_OPTIONS} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Lobby</label>
          <Select value={lobbyNumber} onChange={setLobbyNumber} options={lobbyOptions} />
        </div>
      </div>

      <CaptureInput
        label="Capture 1 — les 10 premières équipes, sans coupure"
        hint="Le classement doit commencer à la 1ère place et aller jusqu'à la 10ème sans être coupé en plein milieu d'une ligne."
        file={capture1}
        onChange={setCapture1}
      />
      <CaptureInput
        label="Capture 2 — depuis la 11ème équipe jusqu'à la fin"
        hint="Le classement doit commencer au plus tard à la 11ème place et aller jusqu'à la dernière équipe sans être coupé."
        file={capture2}
        onChange={setCapture2}
      />

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
  rosterPlayers,
  onPatchTeamResult,
  onRemoveTeamResult,
  onPatchPlayerResult,
  onRemovePlayerResult,
  onPatchMatch,
  onResultsChanged,
  onDelete,
}: {
  match: Match;
  rosterPlayers: RosterPlayerOption[];
  onPatchTeamResult: (teamResultId: string, patch: Partial<TeamResult>) => void;
  onRemoveTeamResult: (teamResultId: string) => void;
  onPatchPlayerResult: (teamResultId: string, playerResultId: string, patch: Partial<PlayerResult>) => void;
  onRemovePlayerResult: (teamResultId: string, playerResultId: string) => void;
  onPatchMatch: (patch: Partial<Match>) => void;
  onResultsChanged: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  async function confirmMatch() {
    setConfirming(true);
    try {
      await apiRequest(`/scrim-matches/${match.id}/confirm`, { method: "POST" });
      onPatchMatch({ status: "CONFIRMED" });
    } finally {
      setConfirming(false);
    }
  }

  const registered = match.teamResults.filter((t) => t.isRegistered);
  const unregistered = match.teamResults.filter((t) => !t.isRegistered);
  const hasInvalidImage = match.images.some((img) => !img.isValidFreeFireResult);

  return (
    <div className="flex flex-col gap-4">
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
            <TeamResultRow
              key={tr.id}
              matchId={match.id}
              teamResult={tr}
              rosterPlayers={rosterPlayers}
              onPatchTeamResult={(patch) => onPatchTeamResult(tr.id, patch)}
              onRemoveTeamResult={() => onRemoveTeamResult(tr.id)}
              onPatchPlayerResult={(playerResultId, patch) => onPatchPlayerResult(tr.id, playerResultId, patch)}
              onRemovePlayerResult={(playerResultId) => onRemovePlayerResult(tr.id, playerResultId)}
              onResultsChanged={onResultsChanged}
            />
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
              <TeamResultRow
                key={tr.id}
                matchId={match.id}
                teamResult={tr}
                rosterPlayers={rosterPlayers}
                onPatchTeamResult={(patch) => onPatchTeamResult(tr.id, patch)}
                onRemoveTeamResult={() => onRemoveTeamResult(tr.id)}
                onPatchPlayerResult={(playerResultId, patch) => onPatchPlayerResult(tr.id, playerResultId, patch)}
                onRemovePlayerResult={(playerResultId) => onRemovePlayerResult(tr.id, playerResultId)}
                onResultsChanged={onResultsChanged}
              />
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
  );
}

const PLAYER_OPTIONS_PLACEHOLDER = { value: "", label: "Non reconnu" };

function TeamResultRow({
  matchId,
  teamResult,
  rosterPlayers,
  onPatchTeamResult,
  onRemoveTeamResult,
  onPatchPlayerResult,
  onRemovePlayerResult,
  onResultsChanged,
}: {
  matchId: string;
  teamResult: TeamResult;
  rosterPlayers: RosterPlayerOption[];
  onPatchTeamResult: (patch: Partial<TeamResult>) => void;
  onRemoveTeamResult: () => void;
  onPatchPlayerResult: (playerResultId: string, patch: Partial<PlayerResult>) => void;
  onRemovePlayerResult: (playerResultId: string) => void;
  onResultsChanged: () => void;
}) {
  const [validating, setValidating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function toggleValidated() {
    setValidating(true);
    try {
      const data = await apiRequest<{ teamResult: TeamResult }>(`/scrim-matches/${matchId}/team-results/${teamResult.id}`, {
        method: "PATCH",
        body: { validated: !teamResult.validated },
      });
      if (data?.teamResult) onPatchTeamResult(data.teamResult);
    } finally {
      setValidating(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await apiRequest(`/scrim-matches/${matchId}/team-results/${teamResult.id}`, { method: "DELETE" });
      onRemoveTeamResult();
      onResultsChanged();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={`rounded-lg border p-3 ${teamResult.validated ? "border-primary/40 bg-primary/5" : "border-border"}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">#{teamResult.placement}</Badge>
          {teamResult.team ? (
            <span className="text-sm font-medium text-foreground">
              {teamResult.team.name} <span className="text-muted-foreground">[{teamResult.team.tag}]</span>
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Non reconnu{teamResult.unmatchedLabel ? ` — "${teamResult.unmatchedLabel}"` : ""}</span>
          )}
          <Badge variant="outline">{teamResult.totalKills} kills</Badge>
          <Badge variant="outline">{teamResult.placementPoints} pts placement</Badge>
          <Badge variant="outline">{teamResult.killPoints} pts kills</Badge>
          <Badge>{teamResult.points} pts total</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={teamResult.validated ? "outline" : "default"} onClick={toggleValidated} disabled={validating}>
            {validating ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            {teamResult.validated ? "Validé" : "Valider l'équipe"}
          </Button>
          <Button size="icon" variant="outline" onClick={remove} disabled={deleting} title="Supprimer cette équipe du résultat">
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {teamResult.playerResults.map((pr) => (
          <PlayerResultRow
            key={pr.id}
            matchId={matchId}
            playerResult={pr}
            rosterPlayers={rosterPlayers}
            onPatch={(patch) => onPatchPlayerResult(pr.id, patch)}
            onRemove={() => onRemovePlayerResult(pr.id)}
            onPatchTeam={onPatchTeamResult}
            onResultsChanged={onResultsChanged}
          />
        ))}
      </div>
    </div>
  );
}

function PlayerResultRow({
  matchId,
  playerResult,
  rosterPlayers,
  onPatch,
  onRemove,
  onPatchTeam,
  onResultsChanged,
}: {
  matchId: string;
  playerResult: PlayerResult;
  rosterPlayers: RosterPlayerOption[];
  onPatch: (patch: Partial<PlayerResult>) => void;
  onRemove: () => void;
  onPatchTeam: (patch: Partial<TeamResult>) => void;
  onResultsChanged: () => void;
}) {
  const [kills, setKills] = useState(String(playerResult.kills));
  const [savingKills, setSavingKills] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [savingValidation, setSavingValidation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setKills(String(playerResult.kills));
  }, [playerResult.kills]);

  const playerOptions = [
    PLAYER_OPTIONS_PLACEHOLDER,
    ...rosterPlayers.map((p) => ({ value: p.id, label: p.ffPseudo })),
  ];

  async function applyPatch(body: { kills?: number; playerId?: string | null; validated?: boolean }) {
    const data = await apiRequest<{ playerResult: PlayerResult; teamResult: TeamResult | null }>(
      `/scrim-matches/${matchId}/player-results/${playerResult.id}`,
      { method: "PATCH", body }
    );
    if (data?.playerResult) onPatch(data.playerResult);
    if (data?.teamResult) onPatchTeam(data.teamResult);
    onResultsChanged();
  }

  async function saveKills() {
    const value = Number(kills);
    if (!Number.isFinite(value) || value < 0) return;
    setSavingKills(true);
    try {
      await applyPatch({ kills: value });
    } finally {
      setSavingKills(false);
    }
  }

  async function reassignPlayer(playerId: string) {
    setReassigning(true);
    try {
      await applyPatch({ playerId: playerId || null });
    } finally {
      setReassigning(false);
    }
  }

  async function toggleValidated() {
    setSavingValidation(true);
    try {
      await applyPatch({ validated: !playerResult.validated });
    } finally {
      setSavingValidation(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      const data = await apiRequest<{ teamResult: TeamResult | null }>(
        `/scrim-matches/${matchId}/player-results/${playerResult.id}`,
        { method: "DELETE" }
      );
      if (data?.teamResult) onPatchTeam(data.teamResult);
      onRemove();
      onResultsChanged();
    } finally {
      setDeleting(false);
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
      <Button size="icon" variant="outline" onClick={remove} disabled={deleting} title="Supprimer ce joueur du résultat">
        {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </Button>
    </div>
  );
}
