import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HouseLoader, LoadingStatus, PageLoader } from "@/components/nirmaan/HouseLoader";
import { ArrowLeft, BedDouble, Box, Check, ClipboardCheck, DoorOpen, Eraser, Flower2, LayoutGrid, MousePointer2, PencilRuler, RotateCw, Save, Sofa, SquareDashed, Tv, Trash2, Wand2, Undo2, Redo2, Hand, Minus, Plus, Scan, Magnet, Download, Pause, Play, Columns2, Upload, FileDown, Layers } from "lucide-react";
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
import { FLOOR_PRESETS, MATERIAL_PRESETS, type FloorPreset, type MaterialPreset } from "@/lib/scene3d";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { floorName, planToLayout, type Floor } from "@/lib/floors";
import { blueprintSvg } from "@/lib/blueprint-export";
import { scanBlueprint } from "@/lib/blueprint-scan.functions";

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
  const [mode, setMode] = useState<"2d" | "3d" | "split">("2d");
  const [tool, setTool] = useState<Tool>("select");
  const [selected, setSelected] = useState<string | null>(null);
  const [preset, setPreset] = useState<MaterialPreset>("oak");
  const [floorPreset, setFloorPreset] = useState<FloorPreset>("oak");
  const [autoRotate, setAutoRotate] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const userId = user?.id;
  const [viewRevision, setViewRevision] = useState(0);
  const [retry, setRetry] = useState(0);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [active, setActive] = useState(0);
  const [ghostOn, setGhostOn] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [exporting, setExporting] = useState<"svg" | "png" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scan = useServerFn(scanBlueprint);
  const allFloors = floors.map((f, i) => (i === active ? { ...f, layout } : f));
  const stack = useMemo(() => showAll && allFloors.length > 1 ? allFloors.map(f => f.layout) : undefined, [showAll, floors, active, layout]); // eslint-disable-line react-hooks/exhaustive-deps
  const latest = useRef({ name, floors: allFloors }); latest.current = { name, floors: allFloors };
  const dirty = loaded && JSON.stringify({ name, floors: allFloors }) !== saved;
  const switchFloor = (i: number) => { const floor = allFloors[i]; if (scanning || i === active || !floor) return; setFloors(allFloors); setActive(i); history.reset(floor.layout); setSelected(null); setTool("select"); };
  const addFloor = () => { if (scanning) return; const next = [...allFloors, { id: `floor_${Date.now()}`, name: floorName(allFloors.length), layout: { ...emptyLayout(), walls: layout.walls.map(w => ({ ...w })) } }]; setFloors(next); setActive(next.length - 1); const added = next.at(-1); if (added) history.reset(added.layout); setSelected(null); toast.success("New floor added with the walls of the floor below"); };
  const removeFloor = () => { const floor = allFloors[active]; if (scanning || active === 0 || !floor || !confirm(`Delete ${floor.name}?`)) return; const next = allFloors.filter((_, i) => i !== active).map((f, i) => i === 0 ? f : { ...f, name: floorName(i) }); setFloors(next); setActive(active - 1); const below = next[active - 1]; if (below) history.reset(below.layout); setSelected(null); };

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);
  useEffect(() => {
    if (!userId) return;
    let active = true; setLoadError(null); setLoaded(false);
    getProject(projectId).then(p => {
      if (!active) return;
      if (!p) { setLoadError("Project not found"); return; }
      const value = { walls: p.walls ?? [], doors: p.doors ?? [], windows: p.windows ?? [], furniture: p.furniture ?? [] };
      const fl: Floor[] = [{ id: "ground", name: floorName(0), layout: value }, ...(p.floors ?? [])];
      setName(p.name); setFloors(fl); setActive(0); history.reset(value); setSaved(JSON.stringify({ name: p.name, floors: fl })); setLoaded(true);
    }).catch(() => { if (active) setLoadError("Could not load this project"); });
    return () => { active = false; };
  }, [userId, projectId, retry, history.reset]);

  const update = history.update;
  const save = useCallback(async () => {
    if (saving) return;
    const snapshot = latest.current; setSaving(true);
    const cleanName = snapshot.name.trim() || "Untitled Project";
    try {
      const [ground, ...upper] = snapshot.floors;
      if (!ground) throw new Error("No floor to save");
      await saveProject(projectId, cleanName, ground.layout, upper);
      if (latest.current.name === snapshot.name) setName(cleanName);
      setSaved(JSON.stringify({ name: cleanName, floors: snapshot.floors })); toast.success("Project saved");
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
      if (scanning) return;
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
  }, [back, forward, save, deleteSelected, selFurn, layout, selected, update, scanning]);
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
  const exportBlueprint = async (format: "svg" | "png") => {
    if (exporting) return;
    setExporting(format);
    let url: string | undefined;
    try {
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const css = getComputedStyle(document.documentElement);
      const col = (t: string) => {
        const c = document.createElement("canvas").getContext("2d");
        if (!c) throw new Error("Image export unavailable");
        c.fillStyle = css.getPropertyValue(t).trim(); c.fillRect(0, 0, 1, 1);
        const [r, g, b] = c.getImageData(0, 0, 1, 1).data; return `rgb(${r},${g},${b})`;
      };
      const floor = allFloors[active];
      if (!floor) return;
      const { svg, width, height } = blueprintSvg(layout, { title: name || "Untitled Project", floor: floor.name, date: new Date().toLocaleDateString() }, { paper: col("--plan-background"), ink: col("--foreground"), faint: col("--plan-grid") });
      const file = `${(name || "blueprint").replace(/[^\w-]+/g, "-")}-${floor.name.replace(/\s+/g, "-").toLowerCase()}`;
      url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      const download = (href: string, ext: string) => { const a = document.createElement("a"); a.download = `${file}.${ext}`; a.href = href; a.click(); };
      if (format === "svg") { download(url, "svg"); return; }
      const img = new Image();
      await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error("Could not prepare the blueprint")); img.src = url ?? ""; });
      const c = document.createElement("canvas"); c.width = width * 3; c.height = height * 3;
      const ctx = c.getContext("2d"); if (!ctx) throw new Error("Image export unavailable");
      ctx.scale(3, 3); ctx.drawImage(img, 0, 0); download(c.toDataURL("image/png"), "png");
    } catch { toast.error("Could not export this blueprint. Please try again."); }
    finally { if (url) { const source = url; setTimeout(() => URL.revokeObjectURL(source), 1000); } setExporting(null); }
  };
  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { toast.error("Please upload a PNG, JPG or WebP image of your plan."); return; }
    if (file.size > 6_000_000) { toast.error("Please use an image under 6 MB."); return; }
    setScanning(true);
    try {
      const image = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error("Could not open this image. Please try again.")); r.readAsDataURL(file); });
      const { plan, error } = await scan({ data: { image } });
      if (error || !plan) { toast.error(error ?? "Could not read this blueprint."); return; }
      const next = planToLayout(plan);
      if (!next.walls.length) { toast.error("No walls were found. Try a clearer, straight-on image of a floor plan."); return; }
      if (layout.walls.length && !confirm("Replace this floor with the scanned plan? You can undo this.")) return;
      update({ ...next, furniture: [] }); setSelected(null); setMode(m => m === "3d" ? "split" : m);
      toast.success(`Drew ${next.walls.length} walls, ${next.doors.length} doors and ${next.windows.length} windows — check the lengths`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not read this blueprint."); }
    finally { setScanning(false); if (fileRef.current) fileRef.current.value = ""; }
  };
  if (loadError) return <div className="grid min-h-screen place-items-center"><div className="space-y-5 text-center"><h1 className="text-2xl">{loadError}</h1><Button onClick={() => setRetry(r => r + 1)}>Retry</Button><Button variant="outline" asChild><Link to="/dashboard">Your projects</Link></Button></div></div>;
  if (!loaded) return <PageLoader label="Loading project" />;

  const selectedLabel = selWall ? "Wall" : selDoor ? "Door" : selWindow ? "Window" : selFurn ? selFurn.type.replace("_", " ") : "Project";
  return <div className="editor-shell bg-background">
    <header className="studio-header flex flex-wrap items-center gap-2 px-3 py-3">
      <Button variant="ghost" size="icon" aria-label="Back to Dashboard" onClick={() => { if (!dirty || confirm("Leave without saving your changes?")) nav({ to: "/dashboard" }); }}><ArrowLeft /></Button>
      <Input aria-label="Project name" value={name} onChange={e => setName(e.target.value)} className="w-40 flex-1 border-0 bg-transparent font-medium shadow-none sm:max-w-64" />
      <span className="text-xs text-muted-foreground">{saving ? <span className="flex items-center gap-1"><HouseLoader label="Saving project" />Saving…</span> : dirty ? "Unsaved" : <span className="flex items-center gap-1"><Check className="size-3 text-success" />Saved</span>}</span>
      <div className="ml-auto flex gap-1" inert={scanning}>
        <Button variant="ghost" size="icon" title="Undo (Ctrl/⌘ Z)" aria-label="Undo" disabled={!history.canUndo} onClick={back}><Undo2 /></Button>
        <Button variant="ghost" size="icon" title="Redo (Ctrl/⌘ Shift Z)" aria-label="Redo" disabled={!history.canRedo} onClick={forward}><Redo2 /></Button>
        <Button variant="outline" onClick={save} disabled={saving} aria-label="Save layout">{saving ? <HouseLoader label="Saving" /> : <Save />}<span className="hidden sm:inline">Save</span></Button>
        <Button onClick={() => setAudit(runAudit(layout))}><ClipboardCheck />Audit</Button>
      </div>
    </header>
    <div className="studio-header flex flex-wrap items-center justify-between gap-2 px-4 py-2">
      <div className="flex flex-wrap gap-1"><Button size="sm" variant={mode === "2d" ? "secondary" : "ghost"} aria-pressed={mode === "2d"} onClick={() => setMode("2d")}><PencilRuler />2D Blueprint</Button><Button size="sm" variant={mode === "3d" ? "secondary" : "ghost"} aria-pressed={mode === "3d"} onClick={() => setMode("3d")}><Box />3D Perspective</Button><Button size="sm" variant={mode === "split" ? "secondary" : "ghost"} aria-pressed={mode === "split"} onClick={() => setMode("split")}><Columns2 />Split view</Button></div>
      <div className="flex items-center gap-1">{mode !== "3d" && <><Button size="icon" variant="ghost" title="Grid snapping" aria-label="Grid snapping" aria-pressed={snapEnabled} className={snapEnabled ? "text-primary" : "text-muted-foreground"} onClick={() => setSnapEnabled(s => !s)}><Magnet /></Button><Button size="icon" variant="ghost" aria-label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}><Minus /></Button><span className="w-12 text-center font-mono text-xs">{Math.round(zoom * 100)}%</span><Button size="icon" variant="ghost" aria-label="Zoom in" disabled={zoom >= 3} onClick={() => setZoom(z => Math.min(3, z + 0.25))}><Plus /></Button><Button size="icon" variant="ghost" aria-label="Reset view" title="Reset view" onClick={() => { setZoom(1); setViewRevision(v => v + 1); }}><Scan /></Button><Button size="icon" variant="ghost" aria-label="Export PNG" title="Export PNG" onClick={exportImage}><Download /></Button></>}</div>
    </div>
    <div className="studio-header flex flex-wrap items-center gap-1 px-4 py-2" aria-label="Floors">
      <Layers className="mr-1 size-4 text-muted-foreground" />
      {allFloors.map((f, i) => <Button key={f.id} size="sm" disabled={scanning} variant={i === active ? "secondary" : "ghost"} aria-pressed={i === active} onClick={() => switchFloor(i)}>{f.name}</Button>)}
      <Button size="sm" variant="outline" disabled={scanning} onClick={addFloor}><Plus />Add floor</Button>
      {active > 0 && <><Button size="sm" variant="ghost" aria-pressed={ghostOn} className={ghostOn ? "text-primary" : "text-muted-foreground"} onClick={() => setGhostOn(g => !g)}>Show floor below</Button><Button size="sm" variant="ghost" className="text-destructive" disabled={scanning} onClick={removeFloor}><Trash2 />Delete floor</Button></>}
      <div className="ml-auto flex flex-wrap gap-1">
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" aria-label="Blueprint image" onChange={e => onUpload(e.target.files?.[0])} />
        <Button size="sm" variant="outline" disabled={scanning} onClick={() => fileRef.current?.click()}>{scanning ? <HouseLoader label="Reading blueprint" /> : <Upload />}{scanning ? "Reading plan…" : "Upload blueprint"}</Button>
        <Button size="sm" variant="outline" disabled={!!exporting || scanning} onClick={() => exportBlueprint("svg")}>{exporting === "svg" ? <HouseLoader label="Exporting blueprint" /> : <FileDown />}Blueprint SVG</Button>
        <Button size="sm" variant="outline" disabled={!!exporting || scanning} onClick={() => exportBlueprint("png")}>{exporting === "png" ? <HouseLoader label="Exporting blueprint" /> : <FileDown />}Blueprint PNG</Button>
      </div>
    </div>
    <div className="relative" aria-busy={scanning}><main className="editor-grid" inert={scanning}>
      <nav className="editor-tools gap-1 p-1.5" aria-label="Drawing tools">
        {TOOLS.map(t => <Button key={t.id} variant={tool === t.id ? "secondary" : "ghost"} disabled={mode === "3d"} aria-label={t.label} aria-pressed={tool === t.id} title={t.label} className="h-14 w-12 shrink-0 flex-col gap-1 px-0 text-[10px]" onClick={() => { setTool(t.id); setSelected(null); }}><t.icon />{t.label}</Button>)}
        <Button variant="ghost" title="Load sample room" aria-label="Preset" className="h-14 w-12 shrink-0 flex-col gap-1 px-0 text-[10px]" onClick={() => { if (!layout.walls.length || confirm("Replace this layout with the sample room? You can undo this.")) { update(presetLayout()); setSelected(null); } }}><Wand2 />Preset</Button>
        <Button variant="ghost" title="Clear layout" aria-label="Clear" className="h-14 w-12 shrink-0 flex-col gap-1 px-0 text-[10px] text-destructive" onClick={() => { if (confirm("Clear this layout? You can undo this.")) { update(emptyLayout()); setSelected(null); } }}><Eraser />Clear</Button>
      </nav>
      <section className={`editor-stage relative min-w-0 ${mode === "split" ? "editor-split" : ""}`}>
        {mode !== "3d" && <div className="min-w-0 p-2 sm:p-6"><BlueprintCanvas key={viewRevision} layout={layout} onChange={update} tool={tool} selectedId={selected} onSelect={setSelected} zoom={zoom} onZoom={setZoom} snapEnabled={snapEnabled} onNotice={toast.error} ghost={active > 0 && ghostOn ? allFloors[active - 1]?.layout : undefined} /><div className="mt-3 flex justify-between border-t border-border pt-3 font-mono text-[10px] text-muted-foreground"><span>PLAN / {String(active).padStart(2, "0")} · {allFloors[active]?.name}</span><span>1 GRID = 1 m</span><span>N ↑</span></div></div>} {mode !== "2d" && <div className="relative min-w-0"><Scene3D layout={layout} stack={stack} preset={preset} floorPreset={floorPreset} autoRotate={autoRotate} className={mode === "split" ? "split-scene w-full" : "h-[70dvh] min-h-[380px] w-full"} />{allFloors.length > 1 && <Button className="absolute bottom-4 left-4" variant={showAll ? "default" : "outline"} onClick={() => setShowAll(v => !v)} aria-pressed={showAll}>{showAll ? "All floors" : "This floor only"}</Button>}<Button className="absolute bottom-4 right-4" variant="outline" onClick={() => setAutoRotate(a => !a)} aria-label={autoRotate ? "Pause orbit" : "Start orbit"}>{autoRotate ? <Pause /> : <Play />}{autoRotate ? "Pause" : "Orbit"}</Button></div>}
      </section>
      <aside className="studio-panel space-y-5 p-5">
        <div className="flex items-center justify-between"><h2 className="text-lg capitalize">{selectedLabel}</h2><span className="font-mono text-[10px] text-muted-foreground">{selected ? "PROPERTIES" : "OVERVIEW"}</span></div>
        {mode !== "2d" && <div className="space-y-2"><h3 className="text-xs text-muted-foreground">Wall finish</h3>{(Object.keys(MATERIAL_PRESETS) as MaterialPreset[]).map(k => <Button key={k} variant={preset === k ? "secondary" : "outline"} className="w-full justify-start" onClick={() => setPreset(k)}>{MATERIAL_PRESETS[k].label}</Button>)}<h3 className="pt-3 text-xs text-muted-foreground">Floor finish</h3>{(Object.keys(FLOOR_PRESETS) as FloorPreset[]).map(k => <Button key={k} variant={floorPreset === k ? "secondary" : "outline"} className="w-full justify-start" onClick={() => setFloorPreset(k)}>{FLOOR_PRESETS[k].label}</Button>)}</div>} {mode !== "3d" && <>
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
    </main>{scanning && <div className="absolute inset-0 z-10 flex items-start justify-center bg-background/90 pt-20"><LoadingStatus label="Reading blueprint" /></div>}</div>
    <AuditDrawer result={audit} onClose={() => setAudit(null)} />
  </div>;
}

function NumberField({ label, value, min, max, step = 0.1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState(value.toFixed(2));
  useEffect(() => setDraft(value.toFixed(2)), [value]);
  const apply = () => { const n = Number(draft); if (draft.trim() && Number.isFinite(n)) onChange(Math.max(min, Math.min(max,n))); else setDraft(value.toFixed(2)); };
  return <label className="block space-y-2 text-xs text-muted-foreground"><span>{label}</span><Input aria-label={label} className="font-mono text-foreground" type="number" min={min} max={max} step={step} value={draft} onChange={e => setDraft(e.target.value)} onBlur={apply} onKeyDown={e => { if(e.key === "Enter") e.currentTarget.blur(); }} /></label>;
}
