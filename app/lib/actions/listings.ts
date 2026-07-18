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
  const { ensureDescription } = await import("@/lib/ai-description");
  const finalDescription = await ensureDescription(data.description, {
    vehicleType: data.vehicleType,
    make: data.make,
    model: data.model,
    year: data.year,
    fuelType: data.fuelType,
    transmission: data.transmission,
    odometerKm: data.odometerKm,
    askingPrice: data.askingPrice,
    city: data.city,
  });

  // Sequential creates rather than one nested Listing->Photos/Photos360
  // write: a nested create needs an interactive transaction, which Neon's
  // HTTP-mode adapter (used in every environment now — see lib/db.ts) can't
  // provide. Each call below is one independent INSERT.
  const listing = await prisma.listing.create({
    data: {
      ...data,
      description: finalDescription,
      dealerId: dealer.id,
    },
  });

  if (photoUrls.length > 0) {
    await prisma.listingPhoto.createMany({
      data: photoUrls.map((url, i) => ({ listingId: listing.id, url, sortOrder: i })),
    });
  }
  if (photo360.length > 0) {
    await prisma.listing360Photo.createMany({
      data: photo360.map((p) => ({ listingId: listing.id, url: p.url, angle: p.angle })),
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
  revalidatePath(`/s/${dealer.store?.slug}/showcase`);
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
  const { ensureDescription } = await import("@/lib/ai-description");
  const finalDescription = await ensureDescription(data.description, {
    vehicleType: data.vehicleType,
    make: data.make,
    model: data.model,
    year: data.year,
    fuelType: data.fuelType,
    transmission: data.transmission,
    odometerKm: data.odometerKm,
    askingPrice: data.askingPrice,
    city: data.city,
  });

  // Fetch existing photos to diff against — only delete/create what changed
  const existingPhotos = await prisma.listingPhoto.findMany({
    where: { listingId },
    select: { id: true, url: true },
    orderBy: { sortOrder: "asc" },
  });

  const existingUrls = new Set(existingPhotos.map((p) => p.url));
  const incomingUrls = new Set(photoUrls);

  const toDelete = existingPhotos
    .filter((p) => !incomingUrls.has(p.url))
    .map((p) => p.id);
  const toAdd = photoUrls
    .map((url, i) => ({ url, sortOrder: i }))
    .filter((p) => !existingUrls.has(p.url));

  // Fetch existing 360 photos
  const existing360 = await prisma.listing360Photo.findMany({
    where: { listingId },
    select: { id: true, url: true },
  });
  const existing360Urls = new Set(existing360.map((p) => p.url));
  const incoming360Urls = new Set(photo360.map((p) => p.url));
  const toDelete360 = existing360
    .filter((p) => !incoming360Urls.has(p.url))
    .map((p) => p.id);
  const toAdd360 = photo360.filter((p) => !existing360Urls.has(p.url));

  // Sequential operations rather than $transaction([...]): Neon's HTTP-mode
  // adapter (used in every environment now — see lib/db.ts) can't run
  // interactive transactions. Same ordering as before, just not atomic.
  await prisma.listing.update({
    where: { id: listingId },
    data: {
      ...data,
      description: finalDescription,
    },
  });

  if (toDelete.length > 0) {
    await prisma.listingPhoto.deleteMany({ where: { id: { in: toDelete } } });
  }
  if (toAdd.length > 0) {
    await prisma.listingPhoto.createMany({
      data: toAdd.map((p) => ({ listingId, url: p.url, sortOrder: p.sortOrder })),
    });
  }
  for (const [index, url] of photoUrls.entries()) {
    const photoId = existingPhotos.find((p) => p.url === url)?.id;
    if (!photoId) continue;
    await prisma.listingPhoto.update({ where: { id: photoId }, data: { sortOrder: index } });
  }
  if (toDelete360.length > 0) {
    await prisma.listing360Photo.deleteMany({ where: { id: { in: toDelete360 } } });
  }
  if (toAdd360.length > 0) {
    await prisma.listing360Photo.createMany({
      data: toAdd360.map((p) => ({ listingId, url: p.url, angle: p.angle })),
    });
  }

  // Log orphaned photo count for future cleanup job
  if (toDelete.length > 0) {
    console.info(
      `[listing-update] ${toDelete.length} orphaned photo(s) for listing ${listingId} — queue R2 cleanup`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
  revalidatePath(`/dashboard/inventory/${listingId}/edit`);
  revalidatePath(`/s/${dealer.store?.slug}/showcase`);
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
  revalidatePath(`/s/${dealer.store?.slug}/showcase`);
}

export async function deleteListing(listingId: string) {
  const { dealer } = await requireDealer();
  await prisma.listing.deleteMany({
    where: { id: listingId, dealerId: dealer.id },
  });
  revalidatePath("/dashboard/inventory");
  revalidatePath(`/s/${dealer.store?.slug}/showcase`);
}
