import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { formatINR } from "@/lib/format";
import { trackOrder, type OrderStatus, type TrackedOrder } from "@/lib/orders.functions";
import { getRecentOrders } from "@/lib/recent-orders";
import { mediaSrcSet } from "@/lib/media";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Your Order — MOLD" },
      {
        name: "description",
        content: "Check the live status of your MOLD order with your order number and email or phone.",
      },
      { property: "og:title", content: "Track Your Order — MOLD" },
      {
        property: "og:description",
        content: "Check the live status of your MOLD order with your order number and email or phone.",
      },
      { property: "og:url", content: "/track" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/track" }],
  }),
  component: TrackOrderPage,
});

const STATUS_STEPS: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered"];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Order placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

function StatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <p className="mt-4 border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        This order was cancelled. If you think this is a mistake, contact us.
      </p>
    );
  }
  if (status === "returned") {
    return <p className="mt-4 border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">This order was returned.</p>;
  }
  const currentIndex = STATUS_STEPS.indexOf(status);
  return (
    <ol className="mt-5 space-y-0">
      {STATUS_STEPS.map((step, i) => {
        const reached = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <li key={step} className="flex items-stretch gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`mt-1 h-3 w-3 shrink-0 rounded-full border-2 ${
                  reached ? "border-accent bg-accent" : "border-line bg-transparent"
                }`}
              />
              {i < STATUS_STEPS.length - 1 && (
                <span className={`w-0.5 flex-1 ${i < currentIndex ? "bg-accent" : "bg-line"}`} />
              )}
            </div>
            <div className="pb-6">
              <p
                className={`text-sm ${
                  isCurrent ? "font-bold text-ink" : reached ? "text-ink" : "text-muted-ink"
                }`}
              >
                {STATUS_LABELS[step]}
                {isCurrent && <span className="label-mono ml-2 text-accent">Current</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function OrderCard({ order }: { order: TrackedOrder }) {
  return (
    <div className="border border-line">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div>
          <p className="text-sm font-bold">{order.orderNumber}</p>
          <p className="label-mono text-muted-ink">
            Placed{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <span className="label-mono bg-ink px-3 py-1.5 text-paper">
          {STATUS_LABELS[order.status]}
        </span>
      </div>
      <div className="grid gap-6 px-5 py-5 sm:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3">
              {item.image && (
                <img
                  src={item.image}
                  srcSet={mediaSrcSet(item.image)}
                  sizes="56px"
                  alt={item.productName}
                  width={120}
                  height={150}
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-14 shrink-0 object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.productName}</p>
                <p className="label-mono text-muted-ink">
                  {item.size} · x{item.qty}
                </p>
              </div>
              <span className="label-mono shrink-0">
                {formatINR(item.unitPrice * item.qty)}
              </span>
            </div>
          ))}
          <p className="pt-2 text-sm font-semibold">
            Total {formatINR(order.total)}
            <span className="label-mono ml-2 text-muted-ink">
              {order.paymentMethod === "cod" ? "Pay on delivery" : order.paymentMethod}
            </span>
          </p>
        </div>
        <StatusTimeline status={order.status} />
      </div>
    </div>
  );
}

function TrackOrderPage() {
  const lookup = useServerFn(trackOrder);
  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [result, setResult] = useState<TrackedOrder | null>(null);
  const [recent, setRecent] = useState<TrackedOrder[]>([]);

  useEffect(() => {
    const refs = getRecentOrders();
    if (refs.length === 0) return;
    let cancelled = false;
    void Promise.all(
      refs.map((ref) =>
        lookup({ data: { orderNumber: ref.orderNumber, contact: ref.email } }).catch(() => null),
      ),
    ).then((orders) => {
      if (!cancelled) setRecent(orders.filter((o): o is TrackedOrder => !!o));
    });
    return () => {
      cancelled = true;
    };
  }, [lookup]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);
    try {
      const order = await lookup({ data: { orderNumber, contact } });
      if (order) setResult(order);
      else setNotFound(true);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6">
      <span className="label-mono text-accent">Order status</span>
      <h1 className="display mt-2 text-[clamp(2.5rem,8vw,5rem)]">Track your order</h1>

      {recent.length > 0 && (
        <section className="mt-10">
          <h2 className="label-mono text-muted-ink">Your recent orders</h2>
          <div className="mt-4 space-y-6">
            {recent.map((order) => (
              <OrderCard key={order.orderNumber} order={order} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 border border-line p-6 sm:p-8">
        <h2 className="label-mono text-muted-ink">Look up an order</h2>
        <p className="mt-2 text-sm text-muted-ink">
          Enter your order number (e.g. MOLD-1001) and the email or phone number used at checkout.
        </p>
        <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label-mono text-muted-ink">Order number</span>
            <input
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="MOLD-1001"
              className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="label-mono text-muted-ink">Email or phone</span>
            <input
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="you@email.com"
              className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none focus:border-ink"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent hover:text-ink disabled:opacity-60 sm:w-auto sm:px-10"
            >
              {loading ? "Checking…" : "Check status"}
            </button>
          </div>
        </form>
        {notFound && (
          <p className="mt-4 text-sm text-red-600">
            No order found with those details. Check the order number and the email or phone used at
            checkout.
          </p>
        )}
      </section>

      {result && (
        <section className="mt-8">
          <OrderCard order={result} />
        </section>
      )}

      <p className="label-mono mt-10 text-muted-ink">
        Need help? <Link to="/help/$topic" params={{ topic: "contact" }} className="underline underline-offset-2">Contact us</Link>
      </p>
    </div>
  );
}
