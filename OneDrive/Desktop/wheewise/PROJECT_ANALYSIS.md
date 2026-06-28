# Wheewise — Complete Project Analysis

> **Analyzed:** 2026-06-28  
> **Audience:** New developers joining mid-project with zero prior context.  
> **Repository root:** `wheewise/wheewise-app/`

---

## 1. Project Overview

**Wheewise** is a **dealer-first marketplace for pre-owned cars and bikes in India**. The central idea: every registered dealer gets a custom-branded, shareable storefront URL (`/s/[slug]/showcase`) — their complete digital showroom, one link.

**Four user roles:**
- **Dealers** — List inventory, manage leads, subscribe to paid plans, boost listings.
- **Buyers** — Browse vehicles, save favourites, chat with dealers, apply for finance, use the community forum.
- **Administrators** — Oversee the platform: approve dealers, moderate listings, manage payouts, configure notification templates.
- **Inspectors** — Conduct physical quality checks on vehicles, upload reports.

**Business model:** SaaS + marketplace. Dealers pay monthly/yearly subscription (Razorpay). Additional revenue from per-listing boosts (7/14/30-day paid promotion).

**Key differentiators vs. traditional classifieds:**

| Feature | Wheewise | Traditional |
|---|---|---|
| Dealer-branded storefront | Yes | No |
| RTO API auto-fill (make/model/year/fuel) | Yes | Manual entry |
| GST-verified dealer badge | Yes | No |
| AI-generated listing description | Yes | No |
| EMI calculator on listing | Yes | Rare |
| Listing boost / paid promotion | Yes | Limited |
| Quality inspection score | Yes | No |

---

## 2. System Architecture

### Actual Deployed Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     BROWSER / MOBILE (Capacitor)                │
│          Next.js 16 App Router (SSR + RSC + Route Handlers)     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────────┐
│              CLOUDFLARE WORKERS  (@opennextjs/cloudflare)       │
│   middleware.ts: CSP nonce, HSTS, X-Frame-Options, etc.         │
│   Rate limiting: Cloudflare KV + in-memory token bucket         │
└─────────┬──────────────────────┬──────────────────────┬─────────┘
          │                      │                      │
  ┌───────▼──────┐    ┌──────────▼────────┐  ┌────────▼──────────┐
  │  Neon Postgres│   │  Cloudflare R2     │  │  Third-Party APIs │
  │  (Prisma 6 +  │   │  (vehicle photos,  │  │  Razorpay         │
  │   neon adapter│   │   presigned PUT)   │  │  Resend (email)   │
  │   + WebSocket)│   └───────────────────┘  │  MSG91 / Twilio   │
  └───────────────┘                          │  Surepass (GST+RTO│
                                             │  OpenAI/Anthropic) │
                                             └───────────────────┘
```

> **Critical context:** The `WHEEWISE_SDD.md` north-star spec describes NestJS, Redis, Elasticsearch, BullMQ, Socket.io, and AWS ECS. **None of these exist in the actual codebase.** The real stack is a Next.js monolith deployed to Cloudflare Workers. The SDD is aspirational v2 documentation — treat it as a product requirements document, not a technical description of what's built.

### Architecture Principles (as implemented)

- **Modular monolith** — All code in one Next.js app; lib/ modules have clear domain boundaries.
- **Server-first rendering** — Most pages are React Server Components with zero client JS.
- **Mutations via Server Actions** — No separate API calls for writes from the frontend; `"use server"` functions with `revalidatePath()`.
- **REST API** for external/mobile consumers and internal client components that need it.
- **Edge-first** — Designed to run on Cloudflare Workers (no `node:` APIs in hot paths, Neon serverless driver, Cloudflare KV for OTP/rate limiting).

---

## 3. Complete Folder Structure

```
wheewise/
└── wheewise-app/
    ├── .github/
    │   └── workflows/ci.yml           ← GitHub Actions (lint → typecheck → test → build → E2E)
    ├── .husky/                        ← Git hooks (pre-commit: prettier+eslint, commit-msg: commitlint)
    ├── WHEEWISE_SDD.md                ← v2 north-star product spec (67 KB). NOT a description of what's built.
    ├── BACKEND_FOR_FRONTEND.md        ← Frontend dev quick-ref (schema, patterns, data fetching)
    ├── DEPLOYMENT_PLAN.md             ← Staging + production rollout plan
    ├── mobile/                        ← Capacitor native shell
    │   └── package.json               ← @capacitor/core, ios, android, network, splash-screen, status-bar
    └── app/                           ← Next.js application root
        ├── app/                       ← Next.js App Router (all routes)
        │   ├── (admin)/               ← Admin route group (ADMIN role required)
        │   │   ├── admin/page.tsx     ← KPI dashboard (dealers, listings, leads, subs)
        │   │   ├── admin/dealers/     ← Dealer list (data-display stub — no actions yet)
        │   │   ├── admin/listings/    ← Moderation queue (data-display stub)
        │   │   ├── admin/inspections/ ← Inspection oversight (stub)
        │   │   ├── admin/inspectors/  ← Inspector management (stub)
        │   │   ├── admin/payouts/     ← Payout approvals (stub)
        │   │   ├── admin/community/   ← Post moderation (stub)
        │   │   ├── admin/templates/   ← Notification template editor (stub)
        │   │   ├── AdminNav.tsx       ← Admin sidebar
        │   │   └── layout.tsx         ← ADMIN role gate
        │   ├── (auth)/                ← Public auth routes
        │   │   ├── login/             ← Tabbed login (email+pw / phone+OTP / dev fast-login)
        │   │   └── signup/            ← Buyer signup + dealer signup (/signup/dealer)
        │   ├── (dealer)/              ← Dealer portal (DEALER role + active subscription)
        │   │   └── dashboard/
        │   │       ├── page.tsx       ← KPI cards + recent leads table
        │   │       ├── layout.tsx     ← Sidebar nav + ChatWidget
        │   │       ├── inventory/     ← List / new / edit / bulk-upload listings
        │   │       ├── leads/         ← Lead CRM (mark read, mark contacted, priority sort)
        │   │       ├── billing/       ← Razorpay subscription checkout
        │   │       ├── inspections/   ← Request quality inspection
        │   │       ├── api-keys/      ← Create/revoke developer API keys
        │   │       ├── loans/         ← View buyer loan applications on dealer's vehicles
        │   │       └── store/         ← Storefront branding (logo, banner, bio, color)
        │   ├── api/                   ← REST API route handlers
        │   │   ├── auth/send-otp/     ← OTP SMS dispatch
        │   │   ├── auth/[...nextauth] ← NextAuth handler
        │   │   ├── ai/generate-description/ ← AI description (OpenAI→Anthropic→mock)
        │   │   ├── billing/checkout/  ← Initiate Razorpay subscription
        │   │   ├── billing/webhook/   ← Subscription lifecycle events
        │   │   ├── chat/conversations/ ← List / create conversations
        │   │   ├── chat/messages/     ← Send messages
        │   │   ├── dealer/api-keys/   ← CRUD API keys
        │   │   ├── dealer/boost/      ← Create boost Razorpay order
        │   │   ├── dealer/boost/verify/ ← Verify + activate boost
        │   │   ├── dealer/bulk-upload/ ← CSV listing import
        │   │   ├── gst/verify/        ← GSTIN verification
        │   │   ├── leads/             ← Submit / list enquiries
        │   │   ├── listings/          ← Listing CRUD
        │   │   ├── public/listings/   ← Public API (API key auth, rate-limited)
        │   │   ├── public/dealer/     ← Public dealer stats (API key auth)
        │   │   ├── rto/               ← RTO vehicle lookup
        │   │   ├── uploads/           ← R2 presigned URL generation
        │   │   ├── webhooks/razorpay/ ← Payment event webhook (idempotent)
        │   │   └── wishlist/          ← Save / unsave listing toggle
        │   ├── browse/page.tsx        ← Public search (keyword, city, type, fuel, price, year)
        │   ├── compare/page.tsx       ← Side-by-side spec comparison (up to 3 vehicles)
        │   ├── community/             ← Buyer forum (posts, replies, upvotes)
        │   ├── forum/dealer/          ← Dealer forum (separate community)
        │   ├── hackathon/page.tsx     ← Marketing/event stub
        │   ├── inspections/[id]/      ← Public inspection report view
        │   ├── rc-transfer/page.tsx   ← RC transfer info page
        │   ├── s/[slug]/showcase/     ← Public dealer storefront (shareable link)
        │   ├── vehicle/[id]/          ← Vehicle detail (photos, specs, EMI, enquiry, wishlist)
        │   ├── wishlist/page.tsx      ← Buyer's saved listings
        │   ├── privacy/page.tsx       ← Privacy policy
        │   ├── terms/page.tsx         ← Terms of service
        │   ├── layout.tsx             ← Root layout (fonts, metadata, CookieConsent)
        │   └── page.tsx               ← Landing page
        ├── components/
        │   ├── brand/                 ← Logo, Footer, Stars
        │   ├── chat/ChatWidget.tsx    ← Chat UI (polls REST, NOT real-time WebSocket)
        │   ├── listings/              ← ListingForm, PhotoUploader, Photo360Uploader, RtoLookup, BoostButton
        │   ├── storefront/            ← ShowcaseHero, ListingCard, PremiumListingCard, FeaturedCarousel,
        │   │                            StorefrontInquiryForm, StickyContactBar, AboutDealer, TrustStrip
        │   ├── ui/Field.tsx           ← Generic form field + Button primitives
        │   └── vehicle/               ← SaveButton, EnquiryForm, PhotoGallery, ViewCounter
        ├── lib/                       ← All business logic and integrations
        │   ├── actions/               ← Server Actions grouped by domain
        │   │   ├── auth.ts            ← signupBuyer, signupDealer, loginAction
        │   │   ├── admin.ts           ← getAdminStats (and likely more admin actions)
        │   │   ├── finance.ts         ← getDealerLoanApplications
        │   │   ├── listings.ts        ← Listing CRUD server actions
        │   │   └── community.ts       ← Post/reply/upvote actions
        │   ├── auth.ts                ← NextAuth v5 config (JWT, Credentials provider)
        │   ├── auth-handler.ts        ← NextAuth export wrapper
        │   ├── db.ts                  ← Prisma singleton (Neon serverless adapter)
        │   ├── env.ts                 ← Zod env validation + dev-flag boot guards
        │   ├── dealer.ts              ← requireDealer() auth gate + subscription check
        │   ├── api-auth.ts            ← API key generation (wk_ prefix), SHA-256 hashing, validation
        │   ├── rate-limit.ts          ← Token bucket (in-memory + Cloudflare KV)
        │   ├── otp.ts                 ← 6-digit OTP, 5-min TTL, 3-attempt cap, KV/in-mem storage
        │   ├── password.ts            ← Password complexity rules (8+ chars, upper+lower+digit+special)
        │   ├── r2.ts                  ← Cloudflare R2 S3 client, presigned PUT URLs (8MB, jpg/png/webp)
        │   ├── razorpay.ts            ← Razorpay client, HMAC signature verify, boost plans
        │   ├── payments.ts            ← Payment audit helpers
        │   ├── email.ts               ← Resend integration (lead notification email)
        │   ├── sms-provider.ts        ← MSG91 (primary) + Twilio (fallback) unified SMS
        │   ├── notifications.ts       ← Fan-out dispatcher: email + SMS with isolated failure handling
        │   ├── gst.ts                 ← GSTIN regex + verifyGstin() (Surepass or mock)
        │   ├── gst-provider.ts        ← Surepass API integration
        │   ├── rto.ts                 ← RTO registration lookup (Surepass or mock)
        │   ├── rto-provider.ts        ← Surepass RC API
        │   ├── ai-description.ts      ← generateDescription(): OpenAI→Anthropic→template chain
        │   ├── search.ts              ← Listing search/filter (Prisma LIKE — NOT Elasticsearch)
        │   ├── emi.ts                 ← EMI amortization formula
        │   ├── format.ts              ← INR formatting (lakh/k), date formatting
        │   ├── image.ts               ← Image optimization helpers
        │   ├── json-ld.ts             ← Schema.org JSON-LD structured data for SEO
        │   ├── lead-priority.ts       ← scoreLead(): message length + email + auth + phone validity
        │   ├── moderation.ts          ← Content moderation utils (NOT wired to any route yet)
        │   ├── trust-score.ts         ← Dealer trust score (NOT surfaced in UI yet)
        │   ├── inspection-checklist.ts ← Pre-defined checklist templates (exterior/interior/engine/electrical)
        │   ├── template.ts            ← NotificationTemplate renderer
        │   ├── whatsapp.ts            ← WhatsApp integration STUB (not implemented)
        │   ├── cloudflare-bindings.ts ← Cloudflare KV/R2 binding helpers
        │   └── sentry.ts              ← Sentry error tracking
        ├── prisma/
        │   ├── schema.prisma          ← Complete DB schema (625 lines, 17 models, 14 enums)
        │   ├── seed.ts                ← Demo dealer + 6 listings (demo@wheewise.in / demo1234)
        │   └── migrations/            ← SQL migration history
        ├── tests/
        │   ├── unit/                  ← Vitest unit tests (EMI, OTP, rate-limit, lead scoring, etc.)
        │   └── e2e/                   ← Playwright E2E (browse, storefront inquiry)
        ├── public/brand/              ← Logo and branding assets
        ├── .env.example               ← Documented env template (25+ variables)
        ├── package.json               ← Dependencies + scripts
        ├── tsconfig.json              ← strict: true, @/* alias
        ├── next.config.ts             ← Minimal Next.js config (Cloudflare-compatible)
        ├── playwright.config.ts       ← E2E test configuration
        └── middleware.ts              ← Global CSP nonce + 6 security headers (all routes)
```

**Key mental model:** `app/` = routing concerns; `lib/` = all business logic; `components/` = UI building blocks; `prisma/` = database contract.

---

## 4. Frontend Technologies

| Tool | Version | Purpose |
|---|---|---|
| **Next.js** | 16.2.5 | Full-stack framework (App Router, SSR, RSC, Route Handlers, Server Actions) |
| **React** | 19.2.4 | UI library |
| **TypeScript** | ^5 | Strict type safety (`strict: true`) |
| **Tailwind CSS** | v4 | Utility-first CSS (PostCSS v4, CSS custom properties for theming) |
| **NextAuth v5** | ^5.0.0-beta.31 (beta) | Authentication (JWT sessions, Credentials provider) |
| **Capacitor** | v7 | Native iOS/Android shell wrapping the web app |

### Rendering Strategy
- **Server Components (RSC)** — Most pages are rendered server-side: zero client JS overhead.
- **Client Components** (`"use client"`) — Interactive pieces: forms, uploaders, chat, toggle buttons.
- **Server Actions** (`"use server"`) — All mutation paths from the frontend (signup, create listing, mark lead read, etc.).
- **Route Handlers** (`route.ts`) — REST API for external consumers, webhooks, and client components that need async data.
- **Route Groups** — `(admin)`, `(auth)`, `(dealer)` are organizational only; they don't affect URLs.

### State Management
No dedicated state library. State is managed at three levels:

| Level | Mechanism | Examples |
|---|---|---|
| URL state | `useSearchParams`, `useRouter` | Browse filters, pagination |
| Server state | Server Actions + `revalidatePath()` | All writes (mutations) |
| Local UI state | `useState`, `useReducer` | Form inputs, modals, tabs |

After every Server Action, `revalidatePath()` invalidates the Next.js cache for relevant routes. No manual cache management needed for server-mutated data.

### UI Approach
Custom Tailwind components throughout. **No shadcn/ui, no Radix UI, no React Hook Form** (the SDD spec'd these but they were not implemented). Forms use native HTML with server actions or `fetch`.

---

## 5. Backend Technologies

| Tool | Version | Purpose |
|---|---|---|
| **Next.js Route Handlers** | 16.2.5 | REST API (`/api/**`) |
| **Node.js** | 22 | Runtime (local dev) |
| **Prisma** | ^6.19.3 | Type-safe ORM + migrations |
| **`@prisma/adapter-neon`** | ^6.19.3 | Neon serverless WebSocket driver for edge runtime |
| **`@neondatabase/serverless`** | ^1.1.0 | Neon WebSocket connection |
| **bcryptjs** | ^3.0.3 | Password hashing (12 rounds) |
| **zod** | ^4.4.3 | Runtime schema validation (env, API payloads, form data) |
| **`@aws-sdk/client-s3`** | ^3.1044.0 | Cloudflare R2 via S3-compatible API |
| **`@aws-sdk/s3-request-presigner`** | ^3.1044.0 | Presigned PUT URL generation for direct browser upload |
| **Razorpay** | ^2.9.6 | Payments SDK (subscriptions, orders, webhooks) |
| **Resend** | ^6.12.3 | Transactional email |
| **ws** | ^8.20.0 | WebSocket for Neon driver in Node.js (dev environment only) |
| **`@opennextjs/cloudflare`** | ^1.19.8 | Cloudflare Workers adapter |
| **Wrangler** | ^4.88.0 | Cloudflare deployment CLI |

### Database Access Pattern
```typescript
// Always import from lib/db.ts — never instantiate Prisma directly
import { prisma } from "@/lib/db";
const listing = await prisma.listing.findUnique({ where: { id } });
```

### SDD vs. Reality (Tech Stack)

| SDD Planned | Actually Built |
|---|---|
| NestJS backend | Next.js Route Handlers |
| Redis (cache + sessions) | Cloudflare KV (OTP only) |
| Elasticsearch (full-text search) | Prisma LIKE queries |
| Socket.io (real-time chat) | REST polling (no real-time) |
| BullMQ (async job queues) | Synchronous in-handler calls |
| Docker + AWS ECS/Fargate | Cloudflare Workers |
| AWS S3 + CloudFront | Cloudflare R2 (presigned direct uploads) |
| Grafana + Prometheus | Sentry only |
| Zustand (state management) | None (RSC + useState) |
| shadcn/ui | Custom Tailwind components |
| React Hook Form + Zod | Native HTML forms + server actions |
| Recharts (analytics charts) | None — no charts implemented |

---

## 6. Database Technology and Schema

**Database:** PostgreSQL 15, hosted on **Neon** (serverless, HTTP + WebSocket driver)  
**ORM:** Prisma 6 with `@prisma/adapter-neon`  
**Schema:** `app/prisma/schema.prisma` (625 lines, 17 models, 14 enums)

### Entity Relationship Overview

```
User ──────────── Dealer ──────────── Store (slug, logo, bio, primaryColor)
  │ (1:1)            │ (1:1)
  │                  ├── Subscription (plan, status, razorpaySubId, currentPeriodEnd)
  │                  │
  │                  ├── Listing[] ─────── ListingPhoto[]
  │                  │                    Listing360Photo[]
  │                  │                    ListingView[] (unique visitorId dedup)
  │                  │
  │                  ├── Enquiry[] (leads from buyers)
  │                  ├── Conversation[] ── Message[]
  │                  ├── ApiKey[]
  │                  ├── Payout[]
  │                  └── Inspection[]
  │
  ├── SavedListing[] (wishlist, unique per user+listing)
  ├── Conversation[] ── Message[]
  ├── Post[] ── Reply[]
  │     └── PostUpvote[] (unique per post+user)
  ├── Inspector (1:1, certification, approval status)
  └── LoanApplication[] (per vehicle, unique per buyer+listing)
```

### All Models (detailed)

#### Users & Auth
| Model | Key Fields | Notes |
|---|---|---|
| `User` | `id` (cuid), `email?` (unique), `phone?` (unique), `passwordHash?`, `name?`, `role` | Email nullable: phone-OTP users have no email. Password nullable: OTP-only accounts. |
| `Account` | NextAuth OAuth link | Credentials flow doesn't populate this; kept for adapter compatibility. |
| `Session` | JWT strategy — rows rarely written | Kept for Prisma adapter compatibility. |
| `VerificationToken` | Email verification token | Model exists; no email verification flow is implemented. |

#### Dealer & Storefront
| Model | Key Fields | Notes |
|---|---|---|
| `Dealer` | `userId` (unique), `businessName`, `city`, `phone`, `whatsapp?`, `gstin?`, `gstVerified`, `status` (ACTIVE/SUSPENDED) | 1:1 with User. Created alongside User at dealer signup. |
| `Store` | `dealerId` (unique), `slug` (unique), `logoUrl?`, `bannerUrl?`, `bio?`, `primaryColor` (default: `#DC2626`) | Public storefront. Slug auto-generated at signup with retry for uniqueness. |

#### Listings
| Model | Key Fields | Notes |
|---|---|---|
| `Listing` | `dealerId`, `vehicleType` (CAR/BIKE), `make`, `model`, `year`, `fuelType`, `transmission?`, `odometerKm`, `askingPrice` (Decimal 12,2), `city`, `status` (ACTIVE/PAUSED/SOLD), `viewCount`, `enquiryCount`, `isBoosted`, `boostExpiresAt?`, `insuranceProvider?`, `insuranceExpiry?` | Compound indexes: (city,vehicleType,status), (dealerId,status), (status,createdAt), (isBoosted,status,createdAt). |
| `ListingPhoto` | `listingId`, `url`, `sortOrder` | Ordered gallery. Index on (listingId, sortOrder). |
| `Listing360Photo` | `listingId`, `url`, `angle` (int 0–359) | 360-degree photos keyed by shooting angle. |
| `ListingView` | `listingId`, `visitorId` | Unique (listingId, visitorId) prevents duplicate increments. |

#### Leads & Communication
| Model | Key Fields | Notes |
|---|---|---|
| `Enquiry` | `listingId`, `dealerId`, `buyerId?`, `buyerName`, `buyerPhone`, `buyerEmail?`, `message?`, `source` (FORM/WHATSAPP/CALL), `priority` (int, scored by `lib/lead-priority.ts`), `isRead`, `isContacted` | Compound index: (dealerId,isRead,priority,createdAt) for efficient inbox queries. |
| `Conversation` | `listingId`, `buyerId`, `dealerId`, `lastMessageAt?` | Unique (listingId,buyerId). `lastMessageAt` denormalized for chat-list ordering. |
| `Message` | `conversationId`, `senderId`, `body` (Text), `readAt?` | No real-time transport — REST-polled. |

#### Commerce
| Model | Key Fields | Notes |
|---|---|---|
| `SavedListing` | `userId`, `listingId` | Unique (userId,listingId). Wishlist. |
| `Subscription` | `dealerId` (unique), `plan` (FREE_TRIAL/MONTHLY/YEARLY), `status` (TRIALING/ACTIVE/PAST_DUE/CANCELLED), `razorpaySubId?`, `currentPeriodEnd` | Created at dealer signup with plan=FREE_TRIAL, status=TRIALING. |
| `Payment` | `razorpayOrderId?`, `razorpayPaymentId?` (unique), `razorpayEventId?` (unique), `razorpaySignature?`, `kind` (BOOST/SUBSCRIPTION/WEBHOOK), `amount` (paise int), `status`, `notes` (JSON), `dealerId?`, `listingId?` | Two unique keys: `razorpayPaymentId` gates boost-verify idempotency; `razorpayEventId` gates webhook replay. |
| `ApiKey` | `dealerId`, `name`, `key?` (legacy plaintext, nullable), `keyHash?` (SHA-256 hex), `keyPrefix?` (first 8 chars) | `key` column is a migration-window artifact — new keys never write it. See technical debt. |
| `Payout` | `dealerId`, `amount` (Decimal 12,2), `status` (PENDING/APPROVED/REJECTED/PAID), `razorpayPayoutId?`, `note?` | Admin-managed dealer earnings payouts. |

#### Inspections
| Model | Key Fields | Notes |
|---|---|---|
| `Inspector` | `userId` (unique), `certification?`, `status` (PENDING/APPROVED/REJECTED) | Note: the `Role` enum does **not** have INSPECTOR — inspectors have `role=BUYER` in the User table. |
| `Inspection` | `listingId`, `inspectorId?`, `dealerId`, `status` (REQUESTED/SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED), `checklist` (JSON?), `overallScore?`, `notes?`, `reportUrl?`, `completedAt?` | `inspectorId` is nullable until an inspector is assigned. |

#### Community
| Model | Key Fields | Notes |
|---|---|---|
| `Post` | `title`, `body` (Text), `authorId`, `community` (BUYER/DEALER), `tags` (String[]), `isPinned`, `isLocked` | GIN index on `tags` for PostgreSQL array search. |
| `Reply` | `postId`, `authorId`, `body` (Text) | Single-level threading (no nested replies). |
| `PostUpvote` | `postId`, `userId` | Unique (postId,userId) prevents double-voting. |

#### Financial Products
| Model | Key Fields | Notes |
|---|---|---|
| `LoanApplication` | `listingId`, `buyerId`, `nbfc` (10-value enum), `amount`, `tenureMonths`, `monthlyEmi`, `status` (PENDING/IN_REVIEW/APPROVED/REJECTED/DISBURSED), `applicantName`, `applicantPhone`, `applicantPan?` | Unique (buyerId,listingId). Stored locally — no actual NBFC API integration exists. |

#### Notifications
| Model | Key Fields | Notes |
|---|---|---|
| `NotificationTemplate` | `name` (unique), `subject`, `body` (Text), `type` (EMAIL/SMS) | DB-backed templates. Admin editable (UI page exists, mutation not yet wired). |

### Key Enums

| Enum | Values |
|---|---|
| `Role` | `BUYER`, `DEALER`, `ADMIN` (missing `INSPECTOR` — see technical debt) |
| `ListingStatus` | `ACTIVE`, `PAUSED`, `SOLD` |
| `PlanTier` | `FREE_TRIAL`, `MONTHLY`, `YEARLY` |
| `SubStatus` | `TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELLED` |
| `InspectionStatus` | `REQUESTED`, `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `LoanStatus` | `PENDING`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `DISBURSED` |
| `NBFC` | `BAJAJ_FINSERV`, `HDFC_BANK`, `ICICI_BANK`, `MAHINDRA_FINANCE`, `KOTAK_MAHINDRA`, `CHOLAMANDALAM`, `SHRIRAM_FINANCE`, `SUNDARAM_FINANCE`, `TATA_CAPITAL`, `OTHER` |

### Performance-Critical Indexes

| Index | Powers |
|---|---|
| `Listing(city, vehicleType, status)` | Browse page filter queries |
| `Listing(isBoosted, status, createdAt)` | Sorted feed (boosted listings first) |
| `Listing(boostExpiresAt)` | Boost expiry cleanup job |
| `Enquiry(dealerId, isRead, priority, createdAt)` | Dealer lead inbox |
| `Post(community, isPinned, createdAt)` | Forum feed |
| `Post(tags)` GIN | Tag-based forum filtering |

---

## 7. Authentication and Authorization

**Library:** NextAuth.js v5 (`^5.0.0-beta.31`) with Prisma adapter  
**Session strategy:** JWT (stateless — `Session` table rarely written)  
**Config:** `lib/auth.ts`

### Three Login Flows

**Flow 1 — Email + Password:**
1. User submits email + password at `/login`.
2. Credentials provider validates with `bcryptjs.compare()` against `User.passwordHash`.
3. JWT issued with `{ id, role }` in token.

**Flow 2 — Phone OTP:**
1. User enters phone → `POST /api/auth/send-otp` (rate-limited: 3/IP/15min, 5/phone/1hr).
2. 6-digit OTP generated, stored in Cloudflare KV (5-min TTL, 3-attempt cap), sent via SMS.
3. User enters OTP → Credentials provider verifies.
4. If new phone: auto-creates `User` with `role=BUYER`, synthetic `@wheewise.phone` email (NextAuth requires a non-null email).

**Flow 3 — Dev Fast-Login** (requires `WHEEWISE_DEV_LOGIN=1` + `NODE_ENV=development`):
- One-click sign-in as `dev@wheewise.local` with a pre-created dealer + store.
- `lib/env.ts` boot guard throws if this flag is set in production.

### JWT Session Shape
```typescript
session.user.id:    string           // User.id (cuid)
session.user.email: string | null    // null for phone-OTP users
session.user.name:  string | null
session.user.role:  "BUYER" | "DEALER" | "ADMIN"
```

### Authorization Gates

| Resource | Mechanism | File |
|---|---|---|
| Dealer portal | `requireDealer()` — checks DEALER role + active subscription | `lib/dealer.ts` |
| Admin panel | `session.user.role === "ADMIN"` check | `(admin)/layout.tsx` |
| Public API | API key SHA-256 hash lookup on `ApiKey.keyHash` | `lib/api-auth.ts` |
| Per-page auth | Each protected page/action calls `auth()` | No global route protection config |

### Security Middleware (`middleware.ts`)
Runs on every route (except `_next/static`, `_next/image`, OG images, robots.txt, sitemap.xml):
- Generates per-request **CSP nonce** (`crypto.randomUUID()`)
- **Content-Security-Policy:** strict-dynamic, Razorpay allowlisted, `unsafe-eval` only in dev
- **HSTS:** 2 years, includeSubDomains, preload
- **X-Frame-Options:** DENY
- **X-Content-Type-Options:** nosniff
- **Referrer-Policy:** strict-origin-when-cross-origin
- **Permissions-Policy:** camera=(), microphone=(), geolocation=()

---

## 8. All API Endpoints

### Authentication
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/auth/send-otp` | None | Send OTP SMS to phone number |
| `GET,POST` | `/api/auth/[...nextauth]` | — | NextAuth handler (sign-in, sign-out, session) |

### Listings
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/listings` | Session (Dealer) | Dealer's own listings (cursor pagination) |
| `POST` | `/api/listings` | Session (Dealer) | Create new listing |
| `PATCH` | `/api/listings` | Session (Dealer) | Update listing fields |
| `DELETE` | `/api/listings` | Session (Dealer) | Delete listing |
| `GET` | `/api/public/listings` | API Key | Public paginated listings, filterable, rate-limited 100/min |
| `GET` | `/api/public/dealer` | API Key | Public dealer stats (listing count, lead count) |

### Leads
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/leads` | None (public) | Submit buyer enquiry (rate-limited 5/IP/hr, scored, notifications dispatched) |
| `GET` | `/api/leads` | Session (Dealer) | Dealer's lead inbox |

### Chat
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/chat/conversations` | Session | List conversations (last message + unread counts) |
| `POST` | `/api/chat/conversations` | Session | Create or fetch existing conversation for a listing |
| `POST` | `/api/chat/messages` | Session | Send a message in a conversation |

### Dealer Operations
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/dealer/api-keys` | Session (Dealer) | Create API key (plaintext returned once, then SHA-256 hashed) |
| `DELETE` | `/api/dealer/api-keys?id=` | Session (Dealer) | Revoke API key by ID |
| `POST` | `/api/dealer/boost` | Session (Dealer) | Create Razorpay order for listing boost |
| `POST` | `/api/dealer/boost/verify` | Session (Dealer) | Verify boost payment, activate `isBoosted` flag |
| `POST` | `/api/dealer/bulk-upload` | Session (Dealer) | Parse + import CSV listing file |

### KYC Verification
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/gst/verify` | Session (Dealer) | Verify GSTIN via Surepass (or mock in dev) |
| `POST` | `/api/rto` | None | Vehicle lookup by registration number (Surepass or mock) |

### Billing & Payments
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/billing/checkout` | Session (Dealer) | Initiate Razorpay subscription (monthly or yearly) |
| `POST` | `/api/billing/webhook` | Razorpay HMAC | Subscription lifecycle events (idempotent via `razorpayEventId`) |
| `POST` | `/api/webhooks/razorpay` | Razorpay HMAC | Payment event webhook (boost + general) |

### Uploads & AI
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/uploads` | Session | Generate R2 presigned PUT URL (8MB max, jpeg/png/webp) |
| `POST` | `/api/ai/generate-description` | Session | Generate vehicle description (OpenAI→Anthropic→template fallback) |

### Wishlist
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/wishlist` | Session | Toggle save/unsave listing |

### Rate Limits

| Endpoint | Limit |
|---|---|
| `/api/auth/send-otp` per IP | 3 requests / 15 minutes |
| `/api/auth/send-otp` per phone | 5 requests / 1 hour |
| `/api/leads` | 5 requests / 1 hour per IP |
| `/api/public/listings` | 100 requests / minute per IP |

---

## 9. Completed Features

The following are fully implemented with UI, API, and database backing:

1. **Multi-role authentication** — Email+password, phone+OTP, dev fast-login. BUYER and DEALER signup with role assignment.
2. **Dealer onboarding** — Single transaction creates User + Dealer + Store + Subscription (FREE_TRIAL). Slug auto-generated with retry for uniqueness.
3. **Buyer registration** — Email + password with complexity validation.
4. **Dealer dashboard** — KPI cards: active listings, total leads, lead-to-view ratio, subscription status. Recent leads table with time-ago timestamps.
5. **Listing CRUD** — Create, edit, status change (ACTIVE/PAUSED/SOLD), delete. Full field set: vehicleType, make, model, year, fuel, transmission, odometer, price, city, description, insurance.
6. **Vehicle photo upload** — Multi-file drag-drop directly to Cloudflare R2 via presigned PUT URLs. 8MB max, JPEG/PNG/WebP.
7. **360-degree photo upload** — Angle-keyed photos for immersive vehicle viewing.
8. **RTO auto-fill** — Registration number → auto-populated make/model/year/fuel/color via Surepass API. Mock responses in dev (`WHEEWISE_MOCK_RTO=1`).
9. **GST verification** — GSTIN format validation + Surepass API. Sets `gstVerified` flag on Dealer. Mock in dev.
10. **Bulk CSV listing upload** — Import multiple listings from a CSV file.
11. **Public browse + search** — `/browse` with keyword, city, type, fuel, min/max price, year filters. Prisma LIKE search. Offset pagination (24/page).
12. **Vehicle detail page** — Full listing view: photo gallery (incl. 360), specs table, EMI calculator, enquiry form, wishlist button. ViewCounter component.
13. **Vehicle comparison** — `/compare?ids=a,b,c` side-by-side spec table for up to 3 active listings.
14. **Lead submission** — Buyer enquiry form on vehicle detail. Rate-limited 5/IP/hr. Lead scored by priority. Email + SMS dispatched to dealer.
15. **Lead management** — Dealer sees leads sorted by priority+date. Mark as read, mark as contacted actions.
16. **Wishlist** — Buyers save listings. `/wishlist` page. Remove-from-wishlist button. Auth-gated (redirects to `/login`).
17. **Public dealer storefront** — `/s/[slug]/showcase`: hero banner, featured carousel (boosted listings), listing grid, inquiry form, sticky WhatsApp/call CTA, trust strip (GST badge), About section. OG image generated.
18. **Listing boost** — Dealer creates Razorpay order for 7/14/30 days (₹199/299/499). Payment verify sets `isBoosted=true` and computes `boostExpiresAt`.
19. **Subscription billing** — Monthly/yearly Razorpay subscriptions. Checkout from `/dashboard/billing`. Webhook updates sub status. Replay-protected via `razorpayEventId` unique constraint.
20. **API key management** — Dealer creates named keys (`wk_` prefix, 32 random bytes). Plaintext shown once; SHA-256 hashed in DB. Revoke by ID. `lastUsedAt` tracked.
21. **Public API** — `/api/public/listings` and `/api/public/dealer`: API key auth, rate-limited 100/min.
22. **AI description generation** — `POST /api/ai/generate-description`: OpenAI (`gpt-4o-mini`) → Anthropic (`claude-3-haiku`) → deterministic template mock.
23. **EMI calculator** — `lib/emi.ts` amortization formula. Displayed on vehicle detail page.
24. **Store branding** — Dealer sets logo URL, banner URL, bio, primary color at `/dashboard/store`.
25. **Chat (REST)** — Conversations + messages stored in DB. ChatWidget polls REST API. No real-time WebSocket.
26. **Community forum** — Posts, replies, upvotes (buyer + dealer communities). Pin/lock admin controls in schema. NewPostForm, UpvoteButton, PostReplies components.
27. **Inspection request** — Dealer requests inspection for a listing. DB status tracked through lifecycle.
28. **Loan applications (dealer view)** — `/dashboard/loans` displays buyer loan applications on dealer's listings (status, amount, EMI, tenure, NBFC, applicant contact).
29. **Admin dashboard** — KPI overview (total dealers, listings, leads, active subscriptions). Recent dealer signups.
30. **Admin panel page scaffold** — Pages exist for: dealers, listings, inspections, inspectors, payouts, community, notification templates.
31. **Security headers** — CSP (nonce-based, strict-dynamic), HSTS (2yr+preload), X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy on all routes.
32. **Rate limiting** — Token bucket (in-memory + Cloudflare KV) on OTP and lead endpoints.
33. **Webhook idempotency** — `razorpayPaymentId` and `razorpayEventId` unique constraints prevent double-processing.
34. **Environment validation** — Zod schema at boot. Dev-only flags throw if set in production.
35. **JSON-LD SEO** — Schema.org structured data for listings and storefront.
36. **Privacy + Terms pages** — `/privacy`, `/terms`.
37. **Cookie consent** — GDPR banner component.
38. **Sentry error tracking** — `@sentry/nextjs` + `lib/sentry.ts`.
39. **CI/CD pipeline** — GitHub Actions: lint → typecheck → unit tests → build → E2E (continue-on-error).
40. **Git hooks** — Husky: prettier + ESLint on staged files, commitlint on commit messages.
41. **Mobile Capacitor shell** — Configured for iOS + Android native builds.
42. **Unit test suite** — Vitest covering EMI, OTP, rate-limit, lead scoring, API keys, GST, RTO, search, finance, format, community actions.

---

## 10. Partially Completed Features

| Feature | What Exists | What's Missing |
|---|---|---|
| **Real-time chat** | `Conversation` + `Message` DB models, `/api/chat/*` REST endpoints, `ChatWidget.tsx` component | WebSocket or SSE transport. Messages only appear after manual refresh or next poll cycle. |
| **Admin panel mutations** | All 7 admin pages exist and render data | No approve/reject/suspend/ban actions wired up. Pages are read-only data displays. |
| **Inspection workflow** | DB schema (Inspector, Inspection), `RequestButton`, admin pages, `lib/inspection-checklist.ts` | Inspector assignment flow, checklist submission UI, score entry, report URL generation, inspector portal. |
| **Buyer loan application** | DB schema (LoanApplication), dealer view at `/dashboard/loans`, EMI calculator (`lib/emi.ts`), NBFC enum | No buyer-facing loan application form. Buyers cannot submit a loan application anywhere in the UI. |
| **WhatsApp integration** | `lib/whatsapp.ts` file, `EnquirySource.WHATSAPP` enum, WhatsApp CTA button on storefront | WhatsApp Business API not integrated. The button opens a `wa.me` link but no messages are sent programmatically. |
| **Payout management** | DB schema (Payout), `/admin/payouts` page, `PayoutStatus` enum | Admin approve/pay/reject actions not wired. No Razorpay Payout API calls. |
| **Notification templates** | `NotificationTemplate` DB model, `/admin/templates` page | Admin cannot save template edits. Actual emails use hardcoded Resend templates in `lib/email.ts` — not DB templates. |
| **Dealer trust score** | `lib/trust-score.ts` with scoring logic | Not surfaced anywhere in the UI. Not displayed on storefront or listings. |
| **Content moderation** | `lib/moderation.ts` with moderation logic | Not called from any API route or admin workflow. Dead code. |
| **Listing view tracking** | `ListingView` model (unique dedup), `ViewCounter.tsx` component, `viewCount` column on Listing | Unclear whether `viewCount` is incremented via `ListingView` inserts or a separate counter. No analytics page for dealers. |

---

## 11. Missing Features (vs. SDD Requirements)

| Feature | SDD Section | Status |
|---|---|---|
| Real-time chat (WebSocket) | §5.3, §8 | Not started |
| Elasticsearch full-text search | §3, §4 | Not started — using Prisma LIKE |
| Redis caching layer | §3, §4 | Not started |
| Analytics dashboard with charts | §5.1.1 | Not started — no Recharts, no analytics |
| Vendor performance leaderboard | §5.1.1 | Not started |
| CSV/PDF report export | §5.1.1 | Not started |
| AI content moderation (images + text) | §5.1.4 | Stub only (`lib/moderation.ts`) |
| Bulk moderation tools | §5.1.4 | Not started |
| Listing auto-expire after 90 days | §5.2.4 | Not started (no cron/scheduled job) |
| Duplicate listing feature | §5.2.4 | Not started |
| Customer reviews on storefront | §5.2.3 | Not started (no Review model in schema) |
| WhatsApp Business API messaging | §8 | Stub only |
| PDF inspection report generation | §5 | Not started |
| Inspector role + portal | §5 | `Role` enum missing INSPECTOR; no inspector UI |
| NBFC API integrations (actual calls) | §5.3 | Not started — data stored locally only |
| Buyer notification preferences | §16 | Not started |
| Email verification flow | §9 | VerificationToken model exists but no UI |
| Password reset / forgot password | General | Not started |
| Admin dealer suspension action | §5.1.2 | DealerStatus.SUSPENDED in schema; no admin UI action |
| Admin GST re-verification | §5.1.2 | Not started |
| Brand/model dependent selects in browse | §5.3.1 | Browse has free-text search only |
| KM range slider in browse | §5.3.1 | Not implemented |
| Listing interest tracker (High/Med/Low) | §5.2.4 | Not started |
| Save search / search alerts for buyers | §5.3 | Not started |
| Grafana/Prometheus monitoring | §4, §12 | Not started |
| Docker container build | §4, §12 | Not started |
| `wrangler.toml` deployment config | §12 | Missing from repo |
| Capacitor config file (`capacitor.config.ts`) | Mobile | Missing from `mobile/` |

---

## 12. Technical Debt, Code Smells, and Architectural Issues

### Critical

1. **`INSPECTOR` role missing from `Role` enum** — The schema only has `BUYER | DEALER | ADMIN`. The `Inspector` model exists (for KYC/approval) but inspectors are stored as `BUYER` role users. This means:
   - Inspector-specific pages cannot be role-gated properly.
   - Admin cannot distinguish a qualified inspector from a regular buyer.
   - **Fix required before inspector feature can be built.**

2. **Legacy plaintext API key column** — `ApiKey.key` (nullable, plaintext) is kept for "migration window." Old keys are still validated via plaintext comparison fallback in `lib/api-auth.ts`. No migration is scheduled to remove this column. Plaintext secrets in the database are a security risk.

3. **NextAuth v5 is still beta** — `"next-auth": "^5.0.0-beta.31"`. The API can change before stable release. Breaking changes would affect all auth flows.

4. **No password reset flow** — Users who forget their password have no recovery path. No `/forgot-password` route, no password reset email. This is a critical UX gap.

5. **No email verification** — `User.emailVerified` field and `VerificationToken` table exist but no email is sent at signup and no verification page exists. Unverified email accounts can perform dealer actions.

### High Priority

6. **Admin pages are read-only stubs** — All 7 admin section pages (`/admin/dealers`, `/admin/listings`, `/admin/inspections`, `/admin/inspectors`, `/admin/payouts`, `/admin/community`, `/admin/templates`) render data but have no mutation actions. Admins cannot approve dealers, suspend accounts, remove listings, approve payouts, or edit templates via the UI.

7. **Buyer loan application form missing** — `LoanApplication` schema is complete and dealer view works, but buyers cannot apply for a loan anywhere in the UI. The vehicle detail page has no loan application form.

8. **Chat is not real-time** — The `ChatWidget` polls via REST. Messages are missed without refresh. This is a core feature gap for buyer-dealer negotiation.

9. **Search uses SQL LIKE** — `lib/search.ts` uses Prisma `contains` (case-insensitive LIKE) for make/model search. Won't scale beyond ~10K listings. No typo tolerance, relevance scoring, or faceting.

10. **No caching** — Every request hits Neon Postgres directly. No `unstable_cache`, no `revalidate`, no Redis. The browse page, dashboard, and storefront all re-query on every hit. Will degrade under load.

11. **E2E tests `continue-on-error: true` in CI** — E2E tests never block merges. The comment says "remove once dev DB is wired in" — but `E2E_DATABASE_URL` secret is likely not configured in CI. E2E safety net is effectively disabled.

12. **`moderation.ts` and `trust-score.ts` are dead code** — Both lib files contain non-trivial logic but are not called from any route handler or server action. They provide zero runtime value until integrated.

### Medium Priority

13. **`viewCount` / `ListingView` sync unclear** — `Listing.viewCount` is an integer; `ListingView` is a deduplication model. It is not confirmed whether the `ViewCounter` component increments `viewCount` via the `ListingView` table or a separate direct increment. Over-counting or double-counting is possible.

14. **`wrangler.toml` missing** — `npm run cf:deploy` likely fails without a `wrangler.toml`. This means the Cloudflare Workers deployment advertised in the README may not work as described.

15. **`capacitor.config.ts` missing from `mobile/`** — Capacitor CLI requires this config to build native apps. The mobile shell is incomplete.

16. **SMS throws in production without keys** — `lib/sms-provider.ts` throws (not gracefully degrades) if neither MSG91 nor Twilio is configured. This will surface as 500 errors on lead submission in production without SMS keys.

17. **Duplicate forum implementations** — `/community` and `/forum/dealer` both exist as distinct routes. Their relationship is unclear — one may be redundant or they serve the same purpose with code duplication.

18. **Hardcoded boost pricing** — Boost prices (₹199/299/499) are hardcoded in `lib/razorpay.ts`. No admin UI to change pricing without a code deploy.

19. **`VerificationToken` table unused** — NextAuth adapter creates this table but no email verification flow exists. When email verification is added, `User.emailVerified` timestamps must be backfilled for existing users.

20. **Phone normalization inconsistency** — `auth.ts` normalizes phone to last 10 digits. It's not confirmed that OTP storage, enquiry records, and SMS dispatch all apply the same normalization.

---

## 13. How to Run Locally

### Prerequisites
- Node.js 22
- A PostgreSQL database (Neon free tier works; local PostgreSQL also works)
- Cloudflare R2 bucket (optional — skip for local dev; photo uploads won't work without it)

### Step-by-Step

```bash
# 1. Navigate to the app directory
cd wheewise-app/app

# 2. Copy the environment template
cp .env.example .env.local

# 3. Fill in .env.local — minimum required:
DATABASE_URL="postgresql://user:password@host:5432/wheewise?sslmode=require"
AUTH_SECRET="<generate with: openssl rand -base64 32>"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 4. Add dev-only shortcuts for local development (optional but highly recommended):
WHEEWISE_DEV_LOGIN=1       # Instant dealer login button
OTP_DEV_BYPASS=1           # OTP is always "000000"
WHEEWISE_MOCK_GST=1        # Fake GST verification responses
WHEEWISE_MOCK_RTO=1        # Fake RTO lookup responses

# 5. Install dependencies
npm install

# 6. Apply database schema
npx prisma migrate dev

# 7. Generate Prisma client
npm run db:generate

# 8. (Optional) Seed demo data
npm run db:seed
# Creates: demo@wheewise.in / demo1234 (dealer login)
# Demo storefront: http://localhost:3000/s/sharma-auto-indore/showcase

# 9. Start development server
npm run dev
# App available at: http://localhost:3000
```

### Useful Commands

```bash
npm run typecheck        # TypeScript strict check (no emit)
npm run lint             # ESLint
npm run format           # Prettier formatting
npm run test             # Vitest unit tests (run once)
npm run test:watch       # Vitest watch mode
npm run test:e2e         # Playwright E2E (requires DATABASE_URL + seeded DB)
npm run db:studio        # Prisma Studio GUI at http://localhost:5555

# Cloudflare Workers deployment
npm run cf:preview       # Local Workers preview (requires wrangler.toml — currently missing!)
npm run cf:deploy        # Deploy to Cloudflare
```

### Dev Convenience Flags

| Flag | Effect | Required |
|---|---|---|
| `WHEEWISE_DEV_LOGIN=1` | Shows "Dev: instant sign-in" button | dev only |
| `OTP_DEV_BYPASS=1` | Any OTP `000000` is accepted | dev only |
| `WHEEWISE_MOCK_GST=1` | GST verify returns fake success | dev only |
| `WHEEWISE_MOCK_RTO=1` | RTO lookup returns fake vehicle | dev only |

> **Warning:** `lib/env.ts` throws at startup if any of these flags are detected in `NODE_ENV=production`. This is intentional.

---

## 14. Package.json, Environment Variables, and Configuration Files

### `app/package.json` (key notes)

**Runtime dependencies:**
- `next: 16.2.5` — Very recent major version; see `AGENTS.md` for breaking changes.
- `react: 19.2.4`, `react-dom: 19.2.4` — React 19 (concurrent features, server actions).
- `next-auth: ^5.0.0-beta.31` — **Beta version in production** — risk of API instability.
- `zod: ^4.4.3` — Zod v4 (breaking changes from v3; all validators must be v4-syntax).
- `@auth/prisma-adapter: ^2.11.2` — Prisma adapter for NextAuth.
- `razorpay: ^2.9.6` — Payments SDK.
- `resend: ^6.12.3` — Transactional email.
- `bcryptjs: ^3.0.3` — Password hashing (no native bindings — safe for Workers).
- `ws: ^8.20.0` — WebSocket for Neon driver in Node.js dev; not used in Workers runtime.

**Dev dependencies:**
- `vitest: ^4.1.5` — v4 major (verify test utility compatibility).
- `@playwright/test: ^1.60.0` — E2E.
- `@sentry/nextjs: ^10.52.0` — Error tracking (note: in devDependencies — should be in dependencies for production error capture).
- `wrangler: ^4.88.0` — Cloudflare deployment CLI.
- `tailwindcss: v4` + `@tailwindcss/postcss: v4` — Tailwind v4 with PostCSS.

### `app/.env.example` (required variables)

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Yes | NextAuth JWT signing secret |
| `AUTH_URL` | Yes | App URL for NextAuth (e.g., `http://localhost:3000`) |
| `AUTH_TRUST_HOST` | Yes | `"true"` for non-Vercel deployments |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL (used in email links) |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL` | For uploads | Cloudflare R2 credentials |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_MONTHLY`, `RAZORPAY_PLAN_YEARLY` | For billing | Razorpay subscription plans |
| `RESEND_API_KEY`, `RESEND_FROM` | For email | Resend transactional email |
| `MSG91_AUTH_KEY`, `MSG91_SENDER_ID`, `MSG91_TEMPLATE_ID` | For SMS | MSG91 (primary India SMS) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | For SMS fallback | Twilio fallback SMS |
| `SUREPASS_TOKEN`, `SUREPASS_BASE_URL` | For KYC | GST + RTO verification |
| `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` | For AI descriptions | Optional — falls back to template |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | For monitoring | Optional |

### `app/tsconfig.json`
- `target: ES2017`, `strict: true`, `noEmit: true`
- `moduleResolution: bundler`
- Path alias: `@/*` → `./*` (maps to app root)

### `app/next.config.ts`
- Minimal configuration
- No custom `images.domains` (photos served directly from R2 public URL — `img-src` CSP allows `https:`)
- Compatible with `@opennextjs/cloudflare` adapter

### `.github/workflows/ci.yml`
Two jobs on every push to `main` or PR:
1. **quality** (10min timeout): `npm ci` → `prisma generate` → `lint` → `typecheck` → `test` → `build`
2. **e2e** (15min, `continue-on-error: true`, needs quality job): playwright E2E against `E2E_DATABASE_URL` secret

**Issue:** `E2E_DATABASE_URL` secret is almost certainly not configured in the repo, making E2E always fail silently.

### `app/middleware.ts`
Edge-compatible (no Node.js APIs). Generates CSP nonce with `crypto.randomUUID()` (Web Crypto). Applies to all routes matching the `matcher` pattern.

### `mobile/package.json`
Capacitor 7 configuration. Note: **no `capacitor.config.ts` or `capacitor.config.json`** found in `mobile/` — this file is required before `npx cap add ios` or `npx cap add android` can work.

---

## 15. Missing Dependencies, Setup Issues, and Configuration Problems

| Problem | Impact | Fix Required |
|---|---|---|
| **`wrangler.toml` missing** | `npm run cf:deploy` and `npm run cf:preview` fail | Create `wrangler.toml` with worker name, compatibility date, and R2/KV bindings |
| **`capacitor.config.ts` missing in `mobile/`** | Cannot build native iOS/Android | Create Capacitor config with app ID, name, and web dir pointing to Next.js output |
| **`E2E_DATABASE_URL` secret likely unconfigured** | E2E tests always fail silently in CI | Add secret to GitHub repo settings, or seed a CI test database |
| **`@sentry/nextjs` in devDependencies** | Sentry error tracking may not work in production builds | Move to `dependencies` |
| **No SMS keys = production throws** | Lead submission returns 500 in prod without MSG91/Twilio | Configure at least one SMS provider before any production traffic |
| **`SUREPASS_TOKEN` missing = 503 on GST/RTO** | Dealer KYC unavailable | Configure Surepass token or ensure mock flags aren't used in production |
| **Razorpay plan IDs must be created manually** | Subscription checkout fails without `RAZORPAY_PLAN_MONTHLY` + `RAZORPAY_PLAN_YEARLY` | Create plans in Razorpay dashboard and add IDs to env |
| **`RESEND_FROM` must use a verified domain** | Emails rejected by Resend if domain not verified | Verify domain in Resend dashboard |
| **`AUTH_URL` must be set to production URL** | NextAuth OAuth callbacks fail with wrong domain | Set to exact production URL (no trailing slash) |

---

## 16. Where Development Stopped

Based on code completeness, commit patterns, and the gap between the SDD and implementation, the previous developers stopped after completing the **dealer portal MVP**:

**Fully shipped (active development done here):**
- Complete dual-flow authentication system
- Dealer onboarding, store, and inventory management
- Lead/enquiry management with notifications
- Razorpay subscription billing + listing boost payments
- Public browse page + vehicle detail
- Public dealer storefront (`/s/[slug]/showcase`)
- API key management for external dealer API
- Community forum (posts, replies, upvotes)
- Admin data-display dashboard (KPIs, recent activity)
- Unit test suite + CI pipeline

**Scaffolded but left incomplete (recently added stubs):**
- Admin mutation actions (approve/reject/suspend) — page exists, no mutations
- Inspection workflow — request button works, everything after (assign, checklist, report) is missing
- Buyer loan application — dealer view works, buyer submission form missing
- WhatsApp API — CTA button exists, no server-side integration
- Notification template editing — page exists, save not wired

**Never started:**
- Real-time chat transport (WebSocket/SSE)
- Search infrastructure upgrade (Elasticsearch)
- Caching layer (Redis or Next.js cache)
- Analytics/reporting with charts
- Password reset + email verification
- Inspector role + portal
- Wrangler deployment config
- Capacitor native build configuration
- Listing auto-expire cron job
- PDF report generation
