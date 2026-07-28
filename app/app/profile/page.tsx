import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fprofile");
  }
  if (session.user.role !== "BUYER") {
    redirect("/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, phone: true, email: true, district: true, state: true },
  });

  const location = [user?.district, user?.state].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo variant="wordmark" size={26} href="/browse" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">My Profile</h1>

        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-zinc-500">Name</dt>
              <dd className="mt-0.5 font-medium text-white">{user?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Phone number</dt>
              <dd className="mt-0.5 font-medium text-white">{user?.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Location</dt>
              <dd className="mt-0.5 font-medium text-white">{location || "—"}</dd>
            </div>
          </dl>

          <Link
            href="/profile/edit"
            className="mt-6 inline-block rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Edit profile
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            href="/wishlist"
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm font-medium text-white hover:border-zinc-700"
          >
            My Wishlist →
          </Link>
          <Link
            href="/my-enquiries"
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm font-medium text-white hover:border-zinc-700"
          >
            My Enquiries →
          </Link>
          <Link
            href="/my-test-drives"
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm font-medium text-white hover:border-zinc-700"
          >
            My Test Drives →
          </Link>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="mt-6"
        >
          <button
            type="submit"
            className="w-full rounded-md border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-900"
          >
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
