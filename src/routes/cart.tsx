import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { formatINR } from "@/lib/format";
import { reserveItems } from "@/lib/reservation";
import { mediaSrcSet } from "@/lib/media";


export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — MOLD" },
      { name: "description", content: "Review your MOLD pieces before checkout." },
      { property: "og:title", content: "Your Bag — MOLD" },
      { property: "og:description", content: "Review your MOLD pieces before checkout." },
      { property: "og:url", content: "/cart" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/cart" }],
  }),
  component: CartPage,
});

function CartPage() {
  const { detailedLines, subtotal, shipping, total, freeShippingThreshold, setQty, removeLine } = useStore();
  const remaining = freeShippingThreshold - subtotal;
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
      navigate({ to: "/checkout" });
    } catch (err) {
      setReserveError(
        err instanceof Error ? err.message : "Some pieces just sold out. Update your bag.",
      );
    } finally {
      setReserving(false);
    }
  }


  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
      <h1 className="display text-[clamp(2.5rem,8vw,5rem)]">Your bag</h1>

      {detailedLines.length === 0 ? (
        <div className="border-t border-line py-20 text-center">
          <p className="label-mono text-muted-ink">Nothing in the bag yet.</p>
          <Link
            to="/shop"
            className="mt-6 inline-block bg-ink px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-paper"
          >
            Shop the drop
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="border-t border-line">
            {detailedLines.map(({ line, product }) => (
              <div key={`${line.productId}-${line.size}`} className="flex gap-4 border-b border-line py-6">
                <Link to="/product/$slug" params={{ slug: product.slug }} className="shrink-0">
                  <img
                    src={product.images[0]}
                    srcSet={mediaSrcSet(product.images[0]!)}
                    sizes="96px"
                    alt={product.name}
                    width={200}
                    height={250}
                    loading="lazy"
                    decoding="async"
                    className="h-32 w-24 object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <h2 className="truncate text-sm font-semibold">
                      <Link to="/product/$slug" params={{ slug: product.slug }}>
                        {product.name}
                      </Link>
                    </h2>
                    <span className="shrink-0 text-sm font-semibold">
                      {formatINR(product.price * line.qty)}
                    </span>
                  </div>
                  <p className="label-mono mt-1 text-muted-ink">
                    {product.category} · Size {line.size}
                  </p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center border border-line">
                      <button
                        aria-label="Decrease quantity"
                        className="px-3 py-1.5"
                        onClick={() => setQty(line.productId, line.size, line.qty - 1)}
                      >
                        −
                      </button>
                      <span className="label-mono w-7 text-center">{line.qty}</span>
                      <button
                        aria-label="Increase quantity"
                        disabled={detailedLines.reduce((sum, entry) => sum + (entry.product.id === product.id ? entry.line.qty : 0), 0) >= product.stock}
                        className="px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
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
            ))}
          </div>

          <aside className="h-fit border border-line p-6">
            <h2 className="label-mono">Summary</h2>
            <div className="label-mono mt-5 flex justify-between text-muted-ink">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="label-mono mt-3 flex justify-between text-muted-ink">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
            </div>
            <div className="mt-5 flex justify-between border-t border-line pt-4 text-sm font-semibold">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
            <p className="label-mono mt-4 text-muted-ink">
              {remaining > 0
                ? `Free shipping unlocked at ${formatINR(freeShippingThreshold)}`
                : "Free shipping unlocked"}
            </p>
            <button
              type="button"
              disabled={reserving}
              onClick={handleProceed}
              className="mt-6 block w-full bg-ink py-4 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent hover:text-ink disabled:opacity-60"
            >
              {reserving ? "Reserving your pieces…" : "Proceed to order"}
            </button>
            {reserveError && <p className="label-mono mt-3 text-accent">{reserveError}</p>}
            <p className="label-mono mt-3 text-muted-ink">
              Your pieces are held for 15 minutes once you proceed.
            </p>

            <Link to="/shop" className="label-mono mt-4 block text-center text-muted-ink hover:text-ink">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
