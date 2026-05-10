import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function requireDealer({
  allowPaywalled = false,
}: { allowPaywalled?: boolean } = {}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "DEALER") redirect("/");

  const dealer = await prisma.dealer.findUnique({
    where: { userId: session.user.id },
    include: { store: true, subscription: true },
  });
  if (!dealer) redirect("/login");

  if (!allowPaywalled) {
    const status = dealer.subscription?.status;
    if (status === "PAST_DUE" || status === "CANCELLED") {
      redirect("/dashboard/billing");
    }
  }

  return { session, dealer };
}
