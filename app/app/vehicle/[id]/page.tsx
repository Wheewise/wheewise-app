import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatINR, formatNumber } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { EnquiryForm } from "./EnquiryForm";
import { PhotoGallery } from "./PhotoGallery";
import { incrementViewCount } from "./view-actions";

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { dealer: true, photos: { take: 1, orderBy: { sortOrder: "asc" } } },
  });
  if (!listing) return { title: "Vehicle not found" };
  const title = `${listing.year} ${listing.make} ${listing.model} — ${formatINR(Number(listing.askingPrice))}`;
  return {
    title,
    description: listing.description.slice(0, 160),
    openGraph: {
      title,
      description: listing.description.slice(0, 160),
      images: listing.photos[0]?.url ? [listing.photos[0].url] : undefined,
    },
  };
}

export default async function VehiclePage({ params }: { params: Params }) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      dealer: { include: { store: true } },
    },
  });
  if (!listing) notFound();

  await incrementViewCount(listing.id, listing.dealerId);

  const session = await auth();
  const buyerDefaults = session?.user
    ? {
        name: session.user.name ?? "",
        email: session.user.email ?? "",
      }
    : undefined;

  const dealer = listing.dealer;
  const vehicle = `${listing.year} ${listing.make} ${listing.model}`;
  const waLink = whatsappLink(
    dealer.whatsapp || dealer.phone,
    `Hi ${dealer.businessName}, I'm interested in the ${vehicle} listed at ${formatINR(Number(listing.askingPrice))}.`,
  );

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link
          href={dealer.store ? `/s/${dealer.store.slug}` : "/"}
          className="text-sm text-zinc-500 hover:text-foreground"
        >
          ← Back to {dealer.businessName}
        </Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PhotoGallery photos={listing.photos.map((p) => p.url)} />

            <div className="mt-6 rounded-lg border border-border-default bg-background p-6">
              <h1 className="text-2xl font-bold tracking-tight">{vehicle}</h1>
              <div className="mt-1 text-sm text-zinc-500">
                {formatNumber(listing.odometerKm)} km · {listing.city}
              </div>
              <div className="mt-3 text-3xl font-bold text-brand-red">
                {formatINR(Number(listing.askingPrice))}
              </div>
              {listing.status === "SOLD" ? (
                <div className="mt-2 inline-block rounded bg-zinc-200 px-2 py-1 text-xs font-semibold uppercase">
                  Sold
                </div>
              ) : null}

              <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border-default pt-4 text-sm sm:grid-cols-3">
                <Spec label="Year" value={listing.year} />
                <Spec
                  label="Fuel"
                  value={
                    listing.fuelType[0] + listing.fuelType.slice(1).toLowerCase()
                  }
                />
                <Spec
                  label="Transmission"
                  value={
                    listing.transmission
                      ? listing.transmission[0] +
                        listing.transmission.slice(1).toLowerCase()
                      : "—"
                  }
                />
                <Spec label="Odometer" value={`${formatNumber(listing.odometerKm)} km`} />
                <Spec
                  label="Type"
                  value={
                    listing.vehicleType[0] +
                    listing.vehicleType.slice(1).toLowerCase()
                  }
                />
                <Spec label="City" value={listing.city} />
              </dl>

              <div className="mt-6 border-t border-border-default pt-4">
                <h2 className="text-sm font-semibold">Description</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">
                  {listing.description}
                </p>
              </div>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-lg border border-border-default bg-background p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Listed by
              </div>
              <Link
                href={dealer.store ? `/s/${dealer.store.slug}` : "#"}
                className="mt-1 block text-lg font-bold hover:underline"
              >
                {dealer.businessName}
              </Link>
              <div className="text-sm text-zinc-500">{dealer.city}</div>
              <div className="mt-4 grid gap-2">
                {waLink ? (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener"
                    className="rounded-md bg-emerald-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    WhatsApp dealer
                  </a>
                ) : null}
                <a
                  href={`tel:${dealer.phone}`}
                  className="rounded-md bg-brand-red px-3 py-2 text-center text-sm font-semibold text-white hover:bg-brand-red-dark"
                >
                  Call now
                </a>
              </div>
            </div>

            <div className="rounded-lg border border-border-default bg-background p-5">
              <h3 className="text-sm font-semibold">Send an enquiry</h3>
              <p className="mt-1 text-xs text-zinc-500">
                We&apos;ll forward your details to the dealer.
              </p>
              <div className="mt-3">
                <EnquiryForm
                  listingId={listing.id}
                  defaults={buyerDefaults}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}
