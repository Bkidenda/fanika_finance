Large multi-area update. Here's what I'll ship, grouped by area.

## 1. Statements page error fix
The `PDFDownloadLink` from `@react-pdf/renderer` fails during SSR/hydration with "Cannot read properties of undefined (reading 'call')". Wrap it in a client-only guard (mount check) so it only renders after hydration, and lazy-load the `@react-pdf/renderer` module dynamically.

## 2. Rebrand to Fanika
- Rename in: landing page (`src/routes/index.tsx`), `public-layout.tsx`, `_app.tsx` header, sidebar, mobile tabbar, PDF documents, `.txt` exports, features/how-it-works/pricing pages, chatbot copy, meta tags in `__root.tsx`, package.json name where user-facing.
- Preserve internal file/table names.

## 3. Brown theme
Rework `src/styles.css` tokens to warm brown palette:
- `--primary`: rich brown (e.g. `oklch(0.42 0.08 55)`)
- `--accent`: warm caramel
- `--background`: cream/off-white
- `--gradient-primary`, `--gradient-hero`, `--shadow-elegant` re-tuned.
- Keep semantic tokens; no component-level color changes needed.

## 4. Multi-expense entry
In `src/routes/_app/expenses.tsx`, add "Add another" inside the expense dialog: builds an array of line items, saves them all in one `insert` call.

## 5. Subscription automation
- New scheduled logic: helper `processDueSubscriptions()` runs on app load (in `_app.tsx` layout mount) that finds subs where `next_charge <= today` and `active=true`, creates an expense, debits account, advances `next_charge` by cycle. Idempotent per (sub_id, charge_date).
- Add `last_charged` column to subscriptions to prevent double-charging.

## 6. Debt ↔ Account link
- When creating a debt with an existing account, allow "Reflect as negative balance in an existing account" option (e.g., Equity bank loan on Equity account). Store `linked_account_id` on debts.
- Trigger already exists for negative-balance→debt sync; ensure reverse: debt payments reduce the linked account's overdraft (already implicit via debt payment triggering account debit).
- Backfill: allow the user to link the existing Equity debt to the Equity account in the debts UI.

## 7. Ziidi auto-save verification
Audit the M-Pesa expense flow. Ensure: on any expense debiting an M-Pesa account (not just via UI), a percentage transfer creates a matching credit to the Ziidi account and a debit from M-Pesa. Move logic into a shared helper called from both the expense dialog and subscription automation.

## 8. Mobile: chatbot button position
Move `AIChatbot` FAB above the mobile tabbar (add `bottom-24` on mobile, `bottom-6` on desktop). Also ensure dashboard bottom padding accommodates it.

## 9. Header username → real name + avatar
- Add `avatar_url` support (already in profiles?). Add upload UI in My Profile using Supabase Storage bucket `avatars`.
- Header in `_app.tsx`: replace `@username` with `full_name`; show avatar `<Avatar>` component with initials fallback.

## 10. Daily rotating devotionals
`src/routes/_app/stewardship.tsx` currently shows static content. Add a `devotionals` table (seed ~60 entries across finance/health/temperance/growth) and select by `dayOfYear % count` so it changes every day.

## 11. Mobile landing page fit
Landing page CTAs overlap on small screens. In `src/routes/index.tsx`:
- Reduce button sizes on mobile (`size="sm"` responsive).
- Stack CTAs with `flex-col sm:flex-row`.
- Reduce hero heading `text-3xl` on mobile.
- Verify no element exceeds viewport.

## 12. Family Suite → Premium
Expand `src/routes/_app/family.tsx` beyond allowance tracking:
- **Shared budgets**: family members contribute to shared expense pools (already partly there).
- **Kids' savings goals** with visual progress and parent-approved payouts.
- **Chore board**: chores with monetary rewards; completion auto-credits child's account.
- **Family calendar**: shared financial events (school fees, family holidays).
- **Money lessons**: age-appropriate weekly lessons tied to devotionals.
- **Family dashboard**: combined net worth, per-member balances, upcoming obligations.
- **Invite system**: send invite to spouse/child email; role-based access (parent/child/spouse).
- Premium gate: hide behind `family_plan_enabled` toggle (already exists) with an upgrade CTA.

## Order & scope
I'll ship these in this order; heavy migrations (devotionals seeding, avatar bucket) run first, then code changes in parallel where possible.

## Out of scope for this pass
- Actual payment processor integration for premium billing (already handled by existing Paddle/Stripe plumbing if user upgrades separately).
- CBK live FX rates (already stubbed previously — no changes here unless issues surface).
