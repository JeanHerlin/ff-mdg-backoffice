"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { apiRequest, ApiError, setAccessToken } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <Logo />
      <Card className="w-full max-w-sm">{children}</Card>
    </div>
  );
}

export function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const token = searchParams.get("token");

  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <Shell>
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
            <XCircle className="size-6" />
          </div>
          <CardTitle>Lien invalide</CardTitle>
          <CardDescription>Demandez à un super administrateur de vous renvoyer une invitation.</CardDescription>
        </CardHeader>
      </Shell>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (displayName.trim().length < 2) {
      setError("Indiquez un nom affiché.");
      return;
    }
    if (password.length < 8) {
      setError("8 caractères minimum.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiRequest<{ accessToken: string }>("/admin-users/accept-invite", {
        method: "POST",
        body: { token, displayName: displayName.trim(), password },
      });
      if (data) {
        setAccessToken(data.accessToken);
        await refreshUser();
        router.push("/");
      }
    } catch (err) {
      setError(
        err instanceof ApiError && err.message === "auth.invalid_or_expired_token"
          ? "Cette invitation est invalide ou a expiré."
          : "Une erreur est survenue, réessayez."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell>
      <CardHeader>
        <CardTitle>Configurer votre compte admin</CardTitle>
        <CardDescription>Choisissez votre nom affiché et votre mot de passe.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">Nom affiché</Label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="passwordConfirmation">Confirmer le mot de passe</Label>
            <Input
              id="passwordConfirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-accent">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Activer mon compte
          </Button>
        </form>
      </CardContent>
    </Shell>
  );
}
