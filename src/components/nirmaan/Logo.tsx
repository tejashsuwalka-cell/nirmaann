import { Link } from "@tanstack/react-router";

export function Logo(_props: { animated?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="text-2xl font-semibold text-foreground">NIRMAAN<span className="ml-1 align-top font-mono text-[10px] text-primary">2.0</span></span>
    </Link>
  );
}
