import { useEffect, useRef, useState } from "react";
import type { Layout } from "@/lib/layout-types";
import { createViewer, type FloorPreset, type MaterialPreset, type Viewer } from "@/lib/scene3d";

interface Props { layout: Layout; preset: MaterialPreset; floorPreset?: FloorPreset; autoRotate: boolean; parallax?: boolean; enableZoom?: boolean; className?: string }

export function Scene3D({ layout, preset, floorPreset = "oak", autoRotate, parallax, enableZoom, className }: Props) {
  const [error, setError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const fitted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let v: Viewer;
    try { v = createViewer(el, { autoRotate, enableZoom, onReady: () => el.setAttribute("data-scene-ready", "true") }); }
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

  useEffect(() => {
    viewer.current?.setLayout(layout, preset, !fitted.current, floorPreset);
    fitted.current = true;
  }, [layout, preset, floorPreset]);

  useEffect(() => { viewer.current?.setAutoRotate(autoRotate); }, [autoRotate]);

  return <div ref={ref} className={className}>{error && <div role="alert" className="grid h-full place-items-center p-6 text-center text-muted-foreground">3D is unavailable on this device. Your 2D plan remains editable.</div>}</div>;
}
