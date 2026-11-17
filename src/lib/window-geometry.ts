import type { WindowItem } from './layout-types';

// Both the wall cutout and window assembly must use identical bounds.
export function windowBounds(win: WindowItem, wallHeight = 56) {
  const sill = Math.max(0, Math.min(win.sillHeight ?? 18, wallHeight - 6));
  const height = Math.max(3, Math.min(win.height ?? 26, wallHeight - 2 - sill));
  return { sill, top: sill + height, height };
}