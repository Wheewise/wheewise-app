"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export async function incrementViewCount(listingId: string, dealerId: string) {
  const session = await auth();
  if (session?.user?.id) {
    const ownDealer = await prisma.dealer.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (ownDealer?.id === dealerId) return;
  }

  const cookieStore = await cookies();
  let visitorId = cookieStore.get("visitor_id")?.value;
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    cookieStore.set("visitor_id", visitorId, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  try {
    await prisma.listingView.create({ data: { listingId, visitorId } });
    await prisma.listing.update({
      where: { id: listingId },
      data: { viewCount: { increment: 1 } },
    });
  } catch (err) {
    // P2002 (unique violation on listingId+visitorId) is the expected "already viewed" path — swallow.
    // Anything else is a genuine failure: log it so it shows up in observability instead of being hidden.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return;
    }
    console.error("[view-actions] incrementViewCount failed", err);
  }
}
