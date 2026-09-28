export type RecentOrderRef = { orderNumber: string; email: string; placedAt: string };

const KEY = "mold-recent-orders.v2";
const MAX_SAVED = 10;

export function getRecentOrders(): RecentOrderRef[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (o): o is RecentOrderRef =>
        !!o && typeof o.orderNumber === "string" && typeof o.email === "string",
    );
  } catch {
    return [];
  }
}

export function saveRecentOrder(ref: RecentOrderRef) {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentOrders().filter((o) => o.orderNumber !== ref.orderNumber);
    window.sessionStorage.setItem(KEY, JSON.stringify([ref, ...existing].slice(0, MAX_SAVED)));
  } catch {
    // storage full / private mode — tracking still works via the manual form
  }
}
