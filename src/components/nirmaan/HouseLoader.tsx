import { cn } from "@/lib/utils";

/** Small looping "building a house" loader: walls, roof and door draw in, then fade. */
export function HouseLoader({ className, label = "Loading" }: { className?: string; label?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={label} className={cn("house-loader size-4 shrink-0", className)}>
    <path className="house-loader-base" pathLength={1} d="M3 21h18" />
    <path className="house-loader-walls" pathLength={1} d="M5 21V11M19 11v10" />
    <path className="house-loader-roof" pathLength={1} d="M3 12 12 4l9 8" />
    <path className="house-loader-door" pathLength={1} d="M10 21v-5h4v5" />
  </svg>;
}

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return <div className="grid min-h-screen place-items-center"><div className="studio-enter flex flex-col items-center gap-3 text-primary"><HouseLoader className="size-10" label={label} /><span className="font-mono text-xs text-muted-foreground">{label}…</span></div></div>;
}
