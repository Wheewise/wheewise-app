import {
  getInspectors,
  approveInspector,
  rejectInspector,
} from "@/lib/actions/inspections";
import { Button } from "@/components/ui/Field";

export default async function AdminInspectorsPage() {
  const inspectors = await getInspectors();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Inspectors</h1>

      <div className="border-border-default bg-background rounded-lg border">
        {inspectors.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            No inspector applications yet.
          </div>
        ) : (
          <ul className="divide-border-default divide-y">
            {inspectors.map((i) => (
              <li key={i.id} className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {i.user.name ?? i.user.email}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                        i.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : i.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {i.status}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {i.user.email}
                    {i.certification ? ` · Cert: ${i.certification}` : ""}
                  </div>
                </div>
                {i.status === "PENDING" ? (
                  <div className="flex gap-2">
                    <form
                      action={async () => {
                        "use server";
                        await approveInspector(i.id);
                      }}
                    >
                      <Button className="bg-green-600 text-xs hover:bg-green-700">
                        Approve
                      </Button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await rejectInspector(i.id);
                      }}
                    >
                      <Button className="bg-red-600 text-xs hover:bg-red-700">
                        Reject
                      </Button>
                    </form>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
