import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/stewardship-philosophy")({
  head: () => ({
    meta: [
      { title: "Stewardship — Fanika" },
      { name: "description", content: "Our stewardship philosophy: tithing first, contentment, and faithful planning." },
      { property: "og:title", content: "Stewardship — Fanika" },
      { property: "og:description", content: "Tithing first. Contentment. Faithful planning. The philosophy behind Fanika." },
    ],
  }),
  component: Philosophy,
});

const PILLARS = [
  { t: "Tithing first", d: "10% of gross (or net, your choice) is calculated and returned before allocation. Stewardship is not the leftover." },
  { t: "Contentment over comparison", d: "Budgets are based on your household, not anyone else's lifestyle." },
  { t: "Faithful planning", d: "Saving, investing, and family obligations are built into the plan — not improvised at month-end." },
  { t: "Truthful reconciliation", d: "Every month closes with a snapshot. The past is acknowledged before the next month begins." },
];

function Philosophy() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <BookOpen className="h-4 w-4" /> Stewardship
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Money is a trust, not a possession.</h1>
        <p className="mt-4 text-lg text-muted-foreground">Fanika is built on a stewardship view of finance — drawing on Scripture and the writings of Ellen G. White on faithful management of resources.</p>
        <blockquote className="mt-8 rounded-2xl border-l-4 border-primary bg-card p-6 text-base italic shadow-card">
          "Honour the Lord with thy substance, and with the firstfruits of all thine increase."
          <div className="mt-2 text-xs not-italic text-muted-foreground">— Proverbs 3:9</div>
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
          <Button asChild><Link to="/signup">Begin stewarding well</Link></Button>
        </div>
      </section>
    </PublicLayout>
  );
}
