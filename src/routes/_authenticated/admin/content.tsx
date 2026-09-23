import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { getAdminSiteContent, updateSiteContent } from "@/lib/content.functions";
import { SiteMedia } from "@/components/SiteMedia";
import { AdminOperationsNav } from "@/components/AdminOperationsNav";
import { ImageUploadField } from "@/components/ImageUploadField";
import { defaultSiteContent, emptyHeroSlide, normalizeHero, type HeroSlide, type InstagramContent, type LookbookContent, type SiteContent } from "@/lib/site-content";


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
  const [published, setPublished] = useState<PublishState>({ hero: true, lookbook: true, instagram: true });
  const [message, setMessage] = useState("");

  const { data: rows, isLoading } = useQuery({ queryKey: ["admin-site-content"], queryFn: () => loadContent() });

  useEffect(() => {
    if (!rows) return;
    const next = structuredClone(defaultSiteContent);
    const nextPublished = { hero: true, lookbook: true, instagram: true };
    for (const row of rows) {
      next[row.sectionKey] = row.content as never;
      nextPublished[row.sectionKey] = row.isPublished;
    }
    next.hero = normalizeHero(next.hero);
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
              <SiteMedia src={post.image} alt="" className="aspect-square w-full object-cover" />
              <div className="mt-5 space-y-4">
                <ImageUploadField label="Post image or video" value={post.image} folder="instagram" onChange={(v) => updateInstagram("posts", content.instagram.posts.map((item, i) => i === index ? { ...item, image: v } : item))} />
                <Field label="Caption" value={post.caption} onChange={(v) => updateInstagram("posts", content.instagram.posts.map((item, i) => i === index ? { ...item, caption: v } : item))} />
                <Field label="Alt text" value={post.alt} onChange={(v) => updateInstagram("posts", content.instagram.posts.map((item, i) => i === index ? { ...item, alt: v } : item))} />
                <Field label="Post URL" value={post.url} onChange={(v) => updateInstagram("posts", content.instagram.posts.map((item, i) => i === index ? { ...item, url: v } : item))} />
                <Button type="button" variant="outline" onClick={() => updateInstagram("posts", content.instagram.posts.filter((_, i) => i !== index))} className="rounded-none"><Trash2 /> Remove post</Button>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={() => updateInstagram("posts", [...content.instagram.posts, { image: "/editorial/mold-hero.jpg", alt: "MOLD lifestyle image", caption: "New post", url: content.instagram.profileUrl }])} className="mt-8 rounded-none"><Plus /> Add post</Button>
      </section>
    </div>
  );
}
