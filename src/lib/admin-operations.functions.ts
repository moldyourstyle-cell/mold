import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type UserSupabase = SupabaseClient<Database>;
type AdminContext = { supabase: UserSupabase; userId: string };

export type AdminManagementOrder = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items: Database["public"]["Tables"]["order_items"]["Row"][];
};
export type AdminManagementProduct = Database["public"]["Tables"]["products"]["Row"];
export type AdminManagementData = {
  orders: AdminManagementOrder[];
  products: AdminManagementProduct[];
  reservations: { product_id: string; size: string; qty: number }[];
  authCustomers: { id: string; email: string; phone: string; createdAt: string; name: string }[];
};

async function requireAdmin(context: AdminContext) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required");
}

export const getAdminManagementData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [ordersResult, productsResult, holdsResult] = await Promise.all([
      supabaseAdmin.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
      supabaseAdmin.from("products").select("*").order("name"),
      supabaseAdmin
        .from("stock_reservations")
        .select("product_id, size, qty")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString()),
    ]);
    if (ordersResult.error) throw new Error(ordersResult.error.message);
    if (productsResult.error) throw new Error(productsResult.error.message);
    if (holdsResult.error) throw new Error(holdsResult.error.message);

    const authCustomers: { id: string; email: string; phone: string; createdAt: string; name: string }[] = [];
    for (let page = 1; ; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(error.message);
      for (const user of data.users) {
        authCustomers.push({
          id: user.id,
          email: user.email ?? "",
          phone: user.phone ?? "",
          createdAt: user.created_at,
          name: String(user.user_metadata?.["full_name"] ?? user.user_metadata?.["name"] ?? ""),
        });
      }
      if (data.users.length < 1000) break;
    }

    return {
      orders: ordersResult.data as unknown as AdminManagementOrder[],
      products: productsResult.data,
      reservations: holdsResult.data,
      authCustomers,
    } satisfies AdminManagementData;
  });

export const listCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

const couponInput = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(40).transform((value) => value.toUpperCase()),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().positive(),
  minimumOrderAmount: z.number().min(0),
  maximumDiscount: z.number().min(0).nullable(),
  startsAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  usageLimit: z.number().int().min(0).nullable(),
  isActive: z.boolean(),
});

export const saveCoupon = createServerFn({ method: "POST" })
  .validator(couponInput)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const values = {
      code: data.code,
      discount_type: data.discountType,
      discount_value: data.discountValue,
      minimum_order_amount: data.minimumOrderAmount,
      maximum_discount: data.maximumDiscount,
      starts_at: data.startsAt,
      expires_at: data.expiresAt,
      usage_limit: data.usageLimit,
      is_active: data.isActive,
      updated_at: new Date().toISOString(),
    };
    const result = data.id
      ? await context.supabase.from("coupons").update(values).eq("id", data.id)
      : await context.supabase.from("coupons").insert(values);
    if (result.error) throw new Error(result.error.message);
    return { ok: true };
  });

export const deleteCoupon = createServerFn({ method: "POST" })
  .validator((id: string) => z.string().uuid().parse(id))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("coupons").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getStoreSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase
      .from("store_settings")
      .select("*")
      .eq("id", true)
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

/** Public checkout rates; exposes only the amounts needed to price an order. */
export const getCheckoutPricing = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("store_settings")
    .select("shipping_fee, free_shipping_threshold, cod_fee")
    .eq("id", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return {
    shippingFee: data?.shipping_fee ?? 99,
    freeShippingThreshold: data?.free_shipping_threshold ?? 1999,
    codFee: data?.cod_fee ?? 49,
  };
});

const settingsInput = z.object({
  storeName: z.string().trim().min(1).max(100),
  storeEmail: z.string().trim().email().max(200),
  storePhone: z.string().trim().max(30),
  currency: z.enum(["INR", "USD", "EUR", "GBP"]),
  shippingFee: z.number().int().min(0),
  freeShippingThreshold: z.number().int().min(0),
  codFee: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0),
  notificationPreferences: z.object({ newOrders: z.boolean(), lowStock: z.boolean() }),
});

export const saveStoreSettings = createServerFn({ method: "POST" })
  .validator(settingsInput)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("store_settings").upsert({
      id: true,
      store_name: data.storeName,
      store_email: data.storeEmail,
      store_phone: data.storePhone,
      currency: data.currency,
      shipping_fee: data.shippingFee,
      free_shipping_threshold: data.freeShippingThreshold,
      cod_fee: data.codFee,
      low_stock_threshold: data.lowStockThreshold,
      notification_preferences: data.notificationPreferences,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
