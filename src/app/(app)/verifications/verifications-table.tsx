"use client";

import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2, Search, ShieldCheck, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiRequestWithMeta, apiRequest } from "@/lib/api-client";

type Tab = "teams" | "players";

interface TeamSummary {
  id: string;
  name: string;
  tag: string;
  logoUrl: string | null;
  status: "PENDING" | "CERTIFIED";
  memberCount: number;
  createdAt: string;
}

interface TeamMember {
  id: string;
  managementRole: "CAPTAIN" | "MANAGER" | "MEMBER";
  gameRole: string;
  user: {
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    playerProfile: { ffPlayerId: string; ffPseudo: string; verificationStatus: string } | null;
  };
}

interface TeamDetail extends TeamSummary {
  description: string | null;
  members: TeamMember[];
}

interface PlayerProfile {
  ffPlayerId: string;
  ffPseudo: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
}

interface PlayerUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  playerProfile: PlayerProfile | null;
}

function fileSrc(url: string | null) {
  return url;
}

function Avatar({ url, label, large }: { url: string | null; label: string; large?: boolean }) {
  const size = large ? "size-14" : "size-8";
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- image dynamique servie par Cloudinary
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

export function VerificationsTable() {
  const [tab, setTab] = useState<Tab>("teams");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex rounded-lg border border-border p-1">
        <button
          type="button"
          onClick={() => setTab("teams")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "teams" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Équipes en attente
        </button>
        <button
          type="button"
          onClick={() => setTab("players")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "players" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Joueurs en attente
        </button>
      </div>

      {tab === "teams" ? <PendingTeams /> : <PendingPlayers />}
    </div>
  );
}

function PendingTeams() {
  const [items, setItems] = useState<TeamSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<TeamDetail | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resolving, setResolving] = useState(false);

  function reload() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), perPage: "10", status: "PENDING" });
    if (search) params.set("search", search);
    apiRequestWithMeta<TeamSummary[]>(`/teams?${params}`)
      .then(({ data, meta }) => {
        setItems(data ?? []);
        setTotalPages(meta?.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const handle = setTimeout(reload, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    apiRequest<{ team: TeamDetail }>(`/teams/${selectedId}`).then((data) => setSelected(data?.team ?? null));
  }, [selectedId]);

  async function certify() {
    if (!selectedId) return;
    setResolving(true);
    try {
      await apiRequest(`/teams/${selectedId}/certify`, { method: "POST" });
      setConfirmOpen(false);
      setSelectedId(null);
      reload();
    } finally {
      setResolving(false);
    }
  }

  return (
    <>
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher (nom, tag...)"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Équipe</th>
                <th className="px-4 py-3 font-medium">Membres</th>
                <th className="px-4 py-3 font-medium">Créée le</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                    Aucune équipe en attente de certification.
                  </td>
                </tr>
              ) : (
                items.map((team) => (
                  <tr
                    key={team.id}
                    onClick={() => setSelectedId(team.id)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="flex items-center gap-2.5 px-4 py-3">
                      <Avatar url={fileSrc(team.logoUrl)} label={team.tag} />
                      <div>
                        <p className="font-medium text-foreground">{team.name}</p>
                        <p className="text-xs text-muted-foreground">[{team.tag}]</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{team.memberCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(team.createdAt).toLocaleDateString("fr-FR")}
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

      <Sheet open={!!selectedId} onClose={() => setSelectedId(null)} title="Détail de l'équipe">
        {selected ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Avatar url={fileSrc(selected.logoUrl)} label={selected.tag} large />
              <div>
                <p className="text-lg font-semibold text-foreground">{selected.name}</p>
                <p className="text-sm text-muted-foreground">[{selected.tag}]</p>
              </div>
            </div>

            <Badge variant="muted" className="w-fit">
              En attente de certification
            </Badge>

            {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Effectif ({selected.members.length})
              </p>
              <div className="flex flex-col gap-2">
                {selected.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar url={fileSrc(member.user.avatarUrl)} label={member.user.playerProfile?.ffPseudo ?? "?"} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{member.user.playerProfile?.ffPseudo}</p>
                        <p className="text-xs text-muted-foreground">
                          ID Free Fire : {member.user.playerProfile?.ffPlayerId ?? "—"} · {member.user.email}
                        </p>
                      </div>
                    </div>
                    <Badge variant={member.managementRole === "CAPTAIN" ? "default" : "muted"}>
                      {member.managementRole === "CAPTAIN" ? "Capitaine" : member.managementRole === "MANAGER" ? "Manager" : "Membre"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <Button className="mt-2 gap-1.5" onClick={() => setConfirmOpen(true)}>
              <ShieldCheck className="size-4" />
              Certifier cette équipe
            </Button>
          </div>
        ) : (
          <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
        )}
      </Sheet>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Certifier cette équipe ?"
        description={`${selected?.name ?? "Cette équipe"} apparaîtra en priorité dans les listes publiques et admin.`}
        confirmLabel="Certifier"
        loading={resolving}
        onConfirm={certify}
      />
    </>
  );
}

function PendingPlayers() {
  const [items, setItems] = useState<PlayerUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PlayerUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<"VERIFIED" | "REJECTED" | null>(null);
  const [resolving, setResolving] = useState(false);

  function reload() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), perPage: "10" });
    if (search) params.set("search", search);
    apiRequestWithMeta<PlayerUser[]>(`/users/pending-verification?${params}`)
      .then(({ data, meta }) => {
        setItems(data ?? []);
        setTotalPages(meta?.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const handle = setTimeout(reload, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  async function resolve(status: "VERIFIED" | "REJECTED") {
    if (!selected) return;
    setResolving(true);
    try {
      await apiRequest(`/users/${selected.id}/verification`, { method: "PATCH", body: { status } });
      setConfirmAction(null);
      setSelected(null);
      reload();
    } finally {
      setResolving(false);
    }
  }

  return (
    <>
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher (pseudo, ID Free Fire...)"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Joueur</th>
                <th className="px-4 py-3 font-medium">ID Free Fire</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium" />
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
                    Aucun joueur en attente de vérification.
                  </td>
                </tr>
              ) : (
                items.map((player) => (
                  <tr key={player.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="flex items-center gap-2.5 px-4 py-3">
                      <Avatar url={fileSrc(player.avatarUrl)} label={player.playerProfile?.ffPseudo ?? "?"} />
                      <p className="font-medium text-foreground">{player.playerProfile?.ffPseudo}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{player.playerProfile?.ffPlayerId}</td>
                    <td className="px-4 py-3 text-muted-foreground">{player.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelected(player);
                            setConfirmAction("REJECTED");
                          }}
                        >
                          <X className="size-4" />
                          Rejeter
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelected(player);
                            setConfirmAction("VERIFIED");
                          }}
                        >
                          <Check className="size-4" />
                          Valider
                        </Button>
                      </div>
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

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
            setSelected(null);
          }
        }}
        title={confirmAction === "VERIFIED" ? "Valider ce pseudo ?" : "Rejeter ce pseudo ?"}
        description={
          confirmAction === "VERIFIED"
            ? `${selected?.playerProfile?.ffPseudo} sera marqué comme vérifié et comptera dans les quotas nécessitant des joueurs vérifiés.`
            : `${selected?.playerProfile?.ffPseudo} sera marqué comme rejeté — le pseudo déclaré ne correspond pas à l'ID Free Fire fourni.`
        }
        confirmLabel={confirmAction === "VERIFIED" ? "Valider" : "Rejeter"}
        variant={confirmAction === "REJECTED" ? "accent" : "default"}
        loading={resolving}
        onConfirm={() => confirmAction && resolve(confirmAction)}
      />
    </>
  );
}
