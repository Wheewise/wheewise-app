import Image from "next/image";
import Link from "next/link";

export function Logo({
  variant = "wordmark",
  size = 32,
  href = "/",
}: {
  variant?: "wordmark" | "mark";
  size?: number;
  href?: string | null;
}) {
  const src = variant === "wordmark" ? "/brand/wordmark.png" : "/brand/wheewise.png";
  const width = variant === "wordmark" ? size * 4 : size;
  const img = (
    <Image
      src={src}
      alt="Wheewise"
      width={width}
      height={size}
      priority
      style={{ height: size, width: "auto" }}
    />
  );
  return href ? (
    <Link href={href} className="inline-flex items-center">
      {img}
    </Link>
  ) : (
    img
  );
}
