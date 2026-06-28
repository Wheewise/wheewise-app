# PRODUCT_STATUS.md — Wheewise Product Overview & Feature Status

---

## 1. What Problem Does Wheewise Solve?

**For dealers:** Managing a pre-owned vehicle dealership in India is fragmented. Dealers maintain inventory in spreadsheets, receive leads from multiple channels (calls, WhatsApp, walk-ins), have no visibility into which listings perform, and struggle to build a credible online presence.

**For buyers:** Buying a used car or bike involves distrust — odometer tampering, accident history, inflated prices. Buyers lack a single place to compare verified vehicles, get financing, and reach dealers they can trust.

**Wheewise solves both:**
- Gives dealers a full-featured SaaS dashboard (inventory management, lead inbox, storefront, analytics).
- Gives buyers a transparent marketplace with quality inspection scores, EMI calculators, and direct chat.

---

## 2. Target Users

| User Type | Description |
|---|---|
| **Dealer (primary customer)** | Pre-owned car/bike dealership owner or staff. Pays for the subscription. Main revenue source. |
| **Buyer** | Individual browsing for a used vehicle. No subscription — free to use. |
| **Admin** | Wheewise internal team. Manages platform, approves payouts, moderates content. |
| **Inspector** | Third-party vehicle quality inspector. Conducts physical checks and uploads reports via the platform. |

---

## 3. Complete User Journey

### Journey 1 — Dealer Onboarding & Daily Use

```
Sign Up (/signup/dealer)
  → Enter business name, city, phone, optional GSTIN
  → GSTIN validated via Surepass API
  → Account created with role=DEALER + FREE_TRIAL subscription
       ↓
Dashboard (/dashboard)
  → See overview KPIs (total listings, leads this week, active subscription status)
       ↓
Set Up Storefront (/dashboard/store)
  → Choose a public URL slug (e.g., wheewise.com/s/raj-motors)
  → Upload logo & banner
  → Write bio, set brand colour
       ↓
Add Inventory (/dashboard/inventory/new  OR  /dashboard/inventory/bulk)
  → Fill listing form: make, model, year, fuel, transmission, odometer, price, city
  → Optionally: look up vehicle by registration number (auto-fills details)
  → Upload 1–10 photos + optional 360° spin photos
  → AI generates a description (OpenAI → Anthropic → template fallback)
  → Listing goes ACTIVE and appears on the marketplace
       ↓
Manage Leads (/dashboard/leads)
  → Inbound enquiries sorted by priority (phone calls > WhatsApp > form)
  → Mark as read / contacted
  → Reply via built-in chat
       ↓
Boost a Listing (/dashboard/inventory → Boost button)
  → Pay ₹199 / ₹299 / ₹499 for 7 / 14 / 30 days
  → Listing appears at the top of search results with a "Boosted" badge
       ↓
Subscribe (/dashboard/billing)
  → FREE_TRIAL expires → must subscribe MONTHLY (₹999) or YEARLY (₹9,999)
  → Razorpay handles recurring billing
  → If subscription lapses → dashboard locked, redirected to billing page
       ↓
Request Inspection (/dashboard/inspections)
  → Request a quality inspection for a listing
  → Inspector visits, fills checklist, uploads report
  → Inspection score shown on listing & storefront TrustStrip
       ↓
View Finance Applications (/dashboard/loans)
  → Buyers who applied for financing on their listings appear here
       ↓
Manage API Keys (/dashboard/api-keys)
  → Generate API keys to integrate Wheewise listing data into external systems
```

### Journey 2 — Buyer Browsing & Enquiry

```
Land on Homepage (/)
  → Marketing site: how it works, pricing, trust signals
       ↓
Browse Listings (/browse)
  → Filter by: vehicle type, make, model, city, fuel type, transmission, price range
  → Listings sorted: boosted first, then newest
  → Paginated (cursor-based)
       ↓
View Vehicle Detail (/vehicle/[id])
  → Full photo gallery (with optional 360° spin view)
  → Specs (year, fuel, transmission, odometer, city)
  → Inspection report & score (if inspection exists)
  → EMI calculator (adjust loan amount, tenure, interest rate)
  → Save to wishlist (/wishlist)
  → Add to comparison (/compare)
  → Submit enquiry form → dealer gets notified
  → Apply for financing → NBFC partner notified
       ↓
Chat with Dealer
  → Chat widget opens a Conversation thread (per listing per buyer)
  → Real-time messaging via WebSocket
       ↓
Visit Dealer Storefront (/s/[slug])
  → See all of a specific dealer's inventory
  → Dealer trust strip (verified badge, response time, inspection score)
  → Featured carousel (boosted listings)
       ↓
Join Community (/community for buyers, /forum/dealer for dealers)
  → Browse/create posts, reply, upvote
  → Posts tagged by topic
```

### Journey 3 — Admin Operations

```
Admin Dashboard (/admin)
  → KPIs: total dealers, active subscriptions, listings, leads
       ↓
Manage Dealers (/admin/dealers)
  → View all dealers, suspend/reinstate accounts
       ↓
Manage Listings (/admin/listings)
  → Search all listings, pause problematic ones
       ↓
Manage Inspectors (/admin/inspectors)
  → Approve or reject inspector applications
       ↓
Review Inspections (/admin/inspections)
  → See all inspection requests and completed reports
       ↓
Process Payouts (/admin/payouts)
  → Approve payout requests to dealers (partner referral commissions, etc.)
       ↓
Moderate Community (/admin/community)
  → Pin or lock posts
       ↓
Manage Notification Templates (/admin/templates)
  → Edit email/SMS templates for system notifications
```

### Journey 4 — Inspector

```
Sign Up (via User signup with inspector intent)
  → Admin reviews and approves inspector application
       ↓
Receive Inspection Assignment
  → Dealer requests inspection for a listing
  → Inspector is notified and schedules visit
       ↓
Conduct Inspection
  → Fill predefined checklist (lib/inspection-checklist.ts)
  → Enter notes, overall score
  → Upload report PDF or images
       ↓
Inspection Completed
  → Status → COMPLETED
  → Score displayed on listing and dealer's TrustStrip
```

---

## 4. All Business Requirements Implemented

| # | Requirement | Status | Primary Files |
|---|---|---|---|
| BR-01 | Dealer registration with optional GST verification | ✅ Complete | `(auth)/signup/dealer/`, `lib/actions/auth.ts`, `lib/gst.ts` |
| BR-02 | Buyer registration (email/password or phone OTP) | ✅ Complete | `(auth)/signup/`, `(auth)/login/`, `lib/otp.ts` |
| BR-03 | Dealer subscription billing (monthly & yearly) | ✅ Complete | `(dealer)/dashboard/billing/`, `api/billing/`, `lib/payments.ts` |
| BR-04 | Subscription gating (dashboard locked if expired) | ✅ Complete | `(dealer)/dashboard/layout.tsx` |
| BR-05 | Listing creation with photo upload | ✅ Complete | `(dealer)/dashboard/inventory/new/`, `lib/actions/listings.ts` |
| BR-06 | Listing editing | ✅ Complete | `(dealer)/dashboard/inventory/[id]/edit/` |
| BR-07 | CSV bulk listing import | ✅ Complete | `(dealer)/dashboard/inventory/bulk/`, `api/dealer/bulk-upload/` |
| BR-08 | RTO vehicle lookup (prefill listing form) | ✅ Complete | `components/listings/RtoLookup.tsx`, `lib/rto.ts` |
| BR-09 | AI-generated listing descriptions | ✅ Complete | `api/ai/generate-description/`, `lib/ai-description.ts` |
| BR-10 | 360° photo upload and viewer | ✅ Complete | `components/listings/Photo360Uploader.tsx`, `components/vehicle/SpinViewer.tsx` |
| BR-11 | Public listing browse with filters | ✅ Complete | `browse/`, `api/public/listings/`, `lib/search.ts` |
| BR-12 | Boosted listings appear first | ✅ Complete | DB index on `(isBoosted, status, createdAt)`, search query |
| BR-13 | Listing boost payment (time-based) | ✅ Complete | `api/dealer/boost/`, `api/dealer/boost/verify/`, `lib/razorpay.ts` |
| BR-14 | Vehicle detail page (photos, specs, EMI calc) | ✅ Complete | `vehicle/[id]/` |
| BR-15 | EMI calculator | ✅ Complete | `components/vehicle/EmiCalculator.tsx`, `lib/emi.ts` |
| BR-16 | Buyer enquiry form | ✅ Complete | `components/vehicle/EnquiryForm.tsx`, `lib/actions/leads.ts` |
| BR-17 | Dealer lead inbox with priority sorting | ✅ Complete | `(dealer)/dashboard/leads/`, `lib/lead-priority.ts` |
| BR-18 | WhatsApp enquiry routing | ✅ Complete | `lib/whatsapp.ts`, `EnquirySource.WHATSAPP` |
| BR-19 | Buyer wishlist (save listings) | ✅ Complete | `wishlist/`, `api/wishlist/`, `components/vehicle/SaveButton.tsx` |
| BR-20 | Vehicle comparison | ✅ Complete | `compare/`, `components/vehicle/CompareButton.tsx` |
| BR-21 | Real-time buyer-dealer chat | ✅ Complete | `api/chat/`, `components/chat/ChatWidget.tsx` |
| BR-22 | Dealer storefront (custom slug) | ✅ Complete | `s/[slug]/`, `(dealer)/dashboard/store/`, `lib/actions/store.ts` |
| BR-23 | Dealer trust score display | ✅ Complete | `lib/trust-score.ts`, `components/storefront/TrustStrip.tsx` |
| BR-24 | Quality inspection workflow | ✅ Complete | `(dealer)/dashboard/inspections/`, `inspections/[id]/`, `lib/actions/inspections.ts` |
| BR-25 | Inspector approval by admin | ✅ Complete | `(admin)/admin/inspectors/` |
| BR-26 | Inspection checklist & scoring | ✅ Complete | `lib/inspection-checklist.ts` |
| BR-27 | Loan application via NBFCs | ✅ Complete | `components/vehicle/LoanApplyForm.tsx`, `lib/actions/finance.ts` |
| BR-28 | Admin dashboard (stats, moderation) | ✅ Complete | `(admin)/admin/` (all sub-pages) |
| BR-29 | Payout management (admin approves) | ✅ Complete | `(admin)/admin/payouts/`, `lib/actions/admin.ts` |
| BR-30 | Community forums (buyer & dealer) | ✅ Complete | `community/`, `forum/dealer/`, `lib/actions/community.ts` |
| BR-31 | Post upvotes, pinning, locking | ✅ Complete | `community/UpvoteButton.tsx`, admin moderation |
| BR-32 | Notification templates (email/SMS) | ⚠️ Partial | `(admin)/admin/templates/` (template editor exists), but templates not fully wired to dispatch calls |
| BR-33 | Developer API with API keys | ✅ Complete | `(dealer)/dashboard/api-keys/`, `api/public/`, `lib/api-auth.ts` |
| BR-34 | Rate limiting across all public endpoints | ✅ Complete | `lib/rate-limit.ts`, applied to OTP, browse, developer API |
| BR-35 | Webhook signature verification (Razorpay) | ✅ Complete | `api/billing/webhook/`, `api/webhooks/razorpay/` |
| BR-36 | Mobile app shell (iOS & Android) | ✅ Complete | `mobile/` (Capacitor 7) |
| BR-37 | SEO (JSON-LD, sitemap, robots.txt) | ✅ Complete | `lib/json-ld.ts`, `app/sitemap.ts`, `app/robots.ts` |
| BR-38 | Cookie consent banner | ✅ Complete | `components/ui/CookieConsent.tsx` |
| BR-39 | Privacy & Terms pages | ✅ Complete | `privacy/`, `terms/` |
| BR-40 | Error tracking (Sentry) | ✅ Complete | `lib/sentry.ts` |

---

## 5. Partially Completed Features

| Feature | What's Done | What's Missing | Files |
|---|---|---|---|
| **Notification Templates** | Template model in DB, admin editor UI, `NotificationTemplate` table | Template content not connected to actual email/SMS dispatch — `sendEmail()` and `dispatchNotification()` use hardcoded strings | `(admin)/admin/templates/`, `lib/email.ts`, `lib/notifications.ts` |
| **Search / Discovery** | Basic PostgreSQL full-text search works; boosted sorting works | No Elasticsearch/Typesense integration for advanced ranking, fuzzy search, or faceted counts | `lib/search.ts`, `api/public/listings/` |
| **Chat (Real-time)** | Data model complete (Conversation, Message), send/receive API routes done | WebSocket server wiring for live push to clients unclear — may require a polling fallback in the UI | `api/chat/`, `components/chat/ChatWidget.tsx` |
| **Deep Linking (Mobile)** | `@capacitor/app` plugin installed | Not wired to handle `/vehicle/[id]` links opening in-app | `mobile/` |
| **Payout Workflow** | Admin approve UI and Razorpay payout model exist | Automated payout trigger and error recovery not visible in code | `(admin)/admin/payouts/`, `lib/payments.ts` |

---

## 6. Missing Features

| Feature | Priority | Rationale |
|---|---|---|
| Push Notifications (mobile) | High | Code explicitly notes FCM/APNs backend setup required before plugin is useful |
| Offline Support (mobile web) | Medium | No service worker; mobile shows native offline page only |
| Biometric Auth | Low | Explicitly deferred: "dealer login frequency doesn't justify it yet" |
| Advanced Search (Elasticsearch) | Medium | Current PostgreSQL search works but won't scale to high volume |
| Dealer Analytics Dashboard | Medium | ViewCount tracked in DB but no analytics charts/trends UI exists |
| Buyer Profile / Account Settings | Low | Buyers can save listings but have no profile editing page |
| Dealer Review / Rating by Buyers | Medium | TrustScore exists but no buyer-submitted rating UI |
| Notification Preferences | Low | No UI to manage which notifications a user receives |
| In-App Purchases | Not planned | All payments go through Razorpay WebView; Capacitor IAP not needed |

---

## 7. Where the Previous Developers Stopped

Based on code analysis, the previous team completed a full MVP and were mid-way through the following:

1. **Notification templates system** — The database model, admin UI for editing templates, and the `NotificationTemplate` table are all built. The missing step is wiring `lib/email.ts` and `lib/sms-provider.ts` to look up and render templates from the DB instead of using hardcoded strings.

2. **Mobile push notifications** — The Capacitor shell is complete. A comment in code explicitly flags that push notifications require a FCM/APNs backend server component that was not implemented.

3. **Deep linking on mobile** — `@capacitor/app` is installed but the link handler that maps incoming URLs to in-app navigation is not wired.

4. **Advanced search** — A comment in `lib/search.ts` references an Elasticsearch ranking approach as the intended next step once volume grows.

5. **Dealer analytics** — `ListingView` records are being created (view counting works), but there is no UI page to visualise view trends, lead conversion rates, or engagement metrics for dealers.

---

## 8. Feature Status Matrix

| Feature | Status | Files Involved | Notes |
|---|---|---|---|
| Dealer signup + GST verification | ✅ Complete | `(auth)/signup/dealer/`, `lib/gst.ts`, `lib/actions/auth.ts` | |
| Buyer signup (email + OTP) | ✅ Complete | `(auth)/signup/`, `(auth)/login/`, `lib/otp.ts` | |
| JWT sessions + role gates | ✅ Complete | `lib/auth.ts`, `lib/auth-handler.ts` | |
| Subscription billing (Razorpay) | ✅ Complete | `api/billing/`, `lib/payments.ts`, `lib/razorpay.ts` | |
| Subscription gating | ✅ Complete | `(dealer)/dashboard/layout.tsx` | |
| Listing CRUD | ✅ Complete | `(dealer)/dashboard/inventory/`, `lib/actions/listings.ts` | |
| CSV bulk upload | ✅ Complete | `api/dealer/bulk-upload/` | Max 100 rows, 1 MB |
| RTO lookup (form prefill) | ✅ Complete | `components/listings/RtoLookup.tsx`, `lib/rto.ts` | |
| AI description generation | ✅ Complete | `api/ai/generate-description/`, `lib/ai-description.ts` | OpenAI → Anthropic → template |
| Photo upload (multi-image) | ✅ Complete | `components/listings/PhotoUploader.tsx`, `api/uploads/`, `lib/r2.ts` | |
| 360° photo upload & viewer | ✅ Complete | `components/listings/Photo360Uploader.tsx`, `components/vehicle/SpinViewer.tsx` | |
| Listing boost (pay-per-boost) | ✅ Complete | `api/dealer/boost/`, `components/listings/BoostButton.tsx` | |
| Public browse + filters | ✅ Complete | `browse/`, `api/public/listings/`, `lib/search.ts` | |
| Vehicle detail page | ✅ Complete | `vehicle/[id]/` | |
| EMI calculator | ✅ Complete | `components/vehicle/EmiCalculator.tsx`, `lib/emi.ts` | |
| Buyer enquiry form | ✅ Complete | `components/vehicle/EnquiryForm.tsx` | |
| Dealer lead inbox | ✅ Complete | `(dealer)/dashboard/leads/`, `lib/lead-priority.ts` | |
| WhatsApp routing | ✅ Complete | `lib/whatsapp.ts` | |
| Buyer wishlist | ✅ Complete | `wishlist/`, `api/wishlist/` | |
| Vehicle comparison | ✅ Complete | `compare/` | |
| Real-time chat | ✅ Complete | `api/chat/`, `components/chat/ChatWidget.tsx` | Real-time push wiring may need verification |
| Dealer storefront | ✅ Complete | `s/[slug]/`, `(dealer)/dashboard/store/` | |
| Dealer trust score | ✅ Complete | `lib/trust-score.ts`, `components/storefront/TrustStrip.tsx` | |
| Vehicle inspection workflow | ✅ Complete | `(dealer)/dashboard/inspections/`, `inspections/[id]/` | |
| NBFC loan applications | ✅ Complete | `components/vehicle/LoanApplyForm.tsx` | 10 NBFC partners |
| Admin dashboard | ✅ Complete | `(admin)/admin/` | All sub-pages present |
| Payout management | ⚠️ Partial | `(admin)/admin/payouts/` | Trigger automation incomplete |
| Community forums | ✅ Complete | `community/`, `forum/dealer/` | |
| Notification templates | ⚠️ Partial | `(admin)/admin/templates/`, `lib/email.ts` | Templates not wired to dispatch |
| Developer API + API keys | ✅ Complete | `(dealer)/dashboard/api-keys/`, `api/public/` | SHA-256 hashing implemented |
| Rate limiting | ✅ Complete | `lib/rate-limit.ts` | |
| SEO (JSON-LD, sitemap) | ✅ Complete | `lib/json-ld.ts`, `app/sitemap.ts` | |
| Mobile shell (iOS/Android) | ✅ Complete | `mobile/` | |
| Push notifications | ❌ Missing | `mobile/` | FCM/APNs backend not built |
| Deep linking (mobile) | ❌ Missing | `mobile/` | Handler not wired |
| Dealer analytics / charts | ❌ Missing | — | Data exists, no UI |
| Buyer profile editing | ❌ Missing | — | No account settings page |
| Offline support (web) | ❌ Missing | — | No service worker |
| Advanced search | ❌ Missing | `lib/search.ts` | Postgres only; Elasticsearch noted |
| Dealer reviews by buyers | ❌ Missing | — | TrustScore calculated but no buyer input |
