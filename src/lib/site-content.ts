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

export type SiteContent = {
  hero: HeroContent;
  lookbook: LookbookContent;
  instagram: InstagramContent;
};

export const emptyHeroSlide: HeroSlide = {
  eyebrow: "New slide",
  title: "HEADLINE",
  accent: "ACCENT LINE",
  description: "Add a short supporting line for this slide.",
  image: "/editorial/mold-hero.jpg",
  imageAlt: "MOLD campaign image",
  primaryLabel: "Shop now",
  primaryHref: "/shop",
  secondaryLabel: "View editorial",
  secondaryHref: "/lookbook",
};

export const defaultHeroSlides: HeroSlide[] = [
  {
    eyebrow: "Campaign 01 / Chennai",
    title: "BUILT FOR THE STREETS.",
    accent: "NOT THE CROWD.",
    description: "Heavy silhouettes, stripped back and released in limited numbers.",
    image: "/editorial/mold-hero.jpg",
    imageAlt: "MOLD model wearing a black oversized jacket against raw concrete",
    primaryLabel: "Shop Drop 07",
    primaryHref: "/shop?sort=newest",
    secondaryLabel: "View editorial",
    secondaryHref: "/lookbook",
  },
  {
    eyebrow: "Editorial 001 / Drop 07",
    title: "CONCRETE. HEAT.",
    accent: "MOTION.",
    description: "Photographed where dense fabric meets dense streets.",
    image: "/editorial/mold-look-3.jpg",
    imageAlt: "MOLD olive utility set in motion on a wet street",
    primaryLabel: "Shop the drop",
    primaryHref: "/shop",
    secondaryLabel: "See the lookbook",
    secondaryHref: "/lookbook",
  },
];

/** Normalises legacy single-slide hero content into a slide list. */
export function normalizeHero(hero: HeroContent | undefined | null): {
  intervalSeconds: number;
  slides: HeroSlide[];
} {
  const rawInterval = Number(hero?.intervalSeconds);
  const intervalSeconds = Number.isFinite(rawInterval) && rawInterval >= 1 ? rawInterval : 6;
  const slides = hero?.slides?.length
    ? hero.slides
    : hero?.image || hero?.title
      ? [{ ...emptyHeroSlide, ...hero } as HeroSlide]
      : defaultHeroSlides;
  return { intervalSeconds, slides };
}

export const defaultSiteContent: SiteContent = {
  hero: {
    intervalSeconds: 6,
    slides: defaultHeroSlides,
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
    images: [
      {
        url: "/editorial/mold-look-1.jpg",
        alt: "MOLD model in a dark hoodie on a Chennai street",
        caption: "Look 01 — Heavy form",
        orientation: "portrait",
      },
      {
        url: "/editorial/mold-look-3.jpg",
        alt: "MOLD olive utility set in motion on a wet street",
        caption: "Look 02 — Utility in motion",
        orientation: "landscape",
      },
      {
        url: "/editorial/mold-look-2.jpg",
        alt: "Close detail of washed fabric and metal hardware",
        caption: "Detail 01 — Built to age",
        orientation: "landscape",
      },
    ],
  },
  instagram: {
    eyebrow: "Live archive",
    title: "WORN OUTSIDE",
    handle: "@_mold._",
    profileUrl: "https://www.instagram.com/_mold._",
    posts: [
      { image: "/editorial/mold-look-1.jpg", alt: "MOLD dark hoodie street portrait", caption: "Heavy form / Chennai", url: "https://www.instagram.com/_mold._" },
      { image: "/editorial/mold-look-2.jpg", alt: "MOLD garment hardware detail", caption: "Details that wear in", url: "https://www.instagram.com/_mold._" },
      { image: "/editorial/mold-look-3.jpg", alt: "MOLD utility set walking through the city", caption: "Utility in motion", url: "https://www.instagram.com/_mold._" },
      { image: "/editorial/mold-hero.jpg", alt: "MOLD black outerwear against concrete", caption: "Drop 07 / Built heavy", url: "https://www.instagram.com/_mold._" },
    ],
  },
};

/** True when an editorial media slot points at a video file rather than an image. */
export function isVideoSource(url: string | undefined | null): boolean {
  return /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(url ?? "");
}
