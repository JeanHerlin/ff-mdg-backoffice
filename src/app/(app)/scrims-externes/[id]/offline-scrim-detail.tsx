"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Crown, ImagePlus, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { apiRequest, ApiError } from "@/lib/api-client";
import { OfflineScrimResultsSection } from "./offline-scrim-results-section";

interface OfflineScrimTeam {
  id: string;
  name: string;
  tag: string | null;
  logoUrl: string | null;
}

interface OfflineScrimData {
  id: string;
  name: string;
  startAt: string;
  isChampionRush: boolean;
  championRushThreshold: number | null;
  teams: OfflineScrimTeam[];
  _count: { matches: number };
}

interface TeamSearchResult {
  name: string;
  tag: string | null;
  logoUrl: string | null;
}

function TeamLogo({ url, label }: { url: string | null; label: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- image dynamique servie par Cloudinary
    return <img src={url} alt={label} className="size-5 rounded-full object-cover" />;
  }
  return (
    <div className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">
      {label.slice(0, 2).toUpperCase()}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function OfflineScrimDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [scrim, setScrim] = useState<OfflineScrimData | null | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);
  const [teamFormOpen, setTeamFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<OfflineScrimTeam | null>(null);
  // Incrémenté à chaque ouverture du formulaire (ajout ou modification) —
  // sert de key à TeamForm pour forcer un remontage complet à chaque fois :
  // sans ça, ouvrir "Ajouter une équipe" juste après en avoir créé une garde
  // le nom/tag/logo de la précédente saisie (le Sheet ne démonte jamais ses
  // enfants, seul un changement de key le force).
  const [teamFormKey, setTeamFormKey] = useState(0);
  const [deleteTeamTarget, setDeleteTeamTarget] = useState<OfflineScrimTeam | null>(null);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [deleteScrimOpen, setDeleteScrimOpen] = useState(false);
  const [deletingScrim, setDeletingScrim] = useState(false);

  const load = useCallback(() => {
    apiRequest<{ scrim: OfflineScrimData }>(`/offline-scrims/${params.id}`)
      .then((d) => setScrim(d?.scrim ?? null))
      .catch(() => setScrim(null));
  }, [params.id]);

  useEffect(load, [load]);

  async function confirmDeleteTeam() {
    if (!deleteTeamTarget || !scrim) return;
    setDeletingTeam(true);
    try {
      await apiRequest(`/offline-scrims/${scrim.id}/teams/${deleteTeamTarget.id}`, { method: "DELETE" });
      setDeleteTeamTarget(null);
      load();
    } finally {
      setDeletingTeam(false);
    }
  }

  async function confirmDeleteScrim() {
    if (!scrim) return;
    setDeletingScrim(true);
    try {
      await apiRequest(`/offline-scrims/${scrim.id}`, { method: "DELETE" });
      router.push("/scrims-externes");
    } finally {
      setDeletingScrim(false);
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{scrim.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Début : {formatDate(scrim.startAt)}</p>
          {scrim.isChampionRush && (
            <Badge variant="outline" className="mt-2 border-amber-400/50 text-amber-500">
              <Crown className="size-3.5" />
              Mode Champion Rush — {scrim.championRushThreshold} pts à atteindre
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Modifier
          </Button>
          <Button variant="outline" onClick={() => setDeleteScrimOpen(true)}>
            <Trash2 className="size-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Équipes ({scrim.teams.length})</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingTeam(null);
              setTeamFormKey((k) => k + 1);
              setTeamFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Ajouter une équipe
          </Button>
        </CardHeader>
        <CardContent>
          {scrim.teams.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune équipe saisie — ajoutez les équipes participantes avant de saisir un résultat.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {scrim.teams.map((team) => (
                <span
                  key={team.id}
                  className="flex items-center gap-2 rounded-full border border-border bg-muted/40 py-1 pl-2 pr-1.5 text-sm"
                >
                  <TeamLogo url={team.logoUrl} label={team.tag ?? team.name} />
                  <span className="font-medium text-foreground">{team.name}</span>
                  {team.tag && <span className="text-muted-foreground">[{team.tag}]</span>}
                  <button
                    onClick={() => {
                      setEditingTeam(team);
                      setTeamFormKey((k) => k + 1);
                      setTeamFormOpen(true);
                    }}
                    className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Modifier"
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    onClick={() => setDeleteTeamTarget(team)}
                    className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-accent"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <OfflineScrimResultsSection
        scrimId={scrim.id}
        teams={scrim.teams}
        scrimName={scrim.name}
        scrimStartAt={scrim.startAt}
        isChampionRush={scrim.isChampionRush}
        championRushThreshold={scrim.championRushThreshold}
      />

      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="Modifier le scrim">
        <EditScrimForm
          scrim={scrim}
          onSaved={() => {
            setEditOpen(false);
            load();
          }}
        />
      </Sheet>

      <Sheet
        open={teamFormOpen}
        onClose={() => setTeamFormOpen(false)}
        title={editingTeam ? "Modifier l'équipe" : "Ajouter une équipe"}
      >
        <TeamForm
          // Remonte un composant tout neuf à chaque ouverture (ajout ou
          // modification, même équipe ou non) — sans ça, le formulaire garde
          // l'état (nom, tag, logo) de la précédente ouverture, puisque le
          // Sheet ne démonte jamais ses enfants.
          key={teamFormKey}
          scrimId={scrim.id}
          team={editingTeam}
          onSaved={() => {
            setTeamFormOpen(false);
            load();
          }}
        />
      </Sheet>

      <ConfirmDialog
        open={!!deleteTeamTarget}
        onOpenChange={(open) => !open && setDeleteTeamTarget(null)}
        title={`Supprimer "${deleteTeamTarget?.name}" ?`}
        description="Les résultats déjà saisis pour cette équipe redeviendront non assignés — ils ne sont pas supprimés."
        confirmLabel="Supprimer"
        variant="accent"
        loading={deletingTeam}
        onConfirm={confirmDeleteTeam}
      />

      <ConfirmDialog
        open={deleteScrimOpen}
        onOpenChange={setDeleteScrimOpen}
        title={`Supprimer "${scrim.name}" ?`}
        description="Le scrim, ses équipes et tous ses résultats seront définitivement supprimés. Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="accent"
        loading={deletingScrim}
        onConfirm={confirmDeleteScrim}
      />
    </div>
  );
}

function EditScrimForm({ scrim, onSaved }: { scrim: OfflineScrimData; onSaved: () => void }) {
  const [name, setName] = useState(scrim.name);
  const [startAt, setStartAt] = useState(scrim.startAt.slice(0, 16));
  const [isChampionRush, setIsChampionRush] = useState(scrim.isChampionRush);
  const [championRushThreshold, setChampionRushThreshold] = useState(
    scrim.championRushThreshold != null ? String(scrim.championRushThreshold) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (isChampionRush && !championRushThreshold.trim()) {
      setError("Indiquez le nombre de points à atteindre pour le Champion Rush.");
      return;
    }
    setSaving(true);
    try {
      await apiRequest(`/offline-scrims/${scrim.id}`, {
        method: "PATCH",
        body: {
          name: name.trim(),
          startAt: new Date(startAt).toISOString(),
          isChampionRush,
          ...(isChampionRush ? { championRushThreshold: Number(championRushThreshold) } : {}),
        },
      });
      onSaved();
    } catch {
      setError("Une erreur est survenue, réessayez.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-offline-scrim-name">Nom du scrim</Label>
        <Input id="edit-offline-scrim-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={3} maxLength={80} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-offline-scrim-start">Date de début</Label>
        <DateTimePicker id="edit-offline-scrim-start" value={startAt} onChange={setStartAt} />
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
            <Label htmlFor="edit-offline-scrim-threshold">Points à atteindre</Label>
            <Input
              id="edit-offline-scrim-threshold"
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
        Enregistrer
      </Button>
    </form>
  );
}

// Recherche parmi les équipes déjà saisies dans N'IMPORTE QUEL scrim externe
// — pure convenance UX à l'ajout, pour éviter de ressaisir nom/tag/logo d'une
// équipe déjà rencontrée. Le formulaire manuel (nom/tag/logo + édition en
// place) reste entièrement inchangé, cette recherche vient juste le
// pré-remplir en un clic.
function TeamSearchField({ onSelect }: { onSelect: (result: TeamSearchResult) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TeamSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      apiRequest<TeamSearchResult[]>(`/offline-scrims/teams/search?q=${encodeURIComponent(q)}`)
        .then((data) => setResults(data ?? []))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div ref={ref} className="relative flex flex-col gap-1.5">
      <Label htmlFor="offline-team-search">Réutiliser une équipe déjà saisie (facultatif)</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="offline-team-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher par nom..."
          className="pl-9"
        />
      </div>
      {open && query.trim() && (
        <div className="absolute top-full z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-card py-1 shadow-lg">
          {searching ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Aucune équipe trouvée.</p>
          ) : (
            results.map((r) => (
              <button
                key={r.name}
                type="button"
                onClick={() => {
                  onSelect(r);
                  setQuery("");
                  setResults([]);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <TeamLogo url={r.logoUrl} label={r.tag ?? r.name} />
                <span className="font-medium text-foreground">{r.name}</span>
                {r.tag && <span className="text-muted-foreground">[{r.tag}]</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TeamForm({ scrimId, team, onSaved }: { scrimId: string; team: OfflineScrimTeam | null; onSaved: () => void }) {
  const [name, setName] = useState(team?.name ?? "");
  const [tag, setTag] = useState(team?.tag ?? "");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(team?.logoUrl ?? null);
  // Distinct de logoPreview===null : celui-ci reste vrai même après un
  // nouveau choix de fichier tant qu'on n'a pas soumis, pour ne jamais
  // renvoyer removeLogo si un fichier a finalement été choisi entre-temps.
  const [removeLogo, setRemoveLogo] = useState(false);
  // Logo d'une équipe réutilisée via la recherche — une URL Cloudinary déjà
  // existante, jamais un fichier à envoyer : voir handleSubmit, elle n'est
  // envoyée que si aucun nouveau fichier n'a été choisi entre-temps.
  const [reusedLogoUrl, setReusedLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleLogoChange(file: File | null) {
    setLogo(file);
    setRemoveLogo(false);
    setReusedLogoUrl(null);
    setLogoPreview(file ? URL.createObjectURL(file) : (team?.logoUrl ?? null));
  }

  function handleRemoveLogo() {
    setLogo(null);
    setLogoPreview(null);
    setRemoveLogo(true);
    setReusedLogoUrl(null);
  }

  function handleSelectSearchResult(result: TeamSearchResult) {
    setName(result.name);
    setTag(result.tag ?? "");
    setLogo(null);
    setRemoveLogo(false);
    setReusedLogoUrl(result.logoUrl);
    setLogoPreview(result.logoUrl);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("name", name.trim());
      if (tag.trim()) formData.set("tag", tag.trim());
      if (logo) formData.set("logo", logo);
      else if (removeLogo) formData.set("removeLogo", "true");
      else if (reusedLogoUrl) formData.set("logoUrl", reusedLogoUrl);
      if (team) {
        await apiRequest(`/offline-scrims/${scrimId}/teams/${team.id}`, { method: "PATCH", body: formData });
      } else {
        await apiRequest(`/offline-scrims/${scrimId}/teams`, { method: "POST", body: formData });
      }
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError && err.message === "offline_scrims.team_name_taken"
          ? "Une équipe de ce nom existe déjà dans ce scrim."
          : "Une erreur est survenue, réessayez."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {!team && <TeamSearchField onSelect={handleSelectSearchResult} />}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="offline-team-name">Nom de l&apos;équipe</Label>
        <Input id="offline-team-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={1} maxLength={60} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="offline-team-tag">Tag (facultatif)</Label>
        <Input id="offline-team-tag" value={tag} onChange={(e) => setTag(e.target.value)} maxLength={10} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="offline-team-logo">Logo (facultatif)</Label>
        <div className="flex items-center gap-3">
          {logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu local ou logo Cloudinary déjà enregistré
            <img src={logoPreview} alt="" className="size-12 rounded-full border border-border object-cover" />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {(tag || name || "?").slice(0, 2).toUpperCase()}
            </div>
          )}
          <label
            htmlFor="offline-team-logo"
            className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted px-3 py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary"
          >
            <ImagePlus className="size-4 shrink-0" />
            {logoPreview ? "Changer le logo" : "Choisir un logo"}
          </label>
          <input
            id="offline-team-logo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
          />
          {logoPreview && (
            <Button type="button" variant="outline" size="icon" onClick={handleRemoveLogo} title="Retirer le logo">
              <X className="size-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Sans logo, les initiales du tag (ou du nom) sont affichées à la place.</p>
      </div>
      {error && <p className="text-sm text-accent">{error}</p>}
      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        {team ? "Enregistrer" : "Ajouter l'équipe"}
      </Button>
    </form>
  );
}
