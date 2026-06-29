# Wheewise

Dealer-first marketplace for pre-owned cars and bikes in India. One shareable link = a dealer's complete digital showroom.

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript (strict)
- Tailwind CSS v4
- Prisma + Postgres (Neon)
- NextAuth v5 (Credentials)
- Cloudflare R2 (photo storage)
- Razorpay Subscriptions (monthly/yearly billing)
- Resend (lead emails)

## Getting started

```bash
cp .env.example .env.local       # fill in DATABASE_URL, AUTH_SECRET, etc.
npm install
npx prisma migrate dev           # apply schema
npm run db:seed                  # demo dealer + 6 listings (optional)
npm run dev                      # http://localhost:3000

# Demo dealer login: demo@wheewise.in / demo1234
# Demo storefront:   http://localhost:3000/s/sharma-auto-indore
```

## Project structure

```
app/                  Next.js App Router routes
  (marketing)/        Public landing
  (dealer)/           Auth-gated dealer dashboard
  s/[storeSlug]/      Public dealer storefront — the shareable link
  vehicle/[id]/       Vehicle detail
  api/                Route handlers
lib/                  Shared server + client modules
  auth.ts             NextAuth config
  db.ts               Prisma singleton
  r2.ts               Presigned upload helper
  razorpay.ts         Subscription + webhook helpers
prisma/
  schema.prisma       DB schema
public/brand/         Logo assets
```

See `../WHEEWISE_SDD.md` for the full v2 north-star spec and `../wheewise doc.pdf` for the dealer proposal that scopes v1.

## Deploy to Cloudflare Workers

Wired via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare). Prisma talks to Postgres via the Neon driver adapter, so any Neon database works on Workers.

```bash
# 1. Install Wrangler login (one-time)
npx wrangler login

# 2. Push secrets — paste each value when prompted
npx wrangler secret put DATABASE_URL
npx wrangler secret put AUTH_SECRET
npx wrangler secret put AUTH_URL                # https://wheewise.<your-account>.workers.dev
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_BUCKET
npx wrangler secret put R2_PUBLIC_BASE_URL
npx wrangler secret put RAZORPAY_KEY_ID
npx wrangler secret put RAZORPAY_KEY_SECRET
npx wrangler secret put RAZORPAY_WEBHOOK_SECRET
npx wrangler secret put RAZORPAY_PLAN_MONTHLY
npx wrangler secret put RAZORPAY_PLAN_YEARLY
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_FROM
npx wrangler secret put NEXT_PUBLIC_APP_URL

# 3. Local Workers preview (optional sanity check before deploying)
npm run cf:preview

# 4. Deploy
npm run cf:deploy
```

Run `npx prisma migrate deploy` against the same Neon database before the first deploy so the schema exists in production.
