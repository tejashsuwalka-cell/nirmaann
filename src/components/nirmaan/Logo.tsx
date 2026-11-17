import { Link } from "@tanstack/react-router";

export function Logo(_props: { animated?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="text-2xl font-semibold text-foreground">NIRMAAN</span>
    </Link>
  );
}
