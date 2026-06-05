
# Implementation plan

## 1. Expenses — weekly grouping + timestamps
- Add `occurred_at timestamptz` to `expenses` (default `now()`). Backfill from `date`. Keep `date` for filtering.
- `/expenses` rework: group rows by ISO week (latest first), each week is a `<Collapsible>` (current + previous week expanded by default, older collapsed). Inside each week, group by day, descending. Show time (HH:mm) per row.
- Same weekly collapsible pattern for income entries (lighter touch).

## 2. Negative-balance accounts = liability/debt
- When `accounts.balance < 0` at insert, trigger `accounts_negative_creates_debt`:
  - Inserts a `debts` row (kind='informal', name='<account> overdraft', balance = |neg|, deposit_account_id = NULL to avoid loop) and stores the debt id in new column `accounts.linked_debt_id`.
- Trigger `accounts_sync_linked_debt` on UPDATE of `accounts.balance`:
  - If linked debt exists, set `debts.balance = max(0, -accounts.balance)`; archive when zero.
- Transfers that credit a negative account therefore auto-reduce the linked debt (because `apply_account_delta` runs first, then trigger syncs).

## 3. Founder image
- Re-derive hero from uploaded `founder-original.jpg` composited onto existing `hero-tablet.jpg` background using `imagegen--edit_image` with both as inputs. Save to `src/assets/founder-portrait.jpg` (overwrite). No background re-color — keep landing-page background.

## 4. Reconciliation banner
- Compute `accountedFor = totalBudgeted + tithePlanned + savingsPlanned`; `availableFunds = totalIncome + newDebtInflowThisMonth − titheAlreadyPaid`. Show variance card on dashboard + budgets ("Unallocated: X" / "Over-allocated: X").

## 5. Live analytics
- Add `useQueryClient().invalidateQueries({ queryKey: ['insights'] })` and dashboard keys to all mutation success handlers (expenses, income, debts, subscriptions, accounts, tithe, offerings). Centralize via a `invalidateFinance(qc)` helper in `src/lib/queries.ts`.

## 6. Editable figures
- Accounts page: reuse existing `EditableBalance`, ensure write goes through `account_transactions` adjustment so debt linkage triggers fire.
- Subscriptions page: add inline editable `amount` and `next_charge`.

## 7. Disposable income definition
- `useDisposable()` selector: sum balances of accounts whose `type` ∈ {bank, mobile_money, cash}. Surface on dashboard "Available cash".

## 8. Subscriptions → recurring budget
- Server fn `syncSubscriptionsToRecurring`: computes monthly-equivalent total of active subs, upserts a `recurring_budgets` row (category='Subscriptions', amount=total, active=true) for current user. Run on subscription insert/update/delete (client-side after mutation). Subscriptions page shows the auto-computed monthly total and an "Override" input that, when set, writes the override into the recurring budget instead.

## 9. Ziidi auto-save fix
- Diagnose: trigger only fires when source account name contains "mpesa". Verify with `supabase--read_query`. Likely missing Ziidi account or rate disabled. Add: (a) UI banner in `/accounts` "Create a 'Ziidi' savings account to enable auto-save"; (b) UI in `/expenses` shows "✓ X auto-saved to Ziidi" toast after insert by re-reading latest `account_transactions` with kind='transfer' description LIKE 'Auto-save%'. Also fix the trigger's `lower(...) NOT LIKE ... AND lower(...) NOT LIKE ...` precedence bug (needs parentheses).

## 10. Duplicate username friendly error
- In `/signup` submit handler, catch Postgres error code `23505` (or message containing `profiles_username_key`) and show `"Username already in use"`. Add migration: `CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON profiles (lower(username)) WHERE username IS NOT NULL;`

## 11. Charity & Giving (rename Tithe page)
- Rename route `/tithe` → `/giving`. New table `offerings` (id, user_id, category text, amount numeric, paid_on date, account_id uuid nullable, note text, created_at). Categories: Tithe, Offering, Church Development, Church Lunch, Welfare, Ministry Subscriptions, Retreat, Other.
- Trigger `offerings_sync_account_and_expense`: when category != 'Tithe' AND account_id set → debit account via `apply_account_delta` and insert mirrored expense row (category='Charity & Giving', description = '<category>: <note>'). Tithe rows do nothing to balances (already pre-disposable).
- Sidebar label: "Charity & Giving".
- Insights: add "Total to Church" card + breakdown chart by category.

## 12. Mobile bank-app polish (I&M style, dark)
- Refactor mobile dashboard (`md:hidden`) to mimic the screenshot:
  - Top gradient header (deep navy → primary) with greeting, hidden balance toggle, primary account "card" carousel (horizontal snap) showing account name, masked number, available balance.
  - "What would you like to do today" 4-icon quick actions row (Add Income, Add Expense, Transfer, Record Giving).
  - "Apply for / Track" 2-card row (Debts, Goals).
  - "Discover" 2-card promo row (52 Weeks Savings Challenge → savings goal CTA; Protect Your Future → insurance subscription CTA).
  - Bottom tab bar: shrink to compact icons + 10px label, dark surface, brighter active accent. Reduce icon container from current 28-40px to 22px (non-home) / 36px (home), label `text-[9px]`. Remove the elevated center-button shadow excess.
- Apply tighter mobile padding throughout (`px-3 py-3` instead of `p-5`) for cards on `/expenses`, `/income-entries`, `/budgets`, `/accounts`.

## 13. Family Suite
- New tables (single migration):
  - `families` (id, owner_id, name).
  - `family_members` (id, family_id, user_id nullable, name, relationship, monthly_allowance numeric, notes).
  - `family_contributions` (id, family_id, member_id, amount, paid_on, account_id, category text ['allowance','school_fees','medical','emergency','other'], note).
- Trigger on `family_contributions`: debits account + mirrors to `expenses` (category='Family').
- New route `/_app/family.tsx`: list members with avatars, monthly allowance vs paid this month, "Record contribution" dialog, history feed.
- Sidebar entry "Family Suite".

## Technical notes
- Migrations bundled in one file: add columns, indexes, new tables (with GRANTs to authenticated + service_role), RLS policies scoped to `auth.uid()`, triggers.
- All triggers `SECURITY DEFINER SET search_path=public`.
- All client mutations route through `invalidateFinance(qc)` for live updates.
- No changes to `_app.tsx` shell beyond mobile tab bar styling.

## Files touched (high-level)
- Migrations: `supabase/migrations/<ts>_giving_family_negative_debt.sql`
- New: `src/routes/_app/giving.tsx`, `src/routes/_app/family.tsx`, `src/lib/finance-events.ts`
- Edited: `src/routes/_app/expenses.tsx`, `income-entries.tsx`, `accounts.tsx`, `subscriptions.tsx`, `budgets.tsx`, `dashboard.tsx`, `insights.tsx`, `signup.tsx`, `src/components/app-sidebar.tsx`, `src/components/mobile-tabbar.tsx`, `src/lib/queries.ts`, `src/assets/founder-portrait.jpg` (regen)
- Removed/redirected: `src/routes/_app/tithe.tsx` → re-export from giving (back-compat)
