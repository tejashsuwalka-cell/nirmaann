import { createFileRoute, Link } from "@tanstack/react-router";
import { Box, ClipboardCheck, PencilRuler, ShieldCheck, Sun, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/nirmaan/Logo";
import { HeroStage } from "@/components/nirmaan/HeroStage";
import { useAuth } from "@/hooks/useAuth";

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

const features = [
  {
    icon: PencilRuler,
    title: "Precision 2D Blueprinting",
    body: "Draft walls on a 20px magnetic grid with live metre dimensions, then drop in doors, windows and furniture.",
  },
  {
    icon: Box,
    title: "Interactive 3D WebGL",
    body: "Every line extrudes into a lit, shadowed 3D room. Orbit, inspect and switch between oak, concrete and glass.",
  },
  {
    icon: ClipboardCheck,
    title: "Automated Compliance",
    body: "A rule-based audit scores enclosure, access and natural light, with Vastu tips to refine your plan.",
  },
];

function Index() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 px-4 pt-4">
        <nav className="glass mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5">
          <Logo />
          <div className="flex items-center gap-2">
            {user ? (
              <Button variant="hero" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <section className="grid items-center gap-12 py-16 lg:grid-cols-[1fr_1.1fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Blueprint → 3D → Compliance
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Architectural Precision, <span className="text-gradient-brand">Elevated in 3D Space</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Sketch a floor plan in minutes, walk around it in real-time 3D, and know it meets the basics before a
              single brick is laid.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" asChild className="h-12 px-6">
                <Link to={user ? "/dashboard" : "/register"}>
                  Launch 3D Studio <ArrowRight />
                </Link>
              </Button>
              <Button variant="glass" size="lg" asChild className="h-12 px-6">
                <Link to={user ? "/dashboard" : "/login"}>Sign In to Project</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <HeroStage />
            <div className="glass animate-float absolute -left-4 top-24 hidden items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold sm:flex">
              <Sun className="h-4 w-4 text-warning" /> Real-time 3D Lighting
            </div>
            <div className="glass animate-float absolute -right-3 bottom-16 hidden items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold sm:flex [animation-delay:1.5s]">
              <ShieldCheck className="h-4 w-4 text-success" /> Instant Compliance Audit
            </div>
          </div>
        </section>

        <section className="grid gap-5 pb-20 md:grid-cols-3">
          {features.map((f) => (
            <article key={f.title} className="glass rounded-3xl p-6 transition-transform hover:-translate-y-1">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </section>

        <section className="mb-16 overflow-hidden rounded-3xl bg-gradient-brand p-10 text-center shadow-brand sm:p-14">
          <h2 className="text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl">
            Your next floor plan starts with one line.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Free to start. No plugins, no downloads — just your browser.
          </p>
          <Button
            size="lg"
            asChild
            className="mt-7 h-12 rounded-xl bg-card px-7 font-bold text-primary hover:bg-card/90"
          >
            <Link to={user ? "/dashboard" : "/register"}>Start Drafting</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} NIRMAAN 2.0 · Intelligent Blueprint to 2D/3D Architecture
      </footer>
    </div>
  );
}
