import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { Product } from "@/data/products";

const productInput = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(["jackets", "t-shirts", "shirts", "pants"]),
  price: z.coerce.number().int().min(0),
  compareAtPrice: z.coerce.number().int().min(0).optional(),
  images: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
  description: z.string().default(""),
  fabric: z.string().default(""),
  fit: z.string().default(""),
  stock: z.coerce.number().int().min(0).default(0),
  sku: z.string().default(""),
  tags: z.array(z.string()).default([]),
  isNew: z.boolean().default(false),
  isPublished: z.boolean().default(true),
});

async function requireAdmin(context: {
  supabase: ReturnType<typeof import("@supabase/supabase-js").createClient<Database>>;
  userId: string;
}) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required");
}

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    return { isAdmin: Boolean(data) };
  });

export const bootstrapFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Only the designated owner account may ever self-promote to admin.
    const email = (context.claims as { email?: string }).email?.toLowerCase();
    if (email !== "moldyourstyle@gmail.com") {
      return { ok: false as const, reason: "not_owner" as const };
    }
    const { count, error: countError } = await context.supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) > 0) return { ok: false as const, reason: "exists" as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_roles").insert({
      user_id: context.userId,
      role: "admin",
    });
    if (error) throw new Error(error.message);
    return { ok: true as const, reason: null };
  });




export const listAdminProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Product[];
  });

export const getAdminProduct = createServerFn({ method: "GET" })
  .inputValidator((id: string) => z.string().uuid().parse(id))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase.from("products").select("*").eq("id", id).single();
    if (error) throw new Error(error.message);
    return data as unknown as Product;
  });

export const createProduct = createServerFn({ method: "POST" })
  .inputValidator(productInput)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { data: inserted, error } = await context.supabase
      .from("products")
      .insert({
        slug: data.slug,
        name: data.name,
        category: data.category,
        price: data.price,
        compare_at_price: data.compareAtPrice || null,
        images: data.images,
        sizes: data.sizes,
        description: data.description,
        fabric: data.fabric,
        fit: data.fit,
        stock: data.stock,
        sku: data.sku,
        tags: data.tags,
        is_new: data.isNew,
        is_published: data.isPublished,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return inserted as unknown as Product;
  });

export const updateProduct = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      values: productInput,
    }),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { data: updated, error } = await context.supabase
      .from("products")
      .update({
        slug: data.values.slug,
        name: data.values.name,
        category: data.values.category,
        price: data.values.price,
        compare_at_price: data.values.compareAtPrice || null,
        images: data.values.images,
        sizes: data.values.sizes,
        description: data.values.description,
        fabric: data.values.fabric,
        fit: data.values.fit,
        stock: data.values.stock,
        sku: data.values.sku,
        tags: data.values.tags,
        is_new: data.values.isNew,
        is_published: data.values.isPublished,
      })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated as unknown as Product;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((id: string) => z.string().uuid().parse(id))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
