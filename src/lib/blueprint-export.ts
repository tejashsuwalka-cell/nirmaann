import type { Layout } from "./layout-types";
import { GRID_SIZE, nearestWall } from "./geometry";

export interface BlueprintColors { paper: string; ink: string; faint: string }

/** Pure SVG drafting sheet: walls, openings, dimensions, title block. */
export function blueprintSvg(layout: Layout, meta: { title: string; floor: string; date: string }, c: BlueprintColors) {
  const pts = layout.walls.flatMap(w => [[w.x1, w.y1], [w.x2, w.y2]]);
  const xs = pts.map(p => p[0]!), ys = pts.map(p => p[1]!);
  const minX = pts.length ? Math.min(...xs) : 0, maxX = pts.length ? Math.max(...xs) : 400;
  const minY = pts.length ? Math.min(...ys) : 0, maxY = pts.length ? Math.max(...ys) : 300;
  const pad = 70, W = Math.max(640, maxX - minX + pad * 2), H = maxY - minY + pad * 2 + 90;
  const tx = (x: number) => x - minX + pad, ty = (y: number) => y - minY + pad;
  const esc = (s: string) => s.replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
  const out: string[] = [];
  for (let x = 0; x <= W; x += GRID_SIZE) out.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H - 90}" stroke="${c.faint}" stroke-width="0.5"/>`);
  for (let y = 0; y <= H - 90; y += GRID_SIZE) out.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${c.faint}" stroke-width="0.5"/>`);
  for (const w of layout.walls) {
    out.push(`<line x1="${tx(w.x1)}" y1="${ty(w.y1)}" x2="${tx(w.x2)}" y2="${ty(w.y2)}" stroke="${c.ink}" stroke-width="${w.thickness}" stroke-linecap="square"/>`);
    const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1), a = Math.atan2(w.y2 - w.y1, w.x2 - w.x1);
    let nx = -Math.sin(a) * 22, ny = Math.cos(a) * 22;
    // Place dimensions on the side facing away from the plan centre.
    const cx = (minX + maxX) / 2 - (w.x1 + w.x2) / 2, cy = (minY + maxY) / 2 - (w.y1 + w.y2) / 2;
    if (nx * cx + ny * cy > 0) { nx = -nx; ny = -ny; }
    const mx = tx((w.x1 + w.x2) / 2) + nx, my = ty((w.y1 + w.y2) / 2) + ny;
    out.push(`<line x1="${tx(w.x1) + nx}" y1="${ty(w.y1) + ny}" x2="${tx(w.x2) + nx}" y2="${ty(w.y2) + ny}" stroke="${c.ink}" stroke-width="0.7"/>`);
    out.push(`<text x="${mx}" y="${my - 3}" fill="${c.ink}" font-size="10" text-anchor="middle" font-family="IBM Plex Mono, monospace">${(len / GRID_SIZE).toFixed(2)} m</text>`);
  }
  const opening = (o: { x: number; y: number; width: number; wallId?: string | undefined }, kind: "door" | "window") => {
    const s = nearestWall(o.x, o.y, layout.walls, o.wallId);
    const deg = ((s?.angle ?? 0) * 180) / Math.PI, t = (s?.wall.thickness ?? 14) + 2, hw = o.width / 2;
    const body = kind === "window"
      ? `<rect x="${-hw}" y="${-t / 2}" width="${o.width}" height="${t}" fill="${c.paper}" stroke="${c.ink}" stroke-width="1"/><line x1="${-hw}" y1="0" x2="${hw}" y2="0" stroke="${c.ink}"/>`
      : `<rect x="${-hw}" y="${-t / 2}" width="${o.width}" height="${t}" fill="${c.paper}"/><path d="M${-hw} 0 L${-hw} ${-o.width} A${o.width} ${o.width} 0 0 1 ${hw} 0" fill="none" stroke="${c.ink}" stroke-width="1" stroke-dasharray="3 2"/>`;
    out.push(`<g transform="translate(${tx(o.x)} ${ty(o.y)}) rotate(${deg})">${body}</g>`);
  };
  layout.windows.forEach(w => opening(w, "window"));
  layout.doors.forEach(d => opening(d, "door"));
  const area = ((maxX - minX) * (maxY - minY)) / (GRID_SIZE * GRID_SIZE);
  const by = H - 80;
  out.push(`<rect x="10" y="${by}" width="${W - 20}" height="70" fill="none" stroke="${c.ink}" stroke-width="1.5"/>`);
  out.push(`<text x="24" y="${by + 26}" fill="${c.ink}" font-size="18" font-family="Georgia, serif">${esc(meta.title)}</text>`);
  out.push(`<text x="24" y="${by + 46}" fill="${c.ink}" font-size="10" font-family="IBM Plex Mono, monospace">${esc(meta.floor.toUpperCase())} · SCALE 1 GRID = 1 m</text>`);
  out.push(`<text x="24" y="${by + 64}" fill="${c.ink}" font-size="10" font-family="IBM Plex Mono, monospace">ENVELOPE ${area.toFixed(1)} m² · ${esc(meta.date)}</text>`);
  out.push(`<text x="${W - 30}" y="${by + 30}" fill="${c.ink}" font-size="14" text-anchor="middle" font-family="IBM Plex Mono, monospace">N ↑</text>`);
  out.push(`<text x="${W - 30}" y="${by + 54}" fill="${c.ink}" font-size="9" text-anchor="middle" font-family="IBM Plex Mono, monospace">NIRMAAN</text>`);
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="${c.paper}"/>${out.join("")}</svg>`, width: W, height: H, area };
}
