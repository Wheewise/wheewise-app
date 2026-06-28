# ARCHITECTURE_DIAGRAM.md — Wheewise System Architecture

---

## 1. High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Web Browser │  │  iOS App     │  │  Android App         │  │
│  │  (Next.js)   │  │  (Capacitor) │  │  (Capacitor)         │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼────────────────┼──────────────────────┼──────────────┘
          │                │                      │
          │    HTTPS (all traffic via HTTPS)       │
          │                │                      │
          ▼                ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                              │
│                                                                 │
│   CDN (static assets cached globally)                           │
│   + Workers (dynamic requests — OpenNext.js adapter)            │
│   + R2 Object Storage (vehicle photos, logos, banners)          │
│                                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│               NEXT.JS APPLICATION SERVER                        │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  App Router      │  │  API Routes      │                    │
│  │  (pages, layout, │  │  (/api/*)        │                    │
│  │   server comps)  │  │                  │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  lib/ (Business Logic Layer)                             │   │
│  │  auth, payments, search, email, sms, rto, gst, ai, r2   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
              ┌─────────────┼──────────────────┐
              │             │                  │
              ▼             ▼                  ▼
┌─────────────────┐ ┌──────────────┐ ┌────────────────────┐
│  Neon PostgreSQL │ │ Cloudflare   │ │  External Services │
│  (primary DB)    │ │ KV Store     │ │                    │
│                  │ │ (OTP, rate   │ │  Razorpay          │
│  Prisma ORM      │ │  limiting)   │ │  Resend (email)    │
│  via @neon       │ │              │ │  MSG91/Twilio (SMS)│
│  adapter         │ │              │ │  Surepass (KYC)    │
│                  │ │              │ │  OpenAI/Anthropic  │
│                  │ │              │ │  Sentry            │
└─────────────────┘ └──────────────┘ └────────────────────┘
```

---

## 2. Request Flow — How a Page Load Works

### Example: Buyer loads `/browse`

```
1. Browser requests GET /browse
       │
       ▼
2. Cloudflare CDN checks cache
       │  (miss — dynamic page)
       │
       ▼
3. Cloudflare Worker (OpenNext.js) routes to Next.js
       │
       ▼
4. Next.js App Router renders `app/browse/page.tsx`
       │
       ├─ Server Component: calls `searchListings()` from lib/search.ts
       │       │
       │       └─ Prisma query to Neon PostgreSQL
       │              └─ Returns paginated listings (boosted first)
       │
       ▼
5. HTML streamed back to browser
       │
       ▼
6. Client-side JS hydrates interactive elements
   (filters, pagination buttons — these are Client Components)
```

### Example: Dealer creates a listing (mutation)

```
1. Dealer submits listing form (POST via Server Action)
       │
       ▼
2. `createListing()` in lib/actions/listings.ts
       │
       ├─ requireDealer() → validates JWT session
       ├─ listingSchema.parse(formData) → Zod validation
       ├─ db.listing.create() → Neon PostgreSQL write
       ├─ AI description generation → OpenAI/Anthropic API
       ├─ revalidatePath("/dashboard/inventory") → Next.js cache bust
       └─ redirect("/dashboard/inventory")
```

---

## 3. Authentication Architecture

```
┌──────────┐     POST /api/auth/signin      ┌─────────────────────┐
│  Client  │ ──────────────────────────────▶│  NextAuth.js v5     │
│  (Login  │                                │                     │
│   Form)  │◀─────────────────────────────  │  Credentials        │
│          │  JWT cookie set                │  Provider           │
└──────────┘                                │                     │
                                            │  ┌───────────────┐  │
                                            │  │ Email/Password│  │
                                            │  │ bcryptjs hash │  │
                                            │  └───────────────┘  │
                                            │                     │
                                            │  ┌───────────────┐  │
                                            │  │ Phone OTP     │  │
                                            │  │ (6-digit,     │  │
                                            │  │  stored in KV)│  │
                                            │  └───────────────┘  │
                                            └─────────┬───────────┘
                                                      │
                                                      ▼
                                            ┌─────────────────────┐
                                            │  Neon PostgreSQL    │
                                            │  User table         │
                                            │  (role, email,      │
                                            │   phone, pwdHash)   │
                                            └─────────────────────┘

JWT Payload:
{
  sub: userId,
  role: "BUYER" | "DEALER" | "ADMIN",
  dealerId: "uuid" (if dealer),
  iat, exp
}
```

---

## 4. Payment Architecture (Razorpay)

```
                    SUBSCRIPTION FLOW
                    ─────────────────

Dealer clicks "Subscribe" on /dashboard/billing
       │
       ▼
POST /api/billing/checkout
  → Creates Razorpay Subscription (plan_id from env)
  → Returns { subscriptionId, key }
       │
       ▼
Razorpay checkout modal opens in browser
Dealer enters card/UPI details
       │
       ▼ (async — Razorpay calls our webhook)
POST /api/billing/webhook
  → Verify HMAC-SHA256 signature
  → Handle event types:
      subscription.created  → set SubStatus.TRIALING
      payment.authorized    → set SubStatus.ACTIVE
      subscription.halted   → set SubStatus.PAST_DUE
      subscription.cancelled → set SubStatus.CANCELLED


                    BOOST FLOW
                    ──────────

Dealer clicks "Boost" on a listing
       │
       ▼
POST /api/dealer/boost
  → Creates Razorpay Order (amount based on chosen duration)
  → Returns { orderId, amount, key }
       │
       ▼
Razorpay checkout modal opens
Dealer pays
       │
       ▼
POST /api/dealer/boost/verify
  → Verify HMAC-SHA256 signature (razorpay_order_id + razorpay_payment_id)
  → Idempotency: check razorpayPaymentId not already in Payment table
  → Set listing.isBoosted = true, listing.boostExpiresAt = now + duration
  → Insert Payment record
```

---

## 5. File Storage Architecture (Cloudflare R2)

```
Browser                    Next.js                 Cloudflare R2
   │                          │                         │
   │   POST /api/uploads      │                         │
   │─────────────────────────▶│                         │
   │                          │  Generate presigned URL │
   │                          │────────────────────────▶│
   │                          │◀────────────────────────│
   │◀─────────────────────────│  { presignedUrl, key }  │
   │                          │                         │
   │  PUT presignedUrl        │                         │
   │──────────────────────────┼────────────────────────▶│
   │                          │                         │  Photo stored
   │◀─────────────────────────┼─────────────────────────│  at R2_BUCKET/key
   │  200 OK                  │                         │
   │                          │                         │
   │  Save photo URL          │                         │
   │  (R2_PUBLIC_BASE_URL/key)│                         │
   │─────────────────────────▶│                         │
                              │  db.listingPhoto.create │
                              │─────────────────────────│ (just stores URL)
```

Photos are served directly from Cloudflare's CDN — no proxying through the app server.

---

## 6. Database Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Neon PostgreSQL                   │
│                                                     │
│  ┌─────────┐     ┌────────┐     ┌────────────────┐  │
│  │  User   │────▶│ Dealer │────▶│ Subscription   │  │
│  │         │     │        │     │ (Razorpay plan)│  │
│  └─────────┘     └───┬────┘     └────────────────┘  │
│                      │                              │
│              ┌───────┼─────────────────┐            │
│              ▼       ▼                 ▼            │
│          ┌───────┐ ┌──────┐       ┌────────┐       │
│          │Listing│ │Store │       │ApiKey  │       │
│          │       │ │(slug)│       │(SHA256)│       │
│          └───┬───┘ └──────┘       └────────┘       │
│              │                                     │
│    ┌─────────┼──────────────────────────┐          │
│    ▼         ▼          ▼               ▼          │
│ ┌──────┐ ┌───────┐ ┌──────────┐ ┌──────────────┐  │
│ │Photo │ │Enquiry│ │Inspection│ │LoanApplication│  │
│ │360°  │ │(lead) │ │(checklist│ │(NBFC partner)│  │
│ │Photo │ │       │ │ + score) │ │              │  │
│ └──────┘ └───────┘ └──────────┘ └──────────────┘  │
│                                                    │
│  ┌──────────────────┐    ┌──────────────────────┐  │
│  │ Conversation     │    │ Post (community)     │  │
│  │ └─ Message[]     │    │ ├─ Reply[]           │  │
│  │ (buyer↔dealer)   │    │ └─ PostUpvote[]      │  │
│  └──────────────────┘    └──────────────────────┘  │
│                                                    │
│  ┌────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │SavedListing│  │ Payment  │  │  Payout       │  │
│  │(wishlist)  │  │(Razorpay │  │  (dealer      │  │
│  │            │  │ records) │  │   commission) │  │
│  └────────────┘  └──────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 7. Application Layer Architecture

```
app/
├── (route groups) — URL routing only, no business logic
│
├── components/ — Pure UI, no direct DB access
│   └── Receive data as props from Server Components
│   └── Send mutations via Server Actions (not direct API calls)
│
├── lib/ — ALL business logic lives here
│   ├── actions/ — Mutations (Server Actions, called from components)
│   ├── validators/ — Zod schemas (validation contracts)
│   ├── db.ts — Single Prisma client (all DB access goes through here)
│   ├── auth.ts — NextAuth config
│   ├── payments.ts — Razorpay integration
│   ├── r2.ts — Cloudflare R2 storage
│   ├── email.ts — Resend email dispatch
│   ├── sms-provider.ts — MSG91/Twilio SMS dispatch
│   ├── search.ts — Listing search & filter logic
│   ├── trust-score.ts — Dealer reputation calculation
│   ├── lead-priority.ts — Lead scoring
│   ├── otp.ts — OTP generation & verification
│   ├── rate-limit.ts — Rate limiting (KV or in-memory)
│   └── ... (other services)
│
└── api/ — Thin HTTP handlers
    └── Validate → call lib/ → return JSON
    (no business logic here — delegate to lib/)
```

**Data flow direction (strict):**

```
Page/Component
     │
     ├── READ:  Server Component → lib/search.ts or lib/db.ts → DB
     │
     └── WRITE: Client Component → Server Action (lib/actions/) → lib/db.ts → DB
                                                                ↘ lib/email.ts, lib/sms.ts (notifications)
                                                                ↘ revalidatePath() (cache bust)
```

---

## 8. Mobile Architecture (Capacitor)

```
┌──────────────────────────────────────────────┐
│           iOS / Android Native Shell          │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │         Capacitor WebView              │  │
│  │                                        │  │
│  │    Renders wheewise.com (Next.js)      │  │
│  │    ≡ Full web app inside native shell  │  │
│  │                                        │  │
│  │  Native Bridge (Capacitor plugins):    │  │
│  │  • @capacitor/app (lifecycle)          │  │
│  │  • @capacitor/network (connectivity)   │  │
│  │  • @capacitor/splash-screen           │  │
│  │  • @capacitor/status-bar              │  │
│  │                                        │  │
│  │  Payments: Razorpay WebView (in-app)  │  │
│  │  (no native IAP — by design)           │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

All data and logic runs on the server — the native app is purely a shell. Updates to the web app are immediately reflected in the mobile app without an App Store release.

---

## 9. CI/CD Pipeline Architecture

```
Developer pushes to GitHub
          │
          ▼
┌─────────────────────────────────────┐
│         GitHub Actions              │
│                                     │
│  1. Lint (ESLint, no warnings)      │
│         │                           │
│  2. Typecheck (tsc --noEmit)        │
│         │                           │
│  3. Unit Tests (Vitest)             │
│         │                           │
│  4. Build (Next.js, dummy env)      │
│         │                           │
│  5. E2E Tests (Playwright)          │
│     requires E2E_DATABASE_URL       │
│         │                           │
│  ✅ All pass → ready to deploy      │
└─────────────────────────────────────┘
          │
          ▼ (manual deploy step)
┌─────────────────────────────────────┐
│  npm run cf:deploy                  │
│  → OpenNext.js build                │
│  → Wrangler uploads to              │
│    Cloudflare Workers               │
└─────────────────────────────────────┘
```

Git hooks (Husky) run **before** CI — catching issues at commit time:
- Pre-commit: ESLint + Prettier format check
- Commit-msg: Conventional Commits format (`feat:`, `fix:`, `chore:`, etc.)

---

## 10. External Service Dependencies Map

```
                    ┌──────────────┐
                    │  Wheewise    │
                    │  Application │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────────────┐
          │                │                        │
          ▼                ▼                        ▼
    ┌──────────┐    ┌─────────────┐         ┌──────────────┐
    │ Razorpay │    │   Neon DB   │         │ Cloudflare   │
    │          │    │(PostgreSQL) │         │  R2 + KV     │
    │ Payments │    │             │         │  + Workers   │
    │ Webhooks │    │  Prisma ORM │         │              │
    └──────────┘    └─────────────┘         └──────────────┘
          │
          ▼
    ┌──────────┐    ┌─────────────┐         ┌──────────────┐
    │  Resend  │    │ MSG91/Twilio│         │  Surepass    │
    │          │    │             │         │              │
    │   Email  │    │    SMS OTP  │         │  GST + RTO   │
    │          │    │             │         │  KYC lookups │
    └──────────┘    └─────────────┘         └──────────────┘
          │
          ▼
    ┌──────────┐    ┌─────────────┐
    │  OpenAI  │    │  Anthropic  │
    │  (GPT-4) │──▶│  (fallback) │
    │          │    │             │
    │  AI desc │    │  AI desc    │
    └──────────┘    └─────────────┘
          │
          ▼
    ┌──────────┐
    │  Sentry  │
    │          │
    │  Errors  │
    └──────────┘
```

**Fallback chains:**
- AI description: OpenAI → Anthropic → hardcoded template
- SMS: MSG91 → Twilio (configured by env)
- GST/RTO: Real Surepass → Mock (dev env only)

---

## 11. Key Architectural Decisions (and Why)

| Decision | Rationale |
|---|---|
| **Next.js App Router (not Pages Router)** | Server Components reduce JS bundle size; layout nesting simplifies auth gates per route group |
| **Server Actions for mutations** | Avoids a separate REST layer; TypeScript end-to-end type safety; progressive enhancement (forms work without JS) |
| **Prisma on Neon serverless** | Prisma provides type-safe DB access; Neon's serverless driver is optimized for Cloudflare Workers (HTTP-based, not TCP) |
| **JWT sessions (not DB sessions)** | Stateless; works across Cloudflare Worker instances without shared session store |
| **Cloudflare R2 for media** | S3-compatible (easy SDK); egress-free bandwidth when served via Workers; same vendor as deployment |
| **Cloudflare KV for OTP** | Globally distributed; Worker-native; works across edge instances (unlike in-memory) |
| **Razorpay (not Stripe)** | Indian payment gateway; native UPI support; INR subscriptions and payouts |
| **MSG91 over Twilio** | Indian DLT-registered sender IDs; lower cost; better delivery for Indian numbers |
| **Capacitor (not React Native)** | Reuse entire web codebase in mobile shell; web updates don't require App Store release |
| **OpenNext.js for Cloudflare** | Adapts Next.js to run on Cloudflare Workers (which doesn't natively support Node.js runtime) |
