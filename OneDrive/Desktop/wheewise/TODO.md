# Wheewise — TODO / Remaining Work

> **Generated:** 2026-06-28  
> Items ordered by priority — fix blockers before adding features.  
> Based on full codebase analysis vs. SDD requirements.

---

## PRIORITY 1 — Critical Blockers (must fix before any production traffic)

### [P1-1] Create `wrangler.toml`
**Problem:** `npm run cf:deploy` and `npm run cf:preview` fail without a `wrangler.toml`. Cloudflare Workers is the target deployment platform but is currently non-functional.  
**Files to create:** `wheewise-app/app/wrangler.toml`
```toml
name = "wheewise"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
main = ".open-next/worker.js"
assets = { directory = ".open-next/assets" }

[[kv_namespaces]]
binding = "WHEEWISE_KV"
id = "<your-kv-namespace-id>"
```
**Effort:** 0.5 day

---

### [P1-2] Implement Password Reset Flow
**Problem:** Users who forget their password have no recovery path. No `/forgot-password` route exists. Blocking for production adoption.  
**What to build:**
- `POST /api/auth/forgot-password` — accepts email, generates reset token, sends email via Resend.
- `/reset-password?token=xxx` page — validates `VerificationToken`, sets new password.
- Use existing `VerificationToken` model (`identifier=email+":reset"`, `expires=1hr`).
**Files:** New: `app/api/auth/forgot-password/route.ts`, `app/app/(auth)/reset-password/page.tsx` | Existing: `lib/email.ts`, `lib/actions/auth.ts`  
**Effort:** 1.5 days

---

### [P1-3] Wire Admin Mutation Actions
**Problem:** All 7 admin pages are read-only data displays. Admins cannot take any action — cannot approve/suspend dealers, moderate listings, approve payouts, or save notification templates. The platform cannot be operated without this.  
**What to build per page:**
- `/admin/dealers` — Approve dealer (`gstVerified=true`), Suspend (`Dealer.status=SUSPENDED`), Unsuspend.
- `/admin/listings` — Pause listing, remove, flag for violation.
- `/admin/inspectors` — Approve/Reject `Inspector.status`.
- `/admin/payouts` — Approve → call Razorpay Payout API, Reject with reason.
- `/admin/templates` — Save edited `NotificationTemplate` to DB; use DB template in `lib/email.ts` (with fallback to hardcoded).
- `/admin/community` — Pin/lock/remove post.
- `/admin/inspections` — Assign inspector to inspection (`inspectorId` + status → SCHEDULED).
**Files:** All `(admin)/admin/*/page.tsx`, new server actions in `lib/actions/admin.ts`  
**Effort:** 3–4 days

---

### [P1-4] Add `INSPECTOR` to Role Enum
**Problem:** The `Role` enum only has `BUYER | DEALER | ADMIN`. Inspector users are stored as `BUYER` — inspector-specific pages cannot be role-gated and admins cannot distinguish inspectors from buyers.  
**Migration:**
```prisma
enum Role {
  BUYER
  DEALER
  ADMIN
  INSPECTOR  // ADD THIS
}
```
Run: `npx prisma migrate dev --name add-inspector-role`  
Then update `requireDealer()` and admin role check to handle the new value.  
**Files:** `prisma/schema.prisma`, `lib/dealer.ts`, `(admin)/layout.tsx`  
**Effort:** 0.5 day (migration + propagation)

---

### [P1-5] Fix `@sentry/nextjs` in devDependencies
**Problem:** `@sentry/nextjs` is listed under `devDependencies`. Production builds may tree-shake it away, meaning errors go unreported.  
**Fix:** Move `@sentry/nextjs` to `dependencies` in `app/package.json`.  
**Effort:** 15 minutes

---

### [P1-6] Fix OTP Store for Multi-Instance Workers
**Problem:** `lib/otp.ts` falls back to an in-memory `Map` in some conditions. Cloudflare Workers runs on many edge nodes — OTPs sent by one worker cannot be verified by another worker instance. Phone login breaks in production.  
**Fix:** Ensure `lib/otp.ts` always uses Cloudflare KV in production. Add a startup guard that throws if KV is unavailable in `NODE_ENV=production`.  
**Files:** `lib/otp.ts`, `lib/cloudflare-bindings.ts`, `lib/env.ts`  
**Effort:** 0.5 day

---

### [P1-7] Configure E2E Tests in CI
**Problem:** E2E tests are marked `continue-on-error: true` and `E2E_DATABASE_URL` secret is almost certainly unconfigured in CI. E2E failures are invisible — the safety net doesn't exist.  
**Fix:**
1. Create a dedicated Neon database branch for CI (Neon supports branching at no extra cost).
2. Add `E2E_DATABASE_URL` to GitHub repository secrets.
3. Remove `continue-on-error: true` once tests pass reliably.
**Files:** `.github/workflows/ci.yml`  
**Effort:** 1 day

---

## PRIORITY 2 — High-Impact Missing Features

### [P2-1] Buyer Loan Application Form
**Problem:** The full `LoanApplication` schema (10 NBFCs, statuses, EMI), the dealer view at `/dashboard/loans`, and `lib/emi.ts` are all built — but buyers have no UI to apply for a loan. Zero value is delivered without the buyer-side form.  
**What to build:**
- Loan application section on `/vehicle/[id]` page.
- Fields: applicant name, phone, PAN (optional), loan amount (pre-filled), NBFC dropdown, tenure months.
- Live EMI preview using `lib/emi.ts`.
- `POST /api/loan-applications` route handler + server action.
- Email/SMS notification to dealer on submission.
**Files:** `app/vehicle/[id]/page.tsx`, new: `app/api/loan-applications/route.ts`, `lib/actions/finance.ts`  
**Effort:** 2 days

---

### [P2-2] Real-Time Chat (SSE)
**Problem:** `ChatWidget.tsx` polls REST API. Messages only appear after a refresh or next poll. Unacceptable UX for buyer-dealer price negotiation.  
**Recommended approach:** Server-Sent Events (SSE) — works on Cloudflare Workers, no Durable Objects needed.  
**What to build:**
- `GET /api/chat/stream?conversationId=xxx` — long-lived SSE response that pushes new messages.
- Update `ChatWidget.tsx` to use `EventSource` instead of interval polling.
- Use Cloudflare KV or a simple pub/sub pattern to fan out new message events.
**Files:** New: `app/api/chat/stream/route.ts` | Existing: `components/chat/ChatWidget.tsx`  
**Effort:** 2–3 days

---

### [P2-3] Email Verification Flow
**Problem:** `User.emailVerified` is null for all users. `VerificationToken` table exists but is unused. Unverified emails can perform all dealer operations.  
**What to build:**
- At buyer/dealer signup: send verification email via Resend with token link.
- `/verify-email?token=xxx` page — sets `User.emailVerified = new Date()`.
- "Resend verification" button on dashboard.
- Gate subscription checkout on `emailVerified !== null`.
**Files:** New: `app/app/(auth)/verify-email/page.tsx` | Existing: `lib/actions/auth.ts`, `lib/email.ts`  
**Effort:** 1.5 days

---

### [P2-4] Complete Inspection Workflow
**Problem:** `RequestButton` creates an `Inspection` record in REQUESTED state. Nothing after that works. The quality inspection differentiator is non-functional end-to-end.  
**What to build:**
- **Admin: Assign inspector** — assign `inspectorId` in `/admin/inspections` → status becomes SCHEDULED.
- **Inspector portal** — new route group `(inspector)/inspector/` with checklist submission UI using templates from `lib/inspection-checklist.ts`.
- **Checklist completion API** — `PATCH /api/inspections/[id]` saves `checklist` JSON, `overallScore`, `notes`, `completedAt`, status → COMPLETED.
- **Report generation** — Upload PDF to R2, save `reportUrl`.
- **Score display** — Show `overallScore` badge on `ListingCard` and vehicle detail (already referenced in browse: `l.inspections[0]?.overallScore`).
**Files:** New: `app/(inspector)/`, `app/api/inspections/[id]/route.ts` | Existing: `lib/inspection-checklist.ts`, `components/storefront/ListingCard.tsx`  
**Effort:** 4–5 days

---

### [P2-5] Listing Boost Expiry Cleanup Job
**Problem:** `boostExpiresAt` is stored but nothing sets `isBoosted=false` when it passes. Listings remain boosted forever after the boost period ends.  
**What to build:**
- Cloudflare Workers cron trigger in `wrangler.toml`:
  ```toml
  [triggers]
  crons = ["0 * * * *"]  # hourly
  ```
- Handler: `SELECT * FROM Listing WHERE isBoosted=true AND boostExpiresAt < NOW()` → batch `isBoosted=false`.
- Or: lazy expiry check on read — treat listings as not-boosted if `boostExpiresAt < now()` regardless of `isBoosted` flag.
**Files:** New: `app/api/admin/boost-cleanup/route.ts` | Existing: `wrangler.toml` (to be created in P1-1)  
**Effort:** 1 day

---

### [P2-6] Drop Legacy Plaintext API Key Column
**Problem:** `ApiKey.key` stores plaintext secrets in the database — a security vulnerability. A migration window was planned but never executed.  
**Steps:**
1. Write a migration script: for all rows where `key IS NOT NULL`, compute SHA-256 → populate `keyHash`, clear `key`.
2. Remove plaintext fallback from `lib/api-auth.ts`.
3. Prisma migration: `ALTER TABLE "ApiKey" DROP COLUMN "key"`.
**Files:** `lib/api-auth.ts`, `prisma/schema.prisma`, new: `prisma/migrations/drop_apikey_key/`  
**Effort:** 1 day

---

### [P2-7] Integrate `trust-score.ts` and `moderation.ts`
**Problem:** Both files contain non-trivial logic that is never called from any route or page. Dead code providing zero runtime value.  
**`trust-score.ts`:**
- Call `calculateTrustScore(dealerId)` in storefront page.
- Display on `TrustStrip` component in `/s/[slug]/showcase`.
- Surface in `/admin/dealers` for admin visibility.

**`moderation.ts`:**
- Call during `POST /api/listings` create/update.
- Flag listings for admin review if content fails moderation.
- Integrate into `/admin/listings` moderation queue.
**Files:** `lib/trust-score.ts`, `lib/moderation.ts`, `components/storefront/TrustStrip.tsx`, `app/api/listings/route.ts`  
**Effort:** 1.5 days

---

### [P2-8] Dealer Analytics Page
**Problem:** `ListingView` records are created on every vehicle visit (deduped by `visitorId`). `viewCount` and `enquiryCount` are tracked per listing. No UI shows dealers this data.  
**What to build:**
- New `/dashboard/analytics` page.
- Views per listing over time (from `ListingView` table).
- Leads by source (FORM/WHATSAPP/CALL from `Enquiry.source`).
- Lead-to-view conversion rate per listing.
- Add Recharts to `package.json`.
- Add "Analytics" link to `DashboardNav.tsx`.
**Files:** New: `app/(dealer)/dashboard/analytics/page.tsx` | Existing: `DashboardNav.tsx`, `package.json`  
**Effort:** 2 days

---

## PRIORITY 3 — Feature Completeness (important but not launch-blocking)

### [P3-1] Capacitor Config for Native Mobile
**Problem:** `mobile/capacitor.config.ts` is missing. Capacitor CLI cannot build native apps without it.  
**Create:** `wheewise-app/mobile/capacitor.config.ts`
```typescript
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.wheewise.app",
  appName: "Wheewise",
  webDir: "../app/out",
  server: { androidScheme: "https" },
};
export default config;
```
**Effort:** 0.5 day

---

### [P3-2] Mobile Push Notifications
**Problem:** Dealers miss real-time lead alerts when the app is in the background/closed.  
**What to build:**
1. Firebase Cloud Messaging (FCM) + APNs setup.
2. Add `@capacitor/push-notifications` to `mobile/package.json`.
3. New `DeviceToken` Prisma model (`userId`, `token`, `platform`).
4. Register device token on login.
5. Push from server on: new enquiry, new chat message, subscription events.
**Files:** `mobile/`, `lib/notifications.ts`, `prisma/schema.prisma`  
**Effort:** 3 days

---

### [P3-3] Payout Automation (Complete)
**Problem:** Admin can approve payouts visually but no Razorpay Payout API call is triggered.  
**What to build:**
- On admin approval: call Razorpay Payout API, save `razorpayPayoutId`.
- Handle `payout.processed` / `payout.failed` webhook events.
- Update `Payout.status` accordingly.
- Email dealer on success/failure.
**Files:** `(admin)/admin/payouts/page.tsx`, `lib/razorpay.ts`, `lib/email.ts`  
**Effort:** 2 days

---

### [P3-4] Admin Dealer Suspension Workflow
**What to build:**
- Suspend/unsuspend button on `/admin/dealers`.
- `requireDealer()` in `lib/dealer.ts` must check `dealer.status !== "SUSPENDED"` and redirect suspended dealers to an informational page.
- Email notification to dealer on suspension/reinstatement.
**Files:** `lib/dealer.ts`, `(admin)/admin/dealers/page.tsx`, `lib/email.ts`  
**Effort:** 1 day

---

### [P3-5] Listing Auto-Expire After 90 Days
**Problem:** SDD §5.2.4 specifies this. Without it, stale vehicles from closed dealers remain visible.  
**What to build:** Cloudflare Workers cron job (hourly) — `status=ACTIVE AND createdAt < NOW() - 90 days` → `status=PAUSED`. Notify dealer by email.  
**Files:** `wrangler.toml`, new: `app/api/admin/expire-listings/route.ts`  
**Effort:** 0.5 day

---

### [P3-6] Customer Reviews on Dealer Storefront
**Problem:** SDD §5.2.3 specifies a review section. No `Review` model exists.  
**Schema addition:**
```prisma
model DealerReview {
  id        String   @id @default(cuid())
  dealerId  String
  dealer    Dealer   @relation(...)
  authorId  String?
  rating    Int      // 1–5
  body      String?  @db.Text
  createdAt DateTime @default(now())
}
```
**UI:** Review submission form on vehicle detail (post-enquiry), display on storefront, average rating on `TrustStrip`.  
**Effort:** 2 days

---

### [P3-7] Browse Page Enhancements
**Current gaps vs. SDD §5.3.1:**
- No KM driven range filter.
- No transmission filter.
- No sort options (newest / price ↑↓ / most viewed).
- No make/model dependent selects.
**Minimum viable:** Add sort dropdown + KM range inputs + transmission select to the existing browse filter form.  
**Files:** `app/browse/page.tsx`, `lib/search.ts`  
**Effort:** 1 day

---

### [P3-8] Notification Template Integration
**Problem:** Emails use hardcoded strings in `lib/email.ts`. Admin template edits have no effect.  
**Fix:**
1. In `lib/email.ts`: look up `NotificationTemplate` by name from DB before sending. Fall back to hardcoded if not found.
2. Wire save action in `/admin/templates` page.
3. Document template variables (`{{buyerName}}`, `{{listingTitle}}`, etc.) in the admin UI.
**Files:** `lib/email.ts`, `lib/notifications.ts`, `(admin)/admin/templates/page.tsx`  
**Effort:** 1.5 days

---

### [P3-9] WhatsApp Business API Integration
**Problem:** `lib/whatsapp.ts` is a stub. WhatsApp CTA buttons open `wa.me` links only — no server-side integration, no `Enquiry` record created.  
**What to build in `lib/whatsapp.ts`:**
- Integrate WhatsApp Business Cloud API (Meta).
- When buyer clicks WhatsApp CTA: create `Enquiry` with `source=WHATSAPP`, notify dealer.
- Optional: send WhatsApp template message to dealer.
**Files:** `lib/whatsapp.ts`, `components/storefront/StickyContactBar.tsx`, `app/api/leads/route.ts`  
**Effort:** 2 days

---

### [P3-10] Listing Duplicate Feature
**Problem:** SDD §5.2.4 specifies this. Dealers listing multiple similar vehicles need it.  
**What to build:** "Duplicate" button on `/dashboard/inventory/[id]/edit` — clones all fields (except status=ACTIVE becomes PAUSED, photos cleared) and redirects to edit the copy.  
**Files:** `app/(dealer)/dashboard/inventory/[id]/edit/ListingActions.tsx`  
**Effort:** 0.5 day

---

### [P3-11] PDF Inspection Report Generation
**Problem:** `Inspection.reportUrl` is stored but nothing generates it. Completed inspections have no downloadable report.  
**Options:**
- `@react-pdf/renderer` — generate PDF from checklist JSON in a server action.
- Headless Chromium via Puppeteer — render an HTML template then capture PDF.
**Recommended:** `@react-pdf/renderer` (edge-compatible). Upload to R2, save `reportUrl`.  
**Files:** New: `lib/inspection-report.ts` | Existing: `app/api/inspections/[id]/route.ts`  
**Effort:** 2 days

---

## PRIORITY 4 — Infrastructure & Developer Experience

### [P4-1] Add Next.js Caching Layer
**Problem:** Every request hits Neon Postgres directly. No caching at all. Will degrade under traffic.  
**What to do:**
- Wrap `searchListings()` in `lib/search.ts` with `unstable_cache` (60-second TTL).
- Cache storefront data in `s/[slug]/showcase/page.tsx` (5-minute TTL).
- Use `revalidateTag()` on listing mutations to invalidate caches.
**Files:** `lib/search.ts`, `app/s/[slug]/showcase/page.tsx`, `lib/actions/listings.ts`  
**Effort:** 1 day

---

### [P4-2] Upgrade Search with PostgreSQL Full-Text
**Problem:** Prisma LIKE queries in `lib/search.ts` have no relevance ranking, no typo tolerance, no scalability beyond ~10K listings.  
**Quick upgrade (no new infra):** PostgreSQL `tsvector`/`tsquery` with `ts_rank` via Prisma `$queryRaw`. Add `GIN` index on `make || ' ' || model || ' ' || city`.  
**Full upgrade (per SDD):** Typesense or Elasticsearch — requires sync pipeline.  
**Files:** `lib/search.ts`, `prisma/schema.prisma`  
**Effort:** 1–3 days depending on option

---

### [P4-3] Standardize API Error Response Shape
**Problem:** Routes return inconsistent error shapes (`{ error }` vs `{ message }` vs plain string). Client-side error handling is fragile.  
**Fix:** Create `apiError(status, message, code?)` helper in `lib/format.ts`. Refactor all `app/api/` route handlers to use it.  
**Files:** `lib/format.ts`, all `app/api/*/route.ts` files  
**Effort:** 1 day

---

### [P4-4] Fix Phone Normalization Consistency
**Problem:** `auth.ts` normalizes to last 10 digits via `normalizePhone()`. It is not confirmed that `lib/otp.ts`, `lib/sms-provider.ts`, and `Enquiry.buyerPhone` use the same function.  
**Fix:** Move `normalizePhone()` from `auth.ts` to `lib/format.ts`. Import from there everywhere it's used.  
**Files:** `lib/auth.ts` → `lib/format.ts`, `lib/otp.ts`, `lib/sms-provider.ts`, `app/api/leads/route.ts`  
**Effort:** 0.5 day

---

### [P4-5] Graceful SMS Failure Handling
**Problem:** `lib/sms-provider.ts` throws if neither MSG91 nor Twilio is configured — causing 500 errors on lead submission in production.  
**Fix:** Wrap SMS dispatch in `try/catch` in `lib/notifications.ts`. Log error to Sentry. Lead submission succeeds even if SMS fails.  
**Files:** `lib/notifications.ts`, `lib/sms-provider.ts`  
**Effort:** 2 hours

---

### [P4-6] Clarify/Fix `viewCount` vs. `ListingView` Sync
**Problem:** `Listing.viewCount` is an integer counter and `ListingView` is a separate deduplication table. It is unclear if `ViewCounter.tsx` keeps them in sync atomically.  
**Fix:** Use `prisma.$transaction([prisma.listingView.upsert(...), prisma.listing.update({increment: {viewCount: 1}})])` to ensure consistency. Remove any direct `viewCount++` that bypasses the dedup table.  
**Files:** `components/vehicle/ViewCounter.tsx`, relevant API route  
**Effort:** 0.5 day

---

### [P4-7] Expand Test Coverage
**Current gaps:**
- No unit tests for Razorpay HMAC signature verification.
- No unit tests for `lib/auth.ts` OTP flow.
- No unit tests for `lib/dealer.ts` auth gate.
- No unit tests for `lib/notifications.ts` fan-out.
- E2E: No test for dealer signup → create listing → receive lead flow.
- E2E: No test for subscription checkout → webhook → active status.
**Files:** `tests/unit/`, `tests/e2e/`  
**Effort:** 2–3 days

---

### [P4-8] Add Dependabot Configuration
**Why:** `next-auth` (beta), Prisma, and Zod v4 all release frequently. Manual dependency tracking is error-prone.  
**Create:** `.github/dependabot.yml`
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/wheewise-app/app"
    schedule:
      interval: "weekly"
```
**Effort:** 15 minutes

---

## PRIORITY 5 — Polish and Nice-to-Have

### [P5-1] Listing Interest Tracker (High / Medium / Low)
Display engagement level per listing in dealer inventory. SDD §5.2.4 requirement.  
Compute from `Enquiry` and `ListingView` counts in the last 7 days.  
**Files:** `app/(dealer)/dashboard/inventory/page.tsx`

### [P5-2] Mark All Leads as Read
Bulk "mark all as read" button on `/dashboard/leads`. Currently each lead must be actioned individually.  
**Files:** `app/(dealer)/dashboard/leads/page.tsx`, `lib/actions/leads.ts`

### [P5-3] Buyer Profile / Account Settings
Page for buyers to update name, email, phone, and change password. Currently no buyer account management exists.  
**Files:** New: `app/(buyer)/account/page.tsx`

### [P5-4] Subscription Dunning Emails
On `subscription.halted` (PAST_DUE), send automated email sequence to dealer with re-subscribe instructions.  
**Files:** `app/api/billing/webhook/route.ts`, `lib/email.ts`

### [P5-5] Bulk Lead Export (CSV)
Dealers should be able to download their leads as CSV for CRM integration.  
**Files:** `app/(dealer)/dashboard/leads/page.tsx`

### [P5-6] Save Search / Search Alerts for Buyers
Buyers save a filter combination; get email/SMS when matching listings are added.  
Requires `SavedSearch` model + cron job matching new listings.

### [P5-7] Listing Photo Reorder
Drag-and-drop photo reordering on listing edit. `sortOrder` is stored but no UI to change it.  
**Files:** `components/listings/PhotoUploader.tsx`

### [P5-8] Bulk Listing Status Update
Select multiple listings and change status (PAUSED/SOLD) in bulk from `/dashboard/inventory`.

### [P5-9] OG Images for Vehicle Detail Pages
OG images exist for storefronts. Add `opengraph-image.tsx` for `/vehicle/[id]` for social sharing.  
**Files:** `app/vehicle/[id]/opengraph-image.tsx` (new)

### [P5-10] Dynamic Sitemap
`/sitemap.xml` generated from active listings and dealer storefronts. Next.js 13+ has built-in `sitemap.ts` support.  
**Files:** New: `app/sitemap.ts`

### [P5-11] Buyer Notification Preferences
Allow buyers/dealers to opt out of email or SMS notifications.  
Add `notificationPreferences` JSON field to `User`. Check in `lib/notifications.ts`.

### [P5-12] Dealer Onboarding Checklist
Show new dealers a checklist on the dashboard (add first listing, set logo, verify GST, share link). Drives activation.  
**Files:** `app/(dealer)/dashboard/page.tsx`

### [P5-13] Mobile Deep Linking
Wire `@capacitor/app` URL handler. Parse incoming URLs and navigate to the correct in-app route.  
Requires iOS Universal Links + Android App Links config in `public/`.  
**Files:** `mobile/`

---

## Summary

| Priority | Items | Est. Effort |
|---|---|---|
| P1 — Critical Blockers | 7 items | ~4–6 days |
| P2 — High Impact Features | 8 items | ~2–3 weeks |
| P3 — Feature Completeness | 11 items | ~2–3 weeks |
| P4 — Infrastructure & DX | 8 items | ~1–2 weeks |
| P5 — Polish | 13 items | ~1 week |
| **Total** | **47 items** | **~7–10 weeks** |

**Bottom line:** The core dealer workflow (sign up → list → receive leads → get paid) is complete and solid. Fix the P1 blockers before exposing the platform to real traffic. P2 items are needed for full product viability. The previous developers left off at the dealer-portal MVP — everything beyond that is greenfield.
