import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// Geist is Vercel's typeface — the admin console mirrors the Vercel dashboard look.
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Chaos Closet Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `dark` enables shadcn's dark: variants; `admin-theme` (app/globals.css) sets the Vercel palette.
    <div className={`dark admin-theme ${geist.variable} ${geistMono.variable} min-h-dvh bg-background text-foreground antialiased`}>
      {/* next/font defines --font-geist on the wrapper only; portals (Select, DropdownMenu) live in <body>.
          dangerouslySetInnerHTML because React would entity-escape the quotes in the family name, and
          <style> doesn't decode entities. The value comes from next/font, never from user input. */}
      <style dangerouslySetInnerHTML={{ __html: `:root:has(.admin-theme){--font-geist:${geist.style.fontFamily}}` }} />
      {children}
    </div>
  );
}
