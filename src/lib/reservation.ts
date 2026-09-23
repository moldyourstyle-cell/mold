import { reserveStock, releaseStock } from "./reservation.functions";

const KEY = "mold.reservation.v1";

export type ReservationItem = { productId: string; size: string; qty: number };

export type StoredReservation = {
  token: string;
  expiresAt: string;
  items: ReservationItem[];
};

function newToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getReservation(): StoredReservation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredReservation;
    if (!parsed?.token || new Date(parsed.expiresAt).getTime() < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function store(value: StoredReservation | null) {
  if (typeof window === "undefined") return;
  if (value) localStorage.setItem(KEY, JSON.stringify(value));
  else localStorage.removeItem(KEY);
}

/** Holds the given items. Re-uses the existing token so a shopper never double-reserves. */
export async function reserveItems(items: ReservationItem[]): Promise<StoredReservation> {
  const token = getReservation()?.token ?? newToken();
  const { expiresAt } = await reserveStock({ data: { token, items } });
  const reservation = { token, expiresAt, items };
  store(reservation);
  return reservation;
}

export async function releaseReservation() {
  const current = getReservation();
  store(null);
  if (!current) return;
  try {
    await releaseStock({ data: current.token });
  } catch {
    /* it expires on its own */
  }
}

export function clearReservation() {
  store(null);
}
