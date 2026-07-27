import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/brand/Logo";
import { EditProfileForm } from "./EditProfileForm";

export const metadata: Metadata = { title: "Edit Profile" };

export default async function EditProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fprofile%2Fedit");
  }
  if (session.user.role !== "BUYER") {
    redirect("/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, phone: true, district: true, state: true },
  });

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo variant="wordmark" size={26} href="/browse" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Edit Profile</h1>
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <EditProfileForm
            initial={{
              name: user?.name ?? "",
              phone: user?.phone ?? "",
              district: user?.district ?? "",
              state: user?.state ?? "",
            }}
          />
        </div>
      </div>
    </div>
  );
}
