import { getPendingModeration, removeListingByAdmin } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Field";
import { formatINR } from "@/lib/format";

type Listing = Awaited<ReturnType<typeof getPendingModeration>>[number];

export default async function AdminListingsPage() {
  const listings = await getPendingModeration();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">All Active Listings</h1>

      <div className="border-border-default bg-background rounded-lg border">
        {listings.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">No active listings.</div>
        ) : (
          <ul className="divide-border-default divide-y">
            {listings.map((l: Listing) => (
              <li key={l.id} className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    {l.year} {l.make} {l.model}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {l.dealer.businessName} · {formatINR(Number(l.askingPrice))} ·{" "}
                    {l.city} · {l.status}
                  </div>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await removeListingByAdmin(l.id);
                  }}
                >
                  <Button className="text-xs">Remove</Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
