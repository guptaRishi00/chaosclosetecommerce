import { categoryLabel } from "@/lib/catalog";
import { connectDB } from "@/lib/db";
import { resolveAssamDistrict } from "@/lib/districts";
import { fulfillmentLabel, returnReasonLabel } from "@/lib/orders";
import { OrderModel } from "@/models/Order";

// Server-only sales analytics for /admin/sales. Money is integer paise throughout.
// Definitions (cash on delivery):
//   gross     = every order placed in the period
//   net       = gross minus returned orders          ← headline "sales"
//   collected = delivered orders (cash received)
//   toCollect = open orders not yet delivered or returned

export const RANGES = [
  { value: "7d", label: "7 days", days: 7 },
  { value: "30d", label: "30 days", days: 30 },
  { value: "90d", label: "90 days", days: 90 },
  { value: "12m", label: "12 months", days: 365 },
  { value: "all", label: "All time", days: null },
] as const;
export type RangeValue = (typeof RANGES)[number]["value"];

const TZ = "Asia/Kolkata";

export type SalesReport = {
  range: RangeValue;
  bucket: "day" | "month";
  totals: { orders: number; units: number; gross: number; net: number; collected: number; toCollect: number; returned: number; returnedAmount: number };
  previous: { orders: number; net: number } | null; // same-length period just before, for deltas
  series: { key: string; net: number; orders: number }[];
  byCategory: { name: string; net: number; units: number }[];
  bySize: { name: string; units: number }[];
  byStatus: { status: string; label: string; orders: number }[];
  topProducts: { name: string; units: number; net: number }[];
  districts: { name: string; net: number; orders: number }[]; // resolved to the Assam map
  outsideAssam: { name: string; net: number; orders: number }[]; // unmatched / other states
  returnReasons: { name: string; orders: number }[];
};

const notReturned = { $ne: ["$fulfillment", "returned"] };
const netAmount = { $cond: [notReturned, "$amount", 0] };

function periodStart(days: number | null): Date | null {
  if (days === null) return null;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return start;
}

export async function getSalesReport(range: RangeValue): Promise<SalesReport> {
  await connectDB();
  const days = RANGES.find((r) => r.value === range)!.days;
  const start = periodStart(days);
  const bucket: SalesReport["bucket"] = days !== null && days <= 90 ? "day" : "month";
  const match = start ? { createdAt: { $gte: start } } : {};

  const [facets] = await OrderModel.aggregate([
    { $match: match },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              orders: { $sum: 1 },
              units: { $sum: { $cond: [notReturned, "$quantity", 0] } },
              gross: { $sum: "$amount" },
              net: { $sum: netAmount },
              collected: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "paid"] }, notReturned] }, "$amount", 0] } },
              toCollect: { $sum: { $cond: [{ $eq: ["$fulfillment", "not-delivered"] }, "$amount", 0] } },
              returned: { $sum: { $cond: [notReturned, 0, 1] } },
              returnedAmount: { $sum: { $cond: [notReturned, 0, "$amount"] } },
            },
          },
        ],
        series: [
          {
            $group: {
              _id: { $dateToString: { date: "$createdAt", format: bucket === "day" ? "%Y-%m-%d" : "%Y-%m", timezone: TZ } },
              net: { $sum: netAmount },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
        byCategory: [
          // Orders placed before the category snapshot existed fall back to the (current) product.
          { $lookup: { from: "products", localField: "product", foreignField: "_id", as: "p", pipeline: [{ $project: { category: 1 } }] } },
          { $group: { _id: { $ifNull: ["$category", { $ifNull: [{ $first: "$p.category" }, "unknown"] }] }, net: { $sum: netAmount }, units: { $sum: { $cond: [notReturned, "$quantity", 0] } } } },
          { $sort: { net: -1 } },
        ],
        bySize: [{ $match: { fulfillment: { $ne: "returned" } } }, { $group: { _id: "$size", units: { $sum: "$quantity" } } }],
        byStatus: [{ $group: { _id: "$fulfillment", orders: { $sum: 1 } } }],
        topProducts: [
          { $match: { fulfillment: { $ne: "returned" } } },
          { $group: { _id: "$product", name: { $last: "$productName" }, units: { $sum: "$quantity" }, net: { $sum: "$amount" } } },
          { $sort: { net: -1, units: -1 } },
          { $limit: 5 },
        ],
        byDistrict: [{ $group: { _id: "$shipping.district", net: { $sum: netAmount }, orders: { $sum: 1 } } }],
        returnReasons: [{ $match: { fulfillment: "returned" } }, { $group: { _id: "$returnInfo.reason", orders: { $sum: 1 } } }, { $sort: { orders: -1 } }],
      },
    },
  ]);

  let previous: SalesReport["previous"] = null;
  if (start && days) {
    const prevStart = new Date(start);
    prevStart.setUTCDate(prevStart.getUTCDate() - days);
    const [p] = await OrderModel.aggregate([
      { $match: { createdAt: { $gte: prevStart, $lt: start } } },
      { $group: { _id: null, orders: { $sum: 1 }, net: { $sum: netAmount } } },
    ]);
    previous = { orders: p?.orders ?? 0, net: p?.net ?? 0 };
  }

  const t = facets.totals[0] ?? { orders: 0, units: 0, gross: 0, net: 0, collected: 0, toCollect: 0, returned: 0, returnedAmount: 0 };

  // District text → map district; merge aliases (e.g. "Majuli" + "Jorhat"), keep the rest separately.
  const onMap = new Map<string, { net: number; orders: number }>();
  const off = new Map<string, { net: number; orders: number }>();
  for (const d of facets.byDistrict as { _id: string | null; net: number; orders: number }[]) {
    const resolved = resolveAssamDistrict(d._id);
    const target = resolved ? onMap : off;
    const key = resolved ?? (d._id?.trim() || "Not given");
    const cur = target.get(key) ?? { net: 0, orders: 0 };
    target.set(key, { net: cur.net + d.net, orders: cur.orders + d.orders });
  }
  const toList = (m: Map<string, { net: number; orders: number }>) =>
    [...m].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.net - a.net || b.orders - a.orders);

  return {
    range,
    bucket,
    totals: { orders: t.orders, units: t.units, gross: t.gross, net: t.net, collected: t.collected, toCollect: t.toCollect, returned: t.returned, returnedAmount: t.returnedAmount },
    previous,
    series: fillSeries(facets.series, bucket, start),
    byCategory: (facets.byCategory as { _id: string; net: number; units: number }[]).map((c) => ({ name: categoryLabel(c._id), net: c.net, units: c.units })),
    bySize: sortSizes((facets.bySize as { _id: string; units: number }[]).map((s) => ({ name: s._id, units: s.units }))),
    byStatus: ["not-delivered", "delivered", "returned"].map((status) => ({
      status,
      label: fulfillmentLabel(status),
      orders: (facets.byStatus as { _id: string; orders: number }[]).find((s) => s._id === status)?.orders ?? 0,
    })),
    topProducts: (facets.topProducts as { name: string; units: number; net: number }[]).map(({ name, units, net }) => ({ name, units, net })),
    districts: toList(onMap),
    outsideAssam: toList(off),
    returnReasons: (facets.returnReasons as { _id: string; orders: number }[]).map((r) => ({ name: returnReasonLabel(r._id), orders: r.orders })),
  };
}

/** Continuous x-axis: add zero buckets for days/months with no orders. */
function fillSeries(rows: { _id: string; net: number; orders: number }[], bucket: "day" | "month", start: Date | null) {
  const have = new Map(rows.map((r) => [r._id, r]));
  const first = start ?? (rows[0] ? new Date(`${rows[0]._id}${bucket === "month" ? "-01" : ""}T00:00:00+05:30`) : null);
  if (!first) return [];
  const keyOf = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", ...(bucket === "day" ? { day: "2-digit" } : {}) })
      .format(d)
      .slice(0, bucket === "day" ? 10 : 7);
  const out: { key: string; net: number; orders: number }[] = [];
  const cursor = new Date(first);
  const end = new Date();
  for (let guard = 0; cursor <= end && guard < 800; guard++) {
    const key = keyOf(cursor);
    if (!out.length || out[out.length - 1].key !== key) out.push({ key, net: have.get(key)?.net ?? 0, orders: have.get(key)?.orders ?? 0 });
    if (bucket === "day") cursor.setUTCDate(cursor.getUTCDate() + 1);
    else cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);
  }
  return out;
}

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];
function sortSizes<T extends { name: string }>(rows: T[]): T[] {
  const rank = (s: string) => (SIZE_ORDER.includes(s) ? SIZE_ORDER.indexOf(s) : 100 + Number(s || 0));
  return [...rows].sort((a, b) => rank(a.name) - rank(b.name));
}
