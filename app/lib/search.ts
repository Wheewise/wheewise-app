import { prisma } from "./db";
import { Prisma, FuelType, Transmission } from "@prisma/client";

const FUEL_VALUES = new Set<string>(Object.values(FuelType));
const TRANSMISSION_VALUES = new Set<string>(Object.values(Transmission));

export interface SearchFilters {
  q?: string;
  vehicleType?: "CAR" | "BIKE";
  make?: string;
  model?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  fuelType?: string;
  transmission?: string;
  page?: number;
  limit?: number;
}

export async function searchListings(filters: SearchFilters) {
  const {
    q,
    vehicleType,
    make,
    model,
    city,
    minPrice,
    maxPrice,
    fuelType,
    transmission,
    page = 1,
    limit = 20,
  } = filters;

  const where: Prisma.ListingWhereInput = {
    status: "ACTIVE",
  };

  if (q) {
    // Basic PostgreSQL full-text search implementation using Prisma
    // We combine fields we want to search over
    where.OR = [
      { make: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }

  if (vehicleType) where.vehicleType = vehicleType;
  if (make) where.make = { equals: make, mode: "insensitive" };
  if (model) where.model = { equals: model, mode: "insensitive" };
  if (city) where.city = { equals: city, mode: "insensitive" };
  if (fuelType && FUEL_VALUES.has(fuelType)) {
    where.fuelType = fuelType as FuelType;
  }
  if (transmission && TRANSMISSION_VALUES.has(transmission)) {
    where.transmission = transmission as Transmission;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.askingPrice = {};
    if (minPrice !== undefined) where.askingPrice.gte = minPrice;
    if (maxPrice !== undefined) where.askingPrice.lte = maxPrice;
  }

  const skip = (page - 1) * limit;

  // We sort by 'isBoosted' first to ensure premium listings appear at the top,
  // then by creation date. In a full Elasticsearch setup we'd have a complex ranking score.
  const orderBy: Prisma.ListingOrderByWithRelationInput[] = [
    { isBoosted: "desc" },
    { createdAt: "desc" },
  ];

  const [total, listings] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        photos: { take: 1, orderBy: { sortOrder: "asc" } },
        dealer: { select: { businessName: true } },
        inspections: {
          where: { status: "COMPLETED" },
          select: { overallScore: true },
          take: 1,
        },
      },
    }),
  ]);

  return {
    data: listings,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
