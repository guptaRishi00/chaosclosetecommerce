import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CircleCheck, Package, Plus } from "lucide-react";
import { categoryLabel } from "@/lib/catalog";
import { connectDB } from "@/lib/db";
import { PAGE_SIZE, pageInfo, parsePage } from "@/lib/pagination";
import { formatINR } from "@/lib/utils";
import { ProductModel } from "@/models/Product";
import { ListPagination } from "@/components/admin/list-pagination";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { SizeChip, StockStatus } from "@/components/admin/stock-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "Products" };

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

type Search = { created?: string; updated?: string; deleted?: string; page?: string };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { created, updated, deleted, page: rawPage } = await searchParams;

  await connectDB();
  const info = pageInfo(await ProductModel.countDocuments(), parsePage(rawPage));
  // _id tiebreaker keeps page boundaries stable when createdAt values are equal.
  const products = await ProductModel.find().sort({ createdAt: -1, _id: -1 }).skip(info.skip).limit(PAGE_SIZE).lean();

  // created/updated carry a slug → look the name up in the DB (the product may not be on this page);
  // deleted carries the name (the doc is gone). React escapes it.
  const slug = created ?? updated;
  const flashName = slug ? (await ProductModel.findOne({ slug }).select("name").lean())?.name : undefined;
  const flash = flashName
    ? `${flashName} was ${created ? "created" : "updated"}.`
    : deleted
      ? `${deleted.slice(0, 120)} was deleted.`
      : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            {info.total === 0 ? "Your catalogue is empty." : `${info.total} product${info.total === 1 ? "" : "s"} in your catalogue.`}
          </p>
        </div>
        <Button asChild size="lg" className="h-9 px-3 font-medium">
          <Link href="/admin/products/new">
            <Plus />
            Add New…
          </Link>
        </Button>
      </div>

      {flash && (
        <div role="status" className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm">
          <CircleCheck className="size-4 shrink-0 text-success" />
          <span>{flash}</span>
        </div>
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border px-6 py-20 text-center">
          <div className="flex size-12 items-center justify-center rounded-full border border-border bg-card">
            <Package className="size-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-medium">No products yet</p>
            <p className="text-sm text-muted-foreground">Add your first product to start building the catalogue.</p>
          </div>
          <Button asChild variant="outline" className="h-9 px-3">
            <Link href="/admin/products/new">
              <Plus />
              Add product
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {/* Below lg: stacked cards (the table needs ~730px and would scroll sideways) */}
          <ul className="divide-y divide-border lg:hidden">
            {products.map((p) => {
              const total = p.sizes.reduce((n, s) => n + s.stock, 0);
              const cover = p.images[0];
              return (
                <li key={String(p._id)} className="flex gap-3 p-4">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                    {cover && <Image src={cover.url} alt="" fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <Link href={`/admin/products/${String(p._id)}/edit`} className="line-clamp-2 font-medium hover:underline">
                          {p.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {categoryLabel(p.category)} · <span className="font-mono text-foreground tabular-nums">{formatINR(p.price)}</span>
                        </p>
                      </div>
                      <div className="-mt-1 -mr-2 shrink-0">
                        <ProductRowActions id={String(p._id)} name={p.name} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.sizes.map((s) => (
                        <SizeChip key={s.size} size={s.size} stock={s.stock} />
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <StockStatus stock={total} />
                      <span className="font-mono text-xs text-muted-foreground">
                        {total} units · {dateFmt.format(p.createdAt)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 text-xs font-normal text-muted-foreground">Product</TableHead>
                <TableHead className="text-xs font-normal text-muted-foreground">Category</TableHead>
                <TableHead className="text-right text-xs font-normal text-muted-foreground">Price</TableHead>
                <TableHead className="text-xs font-normal text-muted-foreground">Sizes</TableHead>
                <TableHead className="text-xs font-normal text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-xs font-normal text-muted-foreground">Created</TableHead>
                <TableHead className="w-12 pr-3">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const total = p.sizes.reduce((n, s) => n + s.stock, 0);
                const cover = p.images[0];
                return (
                  <TableRow key={String(p._id)}>
                    <TableCell className="py-3 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                          {cover && <Image src={cover.url} alt="" fill sizes="40px" className="object-cover" />}
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <Link href={`/admin/products/${String(p._id)}/edit`} className="truncate font-medium hover:underline">
                            {p.name}
                          </Link>
                          <span className="truncate font-mono text-xs text-muted-foreground">
                            {p.images.length} image{p.images.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        {categoryLabel(p.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{formatINR(p.price)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.sizes.map((s) => (
                          <SizeChip key={s.size} size={s.size} stock={s.stock} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <StockStatus stock={total} />
                        <span className="pl-4 font-mono text-xs text-muted-foreground">{total} units</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap text-muted-foreground">
                      {dateFmt.format(p.createdAt)}
                    </TableCell>
                    <TableCell className="pr-3 text-right">
                      <ProductRowActions id={String(p._id)} name={p.name} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </div>
      )}

      <ListPagination info={info} basePath="/admin" noun="product" />
    </div>
  );
}
