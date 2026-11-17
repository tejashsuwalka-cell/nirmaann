import type { Layout, Wall } from './layout-types';
import { nearestWall, GRID_SIZE, CANVAS_W, CANVAS_H } from './geometry';

export function snapPoint(x: number, y: number, walls: Wall[], enabled = true) {
  const bounded = { x: Math.max(0, Math.min(CANVAS_W, x)), y: Math.max(0, Math.min(CANVAS_H, y)) };
  if (!enabled) return bounded;
  for (const w of walls) for (const p of [{ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 }]) {
    if (Math.hypot(p.x - bounded.x, p.y - bounded.y) < 12) return p;
  }
  return { x: Math.round(bounded.x / GRID_SIZE) * GRID_SIZE, y: Math.round(bounded.y / GRID_SIZE) * GRID_SIZE };
}

export function openingPosition(layout: Layout, x: number, y: number, width: number, excludeId?: string, wallId?: string) {
  const s = nearestWall(x, y, layout.walls, wallId);
  if (!s || s.dist > 30) return null;
  const length = Math.hypot(s.wall.x2 - s.wall.x1, s.wall.y2 - s.wall.y1);
  if (length < width + 8) return null;
  const along = Math.max(width / 2 + 4, Math.min(length - width / 2 - 4, s.along));
  for (const item of [...layout.doors, ...layout.windows]) {
    if (item.id === excludeId || item.wallId !== s.wall.id) continue;
    const other = nearestWall(item.x, item.y, [s.wall]);
    if (other && Math.abs(other.along - along) < (item.width + width) / 2 + 4) return null;
  }
  return { x: s.wall.x1 + Math.cos(s.angle) * along, y: s.wall.y1 + Math.sin(s.angle) * along, wallId: s.wall.id };
}

export function editWall(layout: Layout, id: string, patch: Partial<Wall>): Layout {
  const old = layout.walls.find(w => w.id === id);
  if (!old) return layout;
  const wall = { ...old, ...patch };
  if (Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1) < 5) return layout;
  const move = <T extends { x: number; y: number; width: number; wallId?: string }>(item: T): T => {
    if (item.wallId !== id) return item;
    const s = nearestWall(item.x, item.y, [old]);
    if (!s) return item;
    const oldLength = Math.hypot(old.x2 - old.x1, old.y2 - old.y1);
    const length = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
    const t = Math.max(0, Math.min(1, s.along / oldLength));
    const along = Math.max(item.width / 2, Math.min(length - item.width / 2, t * length));
    return { ...item, width: Math.min(item.width, Math.max(1, length - 8)), x: wall.x1 + (wall.x2 - wall.x1) * along / length, y: wall.y1 + (wall.y2 - wall.y1) * along / length };
  };
  return { ...layout, walls: layout.walls.map(w => w.id === id ? wall : w), doors: layout.doors.map(move), windows: layout.windows.map(move) };
}

export function removeItem(layout: Layout, id: string): Layout {
  return { walls: layout.walls.filter(w => w.id !== id), doors: layout.doors.filter(d => d.id !== id && d.wallId !== id), windows: layout.windows.filter(w => w.id !== id && w.wallId !== id), furniture: layout.furniture.filter(f => f.id !== id) };
}

export interface History<T> { past: T[]; present: T; future: T[] }
export function commit<T>(h: History<T>, value: T): History<T> {
  if (JSON.stringify(value) === JSON.stringify(h.present)) return h;
  return { past: [...h.past.slice(-99), h.present], present: value, future: [] };
}
export function undo<T>(h: History<T>): History<T> {
  const previous = h.past.at(-1);
  return previous === undefined ? h : { past: h.past.slice(0, -1), present: previous, future: [h.present, ...h.future] };
}
export function redo<T>(h: History<T>): History<T> {
  const next = h.future[0];
  return next === undefined ? h : { past: [...h.past, h.present], present: next, future: h.future.slice(1) };
}