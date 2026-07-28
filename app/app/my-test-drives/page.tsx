import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTestDrivesForBuyer } from "@/lib/actions/testdrive";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = { title: "My Test Drives" };

const STATUS_INFO: Record<string, { label: string; message: string; className: string }> = {
  PENDING: {
    label: "Pending",
    message: "Awaiting confirmation",
    className: "bg-amber-500/10 text-amber-400",
  },
  CONFIRMED: {
    label: "Confirmed",
    message: "Confirmed! Show up on time",
    className: "bg-emerald-500/10 text-emerald-400",
  },
  CANCELLED: {
    label: "Cancelled",
    message: "Cancelled by dealer",
    className: "bg-red-500/10 text-red-400",
  },
  COMPLETED: {
    label: "Completed",
    message: "Test drive done",
    className: "bg-zinc-800 text-zinc-400",
  },
};

export default async function MyTestDrivesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fmy-test-drives");
  }

  const testDrives = await getTestDrivesForBuyer();

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
          My Test Drives
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Test drives you&apos;ve booked.</p>

        {testDrives.length === 0 ? (
          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
            <p className="text-sm text-zinc-400">No test drives booked yet.</p>
            <Link
              href="/browse"
              className="mt-2 inline-block text-sm font-medium text-red-500 hover:text-red-400"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {testDrives.map((t) => {
              const vehicle = `${t.listing.year} ${t.listing.make} ${t.listing.model}`;
              const photo = t.listing.photos[0]?.url;
              const info = STATUS_INFO[t.status] ?? STATUS_INFO.PENDING;
              const when = t.scheduledAt.toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              });
              return (
                <li
                  key={t.id}
                  className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt={vehicle}
                      className="h-16 w-24 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-16 w-24 shrink-0 rounded-md bg-zinc-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/vehicle/${t.listing.id}`}
                        className="text-sm font-semibold text-white hover:underline"
                      >
                        {vehicle}
                      </Link>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${info.className}`}
                      >
                        {info.label}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500">{t.dealer.businessName}</div>
                    <div className="mt-1 text-sm text-zinc-400">{when}</div>
                    <p className="mt-1 text-sm font-medium text-zinc-300">{info.message}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
