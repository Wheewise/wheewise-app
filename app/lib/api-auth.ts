import { prisma } from "./db";

export async function validateApiKey(req: Request): Promise<string | null> {
  const header = req.headers.get("x-api-key");
  if (!header) return null;

  const key = await prisma.apiKey.findUnique({
    where: { key: header },
    select: { dealerId: true },
  });
  if (!key) return null;

  // Update lastUsedAt asynchronously — don't await
  prisma.apiKey
    .update({ where: { key: header }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return key.dealerId;
}
