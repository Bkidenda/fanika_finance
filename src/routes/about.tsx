import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout, ContactForm } from "@/components/public-layout";
import { IMG } from "@/lib/site-images";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Fanika — Who we build for" },
      { name: "description", content: "Fanika is a personal finance platform for people who want money management to be a dependable habit. Meet the team and get in touch." },
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

function About() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-6 pb-8 pt-14 md:pt-20">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">About</h1>
            <p className="mt-4 text-lg text-muted-foreground">Financial clarity, made practical.</p>

            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              <p>
                Fanika began with a simple frustration: money decisions are made from partial
                information. One balance in a banking app, another in a mobile wallet, a loan
                somewhere on paper, and a budget in a spreadsheet nobody updates after week two.
              </p>
              <p>
                So we built one place where every account, obligation and goal lives together.
                Income is recorded as it arrives, budgets are planned before the month starts,
                standing commitments carry forward, and each month closes with a reconciled
                snapshot you can print.
              </p>
              <p>
                We are not trying to gamify saving. Fanika is designed for people who want a
                dependable operating habit — a clear picture, an honest number, and a sensible
                next action.
              </p>
            </div>

            <div className="mt-12">
              <h2 className="text-2xl font-bold tracking-tight">Contact us</h2>
              <p className="mt-2 text-sm text-muted-foreground">Questions about plans, migrations or the family suite? Send a note.</p>
              <ContactForm />
            </div>
          </div>

          <div className="md:pt-6">
            <img
              src={IMG.team}
              alt="The Fanika team reviewing a household financial plan"
              className="aspect-[4/5] w-full rounded-xl object-cover"
              loading="lazy"
            />
            <div className="mt-8 grid grid-cols-2 gap-6">
              {[
                ["One place", "Accounts, budgets, debts, goals and reports in a single reconciled view."],
                ["Monthly rhythm", "Plan before the month starts, close it when it ends."],
                ["Private by design", "Your data is yours — export it or delete it at any time."],
                ["Real support", "Talk to a person, not a ticket queue."],
              ].map(([t, d]) => (
                <div key={t}>
                  <div className="text-sm font-semibold">{t}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
