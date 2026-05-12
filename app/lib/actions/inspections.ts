"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { CheckCategory } from "@/lib/inspection-checklist";
import { computeChecklistStats } from "@/lib/inspection-checklist";

// --- Inspector ---

export async function applyInspector(certification: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.inspector.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) return { ok: true };

  await prisma.inspector.create({
    data: { userId: session.user.id, certification },
  });

  return { ok: true };
}

export async function approveInspector(inspectorId: string) {
  await requireAdmin();
  await prisma.inspector.update({
    where: { id: inspectorId },
    data: { status: "APPROVED" },
  });
  revalidatePath("/admin/inspectors");
}

export async function rejectInspector(inspectorId: string) {
  await requireAdmin();
  await prisma.inspector.update({
    where: { id: inspectorId },
    data: { status: "REJECTED" },
  });
  revalidatePath("/admin/inspectors");
}

export async function getInspectors() {
  await requireAdmin();
  return prisma.inspector.findMany({
    include: { user: { select: { email: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// --- Inspections ---

export async function requestInspection(listingId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const dealer = await prisma.dealer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!dealer) throw new Error("Not a dealer");

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, dealerId: dealer.id },
    select: { id: true },
  });
  if (!listing) throw new Error("Listing not found");

  const existing = await prisma.inspection.findFirst({
    where: { listingId, status: { notIn: ["CANCELLED"] } },
  });
  if (existing) throw new Error("Inspection already in progress");

  await prisma.inspection.create({
    data: { listingId, dealerId: dealer.id },
  });

  revalidatePath("/dashboard/inventory");
  return { ok: true };
}

export async function assignInspector(inspectionId: string, inspectorId: string) {
  await requireAdmin();

  await prisma.inspection.update({
    where: { id: inspectionId },
    data: { inspectorId, status: "SCHEDULED" },
  });

  revalidatePath("/admin/inspections");
}

export async function getInspections() {
  await requireAdmin();
  return prisma.inspection.findMany({
    include: {
      listing: { select: { make: true, model: true, year: true } },
      dealer: { select: { businessName: true } },
      inspector: { select: { id: true, user: { select: { name: true, email: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInspectorInspection(inspectionId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const inspector = await prisma.inspector.findUnique({
    where: { userId: session.user.id },
  });
  if (!inspector || inspector.status !== "APPROVED")
    throw new Error("Not an approved inspector");

  return prisma.inspection.findFirst({
    where: { id: inspectionId, inspectorId: inspector.id },
    include: {
      listing: {
        select: { make: true, model: true, year: true, odometerKm: true, city: true },
      },
      dealer: { select: { businessName: true, phone: true } },
    },
  });
}

export async function submitInspection(
  inspectionId: string,
  checklist: CheckCategory[],
  notes: string,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const inspector = await prisma.inspector.findUnique({
    where: { userId: session.user.id },
  });
  if (!inspector || inspector.status !== "APPROVED")
    throw new Error("Not an approved inspector");

  const { score } = computeChecklistStats(checklist);

  await prisma.inspection.update({
    where: { id: inspectionId },
    data: {
      checklist: checklist as unknown as object,
      overallScore: score,
      notes,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  revalidatePath(`/inspections/${inspectionId}`);
  return { ok: true };
}

export async function getListingInspection(listingId: string) {
  return prisma.inspection.findFirst({
    where: { listingId, status: "COMPLETED" },
    include: {
      inspector: {
        select: { id: true, user: { select: { name: true } } },
      },
    },
    orderBy: { completedAt: "desc" },
  });
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}
