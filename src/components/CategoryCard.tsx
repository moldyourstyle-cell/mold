import { Link } from "@tanstack/react-router";
import type { CategorySlug } from "@/data/products";

export function CategoryCard({
  slug,
  name,
  image,
  count,
}: {
  slug: CategorySlug;
  name: string;
  image: string;
  count: number;
}) {
  return (
    <Link
      to="/shop"
      search={{ category: slug }}
      className="group relative block aspect-square overflow-hidden bg-secondary"
    >
      <img
        src={image}
        alt={`Shop MOLD ${name}`}
        width={1024}
        height={1280}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-ink/25" />
      <span className="display absolute bottom-5 left-5 text-2xl text-paper sm:text-3xl">
        {name}
      </span>
      <span className="label-mono absolute bottom-6 right-5 text-paper">
        {String(count).padStart(2, "0")} ·{" "}
        <span className="inline-block text-accent transition-transform group-hover:translate-x-1">
          →
        </span>
      </span>
    </Link>
  );
}
