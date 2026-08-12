"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CalendarRange,
  Swords,
  Trophy,
  ArrowLeftRight,
  BarChart3,
  Megaphone,
  UserCog,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useAuth, type BackofficePermission } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import type { PendingCounts } from "./admin-shell";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: BackofficePermission;
  superAdminOnly?: boolean;
  countKey?: keyof PendingCounts;
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
      { href: "/verifications", label: "Vérifications", icon: ShieldCheck, permission: "verifications", countKey: "verifications" },
      { href: "/signalements", label: "Signalements", icon: ShieldAlert, permission: "signalements", countKey: "signalements" },
    ],
  },
  {
    title: "Compétition",
    items: [
      { href: "/saisons", label: "Saisons", icon: CalendarRange, permission: "saisons" },
      { href: "/scrims", label: "Scrims", icon: Swords, permission: "scrims" },
      { href: "/ligues", label: "Ligues & tournois", icon: Trophy, permission: "ligues" },
      { href: "/mercato", label: "Mercato", icon: ArrowLeftRight, permission: "mercato", countKey: "mercato" },
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

function SidebarNav({ onNavigate, counts }: { onNavigate?: () => void; counts: PendingCounts | null }) {
  const pathname = usePathname();
  const { user, can } = useAuth();

  return (
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
                const count = item.countKey ? counts?.[item.countKey] : undefined;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      active && "bg-primary/10 text-primary"
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="flex-1">{item.label}</span>
                    {!!count && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
                        {count > 9 ? "9+" : count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

interface AdminSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  counts: PendingCounts | null;
}

export function AdminSidebar({ mobileOpen, onMobileClose, counts }: AdminSidebarProps) {
  return (
    <>
      {/* Desktop — toujours visible */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo />
        </div>
        <SidebarNav counts={counts} />
      </aside>

      {/* Mobile — tiroir plein écran déclenché depuis la topbar */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={onMobileClose}
        />
        <div
          className={cn(
            "absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-xl transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-border px-5">
            <Logo />
            <button
              onClick={onMobileClose}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Fermer le menu"
            >
              <X className="size-4" />
            </button>
          </div>
          <SidebarNav onNavigate={onMobileClose} counts={counts} />
        </div>
      </div>
    </>
  );
}
