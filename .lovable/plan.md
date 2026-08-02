# Fanika — Full Product Redesign

One big pass. Brown is fully replaced by the emerald/blue/amber system. Every existing module is kept, nested under the new navigation.

## 1. New design system

Rebuild `src/styles.css` tokens (all values as tokens, no hardcoded colours in components):

- Primary Deep Emerald `#15803D`, secondary Royal Blue `#2563EB`, accent Amber `#F59E0B`
- Success `#22C55E`, Warning `#F97316`, Danger `#EF4444`, Info `#0EA5E9`
- Background `#FAFAFA`, cards white, text `#111827` / `#6B7280`, borders `#E5E7EB`
- Radius 12–16px, soft card shadows, subtle hover elevation, dark-mode tokens kept in place
- Typography: bold headings, regular body, semibold tabular figures for money
- Remove every brown/emerald-legacy literal from hero, navbar, charts, tabbar, PDFs, favicon background

## 2. Uniform chart palette

A single `chartColorByRank(index)` helper in a new `src/lib/chart-colors.ts`, ranked: dark emerald, blue, amber, purple, teal, orange, pink, then neutral greys. Every pie/donut/bar/stacked chart sorts by value and consumes this helper — no per-chart colour arrays anywhere.

## 3. Navigation (nothing removed)

Sidebar grouped:

```text
MAIN        Dashboard · Transactions · Accounts · Budgets · Goals · Debts · Investments · Reports · Settings
MONEY FLOW  Income · Expenses · Subscriptions · Charity & Giving · Calendar
INSIGHTS    AI Advisor · Insights · Statements (inside Reports) · History
FAMILY      Family Suite · Stewardship
```

- Transactions becomes a new unified page (income + expenses + transfers + fees, filterable, editable inline) that links out to Income/Expenses.
- Reports becomes the home for Statements + Insights exports.
- Mobile tabbar: Home, Transactions, Add (FAB), Budgets, Accounts.

## 4. Executive dashboard

Replaces the current dashboard content. No duplicated module data:

- Five summary tiles: Net Worth, Monthly Cash Flow, Savings Rate, Financial Health, Budget Performance
- AI insights strip (spending deltas, goal progress, overspend forecast)
- One combined trend chart: income / spending / savings by month
- Goal progress bars, next upcoming bills only, last five transactions with a link to Transactions
- Removed from dashboard: full account listings, long budget tables, repeated debt tables

## 5. Financial health score

Replace the 45% floor. If a user lacks income entries, accounts and at least one month of expenses, the card shows "Complete your financial profile" with a CTA and no number. Score computes only once minimum data exists, from savings rate, budget adherence, debt ratio, giving and liquidity buffer.

## 6. Full CRUD everywhere

Audit and add missing edit/delete + confirmation dialogs for: accounts, transactions, budgets, income, debts, goals, investments, subscriptions, recurring bills, giving records, categories, family members/chores. Optimistic updates with rollback, undo toast on delete, autosaved dialog drafts, smart validation and human error messages.

## 7. Reports

Monthly / Quarterly / Annual with Cash Flow, Income vs Expenses, Net Worth Growth, Budget Performance, Debt Reduction, Savings Growth, Investment Growth. Exports: PDF (existing lazy renderer, restyled), CSV, and Excel via `xlsx`.

## 8. Architecture, security, performance

- Split presentation / logic / data: business rules move into `src/lib/services/*`, data access into typed query hooks in `src/lib/queries.ts`, components stay presentational
- All privileged work stays in `createServerFn` handlers; no secrets in client code; verify RLS + GRANTs on every table and fix gaps found by a security scan; Zod validation on every server-fn input
- Route-level lazy loading and code splitting, memoized derived finance calculations, React Query cache keys consolidated so a transaction write invalidates exactly the affected views
- Strict TS types, dead code and unused components removed, shared form/dialog/empty-state/skeleton primitives

## 9. Responsiveness, accessibility, motion

No horizontal scroll anywhere except the dashboard balance-card rail. WCAG AA contrast, focus rings, labels, keyboard shortcuts for new/search. Subtle transitions only: 150–200ms fades, hover elevation, skeleton loaders.

## 10. Final audit

End-to-end pass with the browser: every route rendered at desktop/tablet/mobile, console clean, navigation intact, no duplicate functionality, spacing/typography/colour consistent, security scan reviewed.

## Technical notes

- Migrations expected: recurring-bill/category normalisation if gaps are found during the CRUD audit; no destructive schema changes.
- `chart-colors.ts`, `src/lib/services/*`, `src/routes/_app/transactions.tsx`, and `src/routes/_app/reports.tsx` are new; existing module routes are restyled and kept.
- Excel export adds one dependency (`xlsx`).
