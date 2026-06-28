import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BrandIntro } from "@/components/common/BrandIntro";
import { CookieConsent } from "@/components/ui/CookieConsent";
import { Footer } from "@/components/brand/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wheewise.com"),
  title: {
    default: "Wheewise — Where Smart Wheels Begin",
    template: "%s · Wheewise",
  },
  description:
    "India's dealer-first marketplace for pre-owned cars and bikes. One shareable link for your entire showroom — verified buyers, zero commission.",
  openGraph: {
    type: "website",
    siteName: "Wheewise",
    images: ["/brand/wheewise.png"],
  },
  icons: {
    icon: "/brand/wheewise.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <BrandIntro />
        {children}
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
