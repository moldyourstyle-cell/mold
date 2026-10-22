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
    <section className="relative aspect-[2/1] w-full overflow-hidden bg-ink text-paper sm:aspect-[966/362]">
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
      <div className="absolute inset-0 mx-auto flex max-w-[1500px] flex-col justify-end px-3 pb-2 pt-2 sm:px-6 sm:pb-5 sm:pt-8 lg:pb-8">
        <div key={index} className="fade-up">
          <div className="flex items-center gap-4">
            <span className="label-mono text-[8px] text-paper/80 sm:text-[10px]">{slide.eyebrow}</span>
          </div>
          <h1 className="display mt-1 max-w-[14ch] break-words text-[clamp(1.35rem,6vw,2.5rem)] leading-[0.9] text-accent sm:mt-2 sm:max-w-[10ch] sm:text-[clamp(2rem,4.5vw,4rem)] lg:mt-3 lg:text-[clamp(2.5rem,4vw,4rem)]">
            {slide.title}
            <span className="block text-accent">{slide.accent}</span>
          </h1>
          <div className="mt-2 pt-0 sm:mt-3 md:mt-4 lg:mt-4">
            <p className="hidden max-w-[52ch] text-sm leading-relaxed text-paper/80 md:block">{slide.description}</p>
            <div className="mt-1 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-3 lg:mt-3">
              <a
                href={slide.primaryHref}
                className="inline-flex min-h-8 w-fit items-center justify-center bg-accent px-3 py-1.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:bg-paper sm:min-h-10 sm:px-5 sm:py-2 sm:text-[10px] sm:tracking-[0.12em] lg:min-h-10 lg:px-5 lg:py-2"
              >
                {slide.primaryLabel}
              </a>
              <a
                href={slide.secondaryHref}
                className="inline-flex min-h-8 w-fit items-center justify-center border border-paper/60 px-3 py-1.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-paper transition-colors hover:bg-paper hover:text-ink sm:min-h-10 sm:px-5 sm:py-2 sm:text-[10px] sm:tracking-[0.12em] lg:min-h-10 lg:px-5 lg:py-2"
              >
                {slide.secondaryLabel}
              </a>
            </div>
          </div>
        </div>

        {slides.length > 1 && (
          <div className="mt-2 flex items-center gap-2 sm:mt-4 sm:gap-3">
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
