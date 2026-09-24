"use client";

import { useSyncExternalStore } from "react";

// Bag + wishlist live in the browser (guests can use both; checkout needs login). A tiny
// localStorage-backed external store: no provider, no dependency, synced across tabs via the
// `storage` event. The server snapshot is always empty, so SSR and first paint agree; counts
// appear right after hydration.

export type BagLine = {
  productId: string;
  slug: string;
  name: string;
  image?: string;
  price: number; // paise, display-only snapshot. The server re-prices at checkout.
  size: string;
  quantity: number;
};

export type WishItem = { productId: string; slug: string; name: string; image?: string; price: number };

const MAX_LINES = 20;
const MAX_WISH = 100;

function createStore<T>(key: string, sanitize: (v: unknown) => T[]) {
  let items: T[] = [];
  let loaded = false;
  const listeners = new Set<() => void>();
  const EMPTY: T[] = [];

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      items = sanitize(JSON.parse(window.localStorage.getItem(key) ?? "[]"));
    } catch {
      items = [];
    }
    window.addEventListener("storage", (e) => {
      if (e.key !== key) return;
      try {
        items = sanitize(JSON.parse(e.newValue ?? "[]"));
      } catch {
        items = [];
      }
      listeners.forEach((l) => l());
    });
  }

  function set(next: T[]) {
    items = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // storage full / private mode: keep the in-memory copy for this tab
    }
    listeners.forEach((l) => l());
  }

  return {
    subscribe(l: () => void) {
      load();
      listeners.add(l);
      return () => listeners.delete(l);
    },
    get: () => {
      load();
      return items;
    },
    getServer: () => EMPTY,
    set,
  };
}

const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length < 200;

const bag = createStore<BagLine>("cc-bag", (v) =>
  Array.isArray(v)
    ? v
        .filter((l) => l && isStr(l.productId) && isStr(l.slug) && isStr(l.size) && Number.isInteger(l.quantity) && l.quantity > 0)
        .slice(0, MAX_LINES)
    : [],
);

const wish = createStore<WishItem>("cc-wishlist", (v) =>
  Array.isArray(v) ? v.filter((w) => w && isStr(w.productId) && isStr(w.slug)).slice(0, MAX_WISH) : [],
);

export function useBag() {
  const lines = useSyncExternalStore(bag.subscribe, bag.get, bag.getServer);
  return {
    lines,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    add(line: Omit<BagLine, "quantity">, quantity = 1, max = 10) {
      const cur = bag.get();
      const i = cur.findIndex((l) => l.productId === line.productId && l.size === line.size);
      if (i >= 0) {
        const next = [...cur];
        next[i] = { ...next[i], ...line, quantity: Math.min(max, next[i].quantity + quantity) };
        bag.set(next);
      } else {
        bag.set([...cur, { ...line, quantity: Math.min(max, quantity) }].slice(-MAX_LINES));
      }
    },
    setQuantity(productId: string, size: string, quantity: number) {
      bag.set(bag.get().map((l) => (l.productId === productId && l.size === size ? { ...l, quantity: Math.max(1, quantity) } : l)));
    },
    remove(productId: string, size: string) {
      bag.set(bag.get().filter((l) => !(l.productId === productId && l.size === size)));
    },
    clear() {
      bag.set([]);
    },
  };
}

export function useWishlist() {
  const items = useSyncExternalStore(wish.subscribe, wish.get, wish.getServer);
  return {
    items,
    count: items.length,
    has: (productId: string) => items.some((w) => w.productId === productId),
    toggle(item: WishItem) {
      const cur = wish.get();
      wish.set(cur.some((w) => w.productId === item.productId) ? cur.filter((w) => w.productId !== item.productId) : [item, ...cur].slice(0, MAX_WISH));
    },
    remove(productId: string) {
      wish.set(wish.get().filter((w) => w.productId !== productId));
    },
  };
}
