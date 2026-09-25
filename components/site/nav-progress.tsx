"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin top bar that appears the moment an internal link is tapped and clears when the new
 * URL renders. Every page here is server-rendered from the database, so without it a tap
 * shows nothing until the response arrives and reads as a missed tap on phones.
 */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  // Remember the URL the navigation started from; the bar shows until the URL moves on.
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const current = search ? `${pathname}?${search}` : pathname;
  // The URL moved on: navigation done. Reset during render (no extra paint) so a later
  // Back to the starting URL doesn't resurrect the bar.
  if (startedAt !== null && startedAt !== current) setStartedAt(null);
  const active = startedAt !== null;

  useEffect(() => {
    // Capture phase: next/link calls preventDefault in React's handler, which runs later.
    function onClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page or #hash
      setStartedAt(location.pathname + location.search);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Safety net: a navigation that never commits (offline, cancelled) must not leave the bar up.
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setStartedAt(null), 15000);
    return () => window.clearTimeout(t);
  }, [active]);

  if (!active) return null;
  return (
    <div role="progressbar" aria-label="Loading page" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5">
      <div className="animate-nav-progress h-full origin-left bg-primary" />
    </div>
  );
}
