import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ListingCard } from "@/components/storefront/ListingCard";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Browse pre-owned cars and bikes",
  description:
    "Search verified pre-owned cars and bikes from trusted dealers across India.",
};

type Search = Promise<{
  type?: string;
  fuel?: string;
  city?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  minYear?: string;
  page?: string;
}>;

const PAGE_SIZE = 24;

const FUEL_OPTIONS = ["PETROL", "DIESEL", "CNG", "ELECTRIC", "HYBRID"] as const;

export default async function BrowsePage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const minPrice = sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const minYear = sp.minYear ? Number(sp.minYear) : undefined;

  const where = {
    status: "ACTIVE" as const,
    ...(sp.type === "CAR" || sp.type === "BIKE"
      ? { vehicleType: sp.type as "CAR" | "BIKE" }
      : {}),
    ...(sp.fuel && (FUEL_OPTIONS as readonly string[]).includes(sp.fuel)
      ? { fuelType: sp.fuel as (typeof FUEL_OPTIONS)[number] }
      : {}),
    ...(sp.city ? { city: { contains: sp.city, mode: "insensitive" as const } } : {}),
    ...(sp.q
      ? {
          OR: [
            { make: { contains: sp.q, mode: "insensitive" as const } },
            { model: { contains: sp.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          askingPrice: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        }
      : {}),
    ...(minYear !== undefined ? { year: { gte: minYear } } : {}),
  };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        photos: { take: 1, orderBy: { sortOrder: "asc" } },
        inspections: { where: { status: "COMPLETED" }, select: { overallScore: true } },
      },
      orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.listing.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v && k !== "page") qs.set(k, String(v));
  }

  return (
    <div className="bg-surface-muted min-h-screen">
      <header className="border-border-default bg-background border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo variant="wordmark" size={26} href="/" />
          <Link
            href="/signup/dealer"
            className="bg-brand-red hover:bg-brand-red-dark rounded-md px-3 py-1.5 text-sm font-semibold text-white"
          >
            Sell on Wheewise
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Browse {total} vehicle{total === 1 ? "" : "s"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            From verified dealers across India.
          </p>
        </div>

        <form
          method="get"
          className="border-border-default bg-background mt-6 grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Field label="Search">
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Make or model"
              className={inputClass}
            />
          </Field>
          <Field label="City">
            <input
              name="city"
              defaultValue={sp.city ?? ""}
              placeholder="Indore, Pune…"
              className={inputClass}
            />
          </Field>
          <Field label="Type">
            <select name="type" defaultValue={sp.type ?? ""} className={inputClass}>
              <option value="">All</option>
              <option value="CAR">Cars</option>
              <option value="BIKE">Bikes</option>
            </select>
          </Field>
          <Field label="Fuel">
            <select name="fuel" defaultValue={sp.fuel ?? ""} className={inputClass}>
              <option value="">All</option>
              {FUEL_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f[0] + f.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Min price (₹)">
            <input
              name="minPrice"
              type="number"
              min={0}
              defaultValue={sp.minPrice ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Max price (₹)">
            <input
              name="maxPrice"
              type="number"
              min={0}
              defaultValue={sp.maxPrice ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Min year">
            <input
              name="minYear"
              type="number"
              min={1980}
              max={new Date().getFullYear() + 1}
              defaultValue={sp.minYear ?? ""}
              className={inputClass}
            />
          </Field>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="bg-brand-red hover:bg-brand-red-dark flex-1 rounded-md px-4 py-2 text-sm font-semibold text-white"
            >
              Apply filters
            </button>
            <Link
              href="/browse"
              className="border-border-default hover:bg-surface-muted rounded-md border px-3 py-2 text-sm"
            >
              Reset
            </Link>
          </div>
        </form>

        <section className="py-8">
          {listings.length === 0 ? (
            <div className="border-border-default bg-background rounded-lg border border-dashed p-12 text-center text-sm text-zinc-500">
              No vehicles match your filters. Try widening your search.
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
                    isBoosted: l.isBoosted,
                    inspectionScore: l.inspections[0]?.overallScore ?? null,
                  }}
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

const inputClass =
  "block w-full rounded-md border border-border-default bg-background px-3 py-2 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium tracking-wide text-zinc-500 uppercase">
        {label}
      </span>
      <span className="mt-1 block">{children}</span>
    </label>
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
      className="border-border-default bg-background hover:bg-surface-muted rounded-md border px-3 py-1.5"
    >
      {label}
    </Link>
  );
}
