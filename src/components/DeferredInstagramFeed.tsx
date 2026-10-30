import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { InstagramContent } from "@/lib/site-content";

const InstagramFeed = lazy(() => import("@/components/InstagramFeed").then((module) => ({ default: module.InstagramFeed })));

export function DeferredInstagramFeed({ content }: { content: InstagramContent }) {
  const slotRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setShouldLoad(true);
      observer.disconnect();
    }, { rootMargin: "300px" });
    observer.observe(slot);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={slotRef} className="min-h-[28rem] bg-ink">
      {shouldLoad && <Suspense fallback={null}><InstagramFeed content={content} /></Suspense>}
    </div>
  );
}
