"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteAccount } from "@/lib/actions/accounts.actions";
import { ConfirmDeleteDialog } from "@/components/admin/delete-product-dialog";
import { Button } from "@/components/ui/button";

export function AccountRowActions({ id, name, email, orders }: { id: string; name: string; email: string; orders: number }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setConfirming(true)}
        aria-label={`Delete account ${email}`}
        title="Delete account"
        className="text-muted-foreground hover:bg-danger/10 hover:text-danger"
      >
        <Trash2 />
      </Button>
      <ConfirmDeleteDialog
        title="Delete account"
        description={
          <>
            <span className="font-medium text-foreground">{name}</span> ({email}) will be deleted permanently, including their profile photo.
            They&apos;ll be signed out and can&apos;t log in again.
            {orders > 0 && (
              <>
                {" "}
                Their {orders} order{orders === 1 ? "" : "s"} will be kept and show the customer as deleted.
              </>
            )}
          </>
        }
        action={() => deleteAccount(id)}
        open={confirming}
        onOpenChange={setConfirming}
      />
    </>
  );
}
