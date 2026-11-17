import { useState, type ReactNode } from "react";
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

export function GoogleSignIn() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signIn = async () => {
    setBusy(true);
    setError(null);
    try {
      localStorage.setItem(REMEMBER_KEY, "1");
      sessionStorage.setItem(ALIVE_KEY, "1");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/login`,
      });
      if (result.error) setError(result.error.message || "Unable to sign in with Google. Please try again.");
    } catch {
      setError("Unable to sign in with Google. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return <div className="mb-6 space-y-3">
    <Button type="button" variant="outline" className="google-sign-in h-11 w-full gap-2.5 px-3 font-medium" onClick={signIn} disabled={busy}>
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-[18px] shrink-0"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>{busy ? "Connecting…" : "Continue with Google"}
    </Button>
    <ErrorBanner msg={error} />
  </div>;
}
