"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function getAdminStats() {
  await requireAdmin();

  const [dealerCount, listingCount, leadCount, activeSubs] = await Promise.all([
    prisma.dealer.count(),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.enquiry.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
  ]);

  return { dealerCount, listingCount, leadCount, activeSubs };
}

export async function getDealers() {
  await requireAdmin();

  return prisma.dealer.findMany({
    include: {
      user: { select: { email: true } },
      store: { select: { slug: true } },
      subscription: { select: { plan: true, status: true } },
      _count: { select: { listings: true, enquiries: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingModeration() {
  await requireAdmin();

  return prisma.listing.findMany({
    where: { status: "ACTIVE" },
    include: {
      dealer: { select: { businessName: true } },
      photos: { take: 1, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function suspendDealer(dealerId: string) {
  await requireAdmin();

  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
    select: { id: true, status: true },
  });
  if (!dealer) return;

  const newStatus = dealer.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";

  await prisma.dealer.update({
    where: { id: dealerId },
    data: { status: newStatus },
  });

  if (newStatus === "SUSPENDED") {
    await prisma.listing.updateMany({
      where: { dealerId, status: "ACTIVE" },
      data: { status: "PAUSED" },
    });
  }

  revalidatePath("/admin");
}

export async function removeListingByAdmin(listingId: string) {
  await requireAdmin();

  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "PAUSED" },
  });

  revalidatePath("/admin");
}

// --- Payouts ---

export async function getPayouts() {
  await requireAdmin();

  return prisma.payout.findMany({
    include: {
      dealer: { select: { businessName: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updatePayoutStatus(
  payoutId: string,
  status: "APPROVED" | "REJECTED" | "PAID",
) {
  await requireAdmin();

  await prisma.payout.update({
    where: { id: payoutId },
    data: { status },
  });

  revalidatePath("/admin/payouts");
}

export async function getDealerPayouts(dealerId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (session.user.role !== "ADMIN") {
    const dealer = await prisma.dealer.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!dealer || dealer.id !== dealerId) {
      throw new Error("Forbidden");
    }
  }

  return prisma.payout.findMany({
    where: { dealerId },
    orderBy: { createdAt: "desc" },
  });
}
