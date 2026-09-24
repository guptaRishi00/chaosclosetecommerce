"use client";

import { useState, useTransition } from "react";
import { deleteProduct } from "@/lib/actions/products.actions";
import type { ActionState } from "@/lib/validations/utils";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmProps = {
  title: string;
  description: React.ReactNode;
  /** Server Action to run; on success it should redirect (which closes the dialog). */
  action: () => Promise<ActionState>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Controlled confirm dialog for destructive admin actions. Uses a plain Button (not
 * AlertDialogAction) so the dialog stays open while the Server Action runs and can show its error.
 */
export function ConfirmDeleteDialog({ title, description, action, open, onOpenChange }: ConfirmProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.status === "error") setError(result.message ?? "Couldn't delete it. Please try again.");
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={confirm} disabled={pending} className="bg-danger text-white hover:bg-danger/90">
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DeleteProductDialog({ id, name, open, onOpenChange }: { id: string; name: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <ConfirmDeleteDialog
      title="Delete product"
      description={
        <>
          <span className="font-medium text-foreground">{name}</span> and all its images will be permanently deleted. This can&apos;t
          be undone.
        </>
      }
      action={() => deleteProduct(id)}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
