import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PublicLayout, BtnPrimary, BtnSecondary, SectionHeading, DEMO_URL } from "@/components/public-layout";
import { PLANS } from "@/lib/plans";
import { IMG } from "@/lib/site-images";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Fanika plans for individuals and families" },
      { name: "description", content: "Start free, upgrade for AI advisory, or plan together on the Family Suite. Three simple monthly plans in Kenyan shillings." },
      { property: "og:title", content: "Pricing — Fanika plans for individuals and families" },
      { property: "og:description", content: "Free, Pro and Family Suite plans — same product, more capacity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: IMG.savings },
      { name: "twitter:image", content: IMG.savings },
    ],
  }),
  component: Pricing,
});

const FAQ = [
  ["Can I switch plans later?", "Yes — move up or down at any time. Your data stays exactly where it is."],
  ["Do I need a credit card to start?", "No. The Free plan is genuinely free and does not ask for payment details."],
  ["What happens to my data if I leave?", "Export everything to PDF, Excel or CSV, then deactivate or permanently delete your account."],
  ["Does the Family Suite need separate accounts?", "Each member signs in with their own account and joins your household."],
];

function Pricing() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-6 pt-14 md:pt-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Pricing</h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Every plan is the same product. You are choosing capacity — how many accounts, how much
              advisory, and how many people plan with you.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/signup"><BtnPrimary>Start free</BtnPrimary></Link>
              <a href={DEMO_URL}><BtnSecondary>Book a demo</BtnSecondary></a>
            </div>
          </div>
          <img src={IMG.savings} alt="Coins and a growing plant representing savings" className="aspect-[4/3] w-full rounded-xl object-cover" loading="lazy" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-20 md:pt-24">
        <SectionHeading>Choose a plan</SectionHeading>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.id} className={`flex flex-col rounded-xl border p-6 ${p.highlight ? "border-foreground" : "border-border"}`}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{p.name}</div>
                {p.highlight && (
                  <span className="rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-background">Popular</span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tracking-tight">{p.priceLabel}</span>
                <span className="text-sm text-muted-foreground">{p.per}</span>
              </div>
              <Link to="/signup" className="mt-6">
                {p.highlight ? <BtnPrimary className="w-full">{p.ctaLabel}</BtnPrimary> : <BtnSecondary className="w-full">{p.ctaLabel}</BtnSecondary>}
              </Link>
              <ul className="mt-7 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-20 md:pt-24">
        <SectionHeading>Common questions</SectionHeading>
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          {FAQ.map(([q, a]) => (
            <div key={q}>
              <h3 className="font-semibold">{q}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20 bg-muted md:mt-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-14 md:flex-row md:items-center md:justify-between">
          <SectionHeading>Not sure which plan fits?</SectionHeading>
          <div className="flex flex-wrap gap-3">
            <a href={DEMO_URL}><BtnPrimary>Book a demo</BtnPrimary></a>
            <Link to="/features">
              <span className="inline-flex items-center justify-center rounded-lg bg-background px-5 py-3 text-sm font-semibold transition hover:opacity-90">Compare features</span>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
