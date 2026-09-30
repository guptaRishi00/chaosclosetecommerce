# Chaos Closet storefront design rules

Adapted from the Nike commerce spec in the `awesome-design-md` library (an inspired
interpretation, not Nike's assets). Chaos Closet keeps its own logo, red/cream palette and
fonts; only the layout, type-scale and component rules come from the reference.
Scope: the customer-facing pages (home, shop, product, bag, wishlist, login/register,
account). The `/admin` console keeps its own dark Vercel-style theme (`.admin-theme` in
`app/globals.css`).

## Principle
The photography does the talking and the interface stays quiet. Product and campaign
images carry the colour. The interface is white, ink and one soft cream surface, and red
appears only where something needs attention.

## Colour (tokens in `app/globals.css`)
| Role | Token / utility | Value | Use |
|---|---|---|---|
| Canvas | `bg-background` | `#ffffff` | every page |
| Ink | `ink`, `foreground`, `primary` | `#111111` | text, primary pills, active chips. Never pure `#000` |
| Soft surface | `brand-cream`, `secondary` | `#fdf0d5` | product photo stage, secondary pills, summary/profile panels, promise strip |
| Neutral soft | `muted` | `#f5f5f5` | disabled/sold-out pill, skeletons, account shortcuts |
| Mute text | `muted-foreground` | `#626264` | counts, meta, helper text (5.9:1 on white) |
| Signal | `brand-red` | `#c1121f` | announcement bar, newsletter band, low stock, saved heart, bag count, primary-pill hover, focus ring |

Red is never a button fill (except hover) and never decorates icons.

**Prices** (`components/store/price.tsx`): with a cut price (MRP) set in the admin, show
~~MRP~~ in `muted-foreground`, then the price in ink, then "N% off" in `brand-red`. The
percentage is rounded down so it never overstates. Without a cut price, show the price alone.

## Type
- **Unbounded 800, uppercase, leading 0.95** is used only for campaign moments: the hero title, the `/shop/[category]` H1, the newsletter band and the auth photo panel.
- **Manrope** carries everything else. Section and page headings are `font-semibold tracking-tight`, `text-xl` → `sm:text-[32px]`, in normal case. Product names are 14–15px semibold, normal case. Prices use the sans font with `tabular-nums`, never mono.
- Eyebrows (small uppercase tracking labels) appear only in the hero and the announcement bar.

## Shape
- Containers, cards, product images, panels and banners have **0 radius and no shadow**.
- **Every interactive control is a pill** (`rounded-full`): primary/secondary buttons, filter chips, size pills, quantity steppers, badges, "View all". Icon buttons are circles.
- Form inputs and pagination numbers use `--radius` (12px).

## Buttons
| Kind | Classes (mobile → sm+) |
|---|---|
| Primary | `rounded-full bg-ink text-white h-10 px-5 text-sm → sm:h-12 sm:px-8 sm:text-base`, hover `bg-brand-red` |
| Secondary | same size, `bg-brand-cream text-ink`, hover `bg-ink text-white` |
| On photo | `rounded-full bg-white text-ink` (hero "Shop now") |
| Small (View all, chips) | `h-7/h-8 → sm:h-10`, `text-xs → sm:text-sm` |

Use one black pill per decision area; the alternative action is the cream pill. Every
pill gets `active:scale-[0.98]` as press feedback.

**Row actions** (Cancel order on My orders, Remove in the bag): put them at the bottom right of
the row, on the same line as the row's state (status chip or quantity stepper), with the price
on the top line. Keep them quiet: a ghost pill with a hairline ring and an icon plus label,
turning red on hover. Below `sm` they become a 40px icon-only circle that keeps the label as
`sr-only` text.

## Layout
- Page gutter = navbar gutter `px-3 sm:px-5 lg:px-8`, full width. The hero lockup sits on the same gutter, anchored bottom-left.
- Product grids: 2 → 3/4 columns, `gap-x-2 sm:gap-x-3 lg:gap-x-4`. Card metadata sits directly under the image with no padding.
- One label per intent: the hero says "Shop now" (→ `#shop`), signing up lives in the navbar and the newsletter lives in the footer.
- No em or en dashes in visible copy. Use at most one middle dot per line.
