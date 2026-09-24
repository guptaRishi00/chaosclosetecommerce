"use client";

import { useState } from "react";
import { deleteAccount } from "@/lib/actions/accounts.actions";
import { ConfirmDeleteDialog } from "@/components/admin/delete-product-dialog";
import { Button } from "@/components/ui/button";

/** Vercel settings-style "Danger Zone" card for the account page. */
export function AccountDangerZone({ id, name, email, orders }: { id: string; name: string; email: string; orders: number }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <section className="overflow-hidden rounded-lg border border-danger/40 bg-card">
      <div className="flex flex-col gap-1 p-5">
        <h2 className="text-sm font-semibold">Delete Account</h2>
        <p className="text-sm text-muted-foreground">Signs them out and removes the account. Their orders are kept.</p>
      </div>
      <div className="flex justify-end border-t border-danger/40 bg-danger/5 px-5 py-3">
        <Button type="button" onClick={() => setConfirming(true)} className="h-9 bg-danger px-3 font-medium text-white hover:bg-danger/90">
          Delete
        </Button>
      </div>
      <ConfirmDeleteDialog
        title="Delete account"
        description={
          <>
            <span className="font-medium text-foreground">{name}</span> ({email}) will be deleted permanently, including their profile photo.
            {orders > 0 && ` Their ${orders} order${orders === 1 ? "" : "s"} will be kept and show the customer as deleted.`}
          </>
        }
        action={() => deleteAccount(id)}
        open={confirming}
        onOpenChange={setConfirming}
      />
    </section>
  );
}
