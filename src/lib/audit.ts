import type { Layout } from "./layout-types";

export interface AuditResult { score: number; passed: boolean; warnings: string[]; suggestions: string[]; tips: string[] }

export const VASTU_TIPS = [
  "Vastu: place the main entrance on the North, East or North-East side to welcome light and positive energy.",
  "Vastu: keep the master bedroom in the South-West for stability.",
  "Vastu: favour large windows on the North and East walls for morning sunlight.",
  "Plan tip: keep at least 0.9m clear walking paths between furniture.",
];

export function runAudit(layout: Pick<Layout, "walls" | "doors" | "windows">): AuditResult {
  const { walls, doors, windows } = layout;
  const warnings: string[] = [];
  const suggestions: string[] = [];
  if (walls.length === 0 && doors.length === 0 && windows.length === 0) {
    return {
      score: 0, passed: false,
      warnings: ["Empty layout: No walls, doors, or windows provided in the layout."],
      suggestions: ["Start by drafting the perimeter walls of your room with the Wall tool."],
      tips: VASTU_TIPS,
    };
  }
  let score = 100;
  if (walls.length < 4) { score -= 25; warnings.push("Incomplete enclosure: Layout requires minimum 4 perimeter walls."); }
  if (doors.length === 0) { score -= 25; warnings.push("No access point: Layout requires at least 1 ingress door."); }
  if (windows.length === 0) { score -= 15; warnings.push("No natural light: Layout has no fenestration."); }
  else suggestions.push(`Good natural lighting: Layout contains ${windows.length} window(s).`);
  score = Math.max(0, Math.min(100, score));
  return { score, passed: score >= 70 && warnings.length === 0, warnings, suggestions, tips: VASTU_TIPS };
}
