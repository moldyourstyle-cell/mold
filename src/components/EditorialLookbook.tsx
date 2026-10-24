import { Link } from "@tanstack/react-router";
import { SiteMedia } from "@/components/SiteMedia";
import { isUploadedMedia, type LookbookContent } from "@/lib/site-content";


export function EditorialLookbook({ content, compact = false }: { content: LookbookContent; compact?: boolean }) {
  const images = content.images.filter((image) => isUploadedMedia(image.url));
  if (images.length === 0) return null;
  const [portrait, motion, detail] = images;

  return (
    <section className={compact ? "pb-16 pt-0 sm:pb-24" : "py-10 sm:py-20"}>
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6">
        <div className="border-t border-line pt-0">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="display section-heading">{content.title}</h2>
            <span className="label-mono shrink-0 text-muted-ink">{content.season}</span>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-12 gap-3 sm:gap-5">
          {portrait && <figure className="col-span-10 md:col-span-6 md:col-start-1">
            <SiteMedia src={portrait.url} alt={portrait.alt} className="aspect-[4/5] w-full object-cover" />
            <figcaption className="label-mono mt-3 text-muted-ink">{portrait.caption}</figcaption>
          </figure>}
          {motion && <div className="col-span-12 mt-8 md:col-span-5 md:col-start-8 md:mt-24">
            <><p className="max-w-[34ch] text-base leading-relaxed">{content.intro}</p><figure className="mt-10">
              <SiteMedia src={motion.url} alt={motion.alt} className="aspect-[4/3] w-full object-cover" />
              <figcaption className="label-mono mt-3 text-muted-ink">{motion.caption}</figcaption>
            </figure></>
          </div>}

          {detail && <figure className="col-span-8 col-start-5 mt-8 md:col-span-5 md:col-start-2 md:mt-20">
            <SiteMedia src={detail.url} alt={detail.alt} className="aspect-[4/3] w-full object-cover" />
            <figcaption className="label-mono mt-3 text-muted-ink">{detail.caption}</figcaption>
          </figure>}
          <div className="col-span-12 mt-8 border-t border-line pt-6 md:col-span-5 md:col-start-8 md:mt-36">
            <h3 className="display text-4xl sm:text-6xl">{content.storyTitle}</h3>
            <p className="mt-6 max-w-[42ch] text-sm leading-relaxed text-muted-ink">{content.storyBody}</p>
            {compact && (
              <Link to="/lookbook" className="label-mono mt-7 inline-block border-b border-ink pb-1 hover:text-accent">
                {content.ctaLabel} →
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
