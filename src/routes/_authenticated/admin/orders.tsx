import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ORDER_STATUSES,
  deleteOrder,
  listOrders,
  updateOrderStatus,
  type OrderStatus,
} from "@/lib/orders.functions";
import { formatINR } from "@/lib/format";
import { AdminOperationsNav } from "@/components/AdminOperationsNav";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({
    meta: [
      { title: "Orders — MOLD Admin" },
      { name: "description", content: "MOLD order management" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOrders,
});

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  confirmed: "bg-blue-100 text-blue-900",
  packed: "bg-indigo-100 text-indigo-900",
  shipped: "bg-purple-100 text-purple-900",
  delivered: "bg-green-100 text-green-900",
  cancelled: "bg-red-100 text-red-900",
  returned: "bg-rose-100 text-rose-900",
};

function AdminOrders() {
  const queryClient = useQueryClient();
  const fetchOrders = useServerFn(listOrders);
  const setStatus = useServerFn(updateOrderStatus);
  const removeOrder = useServerFn(deleteOrder);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => fetchOrders({ data: undefined }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] });

  const statusMutation = useMutation({
    mutationFn: (vars: { id: string; status: OrderStatus }) => setStatus({ data: vars }),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeOrder({ data: id }),
    onSuccess: invalidate,
  });

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const revenue = orders
    .filter((o) => o.status !== "cancelled" && o.status !== "returned")
    .reduce((sum, o) => sum + o.total, 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <span className="label-mono text-accent">Admin</span>
          <h1 className="display mt-2 text-3xl">Orders</h1>
        </div>
        <Link
          to="/admin"
          className="label-mono border border-line px-4 py-3 text-[11px] uppercase tracking-[0.14em] hover:bg-muted"
        >
          ← Back to admin
        </Link>
      </div>
      <AdminOperationsNav />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Total orders" value={String(orders.length)} />
        <Stat label="Awaiting action" value={String(pendingCount)} />
        <Stat label="Order value" value={formatINR(revenue)} />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {(["all", ...ORDER_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`label-mono border px-3 py-2 text-[11px] uppercase tracking-[0.14em] ${
              filter === s ? "border-ink bg-ink text-paper" : "border-line hover:bg-muted"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="label-mono mt-10 text-muted-ink">Loading orders…</p>
      ) : error ? (
        <p className="mt-10 text-sm text-red-600">
          {error instanceof Error ? error.message : "Could not load orders."}
        </p>
      ) : visible.length === 0 ? (
        <div className="mt-10 border border-dashed border-line p-10 text-center">
          <p className="text-muted-ink">No orders here yet.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {visible.map((order) => (
            <div key={order.id} className="border border-line">
              <div className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-[140px]">
                  <p className="text-sm font-semibold">{order.orderNumber}</p>
                  <p className="label-mono text-muted-ink">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="min-w-[160px] flex-1">
                  <p className="truncate text-sm">{order.customerName}</p>
                  <p className="label-mono truncate text-muted-ink">
                    {order.city}, {order.state} · {order.phone}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-wider ${statusStyles[order.status]}`}
                >
                  {order.status}
                </span>
                <span className="label-mono uppercase text-muted-ink">
                  {order.paymentMethod}
                </span>
                <span className="text-sm font-semibold">{formatINR(order.total)}</span>
                <select
                  value={order.status}
                  onChange={(e) =>
                    statusMutation.mutate({
                      id: order.id,
                      status: e.target.value as OrderStatus,
                    })
                  }
                  className="border border-line bg-transparent px-2 py-2 text-[11px] uppercase tracking-[0.1em] outline-none focus:border-ink"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  className="label-mono text-accent hover:underline"
                >
                  {expanded === order.id ? "Hide" : "Details"}
                </button>
              </div>

              {expanded === order.id && (
                <div className="grid gap-8 border-t border-line p-4 sm:grid-cols-2">
                  <div>
                    <h3 className="label-mono text-muted-ink">Items</h3>
                    <div className="mt-3 space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.productName}
                              width={80}
                              height={100}
                              loading="lazy"
                              className="h-14 w-12 shrink-0 object-cover"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {item.productName}
                            </p>
                            <p className="label-mono text-muted-ink">
                              {item.size} · x{item.qty}
                            </p>
                          </div>
                          <span className="label-mono">
                            {formatINR(item.unitPrice * item.qty)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <dl className="label-mono mt-5 space-y-2 border-t border-line pt-4 text-muted-ink">
                      <Row label="Subtotal" value={formatINR(order.subtotal)} />
                      <Row
                        label="Shipping"
                        value={order.shipping === 0 ? "Free" : formatINR(order.shipping)}
                      />
                      <Row label="COD handling" value={formatINR(order.codFee)} />
                    </dl>
                  </div>

                  <div>
                    <h3 className="label-mono text-muted-ink">Deliver to</h3>
                    <address className="mt-3 space-y-1 text-sm not-italic">
                      <p className="font-semibold">{order.customerName}</p>
                      <p>{order.address}</p>
                      <p>
                        {order.city}, {order.state} {order.pincode}
                      </p>
                      <p className="text-muted-ink">{order.phone}</p>
                      <p className="text-muted-ink">{order.email}</p>
                    </address>
                    {order.notes && (
                      <p className="mt-4 border border-line p-3 text-sm text-muted-ink">
                        {order.notes}
                      </p>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Delete order ${order.orderNumber}?`))
                          deleteMutation.mutate(order.id);
                      }}
                      className="label-mono mt-6 text-red-600 hover:underline"
                    >
                      Delete order
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line p-5">
      <span className="label-mono text-muted-ink">{label}</span>
      <p className="display mt-2 text-3xl">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
