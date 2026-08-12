"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, ImagePlus, Loader2, MessageSquareWarning, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiRequestWithMeta, apiRequest } from "@/lib/api-client";

type TransferStatus = "PENDING_COUNTERPART" | "PENDING_ADMIN" | "CHANGES_REQUESTED" | "APPROVED" | "REJECTED" | "CANCELLED";
type Tab = "PENDING_ADMIN" | "CHANGES_REQUESTED" | "APPROVED";

interface TeamSummary {
  id: string;
  name: string;
  tag: string;
  logoUrl: string | null;
}

interface PlayerSummary {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  playerProfile: { ffPseudo: string; ffPlayerId: string } | null;
}

interface TransferRequest {
  id: string;
  type: "TRANSFER" | "RELEASE";
  status: TransferStatus;
  initiatedBy: "PLAYER" | "CAPTAIN";
  imageUrl: string | null;
  description: string | null;
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  player: PlayerSummary;
  initiator: PlayerSummary;
  fromTeam: TeamSummary;
  toTeam: TeamSummary | null;
}

const TAB_LABEL: Record<Tab, string> = {
  PENDING_ADMIN: "En attente",
  CHANGES_REQUESTED: "Précision demandée",
  APPROVED: "Approuvés",
};

function playerLabel(p: PlayerSummary) {
  return p.playerProfile?.ffPseudo ?? p.displayName ?? p.email;
}

function fileSrc(url: string | null) {
  return url;
}

function Avatar({ url, label }: { url: string | null; label: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- image dynamique servie par Cloudinary
    return <img src={url} alt={label} className="size-8 rounded-full object-cover" />;
  }
  return (
    <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold uppercase text-primary">
      {label.slice(0, 2)}
    </div>
  );
}

function TeamLogo({ url, label }: { url: string | null; label: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- image dynamique servie par Cloudinary
    return <img src={url} alt={label} className="size-9 rounded-md object-cover" />;
  }
  return (
    <div className="flex size-9 items-center justify-center rounded-md bg-primary/15 text-[10px] font-bold text-primary">
      {label.slice(0, 3)}
    </div>
  );
}

function TransferRoute({ fromTeam, toTeam }: { fromTeam: TeamSummary; toTeam: TeamSummary | null }) {
  return (
    <div className="flex items-center justify-center gap-4 rounded-lg border border-border p-4">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <TeamLogo url={fromTeam.logoUrl} label={fromTeam.tag} />
        <p className="text-xs font-medium text-foreground">{fromTeam.name}</p>
        <p className="text-[11px] text-muted-foreground">[{fromTeam.tag}]</p>
      </div>
      <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
      {toTeam ? (
        <div className="flex flex-col items-center gap-1.5 text-center">
          <TeamLogo url={toTeam.logoUrl} label={toTeam.tag} />
          <p className="text-xs font-medium text-foreground">{toTeam.name}</p>
          <p className="text-[11px] text-muted-foreground">[{toTeam.tag}]</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5 text-center text-muted-foreground">
          <div className="flex size-9 items-center justify-center rounded-md border border-dashed border-border">
            —
          </div>
          <p className="text-xs italic">Agent libre</p>
        </div>
      )}
    </div>
  );
}

export function MercatoTable() {
  const [tab, setTab] = useState<Tab>("PENDING_ADMIN");
  const [items, setItems] = useState<TransferRequest[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<TransferRequest | null>(null);

  const [approveOpen, setApproveOpen] = useState(false);
  const [approveImage, setApproveImage] = useState<File | null>(null);
  const [approveDescription, setApproveDescription] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [changesOpen, setChangesOpen] = useState(false);
  const [changesNote, setChangesNote] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => setPage(1), [tab]);

  function reload() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), perPage: "10", status: tab });
    apiRequestWithMeta<TransferRequest[]>(`/transfer-requests?${params}`)
      .then(({ data, meta }) => {
        setItems(data ?? []);
        setTotalPages(meta?.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, [page, tab]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    apiRequest<{ request: TransferRequest }>(`/transfer-requests/${selectedId}`).then((data) =>
      setSelected(data?.request ?? null)
    );
  }, [selectedId]);

  function closeSheetAndReload() {
    setSelectedId(null);
    reload();
  }

  async function approve() {
    if (!selectedId) return;
    setResolving(true);
    try {
      const formData = new FormData();
      if (approveImage) formData.set("image", approveImage);
      if (approveDescription.trim()) formData.set("description", approveDescription.trim());
      await apiRequest(`/transfer-requests/${selectedId}/approve`, { method: "POST", body: formData });
      setApproveOpen(false);
      setApproveImage(null);
      closeSheetAndReload();
    } finally {
      setResolving(false);
    }
  }

  async function reject() {
    if (!selectedId || !rejectReason.trim()) return;
    setResolving(true);
    try {
      await apiRequest(`/transfer-requests/${selectedId}/reject`, {
        method: "POST",
        body: { reason: rejectReason.trim() },
      });
      setRejectOpen(false);
      setRejectReason("");
      closeSheetAndReload();
    } finally {
      setResolving(false);
    }
  }

  async function requestChanges() {
    if (!selectedId || !changesNote.trim()) return;
    setResolving(true);
    try {
      await apiRequest(`/transfer-requests/${selectedId}/request-changes`, {
        method: "POST",
        body: { note: changesNote.trim() },
      });
      setChangesOpen(false);
      setChangesNote("");
      closeSheetAndReload();
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex rounded-lg border border-border p-1">
        {(["PENDING_ADMIN", "CHANGES_REQUESTED", "APPROVED"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setTab(status)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === status ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {TAB_LABEL[status]}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Joueur</th>
                <th className="px-4 py-3 font-medium">Mouvement</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Reçu le</th>
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
                    Aucune demande dans cette catégorie.
                  </td>
                </tr>
              ) : (
                items.map((request) => (
                  <tr
                    key={request.id}
                    onClick={() => setSelectedId(request.id)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="flex items-center gap-2.5 px-4 py-3">
                      <Avatar url={fileSrc(request.player.avatarUrl)} label={playerLabel(request.player)} />
                      <span className="font-medium text-foreground">{playerLabel(request.player)}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>[{request.fromTeam.tag}]</span>
                        {request.toTeam ? (
                          <>
                            <ArrowRight className="size-3.5" />
                            <span>[{request.toTeam.tag}]</span>
                          </>
                        ) : (
                          <span className="text-xs italic">Départ libre</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {request.initiatedBy === "PLAYER" ? "Demande joueur" : "Offre capitaine"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString("fr-FR")}
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

      <Sheet open={!!selectedId} onClose={() => setSelectedId(null)} title="Détail du transfert">
        {selected ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Avatar url={fileSrc(selected.player.avatarUrl)} label={playerLabel(selected.player)} />
              <div>
                <p className="text-sm font-medium text-foreground">{playerLabel(selected.player)}</p>
                <p className="text-xs text-muted-foreground">
                  ID Free Fire : {selected.player.playerProfile?.ffPlayerId ?? "—"} · {selected.player.email}
                </p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Initié par {selected.initiatedBy === "PLAYER" ? "le joueur lui-même" : "le capitaine recruteur"}
              {selected.initiatedBy === "CAPTAIN" && ` (${playerLabel(selected.initiator)})`}
            </div>

            {selected.adminNote && (
              <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
                <MessageSquareWarning className="mt-0.5 size-4 shrink-0 text-accent" />
                <p className="text-sm text-foreground">{selected.adminNote}</p>
              </div>
            )}

            {selected.description && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="whitespace-pre-wrap text-sm text-foreground">{selected.description}</p>
              </div>
            )}

            {selected.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- image dynamique servie par Cloudinary
              <img
                src={selected.imageUrl}
                alt="Image de transfert"
                className="w-full rounded-lg border border-border object-contain"
              />
            )}

            <TransferRoute fromTeam={selected.fromTeam} toTeam={selected.toTeam} />

            {selected.status === "PENDING_ADMIN" && (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <Button
                  className="gap-1.5"
                  onClick={() => {
                    setApproveDescription(selected.description ?? "");
                    setApproveOpen(true);
                  }}
                >
                  <ShieldCheck className="size-4" />
                  Approuver
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setChangesOpen(true)}>
                    Demander une précision
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setRejectOpen(true)}>
                    Refuser
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
        )}
      </Sheet>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={(open) => {
          setApproveOpen(open);
          if (!open) setApproveImage(null);
        }}
        title="Approuver ce transfert ?"
        description={
          selected?.toTeam
            ? `${playerLabel(selected.player)} quittera [${selected.fromTeam.tag}] et rejoindra [${selected.toTeam.tag}] immédiatement.`
            : `${selected ? playerLabel(selected.player) : "Ce joueur"} quittera son équipe et deviendra agent libre.`
        }
        confirmLabel="Approuver"
        loading={resolving}
        onConfirm={approve}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="approveDescription" className="text-xs font-medium text-foreground">
              Description publiée
            </label>
            <textarea
              id="approveDescription"
              value={approveDescription}
              onChange={(e) => setApproveDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Retouchez le texte avant publication si besoin..."
              className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="approveImage" className="text-xs font-medium text-foreground">
              Remplacer l&apos;image (facultatif)
            </label>
            <label
              htmlFor="approveImage"
              className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted px-3 py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary"
            >
              <ImagePlus className="size-4 shrink-0" />
              {approveImage ? approveImage.name : "Garder l'image fournie, ou en choisir une retouchée"}
            </label>
            <input
              id="approveImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => setApproveImage(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open);
          if (!open) setRejectReason("");
        }}
        title="Refuser ce transfert ?"
        description={`${selected ? playerLabel(selected.player) : "Le demandeur"} sera avisé par email du refus et du motif ci-dessous.`}
        confirmLabel="Refuser"
        variant="accent"
        loading={resolving}
        disabled={!rejectReason.trim()}
        onConfirm={reject}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rejectReason" className="text-xs font-medium text-foreground">
            Motif du refus
          </label>
          <textarea
            id="rejectReason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            maxLength={500}
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            autoFocus
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={changesOpen}
        onOpenChange={(open) => {
          setChangesOpen(open);
          if (!open) setChangesNote("");
        }}
        title="Demander une précision ?"
        description={`${selected ? playerLabel(selected.player) : "Le demandeur"} recevra votre message et pourra envoyer une nouvelle image.`}
        confirmLabel="Envoyer la demande"
        loading={resolving}
        disabled={!changesNote.trim()}
        onConfirm={requestChanges}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="changesNote" className="text-xs font-medium text-foreground">
            Message pour le demandeur
          </label>
          <textarea
            id="changesNote"
            value={changesNote}
            onChange={(e) => setChangesNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ex. la photo est floue, envoyez une image plus claire..."
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            autoFocus
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
