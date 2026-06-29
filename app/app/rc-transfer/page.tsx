import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "RC Transfer Guide — Wheewise",
  description:
    "Step-by-step RC transfer process, required documents, and fees for used vehicle registration in India.",
};

const STEPS = [
  {
    title: "Obtain Form 29 & Form 30",
    desc: "The seller must fill and sign Form 29 (notice of transfer) and Form 30 (report of transfer). Both forms are available at the RTO or can be downloaded from Parivahan.",
  },
  {
    title: "Collect documents from seller",
    desc: "You need: original RC book/card, valid insurance policy, PUC certificate, seller's signed Form 28 (NOC) if the vehicle is from another state, and a notarized sale agreement or delivery note.",
  },
  {
    title: "Pay applicable road tax",
    desc: "If the vehicle is brought from another state, you must pay lifetime road tax in your state within 30 days. Rates vary by state and vehicle age. Keep the tax receipt.",
  },
  {
    title: "Submit application at RTO",
    desc: "Visit the RTO where you want to register the vehicle. Submit Forms 29, 30, original RC, insurance, PUC, address proof, ID proof, passport-size photos, and tax receipt.",
  },
  {
    title: "Vehicle inspection",
    desc: "The RTO inspector will verify the chassis number, engine number, and overall condition. Ensure the numbers match the RC and are clearly visible.",
  },
  {
    title: "Pay transfer fees",
    desc: "Pay the registration transfer fee and smart card fee at the RTO cash counter. Fees are typically ₹300–₹1,000 depending on vehicle type.",
  },
  {
    title: "Collect new RC",
    desc: "The new RC smart card is usually issued within 30 days. You'll receive an acknowledgement slip that serves as a temporary RC until the card arrives.",
  },
];

const DOCUMENTS = [
  { name: "Form 29 (Notice of Transfer)", who: "Seller" },
  { name: "Form 30 (Report of Transfer)", who: "Seller" },
  { name: "Original RC book / smart card", who: "Seller" },
  { name: "Valid insurance policy", who: "Seller" },
  { name: "PUC certificate", who: "Seller" },
  { name: "Form 28 (NOC) — interstate only", who: "Seller" },
  { name: "Sale agreement / delivery note", who: "Both" },
  { name: "Address proof (Aadhaar, voter ID, passport)", who: "Buyer" },
  { name: "ID proof", who: "Buyer" },
  { name: "Passport-size photographs (3)", who: "Buyer" },
  { name: "Road tax payment receipt", who: "Buyer" },
  { name: "Form 33 (if financing/loan involved)", who: "Buyer" },
];

export default function RcTransferPage() {
  return (
    <div className="bg-surface-muted min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Back to home
        </Link>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          RC Transfer Guide
        </h1>
        <p className="mt-3 text-lg text-zinc-600">
          Everything you need to know about transferring vehicle registration in India —
          documents, fees, and the step-by-step RTO process.
        </p>

        {/* Steps */}
        <section className="mt-10">
          <h2 className="text-xl font-bold">Step-by-step process</h2>
          <div className="mt-4 space-y-4">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="border-border-default bg-background rounded-lg border p-5"
              >
                <div className="flex items-start gap-4">
                  <span className="bg-brand-red flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm text-zinc-600">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Documents checklist */}
        <section className="mt-12">
          <h2 className="text-xl font-bold">Required documents</h2>
          <div className="border-border-default bg-background mt-4 rounded-lg border">
            <div className="grid grid-cols-1 divide-y divide-zinc-100">
              {DOCUMENTS.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-3 text-sm"
                >
                  <span>{doc.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      doc.who === "Seller"
                        ? "bg-amber-100 text-amber-800"
                        : doc.who === "Buyer"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {doc.who}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interstate transfer */}
        <section className="mt-12">
          <h2 className="text-xl font-bold">Interstate transfer</h2>
          <div className="border-border-default bg-background mt-4 rounded-lg border p-5">
            <p className="text-sm text-zinc-600">
              If the vehicle is registered in a different state, you must:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-zinc-600">
              <li>Obtain NOC (Form 28) from the originating RTO</li>
              <li>Pay lifetime road tax in the destination state</li>
              <li>Get a new registration number from the destination RTO</li>
              <li>Re-registration must be completed within 12 months</li>
              <li>You may need to submit a fresh roadworthiness certificate</li>
            </ul>
          </div>
        </section>

        {/* Financing */}
        <section className="mt-12">
          <h2 className="text-xl font-bold">If the vehicle is financed</h2>
          <div className="border-border-default bg-background mt-4 rounded-lg border p-5">
            <p className="text-sm text-zinc-600">
              For vehicles under a loan, additional steps apply:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-zinc-600">
              <li>Obtain Form 35 (NOC from financier) or loan closure letter</li>
              <li>Remove hypothecation from the RC before transfer</li>
              <li>Submit Form 33 if the buyer is also taking a loan for purchase</li>
              <li>The financier must endorse the transfer on Form 29 in Part C</li>
            </ul>
          </div>
        </section>

        {/* Fees */}
        <section className="mt-12">
          <h2 className="text-xl font-bold">Approximate fees</h2>
          <div className="border-border-default bg-background mt-4 overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50">
                  <th className="px-5 py-3 text-left font-semibold">Item</th>
                  <th className="px-5 py-3 text-right font-semibold">Approx. cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="px-5 py-3">RC transfer fee (two-wheeler)</td>
                  <td className="px-5 py-3 text-right">₹150 – ₹300</td>
                </tr>
                <tr>
                  <td className="px-5 py-3">RC transfer fee (four-wheeler)</td>
                  <td className="px-5 py-3 text-right">₹300 – ₹600</td>
                </tr>
                <tr>
                  <td className="px-5 py-3">Smart card fee</td>
                  <td className="px-5 py-3 text-right">₹200</td>
                </tr>
                <tr>
                  <td className="px-5 py-3">Road tax (varies by state &amp; age)</td>
                  <td className="px-5 py-3 text-right">Varies</td>
                </tr>
                <tr>
                  <td className="px-5 py-3">Notary / affidavit charges</td>
                  <td className="px-5 py-3 text-right">₹100 – ₹500</td>
                </tr>
                <tr>
                  <td className="px-5 py-3">RTO agent / facilitation fee</td>
                  <td className="px-5 py-3 text-right">₹1,000 – ₹2,500</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-12 rounded-lg bg-amber-50 p-5 text-sm text-amber-900">
          <strong>Important:</strong> This guide is for informational purposes. RTO
          procedures and fees vary by state. Always verify requirements with your local
          RTO or consult a registered RTO agent. The transfer must be initiated within 14
          days of purchase (30 days for interstate).
        </div>
      </div>
    </div>
  );
}
