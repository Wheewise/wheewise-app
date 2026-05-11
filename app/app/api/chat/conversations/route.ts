import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: session.user.id }, { dealerId: session.user.id }],
    },
    include: {
      listing: {
        select: {
          id: true,
          year: true,
          make: true,
          model: true,
          photos: { take: 1, orderBy: { sortOrder: "asc" } },
        },
      },
      buyer: { select: { id: true, name: true } },
      dealer: { select: { id: true, businessName: true } },
      messages: { take: 1, orderBy: { createdAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Count unread messages where the other party sent them
  const unreadCounts = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      conversationId: { in: conversations.map((c) => c.id) },
      senderId: { not: session.user.id },
      readAt: null,
    },
    _count: { id: true },
  });

  const unreadMap = new Map(unreadCounts.map((u) => [u.conversationId, u._count.id]));

  const result = conversations.map((c) => ({
    id: c.id,
    listing: {
      id: c.listing.id,
      title: `${c.listing.year} ${c.listing.make} ${c.listing.model}`,
      photo: c.listing.photos[0]?.url ?? null,
    },
    otherParty:
      session.user.id === c.buyerId
        ? { name: c.dealer.businessName, id: c.dealer.id }
        : { name: c.buyer.name ?? "Buyer", id: c.buyer.id },
    lastMessage: c.messages[0]?.body?.slice(0, 100) ?? null,
    unread: unreadMap.get(c.id) ?? 0,
    updatedAt: c.updatedAt,
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let listingId: string;
  try {
    const body = await req.json();
    listingId = body.listingId;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { dealerId: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Prevent dealer from messaging themselves
  if (listing.dealerId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot message your own listing" },
      { status: 400 },
    );
  }

  const existing = await prisma.conversation.findUnique({
    where: { listingId_buyerId: { listingId, buyerId: session.user.id } },
  });
  if (existing) {
    return NextResponse.json({ id: existing.id });
  }

  const conversation = await prisma.conversation.create({
    data: {
      listingId,
      buyerId: session.user.id,
      dealerId: listing.dealerId,
    },
  });

  return NextResponse.json({ id: conversation.id }, { status: 201 });
}
