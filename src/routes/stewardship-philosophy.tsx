import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/stewardship-philosophy")({
  head: () => ({
    meta: [
      { title: "Our Philosophy — Fanika" },
      { name: "description", content: "Our philosophy: purposeful allocation first, contentment, and disciplined planning." },
      { property: "og:title", content: "Our Philosophy — Fanika" },
      { property: "og:description", content: "Purposeful allocation first. Contentment. Disciplined planning. The philosophy behind Fanika." },
    ],
  }),
  component: Philosophy,
});

const PILLARS = [
  { t: "Purposeful allocation first", d: "A share of your income — your choice of rate, from gross or net — is set aside for giving and planned commitments before the rest is allocated. It's not the leftover." },
  { t: "Contentment over comparison", d: "Budgets are based on your household, not anyone else's lifestyle." },
  { t: "Disciplined planning", d: "Saving, investing, and family obligations are built into the plan — not improvised at month-end." },
  { t: "Truthful reconciliation", d: "Every month closes with a snapshot. The past is acknowledged before the next month begins." },
];

function Philosophy() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <BookOpen className="h-4 w-4" /> Our Philosophy
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Money is a tool, managed with purpose.</h1>
        <p className="mt-4 text-lg text-muted-foreground">Fanika is built on a purposeful, disciplined view of finance — helping every household manage resources with clarity, intention, and long-term prosperity in mind.</p>
        <blockquote className="mt-8 rounded-2xl border-l-4 border-primary bg-card p-6 text-base italic shadow-card">
          "A plan for every shilling, and a purpose for every plan."
          <div className="mt-2 text-xs not-italic text-muted-foreground">— The Fanika principle</div>
        </blockquote>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.t} className="rounded-2xl border bg-card p-6 shadow-card">
              <h3 className="font-semibold">{p.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Button asChild><Link to="/signup">Start managing with purpose</Link></Button>
        </div>
      </section>
    </PublicLayout>
  );
}
