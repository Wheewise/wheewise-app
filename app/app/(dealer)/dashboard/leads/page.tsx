import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireDealer } from "@/lib/dealer";
import { LeadActions } from "./LeadActions";

export default async function LeadsPage() {
  const { dealer } = await requireDealer();

  const leads = await prisma.enquiry.findMany({
    where: { dealerId: dealer.id },
    orderBy: [
      { isRead: "asc" },
      { priority: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      listing: {
        select: { id: true, make: true, model: true, year: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {leads.length} enquir{leads.length === 1 ? "y" : "ies"} from buyers,
          prioritized by intent.
        </p>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-default bg-background p-10 text-center">
          <h2 className="text-base font-semibold">No leads yet</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Share your storefront link to start receiving enquiries.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-default bg-background">
          <ul className="divide-y divide-border-default">
            {leads.map((lead) => {
              const waNumber = lead.buyerPhone.replace(/[^\d]/g, "");
              const vehicle = `${lead.listing.year} ${lead.listing.make} ${lead.listing.model}`;
              const waMsg = encodeURIComponent(
                `Hi ${lead.buyerName}, this is ${dealer.businessName} regarding the ${vehicle}.`,
              );
              return (
                <li
                  key={lead.id}
                  className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between ${
                    lead.isRead ? "" : "bg-brand-red/5"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{lead.buyerName}</span>
                      {!lead.isRead ? (
                        <span className="rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                          New
                        </span>
                      ) : null}
                      {lead.priority >= 50 ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                          Hot
                        </span>
                      ) : null}
                      {lead.isContacted ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
                          Contacted
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-sm text-zinc-600">
                      <Link
                        href={`/dashboard/inventory/${lead.listing.id}/edit`}
                        className="font-medium hover:underline"
                      >
                        {vehicle}
                      </Link>
                      {" · "}
                      {lead.buyerPhone}
                      {lead.buyerEmail ? ` · ${lead.buyerEmail}` : ""}
                    </div>
                    {lead.message ? (
                      <p className="mt-2 text-sm text-foreground">
                        “{lead.message}”
                      </p>
                    ) : null}
                    <div className="mt-2 text-xs text-zinc-500">
                      {lead.createdAt.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`https://wa.me/${waNumber}?text=${waMsg}`}
                      target="_blank"
                      rel="noopener"
                      className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      WhatsApp
                    </a>
                    <a
                      href={`tel:${lead.buyerPhone}`}
                      className="rounded-md border border-border-default bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-muted"
                    >
                      Call
                    </a>
                    <LeadActions
                      leadId={lead.id}
                      isRead={lead.isRead}
                      isContacted={lead.isContacted}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
