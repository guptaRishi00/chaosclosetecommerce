"use client";

import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { adminLogout } from "@/lib/actions/auth.actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ name, email }: { name: string; email: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#c1121f] to-[#fdf0d5] text-[11px] font-semibold text-black outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="text-sm font-medium text-foreground">{name}</span>
          <span className="truncate text-xs text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/" target="_blank">
            Storefront
            <ExternalLink className="ml-auto" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={adminLogout}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              Log out
              <LogOut className="ml-auto" />
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
