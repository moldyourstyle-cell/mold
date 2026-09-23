import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatINR } from "@/lib/format";
import { reserveItems } from "@/lib/reservation";
import { site } from "@/config/site";

export function CartDrawer() {
  const { cartOpen, setCartOpen, detailedLines, subtotal, shipping, total, setQty, removeLine } =
    useStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);

  async function handleProceed() {
    setReserving(true);
    setReserveError(null);
    try {
      await reserveItems(
        detailedLines.map(({ line }) => ({
          productId: line.productId,
          size: line.size,
          qty: line.qty,
        })),
      );
      await queryClient.invalidateQueries({ queryKey: ["catalog"] });
      setCartOpen(false);
      navigate({ to: "/checkout" });
    } catch (err) {
      setReserveError(
        err instanceof Error ? err.message : "Some pieces just sold out. Update your bag.",
      );
    } finally {
      setReserving(false);
    }
  }

  const remaining = site.freeShippingThreshold - subtotal;


  return (
    <>
      <div
        onClick={() => setCartOpen(false)}
        className={`fixed inset-0 z-50 bg-ink/50 transition-opacity duration-300 ${
          cartOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden
      />
      <aside
        aria-label="Cart"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-paper transition-transform duration-300 ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <span className="label-mono">Your bag · {detailedLines.length}</span>
          <button aria-label="Close cart" onClick={() => setCartOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="label-mono border-b border-line px-5 py-3 text-muted-ink">
          {subtotal === 0
            ? `Free shipping unlocked at ${formatINR(site.freeShippingThreshold)}`
            : remaining > 0
              ? `${formatINR(remaining)} away from free shipping`
              : "Free shipping unlocked"}
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {detailedLines.length === 0 ? (
            <p className="label-mono py-16 text-center text-muted-ink">Your bag is empty.</p>
          ) : (
            detailedLines.map(({ line, product }) => (
              <div
                key={`${line.productId}-${line.size}`}
                className="flex gap-4 border-b border-line py-5"
              >
                <img
                  src={product.images[0]}
                  alt={product.name}
                  width={200}
                  height={250}
                  loading="lazy"
                  className="h-24 w-20 shrink-0 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <h3 className="truncate text-sm font-semibold">{product.name}</h3>
                    <span className="shrink-0 text-sm font-semibold">
                      {formatINR(product.price * line.qty)}
                    </span>
                  </div>
                  <p className="label-mono mt-1 text-muted-ink">Size {line.size}</p>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center border border-line">
                      <button
                        aria-label="Decrease quantity"
                        className="px-2.5 py-1"
                        onClick={() => setQty(line.productId, line.size, line.qty - 1)}
                      >
                        −
                      </button>
                      <span className="label-mono w-6 text-center">{line.qty}</span>
                      <button
                        aria-label="Increase quantity"
                        className="px-2.5 py-1"
                        onClick={() => setQty(line.productId, line.size, line.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="label-mono text-muted-ink hover:text-accent"
                      onClick={() => removeLine(line.productId, line.size)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-line px-5 py-5">
          <div className="label-mono flex justify-between text-muted-ink">
            <span>Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <div className="label-mono mt-2 flex justify-between text-muted-ink">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-line pt-4 text-sm font-semibold">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
          <button
            type="button"
            disabled={reserving}
            onClick={handleProceed}
            className="mt-5 block w-full bg-ink py-4 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent hover:text-ink disabled:opacity-60"
          >
            {reserving ? "Reserving…" : "Proceed to order"}
          </button>
          {reserveError && <p className="label-mono mt-3 text-accent">{reserveError}</p>}

          <Link
            to="/cart"
            onClick={() => setCartOpen(false)}
            className="label-mono mt-3 block text-center text-muted-ink hover:text-ink"
          >
            View full bag
          </Link>
        </div>
      </aside>
    </>
  );
}
