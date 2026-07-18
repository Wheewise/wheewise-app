import "./env";

import { PrismaClient } from "@prisma/client";
import { PrismaNeon, PrismaNeonHTTP } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { neonConfig } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function isNeonUrl(url: string | undefined): url is string {
  return typeof url === "string" && url.includes("neon.tech");
}

// Standard Cloudflare Workers runtime detection (works synchronously, no
// Node-specific globals required). See:
// https://developers.cloudflare.com/workers/runtime-apis/web-standards/#navigatoruseragent
const isCloudflareWorkers =
  typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

const DATABASE_URL = process.env.DATABASE_URL;

// PrismaNeon holds a persistent WebSocket pool tied to the request that created
// it. On Cloudflare Workers that throws "Cannot perform I/O on behalf of a
// different request" as soon as a second request reuses the client — so Workers
// must use the stateless PrismaNeonHTTP adapter instead. Node (local/CI) keeps
// the WebSocket pool, which supports interactive transactions/nested writes.
if (isNeonUrl(DATABASE_URL) && !isCloudflareWorkers && typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = (await import("ws")).default;
}

function createClient(): PrismaClient {
  const log: ("error" | "warn")[] =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  if (isNeonUrl(DATABASE_URL)) {
    const adapter = isCloudflareWorkers
      ? new PrismaNeonHTTP(DATABASE_URL, {})
      : new PrismaNeon({ connectionString: DATABASE_URL });
    return new PrismaClient({ adapter, log });
  }

  // Fallback: standard TCP connection for local / CI Postgres instances.
  // The generator's engineType="client" (see schema.prisma) requires an
  // adapter unconditionally — there's no more built-in native-engine path —
  // so this plain-Postgres case needs its own adapter too.
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }), log });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
