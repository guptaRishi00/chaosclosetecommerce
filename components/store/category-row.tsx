import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CategoryShowcase } from "@/lib/storefront";
import { ProductCard } from "@/components/store/product-card";

/** Home page: newest 4 of a category, full width, + "View all" to its shop page. */
export function CategoryRow({ category, priority = false }: { category: CategoryShowcase; priority?: boolean }) {
  return (
    <section aria-labelledby={`row-${category.value}`} className="w-full px-3 sm:px-5 lg:px-8">
      {/* Phones: button top-aligned with the title (h-7 = the title's 28px line); sm+: aligned to the count line */}
      <div className="mb-5 flex items-start justify-between gap-4 sm:items-end">
        <div>
          <h2 id={`row-${category.value}`} className="font-heading text-xl font-extrabold uppercase sm:text-3xl">
            {category.label}
          </h2>
          <p className="mt-1 text-xs text-black/55 sm:text-sm">
            {category.count} piece{category.count === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href={`/shop/${category.value}`}
          className="group inline-flex h-7 shrink-0 items-center gap-1 border border-black px-2.5 text-[10px] font-bold tracking-wider uppercase transition-colors hover:bg-black hover:text-white sm:h-11 sm:gap-2 sm:px-5 sm:text-xs"
        >
          View all
          <ArrowRight className="size-3 transition-transform sm:size-4 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-8 sm:gap-x-3 md:grid-cols-4 lg:gap-x-4">
        {category.products.map((p, i) => (
          <ProductCard key={p.slug} product={p} priority={priority && i < 4} />
        ))}
      </div>
    </section>
  );
}
