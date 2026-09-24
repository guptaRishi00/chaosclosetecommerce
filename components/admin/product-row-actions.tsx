"use client";

import { useState } from "react";
import Link from "next/link";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { DeleteProductDialog } from "@/components/admin/delete-product-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Vercel-style "…" row menu. The dialog lives outside the menu so closing the menu doesn't unmount it. */
export function ProductRowActions({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          aria-label={`Actions for ${name}`}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent"
        >
          <Ellipsis className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={`/admin/products/${id}/edit`}>
              <Pencil />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteProductDialog id={id} name={name} open={confirming} onOpenChange={setConfirming} />
    </>
  );
}
