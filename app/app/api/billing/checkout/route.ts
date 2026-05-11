import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { razorpay, PLAN_IDS, type RazorpayPlanTier } from "@/lib/razorpay";

const bodySchema = z.object({ plan: z.enum(["MONTHLY", "YEARLY"]) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!razorpay) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const dealer = await prisma.dealer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!dealer) {
    return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
  }

  const plan = parsed.data.plan as RazorpayPlanTier;
  const planId = PLAN_IDS[plan];
  if (!planId) {
    return NextResponse.json({ error: "Plan not configured" }, { status: 503 });
  }

  const sub = await razorpay.subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    total_count: plan === "YEARLY" ? 5 : 60,
    notes: { dealerId: dealer.id, plan },
  });

  await prisma.subscription.upsert({
    where: { dealerId: dealer.id },
    create: {
      dealerId: dealer.id,
      plan,
      status: "TRIALING",
      razorpaySubId: sub.id,
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    update: { plan, razorpaySubId: sub.id },
  });

  return NextResponse.json({
    subscriptionId: sub.id,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
