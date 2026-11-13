# Fanika Mobile App Redesign (mockup: Fanika_Mobile_App.pdf)

## Stage 1 — Design foundation
- [x] styles.css: warm cream canvas, forest-green primary, sand secondary, clay negative, gold accent; Playfair Display display font
- [x] __root.tsx: load Playfair Display alongside Inter

## Stage 2 — Mobile app shell
- [x] Mobile-first layout, no sidebar, bottom tab bar (Home, Money, Review, Budgets, More) with review badge
- [x] Desktop (>=1024px): "Get the mobile app" notice screen
- [x] Mobile bottom navigation styled to the mockup

## Stage 3 — Message detection (M-Pesa / Airtel / bank)
- [x] Migration: pending_transactions table + GRANT + RLS
- [x] src/lib/sms-parser.ts: parse M-Pesa, Airtel Money, generic bank alerts
- [x] Review page /review: queue with Confirm / Choose category / Edit / Ignore
- [x] Onboarding flow /onboarding, shown once post-signin
- [x] Home "Suggested from your messages" card with count
- [x] Clearly explain that browser message intake uses pasted alert text, not inbox access

## Stage 4 — Page redesigns per mockup
- [x] Home (/dashboard): greeting, green balance card, review card, quick pills, streak, reflection
- [x] Money (/transactions): month IN/OUT cards, grouped ledger, add-transaction sheet, accounts link
- [x] Budgets (/budgets): ring summary + category progress cards
- [x] More (/more): tile grid to all features + profile/sign-out
- [x] AI Advisor restyle (green advisor card)
- [x] Login restyle to match app identity

## Stage 5 — QA
- [x] Typecheck + build clean
- [x] Airtel Money incoming-message parsing check
- [ ] Authenticated mobile route and review-flow check; the preview test session did not persist in the browser
- [x] Preview set to mobile viewport
