import { useEffect, useRef } from "react";
import type { Layout } from "@/lib/layout-types";
import { createViewer, type MaterialPreset, type Viewer } from "@/lib/scene3d";

interface Props { layout: Layout; preset: MaterialPreset; autoRotate: boolean; parallax?: boolean; enableZoom?: boolean; className?: string }

export function Scene3D({ layout, preset, autoRotate, parallax, enableZoom, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const fitted = useRef(false);

  useEffect(() => {
    const el = ref.current!;
    const v = createViewer(el, { autoRotate, enableZoom, onReady: () => el.setAttribute("data-scene-ready", "true") });
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
    viewer.current?.setLayout(layout, preset, !fitted.current);
    fitted.current = true;
  }, [layout, preset]);

  useEffect(() => { viewer.current?.setAutoRotate(autoRotate); }, [autoRotate]);

  return <div ref={ref} className={className} />;
}
