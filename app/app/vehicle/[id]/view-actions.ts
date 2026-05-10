"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function incrementViewCount(listingId: string, dealerId: string) {
  const session = await auth();
  if (session?.user?.id) {
    const ownDealer = await prisma.dealer.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (ownDealer?.id === dealerId) return;
  }
  try {
    await prisma.listing.update({
      where: { id: listingId },
      data: { viewCount: { increment: 1 } },
    });
  } catch {
    // best-effort
  }
}
