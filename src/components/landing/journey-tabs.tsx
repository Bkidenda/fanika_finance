import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Coins, HandCoins, CreditCard, Sprout } from "lucide-react";

const STEPS = [
  {
    key: "income",
    label: "Income logged",
    icon: Coins,
    color: "var(--leaf)",
    title: "Salary lands, and the month opens itself",
    body: "Log the deposit once. Fanika files it to the right month, splits your commitments and updates every balance instantly.",
    rows: [
      ["Salary — Equity", "+120,000"],
      ["Side consulting", "+18,500"],
      ["Net for the month", "138,500"],
    ],
  },
  {
    key: "giving",
    label: "Giving set aside",
    icon: HandCoins,
    color: "var(--gold)",
    title: "Giving is computed before anything is spendable",
    body: "Tithe and offerings are calculated off net income first, so what's left is genuinely disposable — not borrowed from a promise.",
    rows: [
      ["Tithe (10%)", "13,850"],
      ["Offerings", "2,000"],
      ["Disposable after giving", "122,650"],
    ],
  },
  {
    key: "debt",
    label: "Debt updated",
    icon: CreditCard,
    color: "var(--clay)",
    title: "Every repayment moves three places at once",
    body: "Record one payment: the loan balance drops, the paying account reduces, and the expense books itself under debt repayment.",
    rows: [
      ["Car loan balance", "(412,000)"],
      ["Payment recorded", "24,000"],
      ["New balance", "(388,000)"],
    ],
  },
  {
    key: "growth",
    label: "Savings grown",
    icon: Sprout,
    color: "var(--slate-blue)",
    title: "What's left compounds where you told it to",
    body: "Goals, SACCO, money-market and emergency fund all roll up into one net-worth line that grows month over month.",
    rows: [
      ["Emergency fund", "310,000"],
      ["Investments", "946,400"],
      ["Net worth trend", "+12.4%"],
    ],
  },
] as const;

/** Auto-advancing "day in the life" switcher with manual tabs. */
export function JourneyTabs() {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || reduced) return;
    const t = setInterval(() => setI((v) => (v + 1) % STEPS.length), 5200);
    return () => clearInterval(t);
  }, [paused, reduced]);

  const step = STEPS[i];

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div role="tablist" aria-label="A day with Fanika" className="flex flex-wrap gap-2">
        {STEPS.map((s, idx) => (
          <button
            key={s.key}
            role="tab"
            aria-selected={i === idx}
            onClick={() => setI(idx)}
            className={`magnetic flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
              i === idx
                ? "border-gold/50 bg-gold/10 text-ink-fg"
                : "border-ink-line text-ink-muted hover:border-gold/30 hover:text-ink-fg"
            }`}
          >
            <s.icon className="h-4 w-4" style={{ color: s.color }} />
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 rounded-2xl border border-ink-line bg-ink-soft/70 p-6 md:grid-cols-2 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.key}
            initial={reduced ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-xs uppercase tracking-[0.18em]" style={{ color: step.color }}>
              {step.label}
            </div>
            <h3 className="mt-3 text-xl font-semibold text-ink-fg md:text-2xl">{step.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">{step.body}</p>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.ul
            key={`${step.key}-rows`}
            initial={reduced ? undefined : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="divide-y divide-ink-line rounded-xl border border-ink-line bg-ink/70"
          >
            {step.rows.map(([k, v]) => (
              <li key={k} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-ink-muted">{k}</span>
                <span className="tabular-nums font-semibold text-ink-fg">{v}</span>
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>
    </div>
  );
}
