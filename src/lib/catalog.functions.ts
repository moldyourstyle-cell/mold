import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { CategorySlug, Product } from "@/data/products";

type Row = Database["public"]["Tables"]["products"]["Row"];

export function rowToProduct(row: Row): Product {
  const cleanName = row.name.trim().replace(/\s+/g, " ");
  const titleName = cleanName.replace(/\b\p{L}[\p{L}'’-]*/gu, (word) =>
    word.charAt(0).toLocaleUpperCase("en-IN") + word.slice(1).toLocaleLowerCase("en-IN"),
  );
  const cleanCopy = (value: string) => value
    .replace(/Fit for your comfortable/gi, "Made for comfort")
    .replace(/Wide leg baggy feel free moment/gi, "Wide-leg, baggy, built for movement");
  return {
    id: row.id,
    slug: ["outdoorin", "outdoor"].includes(row.slug) ? "outdoor-jacket" : row.slug,
    name: ["outdoorin", "outdoor"].includes(row.slug) || cleanName.toLowerCase() === "outdoor"
      ? "Outdoor Jacket"
      : titleName,
    category: row.category as CategorySlug,
    price: row.price,
    compareAtPrice: row.compare_at_price ?? undefined,
    images: row.images,
    sizes: row.sizes,
    description: cleanCopy(row.description),
    fabric: row.fabric,
    fit: cleanCopy(row.fit),
    stock: row.stock,
    sku: row.sku,
    tags: row.tags,
    isNew: row.is_new,
    isClearanceSale: row.is_clearance_sale,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}


export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const supabasePublic = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  const { data, error } = await supabasePublic
    .from("products")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  // Subtract stock that is currently held by shoppers in checkout.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const reserved = new Map<string, number>();
  try {
    const { data: holds } = await (
      supabaseAdmin as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              c: string,
              v: string,
            ) => {
              gt: (
                c: string,
                v: string,
              ) => Promise<{ data: { product_id: string; qty: number }[] | null }>;
            };
          };
        };
      }
    )
      .from("stock_reservations")
      .select("product_id, qty")
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString());
    for (const h of holds ?? []) {
      reserved.set(h.product_id, (reserved.get(h.product_id) ?? 0) + h.qty);
    }
  } catch {
    /* holds are advisory; fall back to raw stock */
  }

  return (data ?? []).map((row) => {
    const product = rowToProduct(row);
    product.stock = Math.max(0, product.stock - (reserved.get(row.id) ?? 0));
    return product;
  });
});
