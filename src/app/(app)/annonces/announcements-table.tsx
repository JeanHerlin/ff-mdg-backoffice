"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiRequest, apiRequestWithMeta, ApiError } from "@/lib/api-client";

interface Announcement {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  publishedAt: string;
  createdBy: { id: string; displayName: string };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AnnouncementsTable() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    apiRequestWithMeta<Announcement[]>(`/announcements?page=${page}&perPage=10`)
      .then(({ data, meta }) => {
        setItems(data ?? []);
        setTotalPages(meta?.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [page]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest(`/announcements/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      load();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Publier une annonce
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Annonce</th>
                <th className="px-4 py-3 font-medium">Publiée par</th>
                <th className="px-4 py-3 font-medium">Date</th>
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
                    Aucune annonce publiée pour le moment.
                  </td>
                </tr>
              ) : (
                items.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {a.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- image dynamique servie par Cloudinary
                          <img src={a.imageUrl} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                            <ImagePlus className="size-4" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{a.title}</span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">{a.body}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{a.createdBy.displayName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(a.publishedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button size="icon" variant="outline" onClick={() => setDeleteTarget(a)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            &lt;
          </Button>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            &gt;
          </Button>
        </div>
      )}

      <Sheet open={formOpen} onClose={() => setFormOpen(false)} title="Publier une annonce">
        <AnnouncementForm
          onSaved={() => {
            setFormOpen(false);
            setPage(1);
            load();
          }}
        />
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Supprimer "${deleteTarget?.title}" ?`}
        description="Cette annonce disparaîtra du fil d'actualité public. Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="accent"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function AnnouncementForm({ onSaved }: { onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("title", title.trim());
      formData.set("body", body.trim());
      if (image) formData.set("image", image);
      await apiRequest("/announcements", { method: "POST", body: formData });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? "Une erreur est survenue, vérifiez les champs." : "Une erreur est survenue, réessayez.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ann-title">Titre</Label>
        <Input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} maxLength={150} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ann-body">Texte</Label>
        <textarea
          id="ann-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          maxLength={5000}
          required
          className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ann-image">Image (facultatif)</Label>
        <label
          htmlFor="ann-image"
          className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted px-3 py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary"
        >
          <ImagePlus className="size-4 shrink-0" />
          {image ? image.name : "Choisir une image"}
        </label>
        <input
          id="ann-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
        />
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Publier
      </Button>
    </form>
  );
}
