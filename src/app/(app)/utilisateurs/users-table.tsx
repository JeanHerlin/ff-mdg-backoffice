"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, ListFilter, Loader2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiRequestWithMeta, apiRequest } from "@/lib/api-client";

type GameRole = "RUSHER" | "BOMBER" | "SNIPER" | "SUPPORT" | "VERSATILE";
type PlayerRank = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND" | "HEROIC" | "GRANDMASTER";
type StatsPeriod = "CURRENT_SEASON" | "ALL_SEASONS";

interface PlayerProfile {
  id: string;
  ffPlayerId: string;
  ffPseudo: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  preferredRole?: GameRole;
}

interface PlayerStats {
  rank: PlayerRank;
  matchesPlayed: number;
  totalKills: number;
  wins: number;
  placementPoints: number;
  kd: number;
  performanceIndex: number;
}

interface PlayerUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  playerProfile: PlayerProfile | null;
  stats?: PlayerStats;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  VERIFIED: "Vérifié",
  REJECTED: "Rejeté",
};

const GAME_ROLE_LABEL: Record<GameRole, string> = {
  RUSHER: "Rusher",
  BOMBER: "Bombardier",
  SNIPER: "Sniper",
  SUPPORT: "Support",
  VERSATILE: "Polyvalent",
};

const RANK_LABEL: Record<PlayerRank, string> = {
  BRONZE: "Bronze",
  SILVER: "Argent",
  GOLD: "Or",
  PLATINUM: "Platine",
  DIAMOND: "Diamant",
  HEROIC: "Héroïque",
  GRANDMASTER: "Grand Maître",
};

const RANK_STYLE: Record<PlayerRank, string> = {
  BRONZE: "bg-amber-800/15 text-amber-700 border-amber-700/30",
  SILVER: "bg-slate-400/15 text-slate-500 border-slate-400/30",
  GOLD: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  PLATINUM: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30",
  DIAMOND: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  HEROIC: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  GRANDMASTER: "bg-accent/15 text-accent border-accent/30",
};

const ROLE_OPTIONS = [
  { value: "", label: "Tous les rôles" },
  ...(Object.entries(GAME_ROLE_LABEL) as [GameRole, string][]).map(([value, label]) => ({ value, label })),
];
const RANK_OPTIONS = [
  { value: "", label: "Tous les rangs" },
  ...(Object.entries(RANK_LABEL) as [PlayerRank, string][]).map(([value, label]) => ({ value, label })),
];
const PERIOD_OPTIONS = [
  { value: "ALL_SEASONS", label: "Toutes les saisons" },
  { value: "CURRENT_SEASON", label: "Saison actuelle" },
];

function RankBadge({ rank }: { rank: PlayerRank }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${RANK_STYLE[rank]}`}>
      {RANK_LABEL[rank]}
    </span>
  );
}

function avatarSrc(url: string | null) {
  return url;
}

type Tab = "verified" | "unverified";

export function UsersTable() {
  const [tab, setTab] = useState<Tab>("verified");
  const [items, setItems] = useState<PlayerUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PlayerUser | null>(null);
  const [statusTarget, setStatusTarget] = useState<PlayerUser | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlayerUser | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [role, setRole] = useState("");
  const [rank, setRank] = useState("");
  const [period, setPeriod] = useState<StatsPeriod>("ALL_SEASONS");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minMatches, setMinMatches] = useState("");
  const [minKills, setMinKills] = useState("");
  const [minWins, setMinWins] = useState("");
  const [minKd, setMinKd] = useState("");
  const [minPerformanceIndex, setMinPerformanceIndex] = useState("");

  const endpoint = tab === "verified" ? "/users" : "/users/unverified";

  useEffect(() => {
    setPage(1);
  }, [tab, role, rank, period, minMatches, minKills, minWins, minKd, minPerformanceIndex]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), perPage: "10" });
      if (search) params.set("search", search);
      if (tab === "verified") {
        params.set("period", period);
        if (role) params.set("role", role);
        if (rank) params.set("rank", rank);
        if (minMatches) params.set("minMatches", minMatches);
        if (minKills) params.set("minKills", minKills);
        if (minWins) params.set("minWins", minWins);
        if (minKd) params.set("minKd", minKd);
        if (minPerformanceIndex) params.set("minPerformanceIndex", minPerformanceIndex);
      }
      apiRequestWithMeta<PlayerUser[]>(`${endpoint}?${params}`)
        .then(({ data, meta }) => {
          setItems(data ?? []);
          setTotalPages(meta?.totalPages ?? 1);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [page, search, endpoint, tab, role, rank, period, minMatches, minKills, minWins, minKd, minPerformanceIndex]);

  async function confirmToggleActive() {
    if (!statusTarget) return;
    const user = statusTarget;
    setTogglingId(user.id);
    try {
      await apiRequest(`/users/${user.id}/status`, {
        method: "PATCH",
        body: { isActive: !user.isActive },
      });
      setItems((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      );
      setSelected((prev) => (prev && prev.id === user.id ? { ...prev, isActive: !prev.isActive } : prev));
    } finally {
      setTogglingId(null);
      setStatusTarget(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const user = deleteTarget;
    setDeletingId(user.id);
    try {
      await apiRequest(`/users/unverified/${user.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((u) => u.id !== user.id));
      setSelected((prev) => (prev && prev.id === user.id ? null : prev));
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-border p-1">
          <button
            type="button"
            onClick={() => setTab("verified")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "verified" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Email vérifié
          </button>
          <button
            type="button"
            onClick={() => setTab("unverified")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "unverified" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Email non vérifié
          </button>
        </div>
        <div className="relative min-w-50 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher (email, pseudo, ID Free Fire...)"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="pl-9"
          />
        </div>
        {tab === "verified" && (
          <>
            <Select value={role} onChange={setRole} options={ROLE_OPTIONS} className="w-40" />
            <Select value={rank} onChange={setRank} options={RANK_OPTIONS} className="w-40" />
            <Select value={period} onChange={(v) => setPeriod(v as StatsPeriod)} options={PERIOD_OPTIONS} className="w-44" />
            <Button variant="outline" onClick={() => setShowAdvanced((v) => !v)}>
              <ListFilter className="size-4" />
              Plus de filtres
            </Button>
          </>
        )}
      </div>

      {tab === "verified" && showAdvanced && (
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">Matchs min.</label>
            <Input type="number" min={0} value={minMatches} onChange={(e) => setMinMatches(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">Kills min.</label>
            <Input type="number" min={0} value={minKills} onChange={(e) => setMinKills(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">Victoires min.</label>
            <Input type="number" min={0} value={minWins} onChange={(e) => setMinWins(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">K/D min.</label>
            <Input type="number" min={0} step={0.1} value={minKd} onChange={(e) => setMinKd(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">Indice min.</label>
            <Input type="number" min={0} max={100} value={minPerformanceIndex} onChange={(e) => setMinPerformanceIndex(e.target.value)} />
          </div>
        </div>
      )}

      {tab === "unverified" && (
        <p className="text-xs text-muted-foreground">
          Ces comptes n'ont jamais confirmé leur email — ils ne peuvent pas se connecter. Ils sont
          supprimés automatiquement 3 jours après l'inscription ; vous pouvez aussi les supprimer
          manuellement ici.
        </p>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Joueur</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">ID Free Fire</th>
                {tab === "verified" ? (
                  <>
                    <th className="px-4 py-3 font-medium">Vérification</th>
                    <th className="px-4 py-3 font-medium">Rang</th>
                    <th className="px-4 py-3 font-medium">Indice</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                  </>
                ) : (
                  <th className="px-4 py-3 font-medium" />
                )}
                <th className="px-4 py-3 font-medium">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                items.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => tab === "verified" && setSelected(user)}
                    className={`border-b border-border last:border-0 hover:bg-muted/40 ${
                      tab === "verified" ? "cursor-pointer" : ""
                    }`}
                  >
                    <td className="flex items-center gap-2.5 px-4 py-3">
                      <Avatar url={avatarSrc(user.avatarUrl)} label={user.playerProfile?.ffPseudo ?? "?"} />
                      <div>
                        <p className="font-medium text-foreground">
                          {user.playerProfile?.ffPseudo ?? user.displayName ?? "—"}
                        </p>
                        {user.displayName && (
                          <p className="text-xs text-muted-foreground">{user.displayName}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.playerProfile?.ffPlayerId ?? "—"}</td>
                    {tab === "verified" ? (
                      <>
                        <td className="px-4 py-3">
                          {user.playerProfile && (
                            <Badge variant={user.playerProfile.verificationStatus === "VERIFIED" ? "default" : "muted"}>
                              {STATUS_LABEL[user.playerProfile.verificationStatus]}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">{user.stats && <RankBadge rank={user.stats.rank} />}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{user.stats?.performanceIndex ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant={user.isActive ? "default" : "accent"}>
                            {user.isActive ? "Actif" : "Désactivé"}
                          </Badge>
                        </td>
                      </>
                    ) : (
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="accent"
                          disabled={deletingId === user.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(user);
                          }}
                        >
                          {deletingId === user.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                          Supprimer
                        </Button>
                      </td>
                    )}
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("fr-FR")}
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
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
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

      <Sheet open={!!selected} onClose={() => setSelected(null)} title="Détail du joueur">
        {selected && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Avatar url={avatarSrc(selected.avatarUrl)} label={selected.playerProfile?.ffPseudo ?? "?"} large />
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {selected.playerProfile?.ffPseudo ?? "—"}
                </p>
                <p className="text-sm text-muted-foreground">{selected.email}</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Field label="ID Free Fire" value={selected.playerProfile?.ffPlayerId ?? "—"} />
              <Field label="Nom affiché" value={selected.displayName ?? "—"} />
              <Field
                label="Vérification"
                value={
                  selected.playerProfile
                    ? STATUS_LABEL[selected.playerProfile.verificationStatus]
                    : "—"
                }
              />
              <Field label="Email confirmé" value={selected.emailVerifiedAt ? "Oui" : "Non"} />
              <Field label="Inscrit le" value={new Date(selected.createdAt).toLocaleString("fr-FR")} />
              <Field label="Statut" value={selected.isActive ? "Actif" : "Désactivé"} />
            </dl>

            {selected.stats && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Indice de performance (donnée simulée en attendant le suivi réel des résultats)
                </p>
                <div className="mb-2">
                  <RankBadge rank={selected.stats.rank} />
                </div>
                <dl className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm">
                  <Field label="Matchs" value={String(selected.stats.matchesPlayed)} />
                  <Field label="Kills" value={String(selected.stats.totalKills)} />
                  <Field label="Victoires" value={String(selected.stats.wins)} />
                  <Field label="Pts placement" value={String(selected.stats.placementPoints)} />
                  <Field label="K/D" value={selected.stats.kd.toFixed(2)} />
                  <Field label="Indice" value={String(selected.stats.performanceIndex)} />
                </dl>
              </div>
            )}

            <Button
              variant={selected.isActive ? "accent" : "default"}
              onClick={() => setStatusTarget(selected)}
              disabled={togglingId === selected.id}
            >
              {togglingId === selected.id && <Loader2 className="size-4 animate-spin" />}
              {selected.isActive ? "Désactiver ce compte" : "Réactiver ce compte"}
            </Button>
          </div>
        )}
      </Sheet>

      <ConfirmDialog
        open={!!statusTarget}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        title={
          statusTarget?.isActive
            ? "Désactiver ce compte joueur ?"
            : "Réactiver ce compte joueur ?"
        }
        description={
          statusTarget?.isActive
            ? `${statusTarget?.playerProfile?.ffPseudo ?? statusTarget?.email} ne pourra plus se connecter tant que le compte n'est pas réactivé.`
            : `${statusTarget?.playerProfile?.ffPseudo ?? statusTarget?.email} pourra de nouveau se connecter à la plateforme.`
        }
        confirmLabel={statusTarget?.isActive ? "Désactiver" : "Réactiver"}
        variant={statusTarget?.isActive ? "accent" : "default"}
        loading={togglingId === statusTarget?.id}
        onConfirm={confirmToggleActive}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Supprimer ce compte non vérifié ?"
        description={`Le compte ${deleteTarget?.email} sera définitivement supprimé. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="accent"
        loading={deletingId === deleteTarget?.id}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function Avatar({ url, label, large }: { url: string | null; label: string; large?: boolean }) {
  const size = large ? "size-14" : "size-8";
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- image dynamique servie par le backend
    return <img src={url} alt={label} className={`${size} rounded-full object-cover`} />;
  }
  return (
    <div
      className={`flex ${size} items-center justify-center rounded-full bg-primary/15 text-xs font-semibold uppercase text-primary`}
    >
      {label.slice(0, 2)}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
