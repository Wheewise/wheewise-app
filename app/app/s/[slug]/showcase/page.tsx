import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { whatsappLink } from "@/lib/whatsapp";
import { computeTrustScore } from "@/lib/trust-score";
import { calculateEmi } from "@/lib/emi";
import { appUrl, jsonLdScriptContent } from "@/lib/json-ld";
import { ShowcaseHero } from "@/components/storefront/ShowcaseHero";
import { TrustStrip } from "@/components/storefront/TrustStrip";
import { FeaturedCarousel } from "@/components/storefront/FeaturedCarousel";
import { AboutDealer } from "@/components/storefront/AboutDealer";
import {
  PremiumListingCard,
  type PremiumListingCardData,
} from "@/components/storefront/PremiumListingCard";
import { StorefrontInquiryForm } from "@/components/storefront/StorefrontInquiryForm";
import { StickyContactBar } from "@/components/storefront/StickyContactBar";

type Params = Promise<{ slug: string }>;
type Search = Promise<{
  type?: string;
  fuel?: string;
  q?: string;
  listing?: string;
}>;

const EMI_DEFAULTS = { downPaymentPct: 0.2, annualRate: 9.5, tenureMonths: 60 };

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
    `Pre-owned vehicles from ${store.dealer.businessName} in ${store.dealer.city}, with inspection scores, trust ratings, and instant enquiries.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    alternates: {
      canonical: appUrl(`/s/${store.slug}/showcase`),
    },
  };
}

function emiFromPrice(price: number): number {
  const principal = Math.max(0, Math.round(price * (1 - EMI_DEFAULTS.downPaymentPct)));
  if (principal === 0) return 0;
  return calculateEmi({
    principal,
    annualRate: EMI_DEFAULTS.annualRate,
    tenureMonths: EMI_DEFAULTS.tenureMonths,
  }).monthlyEmi;
}

export default async function ShowcasePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  let store;
  try {
    store = await prisma.store.findUnique({
      where: { slug },
      include: { dealer: true },
    });
  } catch (err) {
    console.error("[showcase] DB unavailable:", err);
    notFound();
  }
  if (!store) notFound();

  const dealer = store.dealer;

  const [
    boostedRaw,
    inventoryRaw,
    activeCount,
    soldCount,
    inspectionAgg,
    activeListingsForForm,
  ] = await Promise.all([
    prisma.listing.findMany({
      where: { dealerId: store.dealerId, status: "ACTIVE", isBoosted: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        photos: { take: 1, orderBy: { sortOrder: "asc" } },
        inspections: {
          where: { status: "COMPLETED" },
          select: { overallScore: true },
        },
        _count: { select: { photos360: true } },
      },
    }),
    prisma.listing.findMany({
      where: {
        dealerId: store.dealerId,
        status: { in: ["ACTIVE", "SOLD"] },
        ...(sp.type === "CAR" || sp.type === "BIKE" ? { vehicleType: sp.type } : {}),
        ...(sp.fuel
          ? {
              fuelType: sp.fuel as "PETROL" | "DIESEL" | "CNG" | "ELECTRIC" | "HYBRID",
            }
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
        inspections: {
          where: { status: "COMPLETED" },
          select: { overallScore: true },
        },
        _count: { select: { photos360: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.listing.count({
      where: { dealerId: store.dealerId, status: "ACTIVE" },
    }),
    prisma.listing.count({
      where: { dealerId: store.dealerId, status: "SOLD" },
    }),
    prisma.inspection.aggregate({
      where: { listing: { dealerId: store.dealerId }, status: "COMPLETED" },
      _avg: { overallScore: true },
    }),
    prisma.listing.findMany({
      where: { dealerId: store.dealerId, status: "ACTIVE" },
      select: { id: true, year: true, make: true, model: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]).catch((err: unknown) => {
    console.error("[showcase] inventory fetch failed:", err);
    notFound(); // returns `never` — preserves the Promise.all tuple type for TS
  });

  const trustScore = computeTrustScore({
    gstVerified: dealer.gstVerified,
    accountCreatedAt: dealer.createdAt,
    soldCount,
    listingCount: activeCount,
    avgResponseHours: null,
  });

  const toCardData = (l: (typeof inventoryRaw)[number]): PremiumListingCardData => {
    const price = Number(l.askingPrice);
    return {
      id: l.id,
      year: l.year,
      make: l.make,
      model: l.model,
      fuelType: l.fuelType,
      transmission: l.transmission,
      odometerKm: l.odometerKm,
      askingPrice: price,
      city: l.city,
      status: l.status,
      coverUrl: l.photos[0]?.url,
      isBoosted: l.isBoosted,
      inspectionScore: l.inspections[0]?.overallScore ?? null,
      hasSpinView: l._count.photos360 > 0,
      emiFromMonthly: emiFromPrice(price),
    };
  };

  const featured = (
    boostedRaw.length > 0
      ? boostedRaw
      : inventoryRaw.filter((l) => l.status === "ACTIVE").slice(0, 3)
  ).map(toCardData);

  const activeInventory = inventoryRaw
    .filter((l) => l.status === "ACTIVE")
    .map(toCardData);
  const soldInventory = inventoryRaw.filter((l) => l.status === "SOLD").map(toCardData);

  const accent = store.primaryColor;
  const waLink = whatsappLink(
    dealer.whatsapp || dealer.phone,
    `Hi ${dealer.businessName}, I'd like to know more about your inventory.`,
  );
  const memberSinceYear = dealer.createdAt.getFullYear();
  const yearsOnPlatform = Math.max(0, new Date().getFullYear() - memberSinceYear);

  const inquiryListings = activeListingsForForm.map((l) => ({
    id: l.id,
    label: `${l.year} ${l.make} ${l.model}`,
  }));

  const schema = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: dealer.businessName,
    image: store.logoUrl || store.bannerUrl || undefined,
    telephone: dealer.phone,
    url: appUrl(`/s/${store.slug}/showcase`),
    address: {
      "@type": "PostalAddress",
      addressLocality: dealer.city,
      addressCountry: "IN",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${dealer.businessName} inventory`,
      itemListElement: activeInventory.slice(0, 20).map((l) => ({
        "@type": "Offer",
        url: appUrl(`/vehicle/${l.id}`),
        price: l.askingPrice,
        priceCurrency: "INR",
        itemOffered: {
          "@type": "Vehicle",
          name: `${l.year} ${l.make} ${l.model}`,
          vehicleTransmission: l.transmission ?? undefined,
          fuelType: l.fuelType,
          mileageFromOdometer: {
            "@type": "QuantitativeValue",
            value: l.odometerKm,
            unitCode: "KMT",
          },
        },
      })),
    },
  };

  return (
    <div className="bg-surface-muted min-h-screen pb-24 sm:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(schema) }}
      />

      <ShowcaseHero
        businessName={dealer.businessName}
        city={dealer.city}
        phone={dealer.phone}
        bannerUrl={store.bannerUrl}
        logoUrl={store.logoUrl}
        accent={accent}
        gstVerified={dealer.gstVerified}
        trustScore={trustScore}
        memberSinceYear={memberSinceYear}
        vehiclesInStock={activeCount}
        waLink={waLink}
      />

      <TrustStrip
        vehiclesInStock={activeCount}
        soldToDate={soldCount}
        avgInspectionScore={inspectionAgg._avg.overallScore}
        gstVerified={dealer.gstVerified}
        yearsOnPlatform={yearsOnPlatform}
      />

      <FeaturedCarousel
        listings={featured}
        accent={accent}
        fallbackHeadline={boostedRaw.length > 0 ? "Featured" : "Latest arrivals"}
      />

      <div className="bg-background">
        <AboutDealer
          businessName={dealer.businessName}
          city={dealer.city}
          phone={dealer.phone}
          whatsapp={dealer.whatsapp}
          bio={store.bio}
          memberSinceYear={memberSinceYear}
          accent={accent}
        />
      </div>

      <section id="inventory" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div
              className="inline-block rounded-full px-3 py-1 text-[11px] font-bold tracking-widest text-white uppercase"
              style={{ backgroundColor: accent }}
            >
              Inventory
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              All vehicles
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {activeInventory.length}{" "}
              {activeInventory.length === 1 ? "vehicle" : "vehicles"} available
              {soldInventory.length > 0 ? ` · ${soldInventory.length} sold` : ""}
            </p>
          </div>
        </div>

        <form
          method="get"
          className="border-border-default bg-background mb-6 flex flex-wrap items-end gap-3 rounded-xl border p-4 shadow-sm"
        >
          <div className="min-w-[180px] flex-1">
            <label className="block text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
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
            <label className="block text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
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
            <label className="block text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
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
            className="rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: accent }}
          >
            Filter
          </button>
        </form>

        {activeInventory.length === 0 ? (
          <div className="border-border-default bg-background rounded-xl border border-dashed p-12 text-center text-sm text-zinc-500">
            No vehicles match your filters.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeInventory.map((l) => (
              <PremiumListingCard key={l.id} listing={l} accent={accent} />
            ))}
          </div>
        )}

        {soldInventory.length > 0 ? (
          <details className="group mt-10">
            <summary className="border-border-default flex cursor-pointer items-center justify-between rounded-xl border bg-white px-5 py-3 text-sm font-semibold transition hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800">
              <span>
                Recently sold · {soldInventory.length}{" "}
                {soldInventory.length === 1 ? "vehicle" : "vehicles"}
              </span>
              <span className="text-zinc-400 transition group-open:rotate-180">▾</span>
            </summary>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {soldInventory.map((l) => (
                <PremiumListingCard key={l.id} listing={l} accent={accent} />
              ))}
            </div>
          </details>
        ) : null}
      </section>

      <section id="contact" className="bg-background px-4 py-14 sm:py-20">
        <StorefrontInquiryForm
          listings={inquiryListings}
          defaultListingId={sp.listing}
          accent={accent}
        />
      </section>

      <footer className="border-border-default bg-background border-t py-8 text-center text-xs text-zinc-500">
        Showroom powered by{" "}
        <Link href="/" className="text-brand-red font-semibold">
          Wheewise
        </Link>
      </footer>

      <StickyContactBar phone={dealer.phone} waLink={waLink} accent={accent} />
    </div>
  );
}
