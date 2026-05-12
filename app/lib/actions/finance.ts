"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { NBFC } from "@prisma/client";

export async function applyForLoan(data: {
  listingId: string;
  amount: number;
  tenureMonths: number;
  nbfc: NBFC;
  applicantName: string;
  applicantPhone: string;
  applicantPan?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const rate = 0.115;
  const monthlyRate = rate / 12;
  const emi =
    (data.amount * monthlyRate * Math.pow(1 + monthlyRate, data.tenureMonths)) /
    (Math.pow(1 + monthlyRate, data.tenureMonths) - 1);

  await prisma.loanApplication.create({
    data: {
      listingId: data.listingId,
      buyerId: session.user.id,
      nbfc: data.nbfc,
      amount: data.amount,
      tenureMonths: data.tenureMonths,
      monthlyEmi: Math.round(emi * 100) / 100,
      applicantName: data.applicantName,
      applicantPhone: data.applicantPhone,
      applicantPan: data.applicantPan ?? null,
      notes: data.notes ?? null,
    },
  });

  revalidatePath(`/vehicle/${data.listingId}`);
  return { ok: true, emi: Math.round(emi * 100) / 100 };
}

export async function getLoanApplications(listingId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.loanApplication.findMany({
    where: { listingId, buyerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDealerLoanApplications(dealerId: string) {
  return prisma.loanApplication.findMany({
    where: { listing: { dealerId } },
    include: {
      buyer: { select: { name: true, email: true, phone: true } },
      listing: { select: { make: true, model: true, year: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateLoanStatus(
  loanId: string,
  status: "APPROVED" | "REJECTED" | "DISBURSED",
) {
  await prisma.loanApplication.update({
    where: { id: loanId },
    data: { status },
  });
  revalidatePath("/dashboard/loans");
}

export async function updateListingInsurance(
  listingId: string,
  provider: string,
  expiry: string,
) {
  await prisma.listing.update({
    where: { id: listingId },
    data: { insuranceProvider: provider, insuranceExpiry: new Date(expiry) },
  });
  revalidatePath("/dashboard/inventory");
  return { ok: true };
}
