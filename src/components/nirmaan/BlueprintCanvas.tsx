import { useEffect, useRef, useState } from "react";
import type { FurnitureItem, FurnitureType, Layout } from "@/lib/layout-types";
import {
  CANVAS_H, CANVAS_W, DOOR_WIDTH, FURNITURE_SIZE, GRID_SIZE, WALL_THICKNESS, WINDOW_WIDTH,
  distanceToSegment, nearestWall, uid, wallLengthLabel,
} from "@/lib/geometry";

import { editWall, openingPosition, snapPoint } from "@/lib/editing";

export type Tool = "select" | "pan" | "wall" | "door" | "window" | FurnitureType;

interface Props {
  layout: Layout;
  onChange: (l: Layout) => void;
  tool: Tool;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  zoom: number;
  onZoom: (zoom: number) => void;
  snapEnabled: boolean;
  onNotice: (message: string) => void;
}

// Canvas drawing colours (blueprint palette from the spec)
const C = { bg: "", grid: "", gridMajor: "", wall: "", sel: "", preview: "", door: "", swing: "", glass: "", ink: "" };

function drawFurniture(ctx: CanvasRenderingContext2D, f: FurnitureItem, selected: boolean) {
  const { w, d } = FURNITURE_SIZE[f.type];
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate((f.rotation * Math.PI) / 180);
  ctx.scale(f.scale, f.scale);
  const rr = (x: number, y: number, ww: number, hh: number, r: number, fill: string, stroke?: string) => {
    ctx.beginPath(); ctx.roundRect(x, y, ww, hh, r); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  };
  if (f.type === "sofa") {
    rr(-w / 2, -d / 2, w, d, 4, "#6366f1", "#3730a3");
    rr(-w / 2, -d / 2, w, 5, 2, "#4338ca");
    rr(-w / 2, -d / 2, 5, d, 2, "#4338ca"); rr(w / 2 - 5, -d / 2, 5, d, 2, "#4338ca");
    const cw = (w - 10) / 3;
    for (let i = 0; i < 3; i++) rr(-w / 2 + 5 + i * cw + 0.5, -d / 2 + 5.5, cw - 1, d - 7, 2, "#818cf8");
  } else if (f.type === "bed") {
    rr(-w / 2, -d / 2, w, d, 3, "#64748b", "#334155");
    rr(-w / 2, -d / 2, w, 4, 1, "#334155");
    rr(-w / 2 + 3, -d / 2 + 6, w / 2 - 5, 7, 2, "#f8fafc"); rr(2, -d / 2 + 6, w / 2 - 5, 7, 2, "#f8fafc");
    rr(-w / 2 + 1.5, -d / 2 + 16, w - 3, d - 18, 2, "#94a3b8");
  } else if (f.type === "plant") {
    ctx.beginPath(); ctx.arc(0, 0, w / 2, 0, Math.PI * 2); ctx.fillStyle = "#22c55e"; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = "#c2410c"; ctx.stroke();
    ctx.beginPath(); ctx.arc(-1.5, -1.5, 2.5, 0, Math.PI * 2); ctx.fillStyle = "#15803d"; ctx.fill();
  } else {
    rr(-w / 2, -d / 2, w, d, 2, "#78350f", "#451a03");
    rr(-w / 2 + 3, -d / 2 + 1, w - 6, 3, 1, "#0f172a");
  }
  if (selected) {
    ctx.setLineDash([4, 3]); ctx.strokeStyle = C.sel; ctx.lineWidth = 1.5;
    ctx.strokeRect(-w / 2 - 4, -d / 2 - 4, w + 8, d + 8); ctx.setLineDash([]);
  }
  ctx.restore();
}

function hitFurniture(f: FurnitureItem, x: number, y: number) {
  const { w, d } = FURNITURE_SIZE[f.type];
  const a = (-f.rotation * Math.PI) / 180;
  const lx = ((x - f.x) * Math.cos(a) - (y - f.y) * Math.sin(a)) / f.scale;
  const ly = ((x - f.x) * Math.sin(a) + (y - f.y) * Math.cos(a)) / f.scale;
  return Math.abs(lx) <= w / 2 + 3 && Math.abs(ly) <= d / 2 + 3;
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.ink) {
  ctx.font = "500 11px 'IBM Plex Sans', sans-serif";
  const m = ctx.measureText(text).width;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath(); ctx.roundRect(x - m / 2 - 5, y - 9, m + 10, 18, 6); ctx.fill();
  ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, x, y + 0.5);
}

export function BlueprintCanvas({ layout: savedLayout, onChange, tool, selectedId, onSelect, zoom, onZoom, snapEnabled, onNotice }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [draft, setDraft] = useState<Layout | null>(null);
  const layout = draft ?? savedLayout;
  const draftRef = useRef<Layout | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ id: string; x: number; y: number; original: Layout; endpoint?: 1 | 2; pan?: { x: number; y: number } } | null>(null);
  useEffect(() => { if (zoom === 1) setPan({ x: 0, y: 0 }); }, [zoom]);
  useEffect(() => { setStart(null); }, [tool]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setStart(null); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const css = getComputedStyle(cv);
    for (const [key, token] of Object.entries({ bg: "--plan-background", grid: "--plan-grid", gridMajor: "--plan-grid-major", wall: "--foreground", sel: "--primary", preview: "--primary", door: "--primary", swing: "--muted-foreground", glass: "--sky", ink: "--foreground" })) C[key as keyof typeof C] = css.getPropertyValue(token).trim();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = CANVAS_W * dpr; cv.height = CANVAS_H * dpr;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.translate(CANVAS_W / 2 + pan.x, CANVAS_H / 2 + pan.y); ctx.scale(zoom, zoom); ctx.translate(-CANVAS_W / 2, -CANVAS_H / 2);
    for (let x = 0; x <= CANVAS_W; x += GRID_SIZE) { ctx.strokeStyle = x % 100 === 0 ? C.gridMajor : C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, CANVAS_H); ctx.stroke(); }
    for (let y = 0; y <= CANVAS_H; y += GRID_SIZE) { ctx.strokeStyle = y % 100 === 0 ? C.gridMajor : C.grid; ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(CANVAS_W, y + 0.5); ctx.stroke(); }

    ctx.lineCap = "butt";
    for (const w of layout.walls) {
      ctx.strokeStyle = w.id === selectedId ? C.sel : w.color ?? C.wall;
      ctx.lineWidth = w.thickness;
      ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2); ctx.stroke();
    }
    const selectedWall = layout.walls.find(w => w.id === selectedId);
    if (selectedWall && tool === "select") {
      for (const p of [{ x: selectedWall.x1, y: selectedWall.y1 }, { x: selectedWall.x2, y: selectedWall.y2 }]) {
        ctx.fillStyle = C.bg; ctx.strokeStyle = C.sel; ctx.lineWidth = 2 / zoom;
        ctx.beginPath(); ctx.arc(p.x, p.y, 6 / zoom, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
    for (const w of layout.walls) label(ctx, wallLengthLabel(w), (w.x1 + w.x2) / 2, (w.y1 + w.y2) / 2 - 16, w.id === selectedId ? C.sel : C.ink);

    for (const win of layout.windows) {
      const s = nearestWall(win.x, win.y, layout.walls, win.wallId);
      ctx.save(); ctx.translate(win.x, win.y); ctx.rotate(s && s.dist < 40 ? s.angle : 0);
      ctx.fillStyle = C.bg; ctx.fillRect(-win.width / 2, -9, win.width, 18);
      ctx.fillStyle = C.glass; ctx.strokeStyle = win.id === selectedId ? C.sel : C.ink; ctx.lineWidth = win.id === selectedId ? 2.5 : 1.5;
      ctx.fillRect(-win.width / 2, -5, win.width, 10); ctx.strokeRect(-win.width / 2, -5, win.width, 10);
      ctx.beginPath(); ctx.moveTo(-win.width / 2, 0); ctx.lineTo(win.width / 2, 0); ctx.strokeStyle = "#e0f2fe"; ctx.lineWidth = 1; ctx.stroke();
      ctx.rotate(-(s && s.dist < 40 ? s.angle : 0));
      ctx.fillStyle = C.ink; ctx.font = "700 9px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("W", 0, -14);
      ctx.restore();
    }
    for (const d of layout.doors) {
      const s = nearestWall(d.x, d.y, layout.walls, d.wallId);
      const ang = s && s.dist < 40 ? s.angle : 0;
      ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(ang);
      ctx.fillStyle = C.bg; ctx.fillRect(-d.width / 2, -9, d.width, 18);
      if (d.swing === "right") ctx.scale(-1, 1);
      ctx.strokeStyle = C.swing; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(-d.width / 2, 0); ctx.arc(-d.width / 2, 0, d.width, 0, -Math.PI / 2, true); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(-d.width / 2, 0); ctx.lineTo(-d.width / 2, -d.width); ctx.lineWidth = 3; ctx.strokeStyle = C.door; ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.arc(d.x, d.y, 9, 0, Math.PI * 2); ctx.fillStyle = C.door; ctx.fill();
      if (d.id === selectedId) { ctx.strokeStyle = C.sel; ctx.lineWidth = 3; ctx.stroke(); }
      ctx.fillStyle = "#ffffff"; ctx.font = "700 10px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("D", d.x, d.y + 0.5);
    }
    for (const f of layout.furniture) drawFurniture(ctx, f, f.id === selectedId);

    if (tool === "wall" && start && hover) {
      ctx.strokeStyle = C.preview; ctx.lineWidth = 12; ctx.globalAlpha = 0.7; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(hover.x, hover.y); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      label(ctx, wallLengthLabel({ x1: start.x, y1: start.y, x2: hover.x, y2: hover.y }), (start.x + hover.x) / 2, (start.y + hover.y) / 2 - 16, C.preview);
    }
    if (hover && tool !== "select" && tool !== "pan") {
      ctx.beginPath(); ctx.arc(hover.x, hover.y, 4, 0, Math.PI * 2); ctx.fillStyle = C.preview; ctx.fill();
    }
  }, [layout, selectedId, tool, start, hover, zoom, pan]);

  const toCanvas = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    const screen = { x: ((e.clientX - r.left) / r.width) * CANVAS_W, y: ((e.clientY - r.top) / r.height) * CANVAS_H };
    return { x: (screen.x - CANVAS_W / 2 - pan.x) / zoom + CANVAS_W / 2, y: (screen.y - CANVAS_H / 2 - pan.y) / zoom + CANVAS_H / 2 };
  };
  const hitTest = (x: number, y: number): string | null => {
    for (const f of [...layout.furniture].reverse()) if (hitFurniture(f, x, y)) return f.id;
    for (const item of [...layout.doors, ...layout.windows]) {
      const s = nearestWall(item.x, item.y, layout.walls, item.wallId);
      const a = s?.angle ?? 0, dx = x - item.x, dy = y - item.y;
      if (Math.abs(dx * Math.cos(a) + dy * Math.sin(a)) <= item.width / 2 && Math.abs(-dx * Math.sin(a) + dy * Math.cos(a)) < 12 / zoom) return item.id;
    }
    for (const w of layout.walls) if (distanceToSegment(x, y, w.x1, w.y1, w.x2, w.y2) < Math.max(w.thickness / 2, 10 / zoom)) return w.id;
    return null;
  };
  const point = (raw: { x: number; y: number }, shift = false) => {
    const p = snapPoint(raw.x, raw.y, savedLayout.walls, snapEnabled);
    if (start && shift) return Math.abs(p.x - start.x) > Math.abs(p.y - start.y) ? { x: p.x, y: start.y } : { x: start.x, y: p.y };
    return p;
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 2) { setStart(null); return; }
    const raw = toCanvas(e), p = point(raw, e.shiftKey);
    if (tool === "pan" || e.button === 1 || e.altKey) {
      drag.current = { id: "", x: e.clientX, y: e.clientY, original: savedLayout, pan };
      e.currentTarget.setPointerCapture(e.pointerId); return;
    }
    if (tool === "select") {
      const w = layout.walls.find(w => w.id === selectedId);
      const endpoint = w && Math.hypot(w.x1 - raw.x, w.y1 - raw.y) < 12 / zoom ? 1 : w && Math.hypot(w.x2 - raw.x, w.y2 - raw.y) < 12 / zoom ? 2 : undefined;
      const id = endpoint ? w?.id : hitTest(raw.x, raw.y);
      onSelect(id ?? null);
      if (id) { drag.current = { id, x: raw.x, y: raw.y, original: savedLayout, endpoint }; e.currentTarget.setPointerCapture(e.pointerId); }
      return;
    }
    if (tool === "wall") {
      if (!start) { setStart(p); return; }
      if (Math.hypot(p.x - start.x, p.y - start.y) < 5) { setStart(null); return; }
      const duplicate = layout.walls.some(w => (w.x1 === start.x && w.y1 === start.y && w.x2 === p.x && w.y2 === p.y) || (w.x2 === start.x && w.y2 === start.y && w.x1 === p.x && w.y1 === p.y));
      if (!duplicate) onChange({ ...layout, walls: [...layout.walls, { id: uid("wall"), x1: start.x, y1: start.y, x2: p.x, y2: p.y, thickness: WALL_THICKNESS, height: 56 }] });
      const closed = layout.walls.some(w => (w.x1 === p.x && w.y1 === p.y) || (w.x2 === p.x && w.y2 === p.y));
      setStart(closed ? null : p); return;
    }
    if (tool === "door" || tool === "window") {
      const width = tool === "door" ? DOOR_WIDTH : WINDOW_WIDTH;
      const position = openingPosition(layout, raw.x, raw.y, width);
      if (!position) { onNotice("Choose a clear wall section with enough space for this opening."); return; }
      const id = uid(tool);
      if (tool === "door") onChange({ ...layout, doors: [...layout.doors, { id, ...position, width, swing: "left" }] });
      else onChange({ ...layout, windows: [...layout.windows, { id, ...position, width, height: 26, sillHeight: 18 }] });
      onSelect(id); return;
    }
    const f: FurnitureItem = { id: uid(tool), type: tool, x: p.x, y: p.y, rotation: 0, scale: 1 };
    onChange({ ...layout, furniture: [...layout.furniture, f] }); onSelect(f.id);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const raw = toCanvas(e), d = drag.current;
    if (d?.pan) {
      const r = e.currentTarget.getBoundingClientRect();
      setPan({ x: d.pan.x + (e.clientX - d.x) * CANVAS_W / r.width, y: d.pan.y + (e.clientY - d.y) * CANVAS_H / r.height }); return;
    }
    if (d) {
      let next = d.original;
      const delta = snapPoint(raw.x - d.x + 360, raw.y - d.y + 260, [], snapEnabled);
      const dx = delta.x - 360, dy = delta.y - 260;
      const w = next.walls.find(w => w.id === d.id);
      if (w) {
        const p = snapPoint(raw.x, raw.y, next.walls.filter(w => w.id !== d.id), snapEnabled);
        next = editWall(next, w.id, d.endpoint === 1 ? { x1: p.x, y1: p.y } : d.endpoint === 2 ? { x2: p.x, y2: p.y } : { x1: w.x1 + dx, y1: w.y1 + dy, x2: w.x2 + dx, y2: w.y2 + dy });
      } else {
        const item = [...next.doors, ...next.windows].find(i => i.id === d.id);
        if (item) {
          const pos = openingPosition(next, raw.x, raw.y, item.width, item.id);
          if (!pos) return;
          next = { ...next, doors: next.doors.map(i => i.id === d.id ? { ...i, ...pos } : i), windows: next.windows.map(i => i.id === d.id ? { ...i, ...pos } : i) };
        } else next = { ...next, furniture: next.furniture.map(f => f.id === d.id ? { ...f, x: f.x + dx, y: f.y + dy } : f) };
      }
      draftRef.current = next; setDraft(next); return;
    }
    const p = point(raw, e.shiftKey);
    if (!hover || hover.x !== p.x || hover.y !== p.y) setHover(p);
  };
  const finish = (e: React.PointerEvent<HTMLCanvasElement>, cancel = false) => {
    if (draftRef.current && !cancel) onChange(draftRef.current);
    draftRef.current = null; setDraft(null); drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <canvas
      ref={ref}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={e => finish(e)}
      onPointerCancel={e => finish(e, true)}
      onDoubleClick={() => setStart(null)}
      aria-label="Floor plan canvas"
      onWheel={e => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); onZoom(Math.max(0.5, Math.min(3, zoom - e.deltaY * 0.002))); } }}
      onPointerLeave={() => setHover(null)}
      onContextMenu={(e) => e.preventDefault()}
      className={`block h-auto w-full touch-none ${tool === "pan" ? "cursor-grab" : tool === "select" ? "cursor-default" : "cursor-crosshair"}`}
      style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
    />
  );
}
