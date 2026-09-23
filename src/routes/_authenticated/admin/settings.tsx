import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/AdminOperationsNav";
import { getStoreSettings, saveStoreSettings } from "@/lib/admin-operations.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: SettingsPage });

type SettingsForm = { storeName: string; storeEmail: string; storePhone: string; currency: "INR" | "USD" | "EUR" | "GBP"; shippingFee: string; freeShippingThreshold: string; codFee: string; lowStockThreshold: string; newOrders: boolean; lowStock: boolean; profileName: string; password: string; confirmPassword: string };

function SettingsPage() {
  const queryClient = useQueryClient();
  const load = useServerFn(getStoreSettings);
  const saveSettings = useServerFn(saveStoreSettings);
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-store-settings"], queryFn: () => load({ data: undefined }) });
  const [form, setForm] = useState<SettingsForm>({ storeName: "MOLD", storeEmail: "moldyourstyle@gmail.com", storePhone: "", currency: "INR", shippingFee: "99", freeShippingThreshold: "1999", codFee: "49", lowStockThreshold: "5", newOrders: true, lowStock: true, profileName: "", password: "", confirmPassword: "" });
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!data) return;
    void supabase.auth.getUser().then(({ data: auth }) => setForm((current) => ({ ...current, storeName: data.store_name, storeEmail: data.store_email, storePhone: data.store_phone, currency: data.currency as SettingsForm["currency"], shippingFee: String(data.shipping_fee), freeShippingThreshold: String(data.free_shipping_threshold), codFee: String(data.cod_fee), lowStockThreshold: String(data.low_stock_threshold), newOrders: Boolean((data.notification_preferences as { newOrders?: boolean }).newOrders), lowStock: Boolean((data.notification_preferences as { lowStock?: boolean }).lowStock), profileName: String(auth.user?.user_metadata?.["full_name"] ?? auth.user?.user_metadata?.["name"] ?? "") })));
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (form.password && form.password !== form.confirmPassword) throw new Error("Passwords do not match.");
      await saveSettings({ data: { storeName: form.storeName, storeEmail: form.storeEmail, storePhone: form.storePhone, currency: form.currency, shippingFee: Number(form.shippingFee), freeShippingThreshold: Number(form.freeShippingThreshold), codFee: Number(form.codFee), lowStockThreshold: Number(form.lowStockThreshold), notificationPreferences: { newOrders: form.newOrders, lowStock: form.lowStock } } });
      const profileResult = await supabase.auth.updateUser({ data: { full_name: form.profileName } });
      if (profileResult.error) throw profileResult.error;
      if (form.password) {
        const passwordResult = await supabase.auth.updateUser({ password: form.password });
        if (passwordResult.error) throw passwordResult.error;
      }
    },
    onSuccess: () => { setNotice("Settings saved."); setForm((current) => ({ ...current, password: "", confirmPassword: "" })); void queryClient.invalidateQueries({ queryKey: ["admin-store-settings"] }); },
    onError: (failure) => setNotice(failure instanceof Error ? failure.message : "Could not save settings."),
  });

  if (isLoading) return <AdminPageShell title="Settings"><p className="mt-6 label-mono text-muted-ink">Loading settings…</p></AdminPageShell>;
  if (error) return <AdminPageShell title="Settings"><p className="mt-6 text-sm text-red-600">{error.message}</p></AdminPageShell>;

  const set = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <AdminPageShell title="Settings">
      <form onSubmit={(event) => { event.preventDefault(); setNotice(""); save.mutate(); }} className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 border border-line p-5"><h2 className="display text-2xl">Store profile</h2><TextField label="Store name" value={form.storeName} onChange={(value) => set("storeName", value)} /><TextField label="Store email" type="email" value={form.storeEmail} onChange={(value) => set("storeEmail", value)} /><TextField label="Store phone" value={form.storePhone} onChange={(value) => set("storePhone", value)} /><label className="label-mono text-muted-ink">Currency<select value={form.currency} onChange={(event) => set("currency", event.target.value as SettingsForm["currency"])} className="mt-1 block w-full border border-line bg-paper px-3 py-2.5 text-sm text-ink"><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option></select></label></section>
        <section className="space-y-4 border border-line p-5"><h2 className="display text-2xl">Order settings</h2><TextField label="Shipping fee" type="number" value={form.shippingFee} onChange={(value) => set("shippingFee", value)} /><TextField label="Free shipping threshold" type="number" value={form.freeShippingThreshold} onChange={(value) => set("freeShippingThreshold", value)} /><TextField label="COD fee" type="number" value={form.codFee} onChange={(value) => set("codFee", value)} /><TextField label="Low-stock threshold" type="number" value={form.lowStockThreshold} onChange={(value) => set("lowStockThreshold", value)} /></section>
        <section className="space-y-4 border border-line p-5"><h2 className="display text-2xl">Admin profile</h2><TextField label="Display name" value={form.profileName} onChange={(value) => set("profileName", value)} /><p className="text-sm text-muted-ink">Signed in as the current Supabase admin account.</p><TextField label="New password" type="password" value={form.password} onChange={(value) => set("password", value)} /><TextField label="Confirm new password" type="password" value={form.confirmPassword} onChange={(value) => set("confirmPassword", value)} /><p className="text-xs text-muted-ink">Leave password fields blank to keep your current password.</p></section>
        <section className="space-y-4 border border-line p-5"><h2 className="display text-2xl">Notifications</h2><Toggle label="New order alerts" checked={form.newOrders} onChange={(value) => set("newOrders", value)} /><Toggle label="Low-stock alerts" checked={form.lowStock} onChange={(value) => set("lowStock", value)} /><p className="text-xs text-muted-ink">Preferences are saved with store settings. Email delivery requires a notification service.</p></section>
        <div className="flex flex-wrap items-center gap-4 lg:col-span-2">{notice && <p role="status" className="text-sm text-accent">{notice}</p>}<button disabled={save.isPending} className="bg-ink px-6 py-3 label-mono text-paper disabled:opacity-50">{save.isPending ? "Saving…" : "Save settings"}</button></div>
      </form>
    </AdminPageShell>
  );
}

function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block label-mono text-muted-ink">{label}<input type={type} min={type === "number" ? "0" : undefined} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block w-full border border-line bg-transparent px-3 py-2.5 text-sm text-ink" /></label>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="flex items-center justify-between gap-4 border-b border-line py-3 text-sm"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-ink" /></label>; }
