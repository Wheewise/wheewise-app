import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature, type RazorpayWebhookEvent } from "@/lib/razorpay";

const STATUS_MAP: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELLED" | "TRIALING"> = {
  active: "ACTIVE",
  authenticated: "TRIALING",
  pending: "PAST_DUE",
  halted: "PAST_DUE",
  cancelled: "CANCELLED",
  completed: "CANCELLED",
  expired: "CANCELLED",
};

export async function POST(req: Request) {
  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }
  const rawBody = await req.text();
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sub = event.payload?.subscription?.entity;
  if (!sub) return NextResponse.json({ ok: true });

  const mapped = STATUS_MAP[sub.status];
  if (!mapped) return NextResponse.json({ ok: true });

  await prisma.subscription.updateMany({
    where: { razorpaySubId: sub.id },
    data: {
      status: mapped,
      ...(sub.current_end ? { currentPeriodEnd: new Date(sub.current_end * 1000) } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
