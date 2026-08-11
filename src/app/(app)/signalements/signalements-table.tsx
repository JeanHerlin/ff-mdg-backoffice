"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiRequestWithMeta, apiRequest } from "@/lib/api-client";

type ReportStatus = "PENDING" | "APPROVED" | "REJECTED";

interface ReportSummary {
  id: string;
  ffPlayerId: string;
  ffPseudo: string;
  reporterEmail: string;
  status: ReportStatus;
  createdAt: string;
}

interface ReportDetail extends ReportSummary {
  proofScreenshotUrl: string | null;
  proofVideoUrl: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
}

const STATUS_LABEL: Record<ReportStatus, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Refusé",
};

export function SignalementsTable() {
  const [tab, setTab] = useState<ReportStatus>("PENDING");
  const [items, setItems] = useState<ReportSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReportDetail | null>(null);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [resolving, setResolving] = useState(false);

  function reload() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), perPage: "10", status: tab });
    if (search) params.set("search", search);
    apiRequestWithMeta<ReportSummary[]>(`/ff-id-reports?${params}`)
      .then(({ data, meta }) => {
        setItems(data ?? []);
        setTotalPages(meta?.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setPage(1);
  }, [tab]);

  useEffect(() => {
    const handle = setTimeout(reload, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tab, search]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    apiRequest<{ report: ReportDetail }>(`/ff-id-reports/${selectedId}`).then((data) =>
      setSelected(data?.report ?? null)
    );
  }, [selectedId]);

  async function approve() {
    if (!selectedId) return;
    setResolving(true);
    try {
      await apiRequest(`/ff-id-reports/${selectedId}/approve`, { method: "POST" });
      setConfirmAction(null);
      setSelectedId(null);
      reload();
    } finally {
      setResolving(false);
    }
  }

  async function reject() {
    if (!selectedId || !rejectReason.trim()) return;
    setResolving(true);
    try {
      await apiRequest(`/ff-id-reports/${selectedId}/reject`, {
        method: "POST",
        body: { reason: rejectReason.trim() },
      });
      setConfirmAction(null);
      setSelectedId(null);
      setRejectReason("");
      reload();
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-border p-1">
          {(["PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setTab(status)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === status ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {STATUS_LABEL[status]}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher (pseudo, ID, email)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Pseudo signalé</th>
                <th className="px-4 py-3 font-medium">ID Free Fire</th>
                <th className="px-4 py-3 font-medium">Email du plaignant</th>
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
                    Aucun signalement trouvé.
                  </td>
                </tr>
              ) : (
                items.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => setSelectedId(report.id)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{report.ffPseudo}</td>
                    <td className="px-4 py-3 text-muted-foreground">{report.ffPlayerId}</td>
                    <td className="px-4 py-3 text-muted-foreground">{report.reporterEmail}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString("fr-FR")}
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

      <Sheet open={!!selectedId} onClose={() => setSelectedId(null)} title="Détail du signalement">
        {selected ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{selected.ffPseudo}</p>
                <p className="text-sm text-muted-foreground">ID Free Fire : {selected.ffPlayerId}</p>
              </div>
            </div>

            <Badge variant={selected.status === "PENDING" ? "muted" : selected.status === "APPROVED" ? "default" : "accent"} className="w-fit">
              {STATUS_LABEL[selected.status]}
            </Badge>

            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Email du plaignant</dt>
                <dd className="text-foreground">{selected.reporterEmail}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Reçu le</dt>
                <dd className="text-foreground">{new Date(selected.createdAt).toLocaleString("fr-FR")}</dd>
              </div>
              {selected.reviewedAt && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Traité le</dt>
                  <dd className="text-foreground">{new Date(selected.reviewedAt).toLocaleString("fr-FR")}</dd>
                </div>
              )}
              {selected.rejectionReason && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Motif du refus</dt>
                  <dd className="text-foreground">{selected.rejectionReason}</dd>
                </div>
              )}
            </dl>

            {selected.status === "PENDING" && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preuves</p>
                {selected.proofScreenshotUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- image dynamique servie par Cloudinary
                  <img
                    src={selected.proofScreenshotUrl}
                    alt="Capture d'écran fournie"
                    className="w-full rounded-lg border border-border object-contain"
                  />
                )}
                {selected.proofVideoUrl && (
                  <video src={selected.proofVideoUrl} controls className="w-full rounded-lg border border-border" />
                )}
              </div>
            )}

            {selected.status === "PENDING" && (
              <div className="flex gap-2 border-t border-border pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmAction("reject")}>
                  Refuser
                </Button>
                <Button variant="accent" className="flex-1" onClick={() => setConfirmAction("approve")}>
                  Approuver
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
        )}
      </Sheet>

      <ConfirmDialog
        open={confirmAction === "approve"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Approuver ce signalement ?"
        description={`Le compte actuellement lié à l'ID ${selected?.ffPlayerId} sera définitivement supprimé, et ${selected?.reporterEmail} sera avisé(e) par email. Cette action est irréversible.`}
        confirmLabel="Approuver et supprimer le compte"
        variant="accent"
        loading={resolving}
        onConfirm={approve}
      />

      <ConfirmDialog
        open={confirmAction === "reject"}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
            setRejectReason("");
          }
        }}
        title="Refuser ce signalement ?"
        description={`${selected?.reporterEmail} sera avisé(e) par email du refus et du motif ci-dessous.`}
        confirmLabel="Refuser le signalement"
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
            placeholder="Expliquez pourquoi ce signalement est refusé..."
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            autoFocus
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
