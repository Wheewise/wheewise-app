import Link from "next/link";
import { requireDealer } from "@/lib/dealer";
import { createListing } from "@/lib/actions/listings";
import { ListingForm } from "@/components/listings/ListingForm";

export default async function NewListingPage() {
  const { dealer } = await requireDealer();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/inventory"
          className="text-sm text-zinc-500 hover:text-foreground"
        >
          ← Back to inventory
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Add a vehicle</h1>
      </div>
      <div className="rounded-lg border border-border-default bg-background p-6">
        <ListingForm
          action={createListing}
          defaults={{ city: dealer.city }}
          submitLabel="Create listing"
        />
      </div>
    </div>
  );
}
