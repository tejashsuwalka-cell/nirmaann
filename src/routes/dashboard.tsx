import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DoorOpen, LayoutGrid, LogOut, Plus, Sofa, SquareDashed, Trash2, ArrowRight, Ruler } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/nirmaan/Logo";
import { displayName, useAuth } from "@/hooks/useAuth";
import { listProjects } from "@/lib/projects";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Your Projects — NIRMAAN 2.0" },
    { name: "description", content: "Manage your NIRMAAN 2.0 architecture projects." },
    { property: "og:title", content: "Your Projects — NIRMAAN 2.0" },
    { property: "og:description", content: "Manage your NIRMAAN 2.0 architecture projects." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);

  const { data: projects, isLoading } = useQuery({ queryKey: ["projects", user?.id], queryFn: listProjects, enabled: !!user });

  const create = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("projects").insert({ name: name || "Untitled Project", owner_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { setTitle(""); qc.invalidateQueries({ queryKey: ["projects"] }); },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("projects").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  if (!user) return <div className="min-h-screen bg-canvas" />;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="px-4 pt-4">
        <div className="glass mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">Logged in as <b className="text-foreground">{displayName(user)}</b></span>
            <Button variant="ghost" onClick={async () => { await signOut(); nav({ to: "/" }); }}><LogOut /> Sign Out</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Your Projects</h1>
            <p className="mt-1 text-muted-foreground">Draft, visualise and audit your floor plans.</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); create.mutate(title.trim()); }} className="glass flex w-full gap-2 rounded-2xl p-2 sm:w-auto">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New project title..." className="h-10 rounded-xl border-0 bg-transparent shadow-none sm:w-64" />
            <Button type="submit" variant="hero" className="h-10" disabled={create.isPending}><Plus /> Create Project</Button>
          </form>
        </div>

        {isLoading ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="glass h-48 animate-pulse rounded-3xl" />)}</div>
        ) : !projects?.length ? (
          <div className="glass mt-10 flex flex-col items-center rounded-3xl px-6 py-16 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-secondary text-primary"><Ruler className="h-9 w-9" /></div>
            <h2 className="mt-5 text-xl font-bold text-foreground">No projects yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">Create your first floor plan and watch it rise into 3D.</p>
            <Button variant="hero" className="mt-6" onClick={() => create.mutate("My First Residence")}><Plus /> Create First Project</Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <article key={p.id} className="glass flex flex-col rounded-3xl p-5 transition-transform hover:-translate-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-foreground">{p.name}</h3>
                    <span className="mt-1 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-secondary-foreground">{p.type}</span>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Delete project" className="text-muted-foreground hover:text-destructive"
                    onClick={() => { if (confirm(`Delete "${p.name}"? This cannot be undone.`)) remove.mutate(p.id); }}><Trash2 /></Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5 text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1"><SquareDashed className="h-3.5 w-3.5" />{p.walls.length} Walls</span>
                  <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1"><DoorOpen className="h-3.5 w-3.5" />{p.doors.length} Doors</span>
                  <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1"><LayoutGrid className="h-3.5 w-3.5" />{p.windows.length} Windows</span>
                  <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1"><Sofa className="h-3.5 w-3.5" />{p.furniture.length} Decor</span>
                </div>
                <div className="mt-auto flex items-center justify-between pt-5">
                  <span className="text-xs text-muted-foreground">Updated {new Date(p.updated_at).toLocaleDateString()}</span>
                  <Button variant="hero" size="sm" asChild><Link to="/editor/$projectId" params={{ projectId: p.id }}>Open Editor <ArrowRight /></Link></Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
