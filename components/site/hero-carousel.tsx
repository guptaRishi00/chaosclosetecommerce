"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
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
  src: string;
  alt: string;
  eyebrow: string;
  title: string;
  cta: { label: string; href: string };
};

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
                <Image src={slide.src} alt={slide.alt} fill priority={i === 0} sizes="100vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/10 sm:bg-gradient-to-r sm:from-black/65 sm:via-black/20 sm:to-transparent" />
                <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col items-start justify-end gap-3 px-4 pt-16 pb-20 text-white sm:justify-center sm:px-6 sm:pb-16">
                  <p className="text-[11px] font-semibold tracking-[0.25em] text-brand-cream uppercase">{slide.eyebrow}</p>
                  <h2 className="max-w-2xl font-heading text-3xl leading-[1.05] font-extrabold text-balance uppercase sm:text-5xl lg:text-6xl">
                    {slide.title}
                  </h2>
                  <Button asChild size="lg" className="mt-3 h-9 rounded-none px-4 text-xs sm:h-11 sm:px-6 sm:text-sm font-semibold tracking-wide uppercase">
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
          className="left-4 hidden bg-white/80 text-black opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white sm:inline-flex"
        />
        <CarouselNext
          variant="secondary"
          size="icon-lg"
          className="right-4 hidden bg-white/80 text-black opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white sm:inline-flex"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-8">
          <div className="mx-auto flex max-w-7xl gap-2 px-4 sm:px-6">
            {slides.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => api?.scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current}
                className={cn(
                  "pointer-events-auto h-1.5 rounded-full transition-all",
                  i === current ? "w-8 bg-brand-red" : "w-4 bg-white/60 hover:bg-white",
                )}
              />
            ))}
          </div>
        </div>
      </Carousel>
    </section>
  );
}
