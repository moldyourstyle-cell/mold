import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type OrderStatus = Database["public"]["Enums"]["order_status"];

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

export type OrderItem = {
  id: string;
  productId: string | null;
  productName: string;
  productSlug: string;
  size: string;
  qty: number;
  unitPrice: number;
  image: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: string;
  paymentStatus: string;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  codFee: number;
  total: number;
  notes: string;
  createdAt: string;
  items: OrderItem[];
};

const placeOrderInput = z.object({
  customerName: z.string().min(1).max(120),
  email: z.string().trim().max(200).refine(
    (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    "Enter a valid email address",
  ).default(""),
  phone: z.string().min(6).max(20),
  address: z.string().min(4).max(300),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(80),
  pincode: z.string().min(4).max(12),
  paymentMethod: z.literal("cod"),
  notes: z.string().max(500).default(""),
  reservationToken: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        size: z.string().min(1).max(12),
        qty: z.coerce.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(30),
});


/** Public: places a Cash-on-Delivery order. Prices are re-read server-side. */
export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator(placeOrderInput)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: storeSettings } = await supabaseAdmin
      .from("store_settings")
      .select("shipping_fee, free_shipping_threshold, cod_fee")
      .eq("id", true)
      .maybeSingle();
    const shippingFee = storeSettings?.shipping_fee ?? 99;
    const freeShippingThreshold = storeSettings?.free_shipping_threshold ?? 1999;
    const codFee = storeSettings?.cod_fee ?? 49;

    const ids = [...new Set(data.items.map((i) => i.productId))];
    const { data: products, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, name, slug, price, images, is_published")
      .in("id", ids);
    if (productError) throw new Error(productError.message);

    const byId = new Map((products ?? []).map((p) => [p.id, p]));
    const lines = data.items.map((item) => {
      const product = byId.get(item.productId);
      if (!product || !product.is_published) {
        throw new Error("One of the items is no longer available");
      }
      return {
        product_id: product.id,
        product_name: product.name,
        product_slug: product.slug,
        size: item.size,
        qty: item.qty,
        unit_price: product.price,
        image: product.images?.[0] ?? "",
      };
    });

    const subtotal = lines.reduce((sum, l) => sum + l.unit_price * l.qty, 0);
    const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;
    const total = subtotal + shipping + codFee;

    // Link the order to the signed-in shopper when a valid session is present.
    let userId: string | null = null;
    try {
      const { getRequestHeader } = await import("@tanstack/react-start/server");
      const authHeader = getRequestHeader("authorization") ?? "";
      const token = authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7).trim()
        : "";
      if (token) {
        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        userId = userData?.user?.id ?? null;
      }
    } catch {
      userId = null;
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        customer_name: data.customerName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        payment_method: "cod",
        notes: data.notes,
        subtotal,
        shipping,
        cod_fee: codFee,
        total,
      })
      .select("id, order_number, total")
      .single();
    if (error) throw new Error(error.message);

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(lines.map((l) => ({ ...l, order_id: order.id })));
    if (itemsError) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error(itemsError.message);
    }

    // Turn the held stock into a real deduction (or reserve now if the hold expired).
    const rpc = supabaseAdmin as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>;
    };
    const token = data.reservationToken ?? crypto.randomUUID();
    try {
      const { error: reserveError } = await rpc.rpc("reserve_stock", {
        _token: token,
        _items: data.items.map((i) => ({
          product_id: i.productId,
          size: i.size,
          qty: i.qty,
        })),
        _ttl_seconds: 900,
      });
      if (reserveError) throw new Error(reserveError.message);
      const { error: consumeError } = await rpc.rpc("consume_reservation", {
        _token: token,
        _order_id: order.id,
      });
      if (consumeError) throw new Error(consumeError.message);
    } catch (err) {
      await supabaseAdmin.from("order_items").delete().eq("order_id", order.id);
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw err instanceof Error ? err : new Error("Stock is no longer available");
    }

    return {
      orderNumber: order.order_number,
      total: order.total,
      subtotal,
      shipping,
      codFee,
    };
  });


export type TrackedOrder = {
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  codFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
};

/**
 * Public: look up an order by its number plus the email or phone used at
 * checkout. Returns only customer-safe fields (no address or contact data).
 */
export const trackOrder = createServerFn({ method: "GET" })
  .inputValidator(
    (input: unknown) =>
      z
        .object({
          orderNumber: z.string().min(3).max(40),
          contact: z.string().min(5).max(200),
        })
        .parse(input),
  )
  .handler(async ({ data }): Promise<TrackedOrder | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const orderNumber = data.orderNumber.trim().toUpperCase();
    const contact = data.contact.trim().toLowerCase();

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, email, phone, status, subtotal, shipping, cod_fee, total, payment_method, payment_status, created_at, order_items(*)")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return null;

    const matches =
      order.email.toLowerCase() === contact ||
      order.phone.replace(/\D/g, "").endsWith(contact.replace(/\D/g, "").slice(-10));
    if (!matches) return null;

    return {
      orderNumber: order.order_number,
      status: order.status,
      subtotal: order.subtotal,
      shipping: order.shipping,
      codFee: order.cod_fee,
      total: order.total,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      createdAt: order.created_at,
      items: (order.order_items ?? []).map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        productSlug: item.product_slug,
        size: item.size,
        qty: item.qty,
        unitPrice: item.unit_price,
        image: item.image,
      })),
    };
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

export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Order[]> => {
    await requireAdmin(context);
    const { data, error } = await context.supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => ({
      id: row.id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      city: row.city,
      state: row.state,
      pincode: row.pincode,
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      status: row.status,
      subtotal: row.subtotal,
      shipping: row.shipping,
      codFee: row.cod_fee,
      total: row.total,
      notes: row.notes,
      createdAt: row.created_at,
      items: (row.order_items ?? []).map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        productSlug: item.product_slug,
        size: item.size,
        qty: item.qty,
        unitPrice: item.unit_price,
        image: item.image,
      })),
    }));
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"]),
    }),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { error } = await context.supabase
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    // Cancelled or returned orders put their pieces back on sale.
    if (data.status === "cancelled" || data.status === "returned") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: restoreError } = await (
        supabaseAdmin as unknown as {
          rpc: (
            fn: string,
            args: Record<string, unknown>,
          ) => Promise<{ error: { message: string } | null }>;
        }
      ).rpc("restore_order_stock", { _order_id: data.id });
      if (restoreError) throw new Error(restoreError.message);
    }
    return { ok: true };

  });

export const deleteOrder = createServerFn({ method: "POST" })
  .inputValidator((id: string) => z.string().uuid().parse(id))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("orders").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type MyOrder = TrackedOrder & {
  customerName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  notes: string;
};

/** Signed-in shopper: their own orders (matched by account id or email). */
export const myOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyOrder[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = String((context.claims as { email?: string })?.email ?? "")
      .trim()
      .toLowerCase();

    const filters = [`user_id.eq.${context.userId}`];
    if (email) filters.push(`email.eq.${email}`);

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .or(filters.join(","))
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => ({
      orderNumber: row.order_number,
      status: row.status,
      subtotal: row.subtotal,
      shipping: row.shipping,
      codFee: row.cod_fee,
      total: row.total,
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      createdAt: row.created_at,
      customerName: row.customer_name,
      address: row.address,
      city: row.city,
      state: row.state,
      pincode: row.pincode,
      phone: row.phone,
      email: row.email,
      notes: row.notes,
      items: (row.order_items ?? []).map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        productSlug: item.product_slug,
        size: item.size,
        qty: item.qty,
        unitPrice: item.unit_price,
        image: item.image,
      })),
    }));
  });
