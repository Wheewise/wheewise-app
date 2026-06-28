import { getPayouts, updatePayoutStatus } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Field";

type Payout = Awaited<ReturnType<typeof getPayouts>>[number];

export default async function AdminPayoutsPage() {
  const payouts = await getPayouts();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Payouts</h1>

      <div className="border-border-default bg-background rounded-lg border">
        {payouts.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            No payout requests yet.
          </div>
        ) : (
          <ul className="divide-border-default divide-y">
            {payouts.map((p: Payout) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      ₹{Number(p.amount).toLocaleString("en-IN")}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                        p.status === "APPROVED" || p.status === "PAID"
                          ? "bg-green-100 text-green-700"
                          : p.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {p.dealer.businessName}
                    {p.note ? ` · "${p.note}"` : ""} ·{" "}
                    {new Date(p.createdAt).toLocaleDateString("en-IN")}
                  </div>
                </div>
                {p.status === "PENDING" ? (
                  <div className="flex gap-2">
                    <form
                      action={async () => {
                        "use server";
                        await updatePayoutStatus(p.id, "APPROVED");
                      }}
                    >
                      <Button className="bg-green-600 text-xs hover:bg-green-700">
                        Approve
                      </Button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await updatePayoutStatus(p.id, "REJECTED");
                      }}
                    >
                      <Button className="bg-red-600 text-xs hover:bg-red-700">
                        Reject
                      </Button>
                    </form>
                  </div>
                ) : p.status === "APPROVED" ? (
                  <form
                    action={async () => {
                      "use server";
                      await updatePayoutStatus(p.id, "PAID");
                    }}
                  >
                    <Button className="text-xs">Mark Paid</Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
