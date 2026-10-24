import { createFileRoute, Link } from "@tanstack/react-router";
import { categories } from "@/data/products";
import { useCatalog } from "@/lib/catalog";
import { siteContentQuery, useSiteContent } from "@/lib/content";

import { CategoryCard } from "@/components/CategoryCard";
import { ProductGrid } from "@/components/ProductGrid";
import { Newsletter } from "@/components/Newsletter";
import { EditorialLookbook } from "@/components/EditorialLookbook";
import { InstagramFeed } from "@/components/InstagramFeed";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ProductDetailEditorial } from "@/components/ProductDetailEditorial";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: () => ({
    meta: [
      { title: "MOLD — Built Heavy | Chennai Streetwear" },
      {
        name: "description",
        content:
          "Streetwear cut from dense fabric and finished with intention. Shop Drop 07 from MOLD, a Chennai-born label of heavy silhouettes and limited runs.",
      },
      { property: "og:title", content: "MOLD — Built Heavy | Chennai Streetwear" },
      {
        property: "og:description",
        content: "Heavy, oversized streetwear made in Chennai. Limited runs only.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const products = useCatalog();
  const { hero, lookbook, instagram, showcase } = useSiteContent();
  const [oauthError, setOauthError] = useState(false);
  const latest = [...products]
    .sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("error") || params.has("error_code")) setOauthError(true);
  }, []);

  return (
    <>
      {oauthError && (
        <div role="alert" className="mx-auto flex max-w-[1500px] flex-col items-start gap-3 border-b border-line bg-paper px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-ink">
            Your sign-in link expired before sign-in finished. Start again to get a fresh link.
          </p>
          <a
            href="https://mold-gold.vercel.app/auth"
            className="shrink-0 bg-ink px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-80"
          >
            Try signing in again
          </a>
        </div>
      )}
      <HeroCarousel content={hero} />

      {/* CATEGORIES */}
      <section className="w-full pb-0">
        <div className="grid grid-cols-2 gap-0 md:grid-cols-4">
          {categories.map((c) => (
            <CategoryCard
              key={c.slug}
              slug={c.slug}
              name={c.name}
              image={c.image}
              count={products.filter((p) => p.category === c.slug).length}
            />
          ))}
        </div>
      </section>

      {/* LATEST DROP */}
      <section className="mx-auto max-w-[1500px] px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-10">
        <div className="mb-10 flex items-end justify-between border-b border-line pb-5">
          <div>
            <h2 className="display section-heading mt-2">Latest Drop</h2>
          </div>
          <Link
            to="/shop"
            className="label-mono hidden items-center gap-2 transition-colors hover:text-accent sm:flex"
          >
            View all <span className="text-accent">→</span>
          </Link>
        </div>
        <ProductGrid products={latest} />
      </section>

      <ProductDetailEditorial content={showcase} />

      <EditorialLookbook content={lookbook} compact />
      <InstagramFeed content={instagram} />

      <Newsletter />
    </>
  );
}
