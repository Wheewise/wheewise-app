import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireDealer } from "@/lib/dealer";
import { updateListing } from "@/lib/actions/listings";
import { ListingForm } from "@/components/listings/ListingForm";
import { ListingActions } from "./ListingActions";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { dealer } = await requireDealer();

  const listing = await prisma.listing.findFirst({
    where: { id, dealerId: dealer.id },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
  if (!listing) notFound();

  const action = updateListing.bind(null, listing.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/inventory"
            className="text-sm text-zinc-500 hover:text-foreground"
          >
            ← Back to inventory
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            {listing.year} {listing.make} {listing.model}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {listing.viewCount} views · {listing.enquiryCount} enquiries
          </p>
        </div>
        <ListingActions listingId={listing.id} status={listing.status} />
      </div>

      <div className="rounded-lg border border-border-default bg-background p-6">
        <ListingForm
          action={action}
          defaults={{
            vehicleType: listing.vehicleType,
            make: listing.make,
            model: listing.model,
            year: listing.year,
            fuelType: listing.fuelType,
            transmission: listing.transmission,
            odometerKm: listing.odometerKm,
            askingPrice: Number(listing.askingPrice),
            description: listing.description,
            city: listing.city,
            photoUrls: listing.photos.map((p) => p.url),
          }}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
