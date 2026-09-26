"use client";

import { useEffect, useState } from "react";
import { Users, ShieldCheck, Swords, Trophy, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/api-client";

interface Overview {
  totalUsers: number;
  pendingTeams: number;
  activeScrims: number;
  activeTournaments: number;
}

export function DashboardOverview() {
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    apiRequest<Overview>("/dashboard/overview").then((d) => setOverview(d ?? null));
  }, []);

  const stats = [
    { label: "Utilisateurs inscrits", value: overview?.totalUsers, icon: Users },
    { label: "Équipes en attente", value: overview?.pendingTeams, icon: ShieldCheck },
    { label: "Scrims actifs", value: overview?.activeScrims, icon: Swords },
    { label: "Ligues en cours", value: overview?.activeTournaments, icon: Trophy },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <Card key={label} className="glass-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none text-foreground">
                {value === undefined ? <Loader2 className="size-4 animate-spin" /> : value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
