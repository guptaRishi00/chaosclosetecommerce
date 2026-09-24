import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChartNoAxesColumn } from "lucide-react";
import { getSalesReport, RANGES, type RangeValue } from "@/lib/sales";
import { cn, formatINR } from "@/lib/utils";
import { CategoryChart, SalesTrendChart, SizeChart, StatusDonut } from "@/components/admin/sales/charts";
import { DistrictMap } from "@/components/admin/sales/district-map";

export const metadata: Metadata = { title: "Sales" };

function Panel({ title, subtitle, children, className }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card", className)}>
      <div className="flex flex-col gap-0.5 border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </section>
  );
}

function Delta({ now, before }: { now: number; before: number | undefined }) {
  if (before === undefined) return null;
  if (before === 0) return now > 0 ? <span className="text-xs text-muted-foreground">new this period</span> : null;
  const pct = Math.round(((now - before) / before) * 100);
  const up = pct >= 0;
  // Direction is carried by the icon + sign + text, not colour alone.
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs", up ? "text-success" : "text-danger")}>
      {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
      {up ? "+" : ""}
      {pct}% <span className="text-muted-foreground">vs previous</span>
    </span>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <div className="min-h-4">{hint}</div>
    </div>
  );
}

function RankTable({ rows, empty }: { rows: { name: string; net: number; orders: number }[]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.net), 1);
  return (
    <table className="w-full text-sm">
      <thead className="sr-only">
        <tr>
          <th>District</th>
          <th>Net sales</th>
          <th>Orders</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} className="border-b border-border last:border-0">
            <td className="py-2 pr-3">
              <span className="block truncate">{r.name}</span>
              <span aria-hidden className="mt-1 block h-1 rounded-full bg-[#3987e5]" style={{ width: `${Math.max(4, (r.net / max) * 100)}%` }} />
            </td>
            <td className="py-2 text-right font-mono whitespace-nowrap tabular-nums">{formatINR(r.net)}</td>
            <td className="w-14 py-2 text-right font-mono text-muted-foreground tabular-nums">{r.orders}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function AdminSalesPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: rawRange } = await searchParams;
  const range: RangeValue = RANGES.some((r) => r.value === rawRange) ? (rawRange as RangeValue) : "30d";
  const r = await getSalesReport(range);
  const t = r.totals;
  const kept = t.orders - t.returned;
  const rangeLabel = RANGES.find((x) => x.value === range)!.label.toLowerCase();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
          <p className="text-sm text-muted-foreground">
            Cash-on-delivery sales placed through the website. Net sales exclude returned orders.
          </p>
        </div>
        <nav aria-label="Date range" className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
          {RANGES.map((x) => (
            <Link
              key={x.value}
              href={x.value === "30d" ? "/admin/sales" : `/admin/sales?range=${x.value}`}
              aria-current={x.value === range ? "page" : undefined}
              className={cn(
                "flex h-8 items-center rounded-md px-3 text-sm transition-colors",
                x.value === range ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {x.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Net sales" value={formatINR(t.net)} hint={<Delta now={t.net} before={r.previous?.net} />} />
        <Kpi label="Orders" value={String(t.orders)} hint={<Delta now={t.orders} before={r.previous?.orders} />} />
        <Kpi label="Avg. order value" value={kept ? formatINR(Math.round(t.net / kept)) : "—"} hint={<span className="text-xs text-muted-foreground">excl. returns</span>} />
        <Kpi label="Units sold" value={String(t.units)} />
        <Kpi label="Cash to collect" value={formatINR(t.toCollect)} hint={<span className="text-xs text-muted-foreground">{formatINR(t.collected)} collected</span>} />
        <Kpi
          label="Returns"
          value={t.orders ? `${Math.round((t.returned / t.orders) * 100)}%` : "—"}
          hint={<span className="text-xs text-muted-foreground">{t.returned} order{t.returned === 1 ? "" : "s"} · {formatINR(t.returnedAmount)}</span>}
        />
      </div>

      {t.orders === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border px-6 py-20 text-center">
          <div className="flex size-12 items-center justify-center rounded-full border border-border bg-card">
            <ChartNoAxesColumn className="size-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-medium">No sales in the last {rangeLabel}</p>
            <p className="text-sm text-muted-foreground">Charts and the district map appear once customers place orders.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Panel title="Net sales over time" subtitle={r.bucket === "day" ? "Per day (IST)" : "Per month (IST)"} className="lg:col-span-2">
              <SalesTrendChart data={r.series} bucket={r.bucket} />
            </Panel>
            <Panel title="Orders by status" subtitle={`${t.orders} orders in the last ${rangeLabel}`}>
              <StatusDonut data={r.byStatus} />
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Panel title="Sales across Assam" subtitle="Net sales by delivery district" className="lg:col-span-2">
              <DistrictMap stats={r.districts} />
            </Panel>
            <Panel title="Top districts" subtitle="Also the map's table view">
              <RankTable rows={r.districts.slice(0, 8)} empty="No deliveries to Assam districts yet." />
              {r.outsideAssam.length > 0 && (
                <div className="mt-5 flex flex-col gap-2">
                  <h3 className="text-xs font-medium text-muted-foreground">Outside Assam / unmatched district</h3>
                  <RankTable rows={r.outsideAssam.slice(0, 5)} empty="" />
                </div>
              )}
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="Sales by category" subtitle="Net sales">
              <CategoryChart data={r.byCategory} />
            </Panel>
            <Panel title="Units by size" subtitle="Excluding returns">
              <SizeChart data={r.bySize} />
            </Panel>
          </div>

          <Panel title="Top products" subtitle="By net sales">
            {r.topProducts.length ? (
              <ol className="flex flex-col">
                {r.topProducts.map((p, i) => (
                  <li key={p.name + i} className="flex items-center gap-3 border-b border-border py-2.5 text-sm last:border-0 sm:gap-4">
                    <span className="w-4 shrink-0 font-mono text-xs text-muted-foreground">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate">{p.name}</span>
                      {/* share of the best seller; the figure itself is in the last column */}
                      <span aria-hidden className="mt-1 block h-1 rounded-full bg-[#3987e5]" style={{ width: `${Math.max(4, (p.net / Math.max(r.topProducts[0].net, 1)) * 100)}%` }} />
                    </div>
                    <span className="shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums sm:w-20">{p.units} units</span>
                    <span className="w-24 shrink-0 text-right font-mono tabular-nums">{formatINR(p.net)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing sold yet (all orders returned).</p>
            )}
          </Panel>

          {r.returnReasons.length > 0 && (
            <Panel title="Why orders came back" subtitle={`${t.returned} returned order${t.returned === 1 ? "" : "s"}`}>
              <ul className="flex flex-wrap gap-2">
                {r.returnReasons.map((x) => (
                  <li key={x.name} className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm">
                    {x.name}
                    <span className="font-mono text-xs text-muted-foreground">{x.orders}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
