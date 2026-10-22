import { SiteMedia } from "@/components/SiteMedia";
import type { ProductShowcaseContent } from "@/lib/site-content";

export function ProductDetailEditorial({ content, preview = false, mobile = false, onFeaturePosition }: { content: ProductShowcaseContent; preview?: boolean; mobile?: boolean; onFeaturePosition?: (index: number, key: "x" | "y" | "tx" | "ty", value: number) => void }) {
  function dragFeature(event: React.PointerEvent<HTMLElement>, index: number, target: "point" | "text") {
    if (!preview || !onFeaturePosition) return;
    event.preventDefault();
    const stage = event.currentTarget.closest("[data-image-stage]") as HTMLElement;
    const rect = stage.getBoundingClientRect();
    const move = (e: PointerEvent) => {
      const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));
      onFeaturePosition(index, target === "point" ? "x" : "tx", x);
      onFeaturePosition(index, target === "point" ? "y" : "ty", y);
    };
    const done = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", done); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", done, { once: true });
  }
  return (
    <section className={`${preview ? "my-20" : "my-0"} border-y border-line py-10 sm:py-14`}>
      <div className="mx-auto grid max-w-[1300px] grid-cols-2 items-center gap-x-4 gap-y-8 px-4 sm:px-6 md:gap-x-6 md:gap-y-10 lg:grid-cols-[1fr_1fr_0.9fr] lg:gap-8 xl:gap-12">
        <figure className="relative aspect-[4/5] overflow-hidden bg-secondary">
          <SiteMedia src={content.detailVideo || "/editorial/mold-look-3.jpg"} alt="MOLD editorial film" className="h-full w-full object-cover" />
          <figcaption className="label-mono absolute bottom-4 left-4 text-paper drop-shadow">MOLD — IN MOTION</figcaption>
        </figure>
        <figure className="relative aspect-[4/5] bg-secondary">
          <div data-image-stage className="group relative h-full w-full overflow-hidden">
            <SiteMedia src={content.image} alt={content.imageAlt} className="absolute inset-0 h-full w-full object-cover" />
            {content.hoverImage && <SiteMedia src={content.hoverImage} alt={`${content.imageAlt} — alternate view`} className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100 group-focus-within:opacity-100" />}
            {(preview ? [mobile] : [false, true]).map((isMobile) => <div key={String(isMobile)} className={preview ? "" : isMobile ? "lg:hidden" : "hidden lg:block"}>
              <svg className="absolute inset-0 h-full w-full" aria-hidden="true">{content.features.map((item, i) => { const p = item[isMobile ? "mobile" : "desktop"]; return item.enabled && item.lineEnabled ? <g key={i}><line x1={`${p.x}%`} y1={`${p.y}%`} x2={`${p.tx}%`} y2={`${p.ty}%`} stroke="currentColor" strokeOpacity=".8" strokeWidth="1" /><circle cx={`${p.x}%`} cy={`${p.y}%`} r="3" fill="currentColor" /></g> : null; })}</svg>
              {content.features.map((item, i) => { const p = item[isMobile ? "mobile" : "desktop"]; return item.enabled ? <span key={`label-${i}`} style={{ left: `${p.tx}%`, top: `${p.ty}%` }} onPointerDown={(e) => dragFeature(e, i, "text")} className={`absolute z-10 -translate-y-1/2 text-ink ${preview ? "cursor-move bg-paper/90 p-2" : "bg-paper/75 px-1.5 py-1"}`}><span className="label-mono block max-w-32 text-[8px] leading-relaxed sm:text-[9px]">{item.text}</span></span> : null; })}
              {preview && content.features.map((item, i) => { const p = item[isMobile ? "mobile" : "desktop"]; return item.enabled ? <button key={`point-${i}`} type="button" aria-label={`Move image point for ${item.text}`} style={{ left: `${p.x}%`, top: `${p.y}%` }} onPointerDown={(e) => dragFeature(e, i, "point")} className="absolute z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border border-ink bg-paper/80" /> : null; })}
            </div>)}
          </div>
        </figure>
        <div className="relative col-span-2 py-2 md:px-4 md:py-0 lg:col-span-1 lg:pl-3 lg:px-0">
          <span className="label-mono text-muted-ink">MOLD — EDITORIAL</span>
          <h2 className="display mt-4 text-[clamp(2.25rem,4vw,4rem)]">{content.detailHeading}</h2>
          <p className="mt-6 max-w-[34ch] text-sm leading-7 text-muted-ink">{content.detailText}</p>
        </div>
      </div>
    </section>
  );
}
