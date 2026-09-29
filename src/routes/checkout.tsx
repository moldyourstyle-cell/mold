import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { formatINR } from "@/lib/format";
import { placeOrder, validateCheckoutCoupon } from "@/lib/orders.functions";
import {
  clearReservation,
  getReservation,
  releaseReservation,
  reserveItems,
} from "@/lib/reservation";
import { saveRecentOrder } from "@/lib/recent-orders";
import { supabase } from "@/integrations/supabase/client";
import { listSavedAddresses, saveAddress, type SavedAddress } from "@/lib/saved-addresses.functions";
import { getCheckoutPricing } from "@/lib/admin-operations.functions";



export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — MOLD" },
      { name: "description", content: "Secure checkout for your MOLD order." },
      { property: "og:title", content: "Checkout — MOLD" },
      { property: "og:description", content: "Secure checkout for your MOLD order." },
      { property: "og:url", content: "/checkout" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/checkout" }],
  }),
  component: Checkout,
});

/** Tracks whether any checkout screen is still open (survives dev double-mounts). */
let checkoutMounted = 0;

function Checkout() {
  const { detailedLines, subtotal, clearCart } = useStore();
  const submitOrder = useServerFn(placeOrder);
  const checkCoupon = useServerFn(validateCheckoutCoupon);
  const fetchSavedAddresses = useServerFn(listSavedAddresses);
  const storeSavedAddress = useServerFn(saveAddress);
  const loadCheckoutPricing = useServerFn(getCheckoutPricing);
  const { data: pricing, isLoading: pricingLoading, error: pricingError } = useQuery({
    queryKey: ["checkout-pricing"],
    queryFn: () => loadCheckoutPricing(),
  });
  const shippingFee = pricing?.shippingFee ?? 99;
  const freeShippingThreshold = pricing?.freeShippingThreshold ?? 1999;
  const codFee = pricing?.codFee ?? 49;
  const shipping = subtotal === 0 || subtotal >= freeShippingThreshold ? 0 : shippingFee;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ orderNumber: string; total: number } | null>(
    null,
  );
  const queryClient = useQueryClient();
  const orderPlaced = useRef(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled || !data.user) return;
      setAccountEmail(data.user.email ?? "");
      try {
        const rows = await fetchSavedAddresses();
        if (cancelled) return;
        setSavedAddresses(rows);
        setSelectedAddressId(rows.find((row) => row.is_default)?.id ?? "");
      } catch {
        // Guests and accounts without saved addresses can continue checkout normally.
      }
    });
    return () => { cancelled = true; };
  }, [fetchSavedAddresses]);

  const selectedAddress = savedAddresses.find((address) => address.id === selectedAddressId);

  async function applyCoupon() {
    const code = couponCode.trim();
    if (!code) {
      setCouponMessage("Enter a coupon code.");
      setAppliedCoupon(null);
      return;
    }
    setCheckingCoupon(true);
    setCouponMessage("");
    try {
      const result = await checkCoupon({ data: { code, subtotal } });
      setAppliedCoupon(result);
      setCouponCode(result.code);
      setCouponMessage("Coupon applied.");
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMessage(err instanceof Error ? err.message : "This coupon could not be applied.");
    } finally {
      setCheckingCoupon(false);
    }
  }

  // Leaving checkout without ordering puts the held pieces back on sale.
  useEffect(() => {
    checkoutMounted += 1;
    return () => {
      checkoutMounted -= 1;
      const placed = orderPlaced.current;
      setTimeout(() => {
        if (checkoutMounted > 0 || placed) return;
        void releaseReservation().then(() =>
          queryClient.invalidateQueries({ queryKey: ["catalog"] }),
        );
      }, 1000);
    };
  }, [queryClient]);




  if (confirmed) {
    return (
      <div className="order-confirmation relative isolate mx-auto max-w-[720px] overflow-hidden px-4 py-24 text-center sm:px-6">
        <div className="order-confetti" aria-hidden="true">
          {Array.from({ length: 24 }, (_, index) => (
            <span key={index} style={{ "--confetti-index": index } as React.CSSProperties} />
          ))}
        </div>
        <div className="relative z-10">
        <span className="label-mono text-accent">Order received</span>
        <h1 className="display mt-4 text-[clamp(2.5rem,8vw,5rem)]">You're in.</h1>
        <p className="mt-6 text-sm text-muted-ink">
          Order <strong className="text-ink">{confirmed.orderNumber}</strong> —{" "}
          {formatINR(confirmed.total)} payable on delivery. We dispatch from the Chennai studio
          within 48 hours.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/track"
            className="bg-ink px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent hover:text-ink"
          >
            Track your order
          </Link>
          <Link
            to="/shop"
            className="border border-ink px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-paper"
          >
            Keep shopping
          </Link>
        </div>
        </div>
      </div>
    );
  }


  if (detailedLines.length === 0) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-24 text-center sm:px-6">
        <h1 className="display text-4xl">Nothing to check out</h1>
        <Link
          to="/shop"
          className="mt-8 inline-block bg-ink px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-paper"
        >
          Shop the drop
        </Link>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      const items = detailedLines.map(({ line }) => ({
        productId: line.productId,
        size: line.size,
        qty: line.qty,
      }));
      // Make sure the hold is still alive (it may have expired on this page).
      const reservation = getReservation() ?? (await reserveItems(items));
      if (form.get("saveAddress") === "on") {
        await storeSavedAddress({ data: {
          label: "Home",
          fullName: String(form.get("name") ?? ""),
          phone: String(form.get("phone") ?? ""),
          address: String(form.get("address") ?? ""),
          city: String(form.get("city") ?? ""),
          state: String(form.get("state") ?? ""),
          pincode: String(form.get("pincode") ?? ""),
          isDefault: false,
        } });
      }
      const result = await submitOrder({
        data: {
          customerName: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? "").trim(),
          phone: String(form.get("phone") ?? ""),
          address: String(form.get("address") ?? ""),
          city: String(form.get("city") ?? ""),
          state: String(form.get("state") ?? ""),
          pincode: String(form.get("pincode") ?? ""),
          paymentMethod: "cod",
          notes: String(form.get("notes") ?? ""),
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
          reservationToken: reservation.token,
          items,
        },
      });
      const email = String(form.get("email") ?? "");
      saveRecentOrder({
        orderNumber: result.orderNumber,
        email: email || String(form.get("phone") ?? ""),
        placedAt: new Date().toISOString(),
      });
      clearReservation();
      orderPlaced.current = true;
      clearCart();
      await queryClient.invalidateQueries({ queryKey: ["catalog"] });
      setConfirmed({ orderNumber: result.orderNumber, total: result.total });

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't place the order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <div className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6">
      <h1 className="display text-[clamp(2.5rem,8vw,5rem)]">Checkout</h1>

      <form onSubmit={onSubmit} className="mt-8 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <fieldset>
            <legend className="label-mono text-muted-ink">Contact</legend>
            <div key={selectedAddressId || "contact"} className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="name" defaultValue={selectedAddress?.full_name} />
              <Field label="Phone" name="phone" type="tel" defaultValue={selectedAddress?.phone} />
              <div className="sm:col-span-2">
                <Field label="Email (optional)" name="email" type="email" required={false} defaultValue={accountEmail} />
              </div>
            </div>
          </fieldset>

          <fieldset className="mt-10">
            <legend className="label-mono text-muted-ink">Delivery address</legend>
            {savedAddresses.length > 0 && <label className="mt-4 block"><span className="label-mono text-muted-ink">Use a saved address</span><select value={selectedAddressId} onChange={(event) => setSelectedAddressId(event.target.value)} className="mt-2 w-full border border-line bg-paper px-3 py-3 text-sm outline-none focus:border-ink"><option value="">Enter a different address</option>{savedAddresses.map((address) => <option key={address.id} value={address.id}>{address.label} — {address.address}, {address.city}</option>)}</select></label>}
            <div key={`delivery-${selectedAddressId || "new"}`} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Address" name="address" defaultValue={selectedAddress?.address} />
              </div>
              <Field label="City" name="city" defaultValue={selectedAddress?.city} />
              <Field label="State" name="state" defaultValue={selectedAddress?.state} />
              <Field label="PIN code" name="pincode" defaultValue={selectedAddress?.pincode} />
              {accountEmail && <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="saveAddress" className="accent-ink" />Save this address to my account</label>}
              <div className="sm:col-span-2">
                <label className="block">
                  <span className="label-mono text-muted-ink">Delivery notes (optional)</span>
                  <textarea
                    name="notes"
                    rows={3}
                    className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none focus:border-ink"
                  />
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset className="mt-10">
            <legend className="label-mono text-muted-ink">Payment</legend>
            <div className="mt-4 border border-line p-5">
              <div className="flex items-center gap-3">
                <input type="radio" name="payment" checked readOnly className="accent-[oklch(0.652_0.238_33)]" />
                <span className="text-sm font-semibold">Cash on delivery</span>
                <span className="label-mono ml-auto text-muted-ink">₹49 handling fee</span>
              </div>
              <p className="mt-3 text-sm text-muted-ink">
                Pay the courier in cash or UPI when your order arrives. Online prepaid payment
                is coming soon.
              </p>
            </div>
          </fieldset>
        </div>

        <aside className="h-fit border border-line p-6">
          <h2 className="label-mono">Order</h2>
          <div className="mt-5 space-y-4">
            {detailedLines.map(({ line, product }) => (
              <div key={`${line.productId}-${line.size}`} className="flex gap-3">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  width={120}
                  height={150}
                  loading="lazy"
                  className="h-16 w-14 shrink-0 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <p className="label-mono text-muted-ink">
                    {line.size} · x{line.qty}
                  </p>
                </div>
                <span className="label-mono shrink-0">
                  {formatINR(product.price * line.qty)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 border-y border-line py-4">
            <label htmlFor="coupon-code" className="label-mono text-muted-ink">Coupon code</label>
            <div className="mt-2 flex gap-2">
              <input
                id="coupon-code"
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.target.value);
                  if (appliedCoupon) setAppliedCoupon(null);
                  setCouponMessage("");
                }}
                placeholder="Enter code"
                autoComplete="off"
                className="min-w-0 flex-1 border border-line bg-transparent px-3 py-2 text-sm uppercase outline-none focus:border-ink"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={checkingCoupon || !couponCode.trim()}
                className="border border-ink px-4 py-2 label-mono transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
              >
                {checkingCoupon ? "Checking…" : appliedCoupon ? "Apply again" : "Apply"}
              </button>
            </div>
            {couponMessage && <p role="status" className={`mt-2 text-xs ${appliedCoupon ? "text-green-700" : "text-red-600"}`}>{couponMessage}</p>}
          </div>
          <div className="label-mono mt-6 flex justify-between text-muted-ink">
            <span>Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          {appliedCoupon && (
            <div className="label-mono mt-3 flex justify-between text-green-700">
              <span>Coupon ({appliedCoupon.code})</span>
              <span>−{formatINR(appliedCoupon.discountAmount)}</span>
            </div>
          )}
          <div className="label-mono mt-3 flex justify-between text-muted-ink">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
          </div>
          <div className="label-mono mt-3 flex justify-between text-muted-ink">
            <span>COD handling</span>
            <span>{formatINR(codFee)}</span>
          </div>
          <div className="mt-5 flex justify-between border-t border-line pt-4 text-sm font-semibold">
            <span>Total</span>
            <span>{formatINR(subtotal - (appliedCoupon?.discountAmount ?? 0) + shipping + codFee)}</span>
          </div>
          {pricingError && <p role="alert" className="mt-4 text-sm text-red-600">Could not load current delivery fees. Refresh the page before placing your order.</p>}
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting || pricingLoading || !!pricingError}
            className="mt-6 w-full bg-ink py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent hover:text-ink disabled:opacity-60"
          >
            {submitting ? "Placing order…" : pricingLoading ? "Loading fees…" : "Place order"}
          </button>
          <p className="label-mono mt-4 text-center text-muted-ink">
            Pay on delivery · GST inclusive
          </p>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | undefined;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="label-mono text-muted-ink">{label}</span>
      <input
        required={required}
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none focus:border-ink"
      />
    </label>
  );
}
