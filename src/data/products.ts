import overshirt from "@/assets/p-overshirt.jpg";
import acidTee from "@/assets/p-acid-tee.jpg";
import crewShirt from "@/assets/p-crew-shirt.jpg";
import cargo from "@/assets/p-cargo.jpg";
import look1 from "@/assets/look-1.jpg";
import look3 from "@/assets/look-3.jpg";


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



export const categories: {
  slug: CategorySlug;
  name: string;
  image: string;
  blurb: string;
}[] = [
  {
    slug: "jackets",
    name: "Jackets",
    image: overshirt,
    blurb: "Structured outerwear cut with weight and drop shoulders.",
  },
  {
    slug: "t-shirts",
    name: "T-Shirts",
    image: acidTee,
    blurb: "400gsm boxy bodies that hold their shape wash after wash.",
  },
  {
    slug: "shirts",
    name: "Shirts",
    image: crewShirt,
    blurb: "Heavy woven shirting with squared hems and wide plackets.",
  },
  {
    slug: "pants",
    name: "Pants",
    image: cargo,
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
