import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { CountUp } from "./motion";

const BARS = [
  { label: "Giving", pct: 0.16, color: "var(--gold)" },
  { label: "Housing", pct: 0.94, color: "var(--leaf)" },
  { label: "Debt payoff", pct: 0.62, color: "var(--clay)" },
  { label: "Savings", pct: 0.78, color: "var(--slate-blue)" },
  { label: "Family support", pct: 0.44, color: "var(--gold-soft)" },
];

/**
 * Scroll-linked ledger mockup — bars and rings fill as the section passes the
 * viewport, so the page demonstrates the product on itself.
 */
export function LedgerMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 40%"] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  const ringLen = useTransform(p, (v) => `${Math.round(v * 100 * 2.51)} 251`);

  return (
    <div ref={ref} className="rounded-2xl border border-ink-line bg-ink-soft/80 p-6 shadow-elevated md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Live ledger · June 2026</div>
          <div className="mt-1 text-2xl font-semibold text-ink-fg md:text-3xl">
            <CountUp to={1284600} prefix="KES " />
          </div>
          <div className="text-xs text-ink-muted">Net worth across 6 accounts</div>
        </div>
        <svg width="86" height="86" viewBox="0 0 90 90" aria-hidden>
          <circle cx="45" cy="45" r="40" fill="none" stroke="var(--ink-line)" strokeWidth="8" />
          <motion.circle
            cx="45"
            cy="45"
            r="40"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="8"
            strokeLinecap="round"
            transform="rotate(-90 45 45)"
            style={reduced ? { strokeDasharray: "213 251" } : { strokeDasharray: ringLen }}
          />
          <text x="45" y="50" textAnchor="middle" className="fill-ink-fg" style={{ fontSize: 17, fontWeight: 700 }}>
            85
          </text>
        </svg>
      </div>

      <div className="mt-7 space-y-4">
        {BARS.map((b, i) => (
          <div key={b.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">{b.label}</span>
              <span className="tabular-nums text-ink-fg">{Math.round(b.pct * 100)}% of plan</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-line">
              <motion.div
                className="h-full rounded-full"
                style={{ background: b.color, transformOrigin: "0% 50%" }}
                initial={reduced ? { scaleX: b.pct } : { scaleX: 0 }}
                whileInView={{ scaleX: b.pct }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.7, delay: 0.06 * i, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7 grid grid-cols-3 gap-3">
        {[
          { l: "Debt cleared", v: 386000, c: "var(--clay)" },
          { l: "Given YTD", v: 168400, c: "var(--gold)" },
          { l: "Saved YTD", v: 420000, c: "var(--slate-blue)" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-ink-line bg-ink/70 p-3">
            <div className="text-[10px] uppercase tracking-wider text-ink-muted">{k.l}</div>
            <div className="mt-1 text-sm font-semibold tabular-nums" style={{ color: k.c }}>
              <CountUp to={k.v} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
