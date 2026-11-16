import { Link } from "@tanstack/react-router";

export function Logo({ animated = true }: { animated?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-lg font-extrabold text-primary-foreground shadow-brand ${animated ? "animate-logo" : ""}`}>N</span>
      <span className="text-lg font-extrabold tracking-tight text-foreground">NIRMAAN <span className="text-gradient-brand">2.0</span></span>
    </Link>
  );
}
