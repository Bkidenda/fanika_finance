
Grouped into workstreams. I'll ship top-to-bottom unless you reorder.

## A. Leftovers from previous turn
1. **Per-income tithe override checkbox** on `/income-entries` form — defaults to profile `tithe_enabled`, writes to `income_entries.tithe_on` (column already exists). Dashboard tithe math sums only entries where `tithe_on = true` (or all when profile default is on and `tithe_on IS NULL`).
2. **Inline close-prompt** on `/expenses` and `/income-entries` when the entered date falls in a future month while the current month is still open — non-blocking banner with [Close current month] [Continue anyway].

## B. Navbar
- Push CTAs (`Sign in`, `Get started`) to the far right of the floating pill in `public-layout.tsx`. Page links stay center-left.

## C. Calendar timezone bug
- Root cause: `new Date("2026-06-02")` is parsed as UTC midnight, then rendered in local TZ (UTC+3 KE) → shifts to next day in some pickers, and the grid cell math compares with local-midnight dates.
- Fix: store as plain `YYYY-MM-DD` string, build day cells from `Date.UTC(y, m, d)`, compare with same UTC-anchored keys. No `toISOString().slice(0,10)` on local Date objects.

## D. Carry-over on month close
- `closeMonth` already does NOT touch `subscriptions`, `debts`, `accounts`, `investments` (they are global, not month-scoped). Verify and document with a comment. Add explicit test snippet in the closure result. No data change needed — they already persist.

## E. Edit budgets & expenses
- `/budgets`: inline edit limit_amount (click amount → input → save).
- `/expenses`: row "Edit" opens dialog with amount/category/date/account/description/is_emergency. Triggers `expenses_sync_account` correctly (UPDATE path already balances both deltas).

## F. Money tracker
- New `/tracker` route (added to sidebar under "Insights"). Shows: running balance per account day-by-day, income vs expenses line chart for the current month, category split donut. Pure read-only; pulls from `income_entries`, `expenses`, `account_transactions`, `debt_payments`.

## G. AI advisor — drop settings dependency
- Already updated to read snapshot from current month + history. Remove any stale reference to `incomes`/`profiles.net_income` in `src/lib/queries.ts` advisor context. Income for advisor = sum of `income_entries` in the period. Verify `runAdvisor` prompt + the advisor page UI no longer mentions "income from settings".

## H. Hero image + remove tithe from marketing
- Landing hero: drop the "Tithe" chip + any tithe wording in copy. Use the originally uploaded founder photo at native res. Make the photo container span full right column height (`h-full object-cover` inside an aspect-free flex pane) so no whitespace remains.
- Pricing/Features/How-it-works: keep "Optional tithe" as a feature note (it's a real toggle), but not in hero.

## I. Multi-currency + CBK converter
- Add `profiles.display_currency` (already have `currency`; rename concept: `currency` = base currency, add `display_currency` for viewing). Each money-bearing row keeps its own `currency` (accounts already have it; add to `income_entries`, `expenses`, `debts`, `investments`).
- New server fn `getRates` that fetches CBK indicative rates JSON daily and caches in a new `fx_rates` table (date, base, quote, rate). Source: `https://www.centralbank.go.ke/rates/forex-exchange-rates/` (HTML scrape) — fallback to `exchangerate.host` if CBK fails.
- `formatCurrency(amount, from, to)` helper converts on-the-fly using the latest rate.
- Profile setting: "Display all amounts in: [KES/USD/EUR/GBP/UGX/TZS]".

## J. Transaction fees
- New `transaction_fee` numeric column on `expenses` and `account_transactions`. Trigger `expenses_sync_account` updated: balance delta = `-(amount + fee)`. Trigger `account_transactions_sync` for transfers: source debited by `amount + fee`, destination credited by `amount`.
- Forms gain optional "Transaction cost" field.

## K. Debt payment ⇒ auto-expense + auto-archive
- Trigger `debt_payments_after_insert`: reduces `debts.balance` by amount, AND inserts a row into `expenses` (category="Loans / Debt repayment", account_id=payment account, amount=payment, description=`Debt: <debt name>`, with a marker column `source_debt_payment_id` so the existing `expenses_sync_account` is the SOLE balance adjuster (we'll drop the current direct balance adjust in `debt_payments_sync_account` to avoid double-debit).
- When `debts.balance <= 0`: set `debts.archived_at = now()`. UI: archived debts hidden from `/debts` main list, shown under `/history` "Settled debts".

## L. Cross-month entries (record May income in June)
- Remove any "date must be in current month" guard on `/income-entries` and `/expenses`. Allow any date. The period an entry belongs to = its `date`'s month, period. So a 31-May income recorded after June opens still belongs to May's bucket. Already true at the DB level — just verify no UI filter blocks it. Add a small note: "Entries are grouped by transaction date, not entry date."

## M. Mobile bank-app shell
- When `useIsMobile()` and inside `_app`: render a bottom tab bar with 5 tabs — Home (Dashboard), Money (Tracker), Add (FAB → quick income/expense/transfer), Plan (Budgets), Profile (Settings). Hide the sidebar entirely on mobile. Header becomes a sticky compact bar with avatar + title only.
- Public site mobile: hide footer.

## Technical notes
- One migration: `display_currency`, `fx_rates` table + GRANTs + RLS (rates are public-read for authenticated users), `transaction_fee` columns, `debts.archived_at`, `expenses.source_debt_payment_id`, updated triggers.
- Hero asset: re-use existing `src/assets/founder-white.jpg`, just remove the size constraint.
- Money tracker uses existing `recharts`.
- FX cache: 1 row per (date, base, quote). Refresh once a day on first request.

## Confirmations
1. OK to use CBK indicative rates with `exchangerate.host` fallback?
2. For multi-currency: store each row's native currency, convert on display only — OK?
3. Mobile bottom-nav tabs: **Home / Money / + / Plan / Profile** — confirm or swap.

Reply "go" (or with answers) and I'll ship.
