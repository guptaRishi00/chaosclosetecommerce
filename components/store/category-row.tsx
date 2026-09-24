import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CategoryShowcase } from "@/lib/storefront";
import { ProductCard } from "@/components/store/product-card";

/** Home page: newest 4 of a category, full width, + "View all" to its shop page. */
export function CategoryRow({ category, priority = false }: { category: CategoryShowcase; priority?: boolean }) {
  return (
    <section aria-labelledby={`row-${category.value}`} className="w-full px-3 sm:px-5 lg:px-8">
      <div className="mb-5 flex items-end justify-between gap-4">
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
          className="group inline-flex h-8 shrink-0 items-center gap-1.5 border border-black px-3 text-[11px] sm:gap-2 sm:text-xs font-bold tracking-wider uppercase transition-colors hover:bg-black hover:text-white sm:h-11 sm:px-5"
        >
          View all
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
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
