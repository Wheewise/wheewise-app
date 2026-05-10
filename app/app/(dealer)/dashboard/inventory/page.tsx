import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireDealer } from "@/lib/dealer";
import { Button } from "@/components/ui/Field";
import { formatINR } from "@/lib/format";

export default async function InventoryPage() {
  const { dealer } = await requireDealer();

  const listings = await prisma.listing.findMany({
    where: { dealerId: dealer.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      photos: { take: 1, orderBy: { sortOrder: "asc" } },
      _count: { select: { enquiries: true } },
    },
  });

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
        <div className="rounded-lg border border-dashed border-border-default bg-background p-10 text-center">
          <h2 className="text-base font-semibold">No vehicles yet</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Add your first vehicle to start filling your shareable showroom.
          </p>
          <Link href="/dashboard/inventory/new" className="mt-4 inline-block">
            <Button>Add your first vehicle</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-default bg-background">
          <table className="w-full text-sm">
            <thead className="border-b border-border-default text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 text-left">Vehicle</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Views</th>
                <th className="px-4 py-3 text-left">Leads</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
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
                        <div className="h-12 w-16 rounded bg-surface-muted" />
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
                      className="text-sm font-medium text-brand-red hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
