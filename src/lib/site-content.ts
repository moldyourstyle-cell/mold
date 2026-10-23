export type HeroSlide = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  image: string;
  imageAlt: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

/** Hero supports multiple slides. Legacy single-slide fields stay readable. */
export type HeroContent = Partial<HeroSlide> & {
  intervalSeconds?: number;
  slides?: HeroSlide[];
};

export type EditorialImage = {
  url: string;
  alt: string;
  caption: string;
  orientation: "portrait" | "landscape";
};

export type LookbookContent = {
  eyebrow: string;
  title: string;
  season: string;
  intro: string;
  storyTitle: string;
  storyBody: string;
  ctaLabel: string;
  images: EditorialImage[];
};

export type InstagramPost = {
  image: string;
  alt: string;
  caption: string;
  url: string;
};

export type InstagramContent = {
  eyebrow: string;
  title: string;
  handle: string;
  profileUrl: string;
  posts: InstagramPost[];
};

export type ProductFeature = {
  text: string;
  enabled: boolean;
  lineEnabled: boolean;
  desktop: { x: number; y: number; tx: number; ty: number };
  mobile: { x: number; y: number; tx: number; ty: number };
};
export type ProductShowcaseContent = { heading: string; image: string; hoverImage: string; imageAlt: string; features: ProductFeature[]; detailVideo: string; detailHeading: string; detailText: string };

export type SiteContent = {
  hero: HeroContent;
  lookbook: LookbookContent;
  instagram: InstagramContent;
  showcase: ProductShowcaseContent;
};

const feature = (text: string, x: number, y: number, tx: number, ty: number): ProductFeature => ({ text, enabled: true, lineEnabled: true, desktop: { x, y, tx, ty }, mobile: { x, y, tx, ty } });

export const emptyHeroSlide: HeroSlide = {
  eyebrow: "New slide",
  title: "HEADLINE",
  accent: "ACCENT LINE",
  description: "Add a short supporting line for this slide.",
  image: "",
  imageAlt: "MOLD campaign image",
  primaryLabel: "Shop now",
  primaryHref: "/shop",
  secondaryLabel: "View editorial",
  secondaryHref: "/lookbook",
};

/** Normalises legacy single-slide hero content into a slide list. */
export function normalizeHero(hero: HeroContent | undefined | null): {
  intervalSeconds: number;
  slides: HeroSlide[];
} {
  const rawInterval = Number(hero?.intervalSeconds);
  const intervalSeconds = Number.isFinite(rawInterval) && rawInterval >= 1 ? rawInterval : 6;
  const candidates = hero?.slides?.length
    ? hero.slides
    : hero?.image || hero?.title
      ? [{ ...emptyHeroSlide, ...hero } as HeroSlide]
      : [];
  const slides = candidates.filter((slide) => isUploadedMedia(slide.image));
  return { intervalSeconds, slides };
}

/** Exclude shipped demo assets even when older CMS rows still reference them. */
export function isUploadedMedia(url: string | undefined | null): boolean {
  const value = url?.trim();
  if (!value) return false;
  return !/^\/?(?:editorial\/)?mold-(?:hero|look-[123])\.jpg(?:[?#].*)?$/i.test(value);
}

export const defaultSiteContent: SiteContent = {
  showcase: {
    heading: "FORM, WITH INTENTION.", image: "", hoverImage: "", imageAlt: "",
    detailVideo: "", detailHeading: "MADE TO MOVE. BUILT TO LAST.", detailText: "Dense, considered fabric meets a silhouette made for the everyday. Each detail earns its place — from the weight of the cloth to the finish of every seam.",
    features: [feature("Heavyweight cotton twill", 57, 28, 75, 22), feature("Built-in utility pocket", 61, 48, 78, 48), feature("Reinforced double stitch", 54, 72, 76, 78)],
  },
  hero: {
    intervalSeconds: 6,
    slides: [],
  },
  lookbook: {
    eyebrow: "Editorial 001",
    title: "CONCRETE / HEAT / MOTION",
    season: "Chennai — 2026",
    intro:
      "A study in weight, movement and the city after rain. Drop 07 is photographed where dense fabric meets dense streets.",
    storyTitle: "THE CITY SETS THE SILHOUETTE",
    storyBody:
      "Built in Chennai and cut to move through it. Each look balances hard structure with room to breathe — oversized layers, grounded proportions and details made to wear in, not out.",
    ctaLabel: "Explore the full story",
    images: [],
  },
  instagram: {
    eyebrow: "Live archive",
    title: "WORN OUTSIDE",
    handle: "@_mold._",
    profileUrl: "https://www.instagram.com/_mold._",
    posts: [],
  },
};

/** True when an editorial media slot points at a video file rather than an image. */
export function isVideoSource(url: string | undefined | null): boolean {
  return /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(url ?? "");
}
