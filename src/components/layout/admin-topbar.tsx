"use client";

import { LogOut, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
};

export function AdminTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-5 backdrop-blur">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Ouvrir le menu"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="size-5" />
        </Button>
        <div>
          <p className="text-sm font-semibold text-foreground">Back-office</p>
          <p className="text-xs text-muted-foreground">FF Madagascar E-Sport</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm text-foreground">{user.displayName || user.email}</span>
            <Badge variant={user.role === "SUPER_ADMIN" ? "default" : "muted"}>
              {ROLE_LABEL[user.role] ?? user.role}
            </Badge>
          </div>
        )}
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label="Se déconnecter" onClick={() => logout()}>
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
