import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../lib/auth", () => ({ auth: vi.fn() }));
vi.mock("../../lib/db", () => ({
  prisma: {
    dealer: { findUnique: vi.fn() },
    listing: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));

import { setListingStatus, deleteListing } from "../../lib/actions/listings";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/db";

type M = ReturnType<typeof vi.fn>;
const authMock = auth as unknown as M;
const dealerFindUnique = prisma.dealer.findUnique as unknown as M;
const listingUpdateMany = prisma.listing.updateMany as unknown as M;
const listingDeleteMany = prisma.listing.deleteMany as unknown as M;

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({
    user: { id: "user_A", role: "DEALER" },
  });
  dealerFindUnique.mockResolvedValue({
    id: "dealer_A",
    store: { slug: "a" },
    subscription: {
      status: "ACTIVE",
      currentPeriodEnd: new Date(Date.now() + 86_400_000),
    },
  });
  listingUpdateMany.mockResolvedValue({ count: 1 });
  listingDeleteMany.mockResolvedValue({ count: 1 });
});

describe("setListingStatus — IDOR scoping", () => {
  it("scopes the updateMany to (listingId AND dealerId)", async () => {
    await setListingStatus("listing_X", "SOLD");
    expect(listingUpdateMany).toHaveBeenCalledWith({
      where: { id: "listing_X", dealerId: "dealer_A" },
      data: { status: "SOLD" },
    });
  });

  it("silently no-ops on someone else's listing (updateMany returns count: 0)", async () => {
    listingUpdateMany.mockResolvedValue({ count: 0 });
    await expect(setListingStatus("dealer_B_listing", "ACTIVE")).resolves.toBeUndefined();
    // Where clause still includes the caller's dealerId — Prisma returns 0
    // updated rows because the row's dealerId doesn't match. No throw.
    const call = listingUpdateMany.mock.calls[0][0];
    expect(call.where.dealerId).toBe("dealer_A");
  });

  it("redirects unauthenticated callers via requireDealer", async () => {
    authMock.mockResolvedValue(null);
    await expect(setListingStatus("listing_X", "SOLD")).rejects.toThrow(
      "REDIRECT:/login",
    );
    expect(listingUpdateMany).not.toHaveBeenCalled();
  });

  it("redirects BUYER callers off the dashboard", async () => {
    authMock.mockResolvedValue({ user: { id: "u", role: "BUYER" } });
    await expect(setListingStatus("listing_X", "SOLD")).rejects.toThrow("REDIRECT:/");
    expect(listingUpdateMany).not.toHaveBeenCalled();
  });
});

describe("deleteListing — IDOR scoping", () => {
  it("scopes deleteMany to (listingId AND dealerId)", async () => {
    await deleteListing("listing_Y");
    expect(listingDeleteMany).toHaveBeenCalledWith({
      where: { id: "listing_Y", dealerId: "dealer_A" },
    });
  });

  it("redirects callers to billing when subscription is PAST_DUE", async () => {
    dealerFindUnique.mockResolvedValue({
      id: "dealer_A",
      store: { slug: "a" },
      subscription: { status: "PAST_DUE", currentPeriodEnd: new Date() },
    });
    await expect(deleteListing("listing_Y")).rejects.toThrow(
      "REDIRECT:/dashboard/billing",
    );
    expect(listingDeleteMany).not.toHaveBeenCalled();
  });

  it("redirects when subscription period has lapsed even with ACTIVE status", async () => {
    dealerFindUnique.mockResolvedValue({
      id: "dealer_A",
      store: { slug: "a" },
      subscription: {
        status: "ACTIVE",
        currentPeriodEnd: new Date(Date.now() - 86_400_000),
      },
    });
    await expect(deleteListing("listing_Y")).rejects.toThrow(
      "REDIRECT:/dashboard/billing",
    );
  });
});
