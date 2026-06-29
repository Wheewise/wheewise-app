import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const templates = await prisma.notificationTemplate.findMany({
    orderBy: { name: "asc" },
  });
  type Template = (typeof templates)[number];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notification templates</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Edit email and SMS templates directly in the database. Use {"{{variable}}"} for
          placeholders.
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="border-border-default bg-background rounded-lg border p-12 text-center text-sm text-zinc-500">
          No templates seeded yet. Run the seed script to create default templates.
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((t: Template) => (
            <div
              key={t.id}
              className="border-border-default bg-background rounded-lg border p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold">{t.name}</span>
                  <span className="bg-surface-muted ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 uppercase">
                    {t.type}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-xs font-medium text-zinc-500">{t.subject}</p>
              <pre className="bg-surface-muted mt-2 rounded-md p-3 text-xs whitespace-pre-wrap text-zinc-700">
                {t.body}
              </pre>
              <p className="mt-2 text-[11px] text-zinc-400">
                Last updated: {new Date(t.updatedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
