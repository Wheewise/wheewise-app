import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = { title: "My Enquiries" };

export default async function MyEnquiriesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fenquiries");
  }

  const enquiries = await prisma.enquiry.findMany({
    where: { buyerId: session.user.id },
    include: {
      listing: {
        select: { id: true, make: true, model: true, year: true },
      },
      dealer: { select: { businessName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo variant="wordmark" size={26} href="/browse" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/profile" className="text-sm text-zinc-500 hover:text-white">
          ← Back to profile
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
          My Enquiries
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enquiries you&apos;ve sent to dealers.
        </p>

        {enquiries.length === 0 ? (
          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
            <p className="text-sm text-zinc-400">No enquiries sent yet.</p>
            <Link
              href="/browse"
              className="mt-2 inline-block text-sm font-medium text-red-500 hover:text-red-400"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {enquiries.map((e) => (
              <li
                key={e.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <Link
                  href={`/vehicle/${e.listing.id}`}
                  className="text-sm font-semibold text-white hover:underline"
                >
                  {e.listing.year} {e.listing.make} {e.listing.model}
                </Link>
                <div className="mt-0.5 text-xs text-zinc-500">
                  {e.dealer.businessName} ·{" "}
                  {e.isContacted ? "Dealer responded" : "Awaiting response"}
                </div>
                {e.message ? (
                  <p className="mt-2 text-sm text-zinc-400">{e.message}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
