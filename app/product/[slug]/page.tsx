import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Banknote, Truck } from "lucide-react";
import { categoryLabel } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/current-user";
import { getDeliveryDefaults } from "@/lib/delivery";
import { getProductBySlug } from "@/lib/storefront";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { WishlistButton } from "@/components/store/wishlist-button";
import { OrderPanel } from "@/components/store/order-panel";
import { ProductCard } from "@/components/store/product-card";
import { ProductGallery } from "@/components/store/product-gallery";
import { Price } from "@/components/store/price";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const data = await getProductBySlug((await params).slug);
  if (!data) return {};
  const { product } = data;
  return {
    title: product.name,
    description: product.description.slice(0, 155),
    openGraph: { title: product.name, images: product.gallery.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: Params) {
  const [data, user] = await Promise.all([getProductBySlug((await params).slug), getCurrentUser()]);
  if (!data) notFound();
  const { product, related } = data;
  const delivery = user ? await getDeliveryDefaults(user) : null;

  return (
    <>
      <SiteHeader />
      <main className="w-full px-3 pt-6 pb-20 sm:px-5 md:pt-10 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-ink">
            Home
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <Link href={`/shop/${product.category}`} className="hover:text-ink">
            {categoryLabel(product.category)}
          </Link>
        </nav>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-12 lg:gap-16">
          <ProductGallery images={product.gallery} name={product.name} />

          {/* Details stick beside the gallery while scrolling on larger screens */}
          <div className="flex flex-col gap-6 md:sticky md:top-24 md:self-start">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1">
                <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-[32px]">{product.name}</h1>
                <p className="text-sm text-muted-foreground sm:text-base">{categoryLabel(product.category)}</p>
                <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" className="mt-3" />
              </div>
              <WishlistButton
                size="lg"
                item={{ productId: product.id, slug: product.slug, name: product.name, image: product.gallery[0], price: product.price }}
                className="shrink-0 shadow-none"
              />
            </div>

            <OrderPanel productId={product.id} slug={product.slug} name={product.name} image={product.gallery[0]} price={product.price} sizes={product.sizes} delivery={delivery} />

            <ul className="flex flex-col gap-3 border-y border-ink/12 py-5 text-sm">
              <li className="flex items-center gap-3">
                <Truck className="size-5 shrink-0" strokeWidth={1.5} aria-hidden />
                Free shipping in Dibrugarh
              </li>
              <li className="flex items-center gap-3">
                <Banknote className="size-5 shrink-0" strokeWidth={1.5} aria-hidden />
                Cash on delivery. Pay when it arrives.
              </li>
            </ul>

            {product.description && (
              <div className="flex flex-col gap-2">
                <h2 className="text-base font-semibold">Details</h2>
                <p className="max-w-prose text-[15px] leading-relaxed whitespace-pre-line text-ink/75">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-20 md:mt-28">
            <div className="flex items-center justify-between gap-4">
              <h2 id="related-heading" className="text-xl font-semibold tracking-tight sm:text-[32px] sm:leading-tight">
                More {categoryLabel(product.category).toLowerCase()}
              </h2>
              <Link
                href={`/shop/${product.category}`}
                className="inline-flex h-8 shrink-0 items-center rounded-full bg-brand-cream px-4 text-xs font-semibold transition-colors hover:bg-ink hover:text-white active:scale-[0.98] sm:h-10 sm:px-5 sm:text-sm"
              >
                View all
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-x-2 gap-y-8 sm:gap-x-3 md:grid-cols-4 lg:gap-x-4">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
