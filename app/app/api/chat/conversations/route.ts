import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDealerIdForUser } from "@/lib/dealer";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const myDealerId =
    session.user.role === "DEALER" ? await getDealerIdForUser(userId) : null;

  const orFilters: Array<{ buyerId?: string; dealerId?: string }> = [{ buyerId: userId }];
  if (myDealerId) orFilters.push({ dealerId: myDealerId });

  const conversations = await prisma.conversation.findMany({
    where: { OR: orFilters },
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
    // lastMessageAt is the authoritative chat-list order; fall back to updatedAt
    // for conversations that have no messages yet.
    orderBy: [{ lastMessageAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
  });
  type Conversation = (typeof conversations)[number];

  const unreadCounts = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      conversationId: { in: conversations.map((c: Conversation) => c.id) },
      senderId: { not: userId },
      readAt: null,
    },
    _count: { id: true },
  });

  type UnreadCount = (typeof unreadCounts)[number];
  const unreadMap = new Map(unreadCounts.map((u: UnreadCount) => [u.conversationId, u._count.id]));

  const result = conversations.map((c: Conversation) => ({
    id: c.id,
    listing: {
      id: c.listing.id,
      title: `${c.listing.year} ${c.listing.make} ${c.listing.model}`,
      photo: c.listing.photos[0]?.url ?? null,
    },
    otherParty:
      userId === c.buyerId
        ? { name: c.dealer.businessName, id: c.dealer.id }
        : { name: c.buyer.name ?? "Buyer", id: c.buyer.id },
    lastMessage: c.messages[0]?.body?.slice(0, 100) ?? null,
    unread: unreadMap.get(c.id) ?? 0,
    updatedAt: c.lastMessageAt ?? c.updatedAt,
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
    select: { dealerId: true, dealer: { select: { userId: true } } },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.dealer.userId === session.user.id) {
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
