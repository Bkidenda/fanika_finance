# Nuru Steward — Completion Plan

Six workstreams, scoped to ship in one pass. Database migration first, then code.

## 1. Account auto-linking (balances stay in sync)

- Add `account_id` to `expenses`, `incomes` (one-off entries), `debt_payments`, `subscriptions`, `savings_goals` contributions. Already present on `expenses`.
- Add Postgres triggers:
  - On `expenses INSERT`: if `account_id` set, `accounts.balance -= amount`. On UPDATE adjust delta. On DELETE refund.
  - Same pattern for `debt_payments` (debit account) and a new `account_transactions` row.
  - On manual income entry (new `income_entries` table for actual receipts vs the recurring `incomes` definitions): `accounts.balance += amount`.
- Add explicit account transfer flow on `/accounts` (already has `account_transactions`, currently unused) — debit source, credit destination.
- Expense / debt-payment dialogs surface an Account selector; default to user's primary account.

## 2. Informal debts

- Add `kind` column on `debts`: `formal | informal`. Make `interest_rate`, `monthly_payment`, `due_date` optional in the form when `kind = informal`.
- Debts page groups Formal vs Informal; informal shows "Owed to <name>" with running balance only.

## 3. Net worth

- New helper `computeNetWorth({ accounts, investments, debts })` = sum(account balances) + sum(investment current_value) − sum(debt balances).
- Add Net Worth card on Dashboard + dedicated panel on `/accounts`.

## 4. Monthly cycle + reconciliation

- New table `month_closures (user_id, period text 'YYYY-MM', closed_at, snapshot jsonb)`.
- `/dashboard` shows current open period; "Close month" button opens reconciliation modal:
  - Totals: income, expenses, savings, debt paid, tithe, statutory, net cashflow, top categories, budget variance.
  - On confirm: writes snapshot + locks the period (subsequent expense inserts in that period are blocked client-side; show "Reopen month" admin action).
- New `/history` route lists past closures with month/year filters and links to each snapshot view.

## 5. Tithe toggle + budget grouping (carry-overs)

- Settings: expose `tithe_base` (gross/net), `is_resident`, `nssf_mode` toggles already in profile.
- Budgets: group categories by section (Essentials / Family / Lifestyle / Stewardship / Savings).
- Expenses dialog: category list filtered to categories with an active budget for the current month; "Emergency" toggle bypasses that filter.

## 6. Landing page + marketing site

Convert root `/` into a multi-page marketing site (separate routes, each with own `head()`):

- `/` Home — hero with generated image (replaces the old "Insights" block), value props, CTA to sign up.
- `/features` — modules overview.
- `/how-it-works` — 3-step walkthrough.
- `/stewardship` — tithing/Ellen White philosophy.
- `/pricing` — single free tier card.
- `/about`, `/contact`.

Public navbar (Home, Features, How it works, Stewardship, Pricing, About, Sign in). Authenticated app stays under `/_app/*` with sidebar.

## Technical notes

- Migration order: new columns → triggers → `month_closures` + `income_entries` tables → grants + RLS.
- Triggers are SECURITY DEFINER so they touch `accounts` regardless of who inserts.
- Reconciliation snapshot is computed in a `createServerFn` (`closeMonth`) to keep math server-side.
- Landing-page hero image generated with `imagegen` (premium, includes typography-free composition).
- Net worth helper lives in `src/lib/finance.ts`.

## Out of scope this pass

- Plaid / M-Pesa live sync (manual entries only).
- Editing closed-month entries (only reopen path).
- Multi-currency conversion.

Confirm and I'll execute, or tell me which workstreams to drop / reorder.
