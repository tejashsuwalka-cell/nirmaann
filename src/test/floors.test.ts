import { describe, expect, it } from "vitest";
import { planToLayout } from "@/lib/floors";
import { blueprintSvg } from "@/lib/blueprint-export";

describe("scanned plan conversion", () => {
  it("keeps 1 grid = 1 m for a 10 m wall", () => {
    const l = planToLayout({ walls: [{ x1: 0, y1: 0, x2: 10, y2: 0, thickness: 0.2 }], doors: [], windows: [] });
    expect(Math.hypot(l.walls[0]!.x2 - l.walls[0]!.x1, l.walls[0]!.y2 - l.walls[0]!.y1)).toBe(200);
  });
  it("drops doors far from any wall", () => {
    const l = planToLayout({ walls: [{ x1: 0, y1: 0, x2: 10, y2: 0, thickness: 0.2 }], doors: [{ x: 5, y: 8, width: 0.9 }], windows: [] });
    expect(l.doors).toHaveLength(0);
  });
});
describe("blueprint export", () => {
  it("labels a 4 m wall as 4.00 m", () => {
    const { svg } = blueprintSvg({ walls: [{ id: "a", x1: 0, y1: 0, x2: 80, y2: 0, thickness: 14 }], doors: [], windows: [], furniture: [] }, { title: "T", floor: "Ground floor", date: "x" }, { paper: "#fff", ink: "#000", faint: "#eee" });
    expect(svg).toContain("4.00 m");
  });
});
