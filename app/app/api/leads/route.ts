import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { scoreLead } from "@/lib/lead-priority";
import { sendLeadNotification } from "@/lib/email";

const leadSchema = z.object({
  listingId: z.string().min(1),
  buyerName: z.string().min(2).max(80),
  buyerPhone: z
    .string()
    .min(7)
    .max(20)
    .regex(/^[+\d\s-]+$/),
  buyerEmail: z.string().email().optional().or(z.literal("")),
  message: z.string().max(1000).optional().or(z.literal("")),
});

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = await rateLimit(`lead:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many enquiries. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const listing = await prisma.listing.findUnique({
    where: { id: data.listingId },
    include: { dealer: { include: { user: true } } },
  });
  if (!listing || listing.status !== "ACTIVE") {
    return NextResponse.json({ error: "Listing not available" }, { status: 404 });
  }

  const session = await auth();

  const phoneDigits = data.buyerPhone.replace(/[^\d]/g, "");
  const priority = scoreLead({
    hasMessage: Boolean(data.message),
    messageLength: data.message?.length ?? 0,
    hasEmail: Boolean(data.buyerEmail),
    isAuthenticated: Boolean(session?.user),
    phoneLooksValid: phoneDigits.length >= 10,
  });

  const enquiry = await prisma.enquiry.create({
    data: {
      listingId: listing.id,
      dealerId: listing.dealerId,
      buyerId: session?.user?.id,
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      buyerEmail: data.buyerEmail || null,
      message: data.message || null,
      source: "FORM",
      priority,
    },
  });

  await prisma.listing.update({
    where: { id: listing.id },
    data: { enquiryCount: { increment: 1 } },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wheewise.in";
  await sendLeadNotification({
    to: listing.dealer.user.email,
    dealerName: listing.dealer.businessName,
    vehicle: `${listing.year} ${listing.make} ${listing.model}`,
    buyerName: data.buyerName,
    buyerPhone: data.buyerPhone,
    buyerEmail: data.buyerEmail || null,
    message: data.message || null,
    dashboardUrl: `${appUrl}/dashboard/leads`,
  });

  return NextResponse.json({ ok: true, id: enquiry.id });
}
