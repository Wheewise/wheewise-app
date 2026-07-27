import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEnquiriesForBuyer } from "@/lib/actions/enquiries";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = { title: "My Enquiries" };

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Awaiting reply", className: "bg-zinc-800 text-zinc-300" },
  REPLIED: { label: "Dealer replied", className: "bg-emerald-500/10 text-emerald-400" },
  CLOSED: { label: "Closed", className: "bg-zinc-800 text-zinc-500" },
};

export default async function MyEnquiriesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fmy-enquiries");
  }

  const enquiries = await getEnquiriesForBuyer();

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
            {enquiries.map((e) => {
              const vehicle = `${e.listing.year} ${e.listing.make} ${e.listing.model}`;
              const badge = STATUS_BADGE[e.status] ?? STATUS_BADGE.OPEN;
              const photo = e.listing.photos[0]?.url;
              return (
                <li key={e.id}>
                  <Link
                    href={`/my-enquiries/${e.id}`}
                    className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700"
                  >
                    {photo ? (
                      <img
                        src={photo}
                        alt={vehicle}
                        className="h-14 w-20 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-14 w-20 shrink-0 rounded-md bg-zinc-800" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white">{vehicle}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-500">
                        {e.dealer.businessName}
                      </div>
                      {e.message ? (
                        <p className="mt-1 truncate text-sm text-zinc-400">{e.message}</p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
