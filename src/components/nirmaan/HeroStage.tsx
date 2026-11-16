import { useMemo, useState } from "react";
import { presetLayout } from "@/lib/geometry";
import { MATERIAL_PRESETS, type MaterialPreset } from "@/lib/scene3d";
import { Scene3D } from "./Scene3D";
import { useHydrated } from "@tanstack/react-router";

export function HeroStage() {
  const hydrated = useHydrated();
  const layout = useMemo(() => presetLayout(), []);
  const [preset, setPreset] = useState<MaterialPreset>("oak");
  return (
    <div className="glass relative overflow-hidden rounded-3xl">
      <div className="aspect-[4/3] w-full">
        {hydrated && <Scene3D layout={layout} preset={preset} autoRotate parallax enableZoom={false} className="h-full w-full" />}
      </div>
      <div className="absolute inset-x-3 bottom-3 flex flex-wrap justify-center gap-1.5">
        {(Object.keys(MATERIAL_PRESETS) as MaterialPreset[]).map((k) => (
          <button key={k} onClick={() => setPreset(k)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${preset === k ? "bg-gradient-brand text-primary-foreground shadow-brand" : "glass text-muted-foreground hover:text-foreground"}`}>
            {MATERIAL_PRESETS[k].label}
          </button>
        ))}
      </div>
      <span className="glass absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">Live WebGL preview</span>
    </div>
  );
}
