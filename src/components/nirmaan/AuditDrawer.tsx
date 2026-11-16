import { AlertTriangle, CheckCircle2, Lightbulb, Sparkles, X } from "lucide-react";
import type { AuditResult } from "@/lib/audit";

export function AuditDrawer({ result, onClose }: { result: AuditResult | null; onClose: () => void }) {
  const open = !!result;
  return (
    <aside className={`glass fixed bottom-3 right-3 top-3 z-40 flex w-[min(380px,calc(100vw-1.5rem))] flex-col rounded-3xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-[110%]"}`}>
      {result && (
        <>
          <div className="flex items-center justify-between border-b border-border/60 p-5">
            <h2 className="text-lg font-extrabold text-foreground">Compliance & Vastu Audit</h2>
            <button onClick={onClose} aria-label="Close audit" className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <div>
              <div className="flex items-end justify-between">
                <span className="text-5xl font-extrabold tracking-tight text-foreground">{result.score}<span className="text-lg text-muted-foreground">/100</span></span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${result.passed ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>{result.passed ? "Passed" : "Revision Needed"}</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full transition-all duration-700 ${result.score >= 70 ? "bg-success" : "bg-warning"}`} style={{ width: `${result.score}%` }} />
              </div>
            </div>
            {result.warnings.length > 0 && (
              <Section title="Warnings">{result.warnings.map((w) => <Item key={w} icon={<AlertTriangle className="h-4 w-4 shrink-0 text-warning" />} className="border-warning/30 bg-warning-soft">{w}</Item>)}</Section>
            )}
            {result.suggestions.length > 0 && (
              <Section title="Suggestions">{result.suggestions.map((s) => <Item key={s} icon={<CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />} className="border-primary/20 bg-secondary">{s}</Item>)}</Section>
            )}
            <details className="group" open>
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-muted-foreground">Architectural tips</summary>
              <div className="mt-2 space-y-2">{result.tips.map((t) => <Item key={t} icon={<Lightbulb className="h-4 w-4 shrink-0 text-primary-glow" />} className="border-border bg-card">{t}</Item>)}</div>
            </details>
            <p className="flex gap-2 text-xs leading-relaxed text-muted-foreground"><Sparkles className="h-4 w-4 shrink-0" />This automated audit is indicative only and does not replace review by a licensed architect or local building authority.</p>
          </div>
        </>
      )}
    </aside>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3><div className="space-y-2">{children}</div></div>;
}
function Item({ icon, className, children }: { icon: React.ReactNode; className: string; children: React.ReactNode }) {
  return <div className={`flex gap-2 rounded-xl border p-3 text-sm text-foreground ${className}`}>{icon}<span>{children}</span></div>;
}
