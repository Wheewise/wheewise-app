import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { searchListings, getDistinctCities, type SortOption } from "@/lib/search";
import { VehicleCard } from "@/components/listings/VehicleCard";
import { Logo } from "@/components/brand/Logo";
import { BrowseControls } from "@/components/browse/BrowseControls";

export const metadata: Metadata = {
  title: "Browse pre-owned cars and bikes",
  description:
    "Search verified pre-owned cars and bikes from trusted dealers across India.",
};

type Search = Promise<{
  search?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  yearMin?: string;
  yearMax?: string;
  fuel?: string;
  condition?: string;
  city?: string;
  sort?: string;
  page?: string;
  welcome?: string;
}>;

const PAGE_SIZE = 24;
const SORT_VALUES = new Set<string>(["newest", "price_asc", "price_desc", "year_desc"]);
const EARLIEST_YEAR = 2000;

function parseIntParam(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

export default async function BrowsePage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const session = await auth();
  const isLoggedIn = Boolean(session?.user?.id);
  const isBuyer = isLoggedIn && session?.user?.role === "BUYER";
  const isAdmin =
    session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const showWelcomeBanner = sp.welcome === "1";

  const buyerStats =
    isBuyer && session?.user?.id
      ? await Promise.all([
          prisma.savedListing.count({ where: { userId: session.user.id } }),
          prisma.enquiry.count({ where: { buyerId: session.user.id } }),
        ]).then(([savedCount, enquiryCount]) => ({ savedCount, enquiryCount }))
      : null;

  type SearchResult = Awaited<ReturnType<typeof searchListings>>;
  const emptyResult: SearchResult = {
    data: [],
    meta: { total: 0, page, limit: PAGE_SIZE, totalPages: 0 },
  };

  const sort: SortOption = SORT_VALUES.has(sp.sort ?? "") ? (sp.sort as SortOption) : "newest";

  const [result, cities] = await Promise.all([
    searchListings({
      q: sp.search,
      vehicleType: sp.type === "CAR" || sp.type === "BIKE" ? sp.type : undefined,
      minPrice: parseIntParam(sp.minPrice),
      maxPrice: parseIntParam(sp.maxPrice),
      yearMin: parseIntParam(sp.yearMin),
      yearMax: parseIntParam(sp.yearMax),
      fuelTypes: sp.fuel ? sp.fuel.split(",").filter(Boolean) : undefined,
      conditions: sp.condition ? sp.condition.split(",").filter(Boolean) : undefined,
      city: sp.city,
      sort,
      page,
      limit: PAGE_SIZE,
    }).catch((err: unknown) => {
      console.error("[browse] searchListings failed:", err);
      return emptyResult;
    }),
    getDistinctCities().catch((err: unknown) => {
      console.error("[browse] getDistinctCities failed:", err);
      return [] as string[];
    }),
  ]);

  const listings = result.data;
  type BrowseListing = (typeof listings)[number];
  const total = result.meta.total;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: currentYear - EARLIEST_YEAR + 1 },
    (_, i) => currentYear - i,
  );

  const qs = new URLSearchParams();
  if (sp.search) qs.set("search", sp.search);
  if (sp.type) qs.set("type", sp.type);
  if (sp.minPrice) qs.set("minPrice", sp.minPrice);
  if (sp.maxPrice) qs.set("maxPrice", sp.maxPrice);
  if (sp.yearMin) qs.set("yearMin", sp.yearMin);
  if (sp.yearMax) qs.set("yearMax", sp.yearMax);
  if (sp.fuel) qs.set("fuel", sp.fuel);
  if (sp.condition) qs.set("condition", sp.condition);
  if (sp.city) qs.set("city", sp.city);
  if (sp.sort) qs.set("sort", sp.sort);

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo variant="wordmark" size={26} href="/" />
          <div className="flex items-center gap-4">
            {isAdmin ? (
              <Link href="/admin" className="text-sm font-medium text-[#E8192C]">
                Admin
              </Link>
            ) : null}
            {isBuyer ? (
              <Link
                href="/profile"
                className="text-sm font-medium text-zinc-300 hover:text-white"
              >
                My Profile
              </Link>
            ) : (
              <Link
                href="/signup/dealer"
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Sell on Wheewise
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {showWelcomeBanner ? (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-600/20 bg-red-600/10 p-4">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold text-white">Welcome to Wheewise!</p>
              <p className="text-sm text-zinc-400">
                Start browsing pre-owned vehicles.
              </p>
            </div>
          </div>
        ) : null}

        {isBuyer ? (
          <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="font-semibold text-white">
              Welcome back, {session?.user?.name ?? "there"}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-400">
              <span>
                <span className="font-semibold text-white">
                  {buyerStats?.savedCount ?? 0}
                </span>{" "}
                vehicles saved to wishlist
              </span>
              <span>
                <span className="font-semibold text-white">
                  {buyerStats?.enquiryCount ?? 0}
                </span>{" "}
                enquiries sent
              </span>
            </div>
          </div>
        ) : null}

        <h1 className="text-2xl font-bold tracking-tight text-white">
          Browse pre-owned vehicles
        </h1>
        <p className="mt-1 text-sm text-zinc-500">From verified dealers across India.</p>

        <BrowseControls cities={cities} yearOptions={yearOptions} total={total}>
          {listings.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg text-zinc-400">No vehicles found.</p>
              <p className="mt-2 text-sm text-zinc-500">
                Try a different search or adjust your filters.
              </p>
            </div>
          ) : (
            <>
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

              {totalPages > 1 ? (
                <div className="flex items-center justify-center gap-2 pt-8 text-sm">
                  {page > 1 ? <PageLink qs={qs} page={page - 1} label="← Previous" /> : null}
                  <span className="text-zinc-500">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages ? (
                    <PageLink qs={qs} page={page + 1} label="Next →" />
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </BrowseControls>
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
