"use client";

import { useState } from "react";
import Image from "next/image";
import { Shirt } from "lucide-react";
import { cn } from "@/lib/utils";

/** Desktop: large image + thumbnail rail. Phones: swipeable scroll-snap strip (no JS carousel). */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center bg-brand-cream text-black/25">
        <Shirt className="size-16" strokeWidth={1} aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Phones: horizontal swipe */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:hidden" aria-label={`${name} photos`}>
        {images.map((src, i) => (
          <div key={src} className="relative aspect-[4/5] w-[85%] shrink-0 snap-center overflow-hidden bg-brand-cream">
            <Image src={src} alt={`${name}, photo ${i + 1} of ${images.length}`} fill priority={i === 0} sizes="85vw" className="object-cover" />
          </div>
        ))}
      </div>

      {/* Tablet/desktop: main image + thumbnails */}
      <div className="hidden md:flex md:flex-col md:gap-3">
        <div className="relative aspect-[4/5] overflow-hidden bg-brand-cream">
          <Image src={images[active]} alt={`${name}, photo ${active + 1} of ${images.length}`} fill priority sizes="(min-width: 1024px) 50vw, 60vw" className="object-cover" />
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-6 gap-2">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "relative aspect-square overflow-hidden bg-brand-cream outline-none focus-visible:ring-2 focus-visible:ring-brand-red",
                  i === active ? "ring-2 ring-black" : "opacity-70 hover:opacity-100",
                )}
              >
                <Image src={src} alt="" fill sizes="96px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
