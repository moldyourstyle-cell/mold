import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Heart, Plus } from "lucide-react";
import { discountPercent, type Product } from "@/data/products";
import { formatINR } from "@/lib/format";
import { useStore } from "@/lib/store";
import { mediaSrcSet, responsiveMediaSrc } from "@/lib/media";

export function ProductCard({ product, boxClassName, imageClassName }: { product: Product; boxClassName?: string; imageClassName?: string }) {
  const cardRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [secondaryLoaded, setSecondaryLoaded] = useState(false);
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const off = discountPercent(product);
  const wished = wishlist.includes(product.id);
  const soldOut = product.stock === 0;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!product.images[1] || secondaryLoaded) return;
    const idleWindow = window as typeof window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const timeout = window.setTimeout(() => setSecondaryLoaded(true), 2500);
    const idle = idleWindow.requestIdleCallback?.(() => setSecondaryLoaded(true), { timeout: 2500 });
    return () => {
      window.clearTimeout(timeout);
      if (idle !== undefined) idleWindow.cancelIdleCallback?.(idle);
    };
  }, [product.images, secondaryLoaded]);

  return (
    <article
      ref={cardRef}
      onMouseEnter={() => setSecondaryLoaded(true)}
      onFocus={() => setSecondaryLoaded(true)}
      className={`group transition-[opacity,transform] duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${boxClassName ?? ""} ${
        visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      }`}
    >
      <div className={`relative overflow-hidden bg-secondary ${imageClassName ?? "aspect-[295/443]"}`}>
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          aria-label={product.name}
          className="block h-full w-full"
        >
          <img
            src={responsiveMediaSrc(product.images[0]!)}
            srcSet={mediaSrcSet(product.images[0]!)}
            sizes="(max-width: 639px) 130px, (max-width: 1023px) calc(50vw - 28px), 25vw"
            alt={`${product.name} — MOLD ${product.category}`}
            width={1024}
            height={1280}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {product.images[1] && secondaryLoaded && (
            <img
              src={responsiveMediaSrc(product.images[1]!)}
              alt={`${product.name} alternate view`}
              srcSet={mediaSrcSet(product.images[1])}
              sizes="(max-width: 639px) 130px, (max-width: 1023px) calc(50vw - 28px), 25vw"
              width={1024}
              height={1280}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </Link>

        {product.isNew && (
          <span className="label-mono absolute left-2 top-2 bg-ink px-2 py-1 text-paper">New</span>
        )}
        {off > 0 && (
          <span className="label-mono absolute right-2 top-2 bg-accent px-2 py-1 text-ink">
            -{off}%
          </span>
        )}
        {soldOut && (
          <span className="label-mono absolute inset-x-0 bottom-0 bg-ink/85 py-3 text-center text-paper">
            Out of stock
          </span>
        )}

        <button
          onClick={() => toggleWishlist(product.id)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute bottom-2 right-2 rounded-full bg-paper/90 p-1.5 transition-colors hover:text-accent sm:p-2"
        >
          <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${wished ? "fill-accent text-accent" : ""}`} />
        </button>

        {!soldOut && (
          <button
            onClick={() => addToCart(product.id, product.sizes[Math.min(1, product.sizes.length - 1)] ?? "M")}
            aria-label={`Quick add ${product.name} to cart`}
            title={`Quick add ${product.name}`}
            className="absolute bottom-2 left-2 z-10 hidden size-8 translate-y-[calc(100%+1rem)] place-items-center rounded-md bg-ink/70 text-paper shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0 focus-visible:translate-y-0 sm:grid"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="label-mono text-muted-ink">{product.category}</span>
          <h3 className="mt-1 truncate text-sm font-semibold">
            <Link to="/product/$slug" params={{ slug: product.slug }}>
              {product.name}
            </Link>
          </h3>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold text-blue-600">{formatINR(product.price)}</div>
          {product.compareAtPrice && (
            <div className="label-mono text-muted-ink line-through">
              {formatINR(product.compareAtPrice)}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
