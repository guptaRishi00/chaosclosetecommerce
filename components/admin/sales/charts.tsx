"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatINR } from "@/lib/utils";

// Palette (validated with the dataviz skill's validator against the admin card surface #0a0a0a):
// single-series marks use the dark step of the reference blue.
const SERIES_1 = "#3987e5";
// Entry animations are off on purpose: Recharts ignores prefers-reduced-motion, and dashboard
// numbers should appear instantly (they also stall in throttled/background tabs).
// Fulfilment is a *status*, so it reuses the admin's status tokens (same as the badges) and always
// ships with a text label + count in the legend — never colour alone.
const STATUS_COLOR: Record<string, string> = {
  "not-delivered": "var(--muted-foreground)",
  delivered: "var(--success)",
  returned: "var(--warning)",
};

const compactINR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 });
export const inrCompact = (paise: number) => compactINR.format(paise / 100);

const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 };

function bucketLabel(key: string, bucket: "day" | "month") {
  const d = new Date(bucket === "day" ? `${key}T00:00:00+05:30` : `${key}-01T00:00:00+05:30`);
  return new Intl.DateTimeFormat("en-IN", bucket === "day" ? { day: "numeric", month: "short", timeZone: "Asia/Kolkata" } : { month: "short", year: "2-digit", timeZone: "Asia/Kolkata" }).format(d);
}

export function SalesTrendChart({ data, bucket }: { data: { key: string; net: number; orders: number }[]; bucket: "day" | "month" }) {
  const config = { net: { label: "Net sales", color: SERIES_1 } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }} accessibilityLayer>
        <defs>
          <linearGradient id="net-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES_1} stopOpacity={0.28} />
            <stop offset="100%" stopColor={SERIES_1} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="key" tickLine={false} axisLine={false} tick={axisTick} tickMargin={8} minTickGap={24} tickFormatter={(k) => bucketLabel(k, bucket)} />
        <YAxis tickLine={false} axisLine={false} tick={axisTick} width={56} tickFormatter={inrCompact} />
        <ChartTooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, p) => (p?.[0] ? bucketLabel(p[0].payload.key, bucket) : "")}
              formatter={(value, _name, item) => (
                <div className="flex w-full flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Net sales</span>
                    <span className="font-mono tabular-nums">{formatINR(Number(value))}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Orders</span>
                    <span className="font-mono tabular-nums">{item.payload.orders}</span>
                  </div>
                </div>
              )}
            />
          }
        />
        <Area isAnimationActive={false} dataKey="net" type="monotone" stroke={SERIES_1} strokeWidth={2} fill="url(#net-fill)" activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} />
      </AreaChart>
    </ChartContainer>
  );
}

/** Horizontal bars — category names are long, so they read better on the y-axis. */
export function CategoryChart({ data }: { data: { name: string; net: number; units: number }[] }) {
  const config = { net: { label: "Net sales", color: SERIES_1 } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height: Math.max(160, data.length * 44) }}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 56 }} barCategoryGap={10} accessibilityLayer>
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={axisTick} width={132} />
        <ChartTooltip
          cursor={{ fill: "var(--accent)" }}
          content={<ChartTooltipContent formatter={(value, _n, item) => <TooltipRows rows={[["Net sales", formatINR(Number(value))], ["Units", String(item.payload.units)]]} />} />}
        />
        <Bar isAnimationActive={false} dataKey="net" fill={SERIES_1} radius={[0, 4, 4, 0]} label={{ position: "right", fill: "var(--muted-foreground)", fontSize: 12, formatter: (v: unknown) => inrCompact(Number(v)) }} />
      </BarChart>
    </ChartContainer>
  );
}

export function SizeChart({ data }: { data: { name: string; units: number }[] }) {
  const config = { units: { label: "Units sold", color: SERIES_1 } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart data={data} margin={{ top: 20, left: 0, right: 0 }} accessibilityLayer>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axisTick} tickMargin={8} />
        <YAxis hide allowDecimals={false} />
        <ChartTooltip cursor={{ fill: "var(--accent)" }} content={<ChartTooltipContent formatter={(v) => <TooltipRows rows={[["Units sold", String(v)]]} />} />} />
        <Bar isAnimationActive={false} dataKey="units" fill={SERIES_1} radius={[4, 4, 0, 0]} maxBarSize={48} label={{ position: "top", fill: "var(--muted-foreground)", fontSize: 12 }} />
      </BarChart>
    </ChartContainer>
  );
}

export function StatusDonut({ data }: { data: { status: string; label: string; orders: number }[] }) {
  const total = data.reduce((n, d) => n + d.orders, 0);
  const config = Object.fromEntries(data.map((d) => [d.status, { label: d.label, color: STATUS_COLOR[d.status] }])) satisfies ChartConfig;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <ChartContainer config={config} className="aspect-square h-44">
        <PieChart accessibilityLayer>
          <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
          {/* stroke = card colour → the 2px surface gap between segments */}
          <Pie isAnimationActive={false} data={data} dataKey="orders" nameKey="status" innerRadius={52} outerRadius={80} stroke="var(--card)" strokeWidth={2}>
            {data.map((d) => (
              <Cell key={d.status} fill={STATUS_COLOR[d.status]} />
            ))}
            <Label
              content={({ viewBox }) =>
                viewBox && "cx" in viewBox ? (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground font-mono text-2xl font-semibold">
                      {total}
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-xs">
                      orders
                    </tspan>
                  </text>
                ) : null
              }
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      {/* Legend = direct labels with counts, so identity never relies on colour */}
      <ul className="flex flex-col gap-2 text-sm">
        {data.map((d) => (
          <li key={d.status} className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 rounded-sm" style={{ background: STATUS_COLOR[d.status] }} />
            <span className="w-28 text-muted-foreground">{d.label}</span>
            <span className="font-mono tabular-nums">{d.orders}</span>
            <span className="w-12 text-right font-mono text-xs text-muted-foreground tabular-nums">
              {total ? Math.round((d.orders / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TooltipRows({ rows }: { rows: [string, string][] }) {
  return (
    <div className="flex w-full flex-col gap-0.5">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{k}</span>
          <span className="font-mono tabular-nums">{v}</span>
        </div>
      ))}
    </div>
  );
}
