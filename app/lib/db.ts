import "./env";

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function isNeonUrl(url: string | undefined): url is string {
  return typeof url === "string" && url.includes("neon.tech");
}

const DATABASE_URL = process.env.DATABASE_URL;

// Only set up the WebSocket constructor when actually connecting to Neon.
// A non-Neon URL (e.g. local Postgres in CI) uses standard TCP via PrismaClient directly.
if (isNeonUrl(DATABASE_URL) && typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = (await import("ws")).default;
}

function createClient(): PrismaClient {
  const log =
    process.env.NODE_ENV === "development"
      ? (["error", "warn"] as const)
      : (["error"] as const);

  if (isNeonUrl(DATABASE_URL)) {
    const adapter = new PrismaNeon({ connectionString: DATABASE_URL });
    return new PrismaClient({ adapter, log });
  }

  // Fallback: standard TCP connection for local / CI Postgres instances.
  return new PrismaClient({ log });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
