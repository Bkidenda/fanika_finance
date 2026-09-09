/**
 * Device mockups for the marketing site.
 * Every screen is rendered with the real Fanika design tokens so the phone
 * always shows an authentic interface rather than a stock screenshot.
 */
import type { ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, Home, PieChart, Sparkles, Target, Wallet } from "lucide-react";

/* ── Frame ─────────────────────────────────────────────────────────────── */

export function PhoneFrame({
  children,
  className = "",
  label = "Fanika app preview",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`device-shadow relative w-[280px] shrink-0 rounded-[2.25rem] border border-border bg-foreground/90 p-2 sm:w-[320px] ${className}`}
    >
      <div className="relative overflow-hidden rounded-[1.85rem] bg-background">
        <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="h-1.5 w-4 rounded-full bg-border" />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

function TabBar({ active = 0 }: { active?: number }) {
  const tabs = [
    { icon: Home, label: "Home" },
    { icon: Wallet, label: "Money" },
    { icon: Target, label: "Goals" },
    { icon: PieChart, label: "Insights" },
  ];
  return (
    <div className="mt-4 grid grid-cols-4 border-t border-border bg-card px-2 py-2.5">
      {tabs.map((t, i) => (
        <div
          key={t.label}
          className={`flex flex-col items-center gap-1 text-[9px] font-semibold ${
            i === active ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <t.icon className="h-4 w-4" />
          {t.label}
        </div>
      ))}
    </div>
  );
}

const K = (n: number) => `KES ${n.toLocaleString("en-KE")}`;

/* ── Screens ───────────────────────────────────────────────────────────── */

export function ScreenOverview() {
  return (
    <div className="px-4 pb-1">
      <p className="mt-2 text-[10px] font-medium text-muted-foreground">Good morning, Brian</p>
      <h4 className="text-[13px] font-semibold">Here&apos;s how your money is doing</h4>

      <div className="mt-3 rounded-2xl bg-gradient-primary p-4 text-primary-foreground">
        <p className="text-[9px] font-semibold uppercase tracking-widest opacity-80">Total balance</p>
        <p className="num mt-1 text-2xl font-semibold">{K(124500)}</p>
        <p className="mt-1 text-[10px] opacity-90">+8.4% this month</p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ["Income", 180000],
          ["Spent", 72500],
          ["Saved", 48000],
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border border-border bg-card p-2">
            <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">{l}</p>
            <p className="num mt-0.5 text-[11px] font-semibold">{(v as number).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold">Financial health</p>
          <p className="num text-[10px] font-semibold text-primary">78/100</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[78%] rounded-full bg-primary" />
        </div>
        <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground">
          Your savings rate improved this month.
        </p>
      </div>

      <div className="mt-3 flex items-end gap-1.5">
        {[38, 52, 44, 66, 58, 74, 62].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md"
            style={{ height: h, backgroundColor: i === 5 ? "var(--chart-1)" : "var(--chart-2)", opacity: i === 5 ? 1 : 0.45 }}
          />
        ))}
      </div>
      <TabBar active={0} />
    </div>
  );
}

export function ScreenTransactions() {
  const rows = [
    ["Carrefour", "Groceries", -4850],
    ["Salary — August", "Income", 180000],
    ["KPLC tokens", "Utilities", -1500],
    ["Emergency fund", "Savings", -10000],
    ["Bolt", "Transport", -640],
  ] as const;
  return (
    <div className="px-4 pb-1">
      <h4 className="mt-2 text-[13px] font-semibold">Money tracker</h4>
      <div className="mt-2 flex gap-1.5">
        {["All", "Income", "Expenses"].map((t, i) => (
          <span
            key={t}
            className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${
              i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {rows.map(([name, cat, amt]) => (
          <div key={name} className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                amt > 0 ? "bg-secondary text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              {amt > 0 ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[10px] font-semibold">{name}</span>
              <span className="block text-[8px] text-muted-foreground">{cat} · Today</span>
            </span>
            <span className={`num text-[10px] font-semibold ${amt > 0 ? "text-primary" : "text-foreground"}`}>
              {amt > 0 ? "+" : "−"}
              {Math.abs(amt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      <TabBar active={1} />
    </div>
  );
}

export function ScreenBudgets() {
  const rows = [
    ["Housing", 25000, 30000],
    ["Food", 18500, 20000],
    ["Transport", 7200, 10000],
    ["Entertainment", 9800, 10000],
  ] as const;
  return (
    <div className="px-4 pb-1">
      <h4 className="mt-2 text-[13px] font-semibold">August budget</h4>
      <div className="mt-3 rounded-2xl border border-border bg-card p-3">
        <p className="num text-lg font-semibold">{K(85000)}</p>
        <p className="text-[9px] text-muted-foreground">{K(58200)} spent · 68% used</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[68%] rounded-full bg-primary" />
        </div>
      </div>
      <div className="mt-3 space-y-2.5">
        {rows.map(([name, spent, cap]) => {
          const pct = Math.min(100, Math.round((spent / cap) * 100));
          const tone = pct >= 95 ? "var(--warning)" : "var(--chart-1)";
          return (
            <div key={name}>
              <div className="flex items-baseline justify-between text-[9px]">
                <span className="font-semibold">{name}</span>
                <span className="num text-muted-foreground">
                  {spent.toLocaleString()} / {cap.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: tone }} />
              </div>
              <p className="mt-1 text-[8px] text-muted-foreground">
                {pct >= 95 ? "Approaching limit" : "Healthy"}
              </p>
            </div>
          );
        })}
      </div>
      <TabBar active={1} />
    </div>
  );
}

export function ScreenGoals() {
  return (
    <div className="px-4 pb-1">
      <h4 className="mt-2 text-[13px] font-semibold">Emergency fund</h4>
      <div className="mt-3 flex flex-col items-center rounded-2xl border border-border bg-card p-4">
        <div
          className="relative flex h-28 w-28 items-center justify-center rounded-full"
          style={{ background: "conic-gradient(var(--chart-1) 0 50%, var(--muted) 50% 100%)" }}
        >
          <div className="flex h-[5.5rem] w-[5.5rem] flex-col items-center justify-center rounded-full bg-card">
            <p className="num text-lg font-semibold">50%</p>
            <p className="text-[8px] text-muted-foreground">of target</p>
          </div>
        </div>
        <p className="num mt-3 text-[11px] font-semibold">
          {K(75000)} <span className="text-muted-foreground">/ {K(150000)}</span>
        </p>
        <p className="text-[9px] text-muted-foreground">Target: December 2026</p>
        <span className="mt-3 rounded-full bg-primary px-3 py-1.5 text-[9px] font-semibold text-primary-foreground">
          Add money
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {[
          ["School fees", 62],
          ["Land deposit", 24],
        ].map(([n, p]) => (
          <div key={n as string} className="rounded-xl border border-border bg-card p-2.5">
            <div className="flex justify-between text-[9px] font-semibold">
              <span>{n}</span>
              <span className="num text-muted-foreground">{p}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-chart-2" style={{ width: `${p}%` }} />
            </div>
          </div>
        ))}
      </div>
      <TabBar active={2} />
    </div>
  );
}

export function ScreenInsights() {
  const cards = [
    ["You spent more on dining", "Dining rose 24% versus last month.", "View spending"],
    ["You're close to a goal", "KES 8,500 away from your target.", "Add contribution"],
    ["Transport is improving", "Down 11% this month. Keep going.", "See trend"],
  ] as const;
  return (
    <div className="px-4 pb-1">
      <h4 className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold">
        <Sparkles className="h-3.5 w-3.5 text-primary" /> Insights
      </h4>
      <div className="mt-3 space-y-2.5">
        {cards.map(([t, d, cta]) => (
          <div key={t} className="rounded-2xl border border-border bg-card p-3">
            <p className="text-[10px] font-semibold leading-snug">{t}</p>
            <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">{d}</p>
            <p className="mt-2 text-[9px] font-semibold text-primary">{cta} →</p>
          </div>
        ))}
      </div>
      <TabBar active={3} />
    </div>
  );
}

/* ── Floating supporting UI ─────────────────────────────────────────────── */

export function FloatingCard({
  title,
  value,
  note,
  className = "",
}: {
  title: string;
  value: string;
  note?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-2xl border border-border bg-card/95 p-3.5 shadow-card backdrop-blur ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
      <p className="num mt-1 text-lg font-semibold">{value}</p>
      {note && <p className="mt-0.5 text-[11px] text-primary">{note}</p>}
    </div>
  );
}

/** Wide desktop dashboard mock for full-bleed showcase sections. */
export function DesktopFrame({ className = "" }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Fanika dashboard on desktop"
      className={`device-shadow overflow-hidden rounded-3xl border border-border bg-card ${className}`}
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-muted px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-border" />
        <span className="h-2 w-2 rounded-full bg-border" />
        <span className="h-2 w-2 rounded-full bg-border" />
        <span className="ml-3 text-[10px] font-medium text-muted-foreground">fanika.app / overview</span>
      </div>
      <div className="grid grid-cols-[128px_1fr] sm:grid-cols-[168px_1fr]">
        <aside className="space-y-1.5 border-r border-border bg-card p-3">
          {["Overview", "Transactions", "Budgets", "Goals", "Debts", "Insights", "Reports"].map((n, i) => (
            <p
              key={n}
              className={`truncate rounded-lg px-2.5 py-1.5 text-[10px] font-medium ${
                i === 0 ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
              }`}
            >
              {n}
            </p>
          ))}
        </aside>
        <div className="p-4 sm:p-6">
          <p className="text-[11px] text-muted-foreground">Good morning, Brian</p>
          <h4 className="mt-0.5 text-sm font-semibold sm:text-base">You saved {K(32700)} this month</h4>
          <p className="text-[11px] text-muted-foreground">That&apos;s 27% of your income.</p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Total balance", "124,500", "+8.4%"],
              ["Income", "180,000", "+12%"],
              ["Expenses", "72,500", "−4%"],
              ["Savings", "48,000", "+9%"],
            ].map(([l, v, d]) => (
              <div key={l} className="rounded-2xl border border-border p-3">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{l}</p>
                <p className="num mt-1 text-sm font-semibold sm:text-base">{v}</p>
                <p className="text-[9px] text-primary">{d}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-2xl border border-border p-3">
              <p className="text-[10px] font-semibold">Budget vs actual</p>
              <div className="mt-3 flex h-24 items-end gap-2">
                {[
                  [70, 54],
                  [82, 76],
                  [58, 62],
                  [90, 71],
                  [66, 40],
                  [76, 68],
                ].map(([a, b], i) => (
                  <div key={i} className="flex flex-1 items-end gap-0.5">
                    <div className="flex-1 rounded-t bg-chart-2/50" style={{ height: `${a}%` }} />
                    <div className="flex-1 rounded-t bg-chart-1" style={{ height: `${b}%` }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border p-3">
              <p className="text-[10px] font-semibold">Where money went</p>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className="h-16 w-16 rounded-full"
                  style={{
                    background:
                      "conic-gradient(var(--chart-1) 0 42%, var(--chart-2) 42% 66%, var(--chart-3) 66% 84%, var(--chart-4) 84% 100%)",
                  }}
                />
                <div className="space-y-1 text-[9px] text-muted-foreground">
                  {["Housing 42%", "Food 24%", "Transport 18%", "Other 16%"].map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Story visual ──────────────────────────────────────────────────────────
   A flat card presentation used for the storytelling sections so the home
   page keeps only two full device mockups. */

export function StoryVisual({
  heading,
  rows,
  footNote,
  className = "",
}: {
  heading: string;
  rows: { label: string; value: string; pct: number }[];
  footNote?: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={heading}
      className={`w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-elevated ${className}`}
    >
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{heading}</p>
      <div className="mt-5 space-y-4">
        {rows.map((r, i) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">{r.label}</span>
              <span className="num font-semibold">{r.value}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, r.pct)}%`, backgroundColor: `var(--chart-${(i % 8) + 1})` }}
              />
            </div>
          </div>
        ))}
      </div>
      {footNote && <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{footNote}</p>}
    </div>
  );
}
