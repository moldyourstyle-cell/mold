import { ExternalLink } from "lucide-react";
import { SiteMedia } from "@/components/SiteMedia";
import type { InstagramContent } from "@/lib/site-content";


export function InstagramFeed({ content }: { content: InstagramContent }) {
  return (
    <section className="bg-ink py-16 text-paper sm:py-24">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6">
        <div className="flex flex-col gap-5 border-t border-paper/20 pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="label-mono text-paper/50">{content.eyebrow}</span>
            <h2 className="display mt-3 text-[clamp(3rem,8vw,7rem)]">{content.title}</h2>
          </div>
          <a href={content.profileUrl} target="_blank" rel="noreferrer" className="label-mono flex items-center gap-2 text-accent hover:text-paper">
            {content.handle} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-px bg-paper/20 lg:grid-cols-4">
          {content.posts.map((post, index) => (
            <a key={`${post.image}-${index}`} href={post.url} target="_blank" rel="noreferrer" className="group relative overflow-hidden bg-ink">
              <SiteMedia src={post.image} alt={post.alt} className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.03] group-hover:opacity-75" />
              <div className="absolute inset-x-0 bottom-0 translate-y-full bg-ink/90 p-4 transition-transform duration-300 group-hover:translate-y-0">
                <span className="label-mono text-paper">{post.caption}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}