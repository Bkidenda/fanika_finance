import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout, ContactForm, BtnPrimary, BtnSecondary, SectionHeading, Eyebrow, DEMO_URL } from "@/components/public-layout";
import { FloatingCard, PhoneFrame, ScreenOverview } from "@/components/marketing/device";
import { IMG } from "@/lib/site-images";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Fanika — Who we build for" },
      {
        name: "description",
        content:
          "Fanika is a personal finance platform for people who want money management to be a dependable habit. Meet the team and get in touch.",
      },
      { property: "og:title", content: "About Fanika — Who we build for" },
      { property: "og:description", content: "Why we built Fanika, how we think about money, and how to reach us." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: IMG.team },
      { name: "twitter:image", content: IMG.team },
    ],
  }),
  component: About,
});

const PRINCIPLES = [
  ["One place", "Accounts, budgets, debts, goals and reports in a single reconciled view."],
  ["Monthly rhythm", "Plan before the month starts, close it when it ends."],
  ["Private by design", "Your data is yours — export it or delete it at any time."],
  ["Real support", "Talk to a person, not a ticket queue."],
];

function About() {
  return (
    <PublicLayout>
      <section className="bg-sage-field">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-14 pb-16 md:grid-cols-[1.05fr_0.95fr] md:px-6 md:pt-20 md:pb-20">
          <div className="rise">
            <Eyebrow>About Fanika</Eyebrow>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-[3.2rem] md:leading-[1.05]">
              Financial clarity, made practical
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              We build for households that want an honest number and a sensible next action — not another
              spreadsheet nobody updates after week two.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/signup"><BtnPrimary>Start free</BtnPrimary></Link>
              <a href={DEMO_URL}><BtnSecondary>Talk to us</BtnSecondary></a>
            </div>
          </div>
          <div className="relative flex justify-center md:justify-end">
            <PhoneFrame label="Fanika overview screen"><ScreenOverview /></PhoneFrame>
            <FloatingCard
              title="Savings rate"
              value="27%"
              note="Up 4 pts this month"
              className="absolute -bottom-4 left-0 hidden w-40 lg:block"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pt-16 md:px-6 md:pt-24">
        <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
          <div>
            <SectionHeading>Why we built it</SectionHeading>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              <p>
                Fanika began with a simple frustration: money decisions are made from partial
                information. One balance in a banking app, another in a mobile wallet, a loan somewhere
                on paper, and a budget in a spreadsheet nobody maintains.
              </p>
              <p>
                So we built one place where every account, obligation and goal lives together. Income is
                recorded as it arrives, budgets are planned before the month starts, standing commitments
                carry forward, and each month closes with a reconciled snapshot you can print.
              </p>
              <p>
                We are not trying to gamify saving. Fanika is designed for people who want a dependable
                operating habit — a clear picture, an honest number, and a sensible next step.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {PRINCIPLES.map(([t, d]) => (
                <div key={t} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="text-sm font-semibold">{t}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-card md:p-7">
            <h2 className="text-2xl font-semibold tracking-tight">Contact us</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Questions about plans, migrating your records, or the Family Suite? Send a note.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-5 md:mt-28 md:px-6">
        <div className="bg-gradient-hero flex flex-col gap-6 rounded-3xl px-6 py-12 text-center md:px-12 md:py-16">
          <h2 className="text-3xl font-semibold tracking-tight text-primary-foreground md:text-4xl">
            Your first reconciled month is closer than you think
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/signup"><BtnSecondary>Create account</BtnSecondary></Link>
            <Link to="/how-it-works"><BtnSecondary>See how it works</BtnSecondary></Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
