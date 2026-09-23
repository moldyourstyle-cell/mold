import { createFileRoute, Link } from "@tanstack/react-router";
import { useCatalog } from "@/lib/catalog";
import { ProductGrid } from "@/components/ProductGrid";
import { useStore } from "@/lib/store";


export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — MOLD" },
      { name: "description", content: "The MOLD pieces you've saved for later." },
      { property: "og:title", content: "Wishlist — MOLD" },
      { property: "og:description", content: "The MOLD pieces you've saved for later." },
      { property: "og:url", content: "/wishlist" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/wishlist" }],
  }),
  component: Wishlist,
});

function Wishlist() {
  const { wishlist } = useStore();
  const products = useCatalog();
  const saved = products.filter((p) => wishlist.includes(p.id));


  return (
    <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6">
      <h1 className="display text-[clamp(2.5rem,8vw,5rem)]">Wishlist</h1>
      <p className="label-mono mt-3 border-b border-line pb-6 text-muted-ink">
        {saved.length} saved
      </p>
      <div className="mt-10">
        {saved.length === 0 ? (
          <div className="py-16 text-center">
            <p className="label-mono text-muted-ink">Nothing saved yet.</p>
            <Link
              to="/shop"
              className="mt-6 inline-block bg-ink px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-paper"
            >
              Browse the drop
            </Link>
          </div>
        ) : (
          <ProductGrid products={saved} />
        )}
      </div>
    </div>
  );
}
