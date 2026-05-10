import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireDealer } from "@/lib/dealer";
import { Button } from "@/components/ui/Field";

export default async function DashboardPage() {
  const { dealer } = await requireDealer();

  const [activeListings, totalLeads, viewSum, recentLeads] = await Promise.all([
    prisma.listing.count({
      where: { dealerId: dealer.id, status: "ACTIVE" },
    }),
    prisma.enquiry.count({
      where: { listing: { dealerId: dealer.id } },
    }),
    prisma.listing.aggregate({
      where: { dealerId: dealer.id },
      _sum: { viewCount: true, enquiryCount: true },
    }),
    prisma.enquiry.findMany({
      where: { listing: { dealerId: dealer.id } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: { listing: { select: { make: true, model: true, year: true } } },
    }),
  ]);

  const totalViews = viewSum._sum.viewCount ?? 0;
  const totalEnquiries = viewSum._sum.enquiryCount ?? 0;
  const ratio =
    totalViews > 0 ? `${((totalEnquiries / totalViews) * 100).toFixed(1)}%` : "—";

  const sub = dealer.subscription;
  const subLabel = sub
    ? sub.status === "TRIALING"
      ? `Free trial · ends ${sub.currentPeriodEnd.toLocaleDateString()}`
      : `${sub.plan} · ${sub.status}`
    : "No subscription";

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {dealer.businessName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Your showroom link:{" "}
            <Link
              href={`/s/${dealer.store?.slug ?? ""}`}
              className="font-medium text-brand-red hover:underline"
            >
              /s/{dealer.store?.slug}
            </Link>
          </p>
        </div>
        <Link href="/dashboard/inventory/new">
          <Button>Add vehicle</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Active listings" value={activeListings} />
        <Kpi label="Total leads" value={totalLeads} />
        <Kpi label="Lead-to-view" value={ratio} />
        <Kpi label="Subscription" value={subLabel} small />
      </div>

      <section className="rounded-lg border border-border-default bg-background">
        <div className="flex items-center justify-between border-b border-border-default px-5 py-3">
          <h2 className="text-sm font-semibold">Recent leads</h2>
          <Link
            href="/dashboard/leads"
            className="text-sm font-medium text-brand-red hover:underline"
          >
            View all
          </Link>
        </div>
        {recentLeads.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            No leads yet. Share your showroom link to start receiving enquiries.
          </div>
        ) : (
          <ul className="divide-y divide-border-default">
            {recentLeads.map((lead) => (
              <li key={lead.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium">{lead.buyerName}</div>
                  <div className="text-xs text-zinc-500">
                    {lead.listing.year} {lead.listing.make} {lead.listing.model} ·{" "}
                    {lead.buyerPhone}
                  </div>
                </div>
                <div className="text-xs text-zinc-500">
                  {timeAgo(lead.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  small,
}: {
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border-default bg-background p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-1 font-bold tracking-tight ${
          small ? "text-base" : "text-2xl"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function timeAgo(d: Date): string {
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
