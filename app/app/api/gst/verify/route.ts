import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyGstin, isValidGstin } from "@/lib/gst";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let gstin: string;
  try {
    const body = await req.json();
    gstin = body.gstin;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!gstin || !isValidGstin(gstin)) {
    return NextResponse.json({ error: "Invalid GSTIN format" }, { status: 400 });
  }

  const result = await verifyGstin(gstin);
  if (!result) {
    return NextResponse.json({ error: "GSTIN verification failed" }, { status: 422 });
  }

  // Update dealer record
  await prisma.dealer.update({
    where: { userId: session.user.id },
    data: { gstin: gstin.replace(/\s/g, "").toUpperCase(), gstVerified: true },
  });

  return NextResponse.json({ verified: true, ...result });
}
