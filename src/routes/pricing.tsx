import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PublicLayout, BtnPrimary, BtnSecondary, SectionHeading, Eyebrow, DEMO_URL } from "@/components/public-layout";
import { PLANS } from "@/lib/plans";
import { IMG } from "@/lib/site-images";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Fanika plans for individuals and families" },
      {
        name: "description",
        content:
          "Start free, upgrade for AI advisory, or plan together on the Family Suite. Three simple monthly plans in Kenyan shillings.",
      },
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
      <section className="bg-sage-field">
        <div className="mx-auto max-w-3xl px-5 pt-14 pb-14 text-center md:px-6 md:pt-20">
          <Eyebrow>Simple plans</Eyebrow>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-[3.2rem] md:leading-[1.05]">
            Pay for capacity, not for features
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Every plan is the same product. You are choosing how many accounts, how much advisory, and
            how many people plan alongside you.
          </p>
        </div>
      </section>

      <section className="mx-auto -mt-8 max-w-6xl px-5 md:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`card-hover flex flex-col rounded-3xl border bg-card p-6 shadow-card md:p-7 ${
                p.highlight ? "border-primary ring-1 ring-primary/25" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-base font-semibold">{p.name}</div>
                {p.highlight && (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                    Most popular
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="num text-3xl font-semibold tracking-tight">{p.priceLabel}</span>
                <span className="text-sm text-muted-foreground">{p.per}</span>
              </div>
              <Link to="/signup" className="mt-6">
                {p.highlight ? (
                  <BtnPrimary className="w-full">{p.ctaLabel}</BtnPrimary>
                ) : (
                  <BtnSecondary className="w-full">{p.ctaLabel}</BtnSecondary>
                )}
              </Link>
              <ul className="mt-7 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-muted-foreground">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <Check className="h-3 w-3 text-secondary-foreground" aria-hidden="true" />
                    </span>
                    <span className="leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pt-20 md:px-6 md:pt-24">
        <SectionHeading>Common questions</SectionHeading>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {FAQ.map(([q, a]) => (
            <div key={q} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h3 className="text-sm font-semibold">{q}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-5 md:mt-28 md:px-6">
        <div className="bg-gradient-hero flex flex-col gap-6 rounded-3xl px-6 py-12 text-center md:px-12 md:py-16">
          <h2 className="text-3xl font-semibold tracking-tight text-primary-foreground md:text-4xl">
            Not sure which plan fits?
          </h2>
          <p className="mx-auto max-w-lg text-sm text-primary-foreground/80 md:text-base">
            Book a fifteen-minute walkthrough and we will map your accounts, debts and goals with you.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={DEMO_URL}><BtnSecondary>Book a demo</BtnSecondary></a>
            <Link to="/features"><BtnSecondary>Compare features</BtnSecondary></Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
