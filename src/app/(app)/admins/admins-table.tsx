"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiRequestWithMeta, apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { BackofficePermission } from "@/lib/auth-context";
import { BACKOFFICE_PERMISSIONS, PERMISSION_LABEL } from "@/constants/permissions";

interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  isActive: boolean;
  permissions: BackofficePermission[];
  createdAt: string;
  invitationExpiresAt: string | null;
}

export function AdminsTable() {
  const { user } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN") router.replace("/");
  }, [user, router]);

  function reload() {
    setLoading(true);
    apiRequestWithMeta<AdminUser[]>("/admin-users?perPage=50")
      .then(({ data }) => setItems(data ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  if (user && user.role !== "SUPER_ADMIN") return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setInviteOpen(true)}>
          <Plus className="size-4" />
          Inviter un administrateur
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Permissions</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Invité le</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    Aucun administrateur invité pour le moment.
                  </td>
                </tr>
              ) : (
                items.map((admin) => (
                  <tr
                    key={admin.id}
                    onClick={() => setSelected(admin)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{admin.displayName || "—"}</p>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {admin.permissions.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Aucune</span>
                        ) : (
                          admin.permissions.map((p) => (
                            <Badge key={p} variant="muted">
                              {PERMISSION_LABEL[p]}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={admin.isActive ? "default" : "accent"}>
                        {admin.isActive ? "Actif" : "Désactivé"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(admin.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} onInvited={reload} />
      <AdminDetailSheet
        admin={selected}
        onClose={() => setSelected(null)}
        onChanged={(updated) => {
          setItems((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
          setSelected((prev) => (prev ? { ...prev, ...updated } : prev));
        }}
      />
    </div>
  );
}

function InviteSheet({
  open,
  onClose,
  onInvited,
}: {
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState<BackofficePermission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function togglePermission(p: BackofficePermission) {
    setPermissions((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiRequest("/admin-users", { method: "POST", body: { email, permissions } });
      setEmail("");
      setPermissions([]);
      onInvited();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError && err.message === "users.email_taken"
          ? "Cet email est déjà utilisé."
          : "Une erreur est survenue, réessayez."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Inviter un administrateur">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-email">Email</Label>
          <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Permissions</Label>
          {BACKOFFICE_PERMISSIONS.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={permissions.includes(p)}
                onChange={() => togglePermission(p)}
                className="size-4 rounded border-border accent-primary"
              />
              {PERMISSION_LABEL[p]}
            </label>
          ))}
        </div>

        {error && <p className="text-sm text-accent">{error}</p>}

        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Envoyer l'invitation
        </Button>
      </form>
    </Sheet>
  );
}

function AdminDetailSheet({
  admin,
  onClose,
  onChanged,
}: {
  admin: AdminUser | null;
  onClose: () => void;
  onChanged: (updated: AdminUser) => void;
}) {
  const [permissions, setPermissions] = useState<BackofficePermission[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"reset" | "status" | null>(null);

  useEffect(() => {
    setPermissions(admin?.permissions ?? []);
    setNotice(null);
    setConfirmAction(null);
  }, [admin]);

  if (!admin) return <Sheet open={false} onClose={onClose} />;

  function togglePermission(p: BackofficePermission) {
    setPermissions((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function savePermissions() {
    if (!admin) return;
    setSavingPermissions(true);
    try {
      await apiRequest(`/admin-users/${admin.id}/permissions`, { method: "PATCH", body: { permissions } });
      onChanged({ ...admin, permissions });
      setNotice("Permissions mises à jour.");
    } finally {
      setSavingPermissions(false);
    }
  }

  async function resetPassword() {
    if (!admin) return;
    setResetting(true);
    try {
      await apiRequest(`/admin-users/${admin.id}/reset-password`, { method: "POST" });
      setNotice("Email de réinitialisation envoyé.");
    } finally {
      setResetting(false);
    }
  }

  async function toggleStatus() {
    if (!admin) return;
    setTogglingStatus(true);
    try {
      await apiRequest(`/admin-users/${admin.id}/status`, {
        method: "PATCH",
        body: { isActive: !admin.isActive },
      });
      onChanged({ ...admin, isActive: !admin.isActive });
    } finally {
      setTogglingStatus(false);
    }
  }

  return (
    <Sheet open={!!admin} onClose={onClose} title="Administrateur">
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-lg font-semibold text-foreground">{admin.displayName || "En attente d'activation"}</p>
          <p className="text-sm text-muted-foreground">{admin.email}</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Permissions</Label>
          {BACKOFFICE_PERMISSIONS.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={permissions.includes(p)}
                onChange={() => togglePermission(p)}
                className="size-4 rounded border-border accent-primary"
              />
              {PERMISSION_LABEL[p]}
            </label>
          ))}
          <Button size="sm" className="mt-1 w-fit" onClick={savePermissions} disabled={savingPermissions}>
            {savingPermissions && <Loader2 className="size-4 animate-spin" />}
            Enregistrer les permissions
          </Button>
        </div>

        {notice && <p className="text-sm text-primary">{notice}</p>}

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={() => setConfirmAction("reset")} disabled={resetting}>
            {resetting ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
            Réinitialiser le mot de passe
          </Button>
          <Button
            variant={admin.isActive ? "accent" : "default"}
            onClick={() => setConfirmAction("status")}
            disabled={togglingStatus}
          >
            {togglingStatus && <Loader2 className="size-4 animate-spin" />}
            {admin.isActive ? "Désactiver ce compte" : "Réactiver ce compte"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === "reset"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Réinitialiser le mot de passe ?"
        description={`Un email de réinitialisation sera envoyé à ${admin.email}.`}
        confirmLabel="Envoyer l'email"
        loading={resetting}
        onConfirm={async () => {
          await resetPassword();
          setConfirmAction(null);
        }}
      />

      <ConfirmDialog
        open={confirmAction === "status"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={admin.isActive ? "Désactiver ce compte admin ?" : "Réactiver ce compte admin ?"}
        description={
          admin.isActive
            ? `${admin.displayName || admin.email} n'aura plus accès au back-office tant que le compte n'est pas réactivé.`
            : `${admin.displayName || admin.email} pourra de nouveau se connecter au back-office.`
        }
        confirmLabel={admin.isActive ? "Désactiver" : "Réactiver"}
        variant={admin.isActive ? "accent" : "default"}
        loading={togglingStatus}
        onConfirm={async () => {
          await toggleStatus();
          setConfirmAction(null);
        }}
      />
    </Sheet>
  );
}
