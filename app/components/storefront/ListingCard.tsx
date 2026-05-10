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
      className="group block overflow-hidden rounded-lg border border-border-default bg-background transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
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
            <span className="rounded-md bg-brand-red px-3 py-1 text-sm font-bold uppercase text-white">
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
        <div className="mt-3 text-lg font-bold text-brand-red">
          {formatINR(listing.askingPrice)}
        </div>
      </div>
    </Link>
  );
}
