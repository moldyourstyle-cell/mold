import { useEffect, useState } from "react";
import { SiteMedia } from "@/components/SiteMedia";
import { normalizeHero, type HeroContent } from "@/lib/site-content";


export function HeroCarousel({ content }: { content: HeroContent }) {
  const { intervalSeconds, slides } = normalizeHero(content);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % slides.length),
      Math.max(1, intervalSeconds) * 1000,
    );
    return () => window.clearInterval(timer);
  }, [slides.length, intervalSeconds]);

  useEffect(() => {
    if (index > slides.length - 1) setIndex(0);
  }, [index, slides.length]);

  const slide = slides[Math.min(index, slides.length - 1)]!;

  return (
    <section className="relative aspect-[4/5] min-h-[540px] w-full overflow-hidden bg-ink text-paper sm:aspect-[4/3] sm:min-h-[580px] md:aspect-[3/2] md:min-h-[620px] xl:aspect-[2/1]">
      {slides.map((item, i) => (
        <div
          key={`${item.image}-${i}`}
          aria-hidden={i === index ? undefined : true}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <SiteMedia
            src={item.image}
            alt={i === index ? item.imageAlt : ""}
            eager={i === 0}
            width={1920}
            height={1080}
            className="h-full w-full object-cover object-center"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />
      <div className="absolute inset-0 mx-auto flex max-w-[1500px] flex-col justify-end px-4 pb-5 pt-14 sm:px-6 sm:pb-8 sm:pt-24">
        <div key={index} className="fade-up">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-accent" />
            <span className="label-mono text-paper/80">{slide.eyebrow}</span>
          </div>
          <h1 className="display mt-3 max-w-[11ch] break-words text-[clamp(2rem,7vw,4rem)] leading-[0.98] text-paper sm:mt-4 sm:max-w-[10ch] sm:text-[clamp(3rem,5vw,5rem)]">
            {slide.title}
            <span className="block text-accent">{slide.accent}</span>
          </h1>
          <div className="mt-5 border-t border-paper/30 pt-4 sm:mt-6 sm:pt-5">
            <p className="max-w-[52ch] text-sm leading-relaxed text-paper/80">{slide.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
              <a
                href={slide.primaryHref}
                className="inline-flex min-h-11 w-fit items-center justify-center bg-accent px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-paper sm:px-6 sm:py-3 sm:text-[11px] sm:tracking-[0.14em]"
              >
                {slide.primaryLabel}
              </a>
              <a
                href={slide.secondaryHref}
                className="inline-flex min-h-11 w-fit items-center justify-center border border-paper/60 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-paper transition-colors hover:bg-paper hover:text-ink sm:px-6 sm:py-3 sm:text-[11px] sm:tracking-[0.14em]"
              >
                {slide.secondaryLabel}
              </a>
            </div>
          </div>
        </div>

        {slides.length > 1 && (
          <div className="mt-8 flex items-center gap-3">
            {slides.map((item, i) => (
              <button
                key={`dot-${item.image}-${i}`}
                type="button"
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-1 w-10 transition-colors ${i === index ? "bg-accent" : "bg-paper/35 hover:bg-paper/70"}`}
              />
            ))}
            <span className="label-mono ml-2 text-paper/60">
              {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
