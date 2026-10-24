import type { Product } from "@/data/products";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products, boxClassName, imageClassName, gridClassName }: { products: Product[]; boxClassName?: string; imageClassName?: string; gridClassName?: string }) {
  if (products.length === 0) {
    return (
      <p className="label-mono py-20 text-center text-muted-ink">
        Nothing matches those filters.
      </p>
    );
  }
  return (
    <div className={`grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-4 ${gridClassName ?? ""}`}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 2} boxClassName={boxClassName} imageClassName={imageClassName} />
      ))}
    </div>
  );
}
