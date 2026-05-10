import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  ALLOWED_PHOTO_MIME,
  MAX_PHOTO_BYTES,
  R2_BUCKET,
  publicUrlFor,
  r2,
} from "@/lib/r2";

const reqSchema = z.object({
  contentType: z.string(),
  size: z.number().int().positive(),
  ext: z.string().min(1).max(8),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = reqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { contentType, size, ext } = parsed.data;

  if (!ALLOWED_PHOTO_MIME.has(contentType)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, or WebP allowed" },
      { status: 400 },
    );
  }
  if (size > MAX_PHOTO_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 8 MB)" },
      { status: 400 },
    );
  }

  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 5);
  const key = `listings/${session.user.id}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });

  return NextResponse.json({
    uploadUrl,
    publicUrl: publicUrlFor(key),
    key,
  });
}
