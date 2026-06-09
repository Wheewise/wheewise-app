import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireDealer } from "@/lib/dealer";
import { Button } from "@/components/ui/Field";
import { formatINR } from "@/lib/format";

export default async function InventoryPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { dealer } = await requireDealer();

  const limit = 20;
  const cursor = searchParams?.cursor as string | undefined;

  const listings = await prisma.listing.findMany({
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    where: { dealerId: dealer.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      photos: { take: 1, orderBy: { sortOrder: "asc" } },
      _count: { select: { enquiries: true } },
    },
  });

  let nextCursor: string | undefined = undefined;
  if (listings.length > limit) {
    const nextItem = listings.pop();
    nextCursor = nextItem!.id;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {listings.length} vehicle{listings.length === 1 ? "" : "s"} in your showroom
          </p>
        </div>
        <Link href="/dashboard/inventory/new">
          <Button>Add vehicle</Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="border-border-default bg-background rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-base font-semibold">No vehicles yet</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Add your first vehicle to start filling your shareable showroom.
          </p>
          <Link href="/dashboard/inventory/new" className="mt-4 inline-block">
            <Button>Add your first vehicle</Button>
          </Link>
        </div>
      ) : (
        <div className="border-border-default bg-background overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-border-default border-b text-xs tracking-wide text-zinc-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Vehicle</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Views</th>
                <th className="px-4 py-3 text-left">Leads</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-border-default divide-y">
              {listings.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {l.photos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={l.photos[0].url}
                          alt=""
                          className="h-12 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="bg-surface-muted h-12 w-16 rounded" />
                      )}
                      <div>
                        <div className="font-medium">
                          {l.year} {l.make} {l.model}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {l.odometerKm.toLocaleString()} km · {l.city}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatINR(Number(l.askingPrice))}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{l.viewCount}</td>
                  <td className="px-4 py-3 text-zinc-600">{l._count.enquiries}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/inventory/${l.id}/edit`}
                      className="text-brand-red text-sm font-medium hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {nextCursor && (
            <div className="border-border-default flex justify-center border-t p-4">
              <Link href={`/dashboard/inventory?cursor=${nextCursor}`}>
                <Button variant="outline">Load More</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    SOLD: "bg-zinc-100 text-zinc-700 ring-zinc-600/20",
    PAUSED: "bg-amber-50 text-amber-700 ring-amber-600/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        map[status] ?? "bg-zinc-100 text-zinc-700 ring-zinc-600/20"
      }`}
    >
      {status.toLowerCase()}
    </span>
  );
}
