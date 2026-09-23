import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type Product } from "@/data/products";
import { site } from "@/config/site";

export type CartLine = {
  productId: string;
  size: string;
  qty: number;
};

type StoreValue = {
  lines: CartLine[];
  wishlist: string[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (productId: string, size: string, qty?: number) => void;
  setQty: (productId: string, size: string, qty: number) => void;
  removeLine: (productId: string, size: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  detailedLines: { line: CartLine; product: Product }[];
};

// Cache the context on globalThis so duplicate module instances (HMR, split
// client/server graphs) share the same provider instead of reading a null one.
const CONTEXT_KEY = "__mold_store_context__";
const globalScope = globalThis as unknown as Record<string, unknown>;
const StoreContext =
  (globalScope[CONTEXT_KEY] as React.Context<StoreValue | null> | undefined) ??
  createContext<StoreValue | null>(null);
globalScope[CONTEXT_KEY] = StoreContext;

const CART_KEY = "mold.cart.v1";
const WISH_KEY = "mold.wishlist.v1";

export function StoreProvider({
  children,
  products,
}: {
  children: ReactNode;
  products: Product[];
}) {

  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const c = localStorage.getItem(CART_KEY);
      const w = localStorage.getItem(WISH_KEY);
      if (c) setLines(JSON.parse(c));
      if (w) setWishlist(JSON.parse(w));
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist, hydrated]);

  const addToCart = useCallback((productId: string, size: string, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.productId === productId && l.size === size);
      if (found) {
        return prev.map((l) =>
          l === found ? { ...l, qty: Math.min(l.qty + qty, 10) } : l,
        );
      }
      return [...prev, { productId, size, qty }];
    });
    setCartOpen(true);
  }, []);

  const setQty = useCallback((productId: string, size: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => !(l.productId === productId && l.size === size))
        : prev.map((l) =>
            l.productId === productId && l.size === size ? { ...l, qty } : l,
          ),
    );
  }, []);

  const removeLine = useCallback((productId: string, size: string) => {
    setLines((prev) =>
      prev.filter((l) => !(l.productId === productId && l.size === size)),
    );
  }, []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  }, []);

  const value = useMemo<StoreValue>(() => {
    const detailedLines = lines
      .map((line) => ({
        line,
        product: products.find((p) => p.id === line.productId)!,
      }))
      .filter((entry) => Boolean(entry.product));

    const subtotal = detailedLines.reduce(
      (sum, { line, product }) => sum + product.price * line.qty,
      0,
    );
    const shipping =
      subtotal === 0 || subtotal >= site.freeShippingThreshold ? 0 : site.shippingFee;

    return {
      lines,
      wishlist,
      cartOpen,
      setCartOpen,
      addToCart,
      setQty,
      removeLine,
      clearCart: () => setLines([]),
      toggleWishlist,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
      detailedLines,
    };
  }, [lines, wishlist, cartOpen, products, addToCart, setQty, removeLine, toggleWishlist]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

const emptyStore: StoreValue = {
  lines: [],
  wishlist: [],
  cartOpen: false,
  setCartOpen: () => {},
  addToCart: () => {},
  setQty: () => {},
  removeLine: () => {},
  clearCart: () => {},
  toggleWishlist: () => {},
  count: 0,
  subtotal: 0,
  shipping: 0,
  total: 0,
  detailedLines: [],
};

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    // Never crash the whole page (blank screen) if the provider is missing.
    if (import.meta.env.DEV) {
      console.warn("useStore used outside StoreProvider — falling back to an empty cart.");
    }
    return emptyStore;
  }
  return ctx;
}
