import { requireDealer } from "@/lib/dealer";
import { getDealerPayouts } from "@/lib/actions/admin";
import { CheckoutButton } from "./CheckoutButton";

const plans = [
  {
    id: "MONTHLY",
    name: "Monthly",
    price: "₹999",
    cadence: "per month",
    features: ["Unlimited listings", "Lead inbox", "Storefront link"],
  },
  {
    id: "YEARLY",
    name: "Yearly",
    price: "₹9,999",
    cadence: "per year",
    features: ["Everything in Monthly", "Save ₹1,989 vs monthly", "Priority support"],
    highlight: true,
  },
];

export default async function BillingPage() {
  const { dealer } = await requireDealer({ allowPaywalled: true });
  const sub = dealer.subscription;
  const blocked = sub?.status === "PAST_DUE" || sub?.status === "CANCELLED";
  const payouts = await getDealerPayouts(dealer.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your Wheewise subscription.</p>
      </div>

      {blocked ? (
        <div className="border-brand-red/40 bg-brand-red/5 text-brand-red rounded-lg border p-4 text-sm">
          Your subscription is {sub?.status === "PAST_DUE" ? "past due" : "cancelled"}.
          Renew to regain full dashboard access — your storefront stays paused until
          payment is complete.
        </div>
      ) : null}

      <section className="border-border-default bg-background rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Current plan
            </div>
            <div className="mt-1 text-xl font-bold">
              {sub?.plan === "FREE_TRIAL"
                ? "Free trial"
                : sub?.plan === "MONTHLY"
                  ? "Monthly"
                  : sub?.plan === "YEARLY"
                    ? "Yearly"
                    : "—"}
            </div>
            {sub ? (
              <div className="mt-1 text-sm text-zinc-500">
                Status: {sub.status}
                {sub.currentPeriodEnd
                  ? ` · ${
                      sub.status === "TRIALING" ? "Trial ends" : "Renews"
                    } ${sub.currentPeriodEnd.toLocaleDateString()}`
                  : ""}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold">Choose a plan</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`rounded-lg border p-6 ${
                p.highlight
                  ? "border-brand-red bg-brand-red/5"
                  : "border-border-default bg-background"
              }`}
            >
              <div className="text-sm font-semibold">{p.name}</div>
              <div className="mt-2">
                <span className="text-3xl font-bold">{p.price}</span>{" "}
                <span className="text-sm text-zinc-500">{p.cadence}</span>
              </div>
              <ul className="mt-4 space-y-1 text-sm text-zinc-600">
                {p.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <CheckoutButton
                plan={p.id as "MONTHLY" | "YEARLY"}
                highlight={p.highlight}
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold">Payout history</h2>
        {payouts.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No payouts yet.</p>
        ) : (
          <div className="border-border-default bg-background mt-3 rounded-lg border">
            {payouts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between border-b px-4 py-3 last:border-0"
              >
                <div>
                  <span className="text-sm font-semibold">
                    ₹{Number(p.amount).toLocaleString("en-IN")}
                  </span>
                  <p className="text-xs text-zinc-500">
                    {new Date(p.createdAt).toLocaleDateString("en-IN")}
                    {p.note ? ` · ${p.note}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase ${
                    p.status === "PAID"
                      ? "bg-green-100 text-green-700"
                      : p.status === "REJECTED"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
