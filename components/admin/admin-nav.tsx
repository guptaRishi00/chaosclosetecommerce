"use client";

import { useState } from "react";
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
  // Optimistic selection: the tapped tab lights up at once instead of after the server
  // responds. Tied to the pathname it was tapped on, so it clears when the route changes.
  const [pending, setPending] = useState<{ href: string; from: string } | null>(null);
  const pendingHref = pending?.from === pathname ? pending.href : null;

  return (
    <nav aria-label="Admin" className="-mb-px flex gap-1 overflow-x-auto px-2 sm:px-4">
      {TABS.map((tab) => {
        const active = pendingHref ? tab.href === pendingHref : tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={() => !tab.match(pathname) && setPending({ href: tab.href, from: pathname })}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative shrink-0 px-3 py-3 text-sm transition-colors",
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
