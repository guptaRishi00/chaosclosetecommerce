"use client";

import { useState } from "react";
import { DeleteProductDialog } from "@/components/admin/delete-product-dialog";
import { Button } from "@/components/ui/button";

/** Vercel settings-page "Danger Zone" card. */
export function DangerZone({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <section className="overflow-hidden rounded-lg border border-danger/40 bg-card">
      <div className="flex flex-col gap-1 p-5 sm:p-6">
        <h2 className="text-base font-semibold tracking-tight">Delete Product</h2>
        <p className="text-sm text-muted-foreground">
          Permanently remove this product and its images from the store. This can&apos;t be undone.
        </p>
      </div>
      <div className="flex items-center justify-end border-t border-danger/40 bg-danger/5 px-5 py-3 sm:px-6">
        <Button type="button" onClick={() => setConfirming(true)} className="h-9 bg-danger px-3 font-medium text-white hover:bg-danger/90">
          Delete
        </Button>
      </div>
      <DeleteProductDialog id={id} name={name} open={confirming} onOpenChange={setConfirming} />
    </section>
  );
}
