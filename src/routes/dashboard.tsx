import { HouseLoader } from "@/components/nirmaan/HouseLoader";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BlueprintCanvas } from "@/components/nirmaan/BlueprintCanvas";
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
    { title: "Your Projects — NIRMAAN" },
    { name: "description", content: "Manage your NIRMAAN architecture projects." },
    { property: "og:title", content: "Your Projects — NIRMAAN" },
    { property: "og:description", content: "Manage your NIRMAAN architecture projects." },
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
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => { if (!loading && !user && !signingOut) nav({ to: "/login" }); }, [loading, user, nav, signingOut]);

  const { data: projects, isLoading, error: queryError, refetch } = useQuery({ queryKey: ["projects", user?.id], queryFn: listProjects, enabled: !!user });

  const create = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Please sign in first");
      const { data, error } = await supabase.from("projects").insert({ name: name || "Untitled Project", owner_id: user.id }).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => { setTitle(""); qc.invalidateQueries({ queryKey: ["projects"] }); nav({ to: "/editor/$projectId", params: { projectId: id } }); },
    onError: () => toast.error("Could not create your project. Please try again."),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("projects").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project deleted"); },
    onError: () => toast.error("Could not delete your project. Please try again."),
  });

  if (!user) return <div className="min-h-screen bg-canvas" />;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="studio-header px-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-1 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">Logged in as <b className="text-foreground">{displayName(user)}</b></span>
            <Button variant="ghost" disabled={signingOut} onClick={async () => { setSigningOut(true); try { await signOut(); nav({ to: "/" }); } catch { setSigningOut(false); toast.error("Could not sign out. Please try again."); } }}><LogOut /> Sign Out</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-5xl text-foreground">Your Projects</h1>
            <p className="mt-2 font-mono text-xs text-muted-foreground">STUDIO / PROJECT ARCHIVE</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); create.mutate(title.trim()); }} className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="New project title" placeholder="Project name" className="h-10 min-w-0 flex-1 bg-popover sm:w-56" />
            <Button type="submit" variant="hero" className="h-10" disabled={create.isPending}><Plus /> Create Project</Button>
          </form>
        </div>

        {queryError ? <div role="alert" className="mt-10 space-y-4"><p>Could not load your projects.</p><Button variant="outline" onClick={() => refetch()}>Retry</Button></div> : isLoading ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="soft-pulse grid h-64 place-items-center rounded-md bg-muted text-primary">{i === 0 && <HouseLoader className="size-8" label="Loading projects" />}</div>)}</div>
        ) : !projects?.length ? (
          <div className="mt-10 flex flex-col items-center border-y border-border px-6 py-16 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-secondary text-primary"><Ruler className="h-9 w-9" /></div>
            <h2 className="mt-5 text-xl font-bold text-foreground">No projects yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">Create your first floor plan and watch it rise into 3D.</p>
            <Button variant="hero" className="mt-6" onClick={() => create.mutate("My First Residence")}><Plus /> Create First Project</Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <article key={p.id} className="studio-surface group flex flex-col overflow-hidden rounded-md transition-shadow hover:shadow-glass">
                <Link to="/editor/$projectId" params={{ projectId: p.id }} aria-label={`Open ${p.name}`} className="pointer-events-auto block border-b border-border">
                  <div className="pointer-events-none"><BlueprintCanvas layout={p} tool="select" selectedId={null} onSelect={() => {}} onChange={() => {}} zoom={1} onZoom={() => {}} snapEnabled onNotice={() => {}} /></div>
                </Link>
                <div className="flex items-start justify-between gap-3 px-5 pt-5">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-foreground">{p.name}</h3>
                    <span className="mt-1 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-secondary-foreground">{p.type}</span>
                  </div>
                  <Button variant="ghost" size="icon" aria-label={`Delete ${p.name}`} disabled={remove.isPending} className="text-muted-foreground hover:text-destructive"
                    onClick={() => { if (confirm(`Delete "${p.name}"? This cannot be undone.`)) remove.mutate(p.id); }}><Trash2 /></Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5 px-5 text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1"><SquareDashed className="h-3.5 w-3.5" />{p.walls.length} Walls</span>
                  <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1"><DoorOpen className="h-3.5 w-3.5" />{p.doors.length} Doors</span>
                  <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1"><LayoutGrid className="h-3.5 w-3.5" />{p.windows.length} Windows</span>
                  <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1"><Sofa className="h-3.5 w-3.5" />{p.furniture.length} Decor</span>
                </div>
                <div className="mt-auto flex items-center justify-between p-5">
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
