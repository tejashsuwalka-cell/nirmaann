import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, BedDouble, Box, Check, ClipboardCheck, DoorOpen, Eraser, Flower2, LayoutGrid, Loader2, MousePointer2, PencilRuler, RotateCw, Save, Sofa, SquareDashed, Tv, Trash2, Wand2, Undo2, Redo2, Hand, Minus, Plus, Scan, Magnet, Download, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BlueprintCanvas, type Tool } from "@/components/nirmaan/BlueprintCanvas";
import { Scene3D } from "@/components/nirmaan/Scene3D";
import { AuditDrawer } from "@/components/nirmaan/AuditDrawer";
import { useAuth } from "@/hooks/useAuth";
import { useLayoutHistory } from "@/hooks/useLayoutHistory";
import { getProject, saveProject } from "@/lib/projects";
import { emptyLayout, type Layout } from "@/lib/layout-types";
import { presetLayout, GRID_SIZE } from "@/lib/geometry";
import { editWall, openingPosition, removeItem } from "@/lib/editing";
import { runAudit, type AuditResult } from "@/lib/audit";
import { MATERIAL_PRESETS, type MaterialPreset } from "@/lib/scene3d";
import { toast } from "sonner";

export const Route = createFileRoute("/editor/$projectId")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Blueprint Editor — NIRMAAN" },
    { name: "description", content: "Draft your floor plan in 2D and explore it in 3D." },
    { property: "og:title", content: "Blueprint Editor — NIRMAAN" },
    { property: "og:description", content: "Draft your floor plan in 2D and explore it in 3D." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Editor,
});

const TOOLS: { id: Tool; label: string; icon: typeof Sofa }[] = [
  { id: "select", label: "Select", icon: MousePointer2 }, { id: "pan", label: "Pan", icon: Hand },
  { id: "wall", label: "Wall", icon: SquareDashed }, { id: "door", label: "Door", icon: DoorOpen },
  { id: "window", label: "Window", icon: LayoutGrid }, { id: "sofa", label: "Sofa", icon: Sofa },
  { id: "bed", label: "Bed", icon: BedDouble }, { id: "plant", label: "Plant", icon: Flower2 }, { id: "tv_unit", label: "TV unit", icon: Tv },
];

function Editor() {
  const { projectId } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const history = useLayoutHistory();
  const { layout } = history;
  const [name, setName] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [tool, setTool] = useState<Tool>("select");
  const [selected, setSelected] = useState<string | null>(null);
  const [preset, setPreset] = useState<MaterialPreset>("oak");
  const [autoRotate, setAutoRotate] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const userId = user?.id;
  const [viewRevision, setViewRevision] = useState(0);
  const [retry, setRetry] = useState(0);
  const latest = useRef({ name, layout }); latest.current = { name, layout };
  const dirty = loaded && JSON.stringify({ name, layout }) !== saved;

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);
  useEffect(() => {
    if (!userId) return;
    let active = true; setLoadError(null); setLoaded(false);
    getProject(projectId).then(p => {
      if (!active) return;
      if (!p) { setLoadError("Project not found"); return; }
      const value = { walls: p.walls ?? [], doors: p.doors ?? [], windows: p.windows ?? [], furniture: p.furniture ?? [] };
      setName(p.name); history.reset(value); setSaved(JSON.stringify({ name: p.name, layout: value })); setLoaded(true);
    }).catch(() => { if (active) setLoadError("Could not load this project"); });
    return () => { active = false; };
  }, [userId, projectId, retry, history.reset]);

  const update = history.update;
  const save = useCallback(async () => {
    if (saving) return;
    const snapshot = latest.current; setSaving(true);
    const cleanName = snapshot.name.trim() || "Untitled Project";
    try {
      await saveProject(projectId, cleanName, snapshot.layout);
      if (latest.current.name === snapshot.name) setName(cleanName);
      setSaved(JSON.stringify({ name: cleanName, layout: snapshot.layout })); toast.success("Project saved");
    } catch { toast.error("Could not save. Your changes are still here; please try again."); }
    finally { setSaving(false); }
  }, [projectId, saving]);
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", leave); return () => window.removeEventListener("beforeunload", leave);
  }, [dirty]);
  const selWall = layout.walls.find(w => w.id === selected);
  const selFurn = layout.furniture.find(f => f.id === selected);
  const selOpening = [...layout.doors, ...layout.windows].find(o => o.id === selected);
  const selDoor = layout.doors.find(d => d.id === selected);
  const selWindow = layout.windows.find(w => w.id === selected);
  const deleteSelected = useCallback(() => { if (selected) { update(removeItem(layout, selected)); setSelected(null); } }, [selected, layout, update]);
  const back = useCallback(() => { history.back(); setSelected(null); setTool("select"); }, [history.back]);
  const forward = useCallback(() => { history.forward(); setSelected(null); setTool("select"); }, [history.forward]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input,textarea,select,[contenteditable=true]")) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? forward() : back(); return; }
      if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); forward(); return; }
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); save(); return; }
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteSelected(); }
      if (e.key === "Escape") { setSelected(null); setTool("select"); }
      if (e.key.toLowerCase() === "r" && selFurn) update({ ...layout, furniture: layout.furniture.map(f => f.id === selected ? { ...f, rotation: (f.rotation + 45) % 360 } : f) });
      if (!mod && e.key.toLowerCase() === "v") setTool("select");
      if (!mod && e.key.toLowerCase() === "w") setTool("wall");
      if (!mod && e.key.toLowerCase() === "h") setTool("pan");
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [back, forward, save, deleteSelected, selFurn, layout, selected, update]);
  const resizeOpening = (width: number) => {
    if (!selOpening) return;
    const position = openingPosition(layout, selOpening.x, selOpening.y, width, selOpening.id, selOpening.wallId);
    if (!position) { toast.error("This opening would overlap another or exceed the wall."); return; }
    update({ ...layout, doors: layout.doors.map(d => d.id === selected ? { ...d, ...position, width } : d), windows: layout.windows.map(w => w.id === selected ? { ...w, ...position, width } : w) });
  };
  const exportImage = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('canvas[aria-label="Floor plan canvas"]');
    if (!canvas) return;
    const a = document.createElement("a"); a.download = `${name || "floor-plan"}.png`; a.href = canvas.toDataURL("image/png"); a.click();
  };
  if (loadError) return <div className="grid min-h-screen place-items-center"><div className="space-y-5 text-center"><h1 className="text-2xl">{loadError}</h1><Button onClick={() => setRetry(r => r + 1)}>Retry</Button><Button variant="outline" asChild><Link to="/dashboard">Your projects</Link></Button></div></div>;
  if (!loaded) return <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-primary" aria-label="Loading project" /></div>;

  const selectedLabel = selWall ? "Wall" : selDoor ? "Door" : selWindow ? "Window" : selFurn ? selFurn.type.replace("_", " ") : "Project";
  return <div className="editor-shell bg-background">
    <header className="studio-header flex flex-wrap items-center gap-2 px-3 py-3">
      <Button variant="ghost" size="icon" aria-label="Back to Dashboard" onClick={() => { if (!dirty || confirm("Leave without saving your changes?")) nav({ to: "/dashboard" }); }}><ArrowLeft /></Button>
      <Input aria-label="Project name" value={name} onChange={e => setName(e.target.value)} className="w-40 flex-1 border-0 bg-transparent font-medium shadow-none sm:max-w-64" />
      <span className="text-xs text-muted-foreground">{saving ? "Saving…" : dirty ? "Unsaved" : <span className="flex items-center gap-1"><Check className="size-3 text-success" />Saved</span>}</span>
      <div className="ml-auto flex gap-1">
        <Button variant="ghost" size="icon" title="Undo (Ctrl/⌘ Z)" aria-label="Undo" disabled={!history.canUndo} onClick={back}><Undo2 /></Button>
        <Button variant="ghost" size="icon" title="Redo (Ctrl/⌘ Shift Z)" aria-label="Redo" disabled={!history.canRedo} onClick={forward}><Redo2 /></Button>
        <Button variant="outline" onClick={save} disabled={saving} aria-label="Save layout"><Save /><span className="hidden sm:inline">Save</span></Button>
        <Button onClick={() => setAudit(runAudit(layout))}><ClipboardCheck />Audit</Button>
      </div>
    </header>
    <div className="studio-header flex flex-wrap items-center justify-between gap-2 px-4 py-2">
      <div className="flex gap-1"><Button size="sm" variant={mode === "2d" ? "secondary" : "ghost"} aria-pressed={mode === "2d"} onClick={() => setMode("2d")}><PencilRuler />2D Blueprint</Button><Button size="sm" variant={mode === "3d" ? "secondary" : "ghost"} aria-pressed={mode === "3d"} onClick={() => setMode("3d")}><Box />3D Perspective</Button></div>
      <div className="flex items-center gap-1">{mode === "2d" && <><Button size="icon" variant="ghost" title="Grid snapping" aria-label="Grid snapping" aria-pressed={snapEnabled} className={snapEnabled ? "text-primary" : "text-muted-foreground"} onClick={() => setSnapEnabled(s => !s)}><Magnet /></Button><Button size="icon" variant="ghost" aria-label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}><Minus /></Button><span className="w-12 text-center font-mono text-xs">{Math.round(zoom * 100)}%</span><Button size="icon" variant="ghost" aria-label="Zoom in" disabled={zoom >= 3} onClick={() => setZoom(z => Math.min(3, z + 0.25))}><Plus /></Button><Button size="icon" variant="ghost" aria-label="Reset view" title="Reset view" onClick={() => { setZoom(1); setViewRevision(v => v + 1); }}><Scan /></Button><Button size="icon" variant="ghost" aria-label="Export PNG" title="Export PNG" onClick={exportImage}><Download /></Button></>}</div>
    </div>
    <main className="editor-grid">
      <nav className="editor-tools gap-1 p-1.5" aria-label="Drawing tools">
        {TOOLS.map(t => <Button key={t.id} variant={tool === t.id ? "secondary" : "ghost"} disabled={mode !== "2d"} aria-label={t.label} aria-pressed={tool === t.id} title={t.label} className="h-14 w-12 shrink-0 flex-col gap-1 px-0 text-[10px]" onClick={() => { setTool(t.id); setSelected(null); }}><t.icon />{t.label}</Button>)}
        <Button variant="ghost" title="Load sample room" aria-label="Preset" className="h-14 w-12 shrink-0 flex-col gap-1 px-0 text-[10px]" onClick={() => { if (!layout.walls.length || confirm("Replace this layout with the sample room? You can undo this.")) { update(presetLayout()); setSelected(null); } }}><Wand2 />Preset</Button>
        <Button variant="ghost" title="Clear layout" aria-label="Clear" className="h-14 w-12 shrink-0 flex-col gap-1 px-0 text-[10px] text-destructive" onClick={() => { if (confirm("Clear this layout? You can undo this.")) { update(emptyLayout()); setSelected(null); } }}><Eraser />Clear</Button>
      </nav>
      <section className="editor-stage relative min-w-0">
        {mode === "2d" ? <div className="p-2 sm:p-6"><BlueprintCanvas key={viewRevision} layout={layout} onChange={update} tool={tool} selectedId={selected} onSelect={setSelected} zoom={zoom} onZoom={setZoom} snapEnabled={snapEnabled} onNotice={toast.error} /><div className="mt-3 flex justify-between border-t border-border pt-3 font-mono text-[10px] text-muted-foreground"><span>PLAN / 01</span><span>1 GRID = 1 m</span><span>N ↑</span></div></div> : <><Scene3D layout={layout} preset={preset} autoRotate={autoRotate} className="h-[70dvh] min-h-[380px] w-full" /><Button className="absolute bottom-4 right-4" variant="outline" onClick={() => setAutoRotate(a => !a)} aria-label={autoRotate ? "Pause orbit" : "Start orbit"}>{autoRotate ? <Pause /> : <Play />}{autoRotate ? "Pause" : "Orbit"}</Button></>}
      </section>
      <aside className="studio-panel space-y-5 p-5">
        <div className="flex items-center justify-between"><h2 className="text-lg capitalize">{selectedLabel}</h2><span className="font-mono text-[10px] text-muted-foreground">{selected ? "PROPERTIES" : "OVERVIEW"}</span></div>
        {mode === "3d" ? <div className="space-y-2"><h3 className="text-xs text-muted-foreground">Wall finish</h3>{(Object.keys(MATERIAL_PRESETS) as MaterialPreset[]).map(k => <Button key={k} variant={preset === k ? "secondary" : "outline"} className="w-full justify-start" onClick={() => setPreset(k)}>{MATERIAL_PRESETS[k].label}</Button>)}</div> : <>
          {selWall && <>
            <NumberField label="Length (m)" value={Math.hypot(selWall.x2-selWall.x1,selWall.y2-selWall.y1)/GRID_SIZE} min={0.25} max={36} onChange={v => { const a = Math.atan2(selWall.y2-selWall.y1,selWall.x2-selWall.x1); update(editWall(layout, selWall.id, { x2: selWall.x1+Math.cos(a)*v*GRID_SIZE, y2: selWall.y1+Math.sin(a)*v*GRID_SIZE })); }} />
            <NumberField label="Thickness (m)" value={selWall.thickness/GRID_SIZE} min={0.1} max={1} onChange={v => update(editWall(layout,selWall.id,{thickness:v*GRID_SIZE}))} />
            <NumberField label="Height (m)" value={(selWall.height ?? 56)/GRID_SIZE} min={2.3} max={6} onChange={v => update(editWall(layout,selWall.id,{height:v*GRID_SIZE}))} />
          </>}
          {selOpening && <NumberField label="Width (m)" value={selOpening.width/GRID_SIZE} min={0.5} max={6} onChange={v => resizeOpening(v*GRID_SIZE)} />}
          {selWindow && <><NumberField label="Window height (m)" value={(selWindow.height ?? 26)/GRID_SIZE} min={0.2} max={2} onChange={v => update({ ...layout, windows: layout.windows.map(w => w.id === selected ? { ...w, height: v*GRID_SIZE } : w) })} /><NumberField label="Sill height (m)" value={(selWindow.sillHeight ?? 18)/GRID_SIZE} min={0.1} max={1.5} onChange={v => update({ ...layout, windows: layout.windows.map(w => w.id === selected ? { ...w, sillHeight: v*GRID_SIZE } : w) })} /></>}
          {selDoor && <Button variant="outline" className="w-full" onClick={() => update({ ...layout, doors: layout.doors.map(d => d.id === selected ? { ...d, swing: d.swing === "right" ? "left" : "right" } : d) })}><RotateCw />Flip swing</Button>}
          {selFurn && <><NumberField label="Rotation (°)" value={selFurn.rotation} min={0} max={360} step={15} onChange={v => update({ ...layout, furniture: layout.furniture.map(f => f.id === selected ? { ...f, rotation: v } : f) })} /><NumberField label="Scale" value={selFurn.scale} min={0.5} max={4} onChange={v => update({ ...layout, furniture: layout.furniture.map(f => f.id === selected ? { ...f, scale: v } : f) })} /></>}
          {selected && <Button variant="outline" className="w-full text-destructive" onClick={deleteSelected}><Trash2 />Delete {selectedLabel}</Button>}
        </>}
        <dl className="space-y-3 border-t border-border pt-5 text-sm">{[["Walls",layout.walls.length],["Doors",layout.doors.length],["Windows",layout.windows.length],["Furniture",layout.furniture.length]].map(([label,count]) => <div key={label} className="flex justify-between"><dt className="text-muted-foreground">{label}</dt><dd className="font-mono">{count}</dd></div>)}</dl>
      </aside>
    </main>
    <AuditDrawer result={audit} onClose={() => setAudit(null)} />
  </div>;
}

function NumberField({ label, value, min, max, step = 0.1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState(value.toFixed(2));
  useEffect(() => setDraft(value.toFixed(2)), [value]);
  const apply = () => { const n = Number(draft); if (draft.trim() && Number.isFinite(n)) onChange(Math.max(min, Math.min(max,n))); else setDraft(value.toFixed(2)); };
  return <label className="block space-y-2 text-xs text-muted-foreground"><span>{label}</span><Input aria-label={label} className="font-mono text-foreground" type="number" min={min} max={max} step={step} value={draft} onChange={e => setDraft(e.target.value)} onBlur={apply} onKeyDown={e => { if(e.key === "Enter") e.currentTarget.blur(); }} /></label>;
}
