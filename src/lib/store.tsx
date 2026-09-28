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
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCheckoutPricing } from "@/lib/admin-operations.functions";

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
  freeShippingThreshold: number;
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
  const loadCheckoutPricing = useServerFn(getCheckoutPricing);
  const { data: checkoutPricing } = useQuery({
    queryKey: ["checkout-pricing"],
    queryFn: () => loadCheckoutPricing(),
  });
  const shippingFee = checkoutPricing?.shippingFee ?? site.shippingFee;
  const freeShippingThreshold = checkoutPricing?.freeShippingThreshold ?? site.freeShippingThreshold;

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
      const product = products.find((item) => item.id === productId);
      if (!product || product.stock <= 0) return prev;

      const found = prev.find((l) => l.productId === productId && l.size === size);
      const otherQty = prev
        .filter((l) => l.productId === productId && l.size !== size)
        .reduce((sum, line) => sum + line.qty, 0);
      const available = Math.max(0, Math.min(10, product.stock - otherQty));
      if (found) {
        const nextQty = Math.min(found.qty + qty, available);
        if (nextQty <= found.qty) return prev;
        return prev.map((l) =>
          l === found ? { ...l, qty: nextQty } : l,
        );
      }
      const nextQty = Math.min(qty, available);
      if (nextQty <= 0) return prev;
      return [...prev, { productId, size, qty: nextQty }];
    });
    setCartOpen(true);
  }, [products]);

  const setQty = useCallback((productId: string, size: string, qty: number) => {
    setLines((prev) => {
      if (qty <= 0) {
        return prev.filter((l) => !(l.productId === productId && l.size === size));
      }

      const product = products.find((item) => item.id === productId);
      if (!product) return prev;
      const otherQty = prev
        .filter((l) => l.productId === productId && l.size !== size)
        .reduce((sum, line) => sum + line.qty, 0);
      const available = Math.max(0, Math.min(20, product.stock - otherQty));
      if (available <= 0) {
        return prev.filter((l) => !(l.productId === productId && l.size === size));
      }
      return prev.map((line) =>
        line.productId === productId && line.size === size
          ? { ...line, qty: Math.min(qty, available) }
          : line,
      );
    });
  }, [products]);

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
      subtotal === 0 || subtotal >= freeShippingThreshold ? 0 : shippingFee;

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
      freeShippingThreshold,
      detailedLines,
    };
  }, [lines, wishlist, cartOpen, products, addToCart, setQty, removeLine, toggleWishlist, shippingFee, freeShippingThreshold]);

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
  freeShippingThreshold: site.freeShippingThreshold,
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
