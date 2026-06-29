"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireDealer } from "@/lib/dealer";

export async function setLeadFlags(
  leadId: string,
  flags: { isRead?: boolean; isContacted?: boolean },
) {
  const { dealer } = await requireDealer();
  await prisma.enquiry.updateMany({
    where: { id: leadId, dealerId: dealer.id },
    data: flags,
  });
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
}
