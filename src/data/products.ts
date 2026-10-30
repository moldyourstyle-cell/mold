import overshirt400 from "@/assets/p-overshirt-400.webp";
import overshirt800 from "@/assets/p-overshirt-800.webp";
import overshirt1600 from "@/assets/p-overshirt-1600.webp";
import acidTee400 from "@/assets/p-acid-tee-400.webp";
import acidTee800 from "@/assets/p-acid-tee-800.webp";
import acidTee1600 from "@/assets/p-acid-tee-1600.webp";
import crewShirt400 from "@/assets/p-crew-shirt-400.webp";
import crewShirt800 from "@/assets/p-crew-shirt-800.webp";
import crewShirt1600 from "@/assets/p-crew-shirt-1600.webp";
import cargo400 from "@/assets/p-cargo-400.webp";
import cargo800 from "@/assets/p-cargo-800.webp";
import cargo1600 from "@/assets/p-cargo-1600.webp";
import look1 from "@/assets/look-1-800.webp";
import look3 from "@/assets/look-3-800.webp";


export type CategorySlug = "jackets" | "t-shirts" | "shirts" | "pants";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  price: number;
  compareAtPrice?: number | undefined;
  images: string[];
  sizes: string[];
  description: string;
  fabric: string;
  fit: string;
  stock: number;
  sku: string;
  tags: string[];
  isNew?: boolean | undefined;
  isClearanceSale?: boolean | undefined;
  isPublished: boolean;

  createdAt: string;
  updatedAt?: string;
};

const responsiveCategoryImage = (small: string, medium: string, large: string) => ({
  image: medium,
  srcSet: `${small} 400w, ${medium} 800w, ${large} 1600w`,
});


export const categories: {
  slug: CategorySlug;
  name: string;
  image: string;
  srcSet: string;
  blurb: string;
}[] = [
  {
    slug: "jackets",
    name: "Jackets",
    ...responsiveCategoryImage(overshirt400, overshirt800, overshirt1600),
    blurb: "Structured outerwear cut with weight and drop shoulders.",
  },
  {
    slug: "t-shirts",
    name: "T-Shirts",
    ...responsiveCategoryImage(acidTee400, acidTee800, acidTee1600),
    blurb: "400gsm boxy bodies that hold their shape wash after wash.",
  },
  {
    slug: "shirts",
    name: "Shirts",
    ...responsiveCategoryImage(crewShirt400, crewShirt800, crewShirt1600),
    blurb: "Heavy woven shirting with squared hems and wide plackets.",
  },
  {
    slug: "pants",
    name: "Pants",
    ...responsiveCategoryImage(cargo400, cargo800, cargo1600),
    blurb: "Wide, weighted legs built for movement on the street.",
  },
];

export const lookbook = { hero: look1, detail: look3 };

export function getProduct(list: Product[], slug: string) {
  return list.find((p) => p.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function relatedProducts(list: Product[], product: Product, limit = 4) {
  return list
    .filter((p) => p.id !== product.id)
    .sort((a, b) => (a.category === product.category ? -1 : 1))
    .slice(0, limit);
}

export function allSizes(list: Product[]) {
  return Array.from(new Set(list.flatMap((p) => p.sizes)));
}

export function discountPercent(p: Product) {
  if (!p.compareAtPrice) return 0;
  return Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100);
}
