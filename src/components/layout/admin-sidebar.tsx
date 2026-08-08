"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Shield,
  ShieldCheck,
  CalendarRange,
  Swords,
  Trophy,
  ArrowLeftRight,
  BarChart3,
  Megaphone,
  UserCog,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useAuth, type BackofficePermission } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: BackofficePermission;
  superAdminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Vue d'ensemble",
    items: [{ href: "/", label: "Tableau de bord", icon: LayoutDashboard }],
  },
  {
    title: "Communauté",
    items: [
      { href: "/utilisateurs", label: "Utilisateurs", icon: Users },
      { href: "/equipes", label: "Équipes", icon: Shield },
      { href: "/verifications", label: "Vérifications", icon: ShieldCheck, permission: "verifications" },
    ],
  },
  {
    title: "Compétition",
    items: [
      { href: "/saisons", label: "Saisons", icon: CalendarRange, permission: "saisons" },
      { href: "/scrims", label: "Scrims", icon: Swords, permission: "scrims" },
      { href: "/ligues", label: "Ligues & tournois", icon: Trophy, permission: "ligues" },
      { href: "/mercato", label: "Mercato", icon: ArrowLeftRight, permission: "mercato" },
    ],
  },
  {
    title: "Contenu",
    items: [
      { href: "/statistiques", label: "Statistiques & points", icon: BarChart3, permission: "statistiques" },
      { href: "/annonces", label: "Annonces", icon: Megaphone, permission: "annonces" },
    ],
  },
  {
    title: "Administration",
    items: [{ href: "/admins", label: "Comptes admin", icon: UserCog, superAdminOnly: true }],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, can } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((item) => {
            if (item.superAdminOnly) return user?.role === "SUPER_ADMIN";
            if (item.permission) return can(item.permission);
            return true;
          });
          if (items.length === 0) return null;

          return (
            <div key={section.title}>
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section.title}
              </p>
              <div className="space-y-1">
                {items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                        active && "bg-primary/10 text-primary"
                      )}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
