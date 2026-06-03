
Grouped by area. I will ship in this order.

## 1. Mobile shell
- Keep sidebar as-is (do NOT hide on mobile).
- Add a fixed bottom tab bar in `_app.tsx`, visible only on `md:hidden`: **Dashboard (default) · Income · Expenses · Budget · Accounts**. Active tab highlighted in teal.
- Reduce mobile typography/padding in dashboard cards so figures fit like a bank app (smaller stat numbers, tighter card padding, 2-col grid on xs).
- Auto-close sidebar (`Sheet` / `SidebarProvider` setOpenMobile(false)) when any sidebar nav link is clicked, on both mobile and desktop.

## 2. Auth — username at signup
- Add `username` field to `profiles` (unique, citext-style via lowercase trigger, 3-30 chars, `[a-z0-9_]`).
- `/signup` form: add Username input, validate uniqueness via a server fn `checkUsername`, write to profile after `signUp`.
- Display name across the app pulls from `profiles.username` instead of email prefix. Sidebar footer + dashboard greeting updated.

## 3. Hero image redesign
- Use the newly uploaded portrait at its native aspect (`IMG_2161-Edit~2`). Place on the existing hero-background pane, with the same animated graphics (gradient blobs, floating cards) framing the photo.
- Add an SVG/animated "hand holding tablet with dashboard" graphic beside or behind the portrait — built from primitives (rounded rect tablet + small animated chart bars inside), not a stock image, so it's crisp.
- Background of photo container stays white to blend with landing.

## 4. Settings — remove marketing site
- In `/settings` ("My Profile"), remove any "View marketing site / View landing" links and the public-nav promo block. Keep profile, currency, tithe, danger zone.

## 5. Budgets vs income guard
- On `/budgets` and dashboard: compute `totalBudgeted = sum(limit_amount this month)` and `availableIncome = sum(income_entries this month) - tithe`.
- If `totalBudgeted > availableIncome`: render a red alert banner "Budget exceeds available funds by KSh X" on dashboard + budgets page. Don't hard-block, just warn (some users plan ahead).

## 6. Tithe as a registered transaction (no balance impact)
- New table `tithe_payments (id, user_id, amount, paid_on, account_id NULL, note, created_at)`. Account is optional/informational only — trigger does NOT modify `accounts.balance` (tithe is pre-disposable).
- New page `/tithe` (or section on dashboard) with "Record tithe paid" dialog. Sums show on dashboard "Tithe paid this month vs Tithe budgeted".
- Skip if `profile.tithe_enabled = false`.

## 7. Debt → credits an account
- `/debts` "Add debt" dialog gains a required `account_id` selector ("Deposit into which account?").
- Trigger `debts_after_insert_credit_account`: increments selected `accounts.balance` by debt amount, and writes an `account_transactions` row with type='debt_inflow' so it's traceable. Existing debt-payment trigger is untouched.

## 8. M-Pesa → Ziidi 5% auto-transfer
- Profile setting: "Auto-save % of M-Pesa spend to Ziidi" (default 5, off if no Ziidi account exists).
- When an expense is inserted with `account` whose name contains "M-Pesa" / "Mpesa", trigger calculates `fee = amount * rate / 100`, debits M-Pesa by that fee, credits the user's account named "Ziidi" (case-insensitive). Writes a paired `account_transactions` row tagged 'auto_ziidi'.
- Expense form: when M-Pesa is selected, show inline note "+5% (KSh X) will move to Ziidi savings" with a checkbox to opt-out per-transaction.

## 9. Edit account balance
- `/accounts`: inline-edit balance field per row → writes adjustment via a server fn that updates balance AND inserts an `account_transactions` row type='manual_adjustment' so audit history is preserved.

## 10. Sidebar auto-collapse on nav
- Wrap each sidebar `Link` in a handler that calls `setOpen(false)` / `setOpenMobile(false)` from `useSidebar()`.

## 11. Calendly link
- Replace `DEMO_MAILTO` with `https://calendly.com/bkidenda/30min?back=1&month=2026-06` everywhere it's used in `public-layout.tsx`, pricing, features, how-it-works, hero CTA.

## 12. Weekday spend analytics
- `/insights` and statements: add "Spend by day of week" bar chart (Sun–Sat) computed from `expenses.date` for current month + quarterly view. Use `recharts` Bar.

## Migration
- `profiles.username` (text unique), `profiles.mpesa_autosave_rate` (numeric default 5), `profiles.mpesa_autosave_enabled` (bool default true).
- New table `tithe_payments` with RLS + grants.
- `debts.deposit_account_id` (uuid nullable for legacy rows, required at insert via app).
- Triggers: `debts_credit_account_on_insert`, `expenses_mpesa_autosave` (skips if no Ziidi account or rate=0 or opt-out flag set via new `expenses.skip_autosave` bool).
- `account_transactions.kind` enum extended: 'debt_inflow', 'auto_ziidi', 'manual_adjustment' (text, not enum — keep flexible).

## Code touchpoints
- `src/components/app-sidebar.tsx`, `src/components/public-layout.tsx`, `src/components/mobile-tabbar.tsx` (new),
- `src/routes/_app.tsx`, `src/routes/_app/dashboard.tsx`, `_app/budgets.tsx`, `_app/expenses.tsx`, `_app/accounts.tsx`, `_app/debts.tsx`, `_app/insights.tsx`, `_app/settings.tsx`, `_app/tithe.tsx` (new),
- `src/routes/signup.tsx`, `src/routes/index.tsx`, `src/routes/features.tsx`, `src/routes/how-it-works.tsx`, `src/routes/pricing.tsx`,
- `src/lib/account.functions.ts` (add `checkUsername`, `adjustBalance`, `recordTithe`),
- `src/assets/founder-portrait.jpg` (new from upload).

Reply "go" and I ship top-to-bottom.
