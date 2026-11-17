import type { Layout } from "./layout-types";
import { CANVAS_H, CANVAS_W, GRID_SIZE, WALL_THICKNESS, DOOR_WIDTH, WINDOW_WIDTH, nearestWall, uid } from "./geometry";

export interface Floor { id: string; name: string; layout: Layout }

export const floorName = (i: number) => (i === 0 ? "Ground floor" : `Floor ${i}`);

/** Scanned plan in metres (origin anywhere) -> canvas layout centred on the drawing area. */
export interface ScannedPlan {
  walls: { x1: number; y1: number; x2: number; y2: number; thickness: number }[];
  doors: { x: number; y: number; width: number }[];
  windows: { x: number; y: number; width: number }[];
}

export function planToLayout(plan: ScannedPlan): Layout {
  const pts = plan.walls.flatMap(w => [[w.x1, w.y1], [w.x2, w.y2]]);
  if (!pts.length) return { walls: [], doors: [], windows: [], furniture: [] };
  const xs = pts.map(p => p[0]!), ys = pts.map(p => p[1]!);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  // Fit inside the canvas if the plan is larger than it at 1 grid = 1 m.
  const fit = Math.min(1, (CANVAS_W - 80) / ((maxX - minX) * GRID_SIZE || 1), (CANVAS_H - 80) / ((maxY - minY) * GRID_SIZE || 1));
  const s = GRID_SIZE * fit;
  const ox = CANVAS_W / 2 - ((minX + maxX) / 2) * s, oy = CANVAS_H / 2 - ((minY + maxY) / 2) * s;
  const r = (v: number) => Math.round(v * 2) / 2;
  const walls = plan.walls
    .map(w => ({ id: uid("wall"), x1: r(w.x1 * s + ox), y1: r(w.y1 * s + oy), x2: r(w.x2 * s + ox), y2: r(w.y2 * s + oy), thickness: Math.max(6, Math.min(30, (w.thickness || 0.2) * GRID_SIZE)) || WALL_THICKNESS, height: 56 }))
    .filter(w => Math.hypot(w.x2 - w.x1, w.y2 - w.y1) >= 5);
  const attach = (o: { x: number; y: number; width: number }, fallback: number) => {
    const n = nearestWall(o.x * s + ox, o.y * s + oy, walls);
    if (!n || n.dist > 30) return null;
    return { id: uid("o"), wallId: n.wall.id, x: n.projX, y: n.projY, width: Math.max(16, (o.width || fallback / GRID_SIZE) * s) };
  };
  const doors = plan.doors.map(d => attach(d, DOOR_WIDTH)).filter(<T,>(v: T | null): v is T => !!v).map(d => ({ ...d, swing: "left" as const }));
  const windows = plan.windows.map(w => attach(w, WINDOW_WIDTH)).filter(<T,>(v: T | null): v is T => !!v).map(w => ({ ...w, height: 26, sillHeight: 18 }));
  return { walls, doors, windows, furniture: [] };
}
