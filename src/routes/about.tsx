import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Nuru Steward" },
      { name: "description", content: "Nuru Steward is a personal finance OS built for disciplined households in Africa and beyond." },
      { property: "og:title", content: "About — Nuru Steward" },
      { property: "og:description", content: "Built for disciplined households in Africa and beyond." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium text-primary">About</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Stewardship made operational.</h1>
        <div className="prose prose-neutral mt-8 max-w-none text-muted-foreground">
          <p>Nuru Steward exists for the household that wants to take faithful stewardship seriously — not as a Sunday idea, but as a daily operating system.</p>
          <p>We started by asking a simple question: what would personal finance look like if tithing wasn't an afterthought, if family obligations were budgeted instead of guessed, and if every shilling was visible across every account?</p>
          <p>The answer is what you see here. A salary breakdown that respects Kenya's statutory reality. Budgets that group around how real households actually spend. A monthly close so the past is reconciled before the next month begins. And devotional context, because numbers without wisdom is just spreadsheets.</p>
          <p>We're building this in the open, for users who want to govern — not just track — their finances.</p>
        </div>
      </section>
    </PublicLayout>
  );
}
