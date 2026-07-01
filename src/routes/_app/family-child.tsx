import { createFileRoute, Link } from "@tanstack/react-router";
import { useProfile } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import { Progress } from "@/components/ui/progress";
import { Heart, PiggyBank, Sparkles, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/family-child")({ component: ChildView });

const LESSONS = [
  "Save first, spend second. Always set aside part of what you receive before spending anything.",
  "A little saved every week adds up to a lot by the end of the year.",
  "Wants and needs are different. Needs come first.",
  "Giving is a joyful habit — start small and be consistent.",
  "Ask 'do I really need this?' before every purchase.",
  "Money you save today gives you choices tomorrow.",
  "Track everything you spend for a week — you'll be surprised.",
  "Compare prices before you buy. Patience saves money.",
  "Borrowing turns fun things into stressful things. Save up instead.",
  "Small daily habits build big financial character.",
  "Be generous — share with someone who has less than you.",
  "Every shilling has a job: save, give, or spend on purpose.",
];

const RECENT: { label: string; emoji: string; amount: number }[] = [
  { label: "Snack", emoji: "🍔", amount: 120 },
  { label: "Bus", emoji: "🚌", amount: 60 },
  { label: "Game", emoji: "🎮", amount: 250 },
];

function ChildView() {
  const profile = useProfile();
  const currency = profile.data?.currency ?? "KES";
  const lesson = LESSONS[new Date().getDate() % LESSONS.length];

  return (
    <div className="mx-auto max-w-md space-y-5">
      <Link to="/family" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to family
      </Link>

      <div className="rounded-3xl bg-gradient-to-br from-[oklch(0.55_0.15_175)] to-[oklch(0.35_0.10_240)] p-6 text-white shadow-elevated">
        <div className="text-xs uppercase tracking-widest opacity-80">My Money</div>
        <div className="mt-2 text-4xl font-bold tabular-nums">{formatCurrency(1250, currency)}</div>
        <p className="mt-1 text-sm opacity-80">Your pocket money balance</p>
      </div>

      <div className="rounded-3xl border bg-card p-5 shadow-card">
        <div className="flex items-center gap-2 text-sm font-semibold"><PiggyBank className="h-4 w-4 text-primary" /> My Savings Goal</div>
        <div className="mt-2 text-lg font-semibold">New Bicycle</div>
        <div className="mt-1 text-sm text-muted-foreground tabular-nums">{formatCurrency(800, currency)} of {formatCurrency(4000, currency)}</div>
        <Progress value={20} className="mt-3 h-3" />
      </div>

      <div className="rounded-3xl border bg-card p-5 shadow-card">
        <div className="text-sm font-semibold">My Spending</div>
        <ul className="mt-3 divide-y">
          {RECENT.map((r) => (
            <li key={r.label} className="flex items-center justify-between py-3 text-base">
              <span className="flex items-center gap-3"><span className="text-2xl">{r.emoji}</span> {r.label}</span>
              <span className="font-semibold tabular-nums">{formatCurrency(r.amount, currency)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-3xl border bg-rose-50 p-5 shadow-card">
        <div className="flex items-center gap-2 text-sm font-semibold text-rose-700"><Heart className="h-4 w-4" /> My Giving</div>
        <div className="mt-2 text-2xl font-bold tabular-nums text-rose-700">{formatCurrency(150, currency)}</div>
        <p className="text-sm text-rose-600/80">Given this month</p>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-amber-100 to-amber-50 p-5 shadow-card">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-800"><Sparkles className="h-4 w-4" /> Money Lesson of the Week</div>
        <p className="mt-2 text-base leading-relaxed text-amber-900">{lesson}</p>
      </div>
    </div>
  );
}
