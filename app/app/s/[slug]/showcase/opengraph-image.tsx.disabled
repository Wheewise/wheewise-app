import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { computeTrustScore, scoreToStars, scoreLabel } from "@/lib/trust-score";

export const alt = "Wheewise dealer showroom";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug },
    include: { dealer: true },
  });

  if (!store) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "white",
          fontSize: 64,
          fontWeight: 700,
        }}
      >
        Showroom not found
      </div>,
      size,
    );
  }

  const dealer = store.dealer;
  const accent = store.primaryColor || "#dc2626";

  const [activeCount, soldCount] = await Promise.all([
    prisma.listing.count({ where: { dealerId: store.dealerId, status: "ACTIVE" } }),
    prisma.listing.count({ where: { dealerId: store.dealerId, status: "SOLD" } }),
  ]);

  const trustScore = computeTrustScore({
    gstVerified: dealer.gstVerified,
    accountCreatedAt: dealer.createdAt,
    soldCount,
    listingCount: activeCount,
    avgResponseHours: null,
  });

  const stars = scoreToStars(trustScore);
  const label = scoreLabel(trustScore);
  const initial = dealer.businessName[0]?.toUpperCase() ?? "W";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(135deg, ${accent} 0%, #0a0a0a 75%)`,
        color: "white",
        padding: 64,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontSize: 22,
          opacity: 0.85,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "white",
            color: accent,
            fontWeight: 900,
            fontSize: 22,
          }}
        >
          W
        </span>
        Wheewise Showroom
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 48,
          marginTop: 48,
        }}
      >
        {store.logoUrl ? (
          <img
            src={store.logoUrl}
            alt=""
            width={200}
            height={200}
            style={{
              borderRadius: 24,
              border: "4px solid white",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: 24,
              border: "4px solid white",
              background: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 110,
              fontWeight: 900,
            }}
          >
            {initial}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {dealer.gstVerified ? (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                background: "#10b981",
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              ✓ GST Verified
            </div>
          ) : null}

          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: -2,
              display: "flex",
            }}
          >
            {dealer.businessName}
          </div>

          <div
            style={{
              marginTop: 14,
              fontSize: 28,
              opacity: 0.85,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span>📍 {dealer.city}</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span>
              {"★".repeat(stars)}
              {"☆".repeat(5 - stars)}
            </span>
            <span style={{ opacity: 0.85 }}>{label}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 32,
          borderTop: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <div style={{ display: "flex", gap: 48 }}>
          <Stat value={String(activeCount)} label="In stock" />
          <Stat value={String(soldCount)} label="Sold" />
          <Stat value={`${trustScore}/100`} label="Trust score" />
        </div>
        <div style={{ display: "flex", fontSize: 22, opacity: 0.7 }}>wheewise.in</div>
      </div>
    </div>,
    size,
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div
        style={{
          marginTop: 4,
          fontSize: 16,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          opacity: 0.7,
        }}
      >
        {label}
      </div>
    </div>
  );
}
