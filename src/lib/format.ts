export function formatCurrency(amount: number, currency = "KES") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `${currency} ${(amount || 0).toLocaleString()}`;
  }
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n || 0);
}

export function formatPercent(n: number, digits = 1) {
  return `${(n || 0).toFixed(digits)}%`;
}

export function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function monthLabel(d = new Date()) {
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

// Local-date YYYY-MM-DD (NEVER use toISOString().slice(0,10) — it shifts dates by TZ).
export function isoLocalDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
