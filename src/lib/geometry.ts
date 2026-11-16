import type { Layout, Wall } from "./layout-types";

export const GRID_SIZE = 20;
export const CANVAS_W = 720;
export const CANVAS_H = 520;
export const OFFSET_X = 360;
export const OFFSET_Z = 260;
export const WALL_THICKNESS = 14;
export const DOOR_WIDTH = 40;
export const WINDOW_WIDTH = 50;

export const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;
export const uid = (p: string) => `${p}_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
export const wallLengthLabel = (w: Pick<Wall, "x1" | "y1" | "x2" | "y2">) =>
  (Math.hypot(w.x2 - w.x1, w.y2 - w.y1) / GRID_SIZE).toFixed(1) + "m";

export function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export interface WallSnap { wall: Wall; projX: number; projY: number; angle: number; dist: number; along: number }

export function nearestWall(px: number, py: number, walls: Wall[], preferId?: string): WallSnap | null {
  let best: WallSnap | null = null;
  for (const w of walls) {
    const dx = w.x2 - w.x1, dy = w.y2 - w.y1, l2 = dx * dx + dy * dy;
    if (l2 === 0) continue;
    const t = Math.max(0, Math.min(1, ((px - w.x1) * dx + (py - w.y1) * dy) / l2));
    const projX = w.x1 + t * dx, projY = w.y1 + t * dy;
    const dist = Math.hypot(px - projX, py - projY);
    const cand = { wall: w, projX, projY, angle: Math.atan2(dy, dx), dist, along: t * Math.sqrt(l2) };
    if (preferId && w.id === preferId) return cand;
    if (!best || dist < best.dist) best = cand;
  }
  return best;
}

export const FURNITURE_SIZE = {
  sofa: { w: 44, d: 18 },
  bed: { w: 36, d: 42 },
  plant: { w: 14, d: 14 },
  tv_unit: { w: 36, d: 10 },
} as const;

export function presetLayout(): Layout {
  const w = (x1: number, y1: number, x2: number, y2: number, i: number) => ({ id: `wall_preset_${i}`, x1, y1, x2, y2, thickness: WALL_THICKNESS });
  return {
    walls: [w(220, 140, 500, 140, 1), w(500, 140, 500, 380, 2), w(500, 380, 220, 380, 3), w(220, 380, 220, 140, 4)],
    doors: [{ id: "door_preset_1", wallId: "wall_preset_3", x: 280, y: 380, width: DOOR_WIDTH, swing: "left" }],
    windows: [
      { id: "win_preset_1", wallId: "wall_preset_1", x: 300, y: 140, width: WINDOW_WIDTH },
      { id: "win_preset_2", wallId: "wall_preset_2", x: 500, y: 240, width: WINDOW_WIDTH },
    ],
    furniture: [
      { id: "f_preset_bed", type: "bed", x: 450, y: 200, rotation: 0, scale: 1 },
      { id: "f_preset_sofa", type: "sofa", x: 320, y: 320, rotation: 180, scale: 1 },
      { id: "f_preset_tv", type: "tv_unit", x: 320, y: 170, rotation: 0, scale: 1 },
      { id: "f_preset_plant1", type: "plant", x: 250, y: 170, rotation: 0, scale: 1 },
      { id: "f_preset_plant2", type: "plant", x: 470, y: 350, rotation: 0, scale: 1.2 },
    ],
  };
}
