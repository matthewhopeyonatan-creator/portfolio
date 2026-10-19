"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/** slug → quantity. Clicking a project adds it; the drawer adjusts quantities. */
type Items = Record<string, number>;

type CartValue = {
  items: Items;
  count: number;
  isOpen: boolean;
  /** bumps whenever something is added (drives the cart icon's little hop) */
  addedTick: number;
  add: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  open: () => void;
  close: () => void;
};

const CartContext = createContext<CartValue | null>(null);
const STORAGE_KEY = "hopes-grocer-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Items>({});
  const [isOpen, setIsOpen] = useState(false);
  const [addedTick, setAddedTick] = useState(0);

  // keep the cart through refreshes in the same tab; a new tab starts empty (sessionStorage)
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const add = useCallback((slug: string) => {
    setItems((it) => ({ ...it, [slug]: (it[slug] ?? 0) + 1 }));
    setAddedTick((t) => t + 1);
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    setItems((it) => {
      const next = { ...it };
      if (qty <= 0) delete next[slug];
      else next[slug] = qty;
      return next;
    });
  }, []);

  const value = useMemo<CartValue>(
    () => ({
      items,
      count: Object.values(items).reduce((a, b) => a + b, 0),
      isOpen,
      addedTick,
      add,
      setQty,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [items, isOpen, addedTick, add, setQty],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
