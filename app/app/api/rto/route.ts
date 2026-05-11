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
      { error: "Vehicle not found. Try MH02AB1234, DL01CD5678, or KA03EF9012." },
      { status: 404 },
    );
  }

  return NextResponse.json(vehicle);
}
