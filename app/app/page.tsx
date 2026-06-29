import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function Home() {
  return (
    <div className="bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <Challenges />
      <Solution />
      <Showroom />
      <HowItWorks />
      <Pricing />
      <CTA />
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="border-border-default bg-background/90 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo variant="wordmark" size={28} href="/" />
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/browse"
            className="text-foreground hover:text-brand-red text-sm font-medium"
          >
            Browse
          </Link>
          <Link
            href="/login"
            className="text-foreground hover:text-brand-red text-sm font-medium"
          >
            Sign in
          </Link>
          <Link
            href="/signup/dealer"
            className="bg-brand-red hover:bg-brand-red-dark rounded-md px-4 py-2 text-sm font-semibold text-white"
          >
            Join as a dealer
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="bg-brand-ink relative overflow-hidden text-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-3xl">
          <span className="bg-brand-red/20 text-brand-red-soft inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase">
            For India&apos;s pre-owned dealers
          </span>
          <h1 className="mt-6 text-4xl leading-tight font-bold tracking-tight sm:text-6xl">
            Where Smart Wheels Begin.
          </h1>
          <p className="mt-6 text-lg text-zinc-300 sm:text-xl">
            One link. Your entire showroom. Verified buyers. Zero commission. Wheewise
            turns your stock into a digital storefront you can share on WhatsApp in
            seconds.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup/dealer"
              className="bg-brand-red hover:bg-brand-red-dark rounded-md px-6 py-3 text-base font-semibold text-white"
            >
              Start 14-day free trial
            </Link>
            <Link
              href="#pricing"
              className="rounded-md border border-zinc-600 px-6 py-3 text-base font-semibold text-white hover:bg-white/10"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-3 text-sm text-zinc-400">
            No credit card required. Be live in under 5 minutes.
          </p>
        </div>
      </div>
      <div className="bg-brand-red/30 absolute -top-20 -right-20 h-80 w-80 rounded-full blur-3xl" />
    </section>
  );
}

function Challenges() {
  const items = [
    {
      title: "Buyers won\u2019t come to your lot",
      body: "Today\u2019s shoppers research online first. If you\u2019re not visible, you\u2019re not in the running.",
    },
    {
      title: "Listings drown in marketplaces",
      body: "Generic listing sites bury your inventory under thousands of competitors and force commissions.",
    },
    {
      title: "Tyre-kickers waste your day",
      body: "Unfiltered enquiries from people who never planned to buy steal time from real customers.",
    },
  ];
  return (
    <section className="border-border-default bg-surface-muted border-b">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          The challenges dealers face today
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.title}
              className="border-border-default bg-background rounded-lg border p-6"
            >
              <h3 className="text-lg font-semibold">{it.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Solution() {
  const items = [
    "Branded digital showroom — your inventory, your colors, your link.",
    "Verified buyers only — quality leads, not noise.",
    "Smart inventory dashboard — track views, leads, and lead-to-view ratio.",
    "WhatsApp-first — share your storefront in one tap, take enquiries where buyers already are.",
    "Zero commission — flat subscription, you keep 100% of every sale.",
  ];
  return (
    <section className="border-border-default bg-background border-b">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          The Wheewise solution
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-zinc-600">
          Built around how Indian dealers actually sell — fast, mobile, and on WhatsApp.
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {items.map((it) => (
            <li
              key={it}
              className="border-border-default bg-background flex items-start gap-3 rounded-lg border p-4"
            >
              <span className="bg-brand-red mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full" />
              <span className="text-foreground text-sm">{it}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Showroom() {
  return (
    <section className="border-border-default bg-surface-muted border-b">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Your complete digital showroom — in a single shareable link.
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Send <span className="font-mono">wheewise.in/s/your-store</span> on WhatsApp,
            Instagram, or SMS. Buyers see your inventory with photos, prices, and one-tap
            WhatsApp / call buttons.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-zinc-700">
            <li>• Custom URL, logo, banner, and brand color</li>
            <li>• Up to 10 photos per vehicle, drag-to-reorder</li>
            <li>• Filters for car / bike, fuel, price range</li>
            <li>• Mobile-first — looks great on every phone</li>
          </ul>
        </div>
        <div className="border-border-default bg-background relative aspect-[4/5] overflow-hidden rounded-2xl border shadow-xl">
          <div className="bg-brand-red h-32 w-full" />
          <div className="px-5 py-4">
            <div className="border-background bg-brand-ink -mt-12 mb-3 h-16 w-16 rounded-lg border-4" />
            <div className="text-base font-bold">Sharma Auto, Indore</div>
            <div className="text-xs text-zinc-500">12 cars · 4 bikes</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-surface-muted aspect-[4/3] rounded-md" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Sign up", d: "Tell us your business name and city. 60 seconds." },
    {
      n: "02",
      t: "Add your inventory",
      d: "Upload photos, set prices, add specs. Each car takes about 2 minutes.",
    },
    {
      n: "03",
      t: "Brand your storefront",
      d: "Logo, banner, bio, color. Your storefront, not ours.",
    },
    {
      n: "04",
      t: "Share your link",
      d: "Drop your /s/your-store URL on WhatsApp status, Instagram bio, or SMS blasts.",
    },
    {
      n: "05",
      t: "Close deals",
      d: "Verified buyers reach out via WhatsApp, call, or enquiry form. You keep 100%.",
    },
  ];
  return (
    <section id="how" className="border-border-default bg-background border-b">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          How Wheewise works
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-5">
          {steps.map((s) => (
            <li
              key={s.n}
              className="border-border-default bg-surface-muted rounded-lg border p-5"
            >
              <div className="text-brand-red text-sm font-bold">{s.n}</div>
              <div className="mt-2 font-semibold">{s.t}</div>
              <p className="mt-1 text-sm text-zinc-600">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="border-border-default bg-surface-muted border-b">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, flat pricing
          </h2>
          <p className="mt-3 text-lg text-zinc-600">
            One plan, unlimited listings. Zero commission on sales.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
          <div className="border-border-default bg-background rounded-2xl border p-8">
            <div className="text-sm font-semibold tracking-wide text-zinc-500 uppercase">
              Monthly
            </div>
            <div className="mt-2">
              <span className="text-4xl font-bold">₹999</span>
              <span className="ml-2 text-sm text-zinc-500">/ month</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              <li>• Unlimited listings</li>
              <li>• Lead inbox + WhatsApp deep links</li>
              <li>• Custom storefront URL</li>
            </ul>
            <Link
              href="/signup/dealer"
              className="border-border-default hover:bg-surface-muted mt-8 block rounded-md border px-4 py-2.5 text-center text-sm font-semibold"
            >
              Start free trial
            </Link>
          </div>
          <div className="border-brand-red bg-background relative rounded-2xl border-2 p-8 shadow-xl">
            <div className="bg-brand-red absolute -top-3 right-6 rounded-full px-3 py-1 text-xs font-bold text-white uppercase">
              Save 17%
            </div>
            <div className="text-brand-red text-sm font-semibold tracking-wide uppercase">
              Yearly
            </div>
            <div className="mt-2">
              <span className="text-4xl font-bold">₹9,999</span>
              <span className="ml-2 text-sm text-zinc-500">/ year</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              <li>• Everything in Monthly</li>
              <li>• Priority support</li>
              <li>• 2 months free vs monthly</li>
            </ul>
            <Link
              href="/signup/dealer"
              className="bg-brand-red hover:bg-brand-red-dark mt-8 block rounded-md px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-brand-ink text-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to put your showroom in your customers&apos; pockets?
          </h2>
          <p className="mt-3 text-lg text-zinc-300">
            Set up your store in 5 minutes. 14-day free trial. No card required.
          </p>
          <Link
            href="/signup/dealer"
            className="bg-brand-red hover:bg-brand-red-dark mt-8 inline-block rounded-md px-8 py-3 text-base font-semibold"
          >
            Start free trial
          </Link>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-border-default bg-background border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:px-6">
        <div className="flex items-center gap-3">
          <Logo variant="wordmark" size={20} href="/" />
          <span>© {new Date().getFullYear()} Wheewise</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
          <Link href="/signup/dealer" className="hover:text-foreground">
            Join as dealer
          </Link>
        </div>
      </div>
    </footer>
  );
}
