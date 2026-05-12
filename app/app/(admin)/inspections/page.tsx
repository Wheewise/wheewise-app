import {
  getInspections,
  getInspectors,
  assignInspector,
} from "@/lib/actions/inspections";
import { Button } from "@/components/ui/Field";

export default async function AdminInspectionsPage() {
  const [inspections, inspectors] = await Promise.all([
    getInspections(),
    getInspectors(),
  ]);

  const approved = inspectors.filter((i) => i.status === "APPROVED");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Inspections</h1>

      <div className="border-border-default bg-background rounded-lg border">
        {inspections.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            No inspection requests yet.
          </div>
        ) : (
          <ul className="divide-border-default divide-y">
            {inspections.map((i) => (
              <li key={i.id} className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {i.listing.year} {i.listing.make} {i.listing.model}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                        i.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : i.status === "SCHEDULED" || i.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-700"
                            : i.status === "CANCELLED"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {i.status}
                    </span>
                    {i.overallScore != null ? (
                      <span className="text-xs font-bold text-zinc-600">
                        Score: {i.overallScore}%
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {i.dealer.businessName}
                    {i.inspector
                      ? ` · Inspector: ${i.inspector.user.name ?? i.inspector.user.email}`
                      : " · Unassigned"}
                  </div>
                </div>
                {i.status === "REQUESTED" ? (
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      const inspectorId = formData.get("inspectorId") as string;
                      if (inspectorId) await assignInspector(i.id, inspectorId);
                    }}
                    className="flex items-center gap-2"
                  >
                    <select
                      name="inspectorId"
                      className="rounded border px-2 py-1 text-xs"
                    >
                      <option value="">Assign inspector…</option>
                      {approved.map((ins) => (
                        <option key={ins.id} value={ins.id}>
                          {ins.user.name ?? ins.user.email}
                        </option>
                      ))}
                    </select>
                    <Button className="text-xs">Assign</Button>
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
