# Test Deployment Plan — Wheewise v1

**Document Version:** 1.0  
**Last Updated:** 2026-05-29  
**Status:** Draft  
**Target Deployment:** Cloudflare Workers + Neon Postgres

---

## Executive Summary

This document outlines the testing, staging, and production deployment strategy for Wheewise. The goal is to ensure a stable, secure rollout with minimal downtime and full rollback capability.

**Key Milestones:**
1. ✅ Phase 0: CI/CD, testing, security (COMPLETE)
2. ✅ Phase 1: Security hardening (COMPLETE)
3. ⏳ **Phase 2: Staging deployment & load testing (THIS PLAN)**
4. ⏳ Phase 3: Production rollout (canary → full)
5. ⏳ Phase 4: Post-launch monitoring

---

## 1. Testing Strategy

### 1.1 Unit Tests

**Status:** 136 tests passing (Vitest)

```bash
npm run test                # Run all unit tests
npm run test:watch         # Watch mode for development
npm run typecheck          # TypeScript strict mode
npm run format:check       # Prettier compliance
npm run lint               # ESLint
```

**Coverage targets:**
- Server actions: 100% (critical paths)
- Validators (Zod schemas): 100%
- Utils (rate limiting, auth helpers): 80%+
- Components: 50%+ (interactive ones)

**Pre-deployment:** All tests must pass with zero errors.

```bash
npm run test && npm run typecheck && npm run lint
# If any fail, do NOT proceed to staging
```

---

### 1.2 Integration Tests

**Status:** Exists in `tests/unit/` — currently covers:
- Finance calculations (EMI, loan logic)
- Validators (listing schemas, enquiry validation)

**To add before staging:**

```typescript
// tests/integration/listings.test.ts
describe("Listings API", () => {
  beforeEach(async () => {
    // Seed test dealer + listing
    testDealer = await db.dealer.create({ ... });
    testListing = await db.listing.create({ ... });
  });
  
  test("dealer can create listing", async () => {
    // POST /api/listings
  });
  
  test("buyer can view public listing", async () => {
    // GET /api/listings/:id
  });
  
  test("dealer cannot modify other dealer's listing", async () => {
    // Ownership check
  });
});

// tests/integration/auth.test.ts
describe("Authentication", () => {
  test("email + password login", async () => {
    // POST /api/auth/signin
  });
  
  test("phone + OTP login", async () => {
    // POST /api/auth/send-otp + verify
  });
  
  test("session expires after 30 days", async () => {
    // Check session TTL
  });
});

// tests/integration/payments.test.ts
describe("Razorpay Webhooks", () => {
  test("webhook signature validation fails with wrong key", async () => {
    // Security: should reject forged webhooks
  });
  
  test("boost payment idempotency: duplicate webhook ignored", async () => {
    // P2002 unique constraint on razorpayEventId
  });
  
  test("payment creates audit record", async () => {
    // Payment model tracks all events
  });
});
```

**Run before staging:**
```bash
npm run test:integration 2>&1 | tee integration-results.log
# If any fail, investigate and fix
```

---

### 1.3 E2E Tests

**Status:** Playwright configured (`playwright.config.ts`)

**Critical user flows to test:**

```typescript
// tests/e2e/buyer-journey.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Buyer Journey", () => {
  test("browse listings → save → submit enquiry", async ({ page }) => {
    // 1. Load browse page
    await page.goto("/browse");
    await expect(page.locator("[data-test=listing-card]")).toBeVisible();
    
    // 2. Click listing
    await page.click("[data-test=listing-card]:first-child");
    await expect(page).toHaveURL(/\/vehicle\/\w+/);
    
    // 3. Save to wishlist
    await page.click("[data-test=save-btn]");
    await expect(page.locator("[data-test=save-btn]")).toHaveClass(/saved/);
    
    // 4. Submit enquiry
    await page.fill("[name=buyerName]", "John Buyer");
    await page.fill("[name=buyerPhone]", "9876543210");
    await page.click("[data-test=submit-enquiry]");
    
    // 5. Verify success toast
    await expect(page.locator("[role=alert]")).toContainText("Enquiry submitted");
  });
});

// tests/e2e/dealer-journey.spec.ts
test.describe("Dealer Journey", () => {
  test("login → create listing → view enquiries → mark as contacted", async ({ page }) => {
    // 1. Login as demo dealer
    await page.goto("/login");
    await page.fill("[name=email]", "demo@wheewise.in");
    await page.fill("[name=password]", "demo1234");
    await page.click("[data-test=signin-btn]");
    
    // 2. Create listing
    await page.goto("/dealer/dashboard/inventory");
    await page.click("[data-test=new-listing-btn]");
    await page.fill("[name=make]", "Maruti");
    await page.fill("[name=model]", "Swift");
    await page.fill("[name=year]", "2022");
    await page.fill("[name=askingPrice]", "650000");
    await page.click("[data-test=create-btn]");
    
    // 3. View enquiry
    await page.goto("/dealer/dashboard/leads");
    const enquiryRow = page.locator("[data-test=enquiry-row]").first();
    await expect(enquiryRow).toBeVisible();
    
    // 4. Mark contacted
    await page.click("[data-test=mark-contacted-btn]");
    await expect(page.locator("[role=alert]")).toContainText("Updated");
  });
});

// tests/e2e/payment-flow.spec.ts
test.describe("Payment Flow (Razorpay Mock)", () => {
  test("boost listing triggers payment modal", async ({ page }) => {
    // 1. Login as dealer
    // 2. Go to listing
    // 3. Click "Boost" button
    // 4. Modal opens with Razorpay checkout
    // 5. Verify listing is boosted (isBoosted = true)
  });
});
```

**Run before staging:**
```bash
npm run test:e2e:install  # One-time setup
npm run test:e2e          # Run all E2E tests
# Check HTML report: playwright-report/index.html
```

---

### 1.4 Security Checks

Before staging, verify all hardening is in place (from Phase 1):

```bash
# 1. Check for dev backdoors
grep -r "localhost:3000\|SKIP_ENV_VALIDATION" app/lib app/app --include="*.ts" --include="*.tsx"
# Should return ZERO matches in production code

# 2. Verify Razorpay HMAC is NOT mocked in staging
grep -r "mock.*razorpay\|RAZORPAY.*=.*test" app/ --include="*.ts"
# Should only appear in test files

# 3. Check GST verification isn't bypassed
grep -r "gstVerified.*true\|GST.*=.*true" app/lib --include="*.ts"
# Should only be set via real API call

# 4. Verify rate limiting is enabled
grep -r "RATE_LIMIT" app/lib/rate-limit.ts
# Should reference CF-Connecting-IP for real IPs

# 5. Check input validation on forms
grep -r "validator\|parse\|zod" app/app/(dealer)/dashboard --include="*.tsx"
# All forms should validate via Zod schemas
```

**Pre-deployment checklist:**
- [ ] No `console.log()` with sensitive data
- [ ] No plaintext API keys in code (all via env vars)
- [ ] No SQL injection vectors (Prisma parameterized queries only)
- [ ] No XSS vectors (React JSX escaping enabled)
- [ ] CSP nonce present in layout.tsx
- [ ] CORS headers correct (Cloudflare Workers only)

---

### 1.5 Performance Testing

**Objective:** Ensure staging handles expected load without degradation.

```bash
# Load test with artillery or k6
npm install -g k6

# k6/load-test.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 10 },   // Ramp-up to 10 users over 1 min
    { duration: "3m", target: 50 },   // Ramp-up to 50 users
    { duration: "2m", target: 0 },    // Ramp-down to 0
  ],
};

export default function () {
  // Test: Browse listings
  const browseRes = http.get("https://staging.wheewise.com/browse?city=Bangalore");
  check(browseRes, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });
  sleep(1);

  // Test: View vehicle detail
  const vehicleRes = http.get("https://staging.wheewise.com/vehicle/test-listing-id");
  check(vehicleRes, {
    "status is 200": (r) => r.status === 200,
    "response time < 1000ms": (r) => r.timings.duration < 1000,
  });
  sleep(2);
}

# Run: k6 run k6/load-test.js
```

**Success criteria:**
- 95th percentile response time < 500ms
- Error rate < 0.1%
- Database connections pool healthy (no "too many connections")

---

## 2. Staging Deployment

### 2.1 Environment Setup

**Staging database:** Separate Neon branch (not production data)

```bash
# Create staging branch from main
neon branch create --name staging

# Get DATABASE_URL for staging
export DATABASE_URL="postgresql://user:pass@staging-branch.neon.tech/wheewise"

# Migrate schema
npx prisma migrate deploy --skip-generate

# Seed test data (dealers, listings, users)
npx prisma db seed
```

**Staging secrets (Cloudflare):**

```bash
# .env.staging (never commit)
DATABASE_URL=postgresql://...staging...
AUTH_SECRET=staging-secret-key-change-before-prod
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
R2_BUCKET=wheewise-staging
# All other secrets...
```

### 2.2 Build & Deploy to Staging

```bash
# 1. Build Next.js
npm run build
# Verify no build errors, warnings are OK if non-critical

# 2. Build for Cloudflare Workers
npm run cf:build
# Creates .wrangler/

# 3. Deploy to staging worker
wrangler deploy --env staging
# Wrangler config: wrangler.json with [env.staging] section

# 4. Verify deployment
curl https://staging.wheewise.workers.dev
# Should return HTML (landing page) without 5xx errors
```

**wrangler.json example:**
```json
{
  "name": "wheewise",
  "type": "service-workers",
  "main": "dist/server.js",
  "env": {
    "staging": {
      "routes": [
        {
          "pattern": "staging.wheewise.com/*",
          "zone_id": "your-zone-id"
        }
      ],
      "secrets": [
        "DATABASE_URL",
        "AUTH_SECRET",
        "RAZORPAY_KEY_SECRET",
        "R2_SECRET_ACCESS_KEY"
      ]
    },
    "production": {
      "routes": [
        {
          "pattern": "wheewise.com/*",
          "zone_id": "your-zone-id"
        }
      ]
    }
  }
}
```

### 2.3 Staging Smoke Tests

After deployment, verify key flows work:

```bash
# 1. Health check endpoint
curl https://staging.wheewise.com/api/health
# Expected: 200 with { "status": "ok" }

# 2. Can fetch listings
curl https://staging.wheewise.com/api/listings?limit=5
# Expected: 200 with list of listings

# 3. Auth works
curl -X POST https://staging.wheewise.com/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@wheewise.in","password":"demo1234"}'
# Expected: 200 with session cookie

# 4. E2E tests pass
npm run test:e2e -- --ui
# Open http://localhost:3000 and watch test run

# 5. Run critical user journey manually
# - Browse listings
# - View a listing detail
# - Submit an enquiry
# - Check enquiry appears in dealer dashboard
# - Submit a payment (test Razorpay key)
```

### 2.4 Staging Sign-Off

**Checklist before production:**

- [ ] All unit tests pass (`npm run test`)
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] Load test passes (95p < 500ms, error rate < 0.1%)
- [ ] Security audit passed (no backdoors, validated inputs, HTTPS enforced)
- [ ] Smoke tests on staging pass (health, listings, auth, enquiry, payment)
- [ ] Database migrations run cleanly (no rollback needed)
- [ ] Staging logs reviewed (no errors, warnings acceptable)
- [ ] Performance metrics acceptable (Cloudflare Analytics)
- [ ] Team review: product, engineering, security sign off

**Sign-off template:**
```
STAGING SIGN-OFF
================
Date: 2026-05-30
Tester: [name]
Status: ✅ APPROVED / ❌ REJECTED

Test Results:
- Unit tests: ✅ 136/136 passing
- E2E tests: ✅ 12/12 passing
- Load test: ✅ 95p 320ms, 0.02% errors
- Security: ✅ All checks pass

Issues Found: [list any blockers]
Notes: [deployment blockers, workarounds]

Approved by:
- Product: [name]
- Engineering: [name]
- Security: [name]
```

---

## 3. Production Deployment

### 3.1 Pre-Production Checklist

**48 hours before production:**

- [ ] Staging has been live for 24h with no issues
- [ ] All team members trained on rollback procedure
- [ ] Runbook prepared (see Section 5)
- [ ] Monitoring dashboards set up (Cloudflare, Sentry)
- [ ] On-call rotation confirmed for first 7 days
- [ ] Customer support briefed on changes
- [ ] Database backup taken (Neon snapshots)
- [ ] Canary users identified (internal team, beta users)

### 3.2 Canary Deployment (10% rollout)

**Goal:** Deploy to 10% of traffic, monitor for errors before full rollout.

```bash
# Option 1: Cloudflare Workers with gradients
# Route 90% to old version, 10% to new version
wrangler deploy --env production-canary

# Configure in Cloudflare dashboard:
# - Workers route: wheewise.com/*
# - Split 90/10 between old worker (@production) and new worker (@canary)
```

**Canary window: 2–4 hours**

During this time:
- Monitor error rates (target: < 0.1%)
- Monitor latency (target: p95 < 500ms)
- Check database load (target: < 80% connection pool)
- Manual testing: browse, create listing, submit enquiry

**Abort criteria:**
- Error rate spike > 1%
- 5xx errors on critical paths
- Database connection pool exhausted
- Payment processing failing

**If abort:** Immediately route 100% traffic back to old version.

```bash
# Rollback: revert Cloudflare route to previous worker
wrangler deploy --env production
```

### 3.3 Full Production Rollout

Once canary passes, route 100% traffic to new version:

```bash
# Update Cloudflare route to new worker
wrangler deploy --env production

# Verify by checking status page
curl https://wheewise.com/api/health

# Watch logs for first 30 minutes
wrangler tail --env production
```

### 3.4 Post-Deployment Validation

```bash
# 1. Check database queries are healthy
SELECT count(*) FROM "User", "Dealer", "Listing";
# Should return reasonable counts

# 2. Verify critical data is accessible
SELECT COUNT(*) FROM "Listing" WHERE status = 'ACTIVE';
# Should match staging data (approximately)

# 3. Check Razorpay webhook processing
SELECT COUNT(*) FROM "Payment" 
WHERE createdAt > NOW() - INTERVAL '1 hour'
  AND kind = 'BOOST';
# Should have entries if any boosts purchased

# 4. Verify rate limiting works
curl -X POST https://wheewise.com/api/auth/send-otp -d '{"phone":"+919999999999"}' --repeat 100
# 98+ should return 429 (rate limited)
```

---

## 4. Rollback Plan

### 4.1 When to Rollback

Rollback immediately if:
- ❌ Error rate > 1% on critical paths
- ❌ Database is down or inaccessible
- ❌ Payment processing broken (no boosts/subscriptions going through)
- ❌ Authentication broken (users can't log in)
- ❌ Data corruption detected
- ❌ Security issue discovered

**Do NOT rollback if:**
- ✅ Minor UI bugs (fix forward in next deployment)
- ✅ Slow but functional features (optimize after monitoring)
- ✅ Non-critical endpoints down (document in status page)

### 4.2 Rollback Steps

```bash
# 1. STOP the bleeding: redirect traffic to previous worker version
wrangler deploy --env production-previous
# (You should have tagged the previous successful deployment)

# 2. NOTIFY stakeholders
# - Message in #incident-response Slack
# - Update status page: "Working on a fix"
# - Alert on-call team

# 3. INVESTIGATE root cause
# - Check wrangler logs: wrangler tail --env production-previous
# - Check database logs: Neon console
# - Check Sentry error dashboard
# - Check Cloudflare analytics

# 4. DOCUMENT incident
# - Timestamp of deployment
# - Timestamp of rollback
# - Duration of outage
# - Root cause (if identified)
# - Preventive measures for next time

# 5. FIX THE BUG
# - Create fix on feature branch
# - Test in staging
# - Get sign-off before re-deploying
```

### 4.3 Database Rollback (if needed)

```bash
# If database migrations introduced breaking changes:

# 1. Identify last good Neon snapshot
neon branches list  # Find last stable branch
neon branch restore-from-snapshot <branch-id> <snapshot-id>

# 2. Point production DATABASE_URL to restored branch
# Update in Cloudflare secrets

# 3. Redeploy worker
wrangler deploy --env production

# 4. Verify connectivity
npm run db:migrate:status --env production
```

---

## 5. Monitoring & Alerts

### 5.1 Key Metrics to Watch (First 24h)

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Error Rate (5xx) | < 0.1% | > 0.5% |
| Latency (p95) | < 500ms | > 1000ms |
| Database Connections | < 80% pool | > 90% |
| Razorpay Webhook Latency | < 100ms | > 500ms |
| Auth Success Rate | > 99.5% | < 99% |
| Listing Page Load | < 300ms | > 800ms |

### 5.2 Sentry Setup

```typescript
// app/instrumentation.ts (already wired for Phase 1)
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  beforeSend(event) {
    // Don't send test user errors
    if (event.user?.email?.includes("@test.")) return null;
    return event;
  },
});
```

**Alert rules (configure in Sentry):**
- Error rate spike (5+ errors in 5 min)
- Unhandled exception in auth flow
- Database connection pool exhausted
- Razorpay webhook failures

### 5.3 Cloudflare Analytics

Dashboard should show:
- Requests per second (should be stable post-deployment)
- Error ratio (should be 0 or very close)
- Response time distribution (p95 < 500ms)
- Cache hit rate (>80% for static assets)

### 5.4 Custom Logging

Add key events to logs:

```typescript
// lib/logger.ts
export function logDeployment(event: string, data: any) {
  const timestamp = new Date().toISOString();
  const logEntry = JSON.stringify({ timestamp, event, ...data });
  
  // Send to: Cloudflare Logs, Sentry, or centralized logging
  console.log(logEntry);
  
  if (process.env.NODE_ENV === "production") {
    // Send to external service
    fetch("https://logs.example.com/events", {
      method: "POST",
      body: logEntry,
    });
  }
}

// Use in critical flows:
logDeployment("enquiry_submitted", {
  enquiryId,
  listingId,
  dealerId,
});

logDeployment("payment_webhook_received", {
  razorpayEventId,
  kind: "BOOST",
  status: "SUCCEEDED",
});
```

---

## 6. Post-Launch (Days 2–7)

### 6.1 Daily Checks

| Day | Check | Owner |
|-----|-------|-------|
| Day 2 | Error rate trending? Any new issues? | On-call |
| Day 3 | Database performance stable? | DB owner |
| Day 4 | User feedback negative? Fix critical bugs. | Product |
| Day 5 | Razorpay webhook success rate 99%+? | Payments owner |
| Day 6 | Load patterns normal? No anomalies? | DevOps |
| Day 7 | Incident post-mortem (if any) | Tech lead |

### 6.2 Performance Optimization (Post-Launch)

Once stable, optimize based on real data:

```bash
# 1. Analyze slow endpoints
wrangler tail --env production --filter "duration > 1000"
# Find slow queries, optimize Prisma queries

# 2. Check cache hit rates
# Increase TTL on static assets
# Add response caching headers for /api/listings

# 3. Monitor database slow queries
# Neon console → Slow queries tab
# Add missing indexes if needed

# 4. Bundle size check
npm run build -- --analyze
# Ensure no unexpected bloat
```

### 6.3 Team Retrospective (Day 7)

**Questions to discuss:**
- What went well?
- What could be better?
- Any incidents? Root cause?
- Update runbooks and deployment process
- Plan improvements for next deployment

---

## 7. Deployment Runbook (Quick Reference)

### Pre-Deployment (T-0:30)

```bash
# 1. Final code review
git log --oneline staging..main | head -10
# Verify all changes are reviewed

# 2. Build check
npm run build
npm run cf:build
# Should complete without errors

# 3. Run all tests
npm run test && npm run test:e2e
# All tests must pass

# 4. Check env vars
wrangler secret list --env production
# Verify all secrets are set
```

### Deployment (T-0:00)

```bash
# 1. Create Git tag
git tag -a "v1.0.0-prod" -m "Production release - 2026-05-30"
git push origin v1.0.0-prod

# 2. Deploy to canary (10%)
wrangler deploy --env production-canary
echo "⏳ Canary live. Monitoring for 2 hours..."

# 3. Monitor canary
npm run monitor:canary  # Custom script to check error rates
# Watch Sentry dashboard
# Manual testing in staging

# 4. If canary passes, full rollout
wrangler deploy --env production
echo "✅ Production deployed"

# 5. Post-deployment checks
curl https://wheewise.com/api/health
npm run smoke-test:prod
```

### Post-Deployment (T+24h)

```bash
# Daily health check
./scripts/health-check.sh

# If issue detected:
./scripts/rollback.sh  # Rolls back to previous tag
```

---

## 8. Checklist

### Pre-Staging
- [ ] All 136 unit tests pass
- [ ] TypeScript strict mode passes
- [ ] ESLint and Prettier pass
- [ ] Security audit completed (no backdoors, valid inputs)
- [ ] Integration tests written and passing

### Pre-Canary
- [ ] Staging deployed and running 24h without issues
- [ ] E2E tests pass
- [ ] Load test passes (95p < 500ms)
- [ ] Smoke tests pass
- [ ] Team sign-off obtained
- [ ] Runbook reviewed and updated
- [ ] On-call rotation ready
- [ ] Database backup taken

### Pre-Full-Rollout
- [ ] Canary live for 2+ hours, error rate < 0.1%
- [ ] Manual testing completed
- [ ] No critical issues in canary
- [ ] Product sign-off for full rollout

### Post-Deployment
- [ ] Health check passes
- [ ] Error rate monitoring active
- [ ] Customer support briefed
- [ ] Status page updated
- [ ] First 24h checks completed
- [ ] Weekly retrospective scheduled

---

## 9. Appendix: Scripts

### health-check.sh
```bash
#!/bin/bash
set -e

echo "🏥 Health Check — $(date)"

# 1. API health
HEALTH=$(curl -s https://wheewise.com/api/health)
if [[ $HEALTH == *"ok"* ]]; then
  echo "✅ API healthy"
else
  echo "❌ API unhealthy: $HEALTH"
  exit 1
fi

# 2. Database connectivity
DB_CHECK=$(curl -s -X POST https://wheewise.com/api/db-check)
if [[ $DB_CHECK == *"connected"* ]]; then
  echo "✅ Database connected"
else
  echo "❌ Database issue: $DB_CHECK"
  exit 1
fi

# 3. Razorpay connectivity
RAZORPAY_CHECK=$(curl -s https://wheewise.com/api/payment-health)
if [[ $RAZORPAY_CHECK == *"ok"* ]]; then
  echo "✅ Razorpay health ok"
else
  echo "❌ Razorpay issue: $RAZORPAY_CHECK"
  exit 1
fi

echo "✅ All systems green"
```

### rollback.sh
```bash
#!/bin/bash
set -e

echo "⏮️  Rolling back to previous version..."

# 1. Get previous deployment tag
CURRENT=$(git describe --tags --abbrev=0)
PREVIOUS=$(git describe --tags --abbrev=0 --exclude="$CURRENT")

echo "Rolling back from $CURRENT → $PREVIOUS"

# 2. Deploy previous version
git checkout $PREVIOUS
npm run cf:build
wrangler deploy --env production

# 3. Verify
curl https://wheewise.com/api/health

echo "✅ Rollback complete"
```

---

**Document Status:** Ready for team review  
**Next Step:** Test deployment to staging environment  
**Questions?** Reach out to the engineering team
