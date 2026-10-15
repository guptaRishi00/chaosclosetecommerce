import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { Suspense } from "react";
import { NavProgress } from "@/components/site/nav-progress";
import { getSiteUrl, isIndexableDeployment } from "@/lib/seo";
import "./globals.css";

// Unbounded: wide, Y2K display face that echoes the logo — headings only.
// Manrope: clean geometric sans for body/UI text.
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: "Chaos Closet | Thrift and streetwear", template: "%s | Chaos Closet" },
  description: "Shop thrift and surplus clothing, streetwear, jeans, shirts and more at Chaos Closet. Cash on delivery and free shipping in Dibrugarh.",
  applicationName: "Chaos Closet",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Chaos Closet",
    title: "Chaos Closet | Thrift and streetwear",
    description: "Shop thrift and surplus clothing, streetwear, jeans, shirts and more at Chaos Closet. Cash on delivery and free shipping in Dibrugarh.",
    url: "/",
    images: [{ url: "/logo-wordmark.png", alt: "Chaos Closet" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chaos Closet | Thrift and streetwear",
    description: "Shop thrift and surplus clothing, streetwear, jeans, shirts and more at Chaos Closet.",
    images: ["/logo-wordmark.png"],
  },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || "-jHGWbl7Lbc8attcrCOkpgYU1INn5_ETkIn5xTlRFt4" },
  robots: isIndexableDeployment()
    ? { index: true, follow: true, googleBot: { index: true, follow: true } }
    : { index: false, follow: false, googleBot: { index: false, follow: false } },
  appleWebApp: { capable: true, title: "Chaos Closet" },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export const viewport: Viewport = { themeColor: "#f4efe7" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${unbounded.variable} ${manrope.variable}`}>
      <body className="font-sans antialiased">
        {/* Suspense: useSearchParams must not force static pages into client rendering */}
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
