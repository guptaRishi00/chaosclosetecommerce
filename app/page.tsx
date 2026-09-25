import { getCategoryShowcase } from "@/lib/storefront";
import { HeroCarousel, type HeroSlide } from "@/components/site/hero-carousel";
import { CategoryRow } from "@/components/store/category-row";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { PromiseStrip } from "@/components/store/promise-strip";

// Desktop images are landscape; `mobileSrc` is a portrait (1080x1920) version for phones.
// public/hero/*-mobile.jpg are subject-aware crops of the desktop shots; replace them with
// dedicated mobile photography whenever it exists. Slide 4 is still an Unsplash placeholder.
const slides: HeroSlide[] = [
  {
    src: "/2.jpg",
    mobileSrc: "/7.jpg",
    alt: "Models in wide-leg trousers and a flared dress on a concrete staircase",
    eyebrow: "New season",
    title: "Dress loud. Live louder.",
    cta: { label: "Join the closet", href: "/register" },
  },
  {
    src: "/3.jpg",
    mobileSrc: "/hero/3-mobile.jpg",
    alt: "Model in an oversized red outfit against a clear blue sky",
    eyebrow: "Streetwear edit",
    title: "Comfort that talks back",
    cta: { label: "Sign up for drops", href: "/register" },
  },
  {
    src: "/4.jpg",
    mobileSrc: "/5.jpg",
    alt: "Group of friends in streetwear posing in an underground car park",
    eyebrow: "Summer accessories",
    title: "Shades of chaos",
    cta: { label: "Create account", href: "/register" },
  },
  {
    src: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=2000&q=80",
    mobileSrc: "/6.jpg",
    alt: "Rail of neutral-toned jackets and shirts",
    eyebrow: "Free shipping in Dibrugarh",
    title: "Your closet, delivered",
    cta: { label: "Get started", href: "/register" },
  },
];

export default async function HomePage() {
  const categories = await getCategoryShowcase();
  const stocked = categories.filter((c) => c.count > 0);

  return (
    <>
      <SiteHeader />
      <main>
        <HeroCarousel slides={slides} />
        <PromiseStrip />
        {stocked.length > 0 ? (
          <div className="flex flex-col gap-14 py-12 md:gap-20 md:py-16">
            {stocked.map((c, i) => (
              <CategoryRow key={c.value} category={c} priority={i === 0} />
            ))}
          </div>
        ) : (
          <p className="mx-auto max-w-7xl px-4 py-24 text-center text-black/60 sm:px-6">New drops are on the way. Check back soon.</p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
