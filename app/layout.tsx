import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { Suspense } from "react";
import { NavProgress } from "@/components/site/nav-progress";
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
  title: { default: "Chaos Closet", template: "%s · Chaos Closet" },
  description: "Streetwear and fashion from Dibrugarh. Free shipping in Dibrugarh.",
};

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
