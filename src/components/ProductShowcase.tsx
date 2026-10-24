import { SiteMedia } from "@/components/SiteMedia";
import type { ProductShowcaseContent } from "@/lib/site-content";

export function ProductShowcase({ content, preview = false, mobile = false, onPosition }: { content: ProductShowcaseContent; preview?: boolean; mobile?: boolean; onPosition?: (index: number, key: "x" | "y" | "tx" | "ty", value: number) => void }) {
  function drag(event: React.PointerEvent, index: number, target: "point" | "text") {
    if (!preview || !onPosition) return;
    event.preventDefault();
    const stage = event.currentTarget.closest("[data-stage]") as HTMLElement;
    const rect = stage.getBoundingClientRect();
    const move = (e: PointerEvent) => {
      const posX = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
      const posY = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));
      onPosition(index, target === "point" ? "x" : "tx", posX);
      onPosition(index, target === "point" ? "y" : "ty", posY);
    };
    const done = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", done); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", done, { once: true });
  }
  return <section className="bg-paper py-16 sm:py-24">
    <div className="mx-auto max-w-[1500px] px-4 sm:px-6">
      <div className="mb-8 flex items-end justify-end border-b border-black/15 pb-4"><h2 className="display section-heading text-right">{content.heading}</h2></div>
      <div data-stage className={`relative mx-auto w-full max-w-5xl overflow-hidden bg-secondary ${mobile ? "aspect-[4/5]" : "aspect-[5/4] sm:aspect-[16/10]"}`}>
        <SiteMedia src={content.image} alt={content.imageAlt} className="absolute inset-0 h-full w-full object-cover" />
        <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          {content.features.map((item, i) => { const p = item[mobile ? "mobile" : "desktop"]; return item.enabled && item.lineEnabled ? <g key={i}><line x1={`${p.x}%`} y1={`${p.y}%`} x2={`${p.tx}%`} y2={`${p.ty}%`} stroke="currentColor" strokeOpacity=".65" strokeWidth="1" /><circle cx={`${p.x}%`} cy={`${p.y}%`} r="3" fill="currentColor" /></g> : null; })}
        </svg>
        {content.features.map((item, i) => { const p = item[mobile ? "mobile" : "desktop"]; return item.enabled ? <div key={i} style={{ left: `${p.tx}%`, top: `${p.ty}%` }} onPointerDown={(e) => drag(e, i, "text")} className={`absolute z-10 max-w-40 -translate-y-1/2 ${preview ? "cursor-move bg-paper/90 p-2" : ""}`}><span className="label-mono block text-[9px] leading-relaxed sm:text-[10px]">{item.text}</span></div> : null; })}
        {preview && content.features.map((item, i) => { const p = item[mobile ? "mobile" : "desktop"]; return item.enabled ? <button key={`p${i}`} type="button" aria-label={`Move endpoint for ${item.text}`} style={{ left: `${p.x}%`, top: `${p.y}%` }} onPointerDown={(e) => drag(e, i, "point")} className="absolute z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border border-black bg-white/70" /> : null; })}
      </div>
      {preview && <p className="label-mono mt-3 text-muted-ink">Drag text or endpoint to position · {mobile ? "Mobile" : "Desktop"} preview</p>}
    </div>
  </section>;
}
