# Wheewise — Software Development Documentation

**Version:** 2.0  
**Date:** April 2026  
**Project Type:** Multi-Vendor Pre-Owned Vehicle Marketplace  
**Platform:** Web + Mobile (PWA-first)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Goals & Objectives](#2-goals--objectives)
3. [System Architecture](#3-system-architecture)
4. [Tech Stack](#4-tech-stack)
5. [Module Specifications](#5-module-specifications)
   - 5.1 [Admin Panel](#51-admin-panel-module-a)
   - 5.2 [Store Owner (Vendor) Portal](#52-store-owner-vendor-portal-module-b)
   - 5.3 [End User App](#53-end-user-app-module-c)
6. [Database Design](#6-database-design)
7. [API Design](#7-api-design)
8. [Third-Party Integrations](#8-third-party-integrations)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Security Considerations](#10-security-considerations)
11. [Performance & Scalability](#11-performance--scalability)
12. [Deployment Architecture](#12-deployment-architecture)
13. [Future Roadmap](#13-future-roadmap)
14. [Glossary](#14-glossary)
15. [User Stories](#15-user-stories)
16. [Notification System](#16-notification-system)
17. [Monetization & Business Model](#17-monetization--business-model)
18. [Testing Strategy](#18-testing-strategy)
19. [SEO Strategy](#19-seo-strategy)
20. [Analytics & Event Tracking](#20-analytics--event-tracking)
21. [Error Handling Strategy](#21-error-handling-strategy)
22. [Data Flow Diagrams](#22-data-flow-diagrams)
23. [Vendor Trust Score System](#23-vendor-trust-score-system)
24. [Project Folder Structure](#24-project-folder-structure)
25. [Development Setup Guide](#25-development-setup-guide)
26. [First Owner Meeting — Discussion Notes](#26-first-owner-meeting--discussion-notes)

---

## 1. Project Overview

**Wheewise** is a multi-vendor, mobile-first marketplace for pre-owned cars and bikes in India. It bridges the gap between unorganized local dealerships and digitally-savvy buyers by giving each dealer a custom branded storefront, RTO-verified listings, and tools to manage inventory — while offering buyers a trusted, feature-rich discovery and financing experience.

### Core Value Proposition

> Increase visibility, build trust, and convert buyers faster with an integrated, mobile-first platform.

### Key Differentiators

| Feature | Wheewise | Traditional Classifieds |
|---|---|---|
| Dealer-branded storefronts | Yes | No |
| RTO API auto-fetch specs | Yes | Manual |
| GST-verified dealers | Yes | No |
| AI-generated descriptions | Yes | No |
| Real-time EMI calculator | Yes | Rare |
| Physical store verification | Yes | No |
| Location-aware ad targeting | Yes | Limited |

---

## 2. Goals & Objectives

### Business Goals
- Onboard verified pre-owned vehicle dealers across India
- Build buyer trust through verified listings and physical inspections
- Monetize via premium listing tiers and vendor subscription plans
- Reduce buyer acquisition costs through smart location-based ads

### Technical Goals
- Deliver a scalable, modular backend supporting multi-vendor operations
- Achieve sub-2s page loads on mobile (PWA)
- Automate compliance workflows (GST, KYC, RTO)
- Build an extensible API layer for future mobile native apps

### Success Metrics
- Vendor onboarding time < 10 minutes
- Listing creation time < 5 minutes (with RTO auto-fill)
- Page load < 2s on 4G
- 99.9% uptime SLA

---

## 3. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Admin Panel │  │ Vendor Portal│  │   User App (PWA) │  │
│  │  (React SPA) │  │  (React SPA) │  │   (Next.js SSR)  │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
└─────────┼─────────────────┼───────────────────┼────────────┘
          │                 │                   │
          └─────────────────▼───────────────────┘
                            │
                   ┌────────▼────────┐
                   │   API Gateway   │
                   │ (Rate Limiting, │
                   │  Auth, Routing) │
                   └────────┬────────┘
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
┌───────▼──────┐   ┌────────▼───────┐  ┌────────▼────────┐
│  Auth Service│   │  Core API      │  │  Media Service  │
│  (JWT/OAuth) │   │  (NestJS)      │  │  (S3 + CDN)     │
└──────────────┘   └────────┬───────┘  └─────────────────┘
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
┌───────▼──────┐   ┌────────▼───────┐  ┌────────▼────────┐
│  PostgreSQL  │   │  Redis Cache   │  │  Search Engine  │
│  (Primary DB)│   │  (Sessions,    │  │  (Elasticsearch)│
│              │   │   Listings)    │  │                 │
└──────────────┘   └────────────────┘  └─────────────────┘
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
┌───────▼──────┐   ┌────────▼───────┐  ┌────────▼────────┐
│  GST API     │   │  RTO API       │  │  AI Service     │
│  (Gov)       │   │  (VahanAPI)    │  │  (Descriptions) │
└──────────────┘   └────────────────┘  └─────────────────┘
```

### Architecture Principles
- **Modular Monolith** initially, with clear domain boundaries for future microservices extraction
- **API-first**: All features exposed via versioned REST APIs
- **Event-driven** for async workflows (payment approvals, moderation alerts)
- **Cache-heavy**: Listing data, search results, and vehicle specs cached aggressively

---

## 4. Tech Stack

### Frontend

| Layer | Technology | Reason |
|---|---|---|
| User App | Next.js 14 (App Router) | SSR for SEO, fast loads |
| Admin Panel | React 18 + Vite | SPA, complex dashboards |
| Vendor Portal | React 18 + Vite | SPA, inventory management |
| State Management | Zustand | Lightweight, scalable |
| UI Components | shadcn/ui + Tailwind CSS | Fast, customizable |
| Charts | Recharts | Admin analytics |
| Forms | React Hook Form + Zod | Validation + performance |
| HTTP Client | Axios + React Query | Caching, retry, pagination |

### Backend

| Layer | Technology | Reason |
|---|---|---|
| Runtime | Node.js 20 LTS | Ecosystem, async I/O |
| Framework | NestJS | Modular, TypeScript-first |
| ORM | Prisma | Type-safe DB access |
| Queue | BullMQ (Redis) | Async jobs (emails, AI, media) |
| WebSockets | Socket.io | Real-time chat |
| Validation | class-validator | DTO validation |

### Database & Storage

| Purpose | Technology |
|---|---|
| Primary Database | PostgreSQL 15 |
| Cache & Sessions | Redis 7 |
| Full-text Search | Elasticsearch 8 |
| Media Storage | AWS S3 |
| CDN | AWS CloudFront |

### Infrastructure

| Purpose | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| Orchestration | AWS ECS (Fargate) |
| CI/CD | GitHub Actions |
| Monitoring | Grafana + Prometheus |
| Error Tracking | Sentry |
| Logging | Winston + AWS CloudWatch |

---

## 5. Module Specifications

### 5.1 Admin Panel (Module A)

**URL:** `admin.wheewise.com`  
**Access:** Internal staff only (role-based)

#### 5.1.1 Analytics & Reporting

**Features:**
- Real-time dashboard: Total Revenue, Active Listings, Moderation Queue
- Traffic vs. Sales chart (daily/weekly/monthly)
- Vendor performance leaderboard
- Listing trends & conversion funnel metrics
- Export reports (CSV, PDF)

**Key Screens:**
- `/dashboard` — Overview KPIs and charts
- `/analytics/vendors` — Per-vendor performance
- `/analytics/listings` — Listing-level conversion data
- `/analytics/traffic` — User behavior and source attribution

#### 5.1.2 Vendor Management

**Features:**
- View all registered vendors (pending / verified / suspended)
- Approve or reject vendor applications
- Manually trigger GST re-verification
- Suspend / ban vendor with reason logging
- View vendor's complete listing history

**Workflow: Vendor Approval**
```
Vendor Registers → GST Auto-Check → 
  [Pass] → Auto-approve (Economy tier)
  [Fail] → Manual Review Queue → Admin Decision → Notify Vendor
```

#### 5.1.3 Automated Payments

**Features:**
- Auto-approve payouts for verified vendors above trust threshold
- Manual override capability for flagged payments
- Detailed payout audit logs (amount, vendor, timestamp, approver)
- Payment dispute resolution interface

**Payout Logic:**
```
Vendor Trust Score >= 80  →  Auto-approve
Vendor Trust Score 50–79  →  Manual review
Vendor Trust Score < 50   →  Hold + notify admin
```

#### 5.1.4 Content Moderation

**Features:**
- AI-based auto-detection of inappropriate listing content (images + text)
- One-click listing removal with templated reason notifications
- Violation history per vendor (feeds into trust score)
- Bulk moderation tools
- Automated alert emails to vendors on policy breach

**Moderation Queue States:**
`PENDING` → `APPROVED` | `REJECTED` | `ESCALATED`

---

### 5.2 Store Owner (Vendor) Portal (Module B)

**URL:** `vendor.wheewise.com`  
**Access:** Registered & verified dealers

#### 5.2.1 Registration & Verification

**Onboarding Flow (target: < 10 minutes):**

```
Step 1: Basic Info (name, phone, email, city)
Step 2: GST Number → API auto-verify → fetch business details
Step 3: Trade License upload (optional, unlocks premium tier)
Step 4: Store branding (logo, colors, tagline)
Step 5: Account created → Economy plan active
```

**GST Verification:**
- Hits government GST API with GSTIN
- Returns: business name, address, registration status, filing history
- On success: auto-populates store profile, marks vendor as GST Verified
- On failure: prompts manual document upload for admin review

#### 5.2.2 Vehicle Listing Workflow

**New Listing Flow:**

```
Step 1: Enter vehicle registration number
Step 2: RTO API fetches → Make, Model, Year, Engine CC, Fuel, Color
Step 3: Vendor adds → Price, KM driven, condition notes, asking price
Step 4: AI generates description from fetched specs
Step 5: Upload 4-angle photos (Front, Rear, Left, Right) + optional 3D
Step 6: Select listing tier (Economy / Premium)
Step 7: Publish → Live on marketplace
```

**Listing Fields:**

| Field | Source | Type |
|---|---|---|
| Registration Number | Vendor Input | String |
| Make / Model / Year | RTO API | Auto-filled |
| Engine CC / Fuel / Color | RTO API | Auto-filled |
| Odometer (KM) | Vendor Input | Integer |
| Asking Price (₹) | Vendor Input | Decimal |
| Condition Notes | Vendor Input | Text |
| Description | AI Generated | Text (editable) |
| Photos | Vendor Upload | Images (min 4) |
| Listing Tier | Vendor Selection | Economy / Premium |
| RTO Verified Badge | System | Boolean |

#### 5.2.3 Custom Storefront

**Features:**
- Unique store URL: `wheewise.com/store/{store-slug}`
- Upload store logo and banner
- Set brand colors (primary/secondary)
- Write store bio / about section
- Economy tier: Standard template
- Premium tier: Enhanced template + featured badge + priority search ranking
- Integrated customer review section
- Contact form with WhatsApp & phone CTA

#### 5.2.4 Inventory Management

**Features:**
- Dashboard: Active / Sold / Draft / Expired listings
- Interest tracker: High / Moderate / Low (based on views, enquiries)
- Quick edit: price update, mark as sold
- Duplicate listing for similar vehicles
- Bulk upload via CSV (Premium tier)
- Auto-expire listings after 90 days (configurable)

---

### 5.3 End User App (Module C)

**URL:** `wheewise.com`  
**Access:** Public (browse) + Registered users (save, enquire, compare)

#### 5.3.1 Smart Discovery

**Search & Filter System:**

| Filter | Type | Options |
|---|---|---|
| Category | Select | Cars / Bikes |
| Brand | Multi-select | Dynamic from DB |
| Model | Dependent select | Based on Brand |
| Year | Range | 2000 – current |
| Price | Range slider | ₹0 – ₹50L+ |
| KM Driven | Range | 0 – 200k km |
| Fuel Type | Multi-select | Petrol / Diesel / CNG / EV |
| Transmission | Select | Manual / Automatic |
| Location | City / Radius | GPS or manual |
| Listing Tier | Toggle | Economy / Premium |

**Ranking Algorithm:**
```
Score = (Premium boost × 2) + (RTO Verified × 1.5) + 
        (Recency score) + (Seller trust score) + 
        (Relevance to search query)
```

#### 5.3.2 Vehicle Detail Page

**Sections:**
- Photo gallery (4-angle + 3D viewer if available)
- RTO Verified badge + fetched specs table
- AI-generated description
- Price + EMI Calculator (inline)
- Seller store card (logo, verified badge, reviews)
- WhatsApp CTA + Call Now CTA
- Quick enquiry form
- Similar vehicles carousel
- Compare button

#### 5.3.3 EMI Calculator

**Inputs:** Vehicle Price, Down Payment, Tenure (1–7 years), Interest Rate  
**Output:** Monthly EMI, Total Interest Payable, Amortization schedule (expandable)

**Formula:**
```
EMI = P × r × (1+r)^n / ((1+r)^n - 1)
Where:
  P = Principal (Price - Down Payment)
  r = Monthly interest rate (annual rate / 12 / 100)
  n = Tenure in months
```

#### 5.3.4 Vehicle Compare Tool

- Compare up to 3 vehicles side-by-side
- Specs table: Engine, Fuel, Year, KM, Price, Transmission
- Highlights better value in green
- Shareable compare link

#### 5.3.5 Cart / Wishlist

- Save vehicles for later (requires login)
- Persistent across sessions
- Email alert if saved vehicle price drops

#### 5.3.6 Instant Connect

- **WhatsApp:** Opens wa.me link with pre-filled message template
- **Call Now:** Direct tel: link
- **In-app Chat:** Real-time chat via Socket.io between buyer and vendor
- **Quick Enquiry Form:** Name + Phone + Message → delivered to vendor dashboard + email

---

## 6. Database Design

### Entity Relationship Overview

```
User ─────────────── Vendor (1:1)
User ─────────────── Wishlist (1:N)
Vendor ───────────── Store (1:1)
Vendor ───────────── Listing (1:N)
Listing ──────────── ListingPhoto (1:N)
Listing ──────────── Enquiry (1:N)
Listing ──────────── RTOData (1:1)
Vendor ───────────── Payout (1:N)
User ─────────────── ChatSession (1:N)
ChatSession ──────── ChatMessage (1:N)
```

### Core Tables

#### `users`
```sql
id            UUID PRIMARY KEY
phone         VARCHAR(15) UNIQUE NOT NULL
email         VARCHAR(255) UNIQUE
name          VARCHAR(255)
role          ENUM('admin', 'vendor', 'buyer')
is_verified   BOOLEAN DEFAULT false
created_at    TIMESTAMP
updated_at    TIMESTAMP
```

#### `vendors`
```sql
id              UUID PRIMARY KEY
user_id         UUID FK → users.id
gstin           VARCHAR(15) UNIQUE NOT NULL
gst_verified    BOOLEAN DEFAULT false
trade_license   VARCHAR(500)         -- S3 URL
trust_score     INTEGER DEFAULT 50
plan_tier       ENUM('economy', 'premium')
is_active       BOOLEAN DEFAULT true
kyc_status      ENUM('pending', 'approved', 'rejected')
created_at      TIMESTAMP
```

#### `stores`
```sql
id              UUID PRIMARY KEY
vendor_id       UUID FK → vendors.id
store_name      VARCHAR(255) NOT NULL
slug            VARCHAR(255) UNIQUE NOT NULL
logo_url        VARCHAR(500)
banner_url      VARCHAR(500)
primary_color   VARCHAR(7)
secondary_color VARCHAR(7)
bio             TEXT
city            VARCHAR(100)
address         TEXT
phone           VARCHAR(15)
whatsapp        VARCHAR(15)
avg_rating      DECIMAL(3,2)
total_reviews   INTEGER DEFAULT 0
```

#### `listings`
```sql
id                UUID PRIMARY KEY
vendor_id         UUID FK → vendors.id
store_id          UUID FK → stores.id
reg_number        VARCHAR(20) UNIQUE
vehicle_type      ENUM('car', 'bike')
make              VARCHAR(100)
model             VARCHAR(100)
year              INTEGER
engine_cc         INTEGER
fuel_type         ENUM('petrol', 'diesel', 'cng', 'electric', 'hybrid')
transmission      ENUM('manual', 'automatic')
color             VARCHAR(50)
odometer_km       INTEGER
asking_price      DECIMAL(12,2)
description       TEXT
condition_notes   TEXT
rto_verified      BOOLEAN DEFAULT false
listing_tier      ENUM('economy', 'premium')
status            ENUM('draft', 'active', 'sold', 'expired', 'removed')
view_count        INTEGER DEFAULT 0
enquiry_count     INTEGER DEFAULT 0
interest_level    ENUM('low', 'moderate', 'high')
expires_at        TIMESTAMP
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

#### `listing_photos`
```sql
id            UUID PRIMARY KEY
listing_id    UUID FK → listings.id
url           VARCHAR(500)
angle         ENUM('front', 'rear', 'left', 'right', 'interior', 'other')
is_primary    BOOLEAN DEFAULT false
sort_order    INTEGER
```

#### `rto_data`
```sql
id                UUID PRIMARY KEY
listing_id        UUID FK → listings.id
reg_number        VARCHAR(20)
owner_name        VARCHAR(255)
registration_date DATE
chassis_number    VARCHAR(50)
engine_number     VARCHAR(50)
insurance_valid   DATE
rc_status         VARCHAR(50)
raw_response      JSONB
fetched_at        TIMESTAMP
```

#### `enquiries`
```sql
id            UUID PRIMARY KEY
listing_id    UUID FK → listings.id
vendor_id     UUID FK → vendors.id
buyer_name    VARCHAR(255)
buyer_phone   VARCHAR(15)
buyer_email   VARCHAR(255)
message       TEXT
source        ENUM('form', 'whatsapp', 'call', 'chat')
is_read       BOOLEAN DEFAULT false
created_at    TIMESTAMP
```

#### `payouts`
```sql
id              UUID PRIMARY KEY
vendor_id       UUID FK → vendors.id
amount          DECIMAL(12,2)
status          ENUM('pending', 'auto_approved', 'manual_review', 'approved', 'rejected', 'paid')
auto_approved   BOOLEAN
reviewed_by     UUID FK → users.id
review_note     TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### `chat_sessions`
```sql
id            UUID PRIMARY KEY
listing_id    UUID FK → listings.id
buyer_id      UUID FK → users.id
vendor_id     UUID FK → vendors.id
is_active     BOOLEAN DEFAULT true
created_at    TIMESTAMP
```

#### `chat_messages`
```sql
id            UUID PRIMARY KEY
session_id    UUID FK → chat_sessions.id
sender_id     UUID FK → users.id
message       TEXT
is_read       BOOLEAN DEFAULT false
created_at    TIMESTAMP
```

---

## 7. API Design

### Base URL
```
https://api.wheewise.com/v1
```

### Authentication Header
```
Authorization: Bearer <JWT_TOKEN>
```

### Endpoint Reference

#### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/send-otp` | Send OTP to phone |
| POST | `/auth/verify-otp` | Verify OTP, return JWT |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate session |

#### Vendors
| Method | Endpoint | Description |
|---|---|---|
| POST | `/vendors/register` | Register new vendor |
| GET | `/vendors/me` | Get own vendor profile |
| PUT | `/vendors/me` | Update vendor profile |
| POST | `/vendors/verify-gst` | Trigger GST verification |
| GET | `/vendors/:id/store` | Get public store page |

#### Listings
| Method | Endpoint | Description |
|---|---|---|
| GET | `/listings` | Search listings (query params) |
| POST | `/listings` | Create new listing (vendor) |
| GET | `/listings/:id` | Get listing detail |
| PUT | `/listings/:id` | Update listing (vendor) |
| DELETE | `/listings/:id` | Remove listing |
| POST | `/listings/:id/mark-sold` | Mark as sold |
| GET | `/listings/:id/rto` | Fetch/refresh RTO data |
| POST | `/listings/:id/enquiry` | Submit enquiry |

#### RTO
| Method | Endpoint | Description |
|---|---|---|
| POST | `/rto/fetch` | Fetch vehicle data by reg number |

#### Search
| Method | Endpoint | Description |
|---|---|---|
| GET | `/search` | Full-text + faceted search |
| GET | `/search/suggestions` | Autocomplete suggestions |

#### EMI
| Method | Endpoint | Description |
|---|---|---|
| POST | `/emi/calculate` | Calculate EMI + amortization |

#### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/dashboard` | Platform KPIs |
| GET | `/admin/vendors` | List all vendors |
| PUT | `/admin/vendors/:id/approve` | Approve vendor |
| PUT | `/admin/vendors/:id/suspend` | Suspend vendor |
| GET | `/admin/moderation` | Moderation queue |
| PUT | `/admin/listings/:id/remove` | Remove listing |
| GET | `/admin/payouts` | Payout queue |
| PUT | `/admin/payouts/:id/approve` | Approve payout |

### Sample Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  },
  "error": null
}
```

### Error Format
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "GSTIN is invalid",
    "details": { "field": "gstin" }
  }
}
```

---

## 8. Third-Party Integrations

### 8.1 GST Verification API
- **Provider:** India Government GST Portal API (or aggregator like Karza/Signzy)
- **Endpoint:** `POST /gst/verify`
- **Input:** GSTIN (15-character alphanumeric)
- **Output:** Business name, address, status, filing history
- **Usage:** Vendor onboarding, periodic re-verification
- **Fallback:** Manual document upload → admin review

### 8.2 RTO / Vahan API
- **Provider:** MoRTH Vahan API (via NIC or third-party like IDfy)
- **Endpoint:** `POST /rc/fetch`
- **Input:** Vehicle Registration Number
- **Output:** Make, Model, Year, Engine, Fuel, Color, Owner, Insurance
- **Usage:** Auto-fill listing details, RTO Verified badge
- **Rate Limit:** Cached per reg number for 30 days

### 8.3 AI Description Generation
- **Provider:** OpenAI GPT-4o (or Anthropic Claude API)
- **Trigger:** After RTO data + vendor inputs are collected
- **Prompt Template:**
  ```
  Generate a professional, persuasive vehicle listing description for:
  Make: {make}, Model: {model}, Year: {year}, Fuel: {fuel},
  KM: {odometer}, Condition Notes: {notes}
  Keep it under 150 words, highlight key selling points.
  ```
- **Queue:** Processed via BullMQ job (async, non-blocking)

### 8.4 3D Visuals
- **Provider:** Custom internal service or third-party (e.g., Spyne AI)
- **Input:** 4 standard angle photos
- **Output:** 360° spin or 3D viewer embed
- **Storage:** S3 + CloudFront

### 8.5 Payment Gateway
- **Provider:** Razorpay
- **Usage:** Vendor subscription (Economy / Premium plan payments)
- **Webhooks:** Payment success → activate plan; failure → notify vendor

### 8.6 SMS / OTP
- **Provider:** MSG91 or Twilio
- **Usage:** Phone-based OTP authentication for all users

### 8.7 WhatsApp
- **Method:** Direct `wa.me` deep link (no API required)
- **Template:** `?text=Hi, I'm interested in your {vehicle} listed on Wheewise: {listing_url}`

### 8.8 Ads Integration
- **Meta Ads:** Facebook Pixel on listing pages + store pages
- **Google Ads:** Google Tag Manager for conversion tracking
- **Location Targeting:** City-level geotargeting for dealer discovery campaigns

### 8.9 Email
- **Provider:** AWS SES or SendGrid
- **Usage:** Onboarding emails, enquiry notifications, violation alerts, payout receipts

---

## 9. Authentication & Authorization

### Authentication Method
- **Phone-based OTP** (primary) — no password required
- JWT access tokens (15-min expiry) + Refresh tokens (30-day expiry)
- Tokens stored in HttpOnly cookies (not localStorage)

### Roles & Permissions

| Role | Access |
|---|---|
| `super_admin` | Full platform access |
| `admin` | Dashboard, moderation, vendor management |
| `moderator` | Moderation queue only |
| `vendor` | Own store, own listings, own payouts |
| `buyer` | Public + wishlist + chat + enquiries |
| `guest` | Public browse only |

### Guard Implementation (NestJS)
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('vendor')
@Post('/listings')
createListing(@Body() dto: CreateListingDto, @Req() req) { ... }
```

### Vendor Isolation
- All vendor data queries append `WHERE vendor_id = req.user.vendorId`
- Vendors cannot access other vendors' data
- Admin endpoints protected by separate admin JWT scope

---

## 10. Security Considerations

### Input Validation
- All DTOs validated with `class-validator` + Zod on frontend
- SQL injection: Prisma ORM parameterized queries only
- XSS: Content sanitized via `DOMPurify` on render; stored as plain text
- File uploads: MIME type + size validation; virus scan via ClamAV

### Rate Limiting
| Endpoint | Limit |
|---|---|
| `/auth/send-otp` | 3 requests / 10 min per phone |
| `/rto/fetch` | 10 requests / min per vendor |
| `/search` | 60 requests / min per IP |
| Global API | 100 requests / min per user |

### Data Privacy
- Phone numbers masked in public-facing APIs
- GSTIN stored encrypted at rest
- KYC documents stored in private S3 bucket (pre-signed URLs)
- Chat messages encrypted in transit (TLS 1.3)

### Infrastructure Security
- All services run in private VPC; only API Gateway and CloudFront public
- Secrets managed via AWS Secrets Manager
- Regular dependency audits with `npm audit`

---

## 11. Performance & Scalability

### Caching Strategy

| Data | Cache Layer | TTL |
|---|---|---|
| Listing detail | Redis | 10 min |
| Search results | Redis | 2 min |
| RTO fetched data | Redis | 30 days |
| Vendor store page | CDN (CloudFront) | 5 min |
| Admin dashboard KPIs | Redis | 30 sec |

### Database Optimization
- Indexes on: `listings.status`, `listings.vehicle_type`, `listings.city`, `listings.asking_price`, `vendors.gstin`
- Read replicas for search and analytics queries
- Connection pooling via PgBouncer

### Search
- Elasticsearch for full-text search, faceted filters, and relevance ranking
- Listings synced to ES index on create/update via BullMQ job
- Elasticsearch index mappings optimized for vehicle search patterns

### Media
- Images compressed and WebP-converted on upload (Sharp.js)
- Multiple resolutions generated: thumbnail (200px), card (600px), full (1200px)
- Served via CloudFront CDN with long cache headers

### Scalability
- Stateless API servers (horizontal scaling via ECS)
- Redis Cluster for cache high availability
- Elasticsearch cluster with replica shards
- S3 + CloudFront scales infinitely for media

---

## 12. Deployment Architecture

### Environments

| Environment | Purpose | Domain |
|---|---|---|
| Development | Local dev | localhost |
| Staging | QA & testing | staging.wheewise.com |
| Production | Live | wheewise.com |

### CI/CD Pipeline (GitHub Actions)

```
Push to feature/* branch
  → Lint + Type check
  → Unit tests
  → Build Docker images
  → Deploy to Staging

Merge to main
  → All above +
  → Integration tests
  → Deploy to Production (ECS rolling update)
  → Notify Slack
```

### Docker Services
```yaml
services:
  api:          # NestJS API
  admin-web:    # React Admin Panel
  vendor-web:   # React Vendor Portal
  user-web:     # Next.js User App
  postgres:     # PostgreSQL
  redis:        # Redis
  elasticsearch: # Elasticsearch
  worker:       # BullMQ workers
```

### Monitoring & Alerts
- **Uptime:** Healthcheck endpoints monitored by AWS CloudWatch
- **Errors:** Sentry for real-time error tracking (frontend + backend)
- **Metrics:** Prometheus + Grafana dashboards (API latency, DB connections, queue depth)
- **Alerts:** PagerDuty integration for P0 incidents (downtime, error spike)

---

## 13. Future Roadmap

### Phase 2 — Quality Inspection Service
- Partner with certified mechanics for on-site inspections
- Inspection checklist: 100+ point mechanical check
- Body condition report with photos
- Test drive assessment scoring
- Quality rating badge on listing (1–5 stars)
- Comparable to Cars24 & Spinny inspection standards

### Phase 3 — Community & Hackathons
- Dealer community forum (Q&A, market tips)
- Buyer community (reviews, ownership experiences)
- Annual Wheewise Hackathon for pre-owned market innovations
- Developer API program for third-party integrations

### Phase 4 — Native Mobile Apps
- iOS app (Swift / React Native)
- Android app (React Native)
- Push notifications for price drops, new listings, chat messages

### Phase 5 — Financial Products
- Direct loan origination with NBFC partners
- Insurance renewals via API
- RC transfer assistance (legal partner integration)

---

## 14. Glossary

| Term | Definition |
|---|---|
| **GSTIN** | Goods and Services Tax Identification Number (15-digit, India) |
| **RTO** | Regional Transport Office — issues vehicle registration certificates in India |
| **RC** | Registration Certificate — official vehicle ownership document |
| **KYC** | Know Your Customer — identity verification process |
| **Economy Tier** | Basic listing plan with standard visibility |
| **Premium Tier** | Paid listing plan with boosted ranking and enhanced storefront |
| **Trust Score** | Internal vendor score (0–100) based on compliance, ratings, and history |
| **PWA** | Progressive Web App — web app with native-like mobile experience |
| **EMI** | Equated Monthly Installment — fixed monthly loan repayment |
| **CDN** | Content Delivery Network — geographically distributed file serving |
| **BullMQ** | Redis-based job queue library for Node.js |
| **SSR** | Server-Side Rendering — HTML generated on server for SEO |
| **SPA** | Single Page Application — client-rendered React app |

---

---

## 15. User Stories

### Admin

| ID | As an admin, I want to... | So that... |
|---|---|---|
| A-01 | See total revenue, active listings, and pending moderation queue on a single dashboard | I can assess platform health at a glance |
| A-02 | Approve or reject a vendor registration with a single click | Onboarding is fast and auditable |
| A-03 | Suspend a vendor and auto-remove their listings | Policy enforcement is immediate |
| A-04 | Override an automated payout approval | I can catch fraudulent transactions before disbursement |
| A-05 | See a full audit log of all payout decisions | We remain compliant and accountable |
| A-06 | Receive real-time alerts when moderation queue exceeds 10 items | Nothing sits in the queue too long |
| A-07 | Export vendor and listing reports to CSV | I can share data with stakeholders offline |
| A-08 | View a traffic vs. sales chart for any date range | I can identify trends and seasonality |

---

### Vendor (Store Owner)

| ID | As a vendor, I want to... | So that... |
|---|---|---|
| V-01 | Register my dealership using my GSTIN and have it auto-verified | I can start listing vehicles quickly without manual document submission |
| V-02 | Enter a vehicle registration number and have specs auto-filled from RTO | I save time and avoid data entry errors |
| V-03 | Have an AI-generated description ready for my listing | My listings look professional even without copywriting skills |
| V-04 | Upload 4-angle photos and get a 3D visual generated | Buyers get a richer view of my inventory |
| V-05 | See which of my listings have "High Interest" | I know which vehicles to prioritize for follow-ups |
| V-06 | Set a custom store URL with my logo and brand colors | My dealership has a professional digital identity |
| V-07 | Upgrade to Premium tier and have my listings appear higher in search | I get more leads and sell faster |
| V-08 | Receive WhatsApp/email notifications when a buyer enquires | I never miss a lead |
| V-09 | Mark a vehicle as Sold with one click | My inventory stays accurate |
| V-10 | View my store's review average and individual buyer reviews | I can build reputation and respond to feedback |

---

### Buyer (End User)

| ID | As a buyer, I want to... | So that... |
|---|---|---|
| B-01 | Filter vehicles by brand, year, fuel type, price, and city | I find exactly what I'm looking for quickly |
| B-02 | See an "RTO Verified" badge on a listing | I know the vehicle data is authentic, not self-reported |
| B-03 | Calculate my monthly EMI on any listing page | I can make informed finance decisions without leaving the page |
| B-04 | Compare two or three vehicles side by side | I can objectively evaluate my options |
| B-05 | Save vehicles to a wishlist | I can revisit shortlisted options later |
| B-06 | Contact a seller via WhatsApp or call with one tap | Reaching a seller is frictionless |
| B-07 | Chat with a vendor inside the app | I can ask questions without sharing my phone number |
| B-08 | Browse a dealer's full store page | I can see all their inventory and assess their credibility |
| B-09 | Get notified if a wishlisted vehicle drops in price | I never miss a better deal |
| B-10 | See nearby verified dealers first in search results | I prefer local shops I can visit in person |

---

## 16. Notification System

### Notification Channels

| Channel | Used For |
|---|---|
| SMS (OTP provider) | OTP verification, critical security alerts |
| Email (AWS SES) | Onboarding, enquiry alerts, violation notices, payout receipts |
| In-app (WebSocket) | Real-time chat messages, new enquiry badge |
| Push (Phase 4) | Price drops on wishlisted items, new chat messages |
| WhatsApp (wa.me) | Buyer-initiated contact with vendor |

---

### Notification Events

| Event | Recipient | Channel |
|---|---|---|
| Vendor registration submitted | Admin | Email + In-app |
| Vendor GST verification passed | Vendor | Email + SMS |
| Vendor GST verification failed | Vendor | Email + SMS |
| Vendor suspended | Vendor | Email |
| New listing published | Vendor | In-app |
| Listing approaching expiry (7 days) | Vendor | Email |
| Listing expired | Vendor | Email |
| New enquiry received | Vendor | Email + In-app |
| New chat message | Vendor / Buyer | In-app (WebSocket) |
| Payout auto-approved | Vendor | Email |
| Payout manually approved | Vendor | Email + SMS |
| Payout rejected | Vendor | Email |
| Content violation detected | Vendor | Email + In-app |
| Listing removed by admin | Vendor | Email |
| Wishlisted vehicle price changed | Buyer | Email (Phase 4: Push) |
| OTP sent | User | SMS |

---

### Notification Template System

Templates are stored in the database and support dynamic variables:

```
Template ID: VENDOR_NEW_ENQUIRY
Subject: New enquiry on your listing — {vehicle_name}
Body:
  Hi {vendor_name},
  {buyer_name} is interested in your {vehicle_name} listed at ₹{price}.
  Message: "{buyer_message}"
  Phone: {buyer_phone}
  View listing: {listing_url}
```

All templates are editable by `super_admin` via the admin panel without a code deploy.

---

## 17. Monetization & Business Model

### Revenue Streams

#### 1. Vendor Subscription Plans

| Plan | Price | Features |
|---|---|---|
| **Economy** | ₹0/month | Up to 10 active listings, standard visibility, basic storefront |
| **Premium** | ₹999/month | Unlimited listings, boosted ranking, enhanced storefront, bulk CSV upload, featured badge, priority support |

#### 2. Listing Boost (Pay-per-listing)
- Vendors can pay to boost individual listings to top of search for 7 / 14 / 30 days
- Pricing: ₹99 / ₹179 / ₹299 per listing boost

#### 3. Featured Store Placement
- Homepage "Featured Dealers" section
- Charged as add-on: ₹499/week

#### 4. Lead Generation Commission (Future)
- Platform takes 0.5–1% of final sale value when a transaction is facilitated via Wheewise Finance (Phase 5)

#### 5. Inspection Service Fee (Phase 2)
- Charged to vendor: ₹799 per vehicle inspection
- Unlocks "Inspected" badge on listing

---

### Subscription Billing Flow

```
Vendor selects Premium Plan
  → Razorpay checkout opens
  → Payment success webhook received
  → plan_tier updated to 'premium'
  → premium_expires_at set to now + 30 days
  → Confirmation email sent

Renewal (BullMQ cron job, daily):
  → Query vendors WHERE premium_expires_at <= now + 3 days
  → Send renewal reminder email
  → On expiry: downgrade to Economy, notify vendor
```

---

### Unit Economics (Target)

| Metric | Target |
|---|---|
| Average vendors per city (launch) | 50 |
| Premium conversion rate | 30% |
| Average revenue per premium vendor | ₹999/month |
| Monthly revenue at 500 vendors, 30% premium | ₹1,49,850 |

---

## 18. Testing Strategy

### Testing Pyramid

```
         ▲
        /E2E\          (Playwright — critical user flows)
       /──────\
      /Integration\    (Supertest — API endpoints + DB)
     /──────────────\
    /   Unit Tests   \ (Jest — services, utils, DTOs)
   /──────────────────\
```

---

### Unit Tests

**Scope:** Pure business logic — services, utility functions, DTO validators, EMI calculator

**Tools:** Jest + ts-jest

**Examples:**
```typescript
// EMI calculation
describe('EmiService', () => {
  it('should calculate correct monthly EMI', () => {
    const result = emiService.calculate({ price: 500000, downPayment: 100000, tenure: 60, rate: 10 });
    expect(result.monthlyEmi).toBeCloseTo(8500, 0);
  });
});

// Trust score update
describe('VendorTrustService', () => {
  it('should decrease trust score on violation', () => {
    const score = trustService.applyViolation(80, 'CONTENT_VIOLATION');
    expect(score).toBeLessThan(80);
  });
});
```

**Coverage Target:** 80% for service layer

---

### Integration Tests

**Scope:** API endpoints with real PostgreSQL (test DB) + Redis

**Tools:** Supertest + Jest + Testcontainers (spins up Postgres/Redis in Docker)

**Examples:**
```typescript
describe('POST /vendors/verify-gst', () => {
  it('should return verified vendor data for valid GSTIN', async () => {
    const res = await request(app)
      .post('/v1/vendors/verify-gst')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ gstin: '29ABCDE1234F1Z5' });
    expect(res.status).toBe(200);
    expect(res.body.data.gst_verified).toBe(true);
  });
});
```

**Coverage Target:** All critical API paths (auth, listing CRUD, search, EMI, enquiry)

---

### End-to-End Tests

**Scope:** Full user flows in browser

**Tool:** Playwright

**Critical Flows Tested:**

| Flow | Actors |
|---|---|
| Vendor registers → GST verified → creates first listing | Vendor |
| Buyer searches → filters → views listing → submits enquiry | Buyer |
| Buyer uses EMI calculator and compares 2 vehicles | Buyer |
| Admin approves vendor → vendor publishes listing → appears in search | Admin + Vendor + Buyer |
| Vendor upgrades to Premium → listing ranking improves | Vendor |
| Admin removes listing for violation → vendor receives email | Admin + Vendor |

---

### Test Environments

| Type | Database | External APIs |
|---|---|---|
| Unit | Mocked | Mocked |
| Integration | Testcontainers (real Postgres) | Mocked (MSW) |
| E2E Staging | Real staging DB | Real APIs (sandbox mode) |

---

### QA Checklist (Pre-Release)

- [ ] All Playwright E2E flows pass
- [ ] No P0/P1 Sentry errors in staging in last 24h
- [ ] Lighthouse mobile score ≥ 85 (performance)
- [ ] API response time p95 < 500ms on staging
- [ ] All new DB migrations run cleanly on staging
- [ ] Security headers present (checked via securityheaders.com)

---

## 19. SEO Strategy

Wheewise's user-facing Next.js app is the only surface that requires SEO optimization. The vendor and admin portals are authentication-gated and excluded from indexing.

### Page-level SEO

| Page | Title Template | Meta Description |
|---|---|---|
| Home | Wheewise — Buy Pre-Owned Cars & Bikes Near You | Find verified pre-owned cars and bikes from trusted local dealers. |
| Search Results | Used {brand} {model} for Sale in {city} — Wheewise | Browse {count} verified {brand} listings near {city}. Filter by price, year, fuel & more. |
| Listing Detail | {year} {brand} {model} — ₹{price} — Wheewise | {year} {brand} {model}, {odometer}km, {fuel}, {transmission}. RTO Verified. Contact dealer. |
| Store Page | {store_name} — Pre-Owned Vehicles in {city} — Wheewise | Verified pre-owned car & bike dealer in {city}. Browse {count} listings from {store_name}. |

---

### Technical SEO

- **SSR via Next.js App Router** — listing and store pages fully server-rendered for crawlability
- **Sitemap:** Auto-generated XML sitemap at `/sitemap.xml` (regenerated nightly via cron)
  - Includes all active listing URLs and store pages
- **robots.txt:** Block `/admin`, `/vendor`, `/api`, `/cart`, `/wishlist`
- **Canonical URLs:** Set on all listing and store pages to prevent duplicate content
- **Structured Data (JSON-LD):**
  - Listing pages: `Product` schema with price, image, brand
  - Store pages: `LocalBusiness` schema with address, phone, geo coordinates
- **Image alt tags:** Auto-generated as `{year} {brand} {model} {angle} photo`
- **Core Web Vitals targets:**
  - LCP < 2.5s
  - CLS < 0.1
  - INP < 200ms

---

### URL Structure

```
/                                    → Homepage
/search?type=car&city=mumbai         → Search results
/vehicle/{listing-slug}              → Listing detail (e.g., /vehicle/2021-hyundai-creta-sx-mumbai)
/store/{store-slug}                  → Vendor store page
/store/{store-slug}/{listing-slug}   → Listing under store context
/compare?ids={id1},{id2}             → Compare page (noindex)
```

Listing slugs are generated as: `{year}-{brand}-{model}-{variant}-{city}-{short-id}`

---

## 20. Analytics & Event Tracking

### Platforms

| Purpose | Tool |
|---|---|
| Product analytics | Mixpanel (or PostHog self-hosted) |
| Ad conversion tracking | Google Tag Manager |
| Facebook Pixel | Meta Pixel via GTM |
| Session recording | Hotjar (sampling 10% of sessions) |
| Server-side analytics | Custom events stored in PostgreSQL `events` table |

---

### Frontend Events (Mixpanel)

| Event Name | Properties | Triggered When |
|---|---|---|
| `search_performed` | query, filters, result_count, city | User executes a search |
| `listing_viewed` | listing_id, vehicle_type, price, tier, vendor_id | Listing detail page opened |
| `emi_calculated` | listing_id, down_payment, tenure, monthly_emi | User interacts with EMI calc |
| `compare_added` | listing_id, compare_count | Vehicle added to compare |
| `compare_viewed` | listing_ids[] | Compare page opened |
| `enquiry_submitted` | listing_id, vendor_id, source | Enquiry form submitted |
| `whatsapp_click` | listing_id, vendor_id | WhatsApp CTA tapped |
| `call_click` | listing_id, vendor_id | Call Now CTA tapped |
| `wishlist_added` | listing_id | Item added to wishlist |
| `store_viewed` | store_id, vendor_id, city | Vendor store page opened |
| `listing_tier_seen` | tier, listing_id | Premium badge seen in results |

---

### Vendor Analytics (Server-side, Vendor Dashboard)

Vendor-specific metrics stored in DB and surfaced in the vendor portal:

| Metric | Description | Update Frequency |
|---|---|---|
| Listing views | Total views per listing | Real-time |
| Enquiry count | Total enquiries per listing | Real-time |
| WhatsApp clicks | Taps on WhatsApp CTA | Real-time |
| Store page views | Views of vendor's store page | Daily aggregate |
| Interest level | `high / moderate / low` computed from views + enquiries | Recalculated every 6h |
| Conversion rate | (Enquiries / Views) × 100 | Daily |

**Interest Level Thresholds:**
```
Views > 50 AND Enquiries > 3 in last 7 days  →  High
Views > 20 OR Enquiries > 1 in last 7 days   →  Moderate
Otherwise                                     →  Low
```

---

## 21. Error Handling Strategy

### Backend Error Classes

All errors extend a base `AppException` class:

```typescript
class AppException extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly details?: object
  ) { super(message); }
}

// Usage examples:
throw new AppException('VENDOR_NOT_FOUND', 'Vendor does not exist', 404);
throw new AppException('GST_VERIFICATION_FAILED', 'GSTIN is inactive', 422, { gstin });
throw new AppException('LISTING_LIMIT_REACHED', 'Economy plan allows max 10 listings', 403);
```

### Error Code Registry

| Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | DTO validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Insufficient role/permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate resource (e.g., GSTIN already registered) |
| `UNPROCESSABLE` | 422 | Business rule violation |
| `RATE_LIMITED` | 429 | Too many requests |
| `EXTERNAL_API_ERROR` | 502 | GST / RTO API upstream failure |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

### Frontend Error Handling

- **API errors:** React Query's `onError` handler displays toast notification with error message
- **Form errors:** Inline field-level errors from Zod validation
- **Network errors:** Global error boundary catches and shows retry UI
- **404 pages:** Custom Not Found page with search CTA
- **500 pages:** Custom Error page with support contact

---

### External API Failures

| API | Failure Behavior |
|---|---|
| GST API down | Show "Manual review" fallback — admin reviews document upload |
| RTO API down | Allow manual spec entry; flag listing as "Manually Entered" (no RTO badge) |
| AI description API fails | Skip AI step; vendor writes description manually |
| Razorpay webhook missed | BullMQ retry queue — retries up to 5× with exponential backoff |
| Email provider down | Queue email in BullMQ; retry with secondary provider (failover) |

---

## 22. Data Flow Diagrams

### Flow 1: New Vehicle Listing Creation

```
Vendor enters Reg Number
        │
        ▼
POST /rto/fetch ──────────────────────► Vahan API
        │                                    │
        │◄───────────── Vehicle Specs ───────┘
        │
        ▼
Vendor reviews + adds price, KM, photos
        │
        ▼
POST /listings (with all data)
        │
        ├──► Save to PostgreSQL (status: draft)
        │
        ├──► BullMQ: AI Description Job
        │         └──► OpenAI API ──► Update listing.description
        │
        ├──► BullMQ: 3D Visual Job
        │         └──► Spyne API ──► Upload to S3 ──► Update listing.photos
        │
        ├──► BullMQ: Elasticsearch Sync Job
        │         └──► Index listing in ES
        │
        └──► status set to 'active' ──► Listing live on marketplace
```

---

### Flow 2: Buyer Search & Enquiry

```
Buyer enters search query + filters
        │
        ▼
GET /search?q=swift&city=pune&fuel=petrol&maxPrice=400000
        │
        ▼
Check Redis cache (key: hash of query params)
        │
   Hit ─┤─ Miss
        │       │
        │       ▼
        │  Elasticsearch query
        │  (relevance + premium boost + RTO verified boost)
        │       │
        │◄──────┘ (cache result for 2 min)
        │
        ▼
Return paginated listing cards to buyer
        │
        ▼
Buyer opens listing detail page
        │
        ▼
GET /listings/:id
        │
        ├──► Increment view_count (async, Redis counter → DB flush every 5 min)
        └──► Return full listing data + vendor store info

Buyer submits enquiry form
        │
        ▼
POST /listings/:id/enquiry
        │
        ├──► Save Enquiry to PostgreSQL
        ├──► Increment listing.enquiry_count
        ├──► Recalculate interest_level
        └──► BullMQ: Send notification email to vendor
```

---

### Flow 3: Vendor Payout

```
Sale completed / payout trigger event
        │
        ▼
System creates Payout record (status: pending)
        │
        ▼
Check vendor.trust_score
        │
   >= 80 ─┤─ < 80
        │       │
        ▼       ▼
  Auto-approve  Add to Manual Review Queue
  (status: auto_approved)    │
        │       ▼
        │  Admin reviews in panel
        │       │
        │  Approve ─┤─ Reject
        │       │       │
        └───────┘       ▼
        │           Notify vendor (rejected)
        ▼
Razorpay payout API call
        │
        ▼
status: 'paid' + audit log entry + email to vendor
```

---

## 23. Vendor Trust Score System

The Trust Score (0–100) governs automated payment approval, listing priority, and access to features. It is recalculated after each relevant event.

### Initial Score
All newly verified vendors start with a Trust Score of **50**.

### Score Events

| Event | Score Change |
|---|---|
| GST verification passed | +10 |
| Trade license uploaded & verified | +10 |
| Physical store verified by team | +15 |
| First 5 listings published | +5 |
| Positive buyer reviews (avg ≥ 4.0) | +5 per 10 reviews |
| Enquiry response rate > 80% | +5 |
| Account active > 6 months with no violations | +5 |
| Content violation (minor) | −10 |
| Content violation (major / repeat) | −20 |
| Payout dispute raised by buyer | −15 |
| Listing marked as fraudulent | −30 |
| GST filing lapse (3+ months) | −10 |

### Score Thresholds & Effects

| Score Range | Label | Auto-Payout | Listing Visibility | Access |
|---|---|---|---|---|
| 85–100 | Platinum | Yes | Maximum boost | All features |
| 70–84 | Gold | Yes | High boost | All features |
| 50–69 | Standard | No (manual review) | Normal | All features |
| 30–49 | Caution | No | Reduced | Limited (no Premium) |
| 0–29 | Suspended | No | Hidden | Read-only |

### Score Decay
- If no activity (new listing, enquiry response) for 90 days: −5 points
- Recovers automatically once activity resumes

---

## 24. Project Folder Structure

### Backend (NestJS)

```
apps/
└── api/
    ├── src/
    │   ├── main.ts
    │   ├── app.module.ts
    │   │
    │   ├── modules/
    │   │   ├── auth/
    │   │   │   ├── auth.module.ts
    │   │   │   ├── auth.controller.ts
    │   │   │   ├── auth.service.ts
    │   │   │   ├── strategies/
    │   │   │   │   ├── jwt.strategy.ts
    │   │   │   │   └── otp.strategy.ts
    │   │   │   └── guards/
    │   │   │       ├── jwt-auth.guard.ts
    │   │   │       └── roles.guard.ts
    │   │   │
    │   │   ├── vendors/
    │   │   │   ├── vendors.module.ts
    │   │   │   ├── vendors.controller.ts
    │   │   │   ├── vendors.service.ts
    │   │   │   ├── dto/
    │   │   │   │   ├── create-vendor.dto.ts
    │   │   │   │   └── update-vendor.dto.ts
    │   │   │   └── trust-score.service.ts
    │   │   │
    │   │   ├── listings/
    │   │   │   ├── listings.module.ts
    │   │   │   ├── listings.controller.ts
    │   │   │   ├── listings.service.ts
    │   │   │   ├── dto/
    │   │   │   │   ├── create-listing.dto.ts
    │   │   │   │   ├── update-listing.dto.ts
    │   │   │   │   └── search-listings.dto.ts
    │   │   │   └── listings.processor.ts   ← BullMQ job processor
    │   │   │
    │   │   ├── stores/
    │   │   ├── search/
    │   │   ├── emi/
    │   │   ├── enquiries/
    │   │   ├── chat/
    │   │   ├── rto/
    │   │   ├── gst/
    │   │   ├── payouts/
    │   │   ├── admin/
    │   │   └── notifications/
    │   │
    │   ├── common/
    │   │   ├── decorators/
    │   │   ├── filters/             ← Global exception filter
    │   │   ├── interceptors/        ← Response transform, logging
    │   │   ├── pipes/               ← Validation pipe
    │   │   └── utils/
    │   │
    │   ├── config/
    │   │   ├── database.config.ts
    │   │   ├── redis.config.ts
    │   │   └── jwt.config.ts
    │   │
    │   └── prisma/
    │       ├── prisma.service.ts
    │       └── schema.prisma
    │
    └── test/
        ├── unit/
        ├── integration/
        └── e2e/
```

---

### Frontend — User App (Next.js)

```
apps/
└── user-web/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                         ← Homepage
    │   ├── search/
    │   │   └── page.tsx                     ← Search results
    │   ├── vehicle/
    │   │   └── [slug]/
    │   │       └── page.tsx                 ← Listing detail
    │   ├── store/
    │   │   └── [storeSlug]/
    │   │       └── page.tsx                 ← Vendor store page
    │   ├── compare/
    │   │   └── page.tsx
    │   ├── wishlist/
    │   │   └── page.tsx
    │   └── (auth)/
    │       └── login/page.tsx
    │
    ├── components/
    │   ├── listings/
    │   │   ├── ListingCard.tsx
    │   │   ├── ListingGrid.tsx
    │   │   ├── ListingDetail.tsx
    │   │   └── PhotoGallery.tsx
    │   ├── search/
    │   │   ├── SearchBar.tsx
    │   │   └── FilterPanel.tsx
    │   ├── emi/
    │   │   └── EmiCalculator.tsx
    │   ├── compare/
    │   │   └── CompareTable.tsx
    │   ├── chat/
    │   │   └── ChatWindow.tsx
    │   └── shared/
    │       ├── Header.tsx
    │       ├── Footer.tsx
    │       └── VehicleBadge.tsx
    │
    ├── lib/
    │   ├── api.ts                           ← Axios instance
    │   ├── queries/                         ← React Query hooks
    │   └── utils/
    │
    └── public/
```

---

### Frontend — Vendor Portal (React + Vite)

```
apps/
└── vendor-web/
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.tsx
    │   │   ├── Inventory.tsx
    │   │   ├── NewListing.tsx
    │   │   ├── Storefront.tsx
    │   │   ├── Enquiries.tsx
    │   │   ├── Payouts.tsx
    │   │   └── Settings.tsx
    │   │
    │   ├── components/
    │   │   ├── listings/
    │   │   │   ├── RtoFetchStep.tsx
    │   │   │   ├── PhotoUploadStep.tsx
    │   │   │   └── ListingPreview.tsx
    │   │   ├── store/
    │   │   │   └── StorefrontEditor.tsx
    │   │   └── shared/
    │   │
    │   ├── store/                           ← Zustand stores
    │   │   ├── authStore.ts
    │   │   ├── listingStore.ts
    │   │   └── vendorStore.ts
    │   │
    │   └── lib/
```

---

## 25. Development Setup Guide

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20 LTS |
| pnpm | 8+ |
| Docker Desktop | Latest |
| Git | 2.40+ |

---

### Step 1: Clone & Install

```bash
git clone https://github.com/wheewise/wheewise-platform.git
cd wheewise-platform
pnpm install
```

---

### Step 2: Environment Variables

Copy `.env.example` to `.env` in each app:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/user-web/.env.example apps/user-web/.env.local
cp apps/vendor-web/.env.example apps/vendor-web/.env
```

**`apps/api/.env` key variables:**

```env
# Database
DATABASE_URL=postgresql://wheewise:password@localhost:5432/wheewise_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRES_IN=30d

# OTP
MSG91_API_KEY=
MSG91_SENDER_ID=WHWISE

# GST API
GST_API_KEY=
GST_API_URL=https://api.gst.gov.in/commonapi/v1.1

# RTO / Vahan
VAHAN_API_KEY=
VAHAN_API_URL=https://vahan.parivahan.gov.in/api

# AI
OPENAI_API_KEY=

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=wheewise-dev-media
CLOUDFRONT_URL=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Email
SES_FROM_EMAIL=noreply@wheewise.com

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
```

---

### Step 3: Start Infrastructure (Docker)

```bash
docker compose -f docker-compose.dev.yml up -d
# Starts: PostgreSQL, Redis, Elasticsearch
```

---

### Step 4: Database Setup

```bash
cd apps/api
pnpm prisma migrate dev     # Run all migrations
pnpm prisma db seed         # Seed sample data (vendors, listings, admin user)
```

Default seeded admin credentials:
- **Phone:** `9999999999`
- **OTP (dev mode):** `123456` (OTP is always fixed in development)

---

### Step 5: Start Development Servers

```bash
# From repo root — starts all apps in parallel
pnpm dev

# Or individually:
pnpm --filter api dev           # API on :3000
pnpm --filter user-web dev      # User app on :3001
pnpm --filter vendor-web dev    # Vendor portal on :3002
pnpm --filter admin-web dev     # Admin panel on :3003
```

---

### Step 6: Run Tests

```bash
pnpm --filter api test              # Unit tests
pnpm --filter api test:integration  # Integration tests (requires Docker)
pnpm --filter api test:e2e          # E2E tests (Playwright)
pnpm test                           # All tests across all packages
```

---

### Useful Dev Commands

```bash
# Generate Prisma client after schema changes
pnpm --filter api prisma generate

# Create a new migration
pnpm --filter api prisma migrate dev --name add_inspection_table

# Open Prisma Studio (DB GUI)
pnpm --filter api prisma studio

# Clear Redis cache
docker exec wheewise-redis redis-cli FLUSHALL

# Tail API logs
docker logs wheewise-api -f
```

---

---

## 26. First Owner Meeting — Discussion Notes

> **Purpose:** Items requiring owner review and sign-off before the development team proceeds.
> Fill in the **Decision / Action** line during or immediately after the meeting.

---

### 26.1 Tech Stack Approval

The following technology choices have been made by the development team. Owner should confirm
there are no constraints (existing hosting agreements, preferred cloud vendor, in-house skills)
that would require changes.

| Layer | Proposed Technology | Owner Approved? | Notes |
|---|---|---|---|
| User App | Next.js 14 (SSR) | ☐ Y / ☐ N | |
| Vendor + Admin | React 18 + Vite | ☐ Y / ☐ N | |
| Backend | NestJS (Node.js 20) | ☐ Y / ☐ N | |
| Database | PostgreSQL 15 | ☐ Y / ☐ N | |
| Cache | Redis 7 | ☐ Y / ☐ N | |
| Search | Elasticsearch 8 | ☐ Y / ☐ N | |
| Cloud / Infra | AWS (ECS, S3, SES) | ☐ Y / ☐ N | |
| Payments | Razorpay | ☐ Y / ☐ N | |
| OTP / SMS | MSG91 | ☐ Y / ☐ N | |
| AI Descriptions | OpenAI GPT-4o | ☐ Y / ☐ N | |
| RTO Data | Vahan API (IDfy) | ☐ Y / ☐ N | |
| GST Verification | Karza / Signzy | ☐ Y / ☐ N | |

**Discussion questions:**
- Does the owner have an existing AWS account or preferred cloud?
- Any prior vendor agreements (hosting, SMS, payments) that must be honoured?
- Are there any team members with specific tech constraints we should accommodate?

**Decision / Action:** _______________________________________________

---

### 26.2 Budget & Hosting Cost Estimates

Estimated monthly costs at **launch (50 vendors)** and **scale (500 vendors)**:

| Service | Provider | Launch (~50 vendors) | Scale (~500 vendors) |
|---|---|---|---|
| AWS ECS (API + Workers) | AWS | ~₹4,000 | ~₹18,000 |
| AWS RDS PostgreSQL | AWS | ~₹3,500 | ~₹12,000 |
| ElastiCache Redis | AWS | ~₹2,000 | ~₹6,000 |
| Elasticsearch (managed) | AWS / Elastic | ~₹4,500 | ~₹15,000 |
| S3 + CloudFront (media) | AWS | ~₹1,500 | ~₹8,000 |
| AWS SES (email) | AWS | ~₹500 | ~₹2,000 |
| MSG91 SMS / OTP | MSG91 | ~₹1,500 | ~₹6,000 |
| Vahan / RTO API | IDfy | ~₹2,000 | ~₹10,000 |
| GST Verification API | Karza | ~₹1,000 | ~₹5,000 |
| OpenAI (AI descriptions) | OpenAI | ~₹2,500 | ~₹8,000 |
| Razorpay (0.3% + fixed fee) | Razorpay | Variable | Variable |
| Monitoring (Sentry, Grafana) | Sentry / Self-hosted | ~₹1,500 | ~₹3,000 |
| **Total Estimated Burn** | | **~₹24,500/month** | **~₹93,000/month** |

> All estimates in INR. Actual costs depend on usage. Razorpay fees are transaction-based.

**Discussion questions:**
- What is the approved monthly infrastructure budget for the first 6 months?
- Is there a contingency buffer for API cost spikes?
- Who holds and manages the AWS / third-party API accounts — owner or dev team?

**Decision / Action:** _______________________________________________

---

### 26.3 Launch City & Vendor Targets

The platform will launch in a single pilot city before expanding nationally.

| Decision Point | Options | Owner's Choice |
|---|---|---|
| Pilot city | Mumbai / Pune / Bangalore / Hyderabad | _______________ |
| Initial vendor target | 25 / 50 / 100 vendors in 90 days | _______________ |
| Go-live timeline | 2 months / 3 months / 4 months from dev start | _______________ |
| Listing target at launch | 200 / 500 / 1,000 active listings | _______________ |

**KPIs to declare pilot a success:**
- [ ] Minimum ___ verified vendors onboarded
- [ ] Minimum ___ active listings live
- [ ] Minimum ___ buyer enquiries in first 30 days post-launch
- [ ] Vendor retention rate ≥ ___% after 60 days

**Discussion questions:**
- Does the owner have existing relationships with dealers in a specific city?
- Will there be a ground sales team for vendor onboarding or is it self-serve?
- What is the plan for buyer acquisition — organic, Meta Ads, Google Ads, or referral?

**Decision / Action:** _______________________________________________

---

### 26.4 Monetization Plan Sign-off

Proposed pricing and revenue model for owner confirmation:

| Item | Proposed | Owner Confirmed? |
|---|---|---|
| Economy plan price | ₹0/month (free forever) | ☐ Y / ☐ N |
| Premium plan price | ₹999/month | ☐ Y / ☐ N |
| Listing boost (7 days) | ₹99 per listing | ☐ Y / ☐ N |
| Listing boost (14 days) | ₹179 per listing | ☐ Y / ☐ N |
| Listing boost (30 days) | ₹299 per listing | ☐ Y / ☐ N |
| Featured store (homepage) | ₹499/week | ☐ Y / ☐ N |
| Inspection service fee | ₹799 per vehicle (Phase 2) | ☐ Y / ☐ N |
| Payment gateway | Razorpay | ☐ Y / ☐ N |

**Additional items to confirm:**
- [ ] Refund policy for Premium plan (pro-rata / no refund / 7-day cancellation?)
- [ ] GST applicability on platform fees (does the company have GST registration?)
- [ ] Invoicing flow — auto-generated invoice to vendor on each payment?
- [ ] Free trial period for Premium plan at launch? (e.g., first month free for early vendors)
- [ ] Any introductory pricing or discount for pilot city vendors?

**Discussion questions:**
- Should Economy remain free permanently, or convert to paid after a trial period?
- Is the owner open to a revenue-share model with vendors in Phase 5 (Finance products)?
- Who has authority to change pricing after launch — owner only, or dev + product team?

**Decision / Action:** _______________________________________________

---

### Meeting Details

| Field | Value |
|---|---|
| Meeting Date | _______________ |
| Location / Call Link | _______________ |
| Attendees | _______________ |
| Follow-up deadline | _______________ |
| Next meeting date | _______________ |

---

*Wheewise SDD v2.0 — Confidential*
