import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { razorpay, BOOST_PLANS } from "@/lib/razorpay";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!razorpay) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
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
    select: { id: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const order = await razorpay.orders.create({
    amount: plan.amount,
    currency: "INR",
    receipt: `boost_${listing.id}_${Date.now()}`,
    notes: {
      kind: "boost",
      listingId: listing.id,
      dealerId: dealer.id,
      duration,
    },
  });

  return NextResponse.json({
    orderId: order.id,
    amount: plan.amount,
    plan: plan.label,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
