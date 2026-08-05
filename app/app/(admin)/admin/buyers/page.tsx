import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getBuyers } from "@/lib/actions/admin";

type Buyer = Awaited<ReturnType<typeof getBuyers>>["buyers"][number];
type Search = Promise<{ q?: string; page?: string }>;

export default async function AdminBuyersPage({ searchParams }: { searchParams: Search }) {
  await requireAdmin();

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim() || undefined;

  const { buyers, total, totalPages } = await getBuyers({ q, page });

  const qs = new URLSearchParams();
  if (q) qs.set("q", q);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Buyers</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {total} total {total === 1 ? "buyer" : "buyers"}
        </p>
      </div>

      <form method="get" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name or email"
          className="border-border-default bg-background focus:border-brand-red focus:ring-brand-red/20 block w-full max-w-sm rounded-md border px-3 py-2 text-sm shadow-xs transition-colors outline-none focus:ring-2"
        />
        <button
          type="submit"
          className="border-border-default bg-background hover:bg-surface-muted rounded-md border px-4 py-2 text-sm font-medium transition-colors"
        >
          Search
        </button>
      </form>

      <div className="border-border-default bg-background overflow-hidden rounded-lg border">
        {buyers.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            {q ? `No buyers matching "${q}".` : "No buyers yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-muted border-border-default border-b">
                  <th className="px-4 py-2 text-left font-semibold text-zinc-500">Name</th>
                  <th className="px-4 py-2 text-left font-semibold text-zinc-500">Email</th>
                  <th className="px-4 py-2 text-left font-semibold text-zinc-500">Joined</th>
                  <th className="px-4 py-2 text-right font-semibold text-zinc-500">
                    Enquiries
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-zinc-500">
                    Wishlist
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border-default divide-y">
                {buyers.map((b: Buyer) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-medium">{b.name ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-500">{b.email ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {b.createdAt.toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {b._count.enquiries}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {b._count.savedListings}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2 text-sm">
          {page > 1 ? <PageLink qs={qs} page={page - 1} label="← Previous" /> : null}
          <span className="text-zinc-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <PageLink qs={qs} page={page + 1} label="Next →" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PageLink({
  qs,
  page,
  label,
}: {
  qs: URLSearchParams;
  page: number;
  label: string;
}) {
  const params = new URLSearchParams(qs);
  params.set("page", String(page));
  return (
    <Link
      href={`/admin/buyers?${params.toString()}`}
      className="border-border-default bg-background hover:bg-surface-muted rounded-md border px-3 py-1.5 transition-colors"
    >
      {label}
    </Link>
  );
}
