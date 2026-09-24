import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { allSizes, categories, type CategorySlug } from "@/data/products";
import { useCatalog } from "@/lib/catalog";

import { ProductGrid } from "@/components/ProductGrid";

type ShopSearch = {
  category?: CategorySlug | undefined;
  sort?: "newest" | "price-asc" | "price-desc" | undefined;
  size?: string | undefined;
  q?: string | undefined;
  sale?: boolean | undefined;
  inStock?: boolean | undefined;
  maxPrice?: number | undefined;
};

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    category: (search["category"] as CategorySlug) || undefined,
    sort: (search["sort"] as ShopSearch["sort"]) || undefined,
    size: (search["size"] as string) || undefined,
    q: (search["q"] as string) || undefined,
    sale: search["sale"] ? true : undefined,
    inStock: search["inStock"] ? true : undefined,
    maxPrice: search["maxPrice"] ? Number(search["maxPrice"]) : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Shop All — MOLD Streetwear" },
      {
        name: "description",
        content:
          "Shop every MOLD piece: heavy jackets, 400gsm tees, boxy shirts and wide pants. Filter by category, size and price.",
      },
      { property: "og:title", content: "Shop All — MOLD Streetwear" },
      {
        property: "og:description",
        content: "Heavy jackets, tees, shirts and pants from MOLD Chennai.",
      },
      { property: "og:url", content: "/shop" },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
  component: Shop,
});

function Shop() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const products = useCatalog();


  const setSearch = (patch: Partial<ShopSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  let list = products.filter((p) => {
    if (search.category && p.category !== search.category) return false;
    if (search.size && !p.sizes.includes(search.size)) return false;
    if (search.sale && !p.isClearanceSale) return false;
    if (search.inStock && p.stock === 0) return false;
    if (search.maxPrice && p.price > search.maxPrice) return false;
    if (search.q) {
      const q = search.q.toLowerCase();
      const hay = `${p.name} ${p.category} ${p.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  list = [...list].sort((a, b) => {
    if (search.sort === "price-asc") return a.price - b.price;
    if (search.sort === "price-desc") return b.price - a.price;
    if (search.sort === "newest") return b.createdAt.localeCompare(a.createdAt);
    return 0;
  });

  const active = categories.find((c) => c.slug === search.category);

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-14">
      <span className="label-mono text-muted-ink">
        Shop {search.sale ? "— Clearance Sale" : active ? `— ${active.name}` : "— All"}
      </span>
      <h1 className="display mt-2 text-[clamp(2.5rem,8vw,6rem)]">
        {search.sale ? "Clearance Sale" : active ? active.name : "All pieces"}
      </h1>
      {active && <p className="mt-4 max-w-[46ch] text-sm text-muted-ink">{active.blurb}</p>}

      {/* Filters */}
      <div className="mt-8 space-y-4 border-y border-line py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-mono mr-2 text-muted-ink">Category</span>
          <FilterChip active={!search.category} onClick={() => setSearch({ category: undefined })}>
            All
          </FilterChip>
          {categories.map((c) => (
            <FilterChip
              key={c.slug}
              active={search.category === c.slug}
              onClick={() => setSearch({ category: c.slug })}
            >
              {c.name}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="label-mono mr-2 text-muted-ink">Size</span>
          <FilterChip active={!search.size} onClick={() => setSearch({ size: undefined })}>
            Any
          </FilterChip>
          {allSizes(products).map((s) => (
            <FilterChip
              key={s}
              active={search.size === s}
              onClick={() => setSearch({ size: search.size === s ? undefined : s })}
            >
              {s}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="label-mono mr-1 text-muted-ink">Price up to</span>
          <input
            type="range"
            min={1000}
            max={6000}
            step={500}
            value={search.maxPrice ?? 6000}
            onChange={(e) =>
              setSearch({
                maxPrice: Number(e.target.value) === 6000 ? undefined : Number(e.target.value),
              })
            }
            className="w-40 accent-[oklch(0.652_0.238_33)]"
          />
          <span className="label-mono">₹{(search.maxPrice ?? 6000).toLocaleString("en-IN")}</span>

          <FilterChip active={!!search.sale} onClick={() => setSearch({ sale: search.sale ? undefined : true })}>
            On sale
          </FilterChip>
          <FilterChip
            active={!!search.inStock}
            onClick={() => setSearch({ inStock: search.inStock ? undefined : true })}
          >
            In stock
          </FilterChip>

          <label className="label-mono ml-auto flex items-center gap-2 text-muted-ink">
            Sort
            <select
              value={search.sort ?? ""}
              onChange={(e) =>
                setSearch({ sort: (e.target.value || undefined) as ShopSearch["sort"] })
              }
              className="label-mono border border-line bg-paper px-2 py-1.5 text-ink"
            >
              <option value="">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        </div>

        {search.q && (
          <div className="label-mono flex items-center gap-3 text-muted-ink">
            Searching “{search.q}”
            <button className="text-accent" onClick={() => setSearch({ q: undefined })}>
              Clear
            </button>
          </div>
        )}
      </div>

      <p className="label-mono py-6 text-muted-ink">{list.length} pieces</p>
      <ProductGrid products={list} />

      <div className="mt-16 border-t border-line pt-8">
        <Link to="/about" className="label-mono hover:text-accent">
          Read the MOLD story →
        </Link>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`label-mono border px-3 py-1.5 transition-colors ${
        active ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}
