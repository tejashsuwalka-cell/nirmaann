import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft, BedDouble, Box, Check, ClipboardCheck, DoorOpen, Eraser, Flower2, LayoutGrid, Loader2,
  MousePointer2, PencilRuler, RotateCw, Save, Sofa, SquareDashed, Tv, Trash2, Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { BlueprintCanvas, type Tool } from "@/components/nirmaan/BlueprintCanvas";
import { Scene3D } from "@/components/nirmaan/Scene3D";
import { AuditDrawer } from "@/components/nirmaan/AuditDrawer";
import { useAuth } from "@/hooks/useAuth";
import { getProject, saveProject } from "@/lib/projects";
import { emptyLayout, type Layout } from "@/lib/layout-types";
import { presetLayout } from "@/lib/geometry";
import { runAudit, type AuditResult } from "@/lib/audit";
import { MATERIAL_PRESETS, type MaterialPreset } from "@/lib/scene3d";

export const Route = createFileRoute("/editor/$projectId")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Blueprint Editor — NIRMAAN 2.0" },
    { name: "description", content: "Draft your floor plan in 2D and explore it in 3D." },
    { property: "og:title", content: "Blueprint Editor — NIRMAAN 2.0" },
    { property: "og:description", content: "Draft your floor plan in 2D and explore it in 3D." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Editor,
});

const TOOLS: { id: Tool; label: string; icon: typeof Sofa }[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "wall", label: "Wall", icon: SquareDashed },
  { id: "door", label: "Door", icon: DoorOpen },
  { id: "window", label: "Window", icon: LayoutGrid },
];
const DECOR: { id: Tool; label: string; icon: typeof Sofa }[] = [
  { id: "sofa", label: "Sofa", icon: Sofa },
  { id: "bed", label: "Bed", icon: BedDouble },
  { id: "plant", label: "Plant", icon: Flower2 },
  { id: "tv_unit", label: "TV Unit", icon: Tv },
];
const HINTS: Partial<Record<Tool, string>> = {
  select: "Click to select · drag furniture to move · R rotates · Delete removes",
  wall: "Click to start, click again to place each corner · Esc or right-click to stop",
  door: "Click on a wall to insert a door",
  window: "Click on a wall to insert a window",
};

function Editor() {
  const { projectId } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [layout, setLayout] = useState<Layout>(emptyLayout());
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [tool, setTool] = useState<Tool>("select");
  const [selected, setSelected] = useState<string | null>(null);
  const [preset, setPreset] = useState<MaterialPreset>("oak");
  const [autoRotate, setAutoRotate] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "dirty" | "error">("idle");
  const [audit, setAudit] = useState<AuditResult | null>(null);

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);
  useEffect(() => {
    if (!user) return;
    getProject(projectId).then((p) => {
      if (!p) { setNotFound(true); return; }
      setName(p.name);
      setLayout({ walls: p.walls ?? [], doors: p.doors ?? [], windows: p.windows ?? [], furniture: p.furniture ?? [] });
      setLoaded(true);
    }).catch(() => setNotFound(true));
  }, [user, projectId]);

  const update = useCallback((l: Layout) => { setLayout(l); setStatus("dirty"); }, []);

  const save = async () => {
    setStatus("saving");
    try { await saveProject(projectId, name.trim() || "Untitled Project", layout); setStatus("saved"); setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 2500); }
    catch { setStatus("error"); }
  };

  const selFurn = layout.furniture.find((f) => f.id === selected);
  const patchFurn = (patch: { rotation?: number; scale?: number }) =>
    update({ ...layout, furniture: layout.furniture.map((f) => (f.id === selected ? { ...f, ...patch } : f)) });
  const deleteSelected = useCallback(() => {
    if (!selected) return;
    update({
      walls: layout.walls.filter((w) => w.id !== selected),
      doors: layout.doors.filter((d) => d.id !== selected),
      windows: layout.windows.filter((w) => w.id !== selected),
      furniture: layout.furniture.filter((f) => f.id !== selected),
    });
    setSelected(null);
  }, [selected, layout, update]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteSelected(); }
      if ((e.key === "r" || e.key === "R") && selFurn) patchFurn({ rotation: (selFurn.rotation + 45) % 360 });
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  if (notFound) return (
    <div className="grid min-h-screen place-items-center bg-canvas p-4 text-center">
      <div className="glass rounded-3xl p-8"><h1 className="text-xl font-bold">Project not found</h1><Button variant="hero" className="mt-4" asChild><Link to="/dashboard">Back to Dashboard</Link></Button></div>
    </div>
  );
  if (!loaded) return <div className="grid min-h-screen place-items-center bg-canvas"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const toolBtn = (t: { id: Tool; label: string; icon: typeof Sofa }) => (
    <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
      className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold transition-all ${tool === t.id ? "bg-gradient-brand text-primary-foreground shadow-brand" : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"}`}>
      <t.icon className="h-4 w-4" />{t.label}
    </button>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 px-3 pt-3">
        <div className="glass flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2">
          <Button variant="ghost" size="icon" asChild aria-label="Back to Dashboard"><Link to="/dashboard"><ArrowLeft /></Link></Button>
          <input value={name} onChange={(e) => { setName(e.target.value); setStatus("dirty"); }}
            className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1 text-base font-bold text-foreground outline-none focus:bg-card sm:max-w-xs" />
          <span className="hidden text-xs font-semibold text-muted-foreground md:inline">
            {status === "saved" && <span className="flex items-center gap-1 text-success"><Check className="h-3.5 w-3.5" />Project saved!</span>}
            {status === "saving" && "Saving…"}
            {status === "dirty" && "Unsaved changes"}
            {status === "error" && <span className="text-destructive">Save failed</span>}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-xl bg-muted p-1">
              <button onClick={() => setMode("2d")} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${mode === "2d" ? "bg-card text-primary shadow-glass" : "text-muted-foreground"}`}><PencilRuler className="h-3.5 w-3.5" />2D Blueprint</button>
              <button onClick={() => setMode("3d")} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${mode === "3d" ? "bg-card text-primary shadow-glass" : "text-muted-foreground"}`}><Box className="h-3.5 w-3.5" />3D Perspective</button>
            </div>
            <Button variant="glass" onClick={save} disabled={status === "saving"}><Save />Save Layout</Button>
            <Button variant="hero" onClick={() => setAudit(runAudit(layout))}><ClipboardCheck />Run Audit</Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1200px] px-3 py-4">
        {mode === "2d" ? (
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="glass flex shrink-0 gap-1 overflow-x-auto rounded-2xl p-2 md:w-20 md:flex-col md:self-start">
              {TOOLS.map(toolBtn)}
              <div className="mx-1 my-1 border-l border-border md:border-l-0 md:border-t" />
              {DECOR.map(toolBtn)}
              <div className="mx-1 my-1 border-l border-border md:border-l-0 md:border-t" />
              <button onClick={() => { update(presetLayout()); setSelected(null); }} className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"><Wand2 className="h-4 w-4" />Preset</button>
              <button onClick={() => { if (confirm("Clear the whole canvas?")) { update(emptyLayout()); setSelected(null); } }} className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Eraser className="h-4 w-4" />Clear</button>
            </div>
            <div className="relative min-w-0 flex-1">
              <div className="glass rounded-3xl p-2">
                <BlueprintCanvas layout={layout} onChange={update} tool={tool} selectedId={selected} onSelect={setSelected} />
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">{HINTS[tool] ?? "Click on the grid to place the item"} · 1 grid square = 1 m</p>
              {selected && !selFurn && (
                <div className="glass absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl px-4 py-2">
                  <span className="text-xs font-bold text-foreground">Selected</span>
                  <Button variant="destructive" size="sm" onClick={deleteSelected}><Trash2 />Delete</Button>
                </div>
              )}
              {selFurn && (
                <div className="glass absolute bottom-10 left-1/2 flex w-[min(560px,92%)] -translate-x-1/2 flex-wrap items-center gap-4 rounded-2xl px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-primary">{selFurn.type.replace("_", " ")}</span>
                  <label className="flex min-w-36 flex-1 items-center gap-2 text-xs font-semibold text-muted-foreground">Rotate {selFurn.rotation}°
                    <Slider min={0} max={360} step={1} value={[selFurn.rotation]} onValueChange={([v]) => patchFurn({ rotation: v })} /></label>
                  <label className="flex min-w-36 flex-1 items-center gap-2 text-xs font-semibold text-muted-foreground">Scale {selFurn.scale.toFixed(1)}x
                    <Slider min={0.5} max={2.5} step={0.1} value={[selFurn.scale]} onValueChange={([v]) => patchFurn({ scale: v })} /></label>
                  <Button variant="secondary" size="sm" onClick={() => patchFurn({ rotation: (selFurn.rotation + 45) % 360 })}><RotateCw />+45°</Button>
                  <Button variant="destructive" size="sm" onClick={deleteSelected}><Trash2 />Delete</Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass relative overflow-hidden rounded-3xl">
            <Scene3D layout={layout} preset={preset} autoRotate={autoRotate} className="h-[calc(100vh-7.5rem)] min-h-[420px] w-full" />
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              {(Object.keys(MATERIAL_PRESETS) as MaterialPreset[]).map((k) => (
                <button key={k} onClick={() => setPreset(k)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${preset === k ? "bg-gradient-brand text-primary-foreground shadow-brand" : "glass text-muted-foreground hover:text-foreground"}`}>{MATERIAL_PRESETS[k].label}</button>
              ))}
            </div>
            <button onClick={() => setAutoRotate((a) => !a)} className="glass absolute right-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold text-foreground">{autoRotate ? "🔄 Orbiting" : "⏸️ Paused"}</button>
            <p className="glass absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs text-muted-foreground">Drag to orbit · scroll to zoom</p>
          </div>
        )}
      </main>
      <AuditDrawer result={audit} onClose={() => setAudit(null)} />
    </div>
  );
}
