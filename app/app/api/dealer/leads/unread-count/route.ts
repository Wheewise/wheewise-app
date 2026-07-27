import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDealerIdForUser } from "@/lib/dealer";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "DEALER") {
    return NextResponse.json({ count: 0 });
  }

  const dealerId = await getDealerIdForUser(session.user.id);
  if (!dealerId) return NextResponse.json({ count: 0 });

  const count = await prisma.enquiry.count({
    where: { dealerId, isRead: false },
  });

  return NextResponse.json({ count });
}
