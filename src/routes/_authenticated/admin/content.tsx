import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { getAdminSiteContent, updateSiteContent } from "@/lib/content.functions";
import { SiteMedia } from "@/components/SiteMedia";
import { AdminOperationsNav } from "@/components/AdminOperationsNav";
import { ImageUploadField } from "@/components/ImageUploadField";
import { defaultSiteContent, emptyHeroSlide, normalizeHero, type HeroSlide, type InstagramContent, type LookbookContent, type ProductFeature, type SiteContent } from "@/lib/site-content";
import { ProductDetailEditorial } from "@/components/ProductDetailEditorial";


export const Route = createFileRoute("/_authenticated/admin/content")({
  head: () => ({
    meta: [
      { title: "Site Content — MOLD Admin" },
      { name: "description", content: "Edit MOLD campaign and social content" },
      { property: "og:title", content: "Site Content — MOLD Admin" },
      { property: "og:description", content: "Edit MOLD campaign and social content" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContentEditor,
});

type SectionKey = keyof SiteContent;
type PublishState = Record<SectionKey, boolean>;

function Field({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  return (
    <label className="block">
      <span className="label-mono text-muted-ink">{label}</span>
      {multiline ? (
        <Textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="mt-2 rounded-none" />
      ) : (
        <Input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 rounded-none" />
      )}
    </label>
  );
}

function ContentEditor() {
  const queryClient = useQueryClient();
  const loadContent = useServerFn(getAdminSiteContent);
  const saveContent = useServerFn(updateSiteContent);
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [published, setPublished] = useState<PublishState>({ hero: true, lookbook: true, instagram: true, showcase: true });
  const [previewMobile, setPreviewMobile] = useState(false);
  const [message, setMessage] = useState("");

  const { data: rows, isLoading } = useQuery({ queryKey: ["admin-site-content"], queryFn: () => loadContent() });

  useEffect(() => {
    if (!rows) return;
    const next = structuredClone(defaultSiteContent);
    const nextPublished = { hero: true, lookbook: true, instagram: true, showcase: true };
    for (const row of rows) {
      next[row.sectionKey] = row.content as never;
      nextPublished[row.sectionKey] = row.isPublished;
    }
    next.hero = normalizeHero(next.hero);
    next.showcase = { ...defaultSiteContent.showcase, ...next.showcase };
    setContent(next);
    setPublished(nextPublished);
  }, [rows]);

  const save = useMutation({
    mutationFn: async (sectionKey: SectionKey) => saveContent({ data: { sectionKey, content: content[sectionKey], isPublished: published[sectionKey] } }),
    onSuccess: async (_, sectionKey) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["site-content"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-site-content"] }),
      ]);
      setMessage(`${sectionKey[0]?.toUpperCase() ?? ""}${sectionKey.slice(1)} saved.`);
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Unable to save changes."),
  });

  const heroSlides = content.hero.slides ?? [];
  const heroInterval = content.hero.intervalSeconds ?? 6;

  function setHeroSlides(slides: HeroSlide[]) {
    setContent((current) => ({ ...current, hero: { ...current.hero, slides } }));
  }
  function updateSlide<K extends keyof HeroSlide>(index: number, key: K, value: HeroSlide[K]) {
    setHeroSlides(heroSlides.map((slide, i) => (i === index ? { ...slide, [key]: value } : slide)));
  }
  function moveSlide(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= heroSlides.length) return;
    const next = [...heroSlides];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved!);
    setHeroSlides(next);
  }
  function updateLookbook<K extends keyof LookbookContent>(key: K, value: LookbookContent[K]) {
    setContent((current) => ({ ...current, lookbook: { ...current.lookbook, [key]: value } }));
  }
  function updateInstagram<K extends keyof InstagramContent>(key: K, value: InstagramContent[K]) {
    setContent((current) => ({ ...current, instagram: { ...current.instagram, [key]: value } }));
  }
  function updateFeature(index: number, update: (feature: ProductFeature) => ProductFeature) {
    setContent((current) => ({ ...current, showcase: { ...current.showcase, features: current.showcase.features.map((item, i) => i === index ? update(item) : item) } }));
  }
  function moveFeature(index: number, direction: -1 | 1) {
    const features = [...content.showcase.features];
    const target = index + direction;
    if (target < 0 || target >= features.length) return;
    const [feature] = features.splice(index, 1);
    features.splice(target, 0, feature!);
    setContent((current) => ({ ...current, showcase: { ...current.showcase, features } }));
  }
  function sectionHeader(key: SectionKey, title: string, description: string) {
    return (
      <div className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div><span className="label-mono text-accent">{key}</span><h2 className="display mt-2 text-4xl">{title}</h2><p className="mt-2 text-sm text-muted-ink">{description}</p></div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2"><Switch checked={published[key]} onCheckedChange={(checked) => setPublished((current) => ({ ...current, [key]: checked }))} /><span className="label-mono">Published</span></label>
          <Button type="button" onClick={() => save.mutate(key)} disabled={save.isPending} className="rounded-none"><Save /> Save</Button>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><p className="label-mono text-muted-ink">Loading content…</p></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex justify-end">
        <Link to="/admin" className="label-mono border border-line px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-muted-ink transition-colors hover:border-ink hover:bg-muted hover:text-ink">← Back to Admin</Link>
      </div>
      <h1 className="display mt-6 text-5xl sm:text-7xl">Site content</h1>
      <AdminOperationsNav />
      <p className="mt-4 max-w-xl text-sm text-muted-ink">Update the campaign banner, editorial story and Instagram archive shown across the storefront.</p>
      {message && <p className="mt-6 border-l-2 border-accent pl-4 text-sm">{message}</p>}

      <section className="mt-12 border-t border-line pt-8">
        {sectionHeader("hero", "Hero banner slideshow", "The rotating campaign banners customers see first.")}
        <label className="mt-8 block max-w-xs">
          <span className="label-mono text-muted-ink">Seconds per slide</span>
          <Input
            type="number"
            min={1}
            max={60}
            value={heroInterval}
            onChange={(event) =>
              setContent((current) => ({
                ...current,
                hero: { ...current.hero, intervalSeconds: Math.min(60, Math.max(1, Number(event.target.value) || 1)) },
              }))
            }
            className="mt-2 rounded-none"
          />
        </label>

        <div className="mt-10 space-y-10">
          {heroSlides.map((slide, index) => (
            <div key={index} className="border-t border-line pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="label-mono text-accent">Slide {index + 1}</span>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="rounded-none" onClick={() => moveSlide(index, -1)} disabled={index === 0}><ArrowUp /></Button>
                  <Button type="button" variant="outline" size="sm" className="rounded-none" onClick={() => moveSlide(index, 1)} disabled={index === heroSlides.length - 1}><ArrowDown /></Button>
                  <Button type="button" variant="outline" size="sm" className="rounded-none" onClick={() => setHeroSlides(heroSlides.filter((_, i) => i !== index))} disabled={heroSlides.length === 1}><Trash2 /> Remove</Button>
                </div>
              </div>
              <SiteMedia src={slide.image} alt="" className="mt-5 aspect-[16/7] w-full object-cover" />
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <Field label="Eyebrow" value={slide.eyebrow} onChange={(v) => updateSlide(index, "eyebrow", v)} />
                <ImageUploadField label="Slide image or video" value={slide.image} folder="hero" onChange={(v) => updateSlide(index, "image", v)} />
                <Field label="Headline" value={slide.title} onChange={(v) => updateSlide(index, "title", v)} />
                <Field label="Accent headline" value={slide.accent} onChange={(v) => updateSlide(index, "accent", v)} />
                <div className="sm:col-span-2"><Field label="Description" value={slide.description} onChange={(v) => updateSlide(index, "description", v)} multiline /></div>
                <div className="sm:col-span-2"><Field label="Image alt text" value={slide.imageAlt} onChange={(v) => updateSlide(index, "imageAlt", v)} /></div>
                <Field label="Primary button label" value={slide.primaryLabel} onChange={(v) => updateSlide(index, "primaryLabel", v)} />
                <Field label="Primary button link" value={slide.primaryHref} onChange={(v) => updateSlide(index, "primaryHref", v)} />
                <Field label="Secondary button label" value={slide.secondaryLabel} onChange={(v) => updateSlide(index, "secondaryLabel", v)} />
                <Field label="Secondary button link" value={slide.secondaryHref} onChange={(v) => updateSlide(index, "secondaryHref", v)} />
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" className="mt-8 rounded-none" onClick={() => setHeroSlides([...heroSlides, { ...emptyHeroSlide }])}><Plus /> Add slide</Button>
      </section>


      <section className="mt-16 border-t border-line pt-8">
        {sectionHeader("showcase", "Product editorial", "Edit the video, center image, connector and copy for the homepage feature.")}
        <div className="mt-10 border-t border-line pt-6">
          <span className="label-mono text-accent">Editorial composition — video, image and copy</span>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2"><ImageUploadField label="Left-side video (upload a video or paste a URL)" value={content.showcase.detailVideo} folder="showcase-video" onChange={(v) => setContent((c) => ({ ...c, showcase: { ...c.showcase, detailVideo: v } }))} /></div>
            <div className="sm:col-span-2"><ImageUploadField label="Center image" value={content.showcase.image} folder="showcase" onChange={(v) => setContent((c) => ({ ...c, showcase: { ...c.showcase, image: v } }))} /></div>
            <div className="sm:col-span-2"><ImageUploadField label="Hover image (shown on pointer hover)" value={content.showcase.hoverImage} folder="showcase" onChange={(v) => setContent((c) => ({ ...c, showcase: { ...c.showcase, hoverImage: v } }))} /></div>
            <div className="sm:col-span-2"><Field label="Center image alt text" value={content.showcase.imageAlt} onChange={(v) => setContent((c) => ({ ...c, showcase: { ...c.showcase, imageAlt: v } }))} /></div>
            <Field label="Right-side heading" value={content.showcase.detailHeading} onChange={(v) => setContent((c) => ({ ...c, showcase: { ...c.showcase, detailHeading: v } }))} />
            <div className="sm:col-span-2"><Field label="Right-side text" value={content.showcase.detailText} multiline onChange={(v) => setContent((c) => ({ ...c, showcase: { ...c.showcase, detailText: v } }))} /></div>
          </div>
          <div className="mt-6 flex gap-2"><Button type="button" variant={previewMobile ? "outline" : "default"} onClick={() => setPreviewMobile(false)} className="rounded-none"><Monitor /> Desktop</Button><Button type="button" variant={previewMobile ? "default" : "outline"} onClick={() => setPreviewMobile(true)} className="rounded-none"><Smartphone /> Mobile</Button></div>
          <div className={`mt-5 border border-line p-3 sm:p-5 ${previewMobile ? "max-w-sm" : ""}`}>
            <ProductDetailEditorial preview mobile={previewMobile} content={content.showcase} onFeaturePosition={(index, key, value) => updateFeature(index, (feature) => ({ ...feature, [previewMobile ? "mobile" : "desktop"]: { ...feature[previewMobile ? "mobile" : "desktop"], [key]: value } }))} />
            <p className="label-mono mt-3 text-muted-ink">Drag a point or feature label on the center image to position it.</p>
          </div>
          <div className="mt-8 space-y-5">
            {content.showcase.features.map((feature, index) => <div key={index} className="grid gap-4 border-t border-line pt-5 sm:grid-cols-[1fr_auto]"><div className="space-y-4"><Field label={`Image point ${index + 1} description`} value={feature.text} onChange={(v) => updateFeature(index, (current) => ({ ...current, text: v }))} /><div className="flex flex-wrap gap-5"><label className="flex items-center gap-2"><Switch checked={feature.enabled} onCheckedChange={(enabled) => updateFeature(index, (current) => ({ ...current, enabled }))} /><span className="label-mono">Enabled</span></label><label className="flex items-center gap-2"><Switch checked={feature.lineEnabled} onCheckedChange={(lineEnabled) => updateFeature(index, (current) => ({ ...current, lineEnabled }))} /><span className="label-mono">Show point line</span></label></div></div><div className="flex items-start gap-2"><Button type="button" variant="outline" size="sm" className="rounded-none" disabled={index === 0} onClick={() => moveFeature(index, -1)}><ArrowUp /></Button><Button type="button" variant="outline" size="sm" className="rounded-none" disabled={index === content.showcase.features.length - 1} onClick={() => moveFeature(index, 1)}><ArrowDown /></Button><Button type="button" variant="outline" className="rounded-none" onClick={() => setContent((c) => ({ ...c, showcase: { ...c.showcase, features: c.showcase.features.filter((_, i) => i !== index) } }))}><Trash2 /> Remove</Button></div></div>)}
          </div>
          <Button type="button" variant="outline" className="mt-6 rounded-none" onClick={() => setContent((c) => ({ ...c, showcase: { ...c.showcase, features: [...c.showcase.features, { text: "New product detail", enabled: true, lineEnabled: true, desktop: { x: 50, y: 50, tx: 76, ty: 50 }, mobile: { x: 50, y: 50, tx: 76, ty: 50 } }] } }))}><Plus /> Add image point</Button>
        </div>
      </section>

      <section className="mt-16 border-t border-line pt-8">
        {sectionHeader("lookbook", "Editorial lookbook", "The campaign story and three-image editorial sequence.")}
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Field label="Eyebrow" value={content.lookbook.eyebrow} onChange={(v) => updateLookbook("eyebrow", v)} />
          <Field label="Season" value={content.lookbook.season} onChange={(v) => updateLookbook("season", v)} />
          <div className="sm:col-span-2"><Field label="Title" value={content.lookbook.title} onChange={(v) => updateLookbook("title", v)} /></div>
          <div className="sm:col-span-2"><Field label="Introduction" value={content.lookbook.intro} onChange={(v) => updateLookbook("intro", v)} multiline /></div>
          <Field label="Story title" value={content.lookbook.storyTitle} onChange={(v) => updateLookbook("storyTitle", v)} />
          <Field label="Button label" value={content.lookbook.ctaLabel} onChange={(v) => updateLookbook("ctaLabel", v)} />
          <div className="sm:col-span-2"><Field label="Story" value={content.lookbook.storyBody} onChange={(v) => updateLookbook("storyBody", v)} multiline /></div>
        </div>
        <div className="mt-10 space-y-8">
          {content.lookbook.images.map((image, index) => (
            <div key={index} className="grid gap-5 border-t border-line pt-6 sm:grid-cols-[180px_1fr]">
              <SiteMedia src={image.url} alt="" className="aspect-[4/5] w-full object-cover" />
              <div className="grid gap-5 sm:grid-cols-2">
                <ImageUploadField label={`Image or video ${index + 1}`} value={image.url} folder="lookbook" onChange={(v) => updateLookbook("images", content.lookbook.images.map((item, i) => i === index ? { ...item, url: v } : item))} />
                <Field label="Caption" value={image.caption} onChange={(v) => updateLookbook("images", content.lookbook.images.map((item, i) => i === index ? { ...item, caption: v } : item))} />
                <div className="sm:col-span-2"><Field label="Alt text" value={image.alt} onChange={(v) => updateLookbook("images", content.lookbook.images.map((item, i) => i === index ? { ...item, alt: v } : item))} /></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 border-t border-line pt-8">
        {sectionHeader("instagram", "Instagram feed", "A curated social archive with editable post links.")}
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Field label="Eyebrow" value={content.instagram.eyebrow} onChange={(v) => updateInstagram("eyebrow", v)} />
          <Field label="Title" value={content.instagram.title} onChange={(v) => updateInstagram("title", v)} />
          <Field label="Handle" value={content.instagram.handle} onChange={(v) => updateInstagram("handle", v)} />
          <Field label="Profile URL" value={content.instagram.profileUrl} onChange={(v) => updateInstagram("profileUrl", v)} />
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {content.instagram.posts.map((post, index) => (
            <div key={index} className="border-t border-line pt-5">
              <SiteMedia src={post.image} alt={post.alt || post.caption} className="aspect-[4/5] w-full object-cover" />
              <div className="mt-5 space-y-4">
                <ImageUploadField label="Post image or video" value={post.image} folder="instagram" onChange={(v) => updateInstagram("posts", content.instagram.posts.map((item, i) => i === index ? { ...item, image: v } : item))} />
                <Field label="Caption" value={post.caption} onChange={(v) => updateInstagram("posts", content.instagram.posts.map((item, i) => i === index ? { ...item, caption: v } : item))} />
                <Field label="Alt text" value={post.alt} onChange={(v) => updateInstagram("posts", content.instagram.posts.map((item, i) => i === index ? { ...item, alt: v } : item))} />
                <label className="block"><span className="label-mono text-muted-ink">Direct Instagram post or reel URL</span><Input type="url" value={post.url} placeholder="https://www.instagram.com/p/... or /reel/..." onChange={(event) => updateInstagram("posts", content.instagram.posts.map((item, i) => i === index ? { ...item, url: event.target.value } : item))} className="mt-2 rounded-none" /><span className="label-mono mt-2 block text-muted-ink">Customers open this exact post or reel when they select the image.</span></label>
                <Button type="button" variant="outline" onClick={() => updateInstagram("posts", content.instagram.posts.filter((_, i) => i !== index))} className="rounded-none"><Trash2 /> Remove post</Button>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={() => updateInstagram("posts", [...content.instagram.posts, { image: "", alt: "", caption: "", url: "" }])} className="mt-8 rounded-none"><Plus /> Add Instagram post or reel</Button>
      </section>
    </div>
  );
}
