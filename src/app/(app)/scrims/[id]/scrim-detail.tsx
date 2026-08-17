"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Mail, Pencil, ShieldCheck, Timer, Trash2, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiRequest, ApiError } from "@/lib/api-client";
import { ScrimMatchesSection } from "./scrim-matches-section";

type Phase = "UPCOMING" | "REGISTRATION_OPEN" | "WAITING" | "CHECKIN_OPEN" | "CHECKIN_CLOSED" | "STARTED" | "FINISHED";
type RoomType = "STANDARD" | "LEAGUE";

interface ScrimDetailData {
  id: string;
  name: string;
  description: string | null;
  registrationOpensAt: string;
  registrationClosesAt: string;
  checkinOpensAt: string;
  checkinClosesAt: string;
  startAt: string;
  teamsPerLobby: number;
  lobbyMax: number;
  phase: Phase;
  registrationOpen: boolean;
  checkinOpen: boolean;
}

interface Room {
  roomType: RoomType;
  roomId: string;
  roomPassword: string;
}

interface BoardTeamEntry {
  registrationId: string;
  team: { id: string; name: string; tag: string; logoUrl: string | null };
  checkedInCount: number;
  validatedAt: string | null;
  forceValidated: boolean;
}

interface BoardData {
  lobbies: { lobbyNumber: number; teams: BoardTeamEntry[]; room?: Room | null }[];
  sub: BoardTeamEntry[];
  partial: BoardTeamEntry[];
  notCheckedIn: BoardTeamEntry[];
  noShow: BoardTeamEntry[];
}

const PHASE_LABEL: Record<Phase, string> = {
  UPCOMING: "À venir",
  REGISTRATION_OPEN: "Inscriptions ouvertes",
  WAITING: "Inscriptions terminées",
  CHECKIN_OPEN: "Check-in en cours",
  CHECKIN_CLOSED: "Check-in terminé",
  STARTED: "Lancé",
  FINISHED: "Terminé",
};

const PHASE_VARIANT: Record<Phase, "default" | "muted" | "accent" | "outline"> = {
  UPCOMING: "muted",
  REGISTRATION_OPEN: "default",
  WAITING: "outline",
  CHECKIN_OPEN: "accent",
  CHECKIN_CLOSED: "outline",
  STARTED: "muted",
  FINISHED: "default",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// Décompte calculé côté client à partir de l'horodatage de fermeture — bascule
// immédiate à zéro, sans attendre le prochain sondage serveur.
function useCountdown(targetIso: string | null) {
  const [remainingMs, setRemainingMs] = useState(() => (targetIso ? new Date(targetIso).getTime() - Date.now() : 0));

  useEffect(() => {
    if (!targetIso) {
      setRemainingMs(0);
      return;
    }
    const tick = () => setRemainingMs(new Date(targetIso).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return remainingMs;
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Logo({ url, label }: { url: string | null; label: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- image dynamique servie par Cloudinary
    return <img src={url} alt={label} className="size-8 rounded-md object-cover" />;
  }
  return (
    <div className="flex size-8 items-center justify-center rounded-md bg-primary/15 text-xs font-semibold text-primary">
      {label.slice(0, 2)}
    </div>
  );
}

function TeamLabel({ team }: { team: BoardTeamEntry["team"] }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo url={team.logoUrl} label={team.tag} />
      <div>
        <p className="text-sm font-medium text-foreground">{team.name}</p>
        <p className="text-xs text-muted-foreground">[{team.tag}]</p>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

// Ligne d'équipe validée (lobby ou SUB) — absence + envoi des identifiants
// vers un ou plusieurs lobby (un SUB n'est rattaché à aucun lobby précis tant
// qu'il n'y est pas promu, d'où la liste de cibles).
function ValidatedTeamRow({
  rank,
  entry,
  sendTargets,
  onToggleNoShow,
  onSend,
  busy,
  sendingLobby,
  muted,
}: {
  rank: number;
  entry: BoardTeamEntry;
  sendTargets: number[];
  onToggleNoShow: () => void;
  onSend: (lobbyNumber: number) => void;
  busy: boolean;
  sendingLobby: number | null;
  muted?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-2 rounded-lg border border-border p-2.5 sm:flex-row sm:items-center sm:justify-between ${muted ? "opacity-80" : ""}`}>
      <div className="flex items-center gap-3">
        <span className="w-5 text-xs font-semibold text-muted-foreground">#{rank}</span>
        <TeamLabel team={entry.team} />
        {entry.forceValidated && (
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="size-3" />
            Repêchée ({entry.checkedInCount}/4)
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {sendTargets.map((lobbyNumber) => (
          <Button
            key={lobbyNumber}
            size="sm"
            variant="outline"
            disabled={sendingLobby === lobbyNumber}
            onClick={() => onSend(lobbyNumber)}
          >
            {sendingLobby === lobbyNumber ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
            {sendTargets.length > 1 ? `Envoyer (Lobby ${lobbyNumber})` : "Envoyer les identifiants"}
          </Button>
        ))}
        <Button size="sm" variant="outline" disabled={busy} onClick={onToggleNoShow}>
          <UserX className="size-3.5" />
          Absent
        </Button>
      </div>
    </div>
  );
}

function RoomManager({
  scrimId,
  lobbyNumber,
  room,
  onSaved,
}: {
  scrimId: string;
  lobbyNumber: number;
  room: Room | null | undefined;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(!room);
  const [roomType, setRoomType] = useState<RoomType>(room?.roomType ?? "STANDARD");
  const [roomId, setRoomId] = useState(room?.roomId ?? "");
  const [roomPassword, setRoomPassword] = useState(room?.roomPassword ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/scrims/${scrimId}/lobbies/${lobbyNumber}/room`, {
        method: "POST",
        body: { roomType, roomId: roomId.trim(), roomPassword: roomPassword.trim() },
      });
      setEditing(false);
      onSaved();
    } catch {
      setError("Une erreur est survenue, réessayez.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing && room) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {room.roomType === "LEAGUE" ? "Room league" : "Chambre standard"}
          </p>
          <p className="text-sm text-foreground">
            ID : <span className="font-mono">{room.roomId}</span> · Mot de passe :{" "}
            <span className="font-mono">{room.roomPassword}</span>
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="size-3.5" />
          Modifier
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Select
          value={roomType}
          onChange={(v) => setRoomType(v as RoomType)}
          options={[
            { value: "STANDARD", label: "Chambre standard" },
            { value: "LEAGUE", label: "Room league" },
          ]}
        />
        <Input placeholder="ID de la room" value={roomId} onChange={(e) => setRoomId(e.target.value)} maxLength={50} />
        <Input
          placeholder="Mot de passe"
          value={roomPassword}
          onChange={(e) => setRoomPassword(e.target.value)}
          maxLength={50}
        />
      </div>
      {error && <p className="text-xs text-accent">{error}</p>}
      <div className="flex gap-2">
        {room && (
          <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
            Annuler
          </Button>
        )}
        <Button size="sm" disabled={saving || !roomId.trim() || !roomPassword.trim()} onClick={save}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Enregistrer et envoyer aux joueurs
        </Button>
      </div>
    </div>
  );
}

export function ScrimDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [scrim, setScrim] = useState<ScrimDetailData | null | undefined>(undefined);
  const [board, setBoard] = useState<BoardData | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [busyRegistrationId, setBusyRegistrationId] = useState<string | null>(null);
  const [sendingKey, setSendingKey] = useState<string | null>(null);

  const loadScrim = useCallback(() => {
    apiRequest<{ scrim: ScrimDetailData }>(`/scrims/${params.id}`)
      .then((d) => setScrim(d?.scrim ?? null))
      .catch(() => setScrim(null));
  }, [params.id]);

  const loadBoard = useCallback(() => {
    apiRequest<BoardData>(`/scrims/${params.id}/admin-board`).then((d) => setBoard(d ?? null));
  }, [params.id]);

  useEffect(loadScrim, [loadScrim]);
  useEffect(loadBoard, [loadBoard]);

  // Sondage rapproché pour suivre les inscriptions/check-in quasi en direct.
  useEffect(() => {
    const interval = setInterval(() => {
      loadScrim();
      loadBoard();
    }, 3000);
    return () => clearInterval(interval);
  }, [loadScrim, loadBoard]);

  const registrationRemaining = useCountdown(scrim?.registrationOpen ? scrim.registrationClosesAt : null);
  const checkinRemaining = useCountdown(scrim?.checkinOpen ? scrim.checkinClosesAt : null);
  const registrationOpenNow = !!scrim?.registrationOpen && registrationRemaining > 0;
  const checkinOpenNow = !!scrim?.checkinOpen && checkinRemaining > 0;

  const wasRegistrationOpen = useRef(registrationOpenNow);
  const wasCheckinOpen = useRef(checkinOpenNow);
  useEffect(() => {
    if (wasRegistrationOpen.current && !registrationOpenNow) {
      loadScrim();
      loadBoard();
    }
    wasRegistrationOpen.current = registrationOpenNow;
  }, [registrationOpenNow, loadScrim, loadBoard]);
  useEffect(() => {
    if (wasCheckinOpen.current && !checkinOpenNow) {
      loadScrim();
      loadBoard();
    }
    wasCheckinOpen.current = checkinOpenNow;
  }, [checkinOpenNow, loadScrim, loadBoard]);

  async function toggleNoShow(registrationId: string, isCurrentlyNoShow: boolean) {
    setBusyRegistrationId(registrationId);
    try {
      await apiRequest(`/scrims/${params.id}/registrations/${registrationId}/${isCurrentlyNoShow ? "clear-no-show" : "no-show"}`, {
        method: "POST",
      });
      loadBoard();
    } finally {
      setBusyRegistrationId(null);
    }
  }

  async function forceValidate(registrationId: string) {
    setBusyRegistrationId(registrationId);
    try {
      await apiRequest(`/scrims/${params.id}/registrations/${registrationId}/force-validate`, { method: "POST" });
      loadBoard();
    } finally {
      setBusyRegistrationId(null);
    }
  }

  async function sendRoomCredentials(lobbyNumber: number, registrationId: string) {
    const key = `${lobbyNumber}:${registrationId}`;
    setSendingKey(key);
    try {
      await apiRequest(`/scrims/${params.id}/lobbies/${lobbyNumber}/send/${registrationId}`, { method: "POST" });
    } finally {
      setSendingKey(null);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiRequest(`/scrims/${params.id}`, { method: "DELETE" });
      router.push("/scrims");
    } finally {
      setDeleting(false);
    }
  }

  async function handleFinish() {
    setFinishing(true);
    try {
      await apiRequest(`/scrims/${params.id}/finish`, { method: "POST" });
      setFinishOpen(false);
      loadScrim();
    } finally {
      setFinishing(false);
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

  if (editing) {
    return (
      <EditScrimForm
        scrim={scrim}
        onSaved={() => {
          setEditing(false);
          loadScrim();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const isEmpty =
    board &&
    board.lobbies.length === 0 &&
    board.sub.length === 0 &&
    board.partial.length === 0 &&
    board.notCheckedIn.length === 0 &&
    board.noShow.length === 0;

  const lobbiesWithRoom = board?.lobbies.filter((l) => l.room) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{scrim.name}</h1>
            <Badge variant={PHASE_VARIANT[scrim.phase]}>{PHASE_LABEL[scrim.phase]}</Badge>
          </div>
          {scrim.description && <p className="mt-1 max-w-xl text-sm text-muted-foreground">{scrim.description}</p>}
          {(registrationOpenNow || checkinOpenNow) && (
            <div className="mt-2 flex w-fit items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-accent">
              <Timer className="size-4" />
              <span className="text-sm font-medium">
                {registrationOpenNow ? "Fermeture des inscriptions dans" : "Fermeture du check-in dans"}{" "}
                <span className="font-mono tabular-nums">
                  {formatCountdown(registrationOpenNow ? registrationRemaining : checkinRemaining)}
                </span>
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {scrim.phase === "UPCOMING" && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Modifier
            </Button>
          )}
          {scrim.phase === "STARTED" && (
            <Button variant="outline" onClick={() => setFinishOpen(true)}>
              <CheckCircle2 className="size-4" />
              Terminer le scrim
            </Button>
          )}
          <Button variant="accent" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
          <InfoBlock label="Inscription" value={`${formatDate(scrim.registrationOpensAt)} → ${formatDate(scrim.registrationClosesAt)}`} />
          <InfoBlock label="Check-in" value={`${formatDate(scrim.checkinOpensAt)} → ${formatDate(scrim.checkinClosesAt)}`} />
          <InfoBlock label="Début" value={formatDate(scrim.startAt)} />
          <InfoBlock label="Équipes par lobby" value={String(scrim.teamsPerLobby)} />
          <InfoBlock label="Lobby max" value={String(scrim.lobbyMax)} />
        </CardContent>
      </Card>

      {board && (
        <div className="flex flex-col gap-4">
          {board.lobbies.map((lobby) => (
            <Card key={lobby.lobbyNumber}>
              <CardHeader>
                <CardTitle>
                  Lobby {lobby.lobbyNumber} ({lobby.teams.length}/{scrim.teamsPerLobby})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <RoomManager scrimId={params.id} lobbyNumber={lobby.lobbyNumber} room={lobby.room} onSaved={loadBoard} />
                <div className="flex flex-col gap-2">
                  {lobby.teams.map((entry, idx) => (
                    <ValidatedTeamRow
                      key={entry.registrationId}
                      rank={idx + 1}
                      entry={entry}
                      sendTargets={lobby.room ? [lobby.lobbyNumber] : []}
                      busy={busyRegistrationId === entry.registrationId}
                      sendingLobby={
                        sendingKey === `${lobby.lobbyNumber}:${entry.registrationId}` ? lobby.lobbyNumber : null
                      }
                      onToggleNoShow={() => toggleNoShow(entry.registrationId, false)}
                      onSend={(lobbyNumber) => sendRoomCredentials(lobbyNumber, entry.registrationId)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {board.sub.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>SUB ({board.sub.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  Remontent automatiquement si une équipe d&apos;un lobby est marquée absente. Envoyez-leur les
                  identifiants manuellement si vous les faites entrer en jeu.
                </p>
                {board.sub.map((entry, idx) => (
                  <ValidatedTeamRow
                    key={entry.registrationId}
                    rank={idx + 1}
                    entry={entry}
                    muted
                    sendTargets={lobbiesWithRoom.map((l) => l.lobbyNumber)}
                    busy={busyRegistrationId === entry.registrationId}
                    sendingLobby={
                      lobbiesWithRoom.find((l) => sendingKey === `${l.lobbyNumber}:${entry.registrationId}`)
                        ?.lobbyNumber ?? null
                    }
                    onToggleNoShow={() => toggleNoShow(entry.registrationId, false)}
                    onSend={(lobbyNumber) => sendRoomCredentials(lobbyNumber, entry.registrationId)}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {board.partial.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Check-in incomplet ({board.partial.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  Entre 1 et 3 membres ont fait leur check-in. Vous pouvez les repêcher manuellement si la liste des
                  équipes validées est incomplète.
                </p>
                {board.partial.map((entry) => (
                  <div key={entry.registrationId} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                    <TeamLabel team={entry.team} />
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{entry.checkedInCount}/4 check-in</Badge>
                      <Button
                        size="sm"
                        disabled={busyRegistrationId === entry.registrationId}
                        onClick={() => forceValidate(entry.registrationId)}
                      >
                        {busyRegistrationId === entry.registrationId ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="size-3.5" />
                        )}
                        Valider manuellement
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {board.notCheckedIn.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Aucun check-in ({board.notCheckedIn.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  Inscrites mais aucun membre n&apos;a fait de check-in — exclues d&apos;office, pas de repêchage
                  possible.
                </p>
                {board.notCheckedIn.map((entry) => (
                  <div key={entry.registrationId} className="flex items-center justify-between rounded-lg border border-border p-2.5 opacity-70">
                    <TeamLabel team={entry.team} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {board.noShow.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Absents ({board.noShow.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {board.noShow.map((entry) => (
                  <div key={entry.registrationId} className="flex items-center justify-between rounded-lg border border-border p-2.5 opacity-70">
                    <TeamLabel team={entry.team} />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyRegistrationId === entry.registrationId}
                      onClick={() => toggleNoShow(entry.registrationId, true)}
                    >
                      Annuler l&apos;absence
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {isEmpty && <p className="text-sm text-muted-foreground">Aucune inscription pour le moment.</p>}
        </div>
      )}

      {(scrim.phase === "STARTED" || scrim.phase === "FINISHED") && <ScrimMatchesSection scrimId={params.id} />}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer ce scrim ?"
        description="Cette action est irréversible — toutes les inscriptions et check-in associés seront supprimés."
        confirmLabel="Supprimer"
        variant="accent"
        loading={deleting}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={finishOpen}
        onOpenChange={setFinishOpen}
        title="Terminer ce scrim ?"
        description="Marque le scrim comme terminé. Assurez-vous d'avoir confirmé tous les résultats de match avant de continuer."
        confirmLabel="Terminer"
        loading={finishing}
        onConfirm={handleFinish}
      />
    </div>
  );
}

function EditScrimForm({
  scrim,
  onSaved,
  onCancel,
}: {
  scrim: ScrimDetailData;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(scrim.name);
  const [description, setDescription] = useState(scrim.description ?? "");
  const [registrationOpensAt, setRegistrationOpensAt] = useState(toDatetimeLocalValue(scrim.registrationOpensAt));
  const [registrationClosesAt, setRegistrationClosesAt] = useState(toDatetimeLocalValue(scrim.registrationClosesAt));
  const [checkinOpensAt, setCheckinOpensAt] = useState(toDatetimeLocalValue(scrim.checkinOpensAt));
  const [checkinClosesAt, setCheckinClosesAt] = useState(toDatetimeLocalValue(scrim.checkinClosesAt));
  const [startAt, setStartAt] = useState(toDatetimeLocalValue(scrim.startAt));
  const [teamsPerLobby, setTeamsPerLobby] = useState(String(scrim.teamsPerLobby));
  const [lobbyMax, setLobbyMax] = useState(String(scrim.lobbyMax));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Le DateTimePicker n'est pas un <input> natif : plus de validation
    // "required" du navigateur, donc on vérifie ici avant de construire les
    // ISO (new Date("").toISOString() lèverait sinon une exception).
    if (!registrationOpensAt || !registrationClosesAt || !checkinOpensAt || !checkinClosesAt || !startAt) {
      setError("Choisissez une date et une heure pour chaque champ.");
      return;
    }
    setSaving(true);
    try {
      await apiRequest(`/scrims/${scrim.id}`, {
        method: "PATCH",
        body: {
          name: name.trim(),
          description: description.trim() || undefined,
          registrationOpensAt: new Date(registrationOpensAt).toISOString(),
          registrationClosesAt: new Date(registrationClosesAt).toISOString(),
          checkinOpensAt: new Date(checkinOpensAt).toISOString(),
          checkinClosesAt: new Date(checkinClosesAt).toISOString(),
          startAt: new Date(startAt).toISOString(),
          teamsPerLobby: Number(teamsPerLobby),
          lobbyMax: Number(lobbyMax),
          lobbyMode: "FIRST_COME",
        },
      });
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError && err.message === "scrims.dates_invalid"
          ? "Vérifiez l'ordre des horaires : inscription avant check-in, check-in terminé avant le début du scrim."
          : "Une erreur est survenue, réessayez."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="p-6">
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-scrim-name">Nom du scrim</Label>
            <Input id="edit-scrim-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={3} maxLength={80} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-scrim-description">Description (facultatif)</Label>
            <textarea
              id="edit-scrim-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-reg-open">Inscription — ouverture</Label>
              <DateTimePicker id="edit-reg-open" value={registrationOpensAt} onChange={setRegistrationOpensAt} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-reg-close">Inscription — fermeture</Label>
              <DateTimePicker id="edit-reg-close" value={registrationClosesAt} onChange={setRegistrationClosesAt} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-checkin-open">Check-in — ouverture</Label>
              <DateTimePicker id="edit-checkin-open" value={checkinOpensAt} onChange={setCheckinOpensAt} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-checkin-close">Check-in — fermeture</Label>
              <DateTimePicker id="edit-checkin-close" value={checkinClosesAt} onChange={setCheckinClosesAt} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-start">Début du scrim</Label>
            <DateTimePicker id="edit-start" value={startAt} onChange={setStartAt} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-teams-per-lobby">Équipes par lobby</Label>
              <Input id="edit-teams-per-lobby" type="number" min={2} max={50} value={teamsPerLobby} onChange={(e) => setTeamsPerLobby(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-lobby-max">Nombre de lobby max</Label>
              <Input id="edit-lobby-max" type="number" min={1} max={50} value={lobbyMax} onChange={(e) => setLobbyMax(e.target.value)} required />
            </div>
          </div>

          {error && <p className="text-sm text-accent">{error}</p>}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
