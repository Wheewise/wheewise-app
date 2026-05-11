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
  const photo360Raw = formData.getAll("photo360Urls").map(String).filter(Boolean);
  const photo360 = photo360Raw
    .map((s) => {
      try {
        const { url, angle } = JSON.parse(s) as { url: string; angle: number };
        if (typeof url === "string" && typeof angle === "number") return { url, angle };
      } catch {
        // ignore malformed
      }
      return null;
    })
    .filter(Boolean) as { url: string; angle: number }[];

  const transmissionRaw = formData.get("transmission");
  return {
    parsed: listingSchema.safeParse({
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
    }),
    photo360,
  };
}

export async function createListing(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const { dealer } = await requireDealer();
  const { parsed, photo360 } = parseFromForm(formData);
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
      photos360:
        photo360.length > 0
          ? { create: photo360.map((p) => ({ url: p.url, angle: p.angle })) }
          : undefined,
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

  const { parsed, photo360 } = parseFromForm(formData);
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
    prisma.listing360Photo.deleteMany({ where: { listingId } }),
    ...(photo360.length > 0
      ? [
          prisma.listing360Photo.createMany({
            data: photo360.map((p) => ({ listingId, url: p.url, angle: p.angle })),
          }),
        ]
      : []),
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
