import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Logo } from "@/components/brand/Logo";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="bg-surface-muted min-h-screen">
      <aside className="border-border-default bg-background fixed inset-y-0 left-0 hidden w-60 flex-col border-r lg:flex">
        <div className="border-border-default flex h-16 items-center border-b px-5">
          <Logo variant="wordmark" size={24} href="/admin" />
          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase">
            Admin
          </span>
        </div>
        <nav className="flex-1 px-3 py-4">
          <AdminNav />
        </nav>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="border-border-default border-t p-3"
        >
          <div className="truncate px-2 pb-2 text-xs text-zinc-500">
            {session.user.email}
          </div>
          <button
            type="submit"
            className="text-foreground hover:bg-surface-muted w-full rounded-md px-3 py-2 text-left text-sm"
          >
            Sign out
          </button>
        </form>
      </aside>

      <header className="border-border-default bg-background sticky top-0 z-10 flex h-14 items-center justify-between border-b px-4 lg:hidden">
        <Logo variant="wordmark" size={22} href="/admin" />
        <Link href="/admin" className="text-sm font-medium text-amber-700">
          Admin
        </Link>
      </header>

      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
