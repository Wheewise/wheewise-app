import { requireAdmin } from "@/lib/admin-auth";
import { getDealerSubscriptions } from "@/lib/actions/admin";
import { isBillingEnabled } from "@/lib/billing";

type DealerSub = Awaited<ReturnType<typeof getDealerSubscriptions>>[number];

const STATUS_STYLES: Record<string, string> = {
  TRIALING: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-green-100 text-green-700",
  PAST_DUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-zinc-200 text-zinc-600",
};

export default async function AdminSubscriptionsPage() {
  await requireAdmin();

  const dealers = await getDealerSubscriptions();
  const billingOn = isBillingEnabled();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {billingOn
            ? "Dealer plan and trial status."
            : "Billing disabled (all dealers active) — status below is the underlying record for oversight."}
        </p>
      </div>

      <div className="border-border-default bg-background overflow-hidden rounded-lg border">
        {dealers.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">No dealers yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-muted border-border-default border-b">
                  <th className="px-4 py-2 text-left font-semibold text-zinc-500">Dealer</th>
                  <th className="px-4 py-2 text-left font-semibold text-zinc-500">Plan</th>
                  <th className="px-4 py-2 text-left font-semibold text-zinc-500">Status</th>
                  <th className="px-4 py-2 text-left font-semibold text-zinc-500">
                    Trial/renewal ends
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border-default divide-y">
                {dealers.map((d: DealerSub) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{d.businessName}</div>
                      <div className="text-xs text-zinc-500">
                        {d.city}
                        {d.store ? ` · /s/${d.store.slug}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{d.subscription?.plan ?? "—"}</td>
                    <td className="px-4 py-3">
                      {d.subscription ? (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                            STATUS_STYLES[d.subscription.status] ?? "bg-zinc-200 text-zinc-600"
                          }`}
                        >
                          {d.subscription.status}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {d.subscription?.currentPeriodEnd
                        ? d.subscription.currentPeriodEnd.toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
