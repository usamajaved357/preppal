import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartLine {
  variantId: string;
  productSlug: string;
  name: string;
  label: string;
  pricePkr: number;
  imageUrl: string | null;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  add: (line: Omit<CartLine, 'qty'>, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
}

/**
 * Cart lives in localStorage. Prices here are display-only —
 * the API recalculates every price when the order is placed.
 */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, qty = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.variantId === line.variantId);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.variantId === line.variantId ? { ...l, qty: Math.min(50, l.qty + qty) } : l,
              ),
            };
          }
          return { lines: [...s.lines, { ...line, qty }] };
        }),
      setQty: (variantId, qty) =>
        set((s) => ({
          lines:
            qty <= 0
              ? s.lines.filter((l) => l.variantId !== variantId)
              : s.lines.map((l) => (l.variantId === variantId ? { ...l, qty: Math.min(50, qty) } : l)),
        })),
      remove: (variantId) => set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: 'preppal-cart-v1' },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((a, l) => a + l.qty, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((a, l) => a + l.qty * l.pricePkr, 0);
