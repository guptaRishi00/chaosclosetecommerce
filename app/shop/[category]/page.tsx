import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, categoryLabel } from "@/lib/catalog";
import { parsePage } from "@/lib/pagination";
import { getCategoryProducts, isCategory } from "@/lib/storefront";
import { cn } from "@/lib/utils";
import { ListPagination } from "@/components/admin/list-pagination";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { ProductCard } from "@/components/store/product-card";

type Params = { params: Promise<{ category: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  return isCategory(category) ? { title: categoryLabel(category), description: `Shop ${categoryLabel(category)} at Chaos Closet.` } : {};
}

export default async function ShopCategoryPage({ params, searchParams }: Params) {
  const [{ category }, { page }] = await Promise.all([params, searchParams]);
  if (!isCategory(category)) notFound();
  const { info, products } = await getCategoryProducts(category, parsePage(page));

  return (
    <>
      <SiteHeader />
      <main className="flex w-full flex-col gap-6 px-3 pt-10 pb-20 sm:gap-8 sm:px-5 md:pt-14 lg:px-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl leading-[0.95] font-extrabold uppercase sm:text-5xl lg:text-6xl">{categoryLabel(category)}</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {info.total === 0 ? "Nothing here yet." : `${info.total} piece${info.total === 1 ? "" : "s"}`}
          </p>
        </div>

        {/* Category switcher: scrolls sideways on phones instead of wrapping into a wall of chips */}
        <nav aria-label="Categories" className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0 [scrollbar-width:none]">
          <ul className="flex w-max gap-2">
            {CATEGORIES.map((c) => (
              <li key={c.value}>
                <Link
                  href={`/shop/${c.value}`}
                  aria-current={c.value === category ? "page" : undefined}
                  className={cn(
                    "inline-flex h-8 items-center rounded-full border px-3.5 text-xs font-semibold whitespace-nowrap transition-colors active:scale-[0.98] sm:h-10 sm:px-5 sm:text-sm",
                    c.value === category ? "border-ink bg-ink text-white" : "border-ink/20 bg-white hover:border-ink",
                  )}
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {products.length === 0 ? (
          <div className="bg-brand-cream px-6 py-20 text-center">
            <p className="text-lg font-semibold">New {categoryLabel(category).toLowerCase()} are on the way.</p>
            <p className="mt-1 text-sm text-ink/70">
              Meanwhile, browse{" "}
              <Link href="/" className="font-semibold underline underline-offset-4 hover:text-brand-red">
                everything else
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-2 gap-y-10 sm:grid-cols-3 sm:gap-x-3 lg:grid-cols-4 lg:gap-x-4">
            {products.map((p, i) => (
              <ProductCard key={p.slug} product={p} priority={i < 4} />
            ))}
          </div>
        )}

        <ListPagination info={info} basePath={`/shop/${category}`} noun="product" />
      </main>
      <SiteFooter />
    </>
  );
}
