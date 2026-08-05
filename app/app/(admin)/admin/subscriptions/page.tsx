import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminSubscriptionsPage() {
  await requireAdmin();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
      <p className="text-sm text-zinc-500">Coming next.</p>
    </div>
  );
}
