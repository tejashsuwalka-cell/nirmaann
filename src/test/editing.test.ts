import { describe, expect, it } from 'vitest';
import { commit, undo, redo, editWall, openingPosition, removeItem, snapPoint } from '@/lib/editing';
import { presetLayout } from '@/lib/geometry';

describe('studio editing', () => {
  it('undoes and redoes a complete edit', () => { const h = commit({ past: [], present: 1, future: [] }, 2); expect(undo(h).present).toBe(1); expect(redo(undo(h)).present).toBe(2); });
  it('clears redo when another edit is made', () => { const h = undo(commit({ past: [], present: 1, future: [] }, 2)); expect(commit(h, 3).future).toEqual([]); });
  it('rejects openings away from walls', () => { expect(openingPosition(presetLayout(), 0, 0, 50)).toBeNull(); });
  it('rejects overlapping openings', () => { expect(openingPosition(presetLayout(), 300, 140, 50)).toBeNull(); });
  it('keeps a new window inside wall ends', () => { const p = openingPosition(presetLayout(), 490, 140, 50); expect(p?.x).toBe(471); expect(p?.y).toBe(140); });
  it('moves attached openings with their wall', () => { const p = editWall(presetLayout(), 'wall_preset_1', { y1: 160, y2: 160 }); expect(p.windows[0]?.y).toBe(160); });
  it('preserves connected wall junctions', () => { const p = editWall(presetLayout(), 'wall_preset_1', { x2: 520 }); expect(p.walls[1]?.x1).toBe(520); });
  it('removes attached openings when deleting a wall', () => { expect(removeItem(presetLayout(), 'wall_preset_1').windows.map(w => w.id)).toEqual(['win_preset_2']); });
  it('snaps to existing wall endpoints before grid', () => { expect(snapPoint(223, 142, presetLayout().walls)).toEqual({ x: 220, y: 140 }); });
});