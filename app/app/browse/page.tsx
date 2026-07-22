import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { searchListings } from "@/lib/search";
import { VehicleCard } from "@/components/listings/VehicleCard";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Browse pre-owned cars and bikes",
  description:
    "Search verified pre-owned cars and bikes from trusted dealers across India.",
};

type Search = Promise<{
  type?: string;
  q?: string;
  page?: string;
}>;

const PAGE_SIZE = 24;

// The schema's VehicleType enum only has CAR/BIKE today. Scooters/Autos/
// Commercial are shown per the requested design but disabled — there's no
// data to filter to yet, so making them clickable would silently 0-result.
const FILTER_CHIPS = [
  { label: "All", type: undefined, enabled: true },
  { label: "Cars", type: "CAR", enabled: true },
  { label: "Bikes", type: "BIKE", enabled: true },
  { label: "Scooters", type: "SCOOTER", enabled: false },
  { label: "Autos", type: "AUTO", enabled: false },
  { label: "Commercial", type: "COMMERCIAL", enabled: false },
] as const;

export default async function BrowsePage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const session = await auth();
  const isLoggedIn = Boolean(session?.user?.id);

  type SearchResult = Awaited<ReturnType<typeof searchListings>>;
  const emptyResult: SearchResult = {
    data: [],
    meta: { total: 0, page, limit: PAGE_SIZE, totalPages: 0 },
  };

  const result = await searchListings({
    q: sp.q,
    vehicleType: sp.type === "CAR" || sp.type === "BIKE" ? sp.type : undefined,
    page,
    limit: PAGE_SIZE,
  }).catch((err: unknown) => {
    console.error("[browse] searchListings failed:", err);
    return emptyResult;
  });

  const listings = result.data;
  type BrowseListing = (typeof listings)[number];
  const total = result.meta.total;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const qs = new URLSearchParams();
  if (sp.q) qs.set("q", sp.q);
  if (sp.type) qs.set("type", sp.type);

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo variant="wordmark" size={26} href="/" />
          <Link
            href="/signup/dealer"
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Sell on Wheewise
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Browse {total} vehicle{total === 1 ? "" : "s"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">From verified dealers across India.</p>

        <form method="get" className="mt-6">
          {sp.type ? <input type="hidden" name="type" value={sp.type} /> : null}
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search by make, model or location"
            className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-red-600/50 focus:ring-2 focus:ring-red-600/20"
          />
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {FILTER_CHIPS.map((chip) => {
            const active = (sp.type ?? undefined) === chip.type;
            if (!chip.enabled) {
              return (
                <span
                  key={chip.label}
                  title="Coming soon"
                  className="cursor-not-allowed rounded-full border border-zinc-800 px-4 py-1.5 text-sm text-zinc-600"
                >
                  {chip.label}
                </span>
              );
            }
            const params = new URLSearchParams();
            if (sp.q) params.set("q", sp.q);
            if (chip.type) params.set("type", chip.type);
            return (
              <Link
                key={chip.label}
                href={`/browse${params.toString() ? `?${params.toString()}` : ""}`}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-red-600 bg-red-600/10 text-red-500"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                }`}
              >
                {chip.label}
              </Link>
            );
          })}
        </div>

        <section className="py-8">
          {listings.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg text-zinc-400">No vehicles listed yet.</p>
              <p className="mt-2 text-sm text-zinc-500">Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {listings.map((l: BrowseListing) => (
                <VehicleCard
                  key={l.id}
                  id={l.id}
                  make={l.make}
                  model={l.model}
                  year={l.year}
                  price={Number(l.askingPrice)}
                  fuelType={l.fuelType}
                  odometer={l.odometerKm}
                  primaryPhoto={l.photos[0]?.url}
                  dealerName={l.dealer.businessName}
                  city={l.city}
                  isLoggedIn={isLoggedIn}
                />
              ))}
            </div>
          )}
        </section>

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-2 pb-10 text-sm">
            {page > 1 ? <PageLink qs={qs} page={page - 1} label="← Previous" /> : null}
            <span className="text-zinc-500">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <PageLink qs={qs} page={page + 1} label="Next →" />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PageLink({
  qs,
  page,
  label,
}: {
  qs: URLSearchParams;
  page: number;
  label: string;
}) {
  const params = new URLSearchParams(qs);
  params.set("page", String(page));
  return (
    <Link
      href={`/browse?${params.toString()}`}
      className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800"
    >
      {label}
    </Link>
  );
}
