import { useState, type ReactNode } from "react";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { lovable } from "@/integrations/lovable";
import { ALIVE_KEY, REMEMBER_KEY } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md border-t border-foreground py-8">
        <Logo />
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
export function ErrorBanner({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{msg}</div>;
}

export function LovableSignIn() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signIn = async () => {
    setBusy(true);
    setError(null);
    try {
      localStorage.setItem(REMEMBER_KEY, "1");
      sessionStorage.setItem(ALIVE_KEY, "1");
      const result = await lovable.auth.signInWithOAuth("lovable", {
        redirect_uri: `${window.location.origin}/login`,
      });
      if (result.error) setError(result.error.message || "Unable to sign in with Lovable. Please try again.");
    } catch {
      setError("Unable to sign in with Lovable. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return <div className="mb-6 space-y-3">
    <Button type="button" variant="outline" className="h-11 w-full" onClick={signIn} disabled={busy}>
      <LovableMark />{busy ? "Connecting…" : "Continue with Lovable"}
    </Button>
    <ErrorBanner msg={error} />
  </div>;
}
