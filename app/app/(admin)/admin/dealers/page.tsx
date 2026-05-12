import { getDealers, suspendDealer } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Field";

export default async function AdminDealersPage() {
  const dealers = await getDealers();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dealers</h1>

      <div className="border-border-default bg-background rounded-lg border">
        {dealers.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">No dealers.</div>
        ) : (
          <ul className="divide-border-default divide-y">
            {dealers.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{d.businessName}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                        d.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {d.user.email} · {d.city} · {d._count.listings} listings ·{" "}
                    {d._count.enquiries} leads · {d.subscription?.plan ?? "—"} /{" "}
                    {d.subscription?.status ?? "—"}
                  </div>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await suspendDealer(d.id);
                  }}
                >
                  <Button className="text-xs">
                    {d.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
