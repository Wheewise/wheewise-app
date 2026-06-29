import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const dealerId = searchParams.get("dealerId");

  try {
    const listings = await prisma.listing.findMany({
      take: limit + 1, // Fetch one extra to know if there's a next page
      cursor: cursor ? { id: cursor } : undefined,
      where: dealerId ? { dealerId } : undefined,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        photos: { take: 1, orderBy: { sortOrder: "asc" } },
        _count: { select: { enquiries: true } },
      },
    });

    let nextCursor: typeof cursor | undefined = undefined;
    if (listings.length > limit) {
      const nextItem = listings.pop();
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({
      data: listings,
      meta: {
        nextCursor,
      },
    });
  } catch (error) {
    console.error("Failed to fetch listings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
