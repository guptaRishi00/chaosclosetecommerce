import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-border bg-surface p-6", className)} {...props} />;
}

export function Alert({
  tone = "danger",
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { tone?: "danger" | "success" }) {
  return (
    <p
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-md px-3 py-2 text-sm",
        tone === "danger" ? "bg-danger/10 text-danger" : "bg-success/10 text-success",
        className,
      )}
      {...props}
    />
  );
}
