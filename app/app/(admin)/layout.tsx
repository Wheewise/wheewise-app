import Link from "next/link";
import { signOut } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-auth";
import { Logo } from "@/components/brand/Logo";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="bg-surface-muted min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-zinc-800 bg-zinc-950 lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-5">
          <Logo variant="wordmark" size={24} href="/admin" />
          <span className="rounded bg-[#E8192C]/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[#E8192C] uppercase">
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
          className="border-t border-zinc-800 p-3"
        >
          <div className="truncate px-2 pb-2 text-xs text-zinc-500">{user.email}</div>
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
          >
            Sign out
          </button>
        </form>
      </aside>

      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 lg:hidden">
        <Logo variant="wordmark" size={22} href="/admin" />
        <Link href="/admin" className="text-sm font-medium text-[#E8192C]">
          Admin
        </Link>
      </header>

      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
