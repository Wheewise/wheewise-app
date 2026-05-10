import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { Logo } from "@/components/brand/Logo";
import { DashboardNav } from "./DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "DEALER") redirect("/");

  return (
    <div className="min-h-screen bg-surface-muted">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border-default bg-background lg:flex">
        <div className="flex h-16 items-center px-5 border-b border-border-default">
          <Logo variant="wordmark" size={24} href="/dashboard" />
        </div>
        <nav className="flex-1 px-3 py-4">
          <DashboardNav />
        </nav>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="border-t border-border-default p-3"
        >
          <div className="px-2 pb-2 text-xs text-zinc-500 truncate">
            {session.user.email}
          </div>
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-surface-muted"
          >
            Sign out
          </button>
        </form>
      </aside>

      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border-default bg-background px-4 lg:hidden">
        <Logo variant="wordmark" size={22} href="/dashboard" />
        <Link href="/dashboard" className="text-sm font-medium text-brand-red">
          Dashboard
        </Link>
      </header>

      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
