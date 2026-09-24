"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, Star, X } from "lucide-react";
import { createProduct, updateProduct } from "@/lib/actions/products.actions";
import { CATEGORIES, MAX_PRODUCT_IMAGES, MAX_PRODUCT_UPLOAD_BYTES, sizesFor } from "@/lib/catalog";
import { productFormToInput, productSchema, productUpdateFormToInput, updateProductSchema } from "@/lib/validations/products";
import { IMAGE_TYPES, imageFileSchema } from "@/lib/validations/uploads";
import { cn } from "@/lib/utils";
import { StockStatus } from "@/components/admin/stock-badge";
import { useValidatedAction } from "@/components/forms/use-validated-action";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

type SizeRow = { enabled: boolean; stock: string };

/** Plain, serialisable product for the edit form (built by the edit page from the DB doc). */
export type EditableProduct = {
  id: string;
  name: string;
  description: string;
  price: string; // rupees
  category: string;
  images: { publicId: string; url: string }[];
  sizes: { size: string; stock: number }[];
};

function initialSizes(product?: EditableProduct): Record<string, SizeRow> {
  if (!product) return {};
  return Object.fromEntries(
    sizesFor(product.category).map((size) => {
      const saved = product.sizes.find((s) => s.size === size);
      return [size, saved ? { enabled: true, stock: String(saved.stock) } : { enabled: false, stock: "0" }];
    }),
  );
}

/** Create when `product` is omitted, edit when it's given. Same fields, validation and UI. */
export function ProductForm({ product }: { product?: EditableProduct }) {
  const editing = Boolean(product);
  const { formAction, formRef, pending, onSubmit, message, field } = useValidatedAction(
    editing ? updateProductSchema : productSchema,
    editing ? updateProduct : createProduct,
    { toInput: editing ? productUpdateFormToInput : productFormToInput },
  );
  const [category, setCategory] = useState(product?.category ?? "");
  const [sizes, setSizes] = useState<Record<string, SizeRow>>(() => initialSizes(product));
  const name = field("name");
  const description = field("description");
  const price = field("price");
  const categoryField = field("category");
  const images = field("images");
  const sizesField = field("sizes");

  function onCategoryChange(value: string) {
    setCategory(value);
    // Keep rows for sizes the new category shares (e.g. T-shirts → Shirts); default new sizes to offered, 0 in stock.
    setSizes((prev) => Object.fromEntries(sizesFor(value).map((s) => [s, prev[s] ?? { enabled: true, stock: "0" }])));
  }

  const offered = Object.entries(sizes).filter(([, r]) => r.enabled);
  const totalUnits = offered.reduce((n, [, r]) => n + (Number(r.stock) || 0), 0);

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {product && <input type="hidden" name="id" value={product.id} />}
      {message && (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {message}
        </p>
      )}

      {/* Two columns on wide screens: content + media left, commerce (price, category, sizes) right */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <Section title="General" description="What customers see first on the product page.">
            <FieldGroup className="gap-5">
              <Field data-invalid={name.invalid}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input {...name.control} defaultValue={product?.name} placeholder="e.g. Washed black straight-fit jeans" className="h-9 bg-background" />
                <FieldError id={name.errorId}>{name.error}</FieldError>
              </Field>
              <Field data-invalid={description.invalid}>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  {...description.control}
                  defaultValue={product?.description}
                  rows={5}
                  placeholder="Fabric, fit, wash care…"
                  className="min-h-28 bg-background"
                />
                <FieldError id={description.errorId}>{description.error}</FieldError>
              </Field>
            </FieldGroup>
          </Section>

          <Section
            title="Images"
            description={`Up to ${MAX_PRODUCT_IMAGES} images. The first one is the cover.`}
            footer="JPEG, PNG or WebP · max 5 MB each · 25 MB total"
          >
            <ImagePicker invalid={images.invalid} errorId={images.errorId} initial={product?.images} />
            <FieldError id={images.errorId}>{images.error}</FieldError>
          </Section>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <Section title="Pricing & category" description="Category decides which sizes are available in Inventory.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={price.invalid}>
                <FieldLabel htmlFor="price">Price</FieldLabel>
                <InputGroup className="h-9 bg-background">
                  <InputGroupAddon>
                    <InputGroupText>₹</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput {...price.control} defaultValue={product?.price} type="number" inputMode="decimal" min="1" step="0.01" placeholder="0.00" className="h-full font-mono" />
                </InputGroup>
                <FieldError id={price.errorId}>{price.error}</FieldError>
              </Field>
              <Field data-invalid={categoryField.invalid}>
                <FieldLabel htmlFor="category">Category</FieldLabel>
                <Select name="category" value={category} onValueChange={onCategoryChange}>
                  <SelectTrigger
                    id="category"
                    aria-invalid={categoryField.invalid}
                    aria-describedby={categoryField.control["aria-describedby"]}
                    className="h-9! w-full bg-background"
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError id={categoryField.errorId}>{categoryField.error}</FieldError>
              </Field>
            </div>
          </Section>

          <Section
            title="Inventory"
            description="Tick the sizes you sell and enter how many are in stock. 0 marks a size out of stock."
            footer={
              category ? (
                <span className="font-mono">
                  {offered.length} size{offered.length === 1 ? "" : "s"} · {totalUnits} units
                </span>
              ) : undefined
            }
          >
            {!category ? (
              <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Choose a category to set up sizes.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSizes((p) => Object.fromEntries(Object.entries(p).map(([k, r]) => [k, { ...r, enabled: true }])))}
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSizes((p) => Object.fromEntries(Object.entries(p).map(([k, r]) => [k, { ...r, enabled: false }])))}
                  >
                    Clear
                  </Button>
                </div>
                <div className="overflow-hidden rounded-md border border-border" aria-describedby={sizesField.invalid ? sizesField.errorId : undefined}>
                  <div className="grid grid-cols-[2.5rem_1fr_7.5rem_8.5rem] items-center gap-3 border-b border-border bg-background px-3 py-2 text-xs text-muted-foreground max-sm:grid-cols-[2.5rem_1fr_6.5rem]">
                    <span className="sr-only">Offered</span>
                    <span>Size</span>
                    <span>In stock</span>
                    <span className="max-sm:hidden">Status</span>
                  </div>
                  {Object.entries(sizes).map(([size, row]) => (
                    <div
                      key={size}
                      className={cn(
                        "grid grid-cols-[2.5rem_1fr_7.5rem_8.5rem] items-center gap-3 border-b border-border px-3 py-2 last:border-b-0 max-sm:grid-cols-[2.5rem_1fr_6.5rem]",
                        !row.enabled && "bg-background/50",
                      )}
                    >
                      <Checkbox
                        id={`size-${size}`}
                        name="sizes"
                        value={size}
                        checked={row.enabled}
                        onCheckedChange={(v) => setSizes((p) => ({ ...p, [size]: { ...p[size], enabled: v === true } }))}
                        aria-label={`Offer size ${size}`}
                      />
                      <label htmlFor={`size-${size}`} className={cn("font-mono text-sm", !row.enabled && "text-muted-foreground")}>
                        {size}
                      </label>
                      <Input
                        name={`stock_${size}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={1}
                        value={row.stock}
                        disabled={!row.enabled}
                        onChange={(e) => setSizes((p) => ({ ...p, [size]: { ...p[size], stock: e.target.value } }))}
                        aria-label={`Units in stock for ${size}`}
                        className="h-8 bg-background font-mono"
                      />
                      <span className="max-sm:hidden">
                        {row.enabled ? (
                          <StockStatus stock={Number(row.stock) || 0} />
                        ) : (
                          <span className="text-sm text-muted-foreground">Not offered</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <FieldError id={sizesField.errorId}>{sizesField.error}</FieldError>
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* Vercel-style sticky action bar */}
      <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-end gap-2 border-t border-border bg-background/80 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <Button asChild variant="outline" className="h-9 px-3">
          <Link href="/admin">Cancel</Link>
        </Button>
        <SubmitButton pending={pending} pendingLabel={editing ? "Saving…" : "Uploading & saving…"} className="h-9 px-4 font-medium">
          {editing ? "Save Changes" : "Create Product"}
        </SubmitButton>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
      {footer && <div className="border-t border-border bg-background/60 px-5 py-3 text-sm text-muted-foreground sm:px-6">{footer}</div>}
    </section>
  );
}

type PickerItem = { kind: "existing"; publicId: string; url: string } | { kind: "new"; file: File };

/**
 * Multi-image picker holding one ordered list of saved images (edit mode) and new files.
 * Form output, all in display order:
 *   <input type="file" name="images">  ← new files, synced from state via DataTransfer
 *   hidden keepImages                  ← publicIds of saved images still in the list
 *   hidden imageOrder                  ← "e:<publicId>" | "n:<i-th new file>"
 */
function ImagePicker({
  invalid,
  errorId,
  initial = [],
}: {
  invalid: boolean;
  errorId: string;
  initial?: { publicId: string; url: string }[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = useRef(new Map<File, string>());
  const [items, setItems] = useState<PickerItem[]>(() => initial.map((img) => ({ kind: "existing" as const, ...img })));
  const [rejected, setRejected] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  const newFiles = items.flatMap((it) => (it.kind === "new" ? [it.file] : []));

  useEffect(() => {
    const files = items.flatMap((it) => (it.kind === "new" ? [it.file] : []));
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    if (inputRef.current) inputRef.current.files = dt.files;
    for (const [file, url] of urls.current) {
      if (!files.includes(file)) {
        URL.revokeObjectURL(url);
        urls.current.delete(file);
      }
    }
  }, [items]);

  useEffect(() => {
    const map = urls.current;
    return () => map.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function urlFor(file: File) {
    let url = urls.current.get(file);
    if (!url) {
      url = URL.createObjectURL(file);
      urls.current.set(file, url);
    }
    return url;
  }

  function add(list: FileList | null) {
    if (!list) return;
    const next = [...items];
    const errors: string[] = [];
    for (const file of Array.from(list)) {
      const dup = next.some(
        (it) => it.kind === "new" && it.file.name === file.name && it.file.size === file.size && it.file.lastModified === file.lastModified,
      );
      if (dup) continue;
      if (next.length >= MAX_PRODUCT_IMAGES) {
        errors.push(`Only ${MAX_PRODUCT_IMAGES} images allowed — skipped ${file.name}`);
        continue;
      }
      const check = imageFileSchema.safeParse(file);
      if (!check.success) {
        errors.push(`${file.name}: ${check.error.issues[0].message}`);
        continue;
      }
      next.push({ kind: "new", file });
    }
    setItems(next);
    setRejected(errors);
  }

  const newBytes = newFiles.reduce((n, f) => n + f.size, 0);
  let newIndex = 0;
  const order = items.map((it) => (it.kind === "existing" ? `e:${it.publicId}` : `n:${newIndex++}`));
  const keyOf = (it: PickerItem) => (it.kind === "existing" ? it.publicId : urlFor(it.file));
  const labelOf = (it: PickerItem, i: number) => (it.kind === "existing" ? `saved image ${i + 1}` : it.file.name);

  return (
    <div className="flex flex-col gap-3">
      {items.map((it) => (it.kind === "existing" ? <input key={it.publicId} type="hidden" name="keepImages" value={it.publicId} /> : null))}
      {order.map((token) => (
        <input key={token} type="hidden" name="imageOrder" value={token} />
      ))}

      <label
        htmlFor="images"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 text-center transition-colors",
          "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
          dragging ? "border-foreground bg-accent" : "border-border bg-background hover:border-muted-foreground",
          invalid && "border-destructive",
        )}
      >
        <ImagePlus className="size-5 text-muted-foreground" />
        <span className="text-sm">
          <span className="font-medium">Click to upload</span> <span className="text-muted-foreground">or drag and drop</span>
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {items.length}/{MAX_PRODUCT_IMAGES}
          {newFiles.length > 0 && ` · new ${(newBytes / 1024 / 1024).toFixed(1)} of ${MAX_PRODUCT_UPLOAD_BYTES / 1024 / 1024} MB`}
        </span>
        <input
          ref={inputRef}
          id="images"
          name="images"
          type="file"
          multiple
          accept={Object.keys(IMAGE_TYPES).join(",")}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          className="sr-only"
          onChange={(e) => add(e.target.files)}
        />
      </label>

      {rejected.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm text-warning">
          {rejected.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((it, i) => (
            <li key={keyOf(it)} className="group relative aspect-square overflow-hidden rounded-md border border-border bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob: previews can't go through next/image; saved ones are small thumbs */}
              <img src={it.kind === "existing" ? it.url : urlFor(it.file)} alt={`Image ${i + 1}: ${labelOf(it, i)}`} className="size-full object-cover" />
              <div className="absolute top-1.5 left-1.5 flex gap-1">
                {i === 0 && <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">Cover</span>}
                {it.kind === "new" && initial.length > 0 && (
                  <span className="rounded bg-[#52a8ff]/85 px-1.5 py-0.5 text-[10px] font-medium text-black">New</span>
                )}
              </div>
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => setItems((all) => [it, ...all.filter((x) => x !== it)])}
                    aria-label={`Make ${labelOf(it, i)} the cover image`}
                    className="flex size-7 items-center justify-center rounded-md bg-black/70 text-white backdrop-blur hover:bg-black"
                  >
                    <Star className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setItems((all) => all.filter((x) => x !== it))}
                  aria-label={`Remove ${labelOf(it, i)}`}
                  className="flex size-7 items-center justify-center rounded-md bg-black/70 text-white backdrop-blur hover:bg-black"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {items.length === 0 && <FieldDescription className="text-xs">No images yet.</FieldDescription>}
      {initial.length > 0 && (
        <FieldDescription className="text-xs">Saved images you remove are deleted from storage when you save.</FieldDescription>
      )}
    </div>
  );
}
