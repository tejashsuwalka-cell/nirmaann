import { useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowUpRight, Mail, Phone, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function StudioFooter() {
  const band = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const element = band.current;
    if (!element) return;
    let intersecting = false;
    const sync = () => { element.dataset["visible"] = String(intersecting && !document.hidden); };
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = Boolean(entry?.isIntersecting);
      sync();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, []);

  return <footer className="studio-footer border-t border-border">
    <div ref={band} className="studio-loop relative overflow-hidden border-b border-border" data-paused={paused}>
      <p className="sr-only">NIRMAAN — Architecture begins with an idea.</p>
      <div className="studio-loop-track flex w-max" aria-hidden="true">
        {[0, 1].map((copy) => <div key={copy} className="studio-loop-copy flex shrink-0 items-center gap-8 px-4 py-8 sm:gap-12 sm:px-6 sm:py-10">
          <span className="font-display text-7xl leading-none sm:text-9xl">NIRMAAN</span>
          <ArrowUpRight className="size-12 shrink-0 text-primary sm:size-20" />
          <span className="font-display text-7xl leading-none text-muted-foreground sm:text-9xl">SPACE TO CREATE</span>
          <ArrowUpRight className="size-12 shrink-0 text-primary sm:size-20" />
        </div>)}
      </div>
      <Button variant="outline" size="icon" className="studio-loop-control absolute bottom-3 right-5" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play footer animation" : "Pause footer animation"} title={paused ? "Play animation" : "Pause animation"}>
        {paused ? <Play /> : <Pause />}
      </Button>
    </div>
    <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 sm:grid-cols-2 sm:px-10">
      <div><p className="font-mono text-xs text-primary">THE ARCHITECTURAL STUDIO</p><p className="mt-3 text-xl">Architecture begins with an idea.</p><p className="mt-4 text-sm text-muted-foreground">Created by <span className="text-foreground">Tejas Swalka</span></p></div>
      <div className="min-w-0 sm:justify-self-end"><h2 className="text-sm font-medium">Contact</h2><div className="mt-3 flex flex-col items-start gap-3">
        <Button variant="link" asChild className="h-auto px-0"><a href="https://www.linkedin.com/in/tejash-suwalka-281860382/" target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight /><span className="sr-only"> (opens in a new tab)</span></a></Button>
        <Button variant="link" asChild className="h-auto max-w-full whitespace-normal px-0"><a href="mailto:tejashsuwalka@gmail.com"><Mail /><span className="break-all">tejashsuwalka@gmail.com</span></a></Button>
        <Button variant="link" asChild className="h-auto px-0"><a href="tel:+918955548898"><Phone />+91 8955548898</a></Button>
      </div></div>
    </div>
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-border px-6 py-5 sm:px-10">
      <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} NIRMAAN</span>
      <div className="flex flex-wrap items-center gap-3">
        <Dialog><DialogTrigger asChild><Button variant="link" className="h-auto px-0 text-xs text-muted-foreground">Terms & conditions</Button></DialogTrigger>
          <DialogContent className="max-h-[80svh] w-[calc(100%-2rem)] overflow-y-auto">
            <DialogHeader><DialogTitle>Terms & conditions</DialogTitle><DialogDescription>NIRMAAN · Draft for review</DialogDescription></DialogHeader>
            <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
              <section><h3 className="mb-1 font-medium text-foreground">Design guidance</h3><p>NIRMAAN is a conceptual planning tool. Plans, measurements, 3D views, image recognition and layout reviews can contain errors and are not certified construction documents.</p></section>
              <section><h3 className="mb-1 font-medium text-foreground">Professional verification</h3><p>Have a qualified architect or engineer verify dimensions, structure, safety and local requirements before using any design for construction or approvals.</p></section>
              <section><h3 className="mb-1 font-medium text-foreground">Your uploads</h3><p>Only upload drawings and images you have permission to use. Avoid including sensitive personal information in blueprint images.</p></section>
              <section><h3 className="mb-1 font-medium text-foreground">Review status</h3><p>These draft notices are provided for review and are not a complete legal agreement. Final terms are pending the creator’s approval.</p></section>
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="ghost" size="sm" asChild><a href="#page-top" aria-label="Back to top">Back to top <ArrowUp /></a></Button>
      </div>
    </div>
  </footer>;
}