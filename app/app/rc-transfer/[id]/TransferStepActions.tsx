"use client";

import { useState, useTransition } from "react";
import { updateTransferStep } from "@/lib/actions/rctransfer";

const REQUIRED_DOCS = [
  "Original RC Book",
  "Insurance Certificate",
  "PUC Certificate",
  "Form 29 (NOC)",
  "Form 30 (Transfer)",
  "ID Proof of Buyer",
];

export function TransferStepActions({
  transferId,
  step,
  isSeller,
  isBuyer,
  sellerAgreed,
  buyerAgreed,
}: {
  transferId: string;
  step: number;
  isSeller: boolean;
  isBuyer: boolean;
  sellerAgreed: boolean;
  buyerAgreed: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(nextStep: number, data: Record<string, boolean>) {
    setError(null);
    startTransition(async () => {
      const result = await updateTransferStep(transferId, nextStep, data);
      if (!result.ok) setError(result.error);
    });
  }

  if (step === 1) {
    return (
      <div>
        <p className="mb-3 text-sm text-zinc-400">
          Both buyer and seller must agree to proceed
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {!sellerAgreed && isSeller ? (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(buyerAgreed ? 2 : 1, { sellerAgreed: true })
              }
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              I Agree (Seller)
            </button>
          ) : sellerAgreed ? (
            <span className="text-sm text-emerald-500">
              ✓ {isSeller ? "You've" : "Seller has"} agreed
            </span>
          ) : null}
          {!buyerAgreed && isBuyer ? (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(sellerAgreed ? 2 : 1, { buyerAgreed: true })
              }
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              I Agree (Buyer)
            </button>
          ) : buyerAgreed ? (
            <span className="text-sm text-emerald-500">
              ✓ {isBuyer ? "You've" : "Buyer has"} agreed
            </span>
          ) : null}
        </div>
        {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        <p className="mb-3 text-sm text-zinc-400">Required documents:</p>
        <ul className="space-y-2 text-sm text-zinc-400">
          {REQUIRED_DOCS.map((doc) => (
            <li key={doc} className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              {doc}
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(3, { docsSubmitted: true })}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Mark Documents Collected
        </button>
        {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
      </div>
    );
  }

  if (step === 3) {
    if (!isSeller) {
      return <p className="text-sm text-zinc-400">Waiting for the seller to submit Form 29 &amp; 30 to the RTO.</p>;
    }
    return (
      <div>
        <p className="mb-3 text-sm text-zinc-400">
          Submit Form 29 &amp; Form 30 along with the collected documents at the RTO.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(4, { rtoPending: true })}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Mark Submitted to RTO
        </button>
        {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
      </div>
    );
  }

  if (step === 4) {
    if (!isSeller) {
      return <p className="text-sm text-zinc-400">The RTO is verifying the submitted documents.</p>;
    }
    return (
      <div>
        <p className="mb-3 text-sm text-zinc-400">
          Once the RTO confirms the transfer is approved, mark it here.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(5, { rtoApproved: true })}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Mark RTO Approved
        </button>
        {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
      </div>
    );
  }

  if (step === 5) {
    if (!isSeller) {
      return <p className="text-sm text-zinc-400">Waiting for the seller to confirm the new RC has arrived.</p>;
    }
    return (
      <div>
        <p className="mb-3 text-sm text-zinc-400">
          Once the new RC in the buyer&apos;s name has been issued, mark this transfer complete.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(5, { transferComplete: true })}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Mark Transfer Complete
        </button>
        {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
      </div>
    );
  }

  return null;
}
