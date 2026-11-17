import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/nirmaan/Logo";
import { useAuth } from "@/hooks/useAuth";
import courtyard from "@/assets/nirmaan-courtyard.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NIRMAAN — Architectural Precision in 3D" },
      {
        name: "description",
        content:
          "Draft 2D floor plans, see them instantly in 3D and run automated compliance and Vastu audits — all in your browser.",
      },
      { property: "og:title", content: "NIRMAAN 2.0 — Architectural Precision in 3D" },
      {
        property: "og:description",
        content: "Blueprint drafting, real-time 3D visualisation and compliance audits in one studio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { user } = useAuth();
  return <div className="bg-background">
    <header className="studio-header flex items-center justify-between gap-3 px-5 py-4 sm:px-10"><Logo /><nav className="flex items-center gap-2">{user ? <Button asChild><Link to="/dashboard">Your projects <ArrowUpRight /></Link></Button> : <><Button variant="ghost" asChild><Link to="/login">Sign in</Link></Button><Button asChild><Link to="/register">Open studio <ArrowUpRight /></Link></Button></>}</nav></header>
    <main>
      <section className="relative h-[76dvh] min-h-[460px] max-h-[860px] overflow-hidden">
        <img src={courtyard} alt="A contemporary courtyard residence with sculptural concrete planes and floor-to-ceiling glass" width={1920} height={1088} className="hero-image absolute inset-0 h-full w-full object-cover" />
        <div className="hero-scrim absolute inset-0" />
        <div className="studio-enter absolute inset-x-0 bottom-0 px-6 pb-9 text-primary-foreground sm:px-10 sm:pb-12">
          <span className="font-mono text-xs">THE ARCHITECTURAL STUDIO / 2.0</span>
          <h1 className="mt-4 font-display text-7xl leading-none sm:text-9xl">NIRMAAN</h1>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-6"><p className="max-w-md text-lg leading-relaxed">From the first line to a space you can explore.</p><Button variant="outline" size="lg" asChild className="h-12 border-primary-foreground/50 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-foreground"><Link to={user ? "/dashboard" : "/register"}>Enter the studio <ArrowUpRight /></Link></Button></div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6"><h2 className="font-display text-4xl sm:text-5xl">A considered approach to space.</h2><span className="font-mono text-xs text-muted-foreground">DRAW / EXPLORE / REFINE</span></div>
        <div className="grid sm:grid-cols-3">{[["01", "The plan", "Precise walls, openings and furniture."],["02", "The perspective", "A live three-dimensional view of your design."],["03", "The review", "An indicative check of access, light and layout."]].map(([n,title,description]) => <article key={n} className="border-b border-border py-7 sm:pr-8"><span className="font-mono text-xs text-primary">{n}</span><h3 className="mt-4 text-xl">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{description}</p></article>)}</div>
      </section>
    </main>
    <footer className="flex flex-wrap justify-between gap-3 border-t border-border px-6 py-6 text-xs text-muted-foreground sm:px-10"><span>© {new Date().getFullYear()} NIRMAAN 2.0</span><span>Architecture begins with an idea.</span></footer>
  </div>;
}
