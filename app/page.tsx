import { getCategoryShowcase } from "@/lib/storefront";
import { HeroCarousel, type HeroSlide } from "@/components/site/hero-carousel";
import { CategoryRow } from "@/components/store/category-row";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { PromiseStrip } from "@/components/store/promise-strip";

// Placeholder photography (Unsplash) — swap for your own campaign shots.
const slides: HeroSlide[] = [
  {
    src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=2000&q=80",
    alt: "Woman in a red coat carrying shopping bags",
    eyebrow: "New season",
    title: "Dress loud. Live louder.",
    cta: { label: "Join the closet", href: "/register" },
  },
  {
    src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=2000&q=80",
    alt: "Model in a yellow tracksuit on a basketball court",
    eyebrow: "Streetwear edit",
    title: "Comfort that talks back",
    cta: { label: "Sign up for drops", href: "/register" },
  },
  {
    src: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=2000&q=80",
    alt: "Woman in sunglasses against a yellow wall",
    eyebrow: "Summer accessories",
    title: "Shades of chaos",
    cta: { label: "Create account", href: "/register" },
  },
  {
    src: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=2000&q=80",
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
