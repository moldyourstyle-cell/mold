import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AdminPageShell } from "@/components/AdminOperationsNav";
import { deleteCoupon, listCoupons, saveCoupon } from "@/lib/admin-operations.functions";

export const Route = createFileRoute("/_authenticated/admin/coupons")({ component: CouponsPage });

type CouponForm = { id?: string; code: string; discountType: "percentage" | "fixed"; discountValue: string; minimumOrderAmount: string; maximumDiscount: string; startsAt: string; expiresAt: string; usageLimit: string; isActive: boolean };
const empty: CouponForm = { code: "", discountType: "percentage", discountValue: "10", minimumOrderAmount: "0", maximumDiscount: "", startsAt: "", expiresAt: "", usageLimit: "", isActive: true };

function CouponsPage() {
  const queryClient = useQueryClient();
  const fetchCoupons = useServerFn(listCoupons);
  const persistCoupon = useServerFn(saveCoupon);
  const removeCoupon = useServerFn(deleteCoupon);
  const { data: coupons = [], isLoading, error } = useQuery({ queryKey: ["admin-coupons"], queryFn: () => fetchCoupons({ data: undefined }) });
  const [form, setForm] = useState<CouponForm>(empty);
  const [message, setMessage] = useState("");
  const save = useMutation({
    mutationFn: () => persistCoupon({ data: {
      id: form.id,
      code: form.code,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minimumOrderAmount: Number(form.minimumOrderAmount || 0),
      maximumDiscount: form.maximumDiscount ? Number(form.maximumDiscount) : null,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      isActive: form.isActive,
    } }),
    onSuccess: () => { setMessage("Coupon saved."); setForm(empty); void queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }); },
    onError: (failure) => setMessage(failure instanceof Error ? failure.message : "Could not save coupon."),
  });
  const remove = useMutation({ mutationFn: (id: string) => removeCoupon({ data: id }), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }), onError: (failure) => setMessage(failure.message) });
  const edit = (coupon: (typeof coupons)[number]) => setForm({ id: coupon.id, code: coupon.code, discountType: coupon.discount_type as CouponForm["discountType"], discountValue: String(coupon.discount_value), minimumOrderAmount: String(coupon.minimum_order_amount), maximumDiscount: coupon.maximum_discount == null ? "" : String(coupon.maximum_discount), startsAt: coupon.starts_at ? coupon.starts_at.slice(0, 16) : "", expiresAt: coupon.expires_at ? coupon.expires_at.slice(0, 16) : "", usageLimit: coupon.usage_limit == null ? "" : String(coupon.usage_limit), isActive: coupon.is_active });

  return (
    <AdminPageShell title="Coupons & Offers">
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <form onSubmit={(event) => { event.preventDefault(); setMessage(""); save.mutate(); }} className="h-fit space-y-4 border border-line p-5">
          <div className="flex items-center justify-between"><h2 className="display text-2xl">{form.id ? "Edit coupon" : "Create coupon"}</h2>{form.id && <button type="button" onClick={() => setForm(empty)} className="label-mono text-muted-ink underline">New</button>}</div>
          <label className="label-mono text-muted-ink">Coupon code<input required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="MOLD10" className="mt-1 block w-full border border-line bg-transparent px-3 py-2.5 text-sm text-ink" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="label-mono text-muted-ink">Discount type<select value={form.discountType} onChange={(event) => setForm({ ...form, discountType: event.target.value as CouponForm["discountType"] })} className="mt-1 block w-full border border-line bg-paper px-3 py-2.5 text-sm text-ink"><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></label><label className="label-mono text-muted-ink">Discount value<input required type="number" min="0.01" step="0.01" value={form.discountValue} onChange={(event) => setForm({ ...form, discountValue: event.target.value })} className="mt-1 block w-full border border-line bg-transparent px-3 py-2.5 text-sm text-ink" /></label></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Minimum order" value={form.minimumOrderAmount} onChange={(value) => setForm({ ...form, minimumOrderAmount: value })} type="number" /><Field label="Maximum discount" value={form.maximumDiscount} onChange={(value) => setForm({ ...form, maximumDiscount: value })} type="number" /></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Starts at" value={form.startsAt} onChange={(value) => setForm({ ...form, startsAt: value })} type="datetime-local" /><Field label="Expires at" value={form.expiresAt} onChange={(value) => setForm({ ...form, expiresAt: value })} type="datetime-local" /></div>
          <Field label="Usage limit (blank = unlimited)" value={form.usageLimit} onChange={(value) => setForm({ ...form, usageLimit: value })} type="number" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />Active</label>
          {message && <p role="status" className="text-sm text-accent">{message}</p>}
          <button disabled={save.isPending} className="bg-ink px-5 py-3 label-mono text-paper disabled:opacity-50">{save.isPending ? "Saving…" : form.id ? "Save coupon" : "Create coupon"}</button>
        </form>
        <section><h2 className="display text-2xl">Existing offers</h2>{isLoading ? <p className="mt-4 label-mono text-muted-ink">Loading coupons…</p> : error ? <p className="mt-4 text-sm text-red-600">{error.message}</p> : <div className="mt-4 overflow-x-auto border border-line"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-muted/50"><tr>{["Code", "Offer", "Usage", "Expiry", "Status", "Actions"].map((label) => <th key={label} className="px-3 py-3 label-mono text-muted-ink">{label}</th>)}</tr></thead><tbody>{coupons.map((coupon) => { const status = couponStatus(coupon); return <tr key={coupon.id} className="border-t border-line"><td className="px-3 py-3 font-semibold">{coupon.code}</td><td className="px-3 py-3">{coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`} off</td><td className="px-3 py-3">{coupon.usage_count}{coupon.usage_limit == null ? " / ∞" : ` / ${coupon.usage_limit}`}</td><td className="px-3 py-3">{coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString("en-IN") : "No expiry"}</td><td className="px-3 py-3 capitalize">{status}</td><td className="px-3 py-3"><div className="flex gap-3"><button onClick={() => edit(coupon)} className="label-mono text-accent">Edit</button><button onClick={() => remove.mutate(coupon.id)} className="label-mono text-red-600">Delete</button></div></td></tr>; })}{coupons.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-ink">No coupons created.</td></tr>}</tbody></table></div>}</section>
      </div>
    </AdminPageShell>
  );
}

function Field({ label, value, onChange, type }: { label: string; value: string; onChange: (value: string) => void; type: string }) { return <label className="label-mono text-muted-ink">{label}<input type={type} min={type === "number" ? "0" : undefined} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block w-full border border-line bg-transparent px-3 py-2.5 text-sm text-ink" /></label>; }

function couponStatus(coupon: { is_active: boolean; starts_at: string | null; expires_at: string | null; usage_limit: number | null; usage_count: number }) {
  const now = Date.now();
  if (!coupon.is_active) return "inactive";
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) return "scheduled";
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) return "expired";
  if (coupon.usage_limit != null && coupon.usage_count >= coupon.usage_limit) return "exhausted";
  return "active";
}
