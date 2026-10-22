import { createFileRoute, Link } from "@tanstack/react-router";
import { categories } from "@/data/products";
import { useCatalog } from "@/lib/catalog";
import { siteContentQuery, useSiteContent } from "@/lib/content";

import { ProductGrid } from "@/components/ProductGrid";
import { CategoryCard } from "@/components/CategoryCard";
import { Newsletter } from "@/components/Newsletter";
import { EditorialLookbook } from "@/components/EditorialLookbook";
import { InstagramFeed } from "@/components/InstagramFeed";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ProductDetailEditorial } from "@/components/ProductDetailEditorial";

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
  const latest = [...products]
    .sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);



  return (
    <>
      <HeroCarousel content={hero} />


      {/* LATEST DROP */}
      <section className="mx-auto max-w-[1500px] px-4 pb-16 pt-0 sm:px-6 sm:pb-24 sm:pt-0">
        <div className="mb-10 flex items-end justify-between border-b border-line pb-5">
          <div>
            <span className="label-mono text-muted-ink">(01) — Latest</span>
            <h2 className="display mt-2 text-[clamp(2.5rem,6vw,5rem)]">Latest Drop</h2>
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

      {/* CATEGORIES */}
      <section className="mx-auto max-w-[1500px] px-4 pb-0 sm:px-6">
        <span className="label-mono text-muted-ink">(02) — Departments</span>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-6 md:grid-cols-2 md:gap-7 xl:grid-cols-4">
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

      <ProductDetailEditorial content={showcase} />

      <EditorialLookbook content={lookbook} compact />
      <InstagramFeed content={instagram} />

      <Newsletter />
    </>
  );
}
