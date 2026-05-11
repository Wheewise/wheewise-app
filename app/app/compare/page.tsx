import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatINR, formatNumber } from "@/lib/format";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Compare vehicles",
};

function titleCase(s: string): string {
  return s[0] + s.slice(1).toLowerCase();
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const idList = ids?.split(",").filter(Boolean).slice(0, 3) ?? [];

  if (idList.length < 2) {
    return (
      <div className="bg-surface-muted flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold">Compare vehicles</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Select at least 2 vehicles to compare. Use the &quot;Compare&quot; button on
            listing cards or vehicle pages.
          </p>
          <Link
            href="/browse"
            className="text-brand-red mt-4 inline-block text-sm font-medium hover:underline"
          >
            Browse listings
          </Link>
        </div>
      </div>
    );
  }

  const listings = await prisma.listing.findMany({
    where: { id: { in: idList }, status: "ACTIVE" },
    include: {
      photos: { take: 1, orderBy: { sortOrder: "asc" } },
      dealer: { select: { businessName: true, city: true } },
    },
  });

  const ordered = idList.map((id) => listings.find((l) => l.id === id)).filter(Boolean);

  if (ordered.length < 2) {
    return (
      <div className="bg-surface-muted flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold">Some vehicles are no longer available</h1>
          <Link
            href="/browse"
            className="text-brand-red mt-2 inline-block text-sm font-medium hover:underline"
          >
            Browse listings
          </Link>
        </div>
      </div>
    );
  }

  const rows: { label: string; values: (string | number)[] }[] = [
    { label: "Price", values: ordered.map((l) => formatINR(Number(l!.askingPrice))) },
    { label: "Year", values: ordered.map((l) => l!.year) },
    { label: "Fuel", values: ordered.map((l) => titleCase(l!.fuelType)) },
    {
      label: "Transmission",
      values: ordered.map((l) => (l!.transmission ? titleCase(l!.transmission) : "—")),
    },
    {
      label: "Odometer",
      values: ordered.map((l) => `${formatNumber(l!.odometerKm)} km`),
    },
    { label: "City", values: ordered.map((l) => l!.city) },
    { label: "Dealer", values: ordered.map((l) => l!.dealer.businessName) },
  ];

  return (
    <div className="bg-surface-muted min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between">
          <Logo variant="wordmark" size={22} href="/" />
          <Link href="/browse" className="text-sm text-zinc-500 hover:underline">
            ← Browse
          </Link>
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Compare</h1>

        <div className="mt-6 overflow-x-auto">
          <table className="border-border-default bg-background w-full min-w-[600px] border-separate rounded-lg border text-sm">
            <thead>
              <tr>
                <th className="border-border-default bg-surface-muted border-b p-4 text-left text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Spec
                </th>
                {ordered.map((l) => (
                  <th
                    key={l!.id}
                    className="border-border-default bg-surface-muted border-b p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {l!.photos[0] ? (
                        <img
                          src={l!.photos[0].url}
                          alt=""
                          className="h-12 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="bg-surface-muted h-12 w-16 rounded" />
                      )}
                      <div>
                        <Link
                          href={`/vehicle/${l!.id}`}
                          className="font-semibold hover:underline"
                        >
                          {l!.year} {l!.make}
                        </Link>
                        <div className="text-xs text-zinc-500">{l!.model}</div>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.label}
                  className={i % 2 === 0 ? "bg-white" : "bg-surface-muted"}
                >
                  <td className="border-border-default border-t p-4 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    {row.label}
                  </td>
                  {row.values.map((v, j) => (
                    <td
                      key={j}
                      className={`border-border-default border-t p-4 ${
                        row.label === "Price" ? "text-brand-red font-bold" : ""
                      }`}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
