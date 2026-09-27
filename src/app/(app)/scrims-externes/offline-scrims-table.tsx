"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Shield, Swords } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { apiRequest, ApiError } from "@/lib/api-client";

interface OfflineScrimSummary {
  id: string;
  name: string;
  startAt: string;
  _count: { teams: number; matches: number };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function OfflineScrimsTable() {
  const router = useRouter();
  const [items, setItems] = useState<OfflineScrimSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  function load() {
    setLoading(true);
    apiRequest<OfflineScrimSummary[]>("/offline-scrims")
      .then((data) => setItems(data ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Créer un scrim externe
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Scrim</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Équipes</th>
                <th className="px-4 py-3 font-medium">Matchs</th>
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
                    Aucun scrim externe pour le moment.
                  </td>
                </tr>
              ) : (
                items.map((scrim) => (
                  <tr
                    key={scrim.id}
                    onClick={() => router.push(`/scrims-externes/${scrim.id}`)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{scrim.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(scrim.startAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Shield className="size-3.5" />
                        {scrim._count.teams}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Swords className="size-3.5" />
                        {scrim._count.matches}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Sheet open={formOpen} onClose={() => setFormOpen(false)} title="Créer un scrim externe">
        <CreateOfflineScrimForm
          onCreated={(id) => {
            setFormOpen(false);
            router.push(`/scrims-externes/${id}`);
          }}
        />
      </Sheet>
    </div>
  );
}

function CreateOfflineScrimForm({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const [startAt, setStartAt] = useState("");
  const [isChampionRush, setIsChampionRush] = useState(false);
  const [championRushThreshold, setChampionRushThreshold] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!startAt) {
      setError("Choisissez une date et une heure de début.");
      return;
    }
    if (isChampionRush && !championRushThreshold.trim()) {
      setError("Indiquez le nombre de points à atteindre pour le Champion Rush.");
      return;
    }
    setSaving(true);
    try {
      const data = await apiRequest<{ scrim: { id: string } }>("/offline-scrims", {
        method: "POST",
        body: {
          name: name.trim(),
          startAt: new Date(startAt).toISOString(),
          isChampionRush,
          ...(isChampionRush ? { championRushThreshold: Number(championRushThreshold) } : {}),
        },
      });
      if (data?.scrim) onCreated(data.scrim.id);
    } catch (err) {
      setError(err instanceof ApiError ? "Vérifiez les champs saisis." : "Une erreur est survenue, réessayez.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="offline-scrim-name">Nom du scrim</Label>
        <Input id="offline-scrim-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={3} maxLength={80} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="offline-scrim-start">Date de début</Label>
        <DateTimePicker id="offline-scrim-start" value={startAt} onChange={setStartAt} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={isChampionRush}
            onChange={(e) => setIsChampionRush(e.target.checked)}
            className="size-4 rounded border-border accent-primary"
          />
          Mode Champion Rush
        </label>
        {isChampionRush && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="offline-scrim-threshold">Points à atteindre</Label>
            <Input
              id="offline-scrim-threshold"
              type="number"
              min={1}
              max={999}
              value={championRushThreshold}
              onChange={(e) => setChampionRushThreshold(e.target.value)}
              required
            />
          </div>
        )}
      </div>
      {error && <p className="text-sm text-accent">{error}</p>}
      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Créer le scrim
      </Button>
    </form>
  );
}
