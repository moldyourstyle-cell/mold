import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { site } from "@/config/site";
import { formatINR } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { myOrders, type MyOrder } from "@/lib/orders.functions";
import { OrderStatusTimeline, ORDER_STATUS_LABELS } from "@/components/OrderStatusTimeline";
import { useCatalog } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteSavedAddress, listSavedAddresses, saveAddress, type SavedAddress } from "@/lib/saved-addresses.functions";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — MOLD" },
      { name: "description", content: "Manage your MOLD orders, wishlist and account details." },
      { property: "og:title", content: "Account — MOLD" },
      { property: "og:description", content: "Manage your MOLD orders, wishlist and account details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "/account" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/account" }],
  }),
  component: Account,
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Tab = "orders" | "wishlist" | "addresses" | "settings";

function Account() {
  const fetchOrders = useServerFn(myOrders);
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("orders");

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setEmail(data.user?.email ?? null);
      setChecking(false);
      if (!data.user) return;
      setLoading(true);
      fetchOrders()
        .then((rows) => {
          if (!cancelled) setOrders(rows);
        })
        .catch(() => {
          if (!cancelled) setError(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [fetchOrders]);

  const current = orders.find((o) => o.orderNumber === selected) ?? null;

  const signOut = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/auth" });
  };

  if (checking) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-[1120px] place-items-center px-4 py-14 sm:px-6">
        <p className="text-sm text-muted-ink">Loading…</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="mx-auto max-w-[1120px] px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid min-h-[420px] place-items-center border border-line py-16 text-center">
          <div className="max-w-md px-6">
            <span className="label-mono text-muted-ink">Account</span>
            <p className="display mt-4 text-4xl sm:text-5xl">Your MOLD lives here.</p>
            <p className="mt-5 text-sm leading-6 text-muted-ink">
              Sign in to see your orders, saved pieces and account settings.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild className="h-13 rounded-none px-8 text-[11px] font-bold uppercase tracking-[0.16em]"><Link to="/auth">Sign in</Link></Button>
              <Button asChild variant="outline" className="h-13 rounded-none border-ink px-8 text-[11px] font-bold uppercase tracking-[0.16em] shadow-none"><Link to="/track">Track as guest</Link></Button>
            </div>
            <div className="mt-8 flex justify-center">
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="label-mono text-muted-ink underline underline-offset-4 transition-colors hover:text-ink"
              >
                Message the studio
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "orders", label: `Orders${orders.length ? ` (${orders.length})` : ""}` },
    { id: "wishlist", label: "Wishlist" },
    { id: "addresses", label: "Addresses" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="mx-auto min-h-[70vh] max-w-[1120px] px-4 py-12 sm:px-6 sm:py-16">
      <div className="border-b-4 border-ink pb-7 sm:flex sm:items-end sm:justify-between sm:gap-8">
        <div>
          <span className="label-mono text-muted-ink">Account / Dashboard</span>
          <h1 className="display mt-3 text-[clamp(2.75rem,7vw,5rem)]">My Account</h1>
        </div>
        <span className="label-mono mt-5 block max-w-full truncate text-muted-ink sm:mb-2 sm:mt-0">{email}</span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        {/* Tabs */}
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setSelected(null);
              }}
              className={`whitespace-nowrap border-l-2 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
                tab === t.id
                  ? "border-ink bg-ink/5 text-ink"
                  : "border-transparent text-muted-ink hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {tab === "orders" && (
            <OrdersPanel
              orders={orders}
              loading={loading}
              error={error}
              current={current}
              setSelected={setSelected}
            />
          )}
          {tab === "wishlist" && <WishlistPanel />}
          {tab === "addresses" && <AddressesPanel />}
          {tab === "settings" && <SettingsPanel email={email} signOut={signOut} />}
        </div>
      </div>
    </div>
  );
}

function OrdersPanel({
  orders,
  loading,
  error,
  current,
  setSelected,
}: {
  orders: MyOrder[];
  loading: boolean;
  error: boolean;
  current: MyOrder | null;
  setSelected: (v: string | null) => void;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="label-mono text-muted-ink">
          {current ? "Order details" : `${orders.length} ${orders.length === 1 ? "order" : "orders"}`}
        </h2>
        {!current && orders.length > 0 && <span className="label-mono text-muted-ink">Newest first</span>}
      </div>

      {loading && <p className="mt-6 text-sm text-muted-ink">Loading your orders…</p>}
      {error && (
        <p className="mt-6 text-sm text-red-600">
          We couldn&apos;t load your orders right now. Please refresh and try again.
        </p>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="mt-6 grid min-h-[320px] place-items-center border border-line px-6 py-14 text-center">
          <div className="max-w-sm">
            <span className="display text-7xl text-line">00</span>
            <h3 className="display mt-4 text-4xl">No orders yet</h3>
            <p className="mt-4 text-sm leading-6 text-muted-ink">Your first piece is waiting. New orders and live delivery updates will appear here.</p>
            <Button asChild className="mt-8 h-13 rounded-none px-8 text-[11px] font-bold uppercase tracking-[0.16em]"><Link to="/shop">Shop the drop</Link></Button>
          </div>
        </div>
      )}

      {!loading && !error && orders.length > 0 && !current && (
        <ul className="mt-6 space-y-5">
          {orders.map((order) => (
            <li key={order.orderNumber}>
              <div className="w-full border border-line bg-paper text-left transition-colors hover:border-ink">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-line px-4 py-4 sm:px-6">
                  <div>
                    <p className="label-mono text-muted-ink">Order ID</p>
                    <p className="mt-1 text-sm font-bold">{order.orderNumber}</p>
                    <p className="label-mono mt-1 text-muted-ink">{formatDate(order.createdAt)}</p>
                  </div>
                  <span className="label-mono shrink-0 bg-ink px-3 py-2 text-paper">
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div className="space-y-0 divide-y divide-line">
                  {order.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center sm:px-6">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.productName}
                          width={120}
                          height={150}
                          loading="lazy"
                          className="h-24 w-[72px] shrink-0 object-cover sm:h-28 sm:w-[88px]"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold uppercase leading-tight">{item.productName}</p>
                        <p className="label-mono mt-2 text-muted-ink">Size {item.size} / Qty {item.qty}</p>
                        <p className="mt-3 text-sm font-semibold sm:hidden">{formatINR(item.unitPrice * item.qty)}</p>
                      </div>
                      <span className="hidden shrink-0 text-sm font-bold sm:block">
                        {formatINR(item.unitPrice * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-line px-4 py-4 sm:px-6">
                  <div><span className="label-mono text-muted-ink">Total amount</span><p className="mt-1 text-lg font-bold">{formatINR(order.total)}</p></div>
                  <Button type="button" onClick={() => setSelected(order.orderNumber)} className="h-11 rounded-none px-5 text-[10px] font-bold uppercase tracking-[0.14em]">View order</Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {current && (
        <div className="mt-6 border border-line">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
            <div>
              <p className="text-sm font-bold">{current.orderNumber}</p>
              <p className="label-mono text-muted-ink">
                Placed {formatDate(current.createdAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="label-mono border border-ink px-3 py-1.5 transition-colors hover:bg-ink hover:text-paper"
            >
              Back to orders
            </button>
          </div>

          <div className="grid gap-8 px-5 py-6 sm:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              {current.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.productName}
                      width={120}
                      height={150}
                      loading="lazy"
                      className="h-20 w-16 shrink-0 object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/product/$slug"
                      params={{ slug: item.productSlug }}
                      className="truncate text-sm font-semibold underline-offset-4 hover:underline"
                    >
                      {item.productName}
                    </Link>
                    <p className="label-mono text-muted-ink">
                      Size {item.size} · Qty {item.qty} · {formatINR(item.unitPrice)} each
                    </p>
                  </div>
                  <span className="label-mono shrink-0">
                    {formatINR(item.unitPrice * item.qty)}
                  </span>
                </div>
              ))}

              <dl className="space-y-1 border-t border-line pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-ink">Subtotal</dt>
                  <dd>{formatINR(current.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-ink">Shipping</dt>
                  <dd>{current.shipping === 0 ? "Free" : formatINR(current.shipping)}</dd>
                </div>
                {current.codFee > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-ink">Cash on delivery fee</dt>
                    <dd>{formatINR(current.codFee)}</dd>
                  </div>
                )}
                <div className="flex justify-between pt-2 text-base font-bold">
                  <dt>Total</dt>
                  <dd>{formatINR(current.total)}</dd>
                </div>
              </dl>

              <div className="border-t border-line pt-4 text-sm">
                <p className="label-mono text-muted-ink">Delivering to</p>
                <p className="mt-2 font-semibold">{current.customerName}</p>
                <p className="text-muted-ink">
                  {current.address}, {current.city}, {current.state} {current.pincode}
                </p>
                <p className="text-muted-ink">
                  {current.phone} · {current.email}
                </p>
                {current.notes && (
                  <p className="mt-2 text-muted-ink">Note: {current.notes}</p>
                )}
                <p className="label-mono mt-3 text-muted-ink">
                  {current.paymentMethod === "cod" ? "Pay on delivery" : current.paymentMethod}
                </p>
              </div>
            </div>

            <div>
              <p className="label-mono text-muted-ink">Status</p>
              <OrderStatusTimeline status={current.status} />
              {current.status !== "cancelled" && current.status !== "delivered" && (
                <Link
                  to="/track"
                  className="mt-2 inline-block bg-ink px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent hover:text-ink"
                >
                  Track order
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function WishlistPanel() {
  const { wishlist } = useStore();
  const products = useCatalog();
  const saved = products.filter((p) => wishlist.includes(p.id));

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="label-mono text-muted-ink">{saved.length} saved</h2>
        <Link to="/wishlist" className="label-mono text-muted-ink underline underline-offset-4 transition-colors hover:text-ink">
          Open full wishlist
        </Link>
      </div>

      {saved.length === 0 ? (
        <div className="mt-6 grid min-h-[320px] place-items-center border border-line px-6 py-14 text-center">
          <div className="max-w-sm">
            <span className="display text-7xl text-line">♡</span>
            <h3 className="display mt-4 text-4xl">Nothing saved</h3>
            <p className="mt-4 text-sm leading-6 text-muted-ink">Tap the heart on any piece to keep it here for later.</p>
            <Button asChild className="mt-8 h-13 rounded-none px-8 text-[11px] font-bold uppercase tracking-[0.16em]"><Link to="/shop">Browse the drop</Link></Button>
          </div>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {saved.map((p) => (
            <li key={p.id}>
              <Link
                to="/product/$slug"
                params={{ slug: p.slug }}
                className="group block border border-line bg-paper transition-colors hover:border-ink"
              >
                <div className="aspect-[3/4] overflow-hidden bg-ink/5">
                  {p.images?.[0] && (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      width={400}
                      height={533}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-bold uppercase leading-tight">{p.name}</p>
                  <p className="label-mono mt-1 text-muted-ink">{formatINR(p.price)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AddressesPanel() {
  const fetchAddresses = useServerFn(listSavedAddresses);
  const storeAddress = useServerFn(saveAddress);
  const removeAddress = useServerFn(deleteSavedAddress);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setAddresses(await fetchAddresses());
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load saved addresses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, [fetchAddresses]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    setMessage(null);
    try {
      await storeAddress({ data: {
        label: String(form.get("label") ?? "Home"),
        fullName: String(form.get("fullName") ?? ""),
        phone: String(form.get("phone") ?? ""),
        address: String(form.get("address") ?? ""),
        city: String(form.get("city") ?? ""),
        state: String(form.get("state") ?? ""),
        pincode: String(form.get("pincode") ?? ""),
        isDefault: form.get("isDefault") === "on",
      } });
      formElement.reset();
      await refresh();
      setMessage("Address saved to your account.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save address.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await removeAddress({ data: id });
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove address.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="display text-3xl">Saved addresses</h2>
        <p className="mt-2 text-sm text-muted-ink">Save a delivery address to select it faster at checkout.</p>
      </div>
      {loading ? <p className="text-sm text-muted-ink">Loading addresses…</p> : addresses.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <article key={address.id} className="border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{address.label}{address.is_default ? <span className="label-mono ml-2 text-accent">Default</span> : null}</p>
                  <p className="mt-2 text-sm">{address.full_name} · {address.phone}</p>
                  <p className="mt-1 text-sm text-muted-ink">{address.address}, {address.city}, {address.state} {address.pincode}</p>
                </div>
                <button type="button" disabled={busy} onClick={() => void remove(address.id)} className="label-mono text-red-600 hover:underline disabled:opacity-50">Remove</button>
              </div>
            </article>
          ))}
        </div>
      )}
      <form onSubmit={submit} className="grid gap-4 border border-line p-5 sm:grid-cols-2 sm:p-6">
        <h3 className="label-mono text-muted-ink sm:col-span-2">Add an address</h3>
        <label className="block"><span className="label-mono text-muted-ink">Label</span><Input name="label" defaultValue="Home" required maxLength={40} className="mt-2 h-12 rounded-none border-line" /></label>
        <label className="block"><span className="label-mono text-muted-ink">Full name</span><Input name="fullName" required maxLength={120} className="mt-2 h-12 rounded-none border-line" /></label>
        <label className="block"><span className="label-mono text-muted-ink">Phone</span><Input name="phone" type="tel" required maxLength={20} className="mt-2 h-12 rounded-none border-line" /></label>
        <label className="block sm:col-span-2"><span className="label-mono text-muted-ink">Address</span><Input name="address" required maxLength={300} className="mt-2 h-12 rounded-none border-line" /></label>
        <label className="block"><span className="label-mono text-muted-ink">City</span><Input name="city" required maxLength={80} className="mt-2 h-12 rounded-none border-line" /></label>
        <label className="block"><span className="label-mono text-muted-ink">State</span><Input name="state" required maxLength={80} className="mt-2 h-12 rounded-none border-line" /></label>
        <label className="block"><span className="label-mono text-muted-ink">PIN code</span><Input name="pincode" required maxLength={12} className="mt-2 h-12 rounded-none border-line" /></label>
        <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="isDefault" className="accent-ink" /> Set as default</label>
        {message && <p className="text-sm text-muted-ink sm:col-span-2">{message}</p>}
        <Button type="submit" disabled={busy} className="h-12 rounded-none px-8 text-[11px] font-bold uppercase tracking-[0.16em] sm:col-span-2 sm:justify-self-start">{busy ? "Saving…" : "Save address"}</Button>
      </form>
    </section>
  );
}

function SettingsPanel({ email, signOut }: { email: string; signOut: () => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setFieldError(null);
    if (password.length < 8) {
      setFieldError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setFieldError("Passwords don't match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setFieldError(error.message);
      return;
    }
    setPassword("");
    setConfirm("");
    setMessage("Password updated.");
  };

  return (
    <section className="space-y-8">
      <div className="border border-line p-5 sm:p-6">
        <h2 className="label-mono text-muted-ink">Sign-in details</h2>
        <div className="mt-4">
          <Label htmlFor="settings-email" className="label-mono text-muted-ink">Email</Label>
          <Input
            id="settings-email"
            type="email"
            value={email}
            disabled
            className="mt-2 h-12 rounded-none border-line bg-ink/[0.03]"
          />
          <p className="label-mono mt-2 text-muted-ink">Email can&apos;t be changed.</p>
        </div>

        <form onSubmit={changePassword} className="mt-6 space-y-4 border-t border-line pt-6">
          <div>
            <Label htmlFor="new-password" className="label-mono text-muted-ink">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 h-12 rounded-none border-line focus-visible:border-ink"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password" className="label-mono text-muted-ink">Repeat new password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-2 h-12 rounded-none border-line focus-visible:border-ink"
            />
          </div>
          {fieldError && <p className="text-xs text-red-600">{fieldError}</p>}
          {message && <p className="text-xs text-muted-ink">{message}</p>}
          <Button
            type="submit"
            disabled={busy || !password}
            className="h-12 rounded-none px-8 text-[11px] font-bold uppercase tracking-[0.16em]"
          >
            {busy ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>

      <div className="border border-line p-5 sm:p-6">
        <h2 className="label-mono text-muted-ink">Session</h2>
        <p className="mt-3 text-sm text-muted-ink">Sign out of this device. Your orders and wishlist stay saved.</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void signOut()}
          className="mt-5 h-12 rounded-none border-ink px-8 text-[11px] font-bold uppercase tracking-[0.16em] shadow-none"
        >
          Sign out
        </Button>
      </div>
    </section>
  );
}
