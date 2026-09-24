"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "Products", match: (p: string) => p === "/admin" || p.startsWith("/admin/products") },
  { href: "/admin/orders", label: "Orders", match: (p: string) => p.startsWith("/admin/orders") },
  { href: "/admin/accounts", label: "Accounts", match: (p: string) => p.startsWith("/admin/accounts") },
  { href: "/admin/sales", label: "Sales", match: (p: string) => p.startsWith("/admin/sales") },
];

/** Vercel-style tab row: muted labels, white label + 2px underline on the active tab. */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="-mb-px flex gap-1 overflow-x-auto px-2 sm:px-4">
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative px-3 py-3 text-sm transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              active && "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
