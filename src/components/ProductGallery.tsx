import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const activeIndex = images.length ? active % images.length : 0;

  function showPrevious() {
    setActive((current) => (current - 1 + images.length) % images.length);
  }

  function showNext() {
    setActive((current) => (current + 1) % images.length);
  }

  return (
    <div className="lg:flex lg:gap-4">
      <div className="order-2 mt-3 flex gap-3 overflow-x-auto lg:order-1 lg:mt-0 lg:w-20 lg:flex-col">
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            onClick={() => setActive(i)}
            aria-label={`View image ${i + 1}`}
            aria-current={i === activeIndex ? "true" : undefined}
            className={`aspect-[4/5] w-14 shrink-0 overflow-hidden border sm:w-16 lg:aspect-[295/443] lg:w-full ${
              i === activeIndex ? "border-ink" : "border-transparent"
            }`}
          >
            <img
              src={src}
              alt=""
              width={295}
              height={443}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      <div className="relative order-1 flex-1 overflow-hidden">
        {images[activeIndex] && (
          <img
            key={images[activeIndex]}
            src={images[activeIndex]}
            alt={`${name} — view ${activeIndex + 1}`}
            width={400}
            height={500}
            fetchPriority="high"
            className="aspect-[4/5] w-full object-cover lg:aspect-[45/56]"
          />
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label="Show previous product image"
              className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-paper/90 text-ink shadow-sm transition hover:bg-paper"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label="Show next product image"
              className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-paper/90 text-ink shadow-sm transition hover:bg-paper"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
