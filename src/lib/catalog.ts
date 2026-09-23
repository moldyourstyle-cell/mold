import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listProducts } from "./catalog.functions";
import type { Product } from "@/data/products";

export const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  queryFn: async () => {
    try {
      return await listProducts();
    } catch (error) {
      // Keep the storefront shell available when Supabase is temporarily down.
      // Product-dependent pages can render their existing empty states.
      console.error("Could not load the product catalog:", error);
      return [] as Product[];
    }
  },
  staleTime: 60_000,
});

export function useCatalog(): Product[] {
  return useSuspenseQuery(catalogQuery).data;
}
