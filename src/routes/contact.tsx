import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Mail, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Nuru Steward" },
      { name: "description", content: "Get in touch with the Nuru Steward team." },
      { property: "og:title", content: "Contact — Nuru Steward" },
      { property: "og:description", content: "Reach the Nuru Steward team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium text-primary">Contact</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">We'd love to hear from you.</h1>
        <p className="mt-4 text-lg text-muted-foreground">Questions, feature requests, or stewardship feedback — drop us a line.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <a href="mailto:hello@nurusteward.com" className="flex items-center gap-4 rounded-2xl border bg-card p-6 shadow-card transition hover:shadow-elevated">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><Mail className="h-5 w-5" /></div>
            <div>
              <div className="font-semibold">Email</div>
              <div className="text-sm text-muted-foreground">hello@nurusteward.com</div>
            </div>
          </a>
          <div className="flex items-center gap-4 rounded-2xl border bg-card p-6 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><MessageCircle className="h-5 w-5" /></div>
            <div>
              <div className="font-semibold">Community</div>
              <div className="text-sm text-muted-foreground">Coming soon</div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
