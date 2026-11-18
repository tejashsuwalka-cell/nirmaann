import { useEffect, useRef, useState } from "react";
import type { Layout } from "@/lib/layout-types";
import { createViewer, type FloorPreset, type MaterialPreset, type Viewer } from "@/lib/scene3d";
import { LoadingStatus } from "./HouseLoader";

interface Props { layout: Layout; preset: MaterialPreset; floorPreset?: FloorPreset; autoRotate: boolean; stack?: Layout[] | undefined; parallax?: boolean; enableZoom?: boolean; className?: string }

export function Scene3D({ layout, preset, floorPreset = "oak", autoRotate, stack, parallax, enableZoom, className }: Props) {
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const fitted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let v: Viewer;
    try { v = createViewer(el, { autoRotate, enableZoom, onReady: () => { el.setAttribute("data-scene-ready", "true"); setReady(true); } }); }
    catch { setError(true); return; }
    viewer.current = v;
    fitted.current = false;
    let onMove: ((e: PointerEvent) => void) | null = null;
    if (parallax) {
      onMove = (e) => v.setParallax((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
      window.addEventListener("pointermove", onMove);
    }
    return () => { if (onMove) window.removeEventListener("pointermove", onMove); v.dispose(); viewer.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stacked = !!stack;
  useEffect(() => { fitted.current = false; }, [stacked]);
  useEffect(() => {
    try {
      viewer.current?.setLayout(layout, preset, !fitted.current, floorPreset, stack);
      fitted.current = true;
    } catch { setError(true); }
  }, [layout, preset, floorPreset, stack]);


  useEffect(() => { viewer.current?.setAutoRotate(autoRotate); }, [autoRotate]);

  return <div className={`relative ${className ?? ""}`} aria-busy={!ready && !error}><div ref={ref} className="h-full w-full" />{!ready && !error && <div className="pointer-events-none absolute inset-0 grid place-items-center bg-background"><LoadingStatus label="Preparing 3D view" /></div>}{error && <div role="alert" className="absolute inset-0 grid place-items-center bg-background p-6 text-center text-muted-foreground">3D is unavailable on this device. Your 2D plan remains editable.</div>}</div>;
}
