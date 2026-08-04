import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const SEGMENTS = [
  { key: "giving", label: "Giving", color: "var(--gold)", rate: 0.1 },
  { key: "savings", label: "Savings", color: "var(--slate-blue)", rate: 0.2 },
  { key: "debt", label: "Debt payoff", color: "var(--clay)", rate: 0.15 },
  { key: "living", label: "Living & goals", color: "var(--leaf)", rate: 0.55 },
] as const;

const R = 70;
const C = 2 * Math.PI * R;

/**
 * Live allocation calculator — type an income and watch the donut redistribute
 * across the four palette colours.
 */
export function AllocationCalculator() {
  const reduced = useReducedMotion();
  const [income, setIncome] = useState(120000);
  const [giving, setGiving] = useState(10);
  const [savings, setSavings] = useState(20);
  const [debt, setDebt] = useState(15);

  const rates = useMemo(() => {
    const g = Math.min(giving, 100) / 100;
    const s = Math.min(savings, 100 - giving) / 100;
    const d = Math.min(debt, Math.max(0, 100 - giving - savings)) / 100;
    const living = Math.max(0, 1 - g - s - d);
    return [g, s, d, living];
  }, [giving, savings, debt]);

  let offset = 0;
  const arcs = rates.map((rate, i) => {
    const len = C * rate;
    const arc = { color: SEGMENTS[i].color, len, offset };
    offset += len;
    return arc;
  });

  return (
    <div className="grid gap-8 rounded-2xl border border-ink-line bg-ink-soft/70 p-6 md:grid-cols-[1fr_auto] md:p-8">
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="calc-income" className="text-ink-muted">
            Monthly net income (KES)
          </Label>
          <Input
            id="calc-income"
            type="number"
            min={0}
            step={1000}
            value={income}
            onChange={(e) => setIncome(Math.max(0, Number(e.target.value) || 0))}
            className="border-ink-line bg-ink text-lg font-semibold tabular-nums text-ink-fg"
          />
        </div>

        {(
          [
            ["Giving", giving, setGiving, "var(--gold)"],
            ["Savings", savings, setSavings, "var(--slate-blue)"],
            ["Debt payoff", debt, setDebt, "var(--clay)"],
          ] as const
        ).map(([label, val, set, color]) => (
          <div key={label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ink-fg">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                {label}
              </span>
              <span className="tabular-nums text-ink-muted">{val}%</span>
            </div>
            <Slider
              value={[val]}
              onValueChange={([v]) => set(v)}
              min={0}
              max={60}
              step={1}
              aria-label={`${label} percentage`}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center gap-4">
        <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="Allocation breakdown donut chart">
          <circle cx="100" cy="100" r={R} fill="none" stroke="var(--ink-line)" strokeWidth="18" />
          {arcs.map((a, i) => (
            <motion.circle
              key={SEGMENTS[i].key}
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke={a.color}
              strokeWidth="18"
              strokeLinecap="butt"
              transform="rotate(-90 100 100)"
              initial={false}
              animate={{ strokeDasharray: `${a.len} ${C}`, strokeDashoffset: -a.offset }}
              transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 130, damping: 20 }}
            />
          ))}
          <text x="100" y="95" textAnchor="middle" className="fill-ink-muted" style={{ fontSize: 11 }}>
            Living & goals
          </text>
          <text x="100" y="118" textAnchor="middle" className="fill-ink-fg" style={{ fontSize: 20, fontWeight: 700 }}>
            {Math.round(rates[3] * 100)}%
          </text>
        </svg>

        <ul className="w-full space-y-1.5 text-sm">
          {SEGMENTS.map((s, i) => (
            <li key={s.key} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 text-ink-muted">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="tabular-nums font-semibold text-ink-fg">
                {Math.round(income * rates[i]).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
