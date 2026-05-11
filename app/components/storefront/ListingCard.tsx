import Link from "next/link";
import { formatINR, formatNumber } from "@/lib/format";

export type ListingCardData = {
  id: string;
  year: number;
  make: string;
  model: string;
  fuelType: string;
  transmission?: string | null;
  odometerKm: number;
  askingPrice: number;
  city: string;
  status: string;
  coverUrl?: string;
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const sold = listing.status === "SOLD";
  return (
    <Link
      href={`/vehicle/${listing.id}`}
      className="group border-border-default bg-background block overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
    >
      <div className="bg-surface-muted relative aspect-[4/3] overflow-hidden">
        {listing.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.coverUrl}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : null}
        {sold ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="bg-brand-red rounded-md px-3 py-1 text-sm font-bold text-white uppercase">
              Sold
            </span>
          </div>
        ) : null}
      </div>
      <div className="p-4">
        <div className="text-base font-semibold">
          {listing.year} {listing.make} {listing.model}
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          {formatNumber(listing.odometerKm)} km ·{" "}
          {listing.fuelType[0] + listing.fuelType.slice(1).toLowerCase()}
          {listing.transmission
            ? ` · ${listing.transmission[0] + listing.transmission.slice(1).toLowerCase()}`
            : ""}
          {" · "}
          {listing.city}
        </div>
        <div className="text-brand-red mt-3 text-lg font-bold">
          {formatINR(listing.askingPrice)}
        </div>
      </div>
    </Link>
  );
}
