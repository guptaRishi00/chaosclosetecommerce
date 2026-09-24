import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { Button } from "@/components/ui/button";
import { NavCount } from "@/components/site/nav-counts";

function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Button asChild variant="ghost" size="icon-lg" className="relative size-9 rounded-full sm:size-10 hover:bg-brand-cream">
      <Link href={href} aria-label={label} title={label}>
        {children}
      </Link>
    </Button>
  );
}

/** Server Component: reads the session cookie to choose between auth buttons and the account link. */
export async function Navbar() {
  const session = await getCurrentUser(); // DB-checked: a deleted account shows as logged out

  return (
    // Translucent + blurred: pages tuck content (hero, auth image) up under it with -mt-[calc(4rem+1px)] (h-16 + border).
    <header className="sticky top-0 z-40 border-b border-white/30 bg-white/90 shadow-[0_1px_0_rgb(0_0_0/0.04)] supports-[backdrop-filter]:bg-white/55 supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150">
      <nav aria-label="Main" className="flex h-16 w-full items-center justify-between gap-4 px-3 sm:px-5 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="Chaos Closet home">
          <Image
            src="/logo-wordmark.png"
            alt="Chaos Closet"
            width={576}
            height={133}
            priority
            sizes="160px"
            className="h-8 w-auto sm:h-9"
          />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <IconLink href="/wishlist" label="Wishlist">
            <Heart className="size-5" strokeWidth={1.75} />
            <NavCount kind="wishlist" />
          </IconLink>
          <IconLink href="/cart" label="Shopping bag">
            <ShoppingBag className="size-5" strokeWidth={1.75} />
            <NavCount kind="bag" />
          </IconLink>

          <span aria-hidden className="mx-1 hidden h-6 w-px bg-black/15 sm:block" />

          {session ? (
            <IconLink href="/dashboard" label="Your account">
              <UserRound className="size-5" strokeWidth={1.75} />
            </IconLink>
          ) : (
            <>
              {/* Phones: one account icon; text buttons from sm up */}
              <span className="sm:hidden">
                <IconLink href="/login" label="Log in">
                  <UserRound className="size-5" strokeWidth={1.75} />
                </IconLink>
              </span>
              <Button asChild variant="ghost" size="lg" className="hidden px-4 font-semibold hover:bg-brand-cream sm:inline-flex">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="lg" className="hidden bg-black px-4 font-semibold text-white hover:bg-brand-red sm:inline-flex">
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
