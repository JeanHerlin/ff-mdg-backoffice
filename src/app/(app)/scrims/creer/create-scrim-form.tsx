"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { apiRequest, ApiError } from "@/lib/api-client";

interface ScrimDetail {
  id: string;
}

export function CreateScrimForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [registrationOpensAt, setRegistrationOpensAt] = useState("");
  const [registrationClosesAt, setRegistrationClosesAt] = useState("");
  const [checkinOpensAt, setCheckinOpensAt] = useState("");
  const [checkinClosesAt, setCheckinClosesAt] = useState("");
  const [startAt, setStartAt] = useState("");
  const [teamsPerLobby, setTeamsPerLobby] = useState("12");
  const [lobbyMax, setLobbyMax] = useState("2");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    try {
      const data = await apiRequest<{ scrim: ScrimDetail }>("/scrims", {
        method: "POST",
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
      if (data?.scrim) router.push(`/scrims/${data.scrim.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError && err.message === "scrims.dates_invalid"
          ? "Vérifiez l'ordre des horaires : inscription avant check-in, check-in terminé avant le début du scrim."
          : "Une erreur est survenue, réessayez."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="scrim-name">Nom du scrim</Label>
            <Input id="scrim-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={3} maxLength={80} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="scrim-description">Description (facultatif)</Label>
            <textarea
              id="scrim-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <fieldset className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Inscription
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reg-open">Ouverture</Label>
                <DateTimePicker id="reg-open" value={registrationOpensAt} onChange={setRegistrationOpensAt} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reg-close">Fermeture</Label>
                <DateTimePicker id="reg-close" value={registrationClosesAt} onChange={setRegistrationClosesAt} />
              </div>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Check-in
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="checkin-open">Ouverture</Label>
                <DateTimePicker id="checkin-open" value={checkinOpensAt} onChange={setCheckinOpensAt} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="checkin-close">Fermeture</Label>
                <DateTimePicker id="checkin-close" value={checkinClosesAt} onChange={setCheckinClosesAt} />
              </div>
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="scrim-start">Début du scrim</Label>
            <DateTimePicker id="scrim-start" value={startAt} onChange={setStartAt} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="teams-per-lobby">Équipes par lobby</Label>
              <Input
                id="teams-per-lobby"
                type="number"
                min={2}
                max={50}
                value={teamsPerLobby}
                onChange={(e) => setTeamsPerLobby(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lobby-max">Nombre de lobby max</Label>
              <Input
                id="lobby-max"
                type="number"
                min={1}
                max={50}
                value={lobbyMax}
                onChange={(e) => setLobbyMax(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Répartition dans les lobby</Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="radio" checked readOnly className="size-4 accent-primary" />
                Premier arrivé, premier servi
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="radio" disabled className="size-4" />
                Mélangé selon le scrim précédent
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">Bientôt disponible</span>
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-accent">{error}</p>}

          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Créer le scrim
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
