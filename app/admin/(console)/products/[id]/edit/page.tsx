import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { categoryLabel } from "@/lib/catalog";
import { connectDB } from "@/lib/db";
import { ProductModel } from "@/models/Product";
import { DangerZone } from "@/components/admin/danger-zone";
import { ProductForm, type EditableProduct } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) notFound();

  await connectDB();
  const doc = await ProductModel.findById(id).lean();
  if (!doc) notFound();

  // Plain, serialisable props only — no ObjectIds/Dates across the client boundary.
  const product: EditableProduct = {
    id: String(doc._id),
    name: doc.name,
    description: doc.description ?? "",
    price: (doc.price / 100).toString(),
    category: doc.category,
    images: doc.images.map((img) => ({ publicId: img.publicId, url: img.url })),
    sizes: doc.sizes.map((s) => ({ size: s.size, stock: s.stock })),
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link href="/admin" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" />
          Products
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Edit Product</h1>
          <p className="font-mono text-xs text-muted-foreground">
            {categoryLabel(doc.category)} · /{doc.slug}
          </p>
        </div>
      </div>
      <ProductForm product={product} />
      <DangerZone id={product.id} name={product.name} />
    </div>
  );
}
