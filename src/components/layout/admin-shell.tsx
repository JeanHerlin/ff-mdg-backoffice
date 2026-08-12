"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { apiRequest } from "@/lib/api-client";

export interface PendingCounts {
  verifications: number;
  signalements: number;
  mercato: number;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [counts, setCounts] = useState<PendingCounts | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const loadCounts = useCallback(() => {
    apiRequest<PendingCounts>("/admin/pending-counts").then((data) => data && setCounts(data));
  }, []);

  // Rafraîchi à la navigation (après traitement d'un élément) et quand
  // l'admin revient sur l'onglet — pas de polling, juste rester à jour sans
  // effort superflu.
  useEffect(loadCounts, [loadCounts, pathname]);
  useEffect(() => {
    window.addEventListener("focus", loadCounts);
    return () => window.removeEventListener("focus", loadCounts);
  }, [loadCounts]);

  return (
    <div className="flex h-full">
      <AdminSidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  );
}
