"use client";

import { useEffect, useRef, useState } from "react";
import { getImageProps } from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  /** Desktop / tablet image (landscape). */
  src: string;
  /** Phone image (portrait, ~9:16) for screens under 768px. Falls back to `src`. */
  mobileSrc?: string;
  alt: string;
  eyebrow: string;
  title: string;
  cta: { label: string; href: string };
};

const MOBILE = "(max-width: 767px)";

/**
 * Art-directed hero image: a portrait photo on phones, the landscape one above. <picture>
 * lets the browser download only the matching image (two <Image>s toggled with CSS would
 * fetch both). getImageProps keeps next/image's optimised srcsets for each source.
 */
function HeroImage({ slide, priority }: { slide: HeroSlide; priority: boolean }) {
  // getImageProps drops `priority` (no preload link), so mark the LCP slide directly.
  const common = {
    alt: slide.alt,
    fill: true,
    sizes: "100vw",
    loading: priority ? ("eager" as const) : ("lazy" as const),
    fetchPriority: priority ? ("high" as const) : undefined,
  };
  const { props: desktop } = getImageProps({ ...common, src: slide.src });
  const {
    props: { srcSet: mobileSrcSet },
  } = getImageProps({ ...common, src: slide.mobileSrc ?? slide.src });
  return (
    <picture>
      <source media={MOBILE} srcSet={mobileSrcSet} />
      <img {...desktop} alt={slide.alt} className="object-cover" />
    </picture>
  );
}

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  // Starts on every (re)init — Embla re-inits plugins on resize and under StrictMode — and
  // Embla's media-query `breakpoints` switch it off entirely for reduced-motion users.
  const autoplay = useRef(
    Autoplay({
      delay: 5000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      stopOnFocusIn: true,
      breakpoints: { "(prefers-reduced-motion: reduce)": { active: false } },
    }),
  );
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    // Edge to edge, pulled up under the translucent sticky navbar (navbar h-16 + 1px border).
    // Height fills the viewport below the announcement bar (~1.75rem).
    <section aria-label="Featured collections" className="relative -mt-[calc(4rem+1px)] w-full">
      <Carousel setApi={setApi} opts={{ loop: true }} plugins={[autoplay.current]} className="group">
        {/* ml-0/pl-0 remove shadcn's default slide gutter so slides butt edge to edge */}
        <CarouselContent className="ml-0">
          {slides.map((slide, i) => (
            <CarouselItem key={slide.src} aria-label={`${i + 1} of ${slides.length}`} className="pl-0">
              <div className="relative h-[calc(100svh-1.75rem)] max-h-[960px] min-h-[520px] overflow-hidden bg-black">
                <HeroImage slide={slide} priority={i === 0} />
                {/* Bottom-up scrim only where the lockup sits; the rest of the photo stays untouched */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                {/* Campaign lockup, bottom-left on the navbar's gutter so it lines up with the logo */}
                <div className="absolute inset-0 flex w-full flex-col items-start justify-end gap-3 px-3 pt-16 pb-16 text-white sm:px-5 sm:pb-20 lg:px-8 lg:pb-24">
                  <p className="text-xs font-semibold tracking-[0.2em] text-brand-cream uppercase">{slide.eyebrow}</p>
                  <h2 className="max-w-[14ch] font-heading text-4xl leading-[0.95] font-extrabold text-balance uppercase sm:text-6xl lg:text-7xl">
                    {slide.title}
                  </h2>
                  <Button
                    asChild
                    size="lg"
                    className="mt-3 h-10 rounded-full bg-white px-6 text-sm font-semibold text-ink hover:bg-brand-cream active:scale-[0.98] sm:h-12 sm:px-8 sm:text-base"
                  >
                    <Link href={slide.cta.href}>{slide.cta.label}</Link>
                  </Button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious
          variant="secondary"
          size="icon-lg"
          className="left-4 hidden bg-white text-ink opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white sm:inline-flex"
        />
        <CarouselNext
          variant="secondary"
          size="icon-lg"
          className="right-4 hidden bg-white text-ink opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white sm:inline-flex"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-6 sm:bottom-8">
          <div className="flex w-full gap-2 px-3 sm:px-5 lg:px-8">
            {slides.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => api?.scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current}
                className={cn(
                  "pointer-events-auto h-1.5 rounded-full transition-all",
                  i === current ? "w-8 bg-white" : "w-4 bg-white/45 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        </div>
      </Carousel>
    </section>
  );
}
