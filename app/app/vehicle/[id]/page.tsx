import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatINR, formatNumber } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { EnquiryForm } from "./EnquiryForm";
import { PhotoViewer } from "./PhotoViewer";
import { EmiCalculator } from "@/components/vehicle/EmiCalculator";
import { SaveButton } from "@/components/vehicle/SaveButton";
import { CompareButton } from "@/components/vehicle/CompareButton";
import { LoanApplyForm } from "@/components/vehicle/LoanApplyForm";
import { ChatWidget } from "@/components/chat/ChatWidget";
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
      photos360: { orderBy: { angle: "asc" } },
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
    <div className="bg-surface-muted min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link
          href={dealer.store ? `/s/${dealer.store.slug}` : "/"}
          className="hover:text-foreground text-sm text-zinc-500"
        >
          ← Back to {dealer.businessName}
        </Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PhotoViewer
              photos={listing.photos.map((p) => p.url)}
              photos360={listing.photos360.map((p) => p.url)}
            />

            <div className="border-border-default bg-background mt-6 rounded-lg border p-6">
              <h1 className="text-2xl font-bold tracking-tight">{vehicle}</h1>
              <div className="mt-1 text-sm text-zinc-500">
                {formatNumber(listing.odometerKm)} km · {listing.city}
              </div>
              <div className="text-brand-red mt-3 text-3xl font-bold">
                {formatINR(Number(listing.askingPrice))}
              </div>
              {listing.status === "SOLD" ? (
                <div className="mt-2 inline-block rounded bg-zinc-200 px-2 py-1 text-xs font-semibold uppercase">
                  Sold
                </div>
              ) : null}

              <dl className="border-border-default mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 text-sm sm:grid-cols-3">
                <Spec label="Year" value={listing.year} />
                <Spec
                  label="Fuel"
                  value={listing.fuelType[0] + listing.fuelType.slice(1).toLowerCase()}
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
                    listing.vehicleType[0] + listing.vehicleType.slice(1).toLowerCase()
                  }
                />
                <Spec label="City" value={listing.city} />
              </dl>

              <div className="border-border-default mt-6 border-t pt-4">
                <h2 className="text-sm font-semibold">Description</h2>
                <p className="mt-2 text-sm whitespace-pre-line text-zinc-700">
                  {listing.description}
                </p>
              </div>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="border-border-default bg-background rounded-lg border p-5">
              <div className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
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
                  className="bg-brand-red hover:bg-brand-red-dark rounded-md px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  Call now
                </a>
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <SaveButton listingId={listing.id} />
                <CompareButton listingId={listing.id} />
              </div>
            </div>

            <div className="border-border-default bg-background rounded-lg border p-5">
              <h3 className="text-sm font-semibold">Send an enquiry</h3>
              <p className="mt-1 text-xs text-zinc-500">
                We&apos;ll forward your details to the dealer.
              </p>
              <div className="mt-3">
                <EnquiryForm listingId={listing.id} defaults={buyerDefaults} />
              </div>
            </div>

            <div className="border-border-default bg-background rounded-lg border p-5">
              <h3 className="text-sm font-semibold">EMI Calculator</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Adjust the sliders to estimate your monthly payment.
              </p>
              <div className="mt-3">
                <EmiCalculator price={Number(listing.askingPrice)} />
              </div>
            </div>

            {listing.status === "ACTIVE" ? (
              <div className="border-border-default bg-background rounded-lg border p-5">
                <LoanApplyForm
                  listingId={listing.id}
                  price={Number(listing.askingPrice)}
                />
              </div>
            ) : null}
          </aside>
        </div>
      </div>
      {session?.user ? (
        <ChatWidget listingId={listing.id} userId={session.user.id} />
      ) : null}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-zinc-500 uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}
