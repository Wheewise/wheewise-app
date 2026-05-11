import { NextResponse } from "next/server";
import { generateOtp, sendOtpSms } from "@/lib/otp";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  const { ok: withinLimit, retryAfter } = await rateLimit(
    `otp-send:${ip}`,
    3,
    15 * 60 * 1000,
  );
  if (!withinLimit) {
    return NextResponse.json(
      { error: `Too many OTP requests. Try again in ${retryAfter}s.` },
      { status: 429 },
    );
  }

  let phone: string;
  try {
    const body = await req.json();
    phone = body.phone;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!phone || typeof phone !== "string" || phone.replace(/[^0-9]/g, "").length < 10) {
    return NextResponse.json({ error: "Valid phone number required" }, { status: 400 });
  }

  const otp = await generateOtp(phone);
  await sendOtpSms(phone, otp);

  return NextResponse.json({ ok: true });
}
