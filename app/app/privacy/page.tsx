import type { Metadata } from "next";
import Link from "next/link";
import { appUrl } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Wheewise collects, uses, and protects your personal information under India's Digital Personal Data Protection Act.",
  alternates: { canonical: appUrl("/privacy") },
};

const LAST_UPDATED = "29 May 2026";

export default function PrivacyPolicy() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← Back to home
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-zinc mt-8 max-w-none space-y-6 text-sm leading-relaxed sm:text-base">
        <p>
          Wheewise (operated by the team contactable at{" "}
          <a className="text-brand-red" href="mailto:wheewise@gmail.com">
            wheewise@gmail.com
          </a>
          ) is a marketplace connecting buyers of pre-owned vehicles with verified
          dealers. This policy explains what we collect, why, how long we keep it, and how
          you can exercise the rights guaranteed to you under India&apos;s Digital
          Personal Data Protection Act, 2023 (DPDP Act).
        </p>

        <Section title="1. Data we collect">
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <b>Account data:</b> name, email, mobile number (via OTP), hashed password
              (for email/password accounts).
            </li>
            <li>
              <b>Dealer data:</b> business name, GSTIN, city, contact numbers, storefront
              branding (logo, banner, bio), bank-payout reference.
            </li>
            <li>
              <b>Listings &amp; transactions:</b> vehicle details you upload, photos,
              enquiries received, payments processed via Razorpay.
            </li>
            <li>
              <b>Communications:</b> messages exchanged in our chat, lead form submissions
              you make to dealers.
            </li>
            <li>
              <b>Technical data:</b> a long-lived <code>visitor_id</code> cookie to
              deduplicate listing views; the standard session cookie set by our
              authentication provider; basic request logs (IP, user-agent) held for
              security and abuse prevention.
            </li>
          </ul>
        </Section>

        <Section title="2. How we use your data">
          <ul className="list-disc space-y-1 pl-6">
            <li>
              To run the marketplace: surface listings, route leads, process payments.
            </li>
            <li>To verify dealer authenticity (GST lookup, RTO checks).</li>
            <li>
              To enforce safety rules (rate limiting, content moderation, fraud
              detection).
            </li>
            <li>To communicate operationally about your account, leads, and payments.</li>
            <li>To improve search ranking, recommendations, and product quality.</li>
          </ul>
          <p>
            We do not sell your personal data. We do not run third-party advertising
            trackers. We do not profile you for purposes beyond running this service.
          </p>
        </Section>

        <Section title="3. Third parties we share with">
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <b>Razorpay</b> — payment processing for boost purchases and subscriptions.
              Razorpay receives the order amount, your phone, and card details you enter
              on their hosted checkout.
            </li>
            <li>
              <b>Resend</b> — transactional email delivery (lead notifications, account
              emails).
            </li>
            <li>
              <b>SMS provider</b> (MSG91 or Twilio, where configured) — OTP delivery and
              lead alerts to dealers.
            </li>
            <li>
              <b>Cloudflare</b> — hosting, edge cache, DDoS protection. Cloudflare sees
              request metadata but not application-level personal data.
            </li>
            <li>
              <b>Neon</b> — managed PostgreSQL hosting for our database.
            </li>
            <li>
              <b>KYC providers</b> (Surepass, where configured) — GSTIN and vehicle
              registration verification.
            </li>
          </ul>
        </Section>

        <Section title="4. Retention">
          <p>
            Account and listing data are retained while your account is active. On
            deletion request we remove personal identifiers within 30 days; transactional
            records (payments, invoices) are retained for the statutory period required by
            Indian tax and accounting law (currently 8 years). Server logs are kept for 90
            days.
          </p>
        </Section>

        <Section title="5. Your rights">
          <p>Under the DPDP Act you have the right to:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Access the personal data we hold about you.</li>
            <li>Correct inaccurate information.</li>
            <li>Erase your account and associated personal identifiers.</li>
            <li>Withdraw consent for processing (this may limit service usability).</li>
            <li>Nominate someone to act on your behalf in the event of incapacity.</li>
            <li>
              Lodge a grievance with our grievance officer (contact below) and, if
              unresolved, with the Data Protection Board of India.
            </li>
          </ul>
        </Section>

        <Section title="6. Cookies">
          <p>We use only the cookies strictly necessary to run the service:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <code>visitor_id</code> — a randomly-generated identifier that prevents the
              same person from inflating a listing&apos;s view count. HttpOnly,
              SameSite=Lax, expires after 1 year. Not shared with third parties.
            </li>
            <li>
              <code>next-auth.session-token</code> (and related variants) — set when you
              sign in to keep you logged in.
            </li>
            <li>
              <code>wheewise.cookie-consent</code> — records that you&apos;ve acknowledged
              this notice so we don&apos;t show the banner again.
            </li>
          </ul>
        </Section>

        <Section title="7. Security">
          <p>
            Passwords are stored as bcrypt hashes (cost factor 12). API keys are stored as
            SHA-256 hashes — plaintext is shown to you exactly once at creation. All
            traffic is HTTPS-only. Payments are HMAC-verified at both the order-callback
            and webhook layers with replay protection.
          </p>
        </Section>

        <Section title="8. Contact &amp; grievance">
          <p>
            Email{" "}
            <a className="text-brand-red" href="mailto:wheewise@gmail.com">
              wheewise@gmail.com
            </a>{" "}
            for any privacy question. We aim to respond within 7 business days. The same
            address serves as the contact for our grievance officer under the DPDP Act.
          </p>
        </Section>

        <Section title="9. Changes">
          <p>
            We&apos;ll post any material changes here and update the &quot;last
            updated&quot; date. Significant changes will also be emailed to active
            accounts.
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-2 text-zinc-700 dark:text-zinc-300">{children}</div>
    </section>
  );
}
