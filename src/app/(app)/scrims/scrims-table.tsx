"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, Plus, Search, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequestWithMeta } from "@/lib/api-client";

type Phase = "UPCOMING" | "REGISTRATION_OPEN" | "WAITING" | "CHECKIN_OPEN" | "CHECKIN_CLOSED" | "STARTED";

interface ScrimSummary {
  id: string;
  name: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  checkinOpensAt: string;
  checkinClosesAt: string;
  startAt: string;
  teamsPerLobby: number;
  lobbyMax: number;
  phase: Phase;
  registrationCount: number;
}

const PHASE_LABEL: Record<Phase, string> = {
  UPCOMING: "À venir",
  REGISTRATION_OPEN: "Inscriptions ouvertes",
  WAITING: "Inscriptions terminées",
  CHECKIN_OPEN: "Check-in en cours",
  CHECKIN_CLOSED: "Check-in terminé",
  STARTED: "Lancé",
};

const PHASE_VARIANT: Record<Phase, "default" | "muted" | "accent" | "outline"> = {
  UPCOMING: "muted",
  REGISTRATION_OPEN: "default",
  WAITING: "outline",
  CHECKIN_OPEN: "accent",
  CHECKIN_CLOSED: "outline",
  STARTED: "muted",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function ScrimsTable() {
  const router = useRouter();
  const [items, setItems] = useState<ScrimSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), perPage: "10" });
      if (search) params.set("search", search);
      apiRequestWithMeta<ScrimSummary[]>(`/scrims?${params}`)
        .then(({ data, meta }) => {
          setItems(data ?? []);
          setTotalPages(meta?.totalPages ?? 1);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [page, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un scrim..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="pl-9"
          />
        </div>
        <Button className="gap-1.5" onClick={() => router.push("/scrims/creer")}>
          <Plus className="size-4" />
          Créer un scrim
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Scrim</th>
                <th className="px-4 py-3 font-medium">Inscriptions</th>
                <th className="px-4 py-3 font-medium">Check-in</th>
                <th className="px-4 py-3 font-medium">Début</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Équipes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Aucun scrim pour le moment.
                  </td>
                </tr>
              ) : (
                items.map((scrim) => (
                  <tr
                    key={scrim.id}
                    onClick={() => router.push(`/scrims/${scrim.id}`)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{scrim.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(scrim.registrationOpensAt)} → {formatDate(scrim.registrationClosesAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(scrim.checkinOpensAt)} → {formatDate(scrim.checkinClosesAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(scrim.startAt)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={PHASE_VARIANT[scrim.phase]}>{PHASE_LABEL[scrim.phase]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" />
                        {scrim.registrationCount}
                      </span>
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
    </div>
  );
}
