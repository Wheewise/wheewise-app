import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateDescription } from "@/lib/ai-description";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { ok: withinLimit, retryAfter } = await rateLimit(
    `ai-desc:${ip}`,
    10,
    60 * 60 * 1000,
  );
  if (!withinLimit) {
    return NextResponse.json(
      { error: `Rate limited. Retry in ${retryAfter}s.` },
      { status: 429 },
    );
  }

  let input: {
    vehicleType: string;
    make: string;
    model: string;
    year: number;
    fuelType: string;
    transmission?: string | null;
    odometerKm: number;
    askingPrice: number;
    city: string;
  };
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!input.make || !input.model || !input.year || !input.askingPrice) {
    return NextResponse.json(
      { error: "make, model, year, and askingPrice required" },
      { status: 400 },
    );
  }

  const description = await generateDescription(input);
  return NextResponse.json({ description });
}
