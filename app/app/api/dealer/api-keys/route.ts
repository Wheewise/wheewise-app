import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dealer = await prisma.dealer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!dealer) {
    return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
  }

  let name: string;
  try {
    ({ name } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const key = `wheewise_${crypto.randomUUID().replace(/-/g, "")}`;

  const apiKey = await prisma.apiKey.create({
    data: {
      dealerId: dealer.id,
      name: name.trim(),
      key,
    },
  });

  return NextResponse.json({
    id: apiKey.id,
    name: apiKey.name,
    key: apiKey.key,
    lastUsedAt: apiKey.lastUsedAt,
    createdAt: apiKey.createdAt,
  });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dealer = await prisma.dealer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!dealer) {
    return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const key = await prisma.apiKey.findFirst({
    where: { id, dealerId: dealer.id },
  });
  if (!key) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  await prisma.apiKey.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
