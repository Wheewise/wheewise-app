import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { InspectionChecklist } from "./InspectionChecklist";
import type { CheckCategory } from "@/lib/inspection-checklist";

type Params = Promise<{ id: string }>;

export default async function InspectionPage({ params }: { params: Params }) {
  const { id } = await params;
  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      listing: {
        select: { make: true, model: true, year: true, odometerKm: true, city: true },
      },
      dealer: { select: { businessName: true, phone: true } },
      inspector: { select: { user: { select: { name: true } } } },
    },
  });
  if (!inspection) notFound();

  return (
    <div className="bg-surface-muted min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-xl font-bold tracking-tight">
          Inspection — {inspection.listing.year} {inspection.listing.make}{" "}
          {inspection.listing.model}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {inspection.dealer.businessName} · {inspection.listing.city}
          {inspection.inspector
            ? ` · Inspector: ${inspection.inspector.user.name ?? "—"}`
            : ""}
        </p>

        <div className="mt-6">
          <InspectionChecklist
            inspectionId={inspection.id}
            existing={
              inspection.checklist
                ? (inspection.checklist as unknown as CheckCategory[])
                : undefined
            }
            existingNotes={inspection.notes ?? undefined}
            readonly={inspection.status === "COMPLETED"}
          />
        </div>
      </div>
    </div>
  );
}
