import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const BOOST_PLANS = {
  "7": { days: 7, label: "7 days — ₹199" },
  "14": { days: 14, label: "14 days — ₹299" },
  "30": { days: 30, label: "30 days — ₹499" },
} as const;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dealer = await prisma.dealer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!dealer) {
    return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
  }

  let listingId: string;
  let duration: string;
  try {
    const body = await req.json();
    listingId = body.listingId;
    duration = body.duration;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const plan = BOOST_PLANS[duration as keyof typeof BOOST_PLANS];
  if (!plan) {
    return NextResponse.json(
      { error: "Invalid duration. Use 7, 14, or 30." },
      { status: 400 },
    );
  }

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, dealerId: dealer.id },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Production: create Razorpay order here, return orderId for checkout
  // For dev: boost immediately
  const boostExpiresAt = new Date(Date.now() + plan.days * 24 * 60 * 60 * 1000);

  await prisma.listing.update({
    where: { id: listingId },
    data: { isBoosted: true, boostExpiresAt },
  });

  return NextResponse.json({
    ok: true,
    plan: plan.label,
    expiresAt: boostExpiresAt,
  });
}
