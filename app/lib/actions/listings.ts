"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireDealer } from "@/lib/dealer";
import { listingSchema } from "@/lib/validators/listing";

export type ListingActionState =
  | { ok: false; errors: Record<string, string[]>; formError?: string }
  | { ok: true }
  | undefined;

function parseFromForm(formData: FormData) {
  const photoUrls = formData.getAll("photoUrls").map(String).filter(Boolean);
  const transmissionRaw = formData.get("transmission");
  return listingSchema.safeParse({
    vehicleType: formData.get("vehicleType"),
    make: formData.get("make"),
    model: formData.get("model"),
    year: formData.get("year"),
    fuelType: formData.get("fuelType"),
    transmission: transmissionRaw ? transmissionRaw : undefined,
    odometerKm: formData.get("odometerKm"),
    askingPrice: formData.get("askingPrice"),
    description: formData.get("description"),
    city: formData.get("city"),
    photoUrls,
  });
}

export async function createListing(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const { dealer } = await requireDealer();
  const parsed = parseFromForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { photoUrls, ...data } = parsed.data;
  const listing = await prisma.listing.create({
    data: {
      ...data,
      dealerId: dealer.id,
      photos: {
        create: photoUrls.map((url, i) => ({ url, sortOrder: i })),
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
  revalidatePath(`/s/${dealer.store?.slug}`);
  redirect(`/dashboard/inventory/${listing.id}/edit?created=1`);
}

export async function updateListing(
  listingId: string,
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const { dealer } = await requireDealer();
  const existing = await prisma.listing.findFirst({
    where: { id: listingId, dealerId: dealer.id },
    select: { id: true },
  });
  if (!existing) return { ok: false, errors: {}, formError: "Listing not found" };

  const parsed = parseFromForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { photoUrls, ...data } = parsed.data;
  await prisma.$transaction([
    prisma.listing.update({
      where: { id: listingId },
      data,
    }),
    prisma.listingPhoto.deleteMany({ where: { listingId } }),
    prisma.listingPhoto.createMany({
      data: photoUrls.map((url, i) => ({ listingId, url, sortOrder: i })),
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
  revalidatePath(`/dashboard/inventory/${listingId}/edit`);
  revalidatePath(`/s/${dealer.store?.slug}`);
  revalidatePath(`/vehicle/${listingId}`);
  return { ok: true };
}

export async function setListingStatus(
  listingId: string,
  status: "ACTIVE" | "SOLD" | "PAUSED",
) {
  const { dealer } = await requireDealer();
  await prisma.listing.updateMany({
    where: { id: listingId, dealerId: dealer.id },
    data: { status },
  });
  revalidatePath("/dashboard/inventory");
  revalidatePath(`/s/${dealer.store?.slug}`);
}

export async function deleteListing(listingId: string) {
  const { dealer } = await requireDealer();
  await prisma.listing.deleteMany({
    where: { id: listingId, dealerId: dealer.id },
  });
  revalidatePath("/dashboard/inventory");
  revalidatePath(`/s/${dealer.store?.slug}`);
}
