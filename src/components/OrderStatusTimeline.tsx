import type { OrderStatus } from "@/lib/orders.functions";

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Order placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <p className="mt-4 border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        This order was cancelled. If you think this is a mistake, contact us.
      </p>
    );
  }
  if (status === "returned") {
    return <p className="mt-4 border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">This order was returned and the stock has been restored.</p>;
  }
  const currentIndex = ORDER_STATUS_STEPS.indexOf(status);
  return (
    <ol className="mt-5 space-y-0">
      {ORDER_STATUS_STEPS.map((step, i) => {
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
              {i < ORDER_STATUS_STEPS.length - 1 && (
                <span className={`w-0.5 flex-1 ${i < currentIndex ? "bg-accent" : "bg-line"}`} />
              )}
            </div>
            <div className="pb-6">
              <p
                className={`text-sm ${
                  isCurrent ? "font-bold text-ink" : reached ? "text-ink" : "text-muted-ink"
                }`}
              >
                {ORDER_STATUS_LABELS[step]}
                {isCurrent && <span className="label-mono ml-2 text-accent">Current</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
