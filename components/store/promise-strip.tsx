import { Banknote, Ruler, Truck } from "lucide-react";

const PROMISES = [
  { icon: Truck, title: "Free shipping in Dibrugarh", text: "Delivered to your door across the district." },
  { icon: Banknote, title: "Cash on delivery", text: "Pay when your order arrives. No card needed." },
  { icon: Ruler, title: "Sizes for everyone", text: "Tops XS to XXL, waist 28 to 40." },
] as const;

/** Full-width row of the store's real promises, directly under the hero. Stacks on the smallest phones. */
export function PromiseStrip() {
  return (
    <section aria-label="Why shop with us" className="bg-black text-brand-cream">
      <ul className="flex w-full flex-col divide-y divide-white/10 px-3 sm:flex-row sm:divide-x sm:divide-y-0 sm:px-5 lg:px-8">
        {PROMISES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex flex-1 items-center gap-3 py-4 sm:justify-center sm:px-4 sm:py-5">
            <Icon className="size-5 shrink-0 text-brand-red sm:size-6" strokeWidth={1.75} aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{title}</p>
              <p className="hidden text-xs text-brand-cream/60 md:block">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
