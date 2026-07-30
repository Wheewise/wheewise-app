import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTransferById } from "@/lib/actions/rctransfer";
import { formatINR } from "@/lib/format";
import { Logo } from "@/components/brand/Logo";
import { TransferStepActions } from "./TransferStepActions";

export const metadata: Metadata = { title: "RC Transfer Tracker" };

const STEPS = [
  {
    step: 1,
    title: "Sale Agreement",
    description: "Both parties agree on sale terms",
    icon: "🤝",
    eta: "Immediate",
  },
  {
    step: 2,
    title: "Document Collection",
    description: "RC, Insurance, PUC, Service records",
    icon: "📄",
    eta: "2-3 days",
  },
  {
    step: 3,
    title: "RTO Application",
    description: "Form 29 & 30 submitted to RTO",
    icon: "🏛️",
    eta: "5-7 days",
  },
  {
    step: 4,
    title: "RTO Processing",
    description: "RTO verifying documents",
    icon: "⏳",
    eta: "15-30 days",
  },
  {
    step: 5,
    title: "Transfer Complete",
    description: "New RC issued in buyer's name",
    icon: "✅",
    eta: "Complete!",
  },
] as const;

export default async function RCTransferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/rc-transfer/${id}`)}`);
  }

  const transfer = await getTransferById(id);
  if (!transfer) notFound();

  const isSeller = transfer.sellerId === session.user.id;
  const isBuyer = transfer.buyerId === session.user.id;
  if (!isSeller && !isBuyer) notFound();

  const currentStep = transfer.currentStep;
  const estimatedCompletion = new Date(
    transfer.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000,
  );

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4 sm:px-6">
          <Logo variant="wordmark" size={26} href="/browse" />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link
          href={`/vehicle/${transfer.listing.id}`}
          className="text-sm text-zinc-500 hover:text-white"
        >
          ← Back to vehicle
        </Link>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
          RC Transfer Tracker
        </h1>
        <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-lg font-semibold text-white">{transfer.vehicleName}</p>
              <p className="mt-0.5 text-sm text-zinc-500">
                Reg. no. {transfer.registrationNo} · {formatINR(Number(transfer.saleAmount))}
              </p>
            </div>
            <span className="rounded-full bg-red-600/10 px-3 py-1 text-xs font-semibold text-red-500 uppercase">
              {transfer.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="mt-3 text-sm text-zinc-400">
            Estimated completion:{" "}
            <span className="font-medium text-white">
              {estimatedCompletion.toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {isSeller ? "You are the seller" : "You are the buyer"} on this transfer.
          </p>
        </div>

        <div className="mt-8">
          {STEPS.map((s) => (
            <div key={s.step} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold ${
                    currentStep > s.step
                      ? "bg-green-600 text-white"
                      : currentStep === s.step
                        ? "animate-pulse bg-red-600 text-white"
                        : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {currentStep > s.step ? "✓" : s.icon}
                </div>
                {s.step < 5 ? (
                  <div
                    className={`mt-1 h-16 w-0.5 ${
                      currentStep > s.step ? "bg-green-600" : "bg-zinc-800"
                    }`}
                  />
                ) : null}
              </div>

              <div className="pb-8">
                <h3
                  className={`text-lg font-bold ${
                    currentStep >= s.step ? "text-white" : "text-zinc-500"
                  }`}
                >
                  {s.title}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">{s.description}</p>
                <p className="mt-0.5 text-xs text-zinc-600">Est. {s.eta}</p>

                {currentStep === s.step && transfer.status !== "COMPLETED" ? (
                  <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <TransferStepActions
                      transferId={transfer.id}
                      step={s.step}
                      isSeller={isSeller}
                      isBuyer={isBuyer}
                      sellerAgreed={transfer.sellerAgreed}
                      buyerAgreed={transfer.buyerAgreed}
                    />
                  </div>
                ) : null}
                {s.step === 5 && transfer.status === "COMPLETED" ? (
                  <div className="mt-3 rounded-xl border border-emerald-900/50 bg-emerald-500/10 p-4 text-sm text-emerald-400">
                    Transfer complete — the new RC has been issued in the buyer&apos;s name.
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
