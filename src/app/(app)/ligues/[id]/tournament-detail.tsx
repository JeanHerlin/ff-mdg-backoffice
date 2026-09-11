"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Crown, Dices, KeyRound, Loader2, Plus, Trophy, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
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
  const [createStageOpen, setCreateStageOpen] = useState(false);
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
  const canCreateStage = !lastStage
    ? new Date() >= new Date(tournament.registrationClosesAt)
    : lastStage.phase === "COMPLETED";
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

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-row items-center justify-between">
            <CardTitle>Étapes</CardTitle>
            {canCreateStage && (
              <Button size="sm" onClick={() => setCreateStageOpen(true)}>
                <Plus className="size-4" />
                Créer l&apos;étape suivante
              </Button>
            )}
          </div>
          {tournament.stages.length > 0 && (
            <TabList>
              {tournament.stages.map((stage) => (
                <TabButton key={stage.id} active={activeStageId === stage.id} onClick={() => setActiveStageId(stage.id)}>
                  {stage.name} <span className="ml-1 text-xs opacity-70">({STAGE_PHASE_LABEL[stage.phase]})</span>
                </TabButton>
              ))}
            </TabList>
          )}
        </CardHeader>
        <CardContent>
          {tournament.stages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune étape pour le moment — créez la première une fois les inscriptions closes.
            </p>
          ) : activeStage ? (
            <StageDetail
              stage={activeStage}
              activeGroupId={activeGroupId}
              onSelectGroup={setActiveGroupId}
              onStageChanged={load}
            />
          ) : null}
        </CardContent>
      </Card>

      <Sheet open={createStageOpen} onClose={() => setCreateStageOpen(false)} title="Créer l'étape suivante">
        <CreateStageForm
          tournamentId={tournamentId}
          onCreated={() => {
            setCreateStageOpen(false);
            load();
          }}
        />
      </Sheet>

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

function CreateStageForm({ tournamentId, onCreated }: { tournamentId: string; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [isFinal, setIsFinal] = useState(false);
  const [qualifiersPerGroup, setQualifiersPerGroup] = useState("2");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiRequest(`/tournaments/${tournamentId}/stages`, {
        method: "POST",
        body: { name: name.trim(), qualifiersPerGroup: isFinal ? null : Number(qualifiersPerGroup) },
      });
      onCreated();
    } catch (err) {
      setError(
        err instanceof ApiError && err.message === "tournaments.previous_stage_not_completed"
          ? "L'étape précédente doit d'abord être clôturée."
          : err instanceof ApiError && err.message === "tournaments.registration_not_closed"
            ? "Les inscriptions ne sont pas encore closes."
            : "Une erreur est survenue, réessayez."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stage-name">Nom de l&apos;étape</Label>
        <Input id="stage-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={3} maxLength={80} placeholder="Phase de groupes" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Type d&apos;étape</label>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={!isFinal ? "default" : "outline"} onClick={() => setIsFinal(false)}>
            Avec qualification
          </Button>
          <Button type="button" size="sm" variant={isFinal ? "default" : "outline"} onClick={() => setIsFinal(true)}>
            Étape finale
          </Button>
        </div>
      </div>

      {!isFinal && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stage-qualifiers">Équipes qualifiées PAR groupe</Label>
          <Input
            id="stage-qualifiers"
            type="number"
            min={1}
            value={qualifiersPerGroup}
            onChange={(e) => setQualifiersPerGroup(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            À la clôture de cette étape, ce nombre d&apos;équipes de CHAQUE groupe avancera vers l&apos;étape suivante.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-accent">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Créer l&apos;étape
      </Button>
    </form>
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
  const [starting, setStarting] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

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
        <p className="text-sm text-muted-foreground">Pas encore de groupes — lancez le tirage au sort.</p>
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

      <Sheet open={drawOpen} onClose={() => setDrawOpen(false)} title="Tirage au sort des groupes">
        <DrawGroupsForm
          stageId={stage.id}
          onDrawn={() => {
            setDrawOpen(false);
            onStageChanged();
          }}
        />
      </Sheet>

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

function DrawGroupsForm({ stageId, onDrawn }: { stageId: string; onDrawn: () => void }) {
  const [numberOfGroups, setNumberOfGroups] = useState("2");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiRequest(`/tournaments/stages/${stageId}/draw`, { method: "POST", body: { numberOfGroups: Number(numberOfGroups) } });
      onDrawn();
    } catch (err) {
      setError(
        err instanceof ApiError && err.message === "tournaments.not_enough_teams"
          ? "Pas assez d'équipes qualifiées pour ce nombre de groupes."
          : "Une erreur est survenue, réessayez."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="draw-groups">Nombre de groupes</Label>
        <Input id="draw-groups" type="number" min={1} max={32} value={numberOfGroups} onChange={(e) => setNumberOfGroups(e.target.value)} />
        <p className="text-xs text-muted-foreground">
          Les équipes qualifiées pour cette étape sont réparties aléatoirement de façon équilibrée — corrigeable ensuite équipe
          par équipe.
        </p>
      </div>
      {error && <p className="text-sm text-accent">{error}</p>}
      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Tirer au sort
      </Button>
    </form>
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
