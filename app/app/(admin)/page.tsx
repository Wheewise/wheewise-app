import { getAdminStats } from "@/lib/actions/admin";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  const stats = await getAdminStats();

  const recentDealers = await prisma.dealer.findMany({
    include: {
      user: { select: { email: true } },
      subscription: { select: { plan: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total dealers" value={stats.dealerCount} />
        <Kpi label="Active listings" value={stats.listingCount} />
        <Kpi label="Total leads" value={stats.leadCount} />
        <Kpi label="Active subs" value={stats.activeSubs} />
      </div>

      <div className="border-border-default bg-background rounded-lg border">
        <div className="border-border-default border-b px-5 py-3">
          <h2 className="text-sm font-semibold">Recent dealer signups</h2>
        </div>
        {recentDealers.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">No dealers yet.</div>
        ) : (
          <ul className="divide-border-default divide-y">
            {recentDealers.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium">{d.businessName}</div>
                  <div className="text-xs text-zinc-500">
                    {d.user.email} · {d.city}
                  </div>
                </div>
                <div className="text-xs text-zinc-500">
                  {d.subscription?.plan ?? "—"} · {d.subscription?.status ?? "—"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-border-default bg-background rounded-lg border p-4">
      <div className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
