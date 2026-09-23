import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteMedia } from "@/components/SiteMedia";
import { EditorialLookbook } from "@/components/EditorialLookbook";
import { InstagramFeed } from "@/components/InstagramFeed";
import { siteContentQuery, useSiteContent } from "@/lib/content";

export const Route = createFileRoute("/lookbook")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: () => ({
    meta: [
      { title: "MOLD Lookbook — Concrete / Heat / Motion" },
      { name: "description", content: "Explore the latest MOLD streetwear editorial, photographed through the streets of Chennai." },
      { property: "og:title", content: "MOLD Lookbook — Concrete / Heat / Motion" },
      { property: "og:description", content: "Heavy silhouettes in motion. The latest MOLD editorial from Chennai." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/lookbook" }],
  }),
  component: LookbookPage,
});

function LookbookPage() {
  const { hero, lookbook, instagram } = useSiteContent();
  const lead = lookbook.images[0];

  return (
    <>
      <section className="relative min-h-[68vh] overflow-hidden bg-ink text-paper">
        <SiteMedia src={lead?.url ?? hero.image ?? ""} alt={lead?.alt ?? hero.imageAlt ?? ""} eager className="absolute inset-0 h-full w-full object-cover opacity-65" />
        <div className="absolute inset-0 bg-ink/35" />
        <div className="relative mx-auto flex min-h-[68vh] max-w-[1500px] flex-col justify-end px-4 pb-10 pt-28 sm:px-6 sm:pb-16">
          <span className="label-mono text-paper/70">{lookbook.eyebrow} / {lookbook.season}</span>
          <h1 className="display mt-4 max-w-[12ch] text-[clamp(4rem,13vw,12rem)]">{lookbook.title}</h1>
        </div>
      </section>
      <EditorialLookbook content={lookbook} />
      <section className="border-y border-line py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1500px] gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-end">
          <p className="display max-w-[10ch] text-[clamp(3rem,8vw,7rem)]">MADE TO TAKE UP SPACE.</p>
          <div>
            <p className="max-w-[42ch] text-sm leading-relaxed text-muted-ink">{lookbook.storyBody}</p>
            <Link to="/shop" search={{ sort: "newest" }} className="label-mono mt-7 inline-block bg-ink px-6 py-4 text-paper hover:bg-accent hover:text-ink">Shop the collection →</Link>
          </div>
        </div>
      </section>
      <InstagramFeed content={instagram} />
    </>
  );
}