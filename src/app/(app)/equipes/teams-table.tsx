"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2, Crown, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiRequestWithMeta, apiRequest } from "@/lib/api-client";

interface TeamSummary {
  id: string;
  name: string;
  tag: string;
  logoUrl: string | null;
  status: "PENDING" | "CERTIFIED";
  memberCount: number;
  createdAt: string;
  dissolutionRequestedAt: string | null;
}

interface TeamMember {
  id: string;
  managementRole: "CAPTAIN" | "MANAGER" | "MEMBER";
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

type DissolutionAction = "approve" | "reject";

const ROLE_LABEL: Record<string, string> = { CAPTAIN: "Capitaine", MANAGER: "Manager", MEMBER: "Membre" };

function fileSrc(url: string | null) {
  return url;
}

export function TeamsTable() {
  const [items, setItems] = useState<TeamSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<TeamDetail | null>(null);
  const [confirmAction, setConfirmAction] = useState<DissolutionAction | null>(null);
  const [resolving, setResolving] = useState(false);

  function reload() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), perPage: "10", status: "CERTIFIED" });
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
  }, [page, search]);

  function reloadSelected() {
    if (!selectedId) return;
    apiRequest<{ team: TeamDetail }>(`/teams/${selectedId}`).then((data) => setSelected(data?.team ?? null));
  }

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    reloadSelected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  async function resolveDissolution(action: DissolutionAction) {
    if (!selectedId) return;
    setResolving(true);
    try {
      await apiRequest(`/teams/${selectedId}/${action}-dissolution`, { method: "POST" });
      setConfirmAction(null);
      reload();
      if (action === "reject") {
        reloadSelected();
      } else {
        setSelectedId(null);
      }
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
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
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Créée le</th>
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
                    Aucune équipe trouvée.
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
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={team.status === "CERTIFIED" ? "default" : "muted"}>
                          {team.status === "CERTIFIED" ? "Certifiée" : "En attente"}
                        </Badge>
                        {team.dissolutionRequestedAt && (
                          <Badge variant="accent" className="gap-1">
                            <TriangleAlert className="size-3" />
                            Dissolution demandée
                          </Badge>
                        )}
                      </div>
                    </td>
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

            <Badge variant={selected.status === "CERTIFIED" ? "default" : "muted"} className="w-fit">
              {selected.status === "CERTIFIED" ? "Certifiée" : "En attente de vérification"}
            </Badge>

            {selected.dissolutionRequestedAt && (
              <div className="flex flex-col gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
                <p className="flex items-center gap-1.5 text-sm text-accent">
                  <TriangleAlert className="size-4" />
                  Dissolution demandée le {new Date(selected.dissolutionRequestedAt).toLocaleDateString("fr-FR")}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setConfirmAction("reject")}>
                    Refuser
                  </Button>
                  <Button size="sm" variant="accent" onClick={() => setConfirmAction("approve")}>
                    Approuver et dissoudre
                  </Button>
                </div>
              </div>
            )}

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
                        <p className="text-xs text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                    <Badge variant={member.managementRole === "CAPTAIN" ? "default" : "muted"} className="gap-1">
                      {member.managementRole === "CAPTAIN" && <Crown className="size-3" />}
                      {ROLE_LABEL[member.managementRole]}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
        )}
      </Sheet>

      <ConfirmDialog
        open={confirmAction === "approve"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Approuver la dissolution ?"
        description={`${selected?.name ?? "Cette équipe"} sera définitivement supprimée. Cette action est irréversible.`}
        confirmLabel="Dissoudre définitivement"
        variant="accent"
        loading={resolving}
        onConfirm={() => resolveDissolution("approve")}
      />

      <ConfirmDialog
        open={confirmAction === "reject"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Refuser la demande de dissolution ?"
        description="L'équipe reste active, le capitaine pourra refaire une demande plus tard."
        confirmLabel="Refuser la demande"
        loading={resolving}
        onConfirm={() => resolveDissolution("reject")}
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
