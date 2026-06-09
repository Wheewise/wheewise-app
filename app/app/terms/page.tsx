import type { Metadata } from "next";
import Link from "next/link";
import { appUrl } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Wheewise.",
  alternates: { canonical: appUrl("/terms") },
};

const LAST_UPDATED = "29 May 2026";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← Back to home
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-zinc mt-8 max-w-none space-y-6 text-sm leading-relaxed sm:text-base">
        <p>
          By accessing Wheewise you agree to these terms. If you don&apos;t agree,
          don&apos;t use the service.
        </p>

        <Section title="1. The service">
          <p>
            Wheewise is an India-focused online marketplace where authorised vehicle
            dealers list pre-owned cars and bikes for buyers to discover, enquire about,
            and finance. Wheewise is <strong>not</strong> a party to any sale. We do not
            own, inspect, sell, or take title to any vehicle listed on the platform.
          </p>
        </Section>

        <Section title="2. Accounts">
          <ul className="list-disc space-y-1 pl-6">
            <li>You must be 18+ to register.</li>
            <li>Provide accurate information and keep it current.</li>
            <li>
              You&apos;re responsible for everything done with your account; keep your
              password and any API keys safe.
            </li>
            <li>
              Dealers must use the service in the name of the business actually licensed
              to sell the vehicles listed.
            </li>
          </ul>
        </Section>

        <Section title="3. Dealer obligations">
          <ul className="list-disc space-y-1 pl-6">
            <li>Only list vehicles you own or are authorised to sell.</li>
            <li>
              Listing information (year, ownership, accident history, asking price) must
              be truthful.
            </li>
            <li>
              Honour the price posted, subject to good-faith negotiation. Bait-and-switch
              will result in suspension.
            </li>
            <li>Comply with applicable RTO transfer, insurance, and GST rules.</li>
            <li>
              Don&apos;t game search ranking with duplicate listings or fake inspections.
            </li>
          </ul>
        </Section>

        <Section title="4. Buyer obligations">
          <ul className="list-disc space-y-1 pl-6">
            <li>
              Use enquiries and chat for genuine purchase intent. Spam, harassment, or
              scams will lock your account.
            </li>
            <li>
              Verify documents (RC, insurance, PUC) directly with the dealer before any
              payment.
            </li>
            <li>
              Loan applications you submit are forwarded to the NBFC you select; Wheewise
              does not approve, underwrite, or guarantee any loan.
            </li>
          </ul>
        </Section>

        <Section title="5. Prohibited content">
          <p>
            You may not post or transmit content that is illegal, infringes intellectual
            property, contains personal data of others without consent, promotes hate,
            contains malware, or that intentionally misleads. Community posts are
            moderated; we may remove anything that violates this clause.
          </p>
        </Section>

        <Section title="6. Payments &amp; refunds">
          <p>
            Listing boosts and dealer subscriptions are payable in advance via Razorpay.
            Boost durations begin at successful payment confirmation and are
            non-refundable except where required by law. Subscription cancellation takes
            effect at the end of the current billing period.
          </p>
        </Section>

        <Section title="7. Marketplace disclaimer">
          <p>
            Wheewise provides the platform &quot;as is&quot;. We make no representations
            about the condition, ownership, fitness, or roadworthiness of any listed
            vehicle. Any sale is a direct transaction between buyer and dealer, governed
            by Indian contract law and the Motor Vehicles Act. We do not arbitrate
            disputes between buyers and dealers; we may suspend accounts demonstrably
            acting in bad faith.
          </p>
        </Section>

        <Section title="8. Intellectual property">
          <p>
            The Wheewise name, logo, code, and marketplace design are ours. Content you
            upload (listings, photos, posts) remains yours; you grant us a non-exclusive
            licence to host, display, and reformat it solely to operate the service.
          </p>
        </Section>

        <Section title="9. Limitation of liability">
          <p>
            To the maximum extent permitted by law, Wheewise&apos;s aggregate liability
            for any claim is limited to the fees you paid us in the 12 months preceding
            the event giving rise to the claim. We are not liable for indirect,
            consequential, or lost-profit damages.
          </p>
        </Section>

        <Section title="10. Termination">
          <p>
            You may close your account anytime via the dashboard or by emailing us. We may
            suspend or terminate accounts for material breach of these terms, with notice
            except where immediate suspension is necessary to protect the platform or
            other users.
          </p>
        </Section>

        <Section title="11. Governing law">
          <p>
            These terms are governed by the laws of India. Disputes will be subject to the
            exclusive jurisdiction of the courts in Bengaluru, Karnataka.
          </p>
        </Section>

        <Section title="12. Changes">
          <p>
            We may update these terms; material changes will be emailed to active
            accounts. Continued use after an update means acceptance of the new terms.
          </p>
        </Section>

        <Section title="13. Contact">
          <p>
            Email{" "}
            <a className="text-brand-red" href="mailto:wheewise@gmail.com">
              wheewise@gmail.com
            </a>{" "}
            for anything not answered above.
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
