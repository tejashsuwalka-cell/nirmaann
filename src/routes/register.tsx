import { HouseLoader } from "@/components/nirmaan/HouseLoader";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard, ErrorBanner, GoogleSignIn } from "@/components/nirmaan/AuthCard";
import { ALIVE_KEY, REMEMBER_KEY, useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [
    { title: "Create Account — NIRMAAN" },
    { name: "description", content: "Create your free NIRMAAN account and start drafting in 3D." },
    { property: "og:title", content: "Create Account — NIRMAAN" },
    { property: "og:description", content: "Create your free NIRMAAN account and start drafting in 3D." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) nav({ to: "/dashboard" }); }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (name.trim().length < 2) return setErr("Please enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Please enter a valid email address.");
    if (password.length < 6) return setErr("Password must be at least 6 characters.");
    setBusy(true);
    localStorage.setItem(REMEMBER_KEY, "1");
    sessionStorage.setItem(ALIVE_KEY, "1");
    try {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name.trim() }, emailRedirectTo: window.location.origin },
    });
    if (error) return setErr(error.message);
    if (data.session) nav({ to: "/dashboard" });
    else setInfo("Check your inbox to confirm your email, then sign in.");
    } catch { setErr("Could not connect. Please try again."); }
    finally { setBusy(false); }
  };

  return (
    <AuthCard title="Create your studio" subtitle="Start drafting blueprints and 3D rooms in seconds.">
      <GoogleSignIn />
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner msg={err} />
        {info && <div className="rounded-xl bg-success-soft px-3 py-2 text-sm font-medium text-success">{info}</div>}
        <div className="space-y-1.5"><Label htmlFor="name">Full name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl bg-card" /></div>
        <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl bg-card" /></div>
        <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl bg-card" /></div>
        <Button type="submit" variant="hero" className="h-11 w-full" disabled={busy}>{busy && <HouseLoader />}{busy ? "Creating account…" : "Create Account"}</Button>
        <p className="text-center text-sm text-muted-foreground">Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link></p>
      </form>
    </AuthCard>
  );
}
