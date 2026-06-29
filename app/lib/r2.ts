import "./env";

import { S3Client } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const R2_BUCKET = process.env.R2_BUCKET ?? "wheewise";
export const R2_PUBLIC_BASE = process.env.R2_PUBLIC_BASE_URL ?? "";

export const r2 = new S3Client({
  region: "auto",
  endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined,
  credentials:
    accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
});

export function publicUrlFor(key: string): string {
  if (!R2_PUBLIC_BASE) return key;
  return `${R2_PUBLIC_BASE.replace(/\/$/, "")}/${key}`;
}

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const ALLOWED_PHOTO_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
