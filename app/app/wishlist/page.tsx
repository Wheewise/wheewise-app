import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { SaveButton } from "@/components/vehicle/SaveButton";

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const saved = await prisma.savedListing.findMany({
    where: { userId: session.user.id },
    include: {
      listing: {
        include: {
          photos: { take: 1, orderBy: { sortOrder: "asc" } },
          dealer: { select: { businessName: true, city: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-surface-muted min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/" className="hover:text-foreground text-sm text-zinc-500">
          ← Back
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Wishlist</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Vehicles you&apos;ve saved for later.
        </p>

        {saved.length === 0 ? (
          <div className="border-border-default bg-background mt-6 rounded-lg border p-12 text-center">
            <div className="text-4xl">♡</div>
            <p className="mt-2 text-sm text-zinc-500">No saved vehicles yet.</p>
            <Link
              href="/browse"
              className="text-brand-red mt-2 inline-block text-sm font-medium hover:underline"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {saved.map((entry) => {
              const l = entry.listing;
              return (
                <li
                  key={entry.id}
                  className="border-border-default bg-background rounded-lg border p-4"
                >
                  {l.photos[0] ? (
                    <img
                      src={l.photos[0].url}
                      alt={`${l.year} ${l.make} ${l.model}`}
                      className="aspect-[16/10] w-full rounded-md object-cover"
                    />
                  ) : (
                    <div className="bg-surface-muted flex aspect-[16/10] w-full items-center justify-center rounded-md text-sm text-zinc-400">
                      No photo
                    </div>
                  )}
                  <div className="mt-3">
                    <Link
                      href={`/vehicle/${l.id}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {l.year} {l.make} {l.model}
                    </Link>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      {l.dealer.businessName} · {l.dealer.city}
                    </div>
                    <div className="text-brand-red mt-1 text-lg font-bold">
                      {formatINR(Number(l.askingPrice))}
                    </div>
                  </div>
                  <div className="mt-3">
                    <SaveButton listingId={l.id} initialSaved />
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
