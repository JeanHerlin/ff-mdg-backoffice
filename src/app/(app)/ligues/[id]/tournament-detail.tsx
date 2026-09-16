"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Crown, Dices, KeyRound, Loader2, Lock, Plus, Trash2, Trophy, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TabList, TabButton } from "@/components/ui/tabs";
import { apiRequest, ApiError } from "@/lib/api-client";
import { GroupMatchesSection } from "./group-matches-section";

type TournamentPhase = "UPCOMING" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED" | "IN_PROGRESS" | "COMPLETED";
type StagePhase = "PENDING" | "DRAWN" | "ACTIVE" | "COMPLETED";

interface TeamSummary {
  id: string;
  name: string;
  tag: string;
  logoUrl: string | null;
}

interface GroupTeam {
  id: string;
  teamId: string;
  team: TeamSummary;
}

interface Group {
  id: string;
  name: string;
  scheduledAt: string | null;
  roomId: string | null;
  roomPassword: string | null;
  teams: GroupTeam[];
}

interface Stage {
  id: string;
  order: number;
  name: string;
  qualifiersPerGroup: number | null;
  startedAt: string | null;
  completedAt: string | null;
  phase: StagePhase;
  groups: Group[];
}

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  registrationOpensAt: string;
  registrationClosesAt: string;
  startAt: string;
  phase: TournamentPhase;
  completedAt: string | null;
  championTeam: TeamSummary | null;
  registrations: { team: TeamSummary }[];
  stages: Stage[];
}

interface StandingEntry {
  teamId: string;
  name: string;
  tag: string;
  logoUrl: string | null;
  totalPoints: number;
}

const PHASE_LABEL: Record<TournamentPhase, string> = {
  UPCOMING: "À venir",
  REGISTRATION_OPEN: "Inscriptions ouvertes",
  REGISTRATION_CLOSED: "Inscriptions closes",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
};

const PHASE_VARIANT: Record<TournamentPhase, "default" | "muted" | "accent" | "outline"> = {
  UPCOMING: "muted",
  REGISTRATION_OPEN: "default",
  REGISTRATION_CLOSED: "outline",
  IN_PROGRESS: "accent",
  COMPLETED: "outline",
};

const STAGE_PHASE_LABEL: Record<StagePhase, string> = {
  PENDING: "À tirer au sort",
  DRAWN: "Tiré au sort",
  ACTIVE: "En cours",
  COMPLETED: "Terminée",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Format attendu par DateTimePicker ("YYYY-MM-DDTHH:mm") — pour préremplir
// l'éditeur de format à partir des groupes déjà enregistrés.
function toDateTimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

export function TournamentDetail() {
  const params = useParams<{ id: string }>();
  const tournamentId = params.id;

  const [tournament, setTournament] = useState<Tournament | null | undefined>(undefined);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [championOpen, setChampionOpen] = useState(false);

  const load = useCallback(() => {
    apiRequest<{ tournament: Tournament }>(`/tournaments/${tournamentId}`)
      .then((d) => {
        const t = d?.tournament ?? null;
        setTournament(t);
        if (t) {
          setActiveStageId((prev) => prev ?? t.stages.at(-1)?.id ?? null);
        }
      })
      .catch(() => setTournament(null));
  }, [tournamentId]);

  useEffect(load, [load]);

  useEffect(() => {
    const stage = tournament?.stages.find((s) => s.id === activeStageId);
    setActiveGroupId(stage?.groups[0]?.id ?? null);
  }, [activeStageId, tournament]);

  if (tournament === undefined) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (tournament === null) {
    return <p className="py-20 text-center text-muted-foreground">Tournoi introuvable.</p>;
  }

  const lastStage = tournament.stages.at(-1) ?? null;
  // Le format (étapes + groupes + dates) n'est modifiable que tant qu'AUCUNE
  // équipe ne s'est encore inscrite — pas seulement tant que les inscriptions
  // ne sont pas ouvertes : une fenêtre d'inscription ouverte sans aucune
  // inscription n'a encore rien promis à personne (voir tournaments.service).
  const formatEditable = tournament.registrations.length === 0;
  const activeStage = tournament.stages.find((s) => s.id === activeStageId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{tournament.name}</h1>
            <Badge variant={PHASE_VARIANT[tournament.phase]}>{PHASE_LABEL[tournament.phase]}</Badge>
          </div>
          {tournament.description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{tournament.description}</p>}
          <p className="mt-1 text-sm text-muted-foreground">
            Inscriptions : {formatDate(tournament.registrationOpensAt)} → {formatDate(tournament.registrationClosesAt)} · Coup
            d&apos;envoi prévu : {formatDate(tournament.startAt)}
          </p>
        </div>
        {!tournament.completedAt && lastStage?.phase === "COMPLETED" && (
          <Button variant="outline" onClick={() => setChampionOpen(true)}>
            <Crown className="size-4" />
            Désigner le champion
          </Button>
        )}
      </div>

      {tournament.championTeam && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
          <Trophy className="size-5 text-yellow-500" />
          <span className="text-sm font-medium text-foreground">
            Champion : {tournament.championTeam.name} <span className="text-muted-foreground">[{tournament.championTeam.tag}]</span>
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Users className="size-4" />
            Équipes inscrites ({tournament.registrations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tournament.registrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune équipe inscrite pour le moment.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tournament.registrations.map((r) => (
                <span key={r.team.id} className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs">
                  <Logo url={r.team.logoUrl} label={r.team.tag} />
                  {r.team.name} <span className="text-muted-foreground">[{r.team.tag}]</span>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FormatCard tournamentId={tournamentId} stages={tournament.stages} editable={formatEditable} onSaved={load} />

      {tournament.stages.length > 0 && (
        <Card>
          <CardHeader className="gap-3">
            <CardTitle>Étapes</CardTitle>
            <TabList>
              {tournament.stages.map((stage) => (
                <TabButton key={stage.id} active={activeStageId === stage.id} onClick={() => setActiveStageId(stage.id)}>
                  {stage.name} <span className="ml-1 text-xs opacity-70">({STAGE_PHASE_LABEL[stage.phase]})</span>
                </TabButton>
              ))}
            </TabList>
          </CardHeader>
          <CardContent>
            {activeStage && (
              <StageDetail stage={activeStage} activeGroupId={activeGroupId} onSelectGroup={setActiveGroupId} onStageChanged={load} />
            )}
          </CardContent>
        </Card>
      )}

      <Sheet open={championOpen} onClose={() => setChampionOpen(false)} title="Désigner le champion">
        <SetChampionForm
          tournamentId={tournamentId}
          lastStage={lastStage}
          registrations={tournament.registrations}
          onSet={() => {
            setChampionOpen(false);
            load();
          }}
        />
      </Sheet>
    </div>
  );
}

// --- Format du tournoi (étapes + groupes + dates), défini en une fois ----

interface DraftGroup {
  key: string;
  name: string;
  scheduledAt: string; // format DateTimePicker ("YYYY-MM-DDTHH:mm")
}

interface DraftStage {
  key: string;
  name: string;
  isFinal: boolean;
  qualifiersPerGroup: string;
  groups: DraftGroup[];
}

let draftKeySeq = 0;
function nextDraftKey() {
  draftKeySeq += 1;
  return `d${draftKeySeq}`;
}

function suggestedGroupName(index: number) {
  return index < 26 ? `Groupe ${String.fromCharCode(65 + index)}` : `Groupe ${index + 1}`;
}

function draftFromStages(stages: Stage[]): DraftStage[] {
  return stages.map((s) => ({
    key: nextDraftKey(),
    name: s.name,
    isFinal: s.qualifiersPerGroup === null,
    qualifiersPerGroup: String(s.qualifiersPerGroup ?? 2),
    groups: s.groups.map((g) => ({ key: nextDraftKey(), name: g.name, scheduledAt: g.scheduledAt ? toDateTimeLocal(g.scheduledAt) : "" })),
  }));
}

function emptyStage(index: number): DraftStage {
  return {
    key: nextDraftKey(),
    name: index === 0 ? "Phase de groupes" : "",
    isFinal: false,
    qualifiersPerGroup: "2",
    groups: [{ key: nextDraftKey(), name: suggestedGroupName(0), scheduledAt: "" }],
  };
}

function FormatCard({
  tournamentId,
  stages,
  editable,
  onSaved,
}: {
  tournamentId: string;
  stages: Stage[];
  editable: boolean;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<DraftStage[]>(() => (stages.length > 0 ? draftFromStages(stages) : [emptyStage(0)]));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ne resynchronise depuis le serveur que si l'admin n'a pas commencé à
  // éditer localement — évite d'écraser une saisie en cours au prochain refetch.
  useEffect(() => {
    if (dirty) return;
    setDraft(stages.length > 0 ? draftFromStages(stages) : [emptyStage(0)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ne resynchronise que depuis le serveur, pas à chaque frappe locale
  }, [stages]);

  function markDirty() {
    if (!dirty) setDirty(true);
  }

  function addStage() {
    setDraft((prev) => [...prev, emptyStage(prev.length)]);
    markDirty();
  }
  function removeStage(key: string) {
    setDraft((prev) => prev.filter((s) => s.key !== key));
    markDirty();
  }
  function updateStage(key: string, patch: Partial<DraftStage>) {
    setDraft((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
    markDirty();
  }
  function addGroup(stageKey: string) {
    setDraft((prev) =>
      prev.map((s) =>
        s.key === stageKey ? { ...s, groups: [...s.groups, { key: nextDraftKey(), name: suggestedGroupName(s.groups.length), scheduledAt: "" }] } : s
      )
    );
    markDirty();
  }
  function removeGroup(stageKey: string, groupKey: string) {
    setDraft((prev) => prev.map((s) => (s.key === stageKey ? { ...s, groups: s.groups.filter((g) => g.key !== groupKey) } : s)));
    markDirty();
  }
  function updateGroup(stageKey: string, groupKey: string, patch: Partial<DraftGroup>) {
    setDraft((prev) =>
      prev.map((s) => (s.key === stageKey ? { ...s, groups: s.groups.map((g) => (g.key === groupKey ? { ...g, ...patch } : g)) } : s))
    );
    markDirty();
  }

  async function handleSave() {
    setError(null);
    for (const s of draft) {
      if (!s.name.trim() || s.groups.length === 0 || s.groups.some((g) => !g.name.trim() || !g.scheduledAt)) {
        setError("Chaque étape a besoin d'un nom, et chaque groupe d'un nom et d'une date.");
        return;
      }
    }
    setSaving(true);
    try {
      await apiRequest(`/tournaments/${tournamentId}/format`, {
        method: "POST",
        body: {
          stages: draft.map((s) => ({
            name: s.name.trim(),
            qualifiersPerGroup: s.isFinal ? null : Number(s.qualifiersPerGroup),
            groups: s.groups.map((g) => ({ name: g.name.trim(), scheduledAt: new Date(g.scheduledAt).toISOString() })),
          })),
        },
      });
      setDirty(false);
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError && err.message === "tournaments.format_locked"
          ? "Au moins une équipe est déjà inscrite — le format ne peut plus être modifié."
          : "Une erreur est survenue, réessayez."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Format du tournoi</CardTitle>
        {!editable && (
          <Badge variant="outline" className="gap-1">
            <Lock className="size-3" />
            Verrouillé — des équipes sont déjà inscrites
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!editable && stages.length === 0 ? (
          <p className="text-sm text-accent">
            Des équipes sont inscrites mais aucun format n&apos;a été défini — cela n&apos;aurait pas dû arriver (l&apos;inscription
            est censée être bloquée sans format) ; contactez un développeur.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Le parcours complet (étapes, groupes, dates) est visible par les équipes avant qu&apos;elles ne s&apos;inscrivent —
            modifiable uniquement tant que les inscriptions ne sont pas encore ouvertes. Le tirage au sort des équipes dans ces
            groupes reste après la clôture des inscriptions.
          </p>
        )}

        {draft.map((stage, stageIndex) => (
          <div key={stage.key} className="flex flex-col gap-3 rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Étape {stageIndex + 1}</span>
              {editable && draft.length > 1 && (
                <Button type="button" size="icon" variant="outline" onClick={() => removeStage(stage.key)}>
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>

            {editable ? (
              <Input
                value={stage.name}
                onChange={(e) => updateStage(stage.key, { name: e.target.value })}
                placeholder="Nom de l'étape (ex. Phase de groupes)"
              />
            ) : (
              <p className="font-medium text-foreground">{stage.name}</p>
            )}

            {editable ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant={!stage.isFinal ? "default" : "outline"} onClick={() => updateStage(stage.key, { isFinal: false })}>
                  Avec qualification
                </Button>
                <Button type="button" size="sm" variant={stage.isFinal ? "default" : "outline"} onClick={() => updateStage(stage.key, { isFinal: true })}>
                  Étape finale
                </Button>
                {!stage.isFinal && (
                  <>
                    <span className="text-xs text-muted-foreground">Qualifiés par groupe :</span>
                    <Input
                      type="number"
                      min={1}
                      value={stage.qualifiersPerGroup}
                      onChange={(e) => updateStage(stage.key, { qualifiersPerGroup: e.target.value })}
                      className="w-20"
                    />
                  </>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {stage.isFinal ? "Étape finale — pas de qualification." : `${stage.qualifiersPerGroup} équipe(s) qualifiée(s) par groupe.`}
              </p>
            )}

            <div className="flex flex-col gap-2 pl-3">
              {stage.groups.map((group) => (
                <div key={group.key} className="flex flex-wrap items-center gap-2">
                  {editable ? (
                    <>
                      <Input
                        value={group.name}
                        onChange={(e) => updateGroup(stage.key, group.key, { name: e.target.value })}
                        className="w-36"
                        placeholder="Nom du groupe"
                      />
                      <DateTimePicker
                        value={group.scheduledAt}
                        onChange={(v) => updateGroup(stage.key, group.key, { scheduledAt: v })}
                        className="w-56"
                      />
                      {stage.groups.length > 1 && (
                        <Button type="button" size="icon" variant="outline" onClick={() => removeGroup(stage.key, group.key)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {group.name} — {group.scheduledAt ? formatDate(new Date(group.scheduledAt).toISOString()) : "date non définie"}
                    </span>
                  )}
                </div>
              ))}
              {editable && (
                <Button type="button" size="sm" variant="outline" className="w-fit" onClick={() => addGroup(stage.key)}>
                  <Plus className="size-3.5" />
                  Ajouter un groupe
                </Button>
              )}
            </div>
          </div>
        ))}

        {editable && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="outline" onClick={addStage}>
              <Plus className="size-4" />
              Ajouter une étape
            </Button>
            <div className="flex items-center gap-2">
              {error && <span className="text-sm text-accent">{error}</span>}
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Enregistrer le format
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SetChampionForm({
  tournamentId,
  lastStage,
  registrations,
  onSet,
}: {
  tournamentId: string;
  lastStage: Stage | null;
  registrations: { team: TeamSummary }[];
  onSet: () => void;
}) {
  const [standings, setStandings] = useState<StandingEntry[] | null>(null);
  const [teamId, setTeamId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lastStage) return;
    apiRequest<StandingEntry[]>(`/tournaments/stages/${lastStage.id}/standings`).then((data) => {
      setStandings(data ?? []);
      if (data?.[0]) setTeamId(data[0].teamId);
    });
  }, [lastStage]);

  const options = registrations.map((r) => ({ value: r.team.id, label: `${r.team.name} [${r.team.tag}]` }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId) return;
    setError(null);
    setSaving(true);
    try {
      await apiRequest(`/tournaments/${tournamentId}/champion`, { method: "POST", body: { teamId } });
      onSet();
    } catch {
      setError("Une erreur est survenue, réessayez.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <p className="text-sm text-muted-foreground">
        Présélectionné avec le 1er du classement de la dernière étape — vous pouvez choisir une autre équipe inscrite si besoin.
      </p>
      {standings === null ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="champion-team">Équipe championne</Label>
          <Select id="champion-team" value={teamId} onChange={setTeamId} options={options} />
        </div>
      )}
      {error && <p className="text-sm text-accent">{error}</p>}
      <Button type="submit" disabled={saving || !teamId}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Désigner et clôturer le tournoi
      </Button>
    </form>
  );
}

function StageDetail({
  stage,
  activeGroupId,
  onSelectGroup,
  onStageChanged,
}: {
  stage: Stage;
  activeGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onStageChanged: () => void;
}) {
  const [drawOpen, setDrawOpen] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  async function draw() {
    setDrawing(true);
    setDrawError(null);
    try {
      await apiRequest(`/tournaments/stages/${stage.id}/draw`, { method: "POST" });
      setDrawOpen(false);
      onStageChanged();
    } catch (err) {
      setDrawError(
        err instanceof ApiError && err.message === "tournaments.not_enough_teams"
          ? "Pas assez d'équipes inscrites/qualifiées pour remplir tous les groupes de cette étape."
          : "Une erreur est survenue, réessayez."
      );
    } finally {
      setDrawing(false);
    }
  }

  async function startStage() {
    setStarting(true);
    try {
      await apiRequest(`/tournaments/stages/${stage.id}/start`, { method: "POST" });
      onStageChanged();
    } finally {
      setStarting(false);
    }
  }

  async function completeStage() {
    setCompleting(true);
    try {
      await apiRequest(`/tournaments/stages/${stage.id}/complete`, { method: "POST" });
      setCompleteOpen(false);
      onStageChanged();
    } finally {
      setCompleting(false);
    }
  }

  const activeGroup = stage.groups.find((g) => g.id === activeGroupId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {stage.qualifiersPerGroup === null
            ? "Étape finale — pas de qualification, le classement final désigne le champion."
            : `${stage.qualifiersPerGroup} équipe(s) qualifiée(s) par groupe à la clôture.`}
        </p>
        <div className="flex gap-2">
          {stage.phase === "PENDING" && (
            <Button size="sm" onClick={() => setDrawOpen(true)}>
              <Dices className="size-4" />
              Tirage au sort
            </Button>
          )}
          {stage.phase === "DRAWN" && (
            <Button size="sm" onClick={startStage} disabled={starting}>
              {starting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Démarrer l&apos;étape
            </Button>
          )}
          {stage.phase === "ACTIVE" && (
            <Button size="sm" variant="outline" onClick={() => setCompleteOpen(true)}>
              <CheckCircle2 className="size-4" />
              Clôturer l&apos;étape
            </Button>
          )}
        </div>
      </div>

      {stage.groups.length === 0 ? (
        <p className="text-sm text-accent">
          Aucun groupe défini pour cette étape — cela n&apos;aurait pas dû arriver (le format doit toujours poser les groupes en
          amont), contactez un développeur.
        </p>
      ) : (
        <>
          <TabList className="border-b-0">
            {stage.groups.map((group) => (
              <TabButton key={group.id} active={activeGroupId === group.id} onClick={() => onSelectGroup(group.id)}>
                {group.name} <span className="ml-1 text-xs opacity-70">({group.teams.length})</span>
              </TabButton>
            ))}
          </TabList>

          {activeGroup && (
            <div className="flex flex-col gap-4">
              <GroupTeamsCard group={activeGroup} allGroups={stage.groups} onChanged={onStageChanged} />
              <GroupRoomCard group={activeGroup} onChanged={onStageChanged} />
              <GroupMatchesSection groupId={activeGroup.id} />
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={drawOpen}
        onOpenChange={(open) => {
          setDrawOpen(open);
          if (!open) setDrawError(null);
        }}
        title="Lancer le tirage au sort ?"
        description={`Les équipes ${stage.order === 1 ? "inscrites au tournoi" : "qualifiées de l'étape précédente"} seront réparties aléatoirement dans les ${stage.groups.length} groupe(s) déjà définis dans le format (${stage.groups.map((g) => g.name).join(", ")}).`}
        confirmLabel="Tirer au sort"
        loading={drawing}
        onConfirm={draw}
      >
        {drawError && <p className="text-sm text-accent">{drawError}</p>}
      </ConfirmDialog>

      <ConfirmDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        title="Clôturer cette étape ?"
        description={
          stage.qualifiersPerGroup === null
            ? "Le classement de chaque groupe sera figé."
            : `Le classement de chaque groupe sera figé et les ${stage.qualifiersPerGroup} premières équipes de chaque groupe seront notifiées de leur qualification — les autres de leur élimination.`
        }
        confirmLabel="Clôturer"
        loading={completing}
        onConfirm={completeStage}
      />
    </div>
  );
}

function GroupTeamsCard({ group, allGroups, onChanged }: { group: Group; allGroups: Group[]; onChanged: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Users className="size-4" />
          Équipes du {group.name.toLowerCase()} ({group.teams.length})
        </CardTitle>
        {group.scheduledAt && <p className="text-xs text-muted-foreground">Programmé : {formatDate(group.scheduledAt)}</p>}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {group.teams.map((gt) => (
          <MoveTeamRow key={gt.id} groupId={group.id} groupTeam={gt} otherGroups={allGroups.filter((g) => g.id !== group.id)} onMoved={onChanged} />
        ))}
      </CardContent>
    </Card>
  );
}

function MoveTeamRow({
  groupId,
  groupTeam,
  otherGroups,
  onMoved,
}: {
  groupId: string;
  groupTeam: GroupTeam;
  otherGroups: Group[];
  onMoved: () => void;
}) {
  const [targetGroupId, setTargetGroupId] = useState(otherGroups[0]?.id ?? "");
  const [moving, setMoving] = useState(false);

  async function move() {
    if (!targetGroupId) return;
    setMoving(true);
    try {
      await apiRequest(`/tournaments/groups/${groupId}/teams/${groupTeam.teamId}/move`, { method: "PATCH", body: { targetGroupId } });
      onMoved();
    } finally {
      setMoving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-2 text-sm">
      <div className="flex items-center gap-2">
        <Logo url={groupTeam.team.logoUrl} label={groupTeam.team.tag} />
        <span className="font-medium text-foreground">
          {groupTeam.team.name} <span className="text-muted-foreground">[{groupTeam.team.tag}]</span>
        </span>
      </div>
      {otherGroups.length > 0 && (
        <div className="flex items-center gap-2">
          <Select
            value={targetGroupId}
            onChange={setTargetGroupId}
            options={otherGroups.map((g) => ({ value: g.id, label: g.name }))}
            className="w-32"
            disabled={moving}
          />
          <Button size="sm" variant="outline" onClick={move} disabled={moving}>
            {moving ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Déplacer
          </Button>
        </div>
      )}
    </div>
  );
}

function GroupRoomCard({ group, onChanged }: { group: Group; onChanged: () => void }) {
  const [roomId, setRoomId] = useState(group.roomId ?? "");
  const [roomPassword, setRoomPassword] = useState(group.roomPassword ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRoomId(group.roomId ?? "");
    setRoomPassword(group.roomPassword ?? "");
  }, [group.roomId, group.roomPassword, group.id]);

  async function save() {
    if (!roomId.trim() || !roomPassword.trim()) return;
    setSaving(true);
    try {
      await apiRequest(`/tournaments/groups/${group.id}/room`, { method: "PATCH", body: { roomId: roomId.trim(), roomPassword: roomPassword.trim() } });
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <KeyRound className="size-4" />
          Room de {group.name.toLowerCase()}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`room-id-${group.id}`}>ID</Label>
          <Input id={`room-id-${group.id}`} value={roomId} onChange={(e) => setRoomId(e.target.value)} className="w-32" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`room-pw-${group.id}`}>Mot de passe</Label>
          <Input id={`room-pw-${group.id}`} value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} className="w-32" />
        </div>
        <Button size="sm" onClick={save} disabled={saving || !roomId.trim() || !roomPassword.trim()}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Enregistrer et envoyer aux joueurs
        </Button>
      </CardContent>
    </Card>
  );
}
