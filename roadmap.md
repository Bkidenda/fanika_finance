# Fanika Mobile App Redesign (mockup: Fanika_Mobile_App.pdf)

## Stage 1 — Design foundation
- [ ] styles.css: warm cream canvas, forest-green primary, sand secondary, clay negative, gold accent; Playfair Display display font
- [ ] __root.tsx: load Playfair Display alongside Inter

## Stage 2 — Mobile app shell
- [ ] Rewrite _app.tsx: mobile-first layout, no sidebar, bottom tab bar (Home, Money, Review, Budgets, More) with review badge
- [ ] Desktop (>=1024px): "Get the mobile app" notice screen
- [ ] Rewrite mobile-tabbar.tsx to mockup style

## Stage 3 — Message detection (M-Pesa / Airtel / bank)
- [ ] Migration: pending_transactions table + GRANT + RLS
- [ ] src/lib/sms-parser.ts: parse M-Pesa, Airtel Money, generic bank alerts
- [ ] Review page /review: queue with Confirm / Choose category / Edit / Ignore
- [ ] Onboarding flow /onboarding (3 mockup screens), shown once post-signin
- [ ] Home "Suggested from your messages" card with count

## Stage 4 — Page redesigns per mockup
- [ ] Home (/dashboard): greeting, green balance card, review card, quick pills, streak, reflection
- [ ] Money (/transactions): month IN/OUT cards, grouped ledger, add-transaction sheet, accounts link
- [ ] Budgets (/budgets): ring summary + category progress cards
- [ ] More (/more): tile grid to all features + profile/sign-out
- [ ] AI Advisor restyle (green advisor card)
- [ ] Login restyle to match app identity

## Stage 5 — QA
- [ ] tsgo typecheck + build clean
- [ ] Playwright mobile E2E: sign in, walk tabs, ingest sample M-Pesa message, confirm into tracker
- [ ] Preview set to mobile viewport
