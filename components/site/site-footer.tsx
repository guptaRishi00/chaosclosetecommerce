import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog";
import { NewsletterForm } from "@/components/site/newsletter-form";

/**
 * Pre-footer newsletter band + footer (layout after Bonkers Corner / Urban Monkey).
 * Only links to pages that exist; no invented phone numbers, addresses or social handles.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <>
      <section aria-labelledby="newsletter-heading" className="bg-brand-red text-white">
        <div className="flex w-full flex-col gap-6 px-3 py-12 sm:px-5 md:flex-row md:items-end md:justify-between md:py-16 lg:px-8">
          <div className="max-w-xl">
            <h2 id="newsletter-heading" className="font-heading text-2xl leading-tight font-extrabold uppercase sm:text-4xl">
              Join the closet
            </h2>
            <p className="mt-2 text-sm text-white/85 sm:text-base">New drops and restocks, straight to your inbox. No spam.</p>
          </div>
          <NewsletterForm />
        </div>
      </section>

      <footer className="bg-black text-brand-cream">
        <div className="grid w-full grid-cols-2 gap-x-6 gap-y-10 px-3 py-14 sm:px-5 md:grid-cols-4 lg:px-8">
          <div className="col-span-2 flex flex-col gap-4">
            <Link href="/" aria-label="Chaos Closet home" className="w-fit">
              <Image src="/logo-wordmark.png" alt="Chaos Closet" width={576} height={133} className="h-9 w-auto invert" />
            </Link>
            <p className="max-w-xs text-sm text-brand-cream/60">Streetwear from Dibrugarh, Assam. Cash on delivery, free shipping across the district.</p>
          </div>

          <nav aria-labelledby="footer-shop" className="flex flex-col gap-3">
            <h2 id="footer-shop" className="text-xs font-bold tracking-widest text-white uppercase">
              Shop
            </h2>
            <ul className="flex flex-col gap-2 text-sm">
              {CATEGORIES.map((c) => (
                <li key={c.value}>
                  <Link href={`/shop/${c.value}`} className="text-brand-cream/70 transition-colors hover:text-white">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-help" className="flex flex-col gap-3">
            <h2 id="footer-help" className="text-xs font-bold tracking-widest text-white uppercase">
              Your closet
            </h2>
            <ul className="flex flex-col gap-2 text-sm">
              {[
                ["My account", "/dashboard"],
                ["My orders", "/dashboard#orders"],
                ["Wishlist", "/wishlist"],
                ["Shopping bag", "/cart"],
                ["Log in", "/login"],
                ["Create account", "/register"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-brand-cream/70 transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex w-full flex-col gap-2 border-t border-white/10 px-3 py-6 text-xs text-brand-cream/50 sm:flex-row sm:justify-between sm:px-5 lg:px-8">
          <p>© {year} Chaos Closet. All rights reserved.</p>
          <p>Cash on delivery · Free shipping in Dibrugarh</p>
        </div>
      </footer>
    </>
  );
}
