import { Users, ShieldCheck, Swords, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATS = [
  { label: "Utilisateurs inscrits", value: "—", icon: Users },
  { label: "Équipes en attente", value: "—", icon: ShieldCheck },
  { label: "Scrims actifs", value: "—", icon: Swords },
  { label: "Ligues en cours", value: "—", icon: Trophy },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          Vue d&apos;ensemble de la plateforme — les données s&apos;activeront module par module.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="glass-card">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-xl font-bold leading-none text-foreground">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Badge variant="muted" className="w-fit">Socle en place</Badge>
          <CardTitle>Prochain module : Gestion de compte</CardTitle>
          <CardDescription>
            Inscription, vérification email (Resend), connexion et gestion des identifiants seront branchés
            ici — cette page se remplira au fil des modules livrés.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
