import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const bodyText = await req.text();

    if (!verifyWebhookSignature(bodyText, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(bodyText) as {
      id?: string;
      event: string;
      payload: {
        subscription?: {
          entity: { id: string; current_end?: number };
        };
      };
    };

    // Replay protection: insert Payment row keyed by webhook event id.
    // Razorpay event ids are unique per delivery; a replay hits P2002 and we
    // ack the webhook silently without re-processing.
    if (event.id) {
      try {
        await prisma.payment.create({
          data: {
            razorpayEventId: event.id,
            kind: "WEBHOOK",
            amount: 0,
            status: "SUCCEEDED",
            notes: { event: event.event },
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          return NextResponse.json({ received: true, replayed: true });
        }
        throw err;
      }
    }

    if (event.event === "subscription.charged" && event.payload.subscription) {
      const sub = event.payload.subscription.entity;
      await prisma.subscription.updateMany({
        where: { razorpaySubId: sub.id },
        data: {
          status: "ACTIVE",
          ...(sub.current_end
            ? { currentPeriodEnd: new Date(sub.current_end * 1000) }
            : {}),
        },
      });
    } else if (event.event === "subscription.cancelled" && event.payload.subscription) {
      await prisma.subscription.updateMany({
        where: { razorpaySubId: event.payload.subscription.entity.id },
        data: { status: "CANCELLED" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
