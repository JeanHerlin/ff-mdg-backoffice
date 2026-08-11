import { AdminShell } from "@/components/layout/admin-shell";
import { AuthGuard } from "@/components/auth-guard";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthGuard>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
