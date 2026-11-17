import { expect, it } from 'vitest';
import { windowBounds } from '@/lib/window-geometry';

it('uses the same default opening bounds for the frame and wall', () => {
  expect(windowBounds({ id: 'w', x: 0, y: 0, width: 50 })).toEqual({ sill: 18, top: 44, height: 26 });
});
it('keeps a tall window below the wall top without inverted panes', () => {
  expect(windowBounds({ id: 'w', x: 0, y: 0, width: 50, sillHeight: 30, height: 40 }, 46)).toEqual({ sill: 30, top: 44, height: 14 });
});