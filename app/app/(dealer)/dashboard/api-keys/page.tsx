import { requireDealer } from "@/lib/dealer";
import { prisma } from "@/lib/db";
import { ApiKeyManager } from "./ApiKeyManager";

export default async function ApiKeysPage() {
  const { dealer } = await requireDealer();

  const keys = await prisma.apiKey.findMany({
    where: { dealerId: dealer.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage API keys for programmatic access to your inventory data.
        </p>
      </div>
      <ApiKeyManager
        existingKeys={keys.map((k) => ({
          id: k.id,
          name: k.name,
          key: k.key,
          lastUsedAt: k.lastUsedAt,
          createdAt: k.createdAt,
        }))}
      />
    </div>
  );
}
