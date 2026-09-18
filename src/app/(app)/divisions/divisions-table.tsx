"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiRequest, ApiError } from "@/lib/api-client";

type Scope = "PLAYER" | "TEAM";

interface Division {
  id: string;
  scope: Scope;
  name: string;
  minPoints: number;
  badgeColor: string;
}

export function DivisionsTable() {
  const [scope, setScope] = useState<Scope>("TEAM");
  const [items, setItems] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Division | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Division | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    apiRequest<Division[]>(`/divisions?scope=${scope}`)
      .then((data) => setItems(data ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, [scope]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiRequest(`/divisions/${deleteTarget.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(
        err instanceof ApiError && err.message === "divisions.in_use"
          ? "Des joueurs ou équipes sont encore classés dans ce palier — reclassez-les avant de le supprimer."
          : "Une erreur est survenue, réessayez."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button type="button" variant={scope === "TEAM" ? "default" : "outline"} onClick={() => setScope("TEAM")}>
            Équipes
          </Button>
          <Button type="button" variant={scope === "PLAYER" ? "default" : "outline"} onClick={() => setScope("PLAYER")}>
            Joueurs
          </Button>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Créer un palier
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Palier</th>
                <th className="px-4 py-3 font-medium">Seuil de points</th>
                <th className="px-4 py-3 font-medium" />
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
                    Aucun palier pour le moment — les {scope === "TEAM" ? "équipes" : "joueurs"} restent "Non classé(e)s".
                  </td>
                </tr>
              ) : (
                items.map((division) => (
                  <tr key={division.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <span className="size-3 shrink-0 rounded-full border border-border" style={{ backgroundColor: division.badgeColor }} />
                        {division.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">≥ {division.minPoints} pts</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            setEditing(division);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button size="icon" variant="outline" onClick={() => setDeleteTarget(division)}>
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

      <Sheet open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Modifier le palier" : "Créer un palier"}>
        <DivisionForm
          scope={scope}
          division={editing}
          onSaved={() => {
            setFormOpen(false);
            load();
          }}
        />
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        title={`Supprimer "${deleteTarget?.name}" ?`}
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="accent"
        loading={deleting}
        onConfirm={confirmDelete}
      >
        {deleteError && <p className="text-sm text-accent">{deleteError}</p>}
      </ConfirmDialog>
    </div>
  );
}

function DivisionForm({ scope, division, onSaved }: { scope: Scope; division: Division | null; onSaved: () => void }) {
  const [name, setName] = useState(division?.name ?? "");
  const [minPoints, setMinPoints] = useState(String(division?.minPoints ?? 0));
  const [badgeColor, setBadgeColor] = useState(division?.badgeColor ?? "#F5821F");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const body = { name: name.trim(), minPoints: Number(minPoints), badgeColor };
      if (division) {
        await apiRequest(`/divisions/${division.id}`, { method: "PATCH", body });
      } else {
        await apiRequest("/divisions", { method: "POST", body: { ...body, scope } });
      }
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError && err.message === "divisions.threshold_taken"
          ? "Un autre palier de cette échelle a déjà ce seuil de points."
          : "Une erreur est survenue, réessayez."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="division-name">Nom du palier</Label>
        <Input id="division-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={1} maxLength={60} placeholder="Division 1" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="division-min-points">Seuil de points (saison)</Label>
        <Input id="division-min-points" type="number" value={minPoints} onChange={(e) => setMinPoints(e.target.value)} />
        <p className="text-xs text-muted-foreground">
          {scope === "TEAM" ? "Une équipe" : "Un joueur"} ayant cumulé au moins ce nombre de points sur la saison clôturée est
          classé dans ce palier (le seuil le plus haut atteint l&apos;emporte).
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="division-color">Couleur du badge</Label>
        <div className="flex items-center gap-2">
          <input
            id="division-color"
            type="color"
            value={badgeColor}
            onChange={(e) => setBadgeColor(e.target.value)}
            className="h-9 w-14 cursor-pointer rounded-md border border-border bg-input"
          />
          <Input value={badgeColor} onChange={(e) => setBadgeColor(e.target.value)} className="w-28" />
        </div>
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        {division ? "Enregistrer" : "Créer le palier"}
      </Button>
    </form>
  );
}
