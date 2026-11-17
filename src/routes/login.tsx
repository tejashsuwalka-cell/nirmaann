import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard, ErrorBanner, LovableSignIn } from "@/components/nirmaan/AuthCard";
import { ALIVE_KEY, REMEMBER_KEY, useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Sign In — NIRMAAN" },
    { name: "description", content: "Sign in to your NIRMAAN architecture studio." },
    { property: "og:title", content: "Sign In — NIRMAAN" },
    { property: "og:description", content: "Sign in to your NIRMAAN architecture studio." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) nav({ to: "/dashboard" }); }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Please enter a valid email address.");
    if (password.length < 6) return setErr("Password must be at least 6 characters.");
    setBusy(true);
    localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
    sessionStorage.setItem(ALIVE_KEY, "1");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setErr(error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message);
    nav({ to: "/dashboard" });
  };

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to continue drafting your projects.">
      <LovableSignIn />
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner msg={err} />
        <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl bg-card" /></div>
        <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl bg-card" /></div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-primary" /> Remember me</label>
        <Button type="submit" variant="hero" className="h-11 w-full" disabled={busy}>{busy ? "Signing in…" : "Sign In"}</Button>
        <p className="text-center text-sm text-muted-foreground">New here? <Link to="/register" className="font-semibold text-primary hover:underline">Create an account</Link></p>
      </form>
    </AuthCard>
  );
}
