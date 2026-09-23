import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SavedAddress = {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

export const listSavedAddresses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("saved_addresses")
      .select("id,label,full_name,phone,address,city,state,pincode,is_default")
      .eq("user_id", context.userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data as SavedAddress[];
  });

const savedAddressInput = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(40).default("Home"),
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(6).max(20),
  address: z.string().trim().min(4).max(300),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  pincode: z.string().trim().min(4).max(12),
  isDefault: z.boolean().default(false),
});

export const saveAddress = createServerFn({ method: "POST" })
  .inputValidator(savedAddressInput)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    if (data.isDefault) {
      const { error } = await context.supabase
        .from("saved_addresses")
        .update({ is_default: false })
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    }
    const { error } = await context.supabase.from("saved_addresses").upsert({
      ...(data.id ? { id: data.id } : {}),
      user_id: context.userId,
      label: data.label,
      full_name: data.fullName,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      is_default: data.isDefault,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSavedAddress = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => z.string().uuid().parse(value))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data: id }) => {
    const { error } = await context.supabase
      .from("saved_addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
