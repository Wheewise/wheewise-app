import { NextResponse } from "next/server";
import { fetchRto } from "@/lib/rto";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reg = searchParams.get("reg");
  if (!reg) {
    return NextResponse.json({ error: "Missing registration number" }, { status: 400 });
  }

  const vehicle = await fetchRto(reg);
  if (!vehicle) {
    return NextResponse.json(
      { error: "RTO lookup provider not configured" },
      { status: 503 },
    );
  }

  return NextResponse.json(vehicle);
}
