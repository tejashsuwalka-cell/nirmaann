import { describe, expect, it } from "vitest";
import { runAudit } from "@/lib/audit";
import { presetLayout } from "@/lib/geometry";

const wall = (i: number) => ({ id: `w${i}`, x1: 0, y1: 0, x2: 20, y2: 0, thickness: 14 });
const door = { id: "d", x: 0, y: 0, width: 40 };
const win = { id: "x", x: 0, y: 0, width: 50 };

describe("compliance audit", () => {
  it("scores an empty layout 0", () => {
    expect(runAudit({ walls: [], doors: [], windows: [] }).score).toBe(0);
  });
  it("deducts 25 for fewer than 4 walls", () => {
    expect(runAudit({ walls: [wall(1)], doors: [door], windows: [win] }).score).toBe(75);
  });
  it("deducts 25 for no door", () => {
    expect(runAudit({ walls: [1, 2, 3, 4].map(wall), doors: [], windows: [win] }).score).toBe(75);
  });
  it("deducts 15 for no windows", () => {
    expect(runAudit({ walls: [1, 2, 3, 4].map(wall), doors: [door], windows: [] }).score).toBe(85);
  });
  it("passes only with score >= 70 and no warnings", () => {
    expect(runAudit({ walls: [1, 2, 3, 4].map(wall), doors: [door], windows: [] }).passed).toBe(false);
    const r = runAudit(presetLayout());
    expect(r.score).toBe(100);
    expect(r.passed).toBe(true);
  });
  it("never goes below 0", () => {
    expect(runAudit({ walls: [wall(1)], doors: [], windows: [] }).score).toBe(35);
  });
});
