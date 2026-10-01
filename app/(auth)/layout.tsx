import Image from "next/image";
import { PiStarFourFill } from "react-icons/pi";
import { SiteHeader } from "@/components/site/site-header";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      {/* -mt tucks both columns under the translucent sticky navbar (h-16 + 1px border) */}
      <div className="-mt-[calc(4rem+1px)] grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* Editorial panel: desktop only, edge to edge, pinned while the form scrolls */}
        <aside className="relative hidden lg:block">
          <div className="sticky top-0 h-dvh overflow-hidden bg-black">
            <Image
              src="/hero/auth.webp"
              alt=""
              fill
              priority
              sizes="45vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-10 text-white xl:p-14">
              <PiStarFourFill aria-hidden className="size-5 text-brand-red" />
              <p className="max-w-sm font-heading text-2xl leading-tight font-extrabold uppercase xl:text-3xl">
                Made for the <span className="text-brand-cream">beautifully chaotic.</span>
              </p>
              <p className="text-sm text-white/75">Free shipping anywhere in Dibrugarh.</p>
            </div>
          </div>
        </aside>

        <main className="flex justify-center px-5 pt-24 pb-14 sm:px-8 lg:pt-28">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
