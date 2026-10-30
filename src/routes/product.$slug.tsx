import { createFileRoute, Link, notFound, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { discountPercent, getProduct, relatedProducts } from "@/data/products";
import { useCatalog, catalogQuery } from "@/lib/catalog";
import { formatINR } from "@/lib/format";
import { useStore } from "@/lib/store";
import { reserveItems } from "@/lib/reservation";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductGrid } from "@/components/ProductGrid";



export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params, context }) => {
    if (params.slug === "outdoorin") {
      throw redirect({ to: "/product/$slug", params: { slug: "outdoor-jacket" }, statusCode: 301 });
    }
    const products = await context.queryClient.ensureQueryData(catalogQuery);
    const product = getProduct(products, params.slug);
    if (!product) throw notFound();
    return { product };
  },

  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Unavailable — MOLD" }, { name: "robots", content: "noindex" }],
      };
    }
    const p = loaderData.product;
    const title = `${p.name} — MOLD`;
    const description = p.description.slice(0, 155);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/product/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/product/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            sku: p.sku,
            description: p.description,
            brand: { "@type": "Brand", name: "MOLD" },
            offers: {
              "@type": "Offer",
              priceCurrency: "INR",
              price: p.price,
              availability:
                p.stock > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            },
          }),
        },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const products = useCatalog();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const off = discountPercent(product);
  const soldOut = product.stock === 0;

  function handleAdd() {
    if (!size) {
      setError(true);
      return;
    }
    addToCart(product.id, size, qty);
  }

  async function handleBuyNow() {
    if (!size) {
      setError(true);
      return;
    }
    setReserving(true);
    setReserveError(null);
    try {
      await reserveItems([{ productId: product.id, size, qty }]);
      addToCart(product.id, size, qty);
      await queryClient.invalidateQueries({ queryKey: ["catalog"] });
      navigate({ to: "/checkout" });
    } catch (err) {
      setReserveError(
        err instanceof Error ? err.message : "That piece just sold out. Try again.",
      );
    } finally {
      setReserving(false);
    }
  }


  return (
    <div className="font-nunito mx-auto max-w-[1500px] px-4 py-8 sm:px-6 sm:py-12">
      <nav className="label-mono mb-6 text-muted-ink">
        <Link to="/shop" className="hover:text-ink">
          Shop
        </Link>{" "}
        /{" "}
        <Link to="/shop" search={{ category: product.category }} className="hover:text-ink">
          {product.category}
        </Link>{" "}
        / <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <span className="label-mono text-muted-ink">{product.category}</span>
          <h1 className="display mt-2 text-[clamp(2rem,5vw,3.5rem)]">{product.name}</h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-xl font-semibold text-blue-600">{formatINR(product.price)}</span>
            {product.compareAtPrice && (
              <>
                <span className="text-sm text-muted-ink line-through">
                  {formatINR(product.compareAtPrice)}
                </span>
                <span className="label-mono bg-accent px-2 py-1 text-ink">-{off}%</span>
              </>
            )}
          </div>
          <p className="label-mono mt-2 text-muted-ink">Inclusive of all taxes</p>

          <p className="mt-6 max-w-[52ch] text-sm leading-relaxed text-muted-ink">
            {product.description}
          </p>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <span className="label-mono">Size</span>
              <Link to="/help/$topic" params={{ topic: "size-guide" }} className="label-mono text-muted-ink hover:text-accent">
                Size guide →
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSize(s);
                    setError(false);
                  }}
                  className={`min-w-12 border px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                    size === s ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {error && <p className="label-mono mt-2 text-accent">Select a size first</p>}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <span className="label-mono">Qty</span>
            <div className="flex items-center border border-line">
              <button aria-label="Decrease" className="px-4 py-3" onClick={() => setQty(Math.max(1, qty - 1))}>
                −
              </button>
              <span className="label-mono w-8 text-center">{qty}</span>
              <button aria-label="Increase" disabled={qty >= Math.min(10, product.stock)} className="px-4 py-3 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => setQty(Math.min(10, product.stock, qty + 1))}>
                +
              </button>
            </div>
            <span className="label-mono text-muted-ink">
              {soldOut ? "Out of stock" : `${product.stock} in stock`}
            </span>
          </div>

          <div className="mt-8 flex flex-row gap-2 sm:gap-3">
            <button
              disabled={soldOut}
              onClick={handleAdd}
              className="min-w-0 flex-1 bg-ink py-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-paper transition-colors hover:bg-accent hover:text-ink disabled:opacity-40 sm:text-[11px] sm:tracking-[0.14em]"
            >
              {soldOut ? "Out of stock" : "Add to cart"}
            </button>
            <button
              onClick={() => toggleWishlist(product.id)}
              aria-label="Wishlist"
              className="flex w-12 shrink-0 items-center justify-center border border-ink px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors hover:bg-ink hover:text-paper sm:w-auto sm:gap-2 sm:px-5 sm:py-4 sm:text-[11px] sm:tracking-[0.14em]"
            >
              <Heart
                className={`h-4 w-4 ${wishlist.includes(product.id) ? "fill-accent text-accent" : ""}`}
              />
              <span className="hidden sm:inline">Wishlist</span>
            </button>
          </div>
          <button
            type="button"
            disabled={soldOut || reserving}
            onClick={handleBuyNow}
            className="mt-3 block w-3/4 max-w-full border border-ink py-4 text-center text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-accent hover:border-accent disabled:opacity-40 disabled:hover:bg-transparent"
          >
            {soldOut ? "Out of stock" : reserving ? "Reserving…" : "Buy now"}
          </button>
          {reserveError && <p className="label-mono mt-2 text-accent">{reserveError}</p>}


          <dl className="mt-10 divide-y divide-line border-y border-line text-sm">
            <Detail term="Fabric" value={product.fabric} />
            <Detail term="Fit" value={product.fit} />
            <Detail term="SKU" value={product.sku} />
            <Detail
              term="Shipping"
              value="Dispatch in 48 hours. Free over ₹1,999, otherwise ₹99."
            />
            <Detail term="Returns" value="7-day returns on unworn pieces with tags." />
          </dl>
        </div>
      </div>

      <section className="mt-20">
        <h2 className="display mb-8 border-b border-line pb-5 text-3xl">You may also like</h2>
        <ProductGrid
          products={relatedProducts(products, product)}
          boxClassName="w-full min-w-0 sm:w-[250px]"
          imageClassName="aspect-[4/5] w-full sm:aspect-auto sm:h-[310px]"
          gridClassName="grid-cols-2 gap-x-3 sm:grid-cols-[repeat(auto-fill,250px)] sm:gap-x-3 lg:gap-x-2"
        />
      </section>
    </div>
  );
}

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-4 py-4">
      <dt className="label-mono text-muted-ink">{term}</dt>
      <dd className="text-muted-ink">{value}</dd>
    </div>
  );
}
