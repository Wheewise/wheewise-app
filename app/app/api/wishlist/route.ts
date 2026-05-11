import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const toggleSchema = z.object({
  listingId: z.string().min(1),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const saved = await prisma.savedListing.findMany({
    where: { userId: session.user.id },
    include: {
      listing: {
        include: {
          photos: { take: 1, orderBy: { sortOrder: "asc" } },
          dealer: { select: { businessName: true, city: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(saved);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await prisma.savedListing.upsert({
    where: {
      userId_listingId: {
        userId: session.user.id,
        listingId: parsed.data.listingId,
      },
    },
    create: { userId: session.user.id, listingId: parsed.data.listingId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await prisma.savedListing.deleteMany({
    where: {
      userId: session.user.id,
      listingId: parsed.data.listingId,
    },
  });

  return NextResponse.json({ ok: true });
}
