import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ListingCard } from "@/components/storefront/ListingCard";
import { whatsappLink } from "@/lib/whatsapp";

type Params = Promise<{ slug: string }>;
type Search = Promise<{
  type?: string;
  fuel?: string;
  q?: string;
}>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug },
    include: { dealer: true },
  });
  if (!store) return { title: "Showroom not found" };
  const title = `${store.dealer.businessName} — Wheewise showroom`;
  const description =
    store.bio ??
    `Pre-owned vehicles from ${store.dealer.businessName} in ${store.dealer.city}.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: store.bannerUrl ? [store.bannerUrl] : undefined,
    },
  };
}

export default async function StorefrontPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const store = await prisma.store.findUnique({
    where: { slug },
    include: { dealer: true },
  });
  if (!store) notFound();

  const listings = await prisma.listing.findMany({
    where: {
      dealerId: store.dealerId,
      status: { in: ["ACTIVE", "SOLD"] },
      ...(sp.type === "CAR" || sp.type === "BIKE" ? { vehicleType: sp.type } : {}),
      ...(sp.fuel
        ? { fuelType: sp.fuel as "PETROL" | "DIESEL" | "CNG" | "ELECTRIC" | "HYBRID" }
        : {}),
      ...(sp.q
        ? {
            OR: [
              { make: { contains: sp.q, mode: "insensitive" as const } },
              { model: { contains: sp.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: {
      photos: { take: 1, orderBy: { sortOrder: "asc" } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const dealer = store.dealer;
  const waLink = whatsappLink(
    dealer.whatsapp || dealer.phone,
    `Hi ${dealer.businessName}, I'd like to know more about your inventory.`,
  );
  const accent = store.primaryColor;

  return (
    <div className="bg-surface-muted min-h-screen">
      <div
        className="bg-brand-ink relative h-44 w-full overflow-hidden sm:h-64"
        style={{ backgroundColor: store.bannerUrl ? undefined : accent }}
      >
        {store.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.bannerUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/40" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="border-border-default bg-background -mt-12 flex flex-col gap-4 rounded-lg border p-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-4">
            <div className="border-border-default bg-surface-muted h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border">
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-2xl font-bold text-white"
                  style={{ backgroundColor: accent }}
                >
                  {dealer.businessName[0]}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{dealer.businessName}</h1>
              <p className="text-sm text-zinc-500">{dealer.city}</p>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
            {waLink ? (
              <a
                href={waLink}
                target="_blank"
                rel="noopener"
                className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                WhatsApp
              </a>
            ) : null}
            <a
              href={`tel:${dealer.phone}`}
              className="rounded-md px-3 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              Call dealer
            </a>
          </div>
        </header>

        {store.bio ? (
          <p className="border-border-default bg-background mt-4 rounded-lg border p-4 text-sm text-zinc-700">
            {store.bio}
          </p>
        ) : null}

        <form
          method="get"
          className="border-border-default bg-background mt-6 flex flex-wrap items-end gap-3 rounded-lg border p-4"
        >
          <div className="min-w-[180px] flex-1">
            <label className="block text-xs font-medium tracking-wide text-zinc-500 uppercase">
              Search
            </label>
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Make or model"
              className="border-border-default bg-background mt-1 block w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium tracking-wide text-zinc-500 uppercase">
              Type
            </label>
            <select
              name="type"
              defaultValue={sp.type ?? ""}
              className="border-border-default bg-background mt-1 block rounded-md border px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="CAR">Cars</option>
              <option value="BIKE">Bikes</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium tracking-wide text-zinc-500 uppercase">
              Fuel
            </label>
            <select
              name="fuel"
              defaultValue={sp.fuel ?? ""}
              className="border-border-default bg-background mt-1 block rounded-md border px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="CNG">CNG</option>
              <option value="ELECTRIC">Electric</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: accent }}
          >
            Filter
          </button>
        </form>

        <section className="py-8">
          {listings.length === 0 ? (
            <div className="border-border-default bg-background rounded-lg border border-dashed p-10 text-center text-sm text-zinc-500">
              No vehicles match your filters.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={{
                    id: l.id,
                    year: l.year,
                    make: l.make,
                    model: l.model,
                    fuelType: l.fuelType,
                    transmission: l.transmission,
                    odometerKm: l.odometerKm,
                    askingPrice: Number(l.askingPrice),
                    city: l.city,
                    status: l.status,
                    coverUrl: l.photos[0]?.url,
                  }}
                />
              ))}
            </div>
          )}
        </section>

        <footer className="border-border-default border-t py-6 text-center text-xs text-zinc-500">
          Showroom powered by{" "}
          <Link href="/" className="text-brand-red font-semibold">
            Wheewise
          </Link>
        </footer>
      </div>
    </div>
  );
}
