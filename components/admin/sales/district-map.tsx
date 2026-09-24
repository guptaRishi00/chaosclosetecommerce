"use client";

import { useState } from "react";
import { ASSAM_MAP } from "@/lib/districts";
import { formatINR } from "@/lib/utils";

// Sequential single-hue ramp (low → high), validated ordinal on the #0a0a0a card surface.
const RAMP = ["#184f95", "#256abf", "#3987e5", "#6da7ec", "#9ec5f4"];
const EMPTY = "#1a1a1a";

type Stat = { name: string; net: number; orders: number };

/** Quantile buckets over districts with sales, so one big district doesn't wash out the rest. */
function bucketer(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const cuts = RAMP.slice(1).map((_, i) => sorted[Math.floor(((i + 1) * sorted.length) / RAMP.length)] ?? Infinity);
  return (v: number) => {
    if (v <= 0) return -1;
    let i = 0;
    while (i < cuts.length && v >= cuts[i]) i++;
    return Math.min(i, RAMP.length - 1);
  };
}

export function DistrictMap({ stats }: { stats: Stat[] }) {
  const byName = new Map(stats.map((s) => [s.name, s]));
  const bucketOf = bucketer(stats.filter((s) => s.net > 0).map((s) => s.net));
  const [active, setActive] = useState<string | null>(null);
  const hovered = active ? (byName.get(active) ?? { name: active, net: 0, orders: 0 }) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <svg viewBox={ASSAM_MAP.viewBox} className="h-auto w-full" role="img" aria-label="Map of Assam districts shaded by net sales">
          {ASSAM_MAP.districts.map((d) => {
            const s = byName.get(d.name);
            const b = bucketOf(s?.net ?? 0);
            const isActive = active === d.name;
            return (
              <path
                key={d.name}
                d={d.d}
                fill={b < 0 ? EMPTY : RAMP[b]}
                // 2px surface-coloured boundary = the separation between adjacent fills
                stroke={isActive ? "var(--foreground)" : "var(--card)"}
                strokeWidth={isActive ? 3 : 1.5}
                strokeLinejoin="round"
                tabIndex={0}
                aria-label={`${d.name}: ${s ? `${formatINR(s.net)} net sales, ${s.orders} order${s.orders === 1 ? "" : "s"}` : "no orders"}`}
                onMouseEnter={() => setActive(d.name)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(d.name)}
                onBlur={() => setActive(null)}
                className="cursor-default outline-none transition-[fill] duration-150"
              />
            );
          })}
        </svg>
        {hovered && (
          <div className="pointer-events-none absolute top-2 left-2 rounded-md border border-border bg-popover px-3 py-2 text-sm shadow-lg">
            <p className="font-medium">{hovered.name}</p>
            <p className="font-mono text-xs text-muted-foreground tabular-nums">
              {hovered.orders ? `${formatINR(hovered.net)} · ${hovered.orders} order${hovered.orders === 1 ? "" : "s"}` : "No orders"}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-sm border border-border" style={{ background: EMPTY }} />
            No orders
          </span>
          <span className="ml-2">Less</span>
          <span aria-hidden className="flex">
            {RAMP.map((c) => (
              <span key={c} className="h-2.5 w-5 first:rounded-l-sm last:rounded-r-sm" style={{ background: c }} />
            ))}
          </span>
          <span>More</span>
        </div>
        <p>
          Boundaries: Census 2011 ©{" "}
          <a href="https://github.com/datameet/maps" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
            DataMeet
          </a>{" "}
          (
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
            CC BY 4.0
          </a>
          )
        </p>
      </div>
    </div>
  );
}
