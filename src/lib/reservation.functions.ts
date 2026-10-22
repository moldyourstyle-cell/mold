import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type RpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

async function rpc(fn: string, args: Record<string, unknown>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as unknown as RpcClient).rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
}

export const RESERVATION_TTL_SECONDS = 900;

const reserveInput = z.object({
  token: z.string().uuid(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        size: z.string().max(12).default(""),
        qty: z.coerce.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(30),
});

/** Public: holds the selected quantities for a short window while the shopper checks out. */
export const reserveStock = createServerFn({ method: "POST" })
  .validator(reserveInput)
  .handler(async ({ data }) => {
    const expiresAt = (await rpc("reserve_stock", {
      _token: data.token,
      _items: data.items.map((i) => ({
        product_id: i.productId,
        size: i.size,
        qty: i.qty,
      })),
      _ttl_seconds: RESERVATION_TTL_SECONDS,
    })) as string;
    return { expiresAt };
  });

/** Public: gives the held stock back to everyone else. */
export const releaseStock = createServerFn({ method: "POST" })
  .validator((token: unknown) => z.string().uuid().parse(token))
  .handler(async ({ data: token }) => {
    await rpc("release_reservation", { _token: token });
    return { ok: true };
  });
