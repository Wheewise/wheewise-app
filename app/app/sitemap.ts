import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://wheewise.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stores, listings] = await Promise.all([
    prisma.store.findMany({
      select: { slug: true, updatedAt: true },
    }),
    prisma.listing.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
  ]).catch(
    () =>
      [[], []] as [
        { slug: string; updatedAt: Date }[],
        { id: string; updatedAt: Date }[],
      ],
  );

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/browse`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/signup/dealer`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const storeUrls: MetadataRoute.Sitemap = stores.map((s) => ({
    url: `${BASE}/s/${s.slug}/showcase`,
    lastModified: s.updatedAt,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const listingUrls: MetadataRoute.Sitemap = listings.map((l) => ({
    url: `${BASE}/vehicle/${l.id}`,
    lastModified: l.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticUrls, ...storeUrls, ...listingUrls];
}
