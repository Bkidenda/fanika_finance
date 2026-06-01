
This is a large multi-area change. Grouping into 8 workstreams. I'll implement top-to-bottom unless you want to reorder.

## 1. Tithe becomes optional (per-user setting)
- Add `tithe_enabled` (bool, default false) and `tithe_rate` (numeric, default 0.10) to `profiles`.
- Settings ("My Profile") gains: "Enable automatic tithe set-aside" toggle + rate input.
- Budget math unchanged in principle: when enabled, tithe is computed from monthly income FIRST, deducted before "disposable" is calculated. When disabled, tithe is 0 and not shown anywhere.
- Each income entry gets an optional "Set tithe on this income" checkbox (defaults to the profile setting) so per-entry override is possible.
- Dashboard, Advisor, Insights, History all respect the toggle.

## 2. Monthly cycle redesign (fresh income/budgets, carry-over for the rest)
- "Open a new month" already happens when you close the previous one. Update `closeMonth` so it:
  - Does NOT copy budgets forward by default (income+budgets are entered fresh).
  - Copies forward only items flagged as recurring (see #3).
  - Carries over: account balances, investments, debts, subscriptions (these are already global, not month-scoped).
- If a user tries to add a budget/expense/income whose date falls in the next month while the current month is still open, show a non-blocking prompt: "Close <Month> first?" with buttons [Close & continue] [Continue without closing] [Cancel].
- Reopening a past month from `/history` is allowed and does not touch the current month's data (already true — just make it explicit in the UI).

## 3. Recurring budget lines (like rent)
- New table `recurring_budgets` (category, amount, start_month, end_month nullable, active).
- New section in `/budgets` to manage them; on month open they are auto-inserted into that month's `budgets` table.
- Mirrors the existing subscriptions flow but for budget envelopes rather than vendor charges.

## 4. Dashboard polish
- Remove the explanatory subtitle under "Income received" (no more `income_streams` from settings).
- Show: Income received this month, Tithe set aside (only if enabled), Total spent, Disposable remaining, Net worth, Where your money is.

## 5. Floating navbar split
- Top bar: fixed "Nuru Steward" wordmark on the left (NOT floating, sits in normal page header).
- Floating pill (center/right): only the page links — Home, Features, How it works, Stewardship, Pricing.
- Mobile: wordmark stays, pill collapses to a sheet.

## 6. Hero image quality
- Re-export the founder photo at 1600×1200 (currently undersized → blurry). Use `imagegen.edit_image` to upscale + clean background to pure white. Animate the surrounding graphic chips slightly slower for a calmer feel.

## 7. AI advisor — current month + history
- `generateAdvisory` server fn already reads current month; extend it to also pull the last 3 `month_closures` snapshots and pass them to the model so it can comment on trends (e.g. "spending on Food is up 22% vs your 3-month average").

## 8. Statements, account lifecycle, data wipe, content sync

### Printable statements
- New `/statements` page. Pick month or quarter, click "Download PDF". Uses `@react-pdf/renderer` (already pure JS, Worker-safe is irrelevant — renders client-side). PDF includes: income summary, budgets vs actuals, top categories, accounts snapshot, debts, investments, net worth, tithe (if enabled).

### Account deactivate / delete
- In My Profile, add a "Danger zone" card:
  - **Deactivate**: sets `profiles.is_active = false`, signs out. Data preserved. Reactivates on next login.
  - **Delete permanently**: typed-confirmation dialog → server fn (`requireSupabaseAuth`) that deletes all user-owned rows across every table, then calls `supabaseAdmin.auth.admin.deleteUser(userId)`. Signs out and redirects to `/`.

### One-time data wipe for your account
- I'll run a SQL migration that deletes all user-scoped rows (expenses, incomes, income_entries, budgets, recurring_budgets, debts, debt_payments, accounts, account_transactions, investments, subscriptions, savings_goals, ai_insights, month_closures, financial_events) for `email = 'bkidenda@gmail.com'`, and reset `profiles.net_income` to 0. Auth user stays. You'll log in on June 1 with a clean slate.

### Content sync
- Rewrite `/features` and `/how-it-works` to match the current capabilities (net-income model, optional tithe, monthly cycle, recurring lines, statements, advisor with history).
- On `/pricing`, replace the hand-picked feature bullets with the **actual feature flags** each tier unlocks. Tier capabilities will be defined in `src/lib/plans.ts` and consumed by both `/pricing` and feature-gating in the app:
  - **Free**: budgets, expenses, accounts (≤3), tithe toggle, monthly close, devotional, statements (monthly only).
  - **Steward Pro (KSh 2,000)**: + unlimited accounts/investments, AI advisor + chatbot, debt planner, recurring budgets, quarterly statements, calendar.
  - **Family Suite (KSh 4,000)**: + household members, shared budgets, family obligations, joint net-worth, priority support.

## Technical notes (skip if not interested)
- All DB changes in one migration with GRANTs + RLS.
- Server fns: `generateAdvisory` (extend), `deleteAccount` (new), `deactivateAccount` (new), `wipeUserData` (new, called from migration as one-off).
- PDF rendered client-side (`@react-pdf/renderer`) — added via `bun add`.
- Floating navbar refactor stays in `public-layout.tsx`.

## Confirmations needed
1. OK to **wipe all your data** (email `bkidenda@gmail.com`) right now so you start June clean? Auth account stays.
2. PDF library: OK to use `@react-pdf/renderer` (client-side, no server load)?
3. For recurring budgets, default behavior on month open = auto-insert at the saved amount; OK?

Reply "go" (or with answers to the 3 above) and I'll ship it.
