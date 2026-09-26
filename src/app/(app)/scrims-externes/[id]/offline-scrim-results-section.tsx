"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ImageDown, ImagePlus, Loader2, Plus, Trash2, TriangleAlert, Trophy, UserPlus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TabList, TabButton } from "@/components/ui/tabs";
import { apiRequest, ApiError } from "@/lib/api-client";
import { OfflineScrimExportDialog } from "./offline-scrim-export-dialog";

const MAX_PLAYERS_PER_TEAM = 4;

type FreeFireMap = "BERMUDA" | "PURGATORY" | "ALPINE" | "KALAHARI" | "NEXTERRA" | "SOLARA";

const MAP_LABEL: Record<FreeFireMap, string> = {
  BERMUDA: "Bermuda",
  PURGATORY: "Purgatory",
  ALPINE: "Alpine",
  KALAHARI: "Kalahari",
  NEXTERRA: "NeXTerra",
  SOLARA: "Solara",
};
const MAP_OPTIONS = (Object.entries(MAP_LABEL) as [FreeFireMap, string][]).map(([value, label]) => ({ value, label }));

interface OfflineTeamOption {
  id: string;
  name: string;
  tag: string | null;
}

interface PlayerResult {
  id: string;
  detectedName: string;
  kills: number;
}

interface TeamResult {
  id: string;
  placement: number;
  totalKills: number;
  placementPoints: number;
  killPoints: number;
  points: number;
  offlineScrimTeamId: string | null;
  unmatchedLabel: string | null;
  offlineScrimTeam: OfflineTeamOption | null;
  playerResults: PlayerResult[];
}

interface MatchImage {
  id: string;
  imageUrl: string;
  isValidFreeFireResult: boolean;
}

interface Match {
  id: string;
  map: FreeFireMap;
  matchNumber: number;
  images: MatchImage[];
  teamResults: TeamResult[];
  confirmedAt: string | null;
}

interface StandingEntry {
  teamId: string;
  name: string;
  tag: string | null;
  totalPoints: number;
  totalPlacementPoints: number;
  totalKillPoints: number;
  totalKills: number;
  matchesPlayed: number;
  booyahCount: number;
}

function TeamBadge({ label }: { label: string }) {
  return (
    <div className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-[10px] font-bold text-primary">
      {label.slice(0, 2).toUpperCase()}
    </div>
  );
}

function GlobalStandingsTable({ standings }: { standings: StandingEntry[] }) {
  if (standings.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun résultat assigné à une équipe pour le moment.</p>;
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
                  <TeamBadge label={entry.tag ?? entry.name} />
                  <span className="font-medium text-foreground">
                    {entry.name} {entry.tag && <span className="text-muted-foreground">[{entry.tag}]</span>}
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

export function OfflineScrimResultsSection({
  scrimId,
  teams,
  scrimName,
  scrimStartAt,
}: {
  scrimId: string;
  teams: OfflineTeamOption[];
  scrimName: string;
  scrimStartAt: string;
}) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>("global");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Match | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadStandings = useCallback(() => {
    apiRequest<StandingEntry[]>(`/offline-scrim-matches/scrims/${scrimId}/standings`).then((data) => setStandings(data ?? []));
  }, [scrimId]);

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiRequest<Match[]>(`/offline-scrim-matches/scrims/${scrimId}`),
      apiRequest<StandingEntry[]>(`/offline-scrim-matches/scrims/${scrimId}/standings`),
    ])
      .then(([matchData, standingsData]) => {
        setMatches(matchData ?? []);
        setStandings(standingsData ?? []);
      })
      .finally(() => setLoading(false));
  }, [scrimId]);

  useEffect(loadAll, [loadAll]);

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
      await apiRequest(`/offline-scrim-matches/${deleteTarget.id}`, { method: "DELETE" });
      setMatches((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      if (activeTab === deleteTarget.id) setActiveTab("global");
      setDeleteTarget(null);
      loadStandings();
    } finally {
      setDeleting(false);
    }
  }

  const activeMatch = matches.find((m) => m.id === activeTab);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-row items-center justify-between">
          <CardTitle>Résultats de matchs</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setExportOpen(true)} disabled={standings.length === 0}>
              <ImageDown className="size-4" />
              Exporter en image
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)} disabled={teams.length === 0}>
              <Plus className="size-4" />
              Ajouter un résultat
            </Button>
          </div>
        </div>
        {teams.length === 0 && (
          <p className="text-xs text-muted-foreground">Ajoutez au moins une équipe avant de saisir un résultat.</p>
        )}

        {!loading && (
          <TabList>
            <TabButton active={activeTab === "global"} onClick={() => setActiveTab("global")}>
              <Trophy className="mr-1 inline size-3.5" />
              Résultat global
            </TabButton>
            {matches.map((match) => (
              <TabButton key={match.id} active={activeTab === match.id} onClick={() => setActiveTab(match.id)}>
                {match.confirmedAt && <CheckCircle2 className="mr-1 inline size-3.5 text-primary" />}
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
            teams={teams}
            onPatchTeamResult={(teamResultId, patch) => patchTeamResult(activeMatch.id, teamResultId, patch)}
            onRemoveTeamResult={(teamResultId) => {
              removeTeamResult(activeMatch.id, teamResultId);
              loadStandings();
            }}
            onPatchPlayerResult={(teamResultId, playerResultId, patch) =>
              patchPlayerResult(activeMatch.id, teamResultId, playerResultId, patch)
            }
            onRemovePlayerResult={(teamResultId, playerResultId) => {
              removePlayerResult(activeMatch.id, teamResultId, playerResultId);
              loadStandings();
            }}
            onResultsChanged={loadStandings}
            onPatchMatch={(patch) => {
              patchMatch(activeMatch.id, patch);
              loadStandings();
            }}
            onDelete={() => setDeleteTarget(activeMatch)}
          />
        ) : matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun résultat de match enregistré.</p>
        ) : null}
      </CardContent>

      <OfflineScrimExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        scrimId={scrimId}
        scrimName={scrimName}
        scrimStartAt={scrimStartAt}
      />

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Ajouter un résultat de match">
        <AddMatchForm
          scrimId={scrimId}
          onCreated={(match) => {
            setAddOpen(false);
            setMatches((prev) => [...prev, match]);
            setActiveTab(match.id);
            loadStandings();
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

function AddMatchForm({ scrimId, onCreated }: { scrimId: string; onCreated: (match: Match) => void }) {
  const [mode, setMode] = useState<"captures" | "text">("captures");
  const [map, setMap] = useState<FreeFireMap>("BERMUDA");
  const [capture1, setCapture1] = useState<File | null>(null);
  const [capture2, setCapture2] = useState<File | null>(null);
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "captures" && !capture1 && !capture2) {
      setError("Ajoutez au moins une capture.");
      return;
    }
    if (mode === "text" && !resultFile) {
      setError("Ajoutez le fichier de résultat.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("map", map);
      let data: { match: Match } | undefined;
      if (mode === "captures") {
        if (capture1) formData.set("capture1", capture1);
        if (capture2) formData.set("capture2", capture2);
        data = await apiRequest<{ match: Match }>(`/offline-scrim-matches/scrims/${scrimId}`, { method: "POST", body: formData });
      } else {
        formData.set("resultFile", resultFile!);
        data = await apiRequest<{ match: Match }>(`/offline-scrim-matches/scrims/${scrimId}/text`, { method: "POST", body: formData });
      }
      if (data?.match) onCreated(data.match);
    } catch (err) {
      setError(
        err instanceof ApiError && err.message === "offline_scrim_matches.text_result_unreadable"
          ? "Ce fichier ne contient aucun résultat reconnaissable (format inattendu)."
          : "Une erreur est survenue, réessayez."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Source du résultat</label>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={mode === "captures" ? "default" : "outline"} onClick={() => setMode("captures")}>
            Captures d&apos;écran
          </Button>
          <Button type="button" size="sm" variant={mode === "text" ? "default" : "outline"} onClick={() => setMode("text")}>
            Fichier texte (scrim 3D)
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Carte</label>
        <Select value={map} onChange={(v) => setMap(v as FreeFireMap)} options={MAP_OPTIONS} />
      </div>

      {mode === "captures" ? (
        <>
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
          <p className="text-xs text-muted-foreground">
            Aucun nom d&apos;équipe n&apos;est visible sur ces captures — vous assignerez chaque ligne à l&apos;une des
            équipes saisies pour ce scrim après analyse.
          </p>
        </>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Fichier de résultat (.txt / .log)</label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary">
            <ImagePlus className="size-4 shrink-0" />
            {resultFile ? resultFile.name : "Choisir un fichier"}
            <input
              type="file"
              accept=".txt,.log,text/plain"
              className="hidden"
              onChange={(e) => setResultFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Le nom d&apos;équipe du fichier est rapproché automatiquement des équipes saisies pour ce scrim ; en cas de
            doute, l&apos;assignation reste modifiable après coup.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-accent">{error}</p>}

      <Button type="submit" disabled={submitting}>
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {mode === "captures" ? "Analyser et créer le résultat" : "Importer et créer le résultat"}
      </Button>
    </form>
  );
}

const UNASSIGNED_OPTION = { value: "", label: "Non assigné" };

function MatchCard({
  match,
  teams,
  onPatchTeamResult,
  onRemoveTeamResult,
  onPatchPlayerResult,
  onRemovePlayerResult,
  onResultsChanged,
  onPatchMatch,
  onDelete,
}: {
  match: Match;
  teams: OfflineTeamOption[];
  onPatchTeamResult: (teamResultId: string, patch: Partial<TeamResult>) => void;
  onRemoveTeamResult: (teamResultId: string) => void;
  onPatchPlayerResult: (teamResultId: string, playerResultId: string, patch: Partial<PlayerResult>) => void;
  onRemovePlayerResult: (teamResultId: string, playerResultId: string) => void;
  onResultsChanged: () => void;
  onPatchMatch: (patch: Partial<Match>) => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const hasInvalidImage = match.images.some((img) => !img.isValidFreeFireResult);
  const hasUnassigned = match.teamResults.some((tr) => !tr.offlineScrimTeamId);

  async function confirmMatch() {
    setConfirming(true);
    try {
      const data = await apiRequest<{ match: Match }>(`/offline-scrim-matches/${match.id}/confirm`, { method: "POST" });
      if (data?.match) onPatchMatch({ confirmedAt: data.match.confirmedAt });
    } finally {
      setConfirming(false);
    }
  }

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

      <div className="flex flex-col gap-2">
        {match.teamResults.map((tr) => (
          <TeamResultRow
            key={tr.id}
            matchId={match.id}
            teamResult={tr}
            teams={teams}
            onPatchTeamResult={(patch) => onPatchTeamResult(tr.id, patch)}
            onRemoveTeamResult={() => onRemoveTeamResult(tr.id)}
            onPatchPlayerResult={(playerResultId, patch) => onPatchPlayerResult(tr.id, playerResultId, patch)}
            onRemovePlayerResult={(playerResultId) => onRemovePlayerResult(tr.id, playerResultId)}
            onResultsChanged={onResultsChanged}
          />
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <div>
          {hasUnassigned && !match.confirmedAt && (
            <p className="text-xs text-accent">Assignez chaque équipe avant de pouvoir confirmer ce résultat.</p>
          )}
          {match.confirmedAt && <p className="text-xs text-primary">Résultat confirmé — compte dans le classement.</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDelete}>
            <Trash2 className="size-4" />
            Supprimer ce match
          </Button>
          {!match.confirmedAt && (
            <Button size="sm" onClick={confirmMatch} disabled={confirming || hasUnassigned}>
              {confirming ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Confirmer le résultat
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function TeamResultRow({
  matchId,
  teamResult,
  teams,
  onPatchTeamResult,
  onRemoveTeamResult,
  onPatchPlayerResult,
  onRemovePlayerResult,
  onResultsChanged,
}: {
  matchId: string;
  teamResult: TeamResult;
  teams: OfflineTeamOption[];
  onPatchTeamResult: (patch: Partial<TeamResult>) => void;
  onRemoveTeamResult: () => void;
  onPatchPlayerResult: (playerResultId: string, patch: Partial<PlayerResult>) => void;
  onRemovePlayerResult: (playerResultId: string) => void;
  onResultsChanged: () => void;
}) {
  const [assigning, setAssigning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const teamOptions = [UNASSIGNED_OPTION, ...teams.map((t) => ({ value: t.id, label: t.tag ? `${t.name} [${t.tag}]` : t.name }))];

  async function assignTeam(offlineScrimTeamId: string) {
    setAssigning(true);
    try {
      const data = await apiRequest<{ teamResult: TeamResult }>(`/offline-scrim-matches/${matchId}/team-results/${teamResult.id}`, {
        method: "PATCH",
        body: { offlineScrimTeamId: offlineScrimTeamId || null },
      });
      if (data?.teamResult) onPatchTeamResult(data.teamResult);
    } finally {
      setAssigning(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await apiRequest(`/offline-scrim-matches/${matchId}/team-results/${teamResult.id}`, { method: "DELETE" });
      onRemoveTeamResult();
      onResultsChanged();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">#{teamResult.placement}</Badge>
          <Select
            value={teamResult.offlineScrimTeamId ?? ""}
            onChange={assignTeam}
            options={teamOptions}
            className="w-48"
            disabled={assigning}
          />
          {!teamResult.offlineScrimTeamId && teamResult.unmatchedLabel && (
            <span className="text-xs text-muted-foreground">détecté : &quot;{teamResult.unmatchedLabel}&quot;</span>
          )}
          <Badge variant="outline">{teamResult.totalKills} kills</Badge>
          <Badge variant="outline">{teamResult.placementPoints} pts placement</Badge>
          <Badge variant="outline">{teamResult.killPoints} pts kills</Badge>
          <Badge>{teamResult.points} pts total</Badge>
        </div>
        <Button size="icon" variant="outline" onClick={remove} disabled={deleting} title="Supprimer cette équipe du résultat">
          {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        {teamResult.playerResults.map((pr) => (
          <PlayerResultRow
            key={pr.id}
            matchId={matchId}
            playerResult={pr}
            onPatch={(patch) => onPatchPlayerResult(pr.id, patch)}
            onRemove={() => onRemovePlayerResult(pr.id)}
            onPatchTeam={onPatchTeamResult}
            onResultsChanged={onResultsChanged}
          />
        ))}
      </div>

      <AddPlayerToTeam
        matchId={matchId}
        teamResult={teamResult}
        onAdded={(updated) => {
          onPatchTeamResult(updated);
          onResultsChanged();
        }}
      />
    </div>
  );
}

// Aucun roster à choisir dedans — juste un nom libre, comme le reste de ce
// module (les joueurs de ces équipes n'ont pas de compte sur la plateforme).
function AddPlayerToTeam({
  matchId,
  teamResult,
  onAdded,
}: {
  matchId: string;
  teamResult: TeamResult;
  onAdded: (teamResult: TeamResult) => void;
}) {
  const [name, setName] = useState("");
  const [kills, setKills] = useState("0");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (teamResult.playerResults.length >= MAX_PLAYERS_PER_TEAM) return null;

  async function add() {
    if (!name.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const data = await apiRequest<{ teamResult: TeamResult }>(
        `/offline-scrim-matches/${matchId}/team-results/${teamResult.id}/player-results`,
        { method: "POST", body: { detectedName: name.trim(), kills: Number(kills) || 0 } }
      );
      if (data?.teamResult) onAdded(data.teamResult);
      setName("");
      setKills("0");
    } catch (err) {
      setError(err instanceof ApiError && err.message === "offline_scrim_matches.team_full" ? "Cette équipe a déjà 4 joueurs." : "Une erreur est survenue.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-dashed border-border pt-2">
      <Input placeholder="Nom du joueur" value={name} onChange={(e) => setName(e.target.value)} className="w-40" disabled={adding} />
      <Input
        type="number"
        min={0}
        placeholder="Kills"
        value={kills}
        onChange={(e) => setKills(e.target.value)}
        className="w-20"
        disabled={adding}
      />
      <Button size="sm" variant="outline" onClick={add} disabled={adding || !name.trim()}>
        {adding ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
        Ajouter un joueur
      </Button>
      {error && <span className="text-xs text-accent">{error}</span>}
    </div>
  );
}

function PlayerResultRow({
  matchId,
  playerResult,
  onPatch,
  onRemove,
  onPatchTeam,
  onResultsChanged,
}: {
  matchId: string;
  playerResult: PlayerResult;
  onPatch: (patch: Partial<PlayerResult>) => void;
  onRemove: () => void;
  onPatchTeam: (patch: Partial<TeamResult>) => void;
  onResultsChanged: () => void;
}) {
  const [name, setName] = useState(playerResult.detectedName);
  const [kills, setKills] = useState(String(playerResult.kills));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(playerResult.detectedName);
    setKills(String(playerResult.kills));
  }, [playerResult.detectedName, playerResult.kills]);

  async function applyPatch(body: { detectedName?: string; kills?: number }) {
    setSaving(true);
    try {
      const data = await apiRequest<{ playerResult: PlayerResult; teamResult: TeamResult | null }>(
        `/offline-scrim-matches/${matchId}/player-results/${playerResult.id}`,
        { method: "PATCH", body }
      );
      if (data?.playerResult) onPatch(data.playerResult);
      if (data?.teamResult) onPatchTeam(data.teamResult);
      onResultsChanged();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      const data = await apiRequest<{ teamResult: TeamResult | null }>(
        `/offline-scrim-matches/${matchId}/player-results/${playerResult.id}`,
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
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && name !== playerResult.detectedName && applyPatch({ detectedName: name.trim() })}
        className="w-40"
        disabled={saving}
      />
      <Input
        type="number"
        min={0}
        value={kills}
        onChange={(e) => setKills(e.target.value)}
        onBlur={() => {
          const value = Number(kills);
          if (Number.isFinite(value) && value >= 0 && value !== playerResult.kills) applyPatch({ kills: value });
        }}
        className="w-16"
        disabled={saving}
      />
      <span className="text-xs text-muted-foreground">kills</span>
      <Button size="icon" variant="outline" onClick={remove} disabled={deleting} title="Supprimer ce joueur du résultat">
        {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </Button>
    </div>
  );
}
