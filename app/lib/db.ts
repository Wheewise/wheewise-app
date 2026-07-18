import "./env";

import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function isNeonUrl(url: string | undefined): url is string {
  return typeof url === "string" && url.includes("neon.tech");
}

const DATABASE_URL = process.env.DATABASE_URL;

// Always use the stateless HTTP adapters — for Neon and for plain Postgres
// (CI/e2e's local service container, or any non-Neon DATABASE_URL). Neither
// supports interactive transactions, so callers must not use nested
// multi-table creates or $transaction([...]) — see lib/actions/auth.ts and
// lib/actions/listings.ts for the sequential-writes pattern used instead.
// The generator's engineType="client" (schema.prisma) requires an adapter
// unconditionally, for every environment, with no native-engine fallback.
function createClient(): PrismaClient {
  const log: ("error" | "warn")[] =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  const adapter = isNeonUrl(DATABASE_URL)
    ? new PrismaNeonHTTP(DATABASE_URL, {})
    : new PrismaPg({ connectionString: DATABASE_URL });
  return new PrismaClient({ adapter, log });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
